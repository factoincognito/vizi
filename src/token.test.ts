/**
 * Tests for src/token.ts: the saved token of docs/SPEC.md 3.8. The
 * storage is passed in; every token here is an obviously fake value.
 */
import { createTokenStore, maskToken, parseToken, TOKEN_KEY, type TokenStorage } from "./token";

const T1 = "github_pat_TEST_one_abcd1234";
const T2 = "github_pat_TEST_two_wxyz9876";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage: TokenStorage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
  return { storage, data };
}

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

describe("the token store: memory by default", () => {
  it("holds a used token in memory only, and writes nothing to storage", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    expect(store.current()).toBeNull();
    expect(store.use(T1, false)).toEqual({ ok: true, saved: false });
    expect(store.current()).toBe(T1);
    expect(store.isSaved()).toBe(false);
    expect(data.size).toBe(0);
  });

  it("a new store (a reload) does not find a token that was not remembered", () => {
    const { storage } = memoryStorage();
    createTokenStore(storage).use(T1, false);
    const reloaded = createTokenStore(storage);
    reloaded.start();
    expect(reloaded.current()).toBeNull();
  });
});

describe("the token store: Remember the token", () => {
  it("writes the key vizi.githubToken, and a reload finds it", () => {
    const { storage, data } = memoryStorage();
    expect(TOKEN_KEY).toBe("vizi.githubToken");
    const store = createTokenStore(storage);
    expect(store.use(`  ${T1} `, true)).toEqual({ ok: true, saved: true });
    expect(data.get("vizi.githubToken")).toBe(T1);
    expect(store.isSaved()).toBe(true);

    const reloaded = createTokenStore(storage);
    reloaded.start();
    expect(reloaded.current()).toBe(T1);
    expect(reloaded.isSaved()).toBe(true);
  });

  it("unticking later removes the saved copy and keeps the token for this page", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use(T1, true);
    store.setRemember(false);
    expect(data.size).toBe(0);
    expect(store.current()).toBe(T1);
    expect(store.isSaved()).toBe(false);
  });

  it("ticking later saves the token held in memory", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use(T1, false);
    store.setRemember(true);
    expect(data.get(TOKEN_KEY)).toBe(T1);
    expect(store.isSaved()).toBe(true);
  });

  it("ticking with no token held saves nothing", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.setRemember(true);
    expect(data.size).toBe(0);
  });

  it("using a new token replaces the saved one", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use(T1, true);
    store.use(T2, true);
    expect(data.get(TOKEN_KEY)).toBe(T2);
    expect(store.current()).toBe(T2);
  });

  it("using a new token without Remember removes an older saved one", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use(T1, true);
    store.use(T2, false);
    expect(data.size).toBe(0);
    expect(store.current()).toBe(T2);
  });

  it("refuses text that is not a token, keeps nothing, and the message does not repeat it", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    const bad = "ghp_TESTclassic0123456789";
    const result = store.use(bad, true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/github_pat_/);
      expect(result.message).not.toContain(bad);
    }
    expect(store.current()).toBeNull();
    expect(data.size).toBe(0);
  });

  it("a refused paste leaves a token already held as it was", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use(T1, true);
    expect(store.use("nonsense", true).ok).toBe(false);
    expect(store.current()).toBe(T1);
    expect(data.get(TOKEN_KEY)).toBe(T1);
  });
});

describe("the token store: startup", () => {
  it("removes a stored value that does not match the rule, and holds no token", () => {
    for (const bad of ["", "ghp_TEST123", " github_pat_TEST", "github_pat_TEST\n", "x y"]) {
      const { storage, data } = memoryStorage({ [TOKEN_KEY]: bad });
      const store = createTokenStore(storage);
      store.start();
      expect(store.current()).toBeNull();
      expect(data.has(TOKEN_KEY)).toBe(false);
    }
  });

  it("leaves other keys alone", () => {
    const { storage, data } = memoryStorage({ other: "x", [TOKEN_KEY]: "bad" });
    createTokenStore(storage).start();
    expect(data.get("other")).toBe("x");
  });
});

describe("the token store: Forget the token", () => {
  it("removes the token from memory and the saved copy", () => {
    const { storage, data } = memoryStorage();
    const store = createTokenStore(storage);
    store.use(T1, true);
    store.forget();
    expect(store.current()).toBeNull();
    expect(store.isSaved()).toBe(false);
    expect(data.size).toBe(0);
  });

  it("is harmless when no token is held", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    expect(() => store.forget()).not.toThrow();
    expect(store.current()).toBeNull();
  });
});

describe("the token store: the storage event of another tab", () => {
  it("a removed key makes this tab forget, whatever token it held, saved or not", () => {
    for (const remember of [true, false]) {
      const { storage } = memoryStorage();
      const store = createTokenStore(storage);
      store.use(T1, remember);
      expect(store.onStorage(TOKEN_KEY, null)).toBe("forgotten");
      expect(store.current()).toBeNull();
      expect(store.isSaved()).toBe(false);
    }
  });

  it("a cleared storage (key null) makes this tab forget too", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    store.use(T1, true);
    expect(store.onStorage(null, null)).toBe("forgotten");
    expect(store.current()).toBeNull();
  });

  it("a removed key changes nothing for a tab that holds no token", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    expect(store.onStorage(TOKEN_KEY, null)).toBe("ignored");
  });

  it("a new valid token saved in another tab is adopted and counts as saved", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    store.use(T1, false);
    expect(store.onStorage(TOKEN_KEY, T2)).toBe("adopted");
    expect(store.current()).toBe(T2);
    expect(store.isSaved()).toBe(true);
  });

  it("a tab with no token adopts a token saved in another tab", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    expect(store.onStorage(TOKEN_KEY, T1)).toBe("adopted");
    expect(store.current()).toBe(T1);
  });

  it("a value that does not match the rule is not adopted, and the held token stays", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    store.use(T1, true);
    for (const bad of ["", "ghp_TEST", " github_pat_TEST", "github_pat_TEST\nX"]) {
      expect(store.onStorage(TOKEN_KEY, bad)).toBe("ignored");
      expect(store.current()).toBe(T1);
    }
  });

  it("the same token again changes nothing", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    store.use(T1, true);
    expect(store.onStorage(TOKEN_KEY, T1)).toBe("ignored");
  });

  it("another key is ignored", () => {
    const { storage } = memoryStorage();
    const store = createTokenStore(storage);
    store.use(T1, true);
    expect(store.onStorage("other", null)).toBe("ignored");
    expect(store.current()).toBe(T1);
  });
});

describe("the token store: storage that does not work", () => {
  it("with no storage at all, a token is held for this page only", () => {
    const store = createTokenStore(null);
    store.start();
    expect(store.use(T1, true)).toEqual({ ok: true, saved: false });
    expect(store.current()).toBe(T1);
    expect(store.isSaved()).toBe(false);
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
    expect(store.use(T1, true)).toEqual({ ok: true, saved: false });
    expect(store.current()).toBe(T1);
    expect(() => store.setRemember(false)).not.toThrow();
    expect(() => store.forget()).not.toThrow();
    expect(store.current()).toBeNull();
  });
});
