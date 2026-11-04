/**
 * The saved GitHub tokens of docs/SPEC.md 3.8, one per owner: what text is
 * a token or an owner, how a token is shown, where the tokens are kept, and
 * how other open tabs follow. Storage is passed in, so tests need no
 * browser. A token is never put in a message here: every message is fixed
 * text.
 *
 * Owners are names inside the stored value and keys of a `Map`, never
 * properties looked up on a plain object, so an owner called `constructor`
 * or `__proto__` finds only a token saved for it.
 */

/** The `localStorage` key the remembered tokens are saved under: `{"tokens": {owner: token}, "forgot": [owner]}`. */
export const TOKENS_KEY = "vizi.githubTokens";

/** PBI-1.8's key, which held one token with no owner. */
export const OLD_TOKEN_KEY = "vizi.githubToken";

/** A fine-grained personal access token: the prefix and word characters only, so it is always a valid header value. */
const TOKEN_RULE = /^github_pat_[A-Za-z0-9_]+$/;

/** The owner part of an address, as 3.1 reads it. */
const OWNER_RULE = /^[A-Za-z0-9._-]+$/;

const REFUSED =
  "That is not a fine-grained GitHub token. It must start with github_pat_ and hold only letters, digits and underscores; classic tokens (ghp_) are not used.";
const OWNER_REFUSED =
  "Enter the owner the token is for: the owner part of the repo address, with letters, digits, dots, underscores and hyphens.";
const NOT_MOVED = "The browser would not save the token, so it was not moved.";

/** The token in the text, trimmed, or null when the text is not a token. */
export function parseToken(input: string): string | null {
  const trimmed = input.trim();
  return TOKEN_RULE.test(trimmed) ? trimmed : null;
}

/** The owner in the text, trimmed and in lower case, or null when the text is not an owner name. */
export function parseOwner(input: string): string | null {
  const trimmed = input.trim();
  if (!OWNER_RULE.test(trimmed) || trimmed === "." || trimmed === "..") return null;
  return trimmed.toLowerCase();
}

/** `github_pat_…` and the last four characters: all the page ever shows of a token. */
export function maskToken(token: string): string {
  return `github_pat_…${token.slice(-4)}`;
}

/** The part of `Storage` the page uses. */
export interface TokenStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type Entered = { ok: true; saved: boolean } | { ok: false; message: string };

/** What a `storage` event from another tab did to this tab. */
export interface StorageOutcome {
  /** The key was removed: every token was forgotten. */
  allForgotten: boolean;
  /** Owners whose token was forgotten here. */
  forgotten: string[];
  /** Owners whose token another tab saved and this tab now uses. */
  adopted: string[];
  /** Owners whose saved copy another tab removed: the token stays here, for this page only. */
  keptForPage: string[];
  /** The line for a token saved under the old key appeared, changed or went. */
  migrationChanged: boolean;
}

export interface TokenStore {
  /** The token held for the owner (without regard to case), or null. */
  tokenFor(owner: string): string | null;
  /** Whether the token held for the owner is also saved in storage. */
  isSaved(owner: string): boolean;
  /** The owners a token is held for, in the order they were first used. */
  owners(): string[];
  /** The token an earlier vizi saved without an owner, or null. */
  migration(): string | null;
  /** At page start: takes the saved tokens and the old key's token, and cleans what is stored. */
  start(): void;
  /** Takes the pasted text as the token for the owner; with `remember` also saves it. A refused text changes nothing. */
  use(owner: string, input: string, remember: boolean): Entered;
  /** Saves the owner's token (true) or removes its saved copy and keeps the token for this page (false). */
  setRemember(owner: string, remember: boolean): void;
  /** Drops the owner's token from memory and removes its saved copy. */
  forget(owner: string): void;
  /** Drops every token and removes the key. */
  forgetAll(): void;
  /** Forgets the owner's token only if it is still `token` (a 401 forgets the token GitHub refused). */
  forgetIfCurrent(owner: string, token: string): boolean;
  /** Moves the old key's token to the owner, saved, then removes the old key. */
  keepMigrated(owner: string): Entered;
  /** Removes the old key. */
  forgetMigrated(): void;
  /** Follows a `storage` event of another tab. Never writes. */
  onStorage(key: string | null, oldValue: string | null, newValue: string | null): StorageOutcome;
}

interface Stored {
  tokens: Map<string, string>;
  forgot: string[];
}

/** Runs a storage call; storage that is blocked or full is not an error, the token just stays in memory. */
function attempt(action: () => void): boolean {
  try {
    action();
    return true;
  } catch {
    return false;
  }
}

/**
 * A stored value, cleaned as at startup (3.8): null when it is not JSON,
 * or its "tokens" is not an object or its "forgot" not a list; entries
 * whose owner or token break the rules, and forgot items that are not
 * owners, are dropped. Owners are read as own entries only.
 */
function clean(raw: string | null): Stored | null {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  const { tokens, forgot } = parsed as { tokens?: unknown; forgot?: unknown };
  if (typeof tokens !== "object" || tokens === null || Array.isArray(tokens)) return null;
  if (!Array.isArray(forgot)) return null;
  const out: Stored = { tokens: new Map(), forgot: [] };
  for (const [name, token] of Object.entries(tokens)) {
    const owner = parseOwner(name);
    if (owner !== null && typeof token === "string" && TOKEN_RULE.test(token)) {
      out.tokens.set(owner, token);
    }
  }
  for (const item of forgot) {
    const owner = typeof item === "string" ? parseOwner(item) : null;
    if (owner !== null && !out.forgot.includes(owner)) out.forgot.push(owner);
  }
  return out;
}

