/**
 * Tests for src/github.ts: the GitHub input of docs/SPEC.md 3.1, read
 * from the Repository field (3.1, "The Repository field").
 * A fake fetcher stands in for the network; no test reaches it.
 */
import * as github from "./github";
import {
  BRANCH_MESSAGE,
  blobUrl,
  CLONE_MESSAGE,
  type Fetcher,
  loadRepo,
  REPOSITORY_MESSAGE,
  readRepoFile,
  readRepository,
} from "./github";

describe("readRepository: the Repository field's reader (3.1)", () => {
  const ref = (owner: string, repo: string, branch: string | null = null) => ({
    ok: true,
    ref: { owner, repo, branch },
  });

  it.each([
    ["acme/widgets", ref("acme", "widgets")],
    ["acme/widgets/", ref("acme", "widgets")],
    ["  acme/widgets  ", ref("acme", "widgets")],
    ["acme/widgets/tree/main", ref("acme", "widgets", "main")],
    ["acme/widgets/tree/feat/new-thing/", ref("acme", "widgets", "feat/new-thing")],
    ["acme/widgets/tree/fix-%C3%A5", ref("acme", "widgets", "fix-å")],
    ["github.com/acme/widgets/tree/feat%2Fx", ref("acme", "widgets", "feat/x")],
    ["acme/widgets/tree/fix-å", ref("acme", "widgets", "fix-å")],
    ["https://github.com/acme/widgets", ref("acme", "widgets")],
    ["https://github.com/acme/widgets/tree/main", ref("acme", "widgets", "main")],
    ["https://github.com/acme/widgets/", ref("acme", "widgets")],
    ["  https://github.com/acme/widgets/  ", ref("acme", "widgets")],
    ["github.com/acme/widgets", ref("acme", "widgets")],
    ["www.github.com/acme/widgets", ref("acme", "widgets")],
    ["https://www.github.com/acme/widgets/tree/main", ref("acme", "widgets", "main")],
    ["https://www.github.com/acme/widgets", ref("acme", "widgets")],
    ["GitHub.com/acme/widgets", ref("acme", "widgets")],
    ["HTTPS://GITHUB.COM/acme/widgets", ref("acme", "widgets")],
    ["Acme/Widgets", ref("Acme", "Widgets")],
  ])("accepts %j", (input, expected) => {
    expect(readRepository(input)).toEqual(expected);
  });

  it("reads the short form and the long form of one repo to the same reference", () => {
    const short = readRepository("acme/widgets/tree/feat/x");
    for (const long of [
      "https://github.com/acme/widgets/tree/feat/x",
      "github.com/acme/widgets/tree/feat/x",
      "www.github.com/acme/widgets/tree/feat/x/",
      "https://www.github.com/acme/widgets/tree/feat%2Fx",
    ])
      expect(readRepository(long)).toEqual(short);
  });

  it.each([
    "",
    "   ",
    "acme",
    "acme/",
    "/acme/widgets",
    "acme/widgets/tree/",
    "acme/widgets/issues",
    "acme/widgets/blob/main/x",
    "acme/widgets?x=1",
    "acme/widgets#x",
    "acme/widgets/tree/main?x=1",
    "ac me/widgets",
    "../..",
    "./widgets",
    "acme/..",
    "acme/widgets//",
    "http://github.com/acme/widgets",
    "http://www.github.com/acme/widgets",
    "https://example.com/acme/widgets",
    "https://github.com",
    "https://github.com/acme",
    "gist.github.com/acme/widgets",
    "github.com/acme",
    "github.com/acme/widgets/issues",
    "javascript:alert(1)",
  ])("refuses %j with the field's message", (input) => {
    expect(readRepository(input)).toEqual({
      ok: false,
      reason: "form",
      message: REPOSITORY_MESSAGE,
    });
  });

  it.each([
    "acme/widgets/tree/a%23b",
    "acme/widgets/tree/50%25",
    "acme/widgets/tree/a%E0",
    "acme/widgets/tree/50%",
    "acme/widgets/tree/a%3Fb",
    "https://github.com/acme/widgets/tree/feat%2Fa%23b",
  ])("refuses the branch of %j with the branch message", (input) => {
    expect(readRepository(input)).toEqual({ ok: false, reason: "branch", message: BRANCH_MESSAGE });
  });

  it.each([
    "acme/widgets.git",
    "github.com/acme/widgets.GIT",
    "https://github.com/acme/widgets.git/tree/main",
    "acme/widgets.Git/",
  ])("refuses the clone address %j with its own message", (input) => {
    expect(readRepository(input)).toEqual({ ok: false, reason: "clone", message: CLONE_MESSAGE });
  });

  it("does not take a text that starts with github.com/ for an owner named github.com", () => {
    expect(readRepository("github.com/acme")).toMatchObject({ ok: false, reason: "form" });
    expect(readRepository("www.github.com/acme/")).toMatchObject({ ok: false, reason: "form" });
  });

  it("has the messages of 3.1, word for word", () => {
    expect(REPOSITORY_MESSAGE).toBe(
      "Type the repository as owner/repo, for example fomo-t/fomo-f, or paste its GitHub address (github.com/owner/repo, optionally with /tree/<branch>).",
    );
    // Spec wording point (#65, round 3): the message names ? as well, so it is true for a decoded ?.
    expect(BRANCH_MESSAGE).toBe("vizi cannot open this branch: its name holds #, % or ?.");
    expect(CLONE_MESSAGE).toBe(
      "That is a clone address. Type the repository as owner/repo, without .git.",
    );
  });

  it("is the module's one reader: parseGithubUrl is gone", () => {
    expect(Object.keys(github)).toContain("readRepository");
    expect(Object.keys(github)).not.toContain("parseGithubUrl");
  });
});

