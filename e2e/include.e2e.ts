/**
 * Browser tests for the include keyword (docs/SPEC.md 3.15). GitHub's
 * answers are stubbed with routes: no test reaches the network. Every file
 * is made up for the test, and every token is an obviously fake value.
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { type BrowserContext, test as base, expect, type Page, type Route } from "@playwright/test";
import { isAllowedRequest } from "./guard";
import { openPanel } from "./panel";
import { branchListRead } from "./picker";

/**
 * Every test: a request other than the page's own document and GitHub's two
 * hosts fails it (SPEC 2.3, 3.7 item 5), and so does a console error or an
 * uncaught error. Chromium's own "Failed to load resource" line for a
 * stubbed answer that is not 2xx is the browser's note on the network, not
 * an error of the page, and is not counted.
 */
const test = base.extend<{ guard: undefined }>({
  guard: [
    async ({ page, baseURL }, use) => {
      const stray: string[] = [];
      const problems: string[] = [];
      const own = [`${baseURL}/`, pathToFileURL(join(__dirname, "..", "dist", "index.html")).href];
      page.on("request", (r) => {
        if (!isAllowedRequest(r.url(), own)) stray.push(r.url());
      });
      page.on("console", (m) => {
        if (m.type() === "error" && !m.text().startsWith("Failed to load resource:"))
          problems.push(m.text());
      });
      page.on("pageerror", (e) => problems.push(e.message));
      await use(undefined);
      expect(stray, "requests the page should not make").toEqual([]);
      expect(problems, "console errors").toEqual([]);
    },
    { auto: true },
  ],
});

const lines = (...l: string[]) => l.join("\n");
const TOKEN = "github_pat_TEST_include_abcd1234";
const API = "https://api.github.com/repos/acme/widgets";
const RAW = "https://raw.githubusercontent.com/acme/widgets/main";

type FileAnswer = string | { status: number; body?: string };
interface RepoStub {
  /** The files of each branch; the first branch is the default one. */
  branches: Record<string, Record<string, FileAnswer>>;
  /** Requests 1 and 2 answer 404 without an Authorization header. */
  private?: boolean;
  truncated?: boolean;
}
interface Seen {
  url: string;
  headers: Record<string, string>;
}
interface Stub {
  seen: Seen[];
  /** Lets the held request go on. */
  release: () => void;
}

/** Answers GitHub's endpoints for the repos given, on a whole context, recording every GET. */
async function stubGithub(
  context: BrowserContext,
  repos: Record<string, RepoStub>,
  hold?: string,
): Promise<Stub> {
  const seen: Seen[] = [];
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, accept, content-type",
    "access-control-allow-methods": "GET, OPTIONS",
  };
  const file = (answer: FileAnswer | undefined) =>
    answer === undefined
      ? { status: 404, body: "" }
      : typeof answer === "string"
        ? { status: 200, body: answer }
        : answer;
  const answerFor = (url: string, authorized: boolean): { status: number; body?: string } => {
    const u = new URL(url);
    if (u.host === "raw.githubusercontent.com") {
      const [, owner, repo, branch, ...rest] = u.pathname.split("/");
      const stub = repos[`${owner}/${repo}`];
      if (!stub || stub.private || branch === undefined) return { status: 404 };
      return file(stub.branches[branch]?.[rest.join("/")]);
    }
    const m = /^\/repos\/([^/]+)\/([^/]+)(?:\/(.*))?$/.exec(u.pathname);
    const stub = m ? repos[`${m[1]}/${m[2]}`] : undefined;
    if (!m || !stub || (stub.private && !authorized)) return { status: 404 };
    const rest = m[3];
    const names = Object.keys(stub.branches);
    if (rest === undefined)
      return { status: 200, body: JSON.stringify({ default_branch: names[0] }) };
    if (rest === "branches")
      return { status: 200, body: JSON.stringify(names.map((name) => ({ name }))) };
    if (rest.startsWith("git/trees/")) {
      const files = stub.branches[decodeURIComponent(rest.slice("git/trees/".length))];
      if (!files) return { status: 404 };
      const tree = Object.keys(files).map((path) => ({ path, type: "blob" }));
      return { status: 200, body: JSON.stringify({ truncated: stub.truncated ?? false, tree }) };
    }
    if (rest.startsWith("contents/")) {
      const path = rest.slice("contents/".length).split("/").map(decodeURIComponent).join("/");
      return file(stub.branches[u.searchParams.get("ref") ?? ""]?.[path]);
    }
    return { status: 404 };
  };
  await context.route(
    /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//,
    async (route: Route) => {
      const request = route.request();
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      const url = request.url();
      const headers = await request.allHeaders();
      seen.push({ url, headers });
      if (hold === url) await gate;
      const answer = answerFor(url, "authorization" in headers);
      return route.fulfill({ status: answer.status, headers: cors, body: answer.body ?? "" });
    },
  );
  return { seen, release };
}

