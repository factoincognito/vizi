/**
 * The opening guide of docs/SPEC.md 3.1, "Guided opening" (PBI-1.19), without
 * the DOM: what it reads from the Repository field, which request lists an
 * owner's repos, one page of repos, the merging and the cap, the reads of an
 * owner's list and of a repo's branches, the messages, and which owner lists
 * are kept for the page visit. src/main.ts draws what these return. A repo
 * or branch name is untrusted text: the page sets it with value and
 * textContent, never as HTML.
 */
import {
  type BranchOption,
  branchOptions,
  capMessage,
  listFailureMessage,
  morePagesMayExist,
  nextPageWanted,
} from "./branches";
import {
  type Fetcher,
  getOwnerKind,
  isName,
  type LoadFailure,
  listBranches,
  listRepos,
  type OwnerType,
  type RepoListKind,
  readDefaultBranch,
  readRepository,
} from "./github";

export { READING_BRANCHES } from "./branches";

// ------------------------------------------------------------ the field

/** What the opening guide reads from the field's text. */
export type GuideText =
  | { kind: "owner"; owner: string; slash: boolean }
  | { kind: "repo"; owner: string; repo: string }
  | { kind: "none" };

/** Text that, in lower case, starts so is never read as an owner and a repo (3.1, form 2 only). */
const HOST_STARTS = ["github.com/", "www.github.com/", "https:", "http:"];
/** Text that, in lower case, is so (with or without one `/` at its end) is never an owner. */
const HOSTS = ["github.com", "www.github.com"];

/**
 * Reads the field's text for the opening guide (3.1): an owner alone
 * (`acme`, `acme/`), an owner and a repo as the Repository field's one
 * reader reads form 1 without `/tree/` (`acme/widgets`, `acme/widgets/`),
 * or nothing to guide.
 */
export function readGuideText(input: string): GuideText {
  const text = input.trim();
  const slash = text.endsWith("/");
  const bare = slash ? text.slice(0, -1) : text;
  if (!bare.includes("/")) {
    if (!isName(bare) || HOSTS.includes(bare.toLowerCase())) return { kind: "none" };
    return { kind: "owner", owner: bare, slash };
  }
  const lower = text.toLowerCase();
  if (HOST_STARTS.some((h) => lower.startsWith(h))) return { kind: "none" };
  const read = readRepository(text);
  if (!read.ok || read.ref.branch !== null) return { kind: "none" };
  return { kind: "repo", owner: read.ref.owner, repo: read.ref.repo };
}

/** The owner a guide text names (in lower case), or null. */
export const guideOwner = (t: GuideText): string | null =>
  t.kind === "none" ? null : t.owner.toLowerCase();

// ------------------------------------------------------- the owner's list

/** Which request lists the repos: an organisation's; a user's with a token held for that owner; or a user's public ones. */
export function repoListKind(type: OwnerType, hasToken: boolean): RepoListKind {
  if (type === "Organization") return "org";
  return hasToken ? "user-token" : "user";
}

export const REPO_LIST_NOT_UNDERSTOOD = "GitHub's answer for the repo list was not understood.";

/** One page of repos: the names it gives, and its item count (counted before any is skipped). */
export type RepoPage = { ok: true; names: string[]; count: number } | { ok: false };

/**
 * Reads one page: a JSON array whose objects with a `name` that matches
 * 3.1's name rule give one repo each; with `owner` (for `/user/repos`), only
 * items whose `owner.login` equals it, without regard to case.
 */
export function readRepoPage(text: string, owner: string | null): RepoPage {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false };
  }
  if (!Array.isArray(body)) return { ok: false };
  const names: string[] = [];
  for (const item of body as unknown[]) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) continue;
    const { name, owner: itemOwner } = item as { name?: unknown; owner?: unknown };
    if (typeof name !== "string" || !isName(name)) continue;
    if (owner !== null) {
      const login =
        typeof itemOwner === "object" && itemOwner !== null
          ? (itemOwner as { login?: unknown }).login
          : undefined;
      if (typeof login !== "string" || login.toLowerCase() !== owner.toLowerCase()) continue;
    }
    names.push(name);
  }
  return { ok: true, names, count: body.length };
}

/** Character-code order. */
const byCodes = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** The pages' names, each once, sorted by their character codes. */
export function mergeRepoPages(pages: readonly (readonly string[])[]): string[] {
  return [...new Set(pages.flat())].sort(byCodes);
}

/** What reading an owner's repo list gave. */
export interface OwnerRead {
  /** The owner as it was asked for. */
  owner: string;
  /** The token the read carried, or null. */
  token: string | null;
  names: string[];
  /** Why reading stopped early (on /users/<owner> or a page), or null. */
  failure: LoadFailure | null;
  /** The repo pages read before any failure. */
  pagesRead: number;
  /** The third page was full: the owner may have more repos. */
  more: boolean;
}

