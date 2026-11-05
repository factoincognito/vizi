/**
 * Reading a GitHub repo (docs/SPEC.md 3.1): the Repository field's text,
 * the requests in their order, and what comes back.
 * The fetcher is passed in, so tests never reach the network.
 */

import {
  BRANCH_LIST_NOT_UNDERSTOOD,
  BRANCHES_PER_PAGE,
  mergeBranchPages,
  morePagesMayExist,
  nextPageWanted,
  readBranchPage,
} from "./branches";

export interface RepoRef {
  owner: string;
  repo: string;
  /** null: the repo's default branch. */
  branch: string | null;
}

/** The options a request that carries a token is made with (docs/SPEC.md 3.8). */
export interface RequestOptions {
  headers: Record<string, string>;
  /** "omit": no cookies. */
  credentials: "omit";
  /** "no-store": a private answer is not kept in the browser's cache. */
  cache: "no-store";
}

export type Fetcher = (
  url: string,
  init?: RequestOptions,
) => Promise<{
  status: number;
  text: () => Promise<string>;
  headers?: { get: (name: string) => string | null };
}>;

export const BACKLOG_PATHS: readonly string[] = [
  "BACKLOG.md",
  "docs/BACKLOG.md",
  "docs/PRODUCT_BACKLOG.md",
];

const NAME = /^[A-Za-z0-9._-]+$/;
/** 3.1's name rule for an owner or a repo: letters, digits, `.`, `_` and `-`, and neither `.` nor `..`. */
export const isName = (s: string) => NAME.test(s) && s !== "." && s !== "..";

/** The Repository field's message for a text it cannot read (docs/SPEC.md 3.1, "The Repository field"). */
export const REPOSITORY_MESSAGE =
  "Type the repository as <owner>/<repo>, for example fomo-t/fomo-f, or paste its GitHub address (github.com/<owner>/<repo>, optionally with /tree/<branch>).";
/** A branch whose name, decoded, holds #, % or ?, or that does not decode: 3.1's text, also for a decoded ?. */
export const BRANCH_MESSAGE = "vizi cannot open this branch: its name holds # or %.";
/** A repo name ending in .git: a clone address. */
export const CLONE_MESSAGE =
  "That is a clone address. Type the repository as <owner>/<repo>, without .git.";

export type RepositoryRead =
  | { ok: true; ref: RepoRef }
  | { ok: false; reason: "form" | "branch" | "clone"; message: string };

const refused = (reason: "form" | "branch" | "clone", message: string): RepositoryRead => ({
  ok: false,
  reason,
  message,
});

/**
 * The Repository field's one reader (docs/SPEC.md 3.1, "The Repository
 * field"): `<owner>/<repo>`, or `<host>/<owner>/<repo>` with the host
 * `github.com` or `www.github.com`, with or without `https://` (scheme and
 * host in any case), each optionally followed by `/tree/<branch>` and one
 * `/`. The branch is percent-decoded once. Used for submitting the form and
 * for the Owner prefill, and nowhere else.
 */
