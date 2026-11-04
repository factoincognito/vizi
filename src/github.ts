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

export type Fetcher = (url: string) => Promise<{ status: number; text: () => Promise<string> }>;

export const BACKLOG_PATHS: readonly string[] = [
  "BACKLOG.md",
  "docs/BACKLOG.md",
  "docs/PRODUCT_BACKLOG.md",
];

const NAME = /^[A-Za-z0-9._-]+$/;

/** `https://github.com/<owner>/<repo>`, optionally followed by `/tree/<branch>`. */
export function parseGithubUrl(input: string): RepoRef | null {
  const m = /^https:\/\/github\.com\/([^/?#]+)\/([^/?#]+)(?:\/tree\/([^?#]+?))?\/?$/.exec(
    input.trim(),
  );
  if (!m?.[1] || !m[2] || !NAME.test(m[1]) || !NAME.test(m[2])) return null;
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
      kind: "not-found" | "http" | "network" | "bad-response";
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

export async function loadRepo(ref: RepoRef, fetcher: Fetcher): Promise<LoadResult> {
  const api = `https://api.github.com/repos/${ref.owner}/${ref.repo}`;
  const raw = (branch: string, path: string) =>
    `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${branch}/${path}`;

  /** One request; a 404 on the API requests means not found or not public, any other failure shows its status. */
  const get = async (url: string, api404: boolean): Promise<{ text: string } | Failure> => {
    let answer: Awaited<ReturnType<Fetcher>>;
    try {
      answer = await fetcher(url);
    } catch (e) {
      const why = e instanceof Error ? e.message : String(e);
      return failure("network", null, `The request to ${new URL(url).host} failed: ${why}.`);
    }
    if (answer.status === 404 && api404) {
      return failure(
        "not-found",
        404,
        "Not found or not public. Open the project as a local folder instead.",
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
    const r3 = await get(raw(branch, backlogPath), false);
    if ("ok" in r3) return r3;
    backlogText = r3.text;
  }
  if (files.includes("STATUS.md")) {
    const r4 = await get(raw(branch, "STATUS.md"), false);
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
