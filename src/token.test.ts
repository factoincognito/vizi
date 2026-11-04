/**
 * Tests for src/token.ts: the saved tokens, one per owner, of docs/SPEC.md
 * 3.8. The storage is passed in; every token here is an obviously fake value.
 */
import {
  createTokenStore,
  maskToken,
  OLD_TOKEN_KEY,
  parseOwner,
  parseToken,
  type StorageOutcome,
  TOKENS_KEY,
  type TokenStorage,
} from "./token";

const T1 = "github_pat_TEST_one_abcd1234";
const T2 = "github_pat_TEST_two_wxyz9876";
const T3 = "github_pat_TEST_three_qrst5555";

type Write = { from: string; key: string | null; oldValue: string | null; newValue: string | null };

/** One storage that several stores share; every change is logged as the `storage` event other tabs would get. */
function sharedStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const log: Write[] = [];
  const view = (from: string): TokenStorage => ({
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      log.push({ from, key: k, oldValue: data.get(k) ?? null, newValue: v });
      data.set(k, v);
    },
    removeItem: (k) => {
      if (!data.has(k)) return;
      log.push({ from, key: k, oldValue: data.get(k) ?? null, newValue: null });
      data.delete(k);
    },
  });
  return { data, log, view };
}

function memoryStorage(initial: Record<string, string> = {}) {
  const s = sharedStorage(initial);
  return { storage: s.view("only"), data: s.data, log: s.log };
}

/** Hands the logged events of other stores to a store, in order, as a browser would. */
function deliver(
  store: ReturnType<typeof createTokenStore>,
  log: Write[],
  to: string,
  from = 0,
  until = log.length,
) {
  const outcomes: StorageOutcome[] = [];
  for (const w of log.slice(from, until)) {
    if (w.from !== to) outcomes.push(store.onStorage(w.key, w.oldValue, w.newValue));
  }
  return outcomes;
}

const json = (tokens: Record<string, string>, forgot: string[] = []) =>
  JSON.stringify({ tokens, forgot });
const stored = (data: Map<string, string>) => JSON.parse(data.get(TOKENS_KEY) ?? "null");

describe("parseToken: the rule ^github_pat_[A-Za-z0-9_]+$ after trimming", () => {
  it("accepts a fine-grained token and trims the paste", () => {
    expect(parseToken(T1)).toBe(T1);
    expect(parseToken(`  ${T1}\n`)).toBe(T1);
    expect(parseToken("\tgithub_pat_A\r\n")).toBe("github_pat_A");
  });

  it.each([
    ["empty", ""],
    ["blank", "   "],
    ["the prefix alone", "github_pat_"],
    ["a classic token", "ghp_TESTabcdefghijklmnopqrstuvwxyz0123456789"],
    ["another prefix", "gho_TEST123"],
    ["no prefix", "TEST_abcd1234"],
    ["a space inside", "github_pat_TEST abcd"],
    ["a line break inside", "github_pat_TEST\nabcd"],
    ["a tab inside", "github_pat_TEST\tabcd"],
    ["a hyphen", "github_pat_TEST-abcd"],
    ["a non-ASCII letter", "github_pat_TESTå"],
    ["a quote", 'github_pat_TEST"x'],
    ["a colon", "github_pat_TEST:x"],
    ["the prefix in capitals", "GITHUB_PAT_TEST"],
    ["two tokens", `${T1} ${T2}`],
    ["a header injection", "github_pat_TEST\r\nX-Evil: 1"],
  ])("refuses %s", (_name, input) => {
    expect(parseToken(input)).toBeNull();
  });
});

describe("maskToken", () => {
  it("shows github_pat_… and the last four characters, nothing else", () => {
    expect(maskToken(T1)).toBe("github_pat_…1234");
    expect(maskToken(T2)).toBe("github_pat_…9876");
    expect(maskToken(T1)).not.toContain("TEST");
  });
});