describe("blobUrl", () => {
  it("builds the file's github.com page, encoding each segment", () => {
    expect(blobUrl({ owner: "acme", repo: "widgets", branch: "feat/x" }, "docs/a b.md")).toBe(
      "https://github.com/acme/widgets/blob/feat/x/docs/a%20b.md",
    );
  });
});

type Answer = { status: number; body?: string };
function fake(answers: Record<string, Answer>): { fetcher: Fetcher; calls: string[] } {
  const calls: string[] = [];
  const fetcher: Fetcher = async (url) => {
    calls.push(url);
    const a = answers[url];
    if (!a) throw new Error(`unexpected request ${url}`);
    return { status: a.status, text: async () => a.body ?? "" };
  };
  return { fetcher, calls };
}
const API = "https://api.github.com/repos/acme/widgets";
const RAW = "https://raw.githubusercontent.com/acme/widgets/main";
const tree = (paths: string[], truncated = false) =>
  JSON.stringify({
    truncated,
    tree: [...paths.map((path) => ({ path, type: "blob" })), { path: "docs", type: "tree" }],
  });
const ref = { owner: "acme", repo: "widgets", branch: null };

describe("loadRepo: the requests of 3.1, in order", () => {
  it("asks for the default branch, the file list, then the backlog file and STATUS.md", async () => {
    const { fetcher, calls } = fake({
      [API]: { status: 200, body: JSON.stringify({ default_branch: "main" }) },
      [`${API}/git/trees/main?recursive=1`]: {
        status: 200,
        body: tree(["docs/BACKLOG.md", "STATUS.md", "README.md"]),
      },
      [`${RAW}/docs/BACKLOG.md`]: { status: 200, body: "backlog text" },
      [`${RAW}/STATUS.md`]: { status: 200, body: "status text" },
    });
    const r = await loadRepo(ref, fetcher);
    expect(calls).toEqual([
      API,
      `${API}/git/trees/main?recursive=1`,
      `${RAW}/docs/BACKLOG.md`,
      `${RAW}/STATUS.md`,
    ]);
    expect(r).toEqual({
      ok: true,
      branch: "main",
      files: ["docs/BACKLOG.md", "STATUS.md", "README.md"],
      truncated: false,
      backlogPaths: ["docs/BACKLOG.md"],
      backlogPath: "docs/BACKLOG.md",
      backlogText: "backlog text",
      statusText: "status text",
      projectsText: null,
    });
  });

  it("skips request 1 when the URL names a branch, and encodes the branch in the tree request", async () => {
    const { fetcher, calls } = fake({
      [`${API}/git/trees/feat%2Fx?recursive=1`]: { status: 200, body: tree(["BACKLOG.md"]) },
      "https://raw.githubusercontent.com/acme/widgets/feat/x/BACKLOG.md": {
        status: 200,
        body: "b",
      },
    });
    const r = await loadRepo({ ...ref, branch: "feat/x" }, fetcher);
    expect(calls).toHaveLength(2);
    expect(r.ok && r.statusText).toBeNull();
  });

  it("reads the first of the three paths and lists all that exist (info for the report)", async () => {
    const { fetcher, calls } = fake({
      [API]: { status: 200, body: JSON.stringify({ default_branch: "main" }) },
      [`${API}/git/trees/main?recursive=1`]: {
        status: 200,
        body: tree(["docs/PRODUCT_BACKLOG.md", "docs/BACKLOG.md", "BACKLOG.md"]),
      },
      [`${RAW}/BACKLOG.md`]: { status: 200, body: "root" },
    });
    const r = await loadRepo(ref, fetcher);
    expect(calls).toEqual([API, `${API}/git/trees/main?recursive=1`, `${RAW}/BACKLOG.md`]);
    expect(r.ok && r.backlogPaths).toEqual([
      "BACKLOG.md",
      "docs/BACKLOG.md",
      "docs/PRODUCT_BACKLOG.md",
    ]);
    expect(r.ok && r.backlogPath).toBe("BACKLOG.md");
  });

  it("finds no backlog file: no raw request for it, backlogPath null", async () => {
    const { fetcher, calls } = fake({
      [API]: { status: 200, body: JSON.stringify({ default_branch: "main" }) },
      [`${API}/git/trees/main?recursive=1`]: { status: 200, body: tree(["README.md"]) },
    });
    const r = await loadRepo(ref, fetcher);
    expect(calls).toHaveLength(2);
    expect(r.ok && [r.backlogPath, r.backlogText, r.statusText]).toEqual([null, null, null]);
  });

  it("reports a truncated file list", async () => {
    const { fetcher } = fake({
      [API]: { status: 200, body: JSON.stringify({ default_branch: "main" }) },
      [`${API}/git/trees/main?recursive=1`]: { status: 200, body: tree(["README.md"], true) },
    });
    const r = await loadRepo(ref, fetcher);
    expect(r.ok && r.truncated).toBe(true);
  });
});