const urls = (stub: Stub) => stub.seen.map((s) => s.url);

/**
 * Opens a repo by writing the field and submitting the form, without
 * focusing the field, so the opening guide's blur read (3.1) adds no
 * request to the ones these tests count.
 */
async function openRepo(page: Page, repo = "acme/widgets") {
  await page.evaluate((text) => {
    const field = document.getElementById("url-input") as HTMLInputElement;
    field.value = text;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    (document.getElementById("url-form") as HTMLFormElement).requestSubmit();
  }, repo);
}

/** Opens a repo and waits for its results and its branch list. */
async function openLoaded(page: Page, repo = "acme/widgets", branch = "main") {
  await openRepo(page, repo);
  await expect(page.locator("#project-name")).toHaveText(`${repo} (${branch})`);
  await branchListRead(page);
}

async function useToken(page: Page, owner = "acme") {
  await openPanel(page);
  await page.locator("#owner-input").fill(owner);
  await page.locator("#token-input").fill(TOKEN);
  await page.locator("#token-use").click();
  await expect(page.locator(`[data-testid="token-line"][data-owner="${owner}"]`)).toBeVisible();
}

/** Gives the page time to make any request it would make (in the page, so no test clock is involved). */
const settle = (page: Page) => page.evaluate(() => new Promise<void>((r) => setTimeout(r, 250)));

const column = (page: Page, marker: string) =>
  page.locator(`[data-testid="column"][data-marker="${marker}"]`);
const card = (page: Page, id: string) => page.locator(`[data-testid="card"][data-id="${id}"]`);
const reportItems = (page: Page, kind: string) =>
  page.locator(`[data-testid="report-item"][data-kind="${kind}"]`);

/** The example of SPEC 3.15. */
const EXAMPLE_BACKLOG = lines(
  "## Open",
  "",
  "- **[NOW] AB-3** — Draw the chart.",
  "<!-- vizi:include BACKLOG-DONE.md -->",
  "<!-- vizi:include ../OLD.md -->",
  "- **[NEXT] AB-4** — Export the chart.",
);
const EXAMPLE_DONE = lines(
  "## Open",
  "",
  "- **[DONE] AB-1** — Read the data. See [the notes](notes/data.md).",
  "- **[DONE] AB-3** — Draw a first chart.",
  "<!-- vizi:include MORE.md -->",
);
const example = (extra: Partial<RepoStub> = {}): Record<string, RepoStub> => ({
  "acme/widgets": {
    branches: {
      main: {
        "BACKLOG.md": EXAMPLE_BACKLOG,
        "BACKLOG-DONE.md": EXAMPLE_DONE,
        "MORE.md": "- **[DONE] AB-8** — Never shown.",
        "notes/data.md": "# Data",
      },
    },
    ...extra,
  },
});
const INCOMPLETE = "Not every included file could be read; the Report tab lists why.";