describe("parseOwner: the owner part of an address, in lower case", () => {
  it("accepts letters, digits, dot, underscore and hyphen, trims, and lower-cases", () => {
    expect(parseOwner("Acme")).toBe("acme");
    expect(parseOwner("  Fomo-T_1.x \n")).toBe("fomo-t_1.x");
  });

  it.each([
    ["empty", ""],
    ["blank", "  "],
    ["a dot", "."],
    ["two dots", ".."],
    ["a slash", "acme/widgets"],
    ["a space inside", "ac me"],
    ["a non-ASCII letter", "åcme"],
    ["a colon", "acme:x"],
  ])("refuses %s", (_name, input) => {
    expect(parseOwner(input)).toBeNull();
  });
});

describe("the token store: one token per owner, in memory by default", () => {
  it("holds tokens for two owners, writes nothing, and finds each by its owner without regard to case", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    expect(store.tokenFor("acme")).toBeNull();
    expect(store.use("Acme", T1, false)).toEqual({ ok: true, saved: false });
    expect(store.use("fomo-t", T2, false)).toEqual({ ok: true, saved: false });
    expect(store.tokenFor("ACME")).toBe(T1);
    expect(store.tokenFor("acme")).toBe(T1);
    expect(store.tokenFor("fomo-t")).toBe(T2);
    expect(store.tokenFor("other")).toBeNull();
    expect(store.owners()).toEqual(["acme", "fomo-t"]);
    expect(store.isSaved("acme")).toBe(false);
    expect(data.size).toBe(0);
  });

  it("a token used for an owner that has one replaces it", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, false);
    store.use("ACME", T2, false);
    expect(store.tokenFor("acme")).toBe(T2);
    expect(store.owners()).toEqual(["acme"]);
  });

  it("a new store (a reload) does not find a token that was not remembered", () => {
    const { storage } = memoryStorage();
    createTokenStore(storage).use("acme", T1, false);
    const reloaded = createTokenStore(storage);
    reloaded.start();
    expect(reloaded.tokenFor("acme")).toBeNull();
  });

  it("refuses a bad token or a bad owner, keeps nothing, and the messages do not repeat the token", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    const bad = "ghp_TESTclassic0123456789";
    const result = store.use("acme", bad, true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/github_pat_/);
      expect(result.message).not.toContain(bad);
    }
    const noOwner = store.use("a/b", T1, true);
    expect(noOwner.ok).toBe(false);
    if (!noOwner.ok) expect(noOwner.message).not.toContain(T1);
    expect(store.use("", T1, true).ok).toBe(false);
    expect(store.owners()).toEqual([]);
    expect(data.size).toBe(0);
  });

  it("a refused paste leaves the token held for that owner as it was", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    const before = data.get(TOKENS_KEY);
    expect(store.use("acme", "nonsense", true).ok).toBe(false);
    expect(store.tokenFor("acme")).toBe(T1);
    expect(data.get(TOKENS_KEY)).toBe(before);
  });
});