describe("loadRepo: failures", () => {
  it("says not found or not public on a 404 for request 1", async () => {
    const { fetcher, calls } = fake({ [API]: { status: 404 } });
    const r = await loadRepo(ref, fetcher);
    expect(calls).toHaveLength(1);
    expect(r).toMatchObject({ ok: false, kind: "not-found", status: 404 });
    // 3.1's message, word for word: since PBI-1.14 (3.11) no sentence follows it.
    expect(!r.ok && r.message).toBe(
      "Not found or not public. If the repo is private, add a token for its owner.",
    );
  });

  it("says not found or not public on a 404 for request 2", async () => {
    const { fetcher } = fake({
      [API]: { status: 200, body: JSON.stringify({ default_branch: "main" }) },
      [`${API}/git/trees/main?recursive=1`]: { status: 404 },
    });
    const r = await loadRepo(ref, fetcher);
    expect(r).toMatchObject({ ok: false, kind: "not-found" });
    expect(!r.ok && r.message).toBe(
      "Not found or not public. If the repo is private, add a token for its owner.",
    );
  });

  it("shows any other HTTP status with the status, and does not retry", async () => {
    const { fetcher, calls } = fake({ [API]: { status: 403 } });
    const r = await loadRepo(ref, fetcher);
    expect(calls).toHaveLength(1);
    expect(r).toMatchObject({ ok: false, kind: "http", status: 403 });
    expect(!r.ok && r.message).toContain("403");
  });

  it("fails with the status when a raw file request fails", async () => {
    const { fetcher } = fake({
      [API]: { status: 200, body: JSON.stringify({ default_branch: "main" }) },
      [`${API}/git/trees/main?recursive=1`]: { status: 200, body: tree(["BACKLOG.md"]) },
      [`${RAW}/BACKLOG.md`]: { status: 500 },
    });
    expect(await loadRepo(ref, fetcher)).toMatchObject({ ok: false, kind: "http", status: 500 });
  });

  it("reports a network error", async () => {
    const fetcher: Fetcher = async () => {
      throw new TypeError("Failed to fetch");
    };
    const r = await loadRepo(ref, fetcher);
    expect(r).toMatchObject({ ok: false, kind: "network", status: null });
    expect(!r.ok && r.message).toContain("Failed to fetch");
  });

  it.each([
    ["not JSON", "<html>"],
    ["no default branch", JSON.stringify({})],
    ["a branch that is not a string", JSON.stringify({ default_branch: 3 })],
  ])("reports an answer that is %s for request 1", async (_n, body) => {
    const { fetcher } = fake({ [API]: { status: 200, body } });
    expect(await loadRepo(ref, fetcher)).toMatchObject({ ok: false, kind: "bad-response" });
  });

  it.each([
    ["not JSON", "nope"],
    ["no tree array", JSON.stringify({ tree: 3 })],
  ])("reports a file list that is %s", async (_n, body) => {
    const { fetcher } = fake({
      [API]: { status: 200, body: JSON.stringify({ default_branch: "main" }) },
      [`${API}/git/trees/main?recursive=1`]: { status: 200, body },
    });
    expect(await loadRepo(ref, fetcher)).toMatchObject({ ok: false, kind: "bad-response" });
  });

  it("ignores tree entries that are not files with a string path", async () => {
    const body = JSON.stringify({
      tree: [
        { path: "a.md", type: "blob" },
        { path: 3, type: "blob" },
        { path: "d", type: "tree" },
        null,
        "x",
      ],
    });
    const { fetcher } = fake({
      [API]: { status: 200, body: JSON.stringify({ default_branch: "main" }) },
      [`${API}/git/trees/main?recursive=1`]: { status: 200, body },
    });
    const r = await loadRepo(ref, fetcher);
    expect(r.ok && r.files).toEqual(["a.md"]);
  });
});