test.describe("the board and the list (3.15, What the page shows)", () => {
  test("the DONE column is folded, counts the included entries and shows them, each card naming its file; the backlog file's own cards name none", async ({
    page,
    context,
  }) => {
    await stubGithub(context, example());
    await page.goto("/");
    await openLoaded(page);
    const done = column(page, "DONE");
    await expect(done.locator(":scope > summary .count")).toHaveText("2");
    await expect(done.getByTestId("card")).toHaveCount(2);
    await expect(done.getByTestId("card").first()).toBeHidden();
    await done.locator(":scope > summary").click();
    await expect(done.getByTestId("card")).toHaveText([/AB-1/, /AB-3/]);
    for (const c of await done.getByTestId("card").all())
      await expect(c.locator(".entry-file")).toHaveText("BACKLOG-DONE.md");
    for (const marker of ["NOW", "NEXT"]) {
      await expect(column(page, marker).getByTestId("card")).toHaveCount(1);
      await expect(column(page, marker).locator(".entry-file")).toHaveCount(0);
    }
    await expect(page.locator("#marker-filter option")).toHaveText([
      "All markers",
      "NOW",
      "NEXT",
      "DONE",
    ]);
  });

  test("the list shows the included file's group as <heading> — <path>, apart from the backlog file's groups of the same name", async ({
    page,
    context,
  }) => {
    await stubGithub(context, example());
    await page.goto("/");
    await openLoaded(page);
    await page.getByRole("tab", { name: "List" }).click();
    await expect(page.getByTestId("list-group")).toHaveText([
      "Open",
      "Open — BACKLOG-DONE.md",
      "Open",
    ]);
    await expect(page.getByTestId("list-group").nth(1).locator(".entry-file")).toHaveText(
      "BACKLOG-DONE.md",
    );
    const rows = page.getByTestId("list-row");
    await expect(rows).toHaveCount(4);
    expect(await rows.evaluateAll((els) => els.map((e) => e.getAttribute("data-id")))).toEqual([
      "AB-3",
      "AB-1",
      "AB-3",
      "AB-4",
    ]);
    await expect(rows.nth(1).locator(".entry-file")).toHaveText("BACKLOG-DONE.md");
    await expect(rows.nth(0).locator(".entry-file")).toHaveCount(0);
  });

  test("a relative link in an included entry, the file under docs/, goes to the github.com page of the file beside it", async ({
    page,
    context,
  }) => {
    await stubGithub(context, {
      "acme/widgets": {
        branches: {
          main: {
            "BACKLOG.md": lines("- **[NOW] AB-1** — Own.", "<!-- vizi:include docs/DONE.md -->"),
            "docs/DONE.md": "- **[DONE] AB-2** — Old. See [the notes](notes.md).",
          },
        },
      },
    });
    await page.goto("/");
    await openLoaded(page);
    await column(page, "DONE").locator(":scope > summary").click();
    await card(page, "AB-2").locator("summary").click();
    await expect(card(page, "AB-2").getByRole("link", { name: "the notes" })).toHaveAttribute(
      "href",
      "https://github.com/acme/widgets/blob/main/docs/notes.md",
    );
    await expect(card(page, "AB-2").locator(".entry-file")).toHaveText("docs/DONE.md");
  });

  test("an include line between an entry and the rest of its description: the description holds the lines below it, and the included entries come after the entry", async ({
    page,
    context,
  }) => {
    await stubGithub(context, {
      "acme/widgets": {
        branches: {
          main: {
            "BACKLOG.md": lines(
              "- **[NOW] AB-1** — First.",
              "<!-- vizi:include DONE.md -->",
              "  Rest of AB-1.",
            ),
            "DONE.md": "- **[DONE] AB-2** — Old.",
          },
        },
      },
    });
    await page.goto("/");
    await openLoaded(page);
    await card(page, "AB-1").locator("summary").click();
    await expect(card(page, "AB-1").getByTestId("description")).toHaveText("Rest of AB-1.");
    await page.getByRole("tab", { name: "List" }).click();
    await expect(page.getByTestId("list-group")).toHaveText([
      "(no heading)",
      "(no heading) — DONE.md",
    ]);
    expect(
      await page
        .getByTestId("list-row")
        .evaluateAll((els) => els.map((e) => e.getAttribute("data-id"))),
    ).toEqual(["AB-1", "AB-2"]);
  });
});

