/**
 * Tests for src/guide.ts: the opening guide of docs/SPEC.md 3.1, "Guided
 * opening" (PBI-1.19). What it reads from the Repository field, the request
 * kind for an owner, one page of repos, the cap, the messages, which owner
 * lists are kept, and reads abandoned on a token change. A fake fetcher
 * stands in for the network; no test reaches it. Tokens are synthetic.
 */
import type { Fetcher, LoadFailure } from "./github";
import {
  branchView,
  createOwnerLists,
  guardFetcher,
  isKept,
  mergeRepoPages,
  type OwnerRead,
  ownerView,
  READING_BRANCHES,
  readGuideText,
  readingView,
  readOwnerRepos,
  readRepoBranches,
  readRepoPage,
  repoListKind,
} from "./guide";

const TOKEN = "github_pat_TEST_guide_abcd1234";
const USERS = "https://api.github.com/users";

type Answer = { status: number; body?: string; headers?: Record<string, string> };

function fake(answers: Record<string, Answer>): { fetcher: Fetcher; calls: string[] } {
  const calls: string[] = [];
  const fetcher: Fetcher = async (url) => {
    calls.push(url);
    const a = answers[url];
    if (!a) throw new Error(`unexpected request ${url}`);
    const headers = new Map(Object.entries(a.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
    return {
      status: a.status,
      text: async () => a.body ?? "",
      headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
    };
  };
  return { fetcher, calls };
}

const repos = (from: number, n: number, login = "acme") =>
  JSON.stringify(
    Array.from({ length: n }, (_, i) => ({
      name: `r${String(from + i).padStart(3, "0")}`,
      owner: { login },
    })),
  );
const orgPage = (n: number) =>
  `https://api.github.com/orgs/acme/repos?type=all&sort=full_name&per_page=100&page=${n}`;
const userPage = (n: number) =>
  `${USERS}/acme/repos?type=owner&sort=full_name&per_page=100&page=${n}`;
const minePage = (n: number) =>
  `https://api.github.com/user/repos?affiliation=owner&sort=full_name&per_page=100&page=${n}`;
const isOrg = { status: 200, body: JSON.stringify({ login: "acme", type: "Organization" }) };
const isUser = { status: 200, body: JSON.stringify({ login: "acme", type: "User" }) };

describe("readGuideText: what the opening guide reads from the field (3.1)", () => {
  it.each([
    ["acme", "acme", false],
    ["acme/", "acme", true],
    ["  acme  ", "acme", false],
    ["Acme/", "Acme", true],
    // Text that only looks like a host is an owner (Clead's call).
    ["https", "https", false],
    ["http", "http", false],
    ["gist.github.com/", "gist.github.com", true],
  ])("%j is an owner alone", (text, owner, slash) => {
    expect(readGuideText(text)).toEqual({ kind: "owner", owner, slash });
  });

  it.each([
    ["acme/widgets", "acme", "widgets"],
    ["acme/widgets/", "acme", "widgets"],
    [" Acme/Widgets ", "Acme", "Widgets"],
  ])("%j is an owner and a repo", (text, owner, repo) => {
    expect(readGuideText(text)).toEqual({ kind: "repo", owner, repo });
  });

  it.each([
    "github.com/acme/widgets",
    "https://github.com/acme",
    "https://github.com/acme/widgets",
    "www.github.com/acme/widgets",
    "acme/widgets/tree/main",
    "acme/widgets.git",
    "acme//",
    "ac me",
    ".",
    "..",
    "./",
    "../",
    "",
    "   ",
    "github.com",
    "github.com/",
    "GitHub.com/",
    "www.github.com",
    "www.github.com/",
    "https:",
    "https:/",
    "https://",
    "http://gi",
    "HTTP:",
    "acme/widgets?x=1",
  ])("%j is not guided", (text) => {
    expect(readGuideText(text)).toEqual({ kind: "none" });
  });
});

describe("repoListKind: which request lists an owner's repos (3.1)", () => {
  it("an organisation: /orgs/<owner>/repos, with a token or without", () => {
    expect(repoListKind("Organization", false)).toBe("org");
    expect(repoListKind("Organization", true)).toBe("org");
  });
  it("a user with a token for that owner: /user/repos", () => {
    expect(repoListKind("User", true)).toBe("user-token");
  });
  it("a user without one: /users/<owner>/repos", () => {
    expect(repoListKind("User", false)).toBe("user");
  });
});

describe("readRepoPage and mergeRepoPages: one page of repos, then all pages (3.1)", () => {
  it("skips an item without a valid name, and counts every item", () => {
    const page = readRepoPage(
      JSON.stringify([
        { name: "widgets" },
        { name: "" },
        { name: "ac me" },
        { name: ".." },
        { name: 7 },
        "widgets",
        null,
        [],
        { full_name: "acme/x" },
        { name: "gadgets" },
      ]),
      null,
    );
    expect(page).toEqual({ ok: true, names: ["widgets", "gadgets"], count: 10 });
  });

  it("for /user/repos, drops the items of another owner, without regard to case", () => {
    const page = readRepoPage(
      JSON.stringify([
        { name: "a", owner: { login: "ACME" } },
        { name: "b", owner: { login: "other" } },
        { name: "c" },
        { name: "d", owner: { login: "acme" } },
      ]),
      "acme",
    );
    expect(page).toEqual({ ok: true, names: ["a", "d"], count: 4 });
  });

  it.each(['{"message":"no"}', "not json", "null", '"x"'])("an answer %j is not a list", (text) => {
    expect(readRepoPage(text, null)).toEqual({ ok: false });
  });

  it("lists a repeat once, and sorts by character codes", () => {
    expect(
      mergeRepoPages([
        ["b", "a", "Z"],
        ["a", "_x", "B"],
      ]),
    ).toEqual(["B", "Z", "_x", "a", "b"]);
  });
});

describe("readOwnerRepos: the owner's requests, pages and cap (3.1)", () => {
  it("an organisation: /users/<owner>, then its repo pages", async () => {
    const { fetcher, calls } = fake({
      [`${USERS}/acme`]: isOrg,
      [orgPage(1)]: { status: 200, body: JSON.stringify([{ name: "widgets" }, { name: "a" }]) },
    });
    const r = await readOwnerRepos("acme", null, fetcher);
    expect(calls).toEqual([`${USERS}/acme`, orgPage(1)]);
    expect(r).toMatchObject({ names: ["a", "widgets"], failure: null, more: false, pagesRead: 1 });
    expect(isKept(r)).toBe(true);
  });

  it("a user without a token: /users/<owner>/repos", async () => {
    const { fetcher, calls } = fake({
      [`${USERS}/acme`]: isUser,
      [userPage(1)]: { status: 200, body: repos(0, 2) },
    });
    await readOwnerRepos("acme", null, fetcher);
    expect(calls).toEqual([`${USERS}/acme`, userPage(1)]);
  });

  it("a user with a token: /user/repos, keeping only that owner's repos", async () => {
    const { fetcher, calls } = fake({
      [`${USERS}/acme`]: isUser,
      [minePage(1)]: {
        status: 200,
        body: JSON.stringify([
          { name: "mine", owner: { login: "acme" } },
          { name: "theirs", owner: { login: "beta" } },
        ]),
      },
    });
    const r = await readOwnerRepos("acme", TOKEN, fetcher);
    expect(calls).toEqual([`${USERS}/acme`, minePage(1)]);
    expect(r.names).toEqual(["mine"]);
  });

  it("a token of another account: page 1 leaves no item, so no page 2, and the empty list counts as read in full", async () => {
    const { fetcher, calls } = fake({
      [`${USERS}/acme`]: isUser,
      [minePage(1)]: { status: 200, body: repos(0, 100, "someone-else") },
    });
    const r = await readOwnerRepos("acme", TOKEN, fetcher);
    expect(calls).toEqual([`${USERS}/acme`, minePage(1)]);
    expect(r).toMatchObject({ names: [], failure: null, more: false });
    expect(isKept(r)).toBe(true);
  });

  it("the cap by items: 100, 100, 100 with one skipped is past the cap (more may exist), and not kept", async () => {
    const third = JSON.parse(repos(200, 100)) as unknown[];
    third[5] = { name: "bad name" };
    const { fetcher, calls } = fake({
      [`${USERS}/acme`]: isOrg,
      [orgPage(1)]: { status: 200, body: repos(0, 100) },
      [orgPage(2)]: { status: 200, body: repos(100, 100) },
      [orgPage(3)]: { status: 200, body: JSON.stringify(third) },
    });
    const r = await readOwnerRepos("acme", null, fetcher);
    expect(calls).toHaveLength(4);
    expect(r.names).toHaveLength(299);
    expect(r).toMatchObject({ more: true, failure: null, pagesRead: 3 });
    expect(isKept(r)).toBe(false);
  });

  it("100 and 37: not past the cap, no page 3", async () => {
    const { fetcher, calls } = fake({
      [`${USERS}/acme`]: isOrg,
      [orgPage(1)]: { status: 200, body: repos(0, 100) },
      [orgPage(2)]: { status: 200, body: repos(100, 37) },
    });
    const r = await readOwnerRepos("acme", null, fetcher);
    expect(calls).toHaveLength(3);
    expect(r).toMatchObject({ more: false, pagesRead: 2 });
    expect(r.names).toHaveLength(137);
    expect(isKept(r)).toBe(true);
  });

  it.each([
    ["an array", "[]"],
    ["no type", JSON.stringify({ login: "acme" })],
    ['"type": "Bot"', JSON.stringify({ login: "acme", type: "Bot" })],
  ])("/users/<owner> answered with %s: not understood, and no repo request", async (_n, body) => {
    const { fetcher, calls } = fake({ [`${USERS}/acme`]: { status: 200, body } });
    const r = await readOwnerRepos("acme", null, fetcher);
    expect(calls).toEqual([`${USERS}/acme`]);
    expect(r.failure?.message).toBe("GitHub's answer for acme was not understood.");
    expect(ownerView(r, true)).toEqual({
      options: null,
      message: "The repo list could not be read: GitHub's answer for acme was not understood.",
    });
  });

  it("a page that is not a list: the repo-list message", async () => {
    const { fetcher } = fake({
      [`${USERS}/acme`]: isOrg,
      [orgPage(1)]: { status: 200, body: "{}" },
    });
    const r = await readOwnerRepos("acme", null, fetcher);
    expect(ownerView(r, true).message).toBe(
      "The repo list could not be read: GitHub's answer for the repo list was not understood.",
    );
    expect(isKept(r)).toBe(false);
  });

  it("a failure on page 2: page 1's names, the incomplete message, not kept", async () => {
    const { fetcher } = fake({
      [`${USERS}/acme`]: isOrg,
      [orgPage(1)]: { status: 200, body: repos(0, 100) },
      [orgPage(2)]: { status: 500 },
    });
    const r = await readOwnerRepos("acme", null, fetcher);
    expect(r.names).toHaveLength(100);
    expect(isKept(r)).toBe(false);
    const view = ownerView(r, true);
    expect(view.options).toHaveLength(100);
    expect(view.message).toBe(
      `The repo list is incomplete: GitHub answered HTTP 500 for ${orgPage(2)}. Choose one of acme's repos, or type acme/<repo>.`,
    );
  });
});

describe("the opening guide's messages for an owner alone (3.1)", () => {
  const read = (over: Partial<OwnerRead>): OwnerRead => ({
    owner: "acme",
    token: null,
    names: ["widgets"],
    failure: null,
    pagesRead: 1,
    more: false,
    ...over,
  });
  const fail = (kind: LoadFailure["kind"], message: string, status: number | null = null) =>
    ({ ok: false, kind, status, message }) as LoadFailure;

  it("a blur or Open with at least one repo: the select and the Choose one message", () => {
    expect(ownerView(read({}), true)).toEqual({
      options: ["widgets"],
      message: "Choose one of acme's repos, or type acme/<repo>.",
    });
  });

  it("while typing (no blur yet): no select, and no Choose one message", () => {
    expect(ownerView(read({}), false)).toEqual({ options: null, message: "" });
  });

  it("while the read is running: Reading…, no select", () => {
    expect(readingView("acme")).toEqual({ options: null, message: "Reading acme's repos…" });
  });

  it("past the cap: the past-cap message before Choose one", () => {
    expect(ownerView(read({ more: true, pagesRead: 3 }), true).message).toBe(
      "vizi lists the first 300 repos GitHub gives for acme. Type the repo's name to open another. Choose one of acme's repos, or type acme/<repo>.",
    );
    expect(ownerView(read({ more: true, pagesRead: 3 }), false).message).toBe(
      "vizi lists the first 300 repos GitHub gives for acme. Type the repo's name to open another.",
    );
  });

  it("404 on /users/<owner>: no account, no select", () => {
    const r = read({
      names: [],
      pagesRead: 0,
      failure: fail("not-found", "GitHub has no account named acme.", 404),
    });
    expect(ownerView(r, true)).toEqual({
      options: null,
      message: "GitHub has no account named acme.",
    });
  });

  it("a 403 at the rate limit on /users/<owner>: the repo-list wording", () => {
    const r = read({
      names: [],
      pagesRead: 0,
      failure: fail("http", "GitHub answered HTTP 403 for https://api.github.com/users/acme.", 403),
    });
    expect(ownerView(r, true)).toEqual({
      options: null,
      message:
        "The repo list could not be read: GitHub answered HTTP 403 for https://api.github.com/users/acme.",
    });
  });

  it("an owner with no repos, without a token, and with one", () => {
    expect(ownerView(read({ names: [] }), true)).toEqual({
      options: null,
      message: "acme has no repos vizi can see.",
    });
    expect(ownerView(read({ names: [], token: TOKEN }), true)).toEqual({
      options: null,
      message:
        "acme has no repos vizi can see with its token. If the token belongs to another account, add one made by acme, or type acme/<repo>.",
    });
  });

  it("a 401 is not shown in the guide's line (3.8's message goes to #message)", () => {
    const r = read({ names: [], pagesRead: 0, failure: fail("token-refused", "refused", 401) });
    expect(ownerView(r, true)).toEqual({ options: null, message: "" });
  });
});

describe("readRepoBranches and branchView: a repo's default and its branches (3.1)", () => {
  const REPO = "https://api.github.com/repos/acme/widgets";
  const page = (n: number) => `${REPO}/branches?per_page=100&page=${n}`;
  const branches = (names: string[]) => JSON.stringify(names.map((name) => ({ name })));

  it("request 1 for the default, then 3.13's branch request; the default first and selected", async () => {
    const { fetcher, calls } = fake({
      [REPO]: { status: 200, body: JSON.stringify({ default_branch: "master" }) },
      [page(1)]: { status: 200, body: branches(["dev", "master", "a#b"]) },
    });
    const r = await readRepoBranches({ owner: "acme", repo: "widgets" }, null, fetcher);
    expect(calls).toEqual([REPO, page(1)]);
    const view = branchView("acme", "widgets", r);
    expect(view.message).toBe("");
    expect(view.options?.map((o) => [o.label, o.selected, o.disabled])).toEqual([
      ["master (default)", true, false],
      ["a#b (cannot be opened in vizi)", false, true],
      ["dev", false, false],
    ]);
  });

  it("a repo answer without default_branch: the no-default message, no branch request, no select", async () => {
    const { fetcher, calls } = fake({ [REPO]: { status: 200, body: "{}" } });
    const r = await readRepoBranches({ owner: "acme", repo: "widgets" }, null, fetcher);
    expect(calls).toEqual([REPO]);
    expect(branchView("acme", "widgets", r)).toEqual({
      options: null,
      message:
        "The branch list could not be read: GitHub's answer for the repo had no default branch.",
    });
  });

  it("404 on the repo: 3.1's 404 message, or 3.8's with a token, bare", async () => {
    const { fetcher } = fake({ [REPO]: { status: 404 } });
    const anon = await readRepoBranches({ owner: "acme", repo: "widgets" }, null, fetcher);
    expect(branchView("acme", "widgets", anon)).toEqual({
      options: null,
      message: "Not found or not public. If the repo is private, add a token for its owner.",
    });
    const withToken = await readRepoBranches({ owner: "acme", repo: "widgets" }, TOKEN, fetcher);
    expect(branchView("acme", "widgets", withToken).message).toBe(
      "Not found, or the token does not give access to this repo.",
    );
  });

  it("a 403 at the rate limit on the repo: the branch-list wording", async () => {
    const { fetcher } = fake({
      [REPO]: { status: 403, headers: { "X-RateLimit-Remaining": "0" } },
    });
    const r = await readRepoBranches({ owner: "acme", repo: "widgets" }, TOKEN, fetcher);
    expect(branchView("acme", "widgets", r).message).toBe(
      "The branch list could not be read: GitHub's rate limit is reached.",
    );
  });

  it("an empty branch list: no select, no message", async () => {
    const { fetcher } = fake({
      [REPO]: { status: 200, body: JSON.stringify({ default_branch: "main" }) },
      [page(1)]: { status: 200, body: "[]" },
    });
    const r = await readRepoBranches({ owner: "acme", repo: "widgets" }, null, fetcher);
    expect(branchView("acme", "widgets", r)).toEqual({ options: null, message: "" });
  });

  it("a branch list that fails on page 1: no select, 3.13's message; on page 2: the names, incomplete", async () => {
    const first = fake({
      [REPO]: { status: 200, body: JSON.stringify({ default_branch: "main" }) },
      [page(1)]: { status: 500 },
    });
    const r1 = await readRepoBranches({ owner: "acme", repo: "widgets" }, null, first.fetcher);
    expect(branchView("acme", "widgets", r1)).toEqual({
      options: null,
      message: `The branch list could not be read: GitHub answered HTTP 500 for ${page(1)}.`,
    });
    const hundred = Array.from({ length: 100 }, (_, i) => `b${i}`);
    const second = fake({
      [REPO]: { status: 200, body: JSON.stringify({ default_branch: "b0" }) },
      [page(1)]: { status: 200, body: branches(hundred) },
      [page(2)]: { status: 500 },
    });
    const r2 = await readRepoBranches({ owner: "acme", repo: "widgets" }, null, second.fetcher);
    const view = branchView("acme", "widgets", r2);
    expect(view.options).toHaveLength(100);
    expect(view.message).toBe(
      `The branch list is incomplete: GitHub answered HTTP 500 for ${page(2)}.`,
    );
  });

  it("past the cap: 3.13's past-cap message", async () => {
    const all = Array.from({ length: 300 }, (_, i) => `b${String(i).padStart(3, "0")}`);
    const { fetcher } = fake({
      [REPO]: { status: 200, body: JSON.stringify({ default_branch: "b000" }) },
      [page(1)]: { status: 200, body: branches(all.slice(0, 100)) },
      [page(2)]: { status: 200, body: branches(all.slice(100, 200)) },
      [page(3)]: { status: 200, body: branches(all.slice(200)) },
    });
    const r = await readRepoBranches({ owner: "acme", repo: "widgets" }, null, fetcher);
    expect(branchView("acme", "widgets", r).message).toBe(
      "vizi lists the first 300 branches GitHub gives. To open another branch, paste its address, https://github.com/acme/widgets/tree/<branch>, with the branch's name in place of <branch>.",
    );
  });

  it("while reading: Reading the branches…", () => {
    expect(READING_BRANCHES).toBe("Reading the branches…");
  });
});

describe("guardFetcher: an abandoned read makes no further request (3.1)", () => {
  it("refuses before the request once abandoned, with or without a token", async () => {
    const { fetcher, calls } = fake({ "https://api.github.com/x": { status: 200 } });
    let abandoned = false;
    const guarded = guardFetcher(fetcher, () => abandoned);
    await guarded("https://api.github.com/x");
    abandoned = true;
    await expect(guarded("https://api.github.com/x")).rejects.toThrow();
    expect(calls).toHaveLength(1);
  });
});

describe("createOwnerLists: which owner lists are kept, and token changes (3.1)", () => {
  /** A read of acme's list (an organisation) whose page 1, 100 items, waits until `release()`. */
  function heldRead() {
    const calls: string[] = [];
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const base: Fetcher = async (url) => {
      calls.push(url);
      if (url.includes("page=1")) await gate;
      const body = url.endsWith("/users/acme")
        ? JSON.stringify({ type: "Organization" })
        : url.includes("page=1")
          ? repos(0, 100)
          : repos(100, 1);
      return { status: 200, text: async () => body };
    };
    return { base, calls, release: () => release() };
  }

  const listsWith = (fetcherFor: (owner: string) => Fetcher) =>
    createOwnerLists((owner, abandoned) =>
      readOwnerRepos(owner, null, guardFetcher(fetcherFor(owner), abandoned)),
    );

  it("a list read in full is kept, an empty one included, by the owner in lower case", async () => {
    const { fetcher, calls } = fake({
      [`${USERS}/acme`]: isOrg,
      [orgPage(1)]: { status: 200, body: "[]" },
    });
    const lists = listsWith(() => fetcher);
    const first = await lists.read("acme");
    expect(first.abandoned).toBe(false);
    expect(lists.kept("acme")?.names).toEqual([]);
    expect(calls).toHaveLength(2);
    expect(lists.kept("ACME")).toBeDefined();
  });

  it("a running read serves a second ask: the requests are made once", async () => {
    const { base, calls, release } = heldRead();
    const lists = listsWith(() => base);
    const a = lists.read("acme");
    const b = lists.read("acme");
    expect(lists.reading("acme")).toBe(true);
    release();
    await Promise.all([a, b]);
    expect(calls.filter((u) => u.endsWith("/users/acme"))).toHaveLength(1);
    expect(lists.reading("acme")).toBe(false);
  });

  it.each([
    ["failed", { [`${USERS}/acme`]: { status: 500 } }],
    [
      "partly read",
      {
        [`${USERS}/acme`]: isOrg,
        [orgPage(1)]: { status: 200, body: repos(0, 100) },
        [orgPage(2)]: { status: 500 },
      },
    ],
    [
      "capped",
      {
        [`${USERS}/acme`]: isOrg,
        [orgPage(1)]: { status: 200, body: repos(0, 100) },
        [orgPage(2)]: { status: 200, body: repos(100, 100) },
        [orgPage(3)]: { status: 200, body: repos(200, 100) },
      },
    ],
  ] as const)("a %s list is not kept, so it is read again", async (_n, answers) => {
    const { fetcher, calls } = fake(answers as Record<string, Answer>);
    const lists = listsWith(() => fetcher);
    await lists.read("acme");
    expect(lists.kept("acme")).toBeUndefined();
    const before = calls.length;
    await lists.read("acme");
    expect(calls.length).toBeGreaterThan(before);
  });

  it("a token change for its owner abandons the running read: no page 2, its answer not kept", async () => {
    const { base, calls, release } = heldRead();
    const lists = listsWith(() => base);
    const running = lists.read("acme");
    // Wait until page 1 has been asked for (its answer is held back).
    while (!calls.some((u) => u.includes("page=1"))) await new Promise((r) => setTimeout(r, 0));
    lists.tokenChanged("acme");
    release();
    const outcome = await running;
    expect(outcome.abandoned).toBe(true);
    expect(lists.kept("acme")).toBeUndefined();
    expect(lists.reading("acme")).toBe(false);
    expect(calls.filter((u) => u.includes("page=2"))).toEqual([]);
  });

  it("a token change abandons a read before its next request", async () => {
    const calls: string[] = [];
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const base: Fetcher = async (url) => {
      calls.push(url);
      if (url.endsWith("/users/acme")) await gate;
      return { status: 200, text: async () => JSON.stringify({ type: "Organization" }) };
    };
    const lists = listsWith(() => base);
    const running = lists.read("acme");
    lists.tokenChanged("acme");
    release();
    expect((await running).abandoned).toBe(true);
    // /users/acme had been asked; no repo page after the change.
    expect(calls).toEqual([`${USERS}/acme`]);
  });

  it("a read for another owner goes on, and is kept", async () => {
    const { fetcher } = fake({
      [`${USERS}/beta`]: { status: 200, body: JSON.stringify({ type: "User" }) },
      [`${USERS}/beta/repos?type=owner&sort=full_name&per_page=100&page=1`]: {
        status: 200,
        body: repos(0, 2, "beta"),
      },
    });
    const lists = listsWith(() => fetcher);
    const running = lists.read("beta");
    lists.tokenChanged("acme");
    expect((await running).abandoned).toBe(false);
    expect(lists.kept("beta")?.names).toHaveLength(2);
  });

  it("a kept list is dropped on a token change for its owner, and kept on a change for another", async () => {
    const { fetcher } = fake({
      [`${USERS}/acme`]: isOrg,
      [orgPage(1)]: { status: 200, body: repos(0, 1) },
    });
    const lists = listsWith(() => fetcher);
    await lists.read("acme");
    lists.tokenChanged("beta");
    expect(lists.kept("acme")).toBeDefined();
    lists.tokenChanged("ACME");
    expect(lists.kept("acme")).toBeUndefined();
  });

  it("every kind of token change: one owner's (Add, Forget, a 401, another tab), and all tokens", async () => {
    const { fetcher } = fake({
      [`${USERS}/acme`]: isOrg,
      [orgPage(1)]: { status: 200, body: repos(0, 1) },
    });
    const lists = listsWith(() => fetcher);
    await lists.read("acme");
    lists.tokenChanged(null);
    expect(lists.kept("acme")).toBeUndefined();
  });
});