// ---------------------------------------------------------------- with a token (3.8)

const TOKEN = "github_pat_TEST_unit_abcd1234";
type Sent = { url: string; init: Parameters<Fetcher>[1] };
type TokenAnswer = { status: number; body?: string; headers?: Record<string, string> };

/** A fetcher that records each request with its options, and answers by URL. */
function fakeWithInit(answers: Record<string, TokenAnswer>): { fetcher: Fetcher; sent: Sent[] } {
  const sent: Sent[] = [];
  const fetcher: Fetcher = async (url, init) => {
    sent.push({ url, init });
    const a = answers[url];
    if (!a) throw new Error(`unexpected request ${url}`);
    const headers = new Map(Object.entries(a.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
    return {
      status: a.status,
      text: async () => a.body ?? "",
      headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
    };
  };
  return { fetcher, sent };
}
const TREE = `${API}/git/trees/main?recursive=1`;
const okRepo = { status: 200, body: JSON.stringify({ default_branch: "main" }) };
const contents = (path: string, branch = "main") =>
  `${API}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch)}`;

describe("loadRepo with a token (3.8): the requests", () => {
  const answers = {
    [API]: okRepo,
    [TREE]: { status: 200, body: tree(["docs/BACKLOG.md", "STATUS.md"]) },
    [contents("docs/BACKLOG.md")]: { status: 200, body: "backlog text" },
    [contents("STATUS.md")]: { status: 200, body: "status text" },
  };

  it("sends every request to api.github.com, request 3 through the contents API", async () => {
    const { fetcher, sent } = fakeWithInit(answers);
    const r = await loadRepo(ref, fetcher, TOKEN);
    expect(sent.map((s) => s.url)).toEqual([
      API,
      TREE,
      contents("docs/BACKLOG.md"),
      contents("STATUS.md"),
    ]);
    expect(sent.every((s) => new URL(s.url).host === "api.github.com")).toBe(true);
    expect(r).toMatchObject({
      ok: true,
      backlogPath: "docs/BACKLOG.md",
      backlogText: "backlog text",
      statusText: "status text",
    });
  });

  it("sends the token as a Bearer header, with no cookies and no caching, and never in a URL", async () => {
    const { fetcher, sent } = fakeWithInit(answers);
    await loadRepo(ref, fetcher, TOKEN);
    for (const s of sent) {
      expect(s.init?.headers?.Authorization).toBe(`Bearer ${TOKEN}`);
      expect(s.init?.credentials).toBe("omit");
      expect(s.init?.cache).toBe("no-store");
      expect(s.url).not.toContain(TOKEN);
      expect(s.url).not.toContain("github_pat_");
    }
  });

  it("asks for the raw media type on the file requests only", async () => {
    const { fetcher, sent } = fakeWithInit(answers);
    await loadRepo(ref, fetcher, TOKEN);
    const accepts = sent.map((s) => s.init?.headers?.Accept);
    expect(accepts).toEqual([
      undefined,
      undefined,
      "application/vnd.github.raw+json",
      "application/vnd.github.raw+json",
    ]);
  });

  it("encodes the branch and each path segment", async () => {
    const { fetcher, sent } = fakeWithInit({
      [`${API}/git/trees/feat%2Fx?recursive=1`]: { status: 200, body: tree(["BACKLOG.md"]) },
      [`${API}/contents/BACKLOG.md?ref=feat%2Fx`]: { status: 200, body: "b" },
    });
    const r = await loadRepo({ ...ref, branch: "feat/x" }, fetcher, TOKEN);
    expect(r.ok).toBe(true);
    expect(sent).toHaveLength(2);
  });

  it("makes no request to raw.githubusercontent.com", async () => {
    const { fetcher, sent } = fakeWithInit(answers);
    await loadRepo(ref, fetcher, TOKEN);
    expect(sent.some((s) => s.url.includes("raw.githubusercontent.com"))).toBe(false);
  });

  it("with no token, nothing changes: raw requests, and no options at all", async () => {
    const { fetcher, sent } = fakeWithInit({
      [API]: okRepo,
      [TREE]: { status: 200, body: tree(["docs/BACKLOG.md"]) },
      [`${RAW}/docs/BACKLOG.md`]: { status: 200, body: "b" },
    });
    await loadRepo(ref, fetcher);
    await loadRepo(ref, fetcher, null);
    expect(sent.every((s) => s.init === undefined)).toBe(true);
    expect(sent.some((s) => s.url.startsWith("https://raw.githubusercontent.com/"))).toBe(true);
  });
});

describe("loadRepo with a token (3.8): the answers", () => {
  const repoThenTree = (second: TokenAnswer) => ({ [API]: okRepo, [TREE]: second });

  it.each([
    ["request 1", { [API]: { status: 401 } }],
    ["request 2", repoThenTree({ status: 401 })],
    [
      "request 3",
      {
        ...repoThenTree({ status: 200, body: tree(["BACKLOG.md"]) }),
        [contents("BACKLOG.md")]: { status: 401 },
      },
    ],
  ])(
    "401 on %s: the token was refused, and the message says it is forgotten",
    async (_n, answers) => {
      const { fetcher } = fakeWithInit(answers);
      const r = await loadRepo(ref, fetcher, TOKEN);
      expect(r).toMatchObject({ ok: false, kind: "token-refused", status: 401 });
      expect(!r.ok && r.message).toBe(
        "GitHub refused the token for acme: it may have expired. It has been forgotten; enter a new one.",
      );
    },
  );

  it("401 names the owner of the address in lower case, and never the token", async () => {
    const { fetcher } = fakeWithInit({
      "https://api.github.com/repos/Acme/Widgets": { status: 401 },
    });
    const r = await loadRepo({ owner: "Acme", repo: "Widgets", branch: null }, fetcher, TOKEN);
    expect(!r.ok && r.message).toBe(
      "GitHub refused the token for acme: it may have expired. It has been forgotten; enter a new one.",
    );
    expect(!r.ok && r.message).not.toContain(TOKEN);
  });

  it("401 without a token is an ordinary HTTP status, as in 3.1", async () => {
    const { fetcher } = fakeWithInit({ [API]: { status: 401 } });
    expect(await loadRepo(ref, fetcher)).toMatchObject({ ok: false, kind: "http", status: 401 });
  });

  it("403 with no requests left: the rate limit is reached, and when it resets", async () => {
    const { fetcher } = fakeWithInit({
      [API]: {
        status: 403,
        headers: { "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "1793700000" },
      },
    });
    const r = await loadRepo(ref, fetcher, TOKEN);
    expect(r).toMatchObject({ ok: false, kind: "rate-limit", status: 403 });
    expect(!r.ok && r.message).toBe(
      "GitHub's rate limit is reached. It resets at 2026-11-03 10:00:00 UTC.",
    );
  });

  it("403 at the rate limit without a reset header still says the limit is reached", async () => {
    const { fetcher } = fakeWithInit({
      [API]: { status: 403, headers: { "X-RateLimit-Remaining": "0" } },
    });
    const r = await loadRepo(ref, fetcher, TOKEN);
    expect(r).toMatchObject({ ok: false, kind: "rate-limit" });
    expect(!r.ok && r.message).toBe("GitHub's rate limit is reached.");
  });

  it.each([
    ["requests left", { "X-RateLimit-Remaining": "42" }],
    ["no rate limit header", {}],
    ["a rate limit header that is not a number", { "X-RateLimit-Remaining": "soon" }],
  ])("403 with %s: the token may not read this repo", async (_n, headers) => {
    const { fetcher } = fakeWithInit({ [API]: { status: 403, headers } });
    const r = await loadRepo(ref, fetcher, TOKEN);
    expect(r).toMatchObject({ ok: false, kind: "forbidden", status: 403 });
    expect(!r.ok && r.message).toBe(
      'GitHub says the token may not read this repo: it may lack the "Contents: read" permission, or an organisation\'s token policy may stop it.',
    );
  });

  it.each([
    ["request 1", { [API]: { status: 404 } }],
    ["request 2", { [API]: okRepo, [TREE]: { status: 404 } }],
  ])("404 on %s: not found, or the token does not give access", async (_n, answers) => {
    const { fetcher } = fakeWithInit(answers);
    const r = await loadRepo(ref, fetcher, TOKEN);
    expect(r).toMatchObject({ ok: false, kind: "not-found", status: 404 });
    expect(!r.ok && r.message).toBe("Not found, or the token does not give access to this repo.");
  });

  it("404 on a file request is shown as a status, as in 3.1", async () => {
    const { fetcher } = fakeWithInit({
      [API]: okRepo,
      [TREE]: { status: 200, body: tree(["BACKLOG.md"]) },
      [contents("BACKLOG.md")]: { status: 404 },
    });
    expect(await loadRepo(ref, fetcher, TOKEN)).toMatchObject({
      ok: false,
      kind: "http",
      status: 404,
    });
  });

  it("any other status is shown with the status, and does not retry", async () => {
    const { fetcher, sent } = fakeWithInit({ [API]: { status: 502 } });
    const r = await loadRepo(ref, fetcher, TOKEN);
    expect(sent).toHaveLength(1);
    expect(r).toMatchObject({ ok: false, kind: "http", status: 502 });
  });
});

describe("loadRepo with a token (3.8): the token is never in a message", () => {
  it("a fetcher that throws an error quoting the token gives a message with the host only", async () => {
    const fetcher: Fetcher = async () => {
      throw new TypeError(`Failed to execute 'fetch': Invalid value 'Bearer ${TOKEN}'`);
    };
    const r = await loadRepo(ref, fetcher, TOKEN);
    expect(r).toMatchObject({ ok: false, kind: "network", status: null });
    expect(!r.ok && r.message).toBe("The request to api.github.com failed.");
    expect(JSON.stringify(r)).not.toContain(TOKEN);
  });

  it("an error that is not an Error object is not shown either", async () => {
    const fetcher: Fetcher = async () => {
      throw `Bearer ${TOKEN}`;
    };
    const r = await loadRepo(ref, fetcher, TOKEN);
    expect(JSON.stringify(r)).not.toContain(TOKEN);
  });

  it("a failure to read the answer quotes nothing", async () => {
    const fetcher: Fetcher = async () => ({
      status: 200,
      text: async () => {
        throw new Error(`stream broke near ${TOKEN}`);
      },
    });
    const r = await loadRepo(ref, fetcher, TOKEN);
    expect(r).toMatchObject({ ok: false, kind: "network" });
    expect(JSON.stringify(r)).not.toContain(TOKEN);
  });

  it("no failure of any kind carries the token", async () => {
    for (const status of [400, 401, 403, 404, 429, 500]) {
      const { fetcher } = fakeWithInit({
        [API]: { status, headers: { "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "1" } },
      });
      expect(JSON.stringify(await loadRepo(ref, fetcher, TOKEN))).not.toContain(TOKEN);
    }
  });

  it("without a token the network message is as before (3.1)", async () => {
    const fetcher: Fetcher = async () => {
      throw new TypeError("Failed to fetch");
    };
    const r = await loadRepo(ref, fetcher);
    expect(!r.ok && r.message).toContain("Failed to fetch");
  });
});

// ------------------------------------------------------- PROJECTS.md and one file (3.9)

describe("loadRepo: PROJECTS.md (3.9)", () => {
  const withProjects = {
    [API]: okRepo,
    [TREE]: { status: 200, body: tree(["docs/BACKLOG.md", "STATUS.md", "PROJECTS.md"]) },
  };

  it("reads it with one more request 3, after the backlog file and STATUS.md, only if the file list has it", async () => {
    const { fetcher, calls } = fake({
      [API]: withProjects[API],
      [`${API}/git/trees/main?recursive=1`]: withProjects[TREE],
      [`${RAW}/docs/BACKLOG.md`]: { status: 200, body: "b" },
      [`${RAW}/STATUS.md`]: { status: 200, body: "s" },
      [`${RAW}/PROJECTS.md`]: { status: 200, body: "# P\n- acme/a\n" },
    });
    const r = await loadRepo(ref, fetcher);
    expect(calls).toEqual([
      API,
      `${API}/git/trees/main?recursive=1`,
      `${RAW}/docs/BACKLOG.md`,
      `${RAW}/STATUS.md`,
      `${RAW}/PROJECTS.md`,
    ]);
    expect(r.ok && r.projectsText).toBe("# P\n- acme/a\n");
  });

  it("reads only the root file: a PROJECTS.md in a folder is not requested", async () => {
    const { fetcher, calls } = fake({
      [API]: okRepo,
      [`${API}/git/trees/main?recursive=1`]: {
        status: 200,
        body: tree(["docs/PROJECTS.md", "projects/x/PROJECTS.md"]),
      },
    });
    const r = await loadRepo(ref, fetcher);
    expect(calls).toHaveLength(2);
    expect(r.ok && r.projectsText).toBeNull();
  });

  it("a project with PROJECTS.md and no backlog file still reads PROJECTS.md", async () => {
    const { fetcher, calls } = fake({
      [API]: okRepo,
      [`${API}/git/trees/main?recursive=1`]: { status: 200, body: tree(["PROJECTS.md"]) },
      [`${RAW}/PROJECTS.md`]: { status: 200, body: "p" },
    });
    const r = await loadRepo(ref, fetcher);
    expect(calls).toHaveLength(3);
    expect(r.ok && [r.backlogPath, r.projectsText]).toEqual([null, "p"]);
  });

  it("a failed PROJECTS.md request fails the load with its status, as for the other files", async () => {
    const { fetcher } = fake({
      [API]: okRepo,
      [`${API}/git/trees/main?recursive=1`]: { status: 200, body: tree(["PROJECTS.md"]) },
      [`${RAW}/PROJECTS.md`]: { status: 500 },
    });
    expect(await loadRepo(ref, fetcher)).toMatchObject({ ok: false, kind: "http", status: 500 });
  });

  it("with a token it goes through the contents API with the raw media type, and no request leaves api.github.com", async () => {
    const { fetcher, sent } = fakeWithInit({
      [API]: okRepo,
      [TREE]: withProjects[TREE],
      [contents("docs/BACKLOG.md")]: { status: 200, body: "b" },
      [contents("STATUS.md")]: { status: 200, body: "s" },
      [contents("PROJECTS.md")]: { status: 200, body: "p" },
    });
    const r = await loadRepo(ref, fetcher, TOKEN);
    expect(r.ok && r.projectsText).toBe("p");
    const last = sent[sent.length - 1];
    expect(last?.url).toBe(contents("PROJECTS.md"));
    expect(last?.init?.headers?.Accept).toBe("application/vnd.github.raw+json");
    expect(last?.init?.headers?.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(sent.every((s) => new URL(s.url).host === "api.github.com")).toBe(true);
  });

  it("with a token, a 401 for PROJECTS.md is the refused-token failure", async () => {
    const { fetcher } = fakeWithInit({
      [API]: okRepo,
      [TREE]: { status: 200, body: tree(["PROJECTS.md"]) },
      [contents("PROJECTS.md")]: { status: 401 },
    });
    expect(await loadRepo(ref, fetcher, TOKEN)).toMatchObject({ ok: false, kind: "token-refused" });
  });
});

describe("readRepoFile: one file of a repo (3.9, Show status)", () => {
  const at = { owner: "acme", repo: "widgets", branch: "main" };
  const PATH = "projects/notes/STATUS.md";

  it("without a token: one raw request, no options, the text back", async () => {
    const { fetcher, sent } = fakeWithInit({
      [`${RAW}/${PATH}`]: { status: 200, body: "status text" },
    });
    expect(await readRepoFile(at, PATH, fetcher, null)).toEqual({ ok: true, text: "status text" });
    expect(sent).toEqual([{ url: `${RAW}/${PATH}`, init: undefined }]);
  });

  it("with a token: the contents API, encoded, the raw media type, Bearer, no cookies, no store", async () => {
    const { fetcher, sent } = fakeWithInit({
      [`${API}/contents/projects/notes/STATUS.md?ref=feat%2Fx`]: { status: 200, body: "t" },
    });
    const r = await readRepoFile({ ...at, branch: "feat/x" }, PATH, fetcher, TOKEN);
    expect(r).toEqual({ ok: true, text: "t" });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.init).toEqual({
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github.raw+json" },
      credentials: "omit",
      cache: "no-store",
    });
    expect(sent[0]?.url).not.toContain(TOKEN);
  });

  it.each([
    [404, "http"],
    [500, "http"],
  ])(
    "a %i answer is a failure shown with its status (kind %s), not a not-found for the repo",
    async (status, kind) => {
      const { fetcher } = fakeWithInit({ [`${RAW}/${PATH}`]: { status } });
      expect(await readRepoFile(at, PATH, fetcher, null)).toMatchObject({
        ok: false,
        kind,
        status,
      });
    },
  );

  it("with a token: 401 is token-refused, 403 is forbidden, and no message holds the token", async () => {
    for (const [status, kind] of [
      [401, "token-refused"],
      [403, "forbidden"],
    ] as const) {
      const { fetcher } = fakeWithInit({ [contents(PATH)]: { status } });
      const r = await readRepoFile(at, PATH, fetcher, TOKEN);
      expect(r).toMatchObject({ ok: false, kind, status });
      expect(JSON.stringify(r)).not.toContain(TOKEN);
    }
  });

  it("a thrown fetch error is a network failure; with a token its text is never shown", async () => {
    const fetcher: Fetcher = async () => {
      throw new TypeError(`bad Bearer ${TOKEN}`);
    };
    const r = await readRepoFile(at, PATH, fetcher, TOKEN);
    expect(r).toMatchObject({ ok: false, kind: "network" });
    expect(JSON.stringify(r)).not.toContain(TOKEN);
  });
});