test.describe("the Report tab and the message line (3.15)", () => {
  test("lists every item of the example, word for word, with its file and line, by kind and then by file, and counts them", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, example());
    await page.goto("/");
    await openLoaded(page);
    await expect(page.getByRole("tab", { name: /^Report/ })).toHaveText("Report (3)");
    await page.getByRole("tab", { name: /^Report/ }).click();
    await expect(reportItems(page, "error")).toHaveText([
      "BACKLOG.md line 5: Not followed: ../OLD.md leaves the project.",
      "BACKLOG-DONE.md line 5: Not followed: an included file cannot include another file.",
    ]);
    await expect(reportItems(page, "warning")).toHaveText([
      "BACKLOG-DONE.md line 4: The ID AB-3 is also used in BACKLOG.md line 3.",
    ]);
    await expect(reportItems(page, "info")).toHaveCount(0);
    await expect(page.getByTestId("report-count-error")).toHaveText("2");
    await expect(page.getByTestId("report-count-warning")).toHaveText("1");
    await expect(page.locator("#message")).toHaveText(INCOMPLETE);
    // MORE.md is not read, though it exists.
    expect(urls(stub).some((u) => u.includes("MORE.md"))).toBe(false);
  });

  test("an include of a missing file: the load succeeds, #message adds its line, and the report says why; no request is made for it", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      "acme/widgets": {
        branches: {
          main: { "BACKLOG.md": lines("- **[NOW] AB-1** — One.", "<!-- vizi:include gone.md -->") },
        },
      },
    });
    await page.goto("/");
    await openLoaded(page);
    await expect(card(page, "AB-1")).toBeVisible();
    await expect(page.locator("#message")).toHaveText(INCOMPLETE);
    await page.getByRole("tab", { name: /^Report/ }).click();
    await expect(reportItems(page, "error")).toHaveText([
      "BACKLOG.md line 2: Not followed: gone.md is not in the repo on this branch.",
    ]);
    expect(urls(stub).some((u) => u.includes("gone.md"))).toBe(false);
  });

  test("with a truncated file list, the line follows the truncation note, and the report says the file may exist", async ({
    page,
    context,
  }) => {
    await stubGithub(context, {
      "acme/widgets": {
        truncated: true,
        branches: {
          main: { "BACKLOG.md": lines("- **[NOW] AB-1** — One.", "<!-- vizi:include gone.md -->") },
        },
      },
    });
    await page.goto("/");
    await openLoaded(page);
    await expect(page.locator("#message p")).toHaveText([
      "The file list from GitHub was truncated, so the documentation list and file links may be incomplete.",
      INCOMPLETE,
    ]);
    await page.getByRole("tab", { name: /^Report/ }).click();
    await expect(reportItems(page, "error")).toHaveText([
      "BACKLOG.md line 2: Not followed: gone.md is not in the repo on this branch. GitHub's file list was truncated, so the file may exist.",
    ]);
  });

  test("an include that is only a warning adds no line to #message", async ({ page, context }) => {
    await stubGithub(context, {
      "acme/widgets": {
        branches: {
          main: {
            "BACKLOG.md": lines("- **[NOW] AB-1** — One.", "<!-- vizi:include BACKLOG.md -->"),
          },
        },
      },
    });
    await page.goto("/");
    await openLoaded(page);
    await expect(card(page, "AB-1")).toBeVisible();
    await expect(page.locator("#message")).toHaveText("");
    await page.getByRole("tab", { name: /^Report/ }).click();
    await expect(reportItems(page, "warning")).toHaveText([
      "BACKLOG.md line 2: Not followed: the file includes itself.",
    ]);
  });

  test("a failed read of an included file: the load goes on, the other files are shown, and the report gives 3.1's message", async ({
    page,
    context,
  }) => {
    await stubGithub(context, {
      "acme/widgets": {
        branches: {
          main: {
            "BACKLOG.md": lines(
              "- **[NOW] AB-1** — One.",
              "<!-- vizi:include A.md -->",
              "<!-- vizi:include B.md -->",
            ),
            "A.md": { status: 500 },
            "B.md": "- **[DONE] AB-2** — From B.",
            "STATUS.md": lines("# Status", "", "Last update: 2026-11-07", "", "## Phase", "Build."),
          },
        },
      },
    });
    await page.goto("/");
    await openLoaded(page);
    await expect(page.getByTestId("status-phase")).toHaveText("Build.");
    await expect(card(page, "AB-2")).toHaveCount(1);
    await expect(page.locator("#message")).toHaveText(INCOMPLETE);
    await page.getByRole("tab", { name: /^Report/ }).click();
    await expect(reportItems(page, "error")).toHaveText([
      `BACKLOG.md line 2: Not read: A.md could not be read: GitHub answered HTTP 500 for ${RAW}/A.md.`,
    ]);
  });
});