describe("the token store: Remember, in the one key vizi.githubTokens", () => {
  it("writes {tokens, forgot} with the owner as a name inside the value, and a reload finds each", () => {
    const { storage, data } = memoryStorage();
    expect(TOKENS_KEY).toBe("vizi.githubTokens");
    const store = createTokenStore(storage);
    expect(store.use(" Acme ", `  ${T1} `, true)).toEqual({ ok: true, saved: true });
    store.use("fomo-t", T2, true);
    store.use("page-only", T3, false);
    expect(stored(data)).toEqual({ tokens: { acme: T1, "fomo-t": T2 }, forgot: [] });
    expect([...data.keys()]).toEqual([TOKENS_KEY]);
    expect(store.isSaved("acme")).toBe(true);
    expect(store.isSaved("page-only")).toBe(false);

    const reloaded = createTokenStore(storage);
    reloaded.start();
    expect(reloaded.tokenFor("acme")).toBe(T1);
    expect(reloaded.tokenFor("fomo-t")).toBe(T2);
    expect(reloaded.tokenFor("page-only")).toBeNull();
    expect(reloaded.isSaved("acme")).toBe(true);
  });

  it("no token is ever part of a key name", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    store.use("fomo-t", T2, true);
    for (const key of data.keys()) {
      expect(key).not.toContain("github_pat_");
      expect(key).not.toContain("TEST");
    }
  });

  it("unticking one owner removes only its saved copy and keeps its token for this page", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    store.use("fomo-t", T2, true);
    store.setRemember("acme", false);
    expect(stored(data)).toEqual({ tokens: { "fomo-t": T2 }, forgot: [] });
    expect(store.tokenFor("acme")).toBe(T1);
    expect(store.isSaved("acme")).toBe(false);
    expect(store.isSaved("fomo-t")).toBe(true);
  });

  it("unticking the last saved owner keeps the key, so other tabs do not read it as Forget all", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    store.setRemember("acme", false);
    expect(stored(data)).toEqual({ tokens: {}, forgot: [] });
  });

  it("ticking later saves the token held for that owner; with no token held it saves nothing", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.setRemember("acme", true);
    expect(data.size).toBe(0);
    store.use("acme", T1, false);
    store.setRemember("acme", true);
    expect(stored(data)).toEqual({ tokens: { acme: T1 }, forgot: [] });
    expect(store.isSaved("acme")).toBe(true);
  });

  it("using a new token for a saved owner without Remember removes the older saved copy", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    store.use("acme", T2, false);
    expect(stored(data).tokens).toEqual({});
    expect(store.tokenFor("acme")).toBe(T2);
  });

  it("a write changes only its own owners: it starts from what is stored, never from this tab's memory", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    // Another tab saved another owner and unticked acme; this tab has not heard of either.
    data.set(TOKENS_KEY, json({ other: T3 }));
    store.use("fomo-t", T2, true);
    expect(stored(data)).toEqual({ tokens: { other: T3, "fomo-t": T2 }, forgot: [] });
  });

  it("a write that changes nothing writes nothing", () => {
    const { storage, log } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    const n = log.length;
    store.use("acme", T1, true);
    store.setRemember("acme", true);
    store.use("page", T2, false);
    store.setRemember("page", false);
    expect(log.length).toBe(n);
  });

  it("refuses to save in storage that throws: the token is kept for this page only", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore({
      ...storage,
      setItem: () => {
        throw new Error("quota");
      },
    });
    expect(store.use("acme", T1, true)).toEqual({ ok: true, saved: false });
    expect(store.tokenFor("acme")).toBe(T1);
    expect(store.isSaved("acme")).toBe(false);
  });
});

describe("the token store: owners named like what an object inherits", () => {
  const names = ["constructor", "__proto__", "toString", "hasOwnProperty", "valueOf"];

  it.each(names)(
    "with no token saved for %s a lookup finds none, in memory and in storage",
    (name) => {
      const { storage } = memoryStorage({ [TOKENS_KEY]: json({ acme: T1 }) });
      const store = createTokenStore(storage);
      store.start();
      expect(store.tokenFor(name)).toBeNull();
      expect(store.isSaved(name)).toBe(false);
      expect(store.owners()).toEqual(["acme"]);
      expect(store.onStorage(TOKENS_KEY, json({ acme: T1 }), json({ acme: T1 })).adopted).toEqual(
        [],
      );
    },
  );

  it.each(names)("a token saved for %s is written, read back and found", (name) => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    expect(store.use(name, T1, true)).toEqual({ ok: true, saved: true });
    expect(store.tokenFor(name)).toBe(T1);
    expect(Object.entries(stored(data).tokens)).toEqual([[name.toLowerCase(), T1]]);
    const reloaded = createTokenStore(storage);
    reloaded.start();
    expect(reloaded.tokenFor(name)).toBe(T1);
    expect(reloaded.owners()).toEqual([name.toLowerCase()]);
    expect(reloaded.tokenFor("acme")).toBeNull();
  });

  it("a stored __proto__ entry is read as an own entry and does not change what other owners find", () => {
    const raw = `{"tokens":{"__proto__":"${T1}","acme":"${T2}"},"forgot":[]}`;
    const { storage } = memoryStorage({ [TOKENS_KEY]: raw });
    const store = createTokenStore(storage);
    store.start();
    expect(store.tokenFor("__proto__")).toBe(T1);
    expect(store.tokenFor("acme")).toBe(T2);
    expect(store.tokenFor("other")).toBeNull();
  });
});

