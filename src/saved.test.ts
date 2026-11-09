/**
 * Tests for src/saved.ts: the Saved repos list of docs/SPEC.md 3.14. The
 * storage is passed in; every owner, repo and token here is made up.
 */
import {
  CANNOT_SAVE_MESSAGE,
  createSavedStore,
  displayText,
  FULL_MESSAGE,
  isSavedBranch,
  isSavedName,
  MAX_SAVED,
  NOT_SAVED_MESSAGE,
  readSaved,
  removeLabel,
  SAVED_KEY,
  type SavedRepo,
  savedKey,
} from "./saved";
import { createTokenStore, type TokenStorage } from "./token";

const TOKEN = "github_pat_TEST_saved_abcd1234";

/** One storage that several stores share, with a log of the writes. */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const writes: { key: string; value: string | null }[] = [];
  const storage: TokenStorage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      writes.push({ key: k, value: v });
      data.set(k, v);
    },
    removeItem: (k) => {
      writes.push({ key: k, value: null });
      data.delete(k);
    },
  };
  return { storage, data, writes };
}

const entry = (owner: string, repo: string, branch: string | null = null): SavedRepo => ({
  owner,
  repo,
  branch,
});
const stored = (repos: unknown[]) => JSON.stringify({ repos });
const parsedValue = (data: Map<string, string>) => JSON.parse(data.get(SAVED_KEY) ?? "null");

describe("the entry rules (3.14)", () => {
  test("owners and repos follow 3.1's name rule, at most 100 characters", () => {
    for (const ok of ["acme", "a", "A.b_c-9", "__proto__", "x".repeat(100)]) {
      expect(isSavedName(ok)).toBe(true);
    }
    for (const bad of ["", ".", "..", "a b", "a/b", "a@b", "a!b", "å", "<img>", "x".repeat(101)]) {
      expect(isSavedName(bad)).toBe(false);
    }
  });

  test("a branch is null or 1 to 255 characters, with no # or %", () => {
    expect(isSavedBranch(null)).toBe(true);
    expect(isSavedBranch("main")).toBe(true);
    expect(isSavedBranch("b".repeat(255))).toBe(true);
    expect(isSavedBranch("")).toBe(false);
    expect(isSavedBranch("b".repeat(256))).toBe(false);
    expect(isSavedBranch("a#b")).toBe(false);
    expect(isSavedBranch("50%")).toBe(false);
    expect(isSavedBranch(undefined)).toBe(false);
    expect(isSavedBranch(3)).toBe(false);
  });

  // Each refused here is refused by `git check-ref-format --branch` (git 2.43.0, 2026-11-09).
  test.each([
    "a\u0000b",
    "a\u001fb",
    "a\u007fb",
    "a\tb",
    "a b",
    "a~b",
    "a^b",
    "a:b",
    "a?b",
    "a*b",
    "a[b",
    "a\\b",
    "a..b",
    "a@{b",
    "a//b",
    "/a",
    "a/",
    "a.",
    ".a",
    "a/.b",
    "a.lock",
    "a/b.lock/c",
  ])("the branch rule refuses %j, as git does", (name) => {
    expect(isSavedBranch(name)).toBe(false);
  });

  test.each(["<img/src=x/onerror=alert(1)>", "a=b", "feature/x", "fix-å", "a@b", "null"])(
    "the branch rule accepts %j, as git does",
    (name) => {
      expect(isSavedBranch(name)).toBe(true);
    },
  );
});

describe("reading a stored value (3.14)", () => {
  test("not JSON, an array, no repos, repos not an array, and null: no entries", () => {
    for (const raw of [
      null,
      "",
      "not json",
      "[]",
      "{}",
      '{"repos": {}}',
      '{"repos": "x"}',
      "null",
    ]) {
      expect(readSaved(raw)).toEqual([]);
    }
  });

  test("an entry that is not an object, or has a bad or missing field, is dropped", () => {
    const raw = stored([
      "acme/widgets",
      null,
      [],
      { owner: "acme", repo: "ok" },
      { owner: "ac me", repo: "x", branch: null },
      { owner: "acme", repo: "<b>", branch: null },
      { owner: "acme", repo: "x", branch: "a#b" },
      { owner: "acme", repo: "x", branch: 5 },
      { owner: 1, repo: "x", branch: null },
      { owner: "acme", repo: "good", branch: "dev" },
    ]);
    expect(readSaved(raw)).toEqual([entry("acme", "good", "dev")]);
  });

  test("keys other than the three are not kept", () => {
    const raw = stored([{ owner: "acme", repo: "w", branch: null, token: TOKEN, private: true }]);
    expect(readSaved(raw)).toEqual([entry("acme", "w")]);
    expect(Object.keys(readSaved(raw)[0] ?? {})).toEqual(["owner", "repo", "branch"]);
  });

  test("entries past the 50th are dropped", () => {
    const repos = Array.from({ length: 60 }, (_, i) => entry("acme", `r${i}`));
    const read = readSaved(stored(repos));
    expect(read).toHaveLength(MAX_SAVED);
    expect(read[49]).toEqual(entry("acme", "r49"));
  });

  test("a top-level __proto__ key is ignored, and an inherited repos is not read", () => {
    expect(readSaved('{"__proto__": {"repos": [{"owner":"a","repo":"b","branch":null}]}}')).toEqual(
      [],
    );
    expect(
      readSaved(
        '{"__proto__": {"x": 1}, "repos": [{"owner":"a","repo":"b","branch":null}], "other": 2}',
      ),
    ).toEqual([entry("a", "b")]);
  });

  test("an entry's fields are read as own properties only", () => {
    const raw = '{"repos": [{"__proto__": {"owner": "a", "repo": "b", "branch": null}}]}';
    expect(readSaved(raw)).toEqual([]);
  });

  test("owners and repos named like Object's own properties are read as names", () => {
    const names = ["__proto__", "constructor", "toString", "hasOwnProperty"];
    const repos = names.map((n) => entry(n, n));
    expect(readSaved(stored(repos))).toEqual(repos);
  });
});