test.describe("tokens and private repos (3.15, Requests)", () => {
  const privateRepo = (done: FileAnswer = EXAMPLE_DONE): Record<string, RepoStub> => ({
    "acme/widgets": {
      private: true,
      branches: { main: { "BACKLOG.md": EXAMPLE_BACKLOG, "BACKLOG-DONE.md": done } },
    },
  });

  test("with a token held for the owner, every request goes to api.github.com with the header, and none to raw.githubusercontent.com", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, privateRepo());
    await page.goto("/");
    await useToken(page);
    await openLoaded(page);
    await expect(column(page, "DONE").locator(":scope > summary .count")).toHaveText("2");
    expect(urls(stub)).toContain(`${API}/contents/BACKLOG-DONE.md?ref=main`);
    for (const s of stub.seen) {
      expect(new URL(s.url).host).toBe("api.github.com");
      expect(s.headers.authorization).toBe(`Bearer ${TOKEN}`);
    }
  });

  test("a 401 on the included file forgets the token and hides the results", async ({
    page,
    context,
  }) => {
    await stubGithub(context, privateRepo({ status: 401 }));
    await page.goto("/");
    await useToken(page);
    await openRepo(page);
    await expect(page.locator("#message")).toHaveText(
      "GitHub refused the token for acme: it may have expired. It has been forgotten; enter a new one.",
    );
    await expect(page.locator("#results")).toBeHidden();
    await expect(page.getByTestId("token-line")).toBeHidden();
  });

  test("Forget hides the included entries with the rest", async ({ page, context }) => {
    await stubGithub(context, privateRepo());
    await page.goto("/");
    await useToken(page);
    await openLoaded(page);
    await expect(column(page, "DONE")).toBeAttached();
    await page
      .locator('[data-testid="token-line"][data-owner="acme"]')
      .getByTestId("token-forget")
      .click();
    await expect(page.locator("#results")).toBeHidden();
    await expect(page.locator("#board")).toBeEmpty();
    await expect(page.getByTestId("card")).toHaveCount(0);
  });

  test("a private repo without a token: 3.1's 404 message, and no request for an included file", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, privateRepo());
    await page.goto("/");
    await openRepo(page);
    await expect(page.locator("#message")).toHaveText(
      "Not found or not public. If the repo is private, add a token for its owner.",
    );
    await settle(page);
    expect(urls(stub)).toEqual([API]);
  });
});

test.describe("branches and replaced loads (3.15)", () => {
  test("a pick of another branch reads the includes of that branch", async ({ page, context }) => {
    const stub = await stubGithub(context, {
      "acme/widgets": {
        branches: {
          main: {
            "BACKLOG.md": lines("- **[NOW] AB-1** — Main.", "<!-- vizi:include DONE.md -->"),
            "DONE.md": "- **[DONE] AB-2** — Main done.",
          },
          dev: {
            "BACKLOG.md": lines("- **[NOW] AB-1** — Dev.", "<!-- vizi:include DEV.md -->"),
            "DEV.md": "- **[DONE] AB-9** — Dev done.",
          },
        },
      },
    });
    await page.goto("/");
    await openLoaded(page);
    await expect(card(page, "AB-2")).toHaveCount(1);
    await page.locator("#branch-select").selectOption("dev");
    await page.locator("#branch-open").click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (dev)");
    await expect(card(page, "AB-9")).toHaveCount(1);
    await expect(card(page, "AB-2")).toHaveCount(0);
    await expect(card(page, "AB-9").locator(".entry-file")).toHaveText("DEV.md");
    expect(urls(stub)).toContain("https://raw.githubusercontent.com/acme/widgets/dev/DEV.md");
  });

  const twoIncludes = (marker: string): Record<string, FileAnswer> => ({
    "BACKLOG.md": lines(
      `- **[NOW] ${marker}-1** — Own.`,
      "<!-- vizi:include A.md -->",
      "<!-- vizi:include B.md -->",
    ),
    "A.md": `- **[DONE] ${marker}-2** — From A.`,
    "B.md": `- **[DONE] ${marker}-3** — From B.`,
    "STATUS.md": lines("# Status", "", "Last update: 2026-11-07"),
  });

  test("with a token, a load replaced while its first included file is held back makes no request after it, and the newer project is shown", async ({
    page,
    context,
  }) => {
    const held = `${API}/contents/A.md?ref=main`;
    const stub = await stubGithub(
      context,
      {
        "acme/widgets": { private: true, branches: { main: twoIncludes("WG") } },
        "acme/other": { private: true, branches: { main: twoIncludes("OT") } },
      },
      held,
    );
    await page.goto("/");
    await useToken(page);
    await openRepo(page);
    await expect.poll(() => urls(stub).includes(held)).toBe(true);
    await openLoaded(page, "acme/other");
    await expect(card(page, "OT-2")).toHaveCount(1);
    stub.release();
    await page.waitForResponse((r) => r.url() === held);
    await settle(page);
    const fromOld = urls(stub).filter((u) => u.startsWith(`${API}/contents/`));
    expect(fromOld).toEqual([`${API}/contents/BACKLOG.md?ref=main`, held]);
    await expect(page.locator("#project-name")).toHaveText("acme/other (main)");
    await expect(page.getByTestId("card").filter({ hasText: "WG-" })).toHaveCount(0);
  });

  test("without a token, the replaced load's later requests may still be made, and nothing of it is shown", async ({
    page,
    context,
  }) => {
    const held = `${RAW}/A.md`;
    const stub = await stubGithub(
      context,
      {
        "acme/widgets": { branches: { main: twoIncludes("WG") } },
        "acme/other": { branches: { main: twoIncludes("OT") } },
      },
      held,
    );
    await page.goto("/");
    await openRepo(page);
    await expect.poll(() => urls(stub).includes(held)).toBe(true);
    await openLoaded(page, "acme/other");
    stub.release();
    await page.waitForResponse((r) => r.url() === held);
    await settle(page);
    await expect(page.locator("#project-name")).toHaveText("acme/other (main)");
    await expect(page.getByTestId("card").filter({ hasText: "WG-" })).toHaveCount(0);
    await expect(card(page, "OT-3")).toHaveCount(1);
  });
});

