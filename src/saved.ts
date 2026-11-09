/**
 * The Saved repos list of docs/SPEC.md 3.14 (PBI-1.12): which entries are
 * valid, how a stored value is read and cleaned, one entry per reference,
 * the cap, the texts, and a store over a `Storage` given to it. Nothing is
 * kept in memory: every read and every write starts from what is stored, so
 * an entry another tab added or removed is never undone.
 *
 * Names are read as own properties only and de-duplicated with a `Map`, so
 * an owner or repo called `__proto__` or `constructor` is just a name. No
 * token is ever read or written here.
 */
import { isName } from "./github";
import type { TokenStorage } from "./token";

/** The `localStorage` key: `{"repos": [{"owner", "repo", "branch"}, …]}`. */
export const SAVED_KEY = "vizi.savedRepos";
/** At most this many entries (Clead's choice, 3.14). */
export const MAX_SAVED = 50;
const MAX_NAME = 100;
const MAX_BRANCH = 255;

export const CANNOT_SAVE_MESSAGE = "This address cannot be saved.";
export const FULL_MESSAGE = "Saved repos holds at most 50 repos. Remove one to save another.";
export const NOT_SAVED_MESSAGE = "The browser would not save the repo.";

/** One entry: owner, repo, and the branch the load named, or null for the repo's default branch. */
export interface SavedRepo {
  owner: string;
  repo: string;
  branch: string | null;
}

/** 3.1's name rule for an owner or a repo, at most 100 characters. */
export function isSavedName(name: unknown): name is string {
  return typeof name === "string" && name.length <= MAX_NAME && isName(name);
}

