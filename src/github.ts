/**
 * Reading a public GitHub repo by its address (docs/SPEC.md 3.1): the
 * address, the anonymous requests in their order, and what comes back.
 * The fetcher is passed in, so tests never reach the network.
 */

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
const isName = (s: string) => NAME.test(s) && s !== "." && s !== "..";

/** `https://github.com/<owner>/<repo>`, optionally followed by `/tree/<branch>`. */
export function parseGithubUrl(input: string): RepoRef | null {
  const m = /^https:\/\/github\.com\/([^/?#]+)\/([^/?#]+)(?:\/tree\/([^?#]+?))?\/?$/.exec(
    input.trim(),
  );
  if (!m?.[1] || !m[2] || !isName(m[1]) || !isName(m[2])) return null;
  return { owner: m[1], repo: m[2], branch: m[3] ?? null };
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

type Failure = Extract<LoadResult, { ok: false }>;

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
  const api = `https://api.github.com/repos/${ref.owner}/${ref.repo}`;
  const raw = (branch: string, path: string) =>
    `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${branch}/${path}`;
  const contents = (branch: string, path: string) =>
    `${api}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch)}`;
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
        "GitHub refused the token: it may have expired. It has been forgotten; enter a new one.",
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
  const get = async (
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
          ? "Not found or not public. Open the project as a local folder instead."
          : "Not found, or the token does not give access to this repo. Open the project as a local folder instead.",
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

  let branch = ref.branch;
  if (branch === null) {
    const r1 = await get(api, true);
    if ("ok" in r1) return r1;
    const body = parseJson(r1.text);
    const def = isRecord(body) ? body.default_branch : undefined;
    if (typeof def !== "string" || def === "") {
      return failure("bad-response", 200, "GitHub's answer for the repo had no default branch.");
    }
    branch = def;
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
    const r3 =
      token === null
        ? await get(raw(branch, backlogPath), false)
        : await get(contents(branch, backlogPath), false, true);
    if ("ok" in r3) return r3;
    backlogText = r3.text;
  }
  if (files.includes("STATUS.md")) {
    const r4 =
      token === null
        ? await get(raw(branch, "STATUS.md"), false)
        : await get(contents(branch, "STATUS.md"), false, true);
    if ("ok" in r4) return r4;
    statusText = r4.text;
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
  };
}
