/**
 * Tests for src/github.ts: the GitHub input of docs/SPEC.md 3.1.
 * A fake fetcher stands in for the network; no test reaches it.
 */
import { blobUrl, type Fetcher, loadRepo, parseGithubUrl } from "./github";

describe("parseGithubUrl", () => {
  it("reads owner and repo", () => {
    expect(parseGithubUrl("https://github.com/acme/widgets")).toEqual({
      owner: "acme",
      repo: "widgets",
      branch: null,
    });
    expect(parseGithubUrl("  https://github.com/acme/widgets/  ")).toEqual({
      owner: "acme",
      repo: "widgets",
      branch: null,
    });
  });

  it("takes everything after /tree/ as the branch, a trailing slash dropped", () => {
    expect(parseGithubUrl("https://github.com/acme/widgets/tree/feat/new-thing/")).toEqual({
      owner: "acme",
      repo: "widgets",
      branch: "feat/new-thing",
    });
  });

  it.each([
    "",
    "acme/widgets",
    "http://github.com/acme/widgets",
    "https://example.com/acme/widgets",
    "https://github.com/acme",
    "https://github.com/../..",
    "https://github.com/./widgets",
    "https://github.com/acme/..",
    "https://github.com/acme/widgets/issues",
    "https://github.com/acme/widgets/tree/",
    "https://github.com/ac me/widgets",
    "https://github.com/acme/widgets?x=1",
    "javascript:alert(1)",
  ])("refuses %j", (input) => {
    expect(parseGithubUrl(input)).toBeNull();
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
    expect(!r.ok && r.message).toBe(
      "Not found or not public. Open the project as a local folder instead.",
    );
  });

  it("says not found or not public on a 404 for request 2", async () => {
    const { fetcher } = fake({
      [API]: { status: 200, body: JSON.stringify({ default_branch: "main" }) },
      [`${API}/git/trees/main?recursive=1`]: { status: 404 },
    });
    expect(await loadRepo(ref, fetcher)).toMatchObject({ ok: false, kind: "not-found" });
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