/**
 * Reads an owner's repos (3.1): `/users/<owner>`, then the repo pages, page
 * 1 and the next only after a page of 100 items, up to page 3, one after
 * another. For `/user/repos`, a page 1 that leaves no item of the owner
 * ends the read, which then counts as read in full.
 */
export async function readOwnerRepos(
  owner: string,
  token: string | null,
  fetcher: Fetcher,
): Promise<OwnerRead> {
  const result: OwnerRead = { owner, token, names: [], failure: null, pagesRead: 0, more: false };
  const kind = await getOwnerKind(owner, fetcher, token);
  if (!kind.ok) return { ...result, failure: kind };
  const list = repoListKind(kind.type, token !== null);
  const pages: string[][] = [];
  const counts: number[] = [];
  for (let n = 1; ; n++) {
    const answer = await listRepos(owner, list, n, fetcher, token);
    if (!answer.ok) {
      result.failure = answer;
      break;
    }
    const page = readRepoPage(answer.text, list === "user-token" ? owner : null);
    if (!page.ok) {
      result.failure = {
        ok: false,
        kind: "bad-response",
        status: 200,
        message: REPO_LIST_NOT_UNDERSTOOD,
      };
      break;
    }
    pages.push(page.names);
    counts.push(page.count);
    if (list === "user-token" && n === 1 && page.names.length === 0) break;
    if (!nextPageWanted(page.count, counts.length)) break;
  }
  result.names = mergeRepoPages(pages);
  result.pagesRead = pages.length;
  result.more = result.failure === null && morePagesMayExist(counts);
  return result;
}

/** Whether an owner's list is kept for the page visit: read in full (no failure, the cap not reached), an empty list included. */
export const isKept = (read: OwnerRead): boolean => read.failure === null && !read.more;

// -------------------------------------------------------------- messages

export const readingRepos = (owner: string) => `Reading ${owner}'s repos…`;
export const chooseMessage = (owner: string) =>
  `Choose one of ${owner}'s repos, or type ${owner}/<repo>.`;
export const repoCapMessage = (owner: string) =>
  `vizi lists the first 300 repos GitHub gives for ${owner}. Type the repo's name to open another.`;
export function noReposMessage(owner: string, withToken: boolean): string {
  return withToken
    ? `${owner} has no repos vizi can see with its token. If the token belongs to another account, add one made by ${owner}, or type ${owner}/<repo>.`
    : `${owner} has no repos vizi can see.`;
}
/** The repo list's frame around a failure's message: "could not be read", or "incomplete" after a page was read. */
export function repoListFailureMessage(message: string, pagesRead: number): string {
  return pagesRead > 0
    ? `The repo list is incomplete: ${message}`
    : `The repo list could not be read: ${message}`;
}

/** What the guide shows: a select's options (null: no select), and its message line. */
export interface GuideView<T> {
  options: T[] | null;
  message: string;
}

/** While an owner's list is read: no select, "Reading <owner>'s repos…". */
export const readingView = (owner: string): GuideView<string> => ({
  options: null,
  message: readingRepos(owner),
});

const join = (...parts: string[]) => parts.filter((p) => p !== "").join(" ");

/**
 * What an owner's list gives (3.1). After a blur or an Open (`afterBlur`):
 * the select with the repos and "Choose one…" for a list with at least one
 * repo; otherwise the outcome alone. A 401 shows nothing here: 3.8's message
 * goes to the page's message line.
 */
export function ownerView(read: OwnerRead, afterBlur: boolean): GuideView<string> {
  const f = read.failure;
  if (f?.kind === "token-refused") return { options: null, message: "" };
  if (f && read.pagesRead === 0) {
    // 404 on /users/<owner> (the only "not-found" here: a page's 404 is "http") is its own message; every other failure is framed.
    const bare = f.kind === "not-found";
    return { options: null, message: bare ? f.message : repoListFailureMessage(f.message, 0) };
  }
  const note = f
    ? repoListFailureMessage(f.message, read.pagesRead)
    : read.more
      ? repoCapMessage(read.owner)
      : "";
  if (read.names.length === 0) {
    return { options: null, message: note || noReposMessage(read.owner, read.token !== null) };
  }
  return afterBlur
    ? { options: read.names, message: join(note, chooseMessage(read.owner)) }
    : { options: null, message: note };
}

// ------------------------------------------------------- a repo's branches

/** What reading a repo's default branch and its branches gave. */
export interface RepoBranchesRead {
  owner: string;
  repo: string;
  /** Request 1's failure: a 404, no default branch, a 401, …; null when it answered. */
  failure: LoadFailure | null;
  defaultBranch: string | null;
  names: string[];
  more: boolean;
  pagesRead: number;
  /** The branch list's failure, or null. */
  listFailure: LoadFailure | null;
}