describe("the token store: startup", () => {
  it("removes a stored value that is not JSON, or whose tokens is not an object or forgot not a list", () => {
    for (const bad of [
      "",
      "{",
      "null",
      "[]",
      "7",
      '{"tokens":[],"forgot":[]}',
      '{"tokens":"x","forgot":[]}',
      '{"tokens":null,"forgot":[]}',
      '{"tokens":{},"forgot":{}}',
      '{"tokens":{}}',
      T1,
    ]) {
      const { storage, data } = memoryStorage({ [TOKENS_KEY]: bad });
      const store = createTokenStore(storage);
      store.start();
      expect(store.owners()).toEqual([]);
      expect(data.has(TOKENS_KEY)).toBe(false);
    }
  });

  it("drops a bad entry (an owner that breaks the rule, a token that is not a string or breaks the rule) and writes the cleaned value back", () => {
    const raw = JSON.stringify({
      tokens: {
        good: T1,
        "a/b": T2,
        "": T2,
        "..": T2,
        num: 5,
        nul: null,
        obj: { x: 1 },
        classic: "ghp_TEST123",
        spaced: ` ${T2}`,
      },
      forgot: ["gone", "a/b", 5, "x y"],
    });
    const { storage, data } = memoryStorage({ [TOKENS_KEY]: raw });
    const store = createTokenStore(storage);
    store.start();
    expect(store.owners()).toEqual(["good"]);
    expect(store.tokenFor("good")).toBe(T1);
    expect(store.isSaved("good")).toBe(true);
    expect(stored(data)).toEqual({ tokens: { good: T1 }, forgot: [] });
  });

  it("ignores forgot at startup, and writes nothing when the value is already clean", () => {
    const { storage, log } = memoryStorage({ [TOKENS_KEY]: json({ acme: T1 }, ["acme", "zed"]) });
    const store = createTokenStore(storage);
    store.start();
    expect(store.tokenFor("acme")).toBe(T1);
    expect(log).toEqual([]);
  });

  it("leaves other keys alone", () => {
    const { storage, data } = memoryStorage({ other: "x", [TOKENS_KEY]: "bad" });
    createTokenStore(storage).start();
    expect(data.get("other")).toBe("x");
  });
});

describe("the token store: Forget and Forget all", () => {
  it("forgetting one owner removes its token and saved copy, keeps the others, and writes it into forgot", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    store.use("fomo-t", T2, true);
    store.forget("ACME");
    expect(store.tokenFor("acme")).toBeNull();
    expect(store.isSaved("acme")).toBe(false);
    expect(store.tokenFor("fomo-t")).toBe(T2);
    expect(stored(data)).toEqual({ tokens: { "fomo-t": T2 }, forgot: ["acme"] });
  });

  it("forgetting the last owner keeps the key with forgot, so other tabs forget that owner only", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    store.forget("acme");
    expect(stored(data)).toEqual({ tokens: {}, forgot: ["acme"] });
  });

  it("forgetting a token held for this page only still tells other tabs", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, false);
    store.forget("acme");
    expect(stored(data)).toEqual({ tokens: {}, forgot: ["acme"] });
  });

  it("is harmless for an owner with no token", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    expect(() => store.forget("nobody")).not.toThrow();
  });

  it("Forget all removes every token from memory and the key from storage", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    store.use("fomo-t", T2, false);
    store.forgetAll();
    expect(store.owners()).toEqual([]);
    expect(data.has(TOKENS_KEY)).toBe(false);
  });

  it("the forgot list of a write is not carried over to the next write", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    store.forget("acme");
    store.use("fomo-t", T2, true);
    expect(stored(data)).toEqual({ tokens: { "fomo-t": T2 }, forgot: [] });
  });
});

describe("the token store: a 401 forgets only the token GitHub refused", () => {
  it("forgets the owner's token when it is still the refused one", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    store.use("fomo-t", T3, true);
    expect(store.forgetIfCurrent("acme", T1)).toBe(true);
    expect(store.tokenFor("acme")).toBeNull();
    expect(store.tokenFor("fomo-t")).toBe(T3);
    expect(stored(data).tokens).toEqual({ "fomo-t": T3 });
  });

  it("keeps a newer token entered for the same owner while the request ran", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    store.use("acme", T2, true);
    expect(store.forgetIfCurrent("acme", T1)).toBe(false);
    expect(store.tokenFor("acme")).toBe(T2);
    expect(stored(data).tokens).toEqual({ acme: T2 });
  });

  it("does nothing for an owner that has no token any more", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    expect(store.forgetIfCurrent("acme", T1)).toBe(false);
  });
});