/** The characters `git check-ref-format --branch` refuses, as 3.14 lists them besides the control characters, and `#` and `%`, which the page cannot open. */
const REFUSED_CHARACTER = /[ ~^:?*[\\#%]/;

/** A control character: U+0000 to U+001F, or U+007F. */
const hasControl = (text: string) =>
  [...text].some((c) => {
    const code = c.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });

/** null, or a branch name of 1 to 255 characters that git allows and the page can open (3.14). */
export function isSavedBranch(branch: unknown): branch is string | null {
  if (branch === null) return true;
  if (typeof branch !== "string" || branch.length < 1 || branch.length > MAX_BRANCH) return false;
  if (REFUSED_CHARACTER.test(branch) || hasControl(branch)) return false;
  if (branch.includes("..") || branch.includes("@{") || branch.includes("//")) return false;
  if (branch.startsWith("/") || branch.endsWith("/") || branch.endsWith(".")) return false;
  return !branch.split("/").some((part) => part.startsWith(".") || part.endsWith(".lock"));
}

/** The de-duplication key: owner and repo in lower case, then `@` and the branch as written, or `!` for null. */
export function savedKey(entry: SavedRepo): string {
  const base = `${entry.owner.toLowerCase()}/${entry.repo.toLowerCase()}`;
  return entry.branch === null ? `${base}!` : `${base}@${entry.branch}`;
}

/** An entry of a parsed value, read from its own properties only, or null when it breaks the rules. */
function readEntry(item: unknown): SavedRepo | null {
  if (typeof item !== "object" || item === null || Array.isArray(item)) return null;
  const own = (name: string): unknown =>
    Object.hasOwn(item, name) ? (item as Record<string, unknown>)[name] : undefined;
  const owner = own("owner");
  const repo = own("repo");
  const branch = own("branch");
  if (!isSavedName(owner) || !isSavedName(repo) || !isSavedBranch(branch)) return null;
  return { owner, repo, branch };
}

/** A stored value read and cleaned, or null when it is not JSON, not an object, or has no `repos` list. */
function clean(raw: string | null): SavedRepo[] | null {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  if (!Object.hasOwn(parsed, "repos")) return null;
  const repos = (parsed as Record<string, unknown>).repos;
  if (!Array.isArray(repos)) return null;
  const kept = new Map<string, SavedRepo>();
  for (const item of repos) {
    if (kept.size >= MAX_SAVED) break;
    const entry = readEntry(item);
    if (entry !== null && !kept.has(savedKey(entry))) kept.set(savedKey(entry), entry);
  }
  return [...kept.values()];
}

/** The entries a stored value holds, cleaned; a value that cannot be read holds none. */
export function readSaved(raw: string | null): SavedRepo[] {
  return clean(raw) ?? [];
}

/** The value written: exactly the three keys of each entry. */
function serialize(entries: readonly SavedRepo[]): string {
  return JSON.stringify({
    repos: entries.map(({ owner, repo, branch }) => ({ owner, repo, branch })),
  });
}

/** The open button's text, as the project's heading reads (3.13). */
export function displayText(entry: SavedRepo): string {
  return entry.branch === null
    ? `${entry.owner}/${entry.repo}`
    : `${entry.owner}/${entry.repo} (${entry.branch})`;
}

/** The "×" button's accessible name. */
export function removeLabel(entry: SavedRepo): string {
  return `Remove ${displayText(entry)} from Saved repos`;
}

export type SaveResult = { ok: true } | { ok: false; message: string };

export interface SavedStore {
  /** At page start: removes a value that cannot be read, and writes back one that cleaning changed. */
  start(): void;
  /** The entries stored now, cleaned, newest first; none when storage cannot be read. */
  entries(): SavedRepo[];
  /** Whether the reference is stored (owner and repo without regard to case, the branch exactly). */
  has(ref: SavedRepo): boolean;
  /** Stores the reference first, its owner in lower case; nothing changes when it is already there. */
  add(ref: SavedRepo): SaveResult;
  /** Removes the reference's entry; the key goes with the last one. False when nothing was removed. */
  remove(ref: SavedRepo): boolean;
}

export function createSavedStore(storage: TokenStorage | null): SavedStore {
  /** The stored entries, or null when storage cannot be used or read. */
  function stored(): SavedRepo[] | null {
    if (storage === null) return null;
    try {
      return readSaved(storage.getItem(SAVED_KEY));
    } catch {
      return null;
    }
  }

  /** Writes the entries, or removes the key when there are none; false when storage refused. */
  function write(entries: readonly SavedRepo[]): boolean {
    if (storage === null) return false;
    try {
      if (entries.length === 0) storage.removeItem(SAVED_KEY);
      else storage.setItem(SAVED_KEY, serialize(entries));
      return true;
    } catch {
      return false;
    }
  }

  return {
    start() {
      if (storage === null) return;
      try {
        const raw = storage.getItem(SAVED_KEY);
        if (raw === null) return;
        const cleaned = clean(raw);
        if (cleaned === null || cleaned.length === 0) storage.removeItem(SAVED_KEY);
        else if (serialize(cleaned) !== raw) storage.setItem(SAVED_KEY, serialize(cleaned));
      } catch {
        // Storage that cannot be read or written: the list shows what it can, and nothing is written.
      }
    },

    entries: () => stored() ?? [],

    has(ref) {
      const key = savedKey(ref);
      return (stored() ?? []).some((e) => savedKey(e) === key);
    },

    add(ref) {
      const entry = { owner: ref.owner.toLowerCase(), repo: ref.repo, branch: ref.branch };
      if (!isSavedName(entry.owner) || !isSavedName(entry.repo) || !isSavedBranch(entry.branch))
        return { ok: false, message: CANNOT_SAVE_MESSAGE };
      const now = stored();
      if (now === null) return { ok: false, message: NOT_SAVED_MESSAGE };
      const key = savedKey(entry);
      if (now.some((e) => savedKey(e) === key)) return { ok: true };
      if (now.length >= MAX_SAVED) return { ok: false, message: FULL_MESSAGE };
      return write([entry, ...now]) ? { ok: true } : { ok: false, message: NOT_SAVED_MESSAGE };
    },

    remove(ref) {
      const now = stored();
      if (now === null) return false;
      const key = savedKey(ref);
      const left = now.filter((e) => savedKey(e) !== key);
      if (left.length === now.length) return false;
      return write(left);
    },
  };
}