/** Request 1 of 3.1 for `default_branch`, then the branch list with 3.13's request (listBranches). */
export async function readRepoBranches(
  ref: { owner: string; repo: string },
  token: string | null,
  fetcher: Fetcher,
): Promise<RepoBranchesRead> {
  const base: RepoBranchesRead = {
    ...ref,
    failure: null,
    defaultBranch: null,
    names: [],
    more: false,
    pagesRead: 0,
    listFailure: null,
  };
  const r1 = await readDefaultBranch(ref, fetcher, token);
  if (!r1.ok) return { ...base, failure: r1 };
  const list = await listBranches(ref, fetcher, token);
  return {
    ...base,
    defaultBranch: r1.branch,
    names: list.names,
    more: list.more,
    pagesRead: list.pagesRead,
    listFailure: list.failure,
  };
}

/** The first failure of a branch read that carries a 401, or null. */
export function tokenRefusal(read: RepoBranchesRead | OwnerRead): LoadFailure | null {
  const f = "listFailure" in read ? (read.failure ?? read.listFailure) : read.failure;
  return f?.kind === "token-refused" ? f : null;
}

/**
 * What a repo's branches give (3.1): the select with 3.13's options, the
 * default selected; no select for a failed request 1, a list that could
 * not be read, or no branches. A 404 on the repo is 3.1's (or 3.8's)
 * message; every other failure is framed "The branch list could not be
 * read: …" (or "is incomplete: …" after a page).
 */
export function branchView(
  owner: string,
  repo: string,
  read: RepoBranchesRead,
): GuideView<BranchOption> {
  const f = read.failure;
  if (f) {
    if (f.kind === "token-refused") return { options: null, message: "" };
    return {
      options: null,
      message: f.kind === "not-found" ? f.message : listFailureMessage(f.message, 0),
    };
  }
  const lf = read.listFailure;
  if (lf?.kind === "token-refused") return { options: null, message: "" };
  if (lf && read.pagesRead === 0)
    return { options: null, message: listFailureMessage(lf.message, 0) };
  if (read.names.length === 0 || read.defaultBranch === null) return { options: null, message: "" };
  const message = lf
    ? listFailureMessage(lf.message, read.pagesRead)
    : read.more
      ? capMessage(owner, repo)
      : "";
  return { options: branchOptions(read.names, read.defaultBranch, read.defaultBranch), message };
}

// ------------------------------------------------- abandoned reads, kept lists

/** A fetcher that makes no request once its read is abandoned, with or without a token. */
export function guardFetcher(fetcher: Fetcher, abandoned: () => boolean): Fetcher {
  return (url, init) => {
    if (abandoned()) return Promise.reject(new Error("the read was abandoned"));
    return fetcher(url, init);
  };
}

/** A read's outcome: `abandoned` when a token change for its owner came while it ran. */
export interface OwnerOutcome {
  read: OwnerRead;
  abandoned: boolean;
}

/**
 * The owner lists of one page visit (3.1, "What is kept"): a list read in
 * full is kept, in memory only, by the lower-cased owner; a running read
 * serves a second ask; a token change for an owner (or for all) drops its
 * kept list and abandons its running read, whose answer is then not kept.
 */
export function createOwnerLists(
  read: (owner: string, abandoned: () => boolean) => Promise<OwnerRead>,
) {
  const kept = new Map<string, OwnerRead>();
  const running = new Map<string, Promise<OwnerOutcome>>();
  const changes = new Map<string, number>();
  let allChanges = 0;
  const changeCount = (owner: string) => (changes.get(owner) ?? 0) + allChanges;

  return {
    /** The kept list of the owner, or undefined. */
    kept: (owner: string): OwnerRead | undefined => kept.get(owner.toLowerCase()),
    /** Whether a read of the owner's list is running. */
    reading: (owner: string): boolean => running.has(owner.toLowerCase()),
    /** Reads the owner's list, or joins the read that is running. A caller checks `kept` first. */
    read(owner: string): Promise<OwnerOutcome> {
      const key = owner.toLowerCase();
      const already = running.get(key);
      if (already) return already;
      const at = changeCount(key);
      const abandoned = () => changeCount(key) !== at;
      const promise = read(owner, abandoned).then((r) => {
        if (running.get(key) === promise) running.delete(key);
        const gone = abandoned();
        if (!gone && isKept(r)) kept.set(key, r);
        return { read: r, abandoned: gone };
      });
      running.set(key, promise);
      return promise;
    },
    /** A token change for the owner (null: for all of them). */
    tokenChanged(owner: string | null): void {
      if (owner === null) {
        allChanges += 1;
        kept.clear();
        running.clear();
        return;
      }
      const key = owner.toLowerCase();
      changes.set(key, (changes.get(key) ?? 0) + 1);
      kept.delete(key);
      running.delete(key);
    },
    /** How many token changes the owner has seen: a branch read compares it to tell whether it was abandoned. */
    changeCount: (owner: string): number => changeCount(owner.toLowerCase()),
  };
}