describe("the token store: the storage event of another tab, per owner", () => {
  const none: StorageOutcome = {
    allForgotten: false,
    forgotten: [],
    adopted: [],
    keptForPage: [],
    migrationChanged: false,
  };

  it("a removed key makes this tab forget every owner, saved or for this page only", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    store.use("fomo-t", T2, false);
    const out = store.onStorage(TOKENS_KEY, json({ acme: T1 }), null);
    expect(out).toEqual({ ...none, allForgotten: true });
    expect(store.owners()).toEqual([]);
  });

  it("a removed key changes nothing for a tab that holds no token", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    expect(store.onStorage(TOKENS_KEY, json({ acme: T1 }), null)).toEqual(none);
  });

  it("a key of null (all of storage cleared) counts as both keys removed", () => {
    const { storage } = memoryStorage({ [OLD_TOKEN_KEY]: T3 });
    const store = createTokenStore(storage);
    store.start();
    store.use("acme", T1, true);
    expect(store.migration()).toBe(T3);
    const out = store.onStorage(null, null, null);
    expect(out.allForgotten).toBe(true);
    expect(out.migrationChanged).toBe(true);
    expect(store.owners()).toEqual([]);
    expect(store.migration()).toBeNull();
  });

  it("an owner in forgot is forgotten, whatever token this tab held and even if the new value holds an entry for it", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, false);
    store.use("fomo-t", T2, true);
    const out = store.onStorage(
      TOKENS_KEY,
      json({ "fomo-t": T2, acme: T3 }),
      json({ "fomo-t": T2, acme: T3 }, ["acme"]),
    );
    expect(out.forgotten).toEqual(["acme"]);
    expect(store.tokenFor("acme")).toBeNull();
    expect(store.tokenFor("fomo-t")).toBe(T2);
  });

  it("an owner in forgot that this tab does not hold is not reported", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    expect(store.onStorage(TOKENS_KEY, json({ acme: T1 }), json({}, ["acme"]))).toEqual(none);
  });

  it("a token saved there for an owner is adopted as saved; the other owners stay", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, false);
    store.use("page", T3, false);
    const out = store.onStorage(TOKENS_KEY, null, json({ acme: T2 }));
    expect(out.adopted).toEqual(["acme"]);
    expect(store.tokenFor("acme")).toBe(T2);
    expect(store.isSaved("acme")).toBe(true);
    expect(store.tokenFor("page")).toBe(T3);
    expect(store.isSaved("page")).toBe(false);
  });

  it("a tab with no token for the owner adopts what another tab saved", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    const out = store.onStorage(TOKENS_KEY, json({ a: T1 }), json({ a: T1, b: T2 }));
    expect(out.adopted).toEqual(["b"]);
    expect(store.tokenFor("b")).toBe(T2);
    expect(store.tokenFor("a")).toBeNull();
  });

  it("a saved copy removed there without forgot keeps the token here, for this page only", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    store.use("fomo-t", T2, true);
    const out = store.onStorage(
      TOKENS_KEY,
      json({ acme: T1, "fomo-t": T2 }),
      json({ "fomo-t": T2 }),
    );
    expect(out).toEqual({ ...none, keptForPage: ["acme"] });
    expect(store.tokenFor("acme")).toBe(T1);
    expect(store.isSaved("acme")).toBe(false);
    expect(store.isSaved("fomo-t")).toBe(true);
  });

  it("a saved copy removed there for an owner this tab does not hold changes nothing", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    expect(store.onStorage(TOKENS_KEY, json({ acme: T1 }), json({}))).toEqual(none);
  });

  it("compares the event's old and new value, never what this tab holds: an owner the same in both is left alone", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("x", T2, false);
    const out = store.onStorage(TOKENS_KEY, json({ x: T1 }), json({ x: T1, y: T3 }));
    expect(out.adopted).toEqual(["y"]);
    expect(store.tokenFor("x")).toBe(T2);
    expect(store.isSaved("x")).toBe(false);
  });

  it("a value that cannot be cleaned counts as no entries and no forgot", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    expect(store.onStorage(TOKENS_KEY, "not json", json({ acme: T1 }))).toEqual({
      ...none,
      adopted: ["acme"],
    });
    expect(store.onStorage(TOKENS_KEY, json({ acme: T1 }), "{")).toEqual({
      ...none,
      keptForPage: ["acme"],
    });
  });

  it("bad entries in an event are dropped before comparing, and are not adopted", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    const raw = JSON.stringify({ tokens: { "a/b": T1, c: "ghp_x", d: 4, e: T2 }, forgot: [] });
    const out = store.onStorage(TOKENS_KEY, null, raw);
    expect(out.adopted).toEqual(["e"]);
    expect(store.owners()).toEqual(["e"]);
  });

  it("an event for another key, or for a storage that is not this one, is ignored", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    expect(store.onStorage("other", "a", null)).toEqual(none);
    expect(store.tokenFor("acme")).toBe(T1);
  });

  it("following an event writes nothing to storage", () => {
    const { storage, log } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T1, true);
    store.use("fomo-t", T2, false);
    const n = log.length;
    store.onStorage(TOKENS_KEY, json({ acme: T1 }), json({ b: T3 }, ["acme"]));
    store.onStorage(TOKENS_KEY, json({ b: T3 }), null);
    store.onStorage(null, null, null);
    expect(log.length).toBe(n);
  });
});

