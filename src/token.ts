/**
 * The saved GitHub token of docs/SPEC.md 3.8: what text is a token, how it
 * is shown, where it is kept, and how other open tabs follow. Storage is
 * passed in, so tests need no browser. The token is never put in a
 * message here: every message is fixed text.
 */

/** The `localStorage` key a remembered token is saved under. */
export const TOKEN_KEY = "vizi.githubToken";

/** A fine-grained personal access token: the prefix and word characters only, so it is always a valid header value. */
const TOKEN_RULE = /^github_pat_[A-Za-z0-9_]+$/;

const REFUSED =
  "That is not a fine-grained GitHub token. It must start with github_pat_ and hold only letters, digits and underscores; classic tokens (ghp_) are not used.";

/** The token in the text, trimmed, or null when the text is not a token. */
export function parseToken(input: string): string | null {
  const trimmed = input.trim();
  return TOKEN_RULE.test(trimmed) ? trimmed : null;
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
export type StorageOutcome = "forgotten" | "adopted" | "ignored";

export interface TokenStore {
  /** The token held now, or null. */
  current(): string | null;
  /** Whether the token held is also saved in storage. */
  isSaved(): boolean;
  /** At page start: takes a saved token, and removes a saved value that is not a token. */
  start(): void;
  /** Takes the pasted text as the token; with `remember` also saves it. A refused text changes nothing. */
  use(input: string, remember: boolean): Entered;
  /** Saves the token held (true) or removes the saved copy and keeps the token for this page (false). */
  setRemember(remember: boolean): void;
  /** Drops the token from memory and removes the saved copy. */
  forget(): void;
  /** Follows a `storage` event of another tab. */
  onStorage(key: string | null, newValue: string | null): StorageOutcome;
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

export function createTokenStore(storage: TokenStorage | null): TokenStore {
  let token: string | null = null;
  let saved = false;

  const save = (value: string): boolean =>
    storage !== null && attempt(() => storage.setItem(TOKEN_KEY, value));
  const unsave = (): void => {
    if (storage !== null) attempt(() => storage.removeItem(TOKEN_KEY));
    saved = false;
  };

  return {
    current: () => token,
    isSaved: () => saved,

    start() {
      if (storage === null) return;
      let value: string | null = null;
      if (!attempt(() => void (value = storage.getItem(TOKEN_KEY)))) return;
      if (value === null) return;
      if (TOKEN_RULE.test(value)) {
        token = value;
        saved = true;
      } else {
        unsave();
      }
    },

    use(input, remember) {
      const parsed = parseToken(input);
      if (parsed === null) return { ok: false, message: REFUSED };
      token = parsed;
      if (remember && save(parsed)) saved = true;
      else unsave();
      return { ok: true, saved };
    },

    setRemember(remember) {
      if (token === null) return;
      if (remember && save(token)) saved = true;
      else unsave();
    },

    forget() {
      token = null;
      unsave();
    },

    onStorage(key, newValue) {
      if (key !== null && key !== TOKEN_KEY) return "ignored";
      if (newValue === null) {
        // The key was removed (or all of storage was cleared) in another tab.
        if (token === null) return "ignored";
        token = null;
        saved = false;
        return "forgotten";
      }
      if (!TOKEN_RULE.test(newValue) || (newValue === token && saved)) return "ignored";
      token = newValue;
      saved = true;
      return "adopted";
    },
  };
}