export function readRepository(input: string): RepositoryRead {
  const text = input.trim();
  if (text.includes("?") || text.includes("#")) return refused("form", REPOSITORY_MESSAGE);
  let rest = text;
  let lower = text.toLowerCase();
  // A text with a scheme is read only as the long form: the scheme must be https:// and a host must follow.
  const withScheme = lower.startsWith("https://");
  if (withScheme) {
    rest = rest.slice("https://".length);
    lower = lower.slice("https://".length);
  }
  const host = ["github.com/", "www.github.com/"].find((h) => lower.startsWith(h));
  if (host) rest = rest.slice(host.length);
  else if (withScheme) return refused("form", REPOSITORY_MESSAGE);

  // After the repo: nothing, one "/", or "/tree/" and the branch.
  const m = /^([^/]+)\/([^/]+)(?:\/tree\/(.*)|\/)?$/.exec(rest);
  const owner = m?.[1];
  const repo = m?.[2];
  if (!owner || !repo || !isName(owner) || !isName(repo)) {
    return refused("form", REPOSITORY_MESSAGE);
  }
  const afterTree = m[3];
  // The branch is everything after /tree/, one trailing / dropped, and is not empty (3.1).
  const written = afterTree?.endsWith("/") ? afterTree.slice(0, -1) : afterTree;
  if (written === "") return refused("form", REPOSITORY_MESSAGE);
  if (repo.toLowerCase().endsWith(".git")) return refused("clone", CLONE_MESSAGE);
  if (written === undefined) return { ok: true, ref: { owner, repo, branch: null } };
  let branch: string;
  try {
    branch = decodeURIComponent(written);
  } catch {
    return refused("branch", BRANCH_MESSAGE);
  }
  if (/[#%?]/.test(branch)) return refused("branch", BRANCH_MESSAGE);
  return { ok: true, ref: { owner, repo, branch } };
}

/** The file's page on github.com. */
export function blobUrl(
  ref: { owner: string; repo: string; branch: string },
  path: string,
): string {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/${ref.owner}/${ref.repo}/blob/${ref.branch}/${encoded}`;
}

export type LoadResult =
  | {
      ok: true;
      branch: string;
      files: string[];
      /** GitHub cut the file list short: the lists built from it may be incomplete. */
      truncated: boolean;
      /** The backlog paths that exist, in the order of BACKLOG_PATHS. */
      backlogPaths: string[];
      backlogPath: string | null;
      backlogText: string | null;
      statusText: string | null;
      /** The root PROJECTS.md (3.9), or null when the file list has none. */
      projectsText: string | null;
      /** The default branch, when request 1 told it; null when the reference named a branch (3.13). */
      defaultBranch: string | null;
    }
  | {
      ok: false;
      kind:
        | "not-found"
        | "http"
        | "network"
        | "bad-response"
        /** 401 for a token: it is dead and must be forgotten (3.8). */
        | "token-refused"
        /** 403 at the rate limit (3.8). */
        | "rate-limit"
        /** 403 otherwise, with a token (3.8). */
        | "forbidden";
      status: number | null;
      message: string;
    };

export type LoadFailure = Extract<LoadResult, { ok: false }>;
type Failure = LoadFailure;

const failure = (kind: Failure["kind"], status: number | null, message: string): Failure => ({
  ok: false,
  kind,
  status,
  message,
});

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** "2026-11-03 10:00:00 UTC" from the seconds since 1970 that GitHub's reset header holds. */
function resetTime(seconds: string | null): string | null {
  if (seconds === null || !/^\d+$/.test(seconds)) return null;
  const date = new Date(Number(seconds) * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.toISOString().slice(0, 19).replace("T", " ")} UTC`;
}

/**
 * One request to GitHub as 3.1 and 3.8 set them out, for an owner: `get`
 * makes one request and turns what comes back into text or a failure. With
 * a token it goes in the Authorization header, never in a URL or a message.
 */
function makeGet(owner: string, fetcher: Fetcher, token: string | null) {
  /** The options of a request that carries the token; `raw` asks for a file's text. */
  const options = (rawText: boolean): RequestOptions | undefined =>
    token === null
      ? undefined
      : {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(rawText ? { Accept: "application/vnd.github.raw+json" } : {}),
          },
          credentials: "omit",
          cache: "no-store",
        };

  /** What a status means when the request carried a token. */
  const refused = (answer: Awaited<ReturnType<Fetcher>>): Failure | null => {
    if (token === null) return null;
    if (answer.status === 401) {
      return failure(
        "token-refused",
        401,
        `GitHub refused the token for ${owner.toLowerCase()}: it may have expired. It has been forgotten; enter a new one.`,
      );
    }
    if (answer.status === 403) {
      if (answer.headers?.get("X-RateLimit-Remaining") === "0") {
        const when = resetTime(answer.headers.get("X-RateLimit-Reset"));
        return failure(
          "rate-limit",
          403,
          `GitHub's rate limit is reached.${when === null ? "" : ` It resets at ${when}.`}`,
        );
      }
      return failure(
        "forbidden",
        403,
        'GitHub says the token may not read this repo: it may lack the "Contents: read" permission, or an organisation\'s token policy may stop it.',
      );
    }
    return null;
  };

  /** One request; a 404 on the API requests means not found or not public, any other failure shows its status. */
  return async (
    url: string,
    api404: boolean,
    rawText = false,
  ): Promise<{ text: string } | Failure> => {
    let answer: Awaited<ReturnType<Fetcher>>;
    const init = options(rawText);
    try {
      answer = init === undefined ? await fetcher(url) : await fetcher(url, init);
    } catch (e) {
      // With a token the exception's own text is never shown: a browser may quote a header value in it.
      const why = e instanceof Error ? e.message : String(e);
      return failure(
        "network",
        null,
        token === null
          ? `The request to ${new URL(url).host} failed: ${why}.`
          : `The request to ${new URL(url).host} failed.`,
      );
    }
    const byToken = refused(answer);
    if (byToken) return byToken;
    if (answer.status === 404 && api404) {
      return failure(
        "not-found",
        404,
        token === null
          ? "Not found or not public. If the repo is private, add a token for its owner."
          : "Not found, or the token does not give access to this repo.",
      );
    }
    if (answer.status < 200 || answer.status > 299) {
      return failure("http", answer.status, `GitHub answered HTTP ${answer.status} for ${url}.`);
    }
    try {
      return { text: await answer.text() };
    } catch (_e) {
      return failure("network", null, `Reading the answer from ${new URL(url).host} failed.`);
    }
  };
}

/**
 * The requests of one repo, as 3.1 and 3.8 set them out: `get` makes one
 * request (makeGet), and `file` reads one file (request 3) from
 * raw.githubusercontent.com, or with a token through the contents API.
 */
function makeRequests(
  ref: { owner: string; repo: string },
  fetcher: Fetcher,
  token: string | null,
) {
  const api = `https://api.github.com/repos/${ref.owner}/${ref.repo}`;
  const raw = (branch: string, path: string) =>
    `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${branch}/${path}`;
  const contents = (branch: string, path: string) =>
    `${api}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch)}`;
  const get = makeGet(ref.owner, fetcher, token);
  /** Request 3: one file of the repo at a branch. */
  const file = (branch: string, path: string) =>
    token === null ? get(raw(branch, path), false) : get(contents(branch, path), false, true);
  return { api, get, file };
}

/** One file of a repo, read the way request 3 reads it (3.9, "Show status"). */
export async function readRepoFile(
  ref: { owner: string; repo: string; branch: string },
  path: string,
  fetcher: Fetcher,
  token: string | null = null,
): Promise<{ ok: true; text: string } | LoadFailure> {
  const answer = await makeRequests(ref, fetcher, token).file(ref.branch, path);
  return "ok" in answer ? answer : { ok: true, text: answer.text };
}

/**
 * Request 1 of 3.1 on its own: the repo's default branch. A 404 is 3.1's
 * (or, with a token, 3.8's) message; an answer without a non-empty
 * `default_branch` string is "GitHub's answer for the repo had no default
 * branch." Used by a load, and by the opening guide (3.1, "Guided opening").
 */
export async function readDefaultBranch(
  ref: { owner: string; repo: string },
  fetcher: Fetcher,
  token: string | null = null,
): Promise<{ ok: true; branch: string } | LoadFailure> {
  const { api, get } = makeRequests(ref, fetcher, token);
  const r1 = await get(api, true);
  if ("ok" in r1) return r1;
  const body = parseJson(r1.text);
  const def = isRecord(body) ? body.default_branch : undefined;
  if (typeof def !== "string" || def === "") {
    return failure("bad-response", 200, "GitHub's answer for the repo had no default branch.");
  }
  return { ok: true, branch: def };
}

/**
 * Reads a repo through GitHub's API. Without a token it is the anonymous
 * reading of 3.1. With one (3.8) every request goes to api.github.com with
 * the token in an Authorization header, and the files are read through the
 * contents API; the token is never part of a URL or of a message.
 */
export async function loadRepo(
  ref: RepoRef,
  fetcher: Fetcher,
  token: string | null = null,
): Promise<LoadResult> {
  const { api, get, file } = makeRequests(ref, fetcher, token);
  let branch = ref.branch;
  let defaultBranch: string | null = null;
  if (branch === null) {
    const r1 = await readDefaultBranch(ref, fetcher, token);
    if (!r1.ok) return r1;
    branch = r1.branch;
    defaultBranch = r1.branch;
  }

  const r2 = await get(`${api}/git/trees/${encodeURIComponent(branch)}?recursive=1`, true);
  if ("ok" in r2) return r2;
  const listing = parseJson(r2.text);
  if (!isRecord(listing) || !Array.isArray(listing.tree)) {
    return failure("bad-response", 200, "GitHub's answer for the file list was not understood.");
  }
  const files: string[] = [];
  for (const node of listing.tree as unknown[]) {
    if (isRecord(node) && node.type === "blob" && typeof node.path === "string")
      files.push(node.path);
  }

  const backlogPaths = BACKLOG_PATHS.filter((p) => files.includes(p));
  const backlogPath = backlogPaths[0] ?? null;
  let backlogText: string | null = null;
  let statusText: string | null = null;
  if (backlogPath !== null) {
    const r3 = await file(branch, backlogPath);
    if ("ok" in r3) return r3;
    backlogText = r3.text;
  }
  if (files.includes("STATUS.md")) {
    const r4 = await file(branch, "STATUS.md");
    if ("ok" in r4) return r4;
    statusText = r4.text;
  }
  // 3.9: the umbrella view's file, at the root only.
  let projectsText: string | null = null;
  if (files.includes("PROJECTS.md")) {
    const r5 = await file(branch, "PROJECTS.md");
    if ("ok" in r5) return r5;
    projectsText = r5.text;
  }
  return {
    ok: true,
    branch,
    files,
    truncated: listing.truncated === true,
    backlogPaths,
    backlogPath,
    backlogText,
    statusText,
    projectsText,
    defaultBranch,
  };
}

/** What reading a repo's branch list gave (3.13). */
export interface BranchListResult {
  /** The names read, in GitHub's order, each once. */
  names: string[];
  /** The third page was full: the repo may have more branches. */
  more: boolean;
  /** The pages read before any failure. */
  pagesRead: number;
  /** Why reading stopped early, or null. */
  failure: LoadFailure | null;
}

/**
 * Reads a repo's branch list with GitHub's "List branches" (3.13): page 1,
 * then the next page only after a page of 100 items, up to page 3, one
 * request after another. It needs only the owner and the repo, not a load:
 * the guided opening of PBI-1.19 is to ask for a repo's branches that way.
 * The requests go through the same code as a load, with the token given (3.8).
 */
export async function listBranches(
  ref: { owner: string; repo: string },
  fetcher: Fetcher,
  token: string | null = null,
): Promise<BranchListResult> {
  const { api, get } = makeRequests(ref, fetcher, token);
  const pages: string[][] = [];
  const counts: number[] = [];
  let failure: LoadFailure | null = null;
  // The cap lives in nextPageWanted alone: the loop ends when it wants no next page.
  for (let n = 1; ; n++) {
    // A 404 here is read as any request that is not request 1 or 2 (3.13, "Errors").
    const answer = await get(`${api}/branches?per_page=${BRANCHES_PER_PAGE}&page=${n}`, false);
    if ("ok" in answer) {
      failure = answer;
      break;
    }
    const page = readBranchPage(answer.text);
    if (!page.ok) {
      failure = {
        ok: false,
        kind: "bad-response",
        status: 200,
        message: BRANCH_LIST_NOT_UNDERSTOOD,
      };
      break;
    }
    pages.push(page.names);
    counts.push(page.count);
    if (!nextPageWanted(page.count, counts.length)) break;
  }
  return {
    names: mergeBranchPages(pages),
    more: failure === null && morePagesMayExist(counts),
    pagesRead: pages.length,
    failure,
  };
}

/** What `/users/<owner>` says the owner is (3.1, "Guided opening"). */
export type OwnerType = "User" | "Organization";

/** Which request lists an owner's repos: an organisation's, the token's own user, or a user's public repos. */
export type RepoListKind = "org" | "user-token" | "user";

/**
 * "Get a user", `GET /users/<owner>`, for whether the owner is a user or
 * an organisation (3.1, "Guided opening"). A 404 is "GitHub has no account
 * named <owner>.", with a token or without; an answer that is not an
 * object, or whose `type` is neither "User" nor "Organization", is not
 * understood. Through the same request code as a load, with the token given.
 */
export async function getOwnerKind(
  owner: string,
  fetcher: Fetcher,
  token: string | null = null,
): Promise<{ ok: true; type: OwnerType } | LoadFailure> {
  const answer = await makeGet(
    owner,
    fetcher,
    token,
  )(`https://api.github.com/users/${owner}`, false);
  if ("ok" in answer) {
    return answer.status === 404
      ? failure("not-found", 404, `GitHub has no account named ${owner}.`)
      : answer;
  }
  const body = parseJson(answer.text);
  const type = isRecord(body) && !Array.isArray(body) ? body.type : undefined;
  if (type !== "User" && type !== "Organization") {
    return failure("bad-response", 200, `GitHub's answer for ${owner} was not understood.`);
  }
  return { ok: true, type };
}

/**
 * One page of an owner's repos, 100 per page (3.1, "Guided opening"):
 * an organisation's `/orgs/<owner>/repos?type=all`, the token's user's
 * `/user/repos?affiliation=owner`, or a user's public
 * `/users/<owner>/repos?type=owner`, each sorted by full name. Returns the
 * answer's text; src/guide.ts reads it. A 404 is read as a request that is
 * not request 1 or 2.
 */
export async function listRepos(
  owner: string,
  kind: RepoListKind,
  page: number,
  fetcher: Fetcher,
  token: string | null = null,
): Promise<{ ok: true; text: string } | LoadFailure> {
  const query = `sort=full_name&per_page=100&page=${page}`;
  const url =
    kind === "org"
      ? `https://api.github.com/orgs/${owner}/repos?type=all&${query}`
      : kind === "user-token"
        ? `https://api.github.com/user/repos?affiliation=owner&${query}`
        : `https://api.github.com/users/${owner}/repos?type=owner&${query}`;
  const answer = await makeGet(owner, fetcher, token)(url, false);
  return "ok" in answer ? answer : { ok: true, text: answer.text };
}