/** The value written: the owners are written from the Map as own entries, so `__proto__` stays a name. */
function serialize(tokens: Map<string, string>, forgot: string[]): string {
  return JSON.stringify({ tokens: Object.fromEntries(tokens), forgot });
}

export function createTokenStore(storage: TokenStorage | null): TokenStore {
  const held = new Map<string, { token: string; saved: boolean }>();
  let oldToken: string | null = null;

  /**
   * Reads what is stored just now, lets `change` alter only its own owners,
   * and writes the result; false when storage refused. Nothing is written
   * when the write would change nothing and forgets no owner.
   */
  function write(change: (tokens: Map<string, string>) => void, forgot: string[] = []): boolean {
    if (storage === null) return false;
    try {
      const tokens = clean(storage.getItem(TOKENS_KEY))?.tokens ?? new Map<string, string>();
      const before = serialize(tokens, []);
      change(tokens);
      if (forgot.length === 0 && serialize(tokens, []) === before) return true;
      storage.setItem(TOKENS_KEY, serialize(tokens, forgot));
      return true;
    } catch {
      return false;
    }
  }

  const removeOld = (): void => {
    if (storage !== null) attempt(() => storage.removeItem(OLD_TOKEN_KEY));
    oldToken = null;
  };

  function use(owner: string, input: string, remember: boolean): Entered {
    const parsed = parseToken(input);
    if (parsed === null) return { ok: false, message: REFUSED };
    const name = parseOwner(owner);
    if (name === null) return { ok: false, message: OWNER_REFUSED };
    const wasSaved = held.get(name)?.saved === true;
    let saved = false;
    if (remember) saved = write((m) => void m.set(name, parsed));
    else if (wasSaved) write((m) => void m.delete(name));
    held.set(name, { token: parsed, saved });
    return { ok: true, saved };
  }

  function forget(owner: string): void {
    const name = owner.toLowerCase();
    held.delete(name);
    write((m) => void m.delete(name), [name]);
  }

  return {
    tokenFor: (owner) => held.get(owner.toLowerCase())?.token ?? null,
    isSaved: (owner) => held.get(owner.toLowerCase())?.saved === true,
    owners: () => [...held.keys()],
    migration: () => oldToken,

    start() {
      if (storage === null) return;
      try {
        const raw = storage.getItem(TOKENS_KEY);
        const stored = clean(raw);
        if (stored !== null) {
          for (const [owner, token] of stored.tokens) held.set(owner, { token, saved: true });
          // Cleaning is needed when the value is not already in written form. The write forgets
          // no owner: "forgot" is ignored at startup and never carried into a new write (3.8).
          if (raw !== serialize(stored.tokens, stored.forgot)) {
            storage.setItem(TOKENS_KEY, serialize(stored.tokens, []));
          }
        } else if (raw !== null) {
          storage.removeItem(TOKENS_KEY);
        }
        const old = storage.getItem(OLD_TOKEN_KEY);
        if (old !== null) {
          if (TOKEN_RULE.test(old)) oldToken = old;
          else storage.removeItem(OLD_TOKEN_KEY);
        }
      } catch {
        // Storage that cannot be read: the page works with tokens in memory only.
      }
    },

    use,

    setRemember(owner, remember) {
      const name = owner.toLowerCase();
      const entry = held.get(name);
      if (entry === undefined) return;
      if (remember) entry.saved = write((m) => void m.set(name, entry.token));
      else {
        write((m) => void m.delete(name));
        entry.saved = false;
      }
    },

    forget,

    forgetAll() {
      held.clear();
      if (storage !== null) attempt(() => storage.removeItem(TOKENS_KEY));
    },

    forgetIfCurrent(owner, token) {
      if (held.get(owner.toLowerCase())?.token !== token) return false;
      forget(owner);
      return true;
    },

    keepMigrated(owner) {
      const name = parseOwner(owner);
      if (name === null) return { ok: false, message: OWNER_REFUSED };
      if (oldToken === null) return { ok: false, message: REFUSED };
      const moved = use(name, oldToken, true);
      if (moved.ok && !moved.saved) {
        // Not moved: the token stays under the old key and is not held for the owner.
        held.delete(name);
        return { ok: false, message: NOT_MOVED };
      }
      removeOld();
      return moved;
    },

    forgetMigrated: removeOld,

    onStorage(key, oldValue, newValue) {
      const outcome: StorageOutcome = {
        allForgotten: false,
        forgotten: [],
        adopted: [],
        keptForPage: [],
        migrationChanged: false,
      };
      if (key === null || key === OLD_TOKEN_KEY) {
        const next = key === null || newValue === null ? null : parseToken(newValue);
        const valid = next !== null && next === newValue ? next : null;
        if (valid !== oldToken) {
          oldToken = valid;
          outcome.migrationChanged = true;
        }
      }
      if (key !== null && key !== TOKENS_KEY) return outcome;
      if (key === null || newValue === null) {
        if (held.size > 0) {
          held.clear();
          outcome.allForgotten = true;
        }
        return outcome;
      }
      const before = clean(oldValue) ?? { tokens: new Map<string, string>(), forgot: [] };
      const after = clean(newValue) ?? { tokens: new Map<string, string>(), forgot: [] };
      for (const owner of after.forgot) {
        if (held.delete(owner)) outcome.forgotten.push(owner);
      }
      for (const [owner, token] of after.tokens) {
        if (after.forgot.includes(owner) || before.tokens.get(owner) === token) continue;
        held.set(owner, { token, saved: true });
        outcome.adopted.push(owner);
      }
      for (const owner of before.tokens.keys()) {
        if (after.tokens.has(owner) || after.forgot.includes(owner)) continue;
        const entry = held.get(owner);
        if (entry?.saved) {
          entry.saved = false;
          outcome.keptForPage.push(owner);
        }
      }
      return outcome;
    },
  };
}