test.describe("I11: an include line in a folder pointer's STATUS.md", () => {
  test("Show status lists the info item, word for word with its line, and makes no request for the named file", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      "acme/hub": {
        branches: {
          main: {
            "PROJECTS.md": lines("# Pre-projects", "", "- projects/notes/"),
            "projects/notes/STATUS.md": lines(
              "# Status",
              "",
              "Last update: 2026-11-07",
              "",
              "## Phase",
              "Notes.",
              "<!-- vizi:include DONE.md -->",
            ),
            "projects/notes/DONE.md": "- **[DONE] AB-1** — Never read.",
          },
        },
      },
    });
    await page.goto("/");
    await openLoaded(page, "acme/hub");
    await page
      .locator('[data-testid=pointer][data-pointer="projects/notes/"]')
      .getByRole("link", { name: "Show status" })
      .click();
    const panel = page.getByTestId("project-status");
    await expect(panel.getByTestId("pstatus-phase")).toHaveText("Notes.");
    await expect(panel.getByRole("heading", { name: "What could not be read" })).toBeVisible();
    await expect(
      panel.getByTestId("panel-report-item").filter({ hasText: "Not followed" }),
    ).toHaveText(["line 7: Not followed: only the backlog file can include another file."]);
    await settle(page);
    expect(urls(stub).some((u) => u.includes("DONE.md"))).toBe(false);
  });
});

test.describe("a long backlog with an included file (3.15; SPEC 4, item 6)", () => {
  test("a backlog file of 1500 lines including one of 1500 lines loads and renders in under 8 seconds", async ({
    page,
    context,
  }) => {
    const long = (prefix: string, markers: string[], first: string[]) => {
      const rows = [...first];
      for (let i = 1; rows.length < 1500; i++) {
        rows.push(
          `- **[${markers[i % markers.length]}] ${prefix}-${i}** — Item number ${i}. Detail with \`code\` and *emphasis*.`,
          "  More detail on a second line.",
          "",
        );
      }
      return rows.slice(0, 1500).join("\n");
    };
    await stubGithub(context, {
      "acme/widgets": {
        branches: {
          main: {
            "BACKLOG.md": long(
              "LB",
              ["NOW", "NEXT", "LATER"],
              ["# Long backlog", "<!-- vizi:include DONE.md -->"],
            ),
            "DONE.md": long("LD", ["DONE"], ["# Finished"]),
          },
        },
      },
    });
    await page.goto("/");
    const start = Date.now();
    await openRepo(page);
    await expect(page.getByTestId("card").first()).toBeVisible();
    await page.getByRole("tab", { name: "List" }).click();
    await expect(page.getByTestId("list-row").first()).toBeVisible();
    expect(Date.now() - start).toBeLessThan(8000);
    expect(await page.getByTestId("list-row").count()).toBeGreaterThan(900);
  });
});