describe("two stores on one storage, interleaved", () => {
  it("store A forgets X; store B, which still holds X, saves Y: the value holds Y and no X, and a third store forgets X", () => {
    const s = sharedStorage();
    const a = createTokenStore(s.view("a"));
    const b = createTokenStore(s.view("b"));
    a.start();
    b.start();
    a.use("x", T1, true);
    deliver(b, s.log, "b");
    const mark = s.log.length;
    const c = createTokenStore(s.view("c"));
    c.start();
    expect(c.tokenFor("x")).toBe(T1);

    a.forget("x");
    // B has not handled A's forget yet.
    expect(b.tokenFor("x")).toBe(T1);
    b.use("y", T2, true);
    expect(stored(s.data)).toEqual({ tokens: { y: T2 }, forgot: [] });

    deliver(c, s.log, "c", mark);
    expect(c.tokenFor("x")).toBeNull();
    expect(c.tokenFor("y")).toBe(T2);
  });

  it("a store that saves X while another store's forget of X is unhandled leaves the new X stored and, on handling the event, forgets it in memory only", () => {
    const s = sharedStorage();
    const a = createTokenStore(s.view("a"));
    const b = createTokenStore(s.view("b"));
    a.use("x", T1, true);
    deliver(b, s.log, "b");
    const mark = s.log.length;
    a.forget("x");
    b.use("x", T2, true);
    expect(stored(s.data)).toEqual({ tokens: { x: T2 }, forgot: [] });
    const n = s.log.length;
    deliver(b, s.log, "b", mark, mark + 1);
    expect(b.tokenFor("x")).toBeNull();
    expect(s.log.length).toBe(n);
    expect(stored(s.data).tokens).toEqual({ x: T2 });
    // Another tab adopts the stored token; saving again in B restores it there.
    const c = createTokenStore(s.view("c"));
    c.start();
    expect(c.tokenFor("x")).toBe(T2);
    b.use("x", T2, true);
    expect(b.tokenFor("x")).toBe(T2);
  });

  it("another store's save of owner Y, whose write carries the stored X entry unchanged, leaves this store's page-only X token as it was", () => {
    const s = sharedStorage();
    const mine = createTokenStore(s.view("mine"));
    const other = createTokenStore(s.view("other"));
    const third = createTokenStore(s.view("third"));
    mine.use("x", T2, false);
    other.use("x", T1, true);
    const mark = s.log.length;
    third.start();
    third.use("y", T3, true);
    deliver(mine, s.log, "mine", mark);
    expect(mine.tokenFor("x")).toBe(T2);
    expect(mine.isSaved("x")).toBe(false);
    expect(mine.tokenFor("y")).toBe(T3);
  });

  it("a startup clean-up does not carry the stored forgot list: a page-only X token elsewhere is left alone", () => {
    // The value needs cleaning (an upper-case owner) and its forgot names x.
    const raw = JSON.stringify({ tokens: { ACME: T1 }, forgot: ["x"] });
    const s = sharedStorage({ [TOKENS_KEY]: raw });
    const mine = createTokenStore(s.view("mine"));
    mine.use("x", T3, false);
    const other = createTokenStore(s.view("other"));
    other.start();
    expect(stored(s.data)).toEqual({ tokens: { acme: T1 }, forgot: [] });
    const out = deliver(mine, s.log, "mine");
    expect(out).toHaveLength(1);
    expect(out[0]?.forgotten).toEqual([]);
    expect(mine.tokenFor("x")).toBe(T3);
    expect(mine.isSaved("x")).toBe(false);
  });

  it("another store's startup clean-up changes nothing for an owner whose entry it kept", () => {
    const raw = JSON.stringify({ tokens: { x: T1, "a/b": T2 }, forgot: [] });
    const s = sharedStorage({ [TOKENS_KEY]: raw });
    const mine = createTokenStore(s.view("mine"));
    mine.use("x", T3, false);
    const other = createTokenStore(s.view("other"));
    other.start();
    expect(s.log.length).toBe(1);
    const out = deliver(mine, s.log, "mine");
    expect(out[0]).toEqual({
      allForgotten: false,
      forgotten: [],
      adopted: [],
      keptForPage: [],
      migrationChanged: false,
    });
    expect(mine.tokenFor("x")).toBe(T3);
    expect(mine.isSaved("x")).toBe(false);
  });
});