describe("one entry per reference (3.14)", () => {
  test("the key: owner and repo in lower case, then @ and the branch as written, or ! for null", () => {
    expect(savedKey(entry("Acme", "Widgets", "Main"))).toBe("acme/widgets@Main");
    expect(savedKey(entry("acme", "widgets"))).toBe("acme/widgets!");
  });

  test("owner and repo without regard to case, the branch exactly, null only with null; the first kept", () => {
    const raw = stored([
      entry("Acme", "Widgets", "main"),
      entry("acme", "widgets", "main"),
      entry("acme", "widgets", "Main"),
      entry("acme", "widgets"),
      entry("ACME", "WIDGETS"),
      entry("acme", "widgets", "null"),
    ]);
    expect(readSaved(raw)).toEqual([
      entry("Acme", "Widgets", "main"),
      entry("acme", "widgets", "Main"),
      entry("acme", "widgets"),
      entry("acme", "widgets", "null"),
    ]);
  });
});

describe("the store (3.14)", () => {
  test("adds an entry first, with the owner in lower case, and writes only the three keys", () => {
    const { storage, data } = memoryStorage();
    const store = createSavedStore(storage);
    expect(store.add(entry("acme", "one"))).toEqual({ ok: true });
    expect(store.add(entry("Acme", "Two", "dev"))).toEqual({ ok: true });
    expect(parsedValue(data)).toEqual({
      repos: [
        { owner: "acme", repo: "Two", branch: "dev" },
        { owner: "acme", repo: "one", branch: null },
      ],
    });
    expect(store.entries()).toEqual([entry("acme", "Two", "dev"), entry("acme", "one")]);
  });

  test("an entry already there: no change, nothing written", () => {
    const { storage, writes } = memoryStorage();
    const store = createSavedStore(storage);
    store.add(entry("acme", "w"));
    const before = writes.length;
    expect(store.add(entry("ACME", "W"))).toEqual({ ok: true });
    expect(writes).toHaveLength(before);
    expect(store.has(entry("Acme", "w"))).toBe(true);
    expect(store.has(entry("acme", "w", "main"))).toBe(false);
  });

  test("with 50 entries a new one is refused, and nothing is written", () => {
    const repos = Array.from({ length: 50 }, (_, i) => entry("acme", `r${i}`));
    const { storage, writes } = memoryStorage({ [SAVED_KEY]: stored(repos) });
    const store = createSavedStore(storage);
    expect(store.add(entry("acme", "new"))).toEqual({ ok: false, message: FULL_MESSAGE });
    expect(writes).toEqual([]);
    // One already there is not a new one.
    expect(store.add(entry("acme", "r3"))).toEqual({ ok: true });
  });

  test("a reference that breaks the rules is not saved", () => {
    const { storage, writes } = memoryStorage();
    const store = createSavedStore(storage);
    expect(store.add(entry("acme", "w", "a#b"))).toEqual({
      ok: false,
      message: CANNOT_SAVE_MESSAGE,
    });
    expect(store.add(entry("ac me", "w"))).toEqual({ ok: false, message: CANNOT_SAVE_MESSAGE });
    expect(writes).toEqual([]);
  });

  test("removes one entry; the key is removed when the last goes", () => {
    const { storage, data } = memoryStorage();
    const store = createSavedStore(storage);
    store.add(entry("acme", "a"));
    store.add(entry("acme", "b"));
    expect(store.remove(entry("ACME", "A"))).toBe(true);
    expect(store.entries()).toEqual([entry("acme", "b")]);
    expect(store.remove(entry("acme", "b", "main"))).toBe(false);
    expect(store.remove(entry("acme", "b"))).toBe(true);
    expect(data.has(SAVED_KEY)).toBe(false);
  });

  test("owners and repos named like Object's own properties are saved, found and removed; nothing found when not saved", () => {
    const { storage } = memoryStorage();
    const store = createSavedStore(storage);
    const names = ["__proto__", "constructor", "toString", "hasOwnProperty"];
    for (const n of names) expect(store.has(entry(n, n))).toBe(false);
    for (const n of names) expect(store.add(entry(n, n))).toEqual({ ok: true });
    for (const n of names) expect(store.has(entry(n, n))).toBe(true);
    expect(store.entries().map((e) => e.repo)).toEqual([...names].reverse());
    for (const n of names) expect(store.remove(entry(n, n))).toBe(true);
    expect(store.entries()).toEqual([]);
  });

  test("the written value holds no token, also when a token store on the same storage holds one", () => {
    const { storage, data } = memoryStorage();
    const tokens = createTokenStore(storage);
    tokens.use("acme", TOKEN, true);
    const store = createSavedStore(storage);
    store.add(entry("acme", "secret"));
    expect(data.get(SAVED_KEY)).not.toContain("github_pat_");
    expect(data.get("vizi.githubTokens")).toContain(TOKEN);
  });

  test("two stores on one storage, interleaved: every write starts from what is stored", () => {
    const { storage } = memoryStorage();
    const a = createSavedStore(storage);
    const b = createSavedStore(storage);
    // B drew its list before A's write.
    expect(b.entries()).toEqual([]);
    a.add(entry("acme", "x"));
    b.add(entry("acme", "y"));
    expect(a.entries()).toEqual([entry("acme", "y"), entry("acme", "x")]);
    a.remove(entry("acme", "x"));
    b.add(entry("acme", "z"));
    expect(b.entries()).toEqual([entry("acme", "z"), entry("acme", "y")]);
  });

  test("storage that throws on writing: nothing saved, the refusal returned", () => {
    const { storage, data } = memoryStorage();
    const store = createSavedStore({
      ...storage,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    expect(store.add(entry("acme", "w"))).toEqual({ ok: false, message: NOT_SAVED_MESSAGE });
    expect(data.has(SAVED_KEY)).toBe(false);
  });

  test("no storage at all: nothing saved, the refusal returned, no entries", () => {
    const store = createSavedStore(null);
    expect(store.add(entry("acme", "w"))).toEqual({ ok: false, message: NOT_SAVED_MESSAGE });
    expect(store.entries()).toEqual([]);
    expect(store.remove(entry("acme", "w"))).toBe(false);
    expect(() => store.start()).not.toThrow();
  });

  test("a storage whose getItem throws: no entries, and nothing written", () => {
    const { storage, writes } = memoryStorage({ [SAVED_KEY]: stored([entry("acme", "w")]) });
    const store = createSavedStore({
      ...storage,
      getItem: () => {
        throw new Error("SecurityError");
      },
    });
    store.start();
    expect(store.entries()).toEqual([]);
    expect(store.add(entry("acme", "x"))).toEqual({ ok: false, message: NOT_SAVED_MESSAGE });
    expect(store.remove(entry("acme", "w"))).toBe(false);
    expect(writes).toEqual([]);
  });
});

describe("at startup (3.14, Cleaning)", () => {
  test("a value that is not JSON, or not of the form, is removed", () => {
    for (const raw of ["not json", "[1]", '{"repos": 3}', "{}"]) {
      const { storage, data } = memoryStorage({ [SAVED_KEY]: raw });
      createSavedStore(storage).start();
      expect(data.has(SAVED_KEY)).toBe(false);
    }
  });

  test("a value that cleaning changes is written back cleaned; one with no entry left is removed", () => {
    const planted = stored([
      { owner: "acme", repo: "w", branch: null, extra: 1 },
      { owner: "acme", repo: "<img src=x>", branch: null },
      { owner: "ACME", repo: "W", branch: null },
    ]);
    const { storage, data } = memoryStorage({ [SAVED_KEY]: planted });
    createSavedStore(storage).start();
    expect(parsedValue(data)).toEqual({ repos: [{ owner: "acme", repo: "w", branch: null }] });

    const empty = memoryStorage({ [SAVED_KEY]: stored([{ owner: "a b", repo: "c" }]) });
    createSavedStore(empty.storage).start();
    expect(empty.data.has(SAVED_KEY)).toBe(false);
  });

  test("a value already clean is not written", () => {
    const { storage, writes } = memoryStorage();
    const store = createSavedStore(storage);
    store.add(entry("acme", "w"));
    const before = writes.length;
    createSavedStore(storage).start();
    expect(writes).toHaveLength(before);
  });

  test("nothing stored: nothing written", () => {
    const { storage, writes } = memoryStorage();
    createSavedStore(storage).start();
    expect(writes).toEqual([]);
  });
});

describe("the display text and the × name (3.14)", () => {
  test("without and with a branch", () => {
    expect(displayText(entry("acme", "widgets"))).toBe("acme/widgets");
    expect(displayText(entry("acme", "widgets", "feat/x"))).toBe("acme/widgets (feat/x)");
    expect(removeLabel(entry("acme", "widgets"))).toBe("Remove acme/widgets from Saved repos");
    expect(removeLabel(entry("acme", "widgets", "feat/x"))).toBe(
      "Remove acme/widgets (feat/x) from Saved repos",
    );
  });
});