describe("migration of the old key vizi.githubToken", () => {
  it("a valid old token is listed for an owner to be chosen, and is used for no load until then", () => {
    const { storage, data } = memoryStorage({ [OLD_TOKEN_KEY]: T1 });
    const store = createTokenStore(storage);
    store.start();
    expect(store.migration()).toBe(T1);
    expect(store.owners()).toEqual([]);
    expect(store.tokenFor("acme")).toBeNull();
    expect(data.get(OLD_TOKEN_KEY)).toBe(T1);
  });

  it("an old value that is not a valid token is removed", () => {
    for (const bad of ["", "ghp_TEST", " github_pat_TEST", "github_pat_TEST\n"]) {
      const { storage, data } = memoryStorage({ [OLD_TOKEN_KEY]: bad });
      const store = createTokenStore(storage);
      store.start();
      expect(store.migration()).toBeNull();
      expect(data.has(OLD_TOKEN_KEY)).toBe(false);
    }
  });

  it("Keep for this owner moves it into vizi.githubTokens with Remember ticked, then removes the old key", () => {
    const { storage, data, log } = memoryStorage({ [OLD_TOKEN_KEY]: T1 });
    const store = createTokenStore(storage);
    store.start();
    store.use("fomo-t", T2, true);
    expect(store.keepMigrated(" Acme ")).toEqual({ ok: true, saved: true });
    expect(store.tokenFor("acme")).toBe(T1);
    expect(store.isSaved("acme")).toBe(true);
    expect(stored(data).tokens).toEqual({ "fomo-t": T2, acme: T1 });
    expect(data.has(OLD_TOKEN_KEY)).toBe(false);
    expect(store.migration()).toBeNull();
    // The new key is written before the old one is removed.
    const keys = log.map((w) => w.key);
    expect(keys.indexOf(TOKENS_KEY)).toBeLessThan(keys.lastIndexOf(OLD_TOKEN_KEY));
  });

  it("Keep with an owner that breaks the rule changes nothing", () => {
    const { storage, data } = memoryStorage({ [OLD_TOKEN_KEY]: T1 });
    const store = createTokenStore(storage);
    store.start();
    expect(store.keepMigrated("a/b").ok).toBe(false);
    expect(store.keepMigrated("").ok).toBe(false);
    expect(store.migration()).toBe(T1);
    expect(data.get(OLD_TOKEN_KEY)).toBe(T1);
    expect(data.has(TOKENS_KEY)).toBe(false);
  });

  it("Keep in storage that will not save changes nothing and says so", () => {
    const { storage } = memoryStorage({ [OLD_TOKEN_KEY]: T1 });
    const store = createTokenStore({
      ...storage,
      setItem: () => {
        throw new Error("quota");
      },
    });
    store.start();
    const result = store.keepMigrated("acme");
    expect(result.ok).toBe(false);
    expect(store.migration()).toBe(T1);
    expect(store.tokenFor("acme")).toBeNull();
  });

  it("Forget removes the old key", () => {
    const { storage, data } = memoryStorage({ [OLD_TOKEN_KEY]: T1 });
    const store = createTokenStore(storage);
    store.start();
    store.forgetMigrated();
    expect(store.migration()).toBeNull();
    expect(data.has(OLD_TOKEN_KEY)).toBe(false);
  });

  it("the old key's event: a valid new value shows or updates the line; removed or invalid hides it; nothing is written", () => {
    const { storage, log } = memoryStorage();
    const store = createTokenStore(storage);
    store.use("acme", T3, true);
    const n = log.length;
    expect(store.onStorage(OLD_TOKEN_KEY, null, T1).migrationChanged).toBe(true);
    expect(store.migration()).toBe(T1);
    expect(store.onStorage(OLD_TOKEN_KEY, T1, T1).migrationChanged).toBe(false);
    expect(store.onStorage(OLD_TOKEN_KEY, T1, T2).migrationChanged).toBe(true);
    expect(store.migration()).toBe(T2);
    expect(store.onStorage(OLD_TOKEN_KEY, T2, "ghp_bad").migrationChanged).toBe(true);
    expect(store.migration()).toBeNull();
    store.onStorage(OLD_TOKEN_KEY, null, T1);
    expect(store.onStorage(OLD_TOKEN_KEY, T1, null).migrationChanged).toBe(true);
    expect(store.migration()).toBeNull();
    expect(store.onStorage(OLD_TOKEN_KEY, null, null).migrationChanged).toBe(false);
    expect(store.tokenFor("acme")).toBe(T3);
    expect(log.length).toBe(n);
  });

  it("a token moved by Keep reaches another tab through the new key's event, then the removal hides its line", () => {
    const s = sharedStorage({ [OLD_TOKEN_KEY]: T1 });
    const a = createTokenStore(s.view("a"));
    const b = createTokenStore(s.view("b"));
    a.start();
    b.start();
    expect(b.migration()).toBe(T1);
    a.keepMigrated("acme");
    const out = deliver(b, s.log, "b");
    expect(out[0]?.adopted).toEqual(["acme"]);
    expect(out[1]?.migrationChanged).toBe(true);
    expect(b.tokenFor("acme")).toBe(T1);
    expect(b.migration()).toBeNull();
  });
});

describe("the token store: storage that does not work", () => {
  it("with no storage at all, a token is held for this page only", () => {
    const store = createTokenStore(null);
    store.start();
    expect(store.use("acme", T1, true)).toEqual({ ok: true, saved: false });
    expect(store.tokenFor("acme")).toBe(T1);
    expect(store.isSaved("acme")).toBe(false);
    expect(store.migration()).toBeNull();
  });

  it("with storage that throws, a token is held for this page only and nothing throws", () => {
    const broken: TokenStorage = {
      getItem: () => {
        throw new Error(`blocked ${T1}`);
      },
      setItem: () => {
        throw new Error(`quota ${T1}`);
      },
      removeItem: () => {
        throw new Error(`blocked ${T1}`);
      },
    };
    const store = createTokenStore(broken);
    expect(() => store.start()).not.toThrow();
    expect(store.use("acme", T1, true)).toEqual({ ok: true, saved: false });
    expect(store.tokenFor("acme")).toBe(T1);
    expect(() => store.setRemember("acme", false)).not.toThrow();
    expect(() => store.forget("acme")).not.toThrow();
    expect(() => store.forgetAll()).not.toThrow();
    expect(store.owners()).toEqual([]);
  });
});
