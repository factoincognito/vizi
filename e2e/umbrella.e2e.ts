/**
 * Browser tests for the umbrella view (docs/SPEC.md 3.9). GitHub's answers
 * are stubbed with routes: no test reaches the network. All fixtures are
 * synthetic (e2e/fixtures/umbrella*), and every token is an obviously fake
 * value. The page runs under its Content-Security-Policy in every test.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { type BrowserContext, test as base, expect, type Page, type Route } from "@playwright/test";
import { isAllowedRequest } from "./guard";
import { openPanel } from "./panel";

/** Every test: a request other than the page's own document and GitHub's two hosts fails it. */
const test = base.extend<{ guard: undefined }>({
  guard: [
    async ({ page, baseURL }, use) => {
      const stray: string[] = [];
      const own = [`${baseURL}/`, pathToFileURL(join(__dirname, "..", "dist", "index.html")).href];
      page.on("request", (r) => {
        if (!isAllowedRequest(r.url(), own)) stray.push(r.url());
      });
      await use(undefined);
      expect(stray, "requests the page should not make").toEqual([]);
    },
    { auto: true },
  ],
});

const fixtures = join(__dirname, "fixtures");
const UMBRELLA = join(fixtures, "umbrella");
const UMBRELLA_BACKLOG = join(fixtures, "umbrella-backlog");
const UMBRELLA_EMPTY = join(fixtures, "umbrella-empty");
const UMBRELLA_CROSS = join(fixtures, "umbrella-cross");
const PROJECT = join(fixtures, "project");
const read = (dir: string, path: string) => readFileSync(join(dir, path), "utf8");
const TOKEN = "github_pat_TEST_umbrella_abcd1234";
// The hub by its full address, the other repos in the Repository field's other forms (3.1).
const HUB = "https://github.com/acme/hub";
const HUB_BACKLOG = "acme/hub-backlog";
const HUB_EMPTY = "github.com/acme/hub-empty";
const WIDGETS = "acme/widgets";
const API = "https://api.github.com/repos/acme";

type Seen = { method: string; url: string; headers: Record<string, string> };
interface StubOptions {
  /** The hub repo has a docs/BACKLOG.md as well. */
  hubBacklog?: boolean;
  /** The hub's PROJECTS.md also points to a repo of another owner (other/gadgets). */
  cross?: boolean;
  /** Keeps the answer to a URL waiting; `n` counts the requests to that URL, from 1. Resolve with `release`. */
  hold?: (url: string, n: number) => boolean;
  /** Overrides the text of a file; `n` counts the requests to that URL, from 1. */
  text?: (url: string, n: number) => string | undefined;
  /** Overrides the status of an answer. */
  status?: (url: string) => number | undefined;
}
interface Stub {
  seen: Seen[];
  release: () => void;
}

/**
 * The files of each synthetic repo: acme/hub (the umbrella), acme/hub-backlog
 * (e2e/fixtures/umbrella-backlog), acme/hub-empty (e2e/fixtures/umbrella-empty),
 * acme/widgets and acme/plain.
 */
function repoFiles(repo: string, hubBacklog: boolean, cross = false): Record<string, string> {
  if (repo === "hub") {
    return {
      "PROJECTS.md": cross ? read(UMBRELLA_CROSS, "PROJECTS.md") : read(UMBRELLA, "PROJECTS.md"),
      "STATUS.md": read(UMBRELLA, "STATUS.md"),
      "projects/notes/STATUS.md": read(UMBRELLA, "projects/notes/STATUS.md"),
      "projects/odd/STATUS.md": read(UMBRELLA, "projects/odd/STATUS.md"),
      "projects/bare/README.md": read(UMBRELLA, "projects/bare/README.md"),
      ...(hubBacklog ? { "docs/BACKLOG.md": read(UMBRELLA_BACKLOG, "docs/BACKLOG.md") } : {}),
    };
  }
  if (repo === "hub-backlog") {
    return {
      "PROJECTS.md": read(UMBRELLA_BACKLOG, "PROJECTS.md"),
      "docs/BACKLOG.md": read(UMBRELLA_BACKLOG, "docs/BACKLOG.md"),
    };
  }
  if (repo === "hub-empty") return { "PROJECTS.md": read(UMBRELLA_EMPTY, "PROJECTS.md") };
  if (repo === "widgets") {
    return {
      "docs/BACKLOG.md": read(PROJECT, "docs/BACKLOG.md"),
      "STATUS.md": read(PROJECT, "STATUS.md"),
    };
  }
  return { "docs/BACKLOG.md": read(PROJECT, "docs/BACKLOG.md") };
}

/** Answers GitHub for acme/hub, acme/widgets and acme/plain on a whole context, recording every GET. */
async function stubGithub(context: BrowserContext, options: StubOptions = {}): Promise<Stub> {
  const seen: Seen[] = [];
  const counts = new Map<string, number>();
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, accept, content-type",
    "access-control-allow-methods": "GET, OPTIONS",
  };
  await context.route(
    /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//,
    async (route: Route) => {
      const request = route.request();
      const url = request.url();
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      seen.push({ method: request.method(), url, headers: await request.allHeaders() });
      const n = (counts.get(url) ?? 0) + 1;
      counts.set(url, n);
      if (options.hold?.(url, n)) await gate;
      const forced = options.status?.(url);
      if (forced) return route.fulfill({ status: forced, headers: cors, body: "" });

      const repoMatch = /^https:\/\/api\.github\.com\/repos\/(?:acme|other)\/([a-z0-9-]+)$/.exec(
        url,
      );
      if (repoMatch) {
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ default_branch: "main" }),
        });
      }
      const treeMatch =
        /^https:\/\/api\.github\.com\/repos\/(?:acme|other)\/([a-z0-9-]+)\/git\/trees\/main\?recursive=1$/.exec(
          url,
        );
      if (treeMatch?.[1]) {
        const tree = Object.keys(
          repoFiles(treeMatch[1], options.hubBacklog ?? false, options.cross),
        ).map((path) => ({ path, type: "blob" }));
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ truncated: false, tree }),
        });
      }
      const fileMatch =
        /^https:\/\/api\.github\.com\/repos\/(?:acme|other)\/([a-z0-9-]+)\/contents\/([^?]+)\?ref=main$/.exec(
          url,
        ) ??
        /^https:\/\/raw\.githubusercontent\.com\/(?:acme|other)\/([a-z0-9-]+)\/main\/(.+)$/.exec(
          url,
        );
      if (fileMatch?.[1] && fileMatch[2]) {
        const text =
          options.text?.(url, n) ??
          repoFiles(fileMatch[1], options.hubBacklog ?? false, options.cross)[
            decodeURIComponent(fileMatch[2])
          ];
        if (text !== undefined) return route.fulfill({ status: 200, headers: cors, body: text });
      }
      return route.fulfill({ status: 404, headers: cors, body: "" });
    },
  );
  return { seen, release };
}

const gets = (stub: Stub) => stub.seen.filter((s) => s.method === "GET");
const RAW_HUB = "https://raw.githubusercontent.com/acme/hub/main";
const NOTES_RAW = `${RAW_HUB}/projects/notes/STATUS.md`;
const NOTES_API = `${API}/hub/contents/projects/notes/STATUS.md?ref=main`;

async function openUrl(page: Page, url: string) {
  await page.locator("#url-input").fill(url);
  await page.locator("#open-url").click();
}

const pointer = (page: Page, text: string) =>
  page.locator(`[data-testid=pointer][data-pointer="${text}"]`).first();
const showStatus = (page: Page, text: string) =>
  pointer(page, text).getByRole("link", { name: "Show status" });
const panel = (page: Page) => page.getByTestId("project-status");
const tokenLine = (page: Page, owner = "acme") =>
  page.locator(`[data-testid="token-line"][data-owner="${owner}"]`);
const forgetToken = (page: Page, owner = "acme") =>
  tokenLine(page, owner).getByTestId("token-forget");
const TOKEN2 = "github_pat_TEST_umbrella_wxyz9876";

type Outline = { h: string; p: string[]; c: Outline[] };
/** The shown tree as plain data. */
async function treeOutline(page: Page): Promise<Outline[]> {
  return page.locator("#umbrella-tree").evaluate((root) => {
    const nodes = (list: Element | null): Outline[] =>
      Array.from(list?.querySelectorAll(":scope > li") ?? []).map((li) => ({
        h: li.querySelector(":scope > .umbrella-heading")?.textContent ?? "",
        p: Array.from(li.querySelectorAll(":scope > ul.pointers > li")).map(
          (x) => x.getAttribute("data-pointer") ?? "",
        ),
        c: nodes(li.querySelector(":scope > ul.children")),
      }));
    return nodes(root.querySelector(":scope > ul.children"));
  });
}

const EXPECTED_TREE: Outline[] = [
  {
    h: "Portfolio",
    p: [],
    c: [
      {
        h: "Tools area",
        p: ["acme/widgets", "projects/notes/", "projects/bare/", "projects/odd/"],
        c: [{ h: "Experiments", p: ["acme/lab-1"], c: [] }],
      },
      { h: "Hardware", p: ["acme/widgets"], c: [] },
    ],
  },
];

const umbrellaTab = (page: Page) => page.getByRole("tab", { name: "Umbrella" });

test.describe("the Umbrella tab (3.9)", () => {
  test("is not there without a PROJECTS.md", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, "https://github.com/acme/plain");
    await expect(page.getByTestId("column").first()).toBeVisible();
    await expect(umbrellaTab(page)).toHaveCount(0);
  });

  test("opens on the tab when there is no backlog, shows the tree in file order, and reports under the Report tab", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    const violations: string[] = [];
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e) =>
        console.error(`CSP violation: ${e.violatedDirective}`),
      );
    });
    page.on("console", (m) => m.type() === "error" && violations.push(m.text()));
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toHaveAttribute("aria-selected", "true");
    expect(await treeOutline(page)).toEqual(EXPECTED_TREE);
    // A heading is inline Markdown; a pointer is plain text.
    await expect(page.locator("#umbrella-tree strong")).toHaveText("Tools");
    await expect(pointer(page, "projects/notes/")).toContainText("projects/notes/");
    // The Board tab is empty (no backlog file); the tree carries no status.
    await expect(page.locator("#umbrella-tree")).not.toContainText("Notes phase");
    await expect(page.locator("#umbrella-tree [data-testid=status-phase]")).toHaveCount(0);

    await page.getByRole("tab", { name: /^Report/ }).click();
    const items = page.getByTestId("report-item");
    await expect(items.filter({ hasText: /^PROJECTS\.md line 17: / })).toHaveCount(1);
    await expect(items.filter({ hasText: /^PROJECTS\.md line 17: / })).toHaveAttribute(
      "data-kind",
      "error",
    );
    await expect(items.filter({ hasText: /^PROJECTS\.md line 21: / })).toHaveAttribute(
      "data-kind",
      "warning",
    );
    await expect(page.getByTestId("report-count-error")).toHaveText("1");
    await expect(page.getByTestId("report-count-warning")).toHaveText("1");
    expect(violations).toEqual([]);
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
  });

  test("a project with a backlog opens on the Board, and the Umbrella tab is still there", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB_BACKLOG);
    await expect(page.getByRole("tab", { name: "Board" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("column").first()).toBeVisible();
    await expect(umbrellaTab(page)).toBeVisible();
    await umbrellaTab(page).click();
    expect(await treeOutline(page)).toEqual([{ h: "Hub", p: ["acme/widgets"], c: [] }]);
  });

  test("the tab comes after Report", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toBeVisible();
    const names = await page.getByRole("tab").allTextContents();
    expect(names.at(-1)).toBe("Umbrella");
    expect(names.at(-2)).toMatch(/^Report/);
  });

  test("a file with no pointer gives an empty tree and an Info item", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB_EMPTY);
    await expect(umbrellaTab(page)).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: /^Report/ }).click();
    await expect(page.getByTestId("report-count-info")).toHaveText("1");
  });
});

test.describe("URL mode (3.9)", () => {
  test("reads PROJECTS.md with one more request 3, opens on the tab without a backlog, and asks for no project's status", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toHaveAttribute("aria-selected", "true");
    expect(await treeOutline(page)).toEqual(EXPECTED_TREE);
    expect(gets(stub).map((s) => s.url)).toEqual([
      `${API}/hub`,
      `${API}/hub/git/trees/main?recursive=1`,
      `${RAW_HUB}/STATUS.md`,
      `${RAW_HUB}/PROJECTS.md`,
    ]);
    await expect(panel(page)).toBeHidden();
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
  });

  test("with a backlog it opens on the Board", async ({ page, context }) => {
    const stub = await stubGithub(context, { hubBacklog: true });
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await expect(page.getByTestId("column").first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Board" })).toHaveAttribute("aria-selected", "true");
    await expect(umbrellaTab(page)).toBeVisible();
    expect(gets(stub).map((s) => s.url)).toContain(`${RAW_HUB}/PROJECTS.md`);
  });

  test("a failed PROJECTS.md request fails the load with its status", async ({ page, context }) => {
    await stubGithub(context, {
      status: (url) => (url === `${RAW_HUB}/PROJECTS.md` ? 500 : undefined),
    });
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await expect(page.locator("#message")).toContainText("HTTP 500");
    await expect(page.locator("#results")).toBeHidden();
  });
});

test.describe("the links of a repo pointer (3.9)", () => {
  test("On GitHub opens the repo in a new tab, with rel noopener noreferrer", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    const link = pointer(page, "acme/lab-1").getByRole("link", { name: "On GitHub" });
    await expect(link).toHaveAttribute("href", "https://github.com/acme/lab-1");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    // A folder pointer has "Show status" only.
    await expect(pointer(page, "projects/notes/").getByRole("link")).toHaveText(["Show status"]);
    await expect(pointer(page, "acme/lab-1").getByRole("link")).toHaveText([
      "Open in vizi",
      "On GitHub",
    ]);
  });

  test("Open in vizi puts the address in the field and loads that repo in the same page; the results replace the umbrella's", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toBeVisible();
    const before = gets(stub).length;
    await pointer(page, "acme/widgets").getByRole("link", { name: "Open in vizi" }).click();
    // The field's own form, owner/repo (3.1, "The Repository field"; 3.9).
    await expect(page.locator("#url-input")).toHaveValue("acme/widgets");
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await expect(page.getByTestId("column").first()).toBeVisible();
    await expect(umbrellaTab(page)).toHaveCount(0);
    expect(
      gets(stub)
        .slice(before)
        .map((s) => s.url),
    ).toEqual([
      `${API}/widgets`,
      `${API}/widgets/git/trees/main?recursive=1`,
      "https://raw.githubusercontent.com/acme/widgets/main/docs/BACKLOG.md",
      "https://raw.githubusercontent.com/acme/widgets/main/STATUS.md",
    ]);
    expect(page.url()).not.toContain("widgets");
  });

  test("Open in vizi is a newer load: an older answer still due for the umbrella project is dropped", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (url, n) => url === `${API}/hub` && n === 2 });
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toBeVisible();
    await openUrl(page, HUB); // the second request for the hub is held
    await expect.poll(() => gets(stub).filter((s) => s.url === `${API}/hub`).length).toBe(2);
    await pointer(page, "acme/widgets").getByRole("link", { name: "Open in vizi" }).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    const late = page.waitForResponse((r) => r.url() === `${API}/hub`);
    stub.release();
    await late;
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 200)));
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await expect(umbrellaTab(page)).toHaveCount(0);
  });

  test("a pointer to a repo that is not there shows the not-found message, as any address would", async ({
    page,
    context,
  }) => {
    await stubGithub(context, { status: (url) => (url === `${API}/lab-1` ? 404 : undefined) });
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await pointer(page, "acme/lab-1").getByRole("link", { name: "Open in vizi" }).click();
    await expect(page.locator("#message")).toContainText("Not found or not public");
    await expect(page.locator("#results")).toBeHidden();
  });
});

test.describe("Show status of a folder pointer (3.9)", () => {
  test("the status is shown in the panel outside the tree, headed with the pointer, blockers waiting on the product owner highlighted; the tree holds no status", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toBeVisible();
    await expect(panel(page)).toBeHidden();
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page)).toBeVisible();
    await expect(panel(page).getByRole("heading", { name: "Project status" })).toBeVisible();
    await expect(panel(page)).toContainText("projects/notes/");
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
    await expect(panel(page).getByTestId("pstatus-updated")).toHaveText("Last update: 2026-11-03");
    await expect(panel(page).locator("em")).toHaveText("notes");
    const blockers = panel(page).getByTestId("pblocker");
    await expect(blockers).toHaveCount(2);
    await expect(blockers.nth(0)).toHaveAttribute("data-waiting", "true");
    await expect(blockers.nth(1)).toHaveAttribute("data-waiting", "false");
    expect(await panel(page).evaluate((el) => el.closest("#umbrella-tree"))).toBeNull();
    await expect(page.locator("#umbrella-tree")).not.toContainText("Notes phase");
    await expect(page.locator("#umbrella-tree")).not.toContainText("Product Owner:");
    // The project's own status is not touched.
    await expect(page.getByTestId("status-phase")).toHaveText("Umbrella phase.");
  });

  test("what the status could not give is shown with it", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await showStatus(page, "projects/odd/").click();
    await expect(panel(page).getByTestId("pstatus-focus")).toHaveText("Odd focus.");
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("not given");
    await expect(panel(page).getByTestId("panel-report-item").first()).toBeVisible();
    expect(await panel(page).getByTestId("panel-report-item").count()).toBeGreaterThanOrEqual(2);
  });

  test("a folder without STATUS.md says so, with no request", async ({ page, context }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toBeVisible();
    const before = stub.seen.length;
    await showStatus(page, "projects/bare/").click();
    await expect(panel(page)).toContainText("No STATUS.md in projects/bare/");
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 150)));
    expect(stub.seen.length).toBe(before);
  });

  test("URL mode: one request for that path, none before it is used, and a fresh one each time", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toBeVisible();
    expect(gets(stub).filter((s) => s.url.includes("/projects/"))).toEqual([]);
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
    expect(gets(stub).filter((s) => s.url === NOTES_RAW)).toHaveLength(1);
    await showStatus(page, "projects/notes/").click();
    await expect.poll(() => gets(stub).filter((s) => s.url === NOTES_RAW).length).toBe(2);
    await expect(page.locator("#umbrella-tree")).not.toContainText("Notes phase");
  });

  test("a failed read shows the status in the panel and leaves the tree", async ({
    page,
    context,
  }) => {
    await stubGithub(context, { status: (url) => (url === NOTES_RAW ? 500 : undefined) });
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page)).toContainText("HTTP 500");
    expect(await treeOutline(page)).toEqual(EXPECTED_TREE);
  });
});

test.describe("one panel, the newest wins (3.9)", () => {
  test("the next Show status, for any pointer, replaces the panel", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
    await showStatus(page, "projects/odd/").click();
    await expect(panel(page).getByTestId("pstatus-focus")).toHaveText("Odd focus.");
    await expect(page.getByTestId("project-status")).toHaveCount(1);
    await expect(panel(page)).not.toContainText("Notes phase");
    await expect(panel(page)).toContainText("projects/odd/");
    await showStatus(page, "projects/bare/").click();
    await expect(panel(page)).toContainText("No STATUS.md in projects/bare/");
    await expect(panel(page)).not.toContainText("Odd focus");
  });

  const answerByCall = (url: string, n: number) =>
    url === NOTES_RAW
      ? read(UMBRELLA, "projects/notes/STATUS.md").replace(
          "Notes phase.",
          n === 1 ? "OLD phase." : "NEW phase.",
        )
      : undefined;

  test("two uses on the same pointer in quick succession: the older answer arriving later is dropped", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      hold: (url, n) => url === NOTES_RAW && n === 1,
      text: answerByCall,
    });
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect.poll(() => gets(stub).filter((s) => s.url === NOTES_RAW).length).toBe(1);
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("NEW phase.");
    const late = page.waitForResponse(
      (r) => r.url() === NOTES_RAW && r.status() === 200 && gets(stub).length > 0,
    );
    stub.release();
    await late;
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 200)));
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("NEW phase.");
  });

  test("two uses on two pointers in quick succession: the older answer arriving later is dropped", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (url, n) => url === NOTES_RAW && n === 1 });
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect.poll(() => gets(stub).filter((s) => s.url === NOTES_RAW).length).toBe(1);
    await showStatus(page, "projects/odd/").click();
    await expect(panel(page).getByTestId("pstatus-focus")).toHaveText("Odd focus.");
    stub.release();
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)));
    await expect(panel(page)).toContainText("projects/odd/");
    await expect(panel(page)).not.toContainText("Notes phase");
  });

  test("an older failure arriving later does not replace the newer status", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      hold: (url, n) => url === NOTES_RAW && n === 1,
      status: (url) => (url === NOTES_RAW ? 500 : undefined),
    });
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect.poll(() => gets(stub).length).toBeGreaterThan(0);
    await showStatus(page, "projects/odd/").click();
    await expect(panel(page).getByTestId("pstatus-focus")).toHaveText("Odd focus.");
    stub.release();
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)));
    await expect(panel(page)).not.toContainText("HTTP 500");
    await expect(panel(page)).toContainText("projects/odd/");
  });

  test("an answer that arrives after a newer load has started is dropped", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (url, n) => url === NOTES_RAW && n === 1 });
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect.poll(() => gets(stub).filter((s) => s.url === NOTES_RAW).length).toBe(1);
    await pointer(page, "acme/widgets").getByRole("link", { name: "Open in vizi" }).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    stub.release();
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)));
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await expect(panel(page)).toBeHidden();
    await expect(page.locator("body")).not.toContainText("Notes phase");
  });

  test("an answer that arrives after the page has opened another project by its address is dropped", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (url, n) => url === NOTES_RAW && n === 1 });
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect.poll(() => gets(stub).filter((s) => s.url === NOTES_RAW).length).toBe(1);
    await openUrl(page, WIDGETS);
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    stub.release();
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)));
    await expect(page.locator("body")).not.toContainText("Notes phase");
  });

  test("a new project starts with no panel", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page)).toBeVisible();
    await openUrl(page, HUB_BACKLOG);
    await expect(page.locator("#project-name")).toHaveText("acme/hub-backlog (main)");
    await umbrellaTab(page).click();
    await expect(panel(page)).toBeHidden();
  });
});

test.describe("with a token held (3.8, 3.9)", () => {
  async function useToken(page: Page, token = TOKEN, owner = "acme") {
    await page.locator("#owner-input").fill(owner);
    await page.locator("#token-input").fill(token);
    await page.locator("#token-use").click();
    await expect(tokenLine(page, owner)).toBeVisible();
  }

  test("loading the umbrella project, Open in vizi and Show status all use it; no request goes to raw.githubusercontent.com", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page);
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toBeVisible();
    expect(gets(stub).map((s) => s.url)).toEqual([
      `${API}/hub`,
      `${API}/hub/git/trees/main?recursive=1`,
      `${API}/hub/contents/STATUS.md?ref=main`,
      `${API}/hub/contents/PROJECTS.md?ref=main`,
    ]);
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
    await pointer(page, "acme/widgets").getByRole("link", { name: "Open in vizi" }).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    for (const s of gets(stub)) {
      expect(s.headers.authorization, s.url).toBe(`Bearer ${TOKEN}`);
      expect(new URL(s.url).host).toBe("api.github.com");
    }
    expect(gets(stub).some((s) => s.url === NOTES_API)).toBe(true);
    const page_ = await page.evaluate(() => document.body.outerHTML + location.href);
    expect(page_).not.toContain(TOKEN);
  });

  test("a 401 for a status read forgets the token and says so", async ({ page, context }) => {
    await stubGithub(context, { status: (url) => (url === NOTES_API ? 401 : undefined) });
    await page.goto("/");
    await openPanel(page);
    await useToken(page);
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect(page.locator("#message")).toContainText("GitHub refused the token");
    await expect(page.getByTestId("token-line")).toBeHidden();
  });

  test("without a token Open in vizi and Show status carry no Authorization header", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
    expect(gets(stub).every((s) => !("authorization" in s.headers))).toBe(true);
  });
});

test.describe("a status read with the token, in a project loaded without one (3.8, 3.9)", () => {
  /** Opens the hub with no token, then takes one (saved or not) and shows the notes status. */
  async function tokenlessUmbrellaThenToken(
    page: Page,
    context: BrowserContext,
    remember: boolean,
  ) {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toBeVisible();
    await page.locator("#token-input").fill(TOKEN);
    await page.locator("#token-remember").setChecked(remember);
    await page.locator("#token-use").click();
    await expect(tokenLine(page)).toBeVisible();
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
    // The status read carried the token although the umbrella itself was loaded without it.
    const read = gets(stub).find((s) => s.url === NOTES_API);
    expect(read?.headers.authorization).toBe(`Bearer ${TOKEN}`);
    return stub;
  }

  test("Forget the token clears the panel, and the tokenless umbrella stays", async ({
    page,
    context,
  }) => {
    await tokenlessUmbrellaThenToken(page, context, false);
    await forgetToken(page).click();
    await expect(panel(page)).toBeHidden();
    await expect(panel(page)).toBeEmpty();
    await expect(page.locator("body")).not.toContainText("Notes phase");
    expect(await treeOutline(page)).toEqual(EXPECTED_TREE);
  });

  test("the key removed in another tab clears the panel", async ({ page, context }) => {
    await tokenlessUmbrellaThenToken(page, context, true);
    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);
    await other.evaluate(() => localStorage.removeItem("vizi.githubTokens"));
    await expect(page.getByTestId("token-line")).toBeHidden();
    await expect(panel(page)).toBeHidden();
    await expect(page.locator("body")).not.toContainText("Notes phase");
    expect(await treeOutline(page)).toEqual(EXPECTED_TREE);
  });

  test("a status read without a token stays when a token is taken and forgotten", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
    await page.locator("#token-input").fill(TOKEN);
    await page.locator("#token-use").click();
    await forgetToken(page).click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
  });

  test("a read that replaces a token read without one is not cleared by Forget", async ({
    page,
    context,
  }) => {
    await tokenlessUmbrellaThenToken(page, context, false);
    await forgetToken(page).click();
    await showStatus(page, "projects/odd/").click();
    await expect(panel(page).getByTestId("pstatus-focus")).toHaveText("Odd focus.");
    await page.locator("#token-input").fill(TOKEN);
    await page.locator("#token-use").click();
    await forgetToken(page).click();
    await expect(panel(page).getByTestId("pstatus-focus")).toHaveText("Odd focus.");
  });

  test("a 401 on Show status leaves no empty panel", async ({ page, context }) => {
    await stubGithub(context, { status: (url) => (url === NOTES_API ? 401 : undefined) });
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await page.locator("#token-input").fill(TOKEN);
    await page.locator("#token-use").click();
    await showStatus(page, "projects/notes/").click();
    await expect(page.locator("#message")).toContainText("GitHub refused the token");
    await expect(panel(page)).toBeHidden();
    await expect(panel(page)).toBeEmpty();
  });
});

test.describe("two owners' tokens (3.8, 3.9)", () => {
  async function useToken(page: Page, token: string, owner: string) {
    await page.locator("#owner-input").fill(owner);
    await page.locator("#token-input").fill(token);
    await page.locator("#token-use").click();
    await expect(tokenLine(page, owner)).toBeVisible();
  }
  const sentTo = (stub: Stub, fragment: string) =>
    gets(stub).filter((s) => s.url.includes(fragment));

  test("Open in vizi uses the token of the pointed repo's owner, and Show status that of the project on the page", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { cross: true });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, "acme");
    await useToken(page, TOKEN2, "other");
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toBeVisible();
    for (const s of gets(stub)) expect(s.headers.authorization, s.url).toBe(`Bearer ${TOKEN}`);

    await showStatus(page, "projects/notes/").click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
    expect(sentTo(stub, "/projects/notes/STATUS.md")[0]?.headers.authorization).toBe(
      `Bearer ${TOKEN}`,
    );

    const mark = gets(stub).length;
    await pointer(page, "other/gadgets").getByRole("link", { name: "Open in vizi" }).click();
    await expect(page.locator("#project-name")).toHaveText("other/gadgets (main)");
    const sent = gets(stub).slice(mark);
    expect(sent.length).toBeGreaterThan(0);
    for (const s of sent) expect(s.headers.authorization, s.url).toBe(`Bearer ${TOKEN2}`);

    const again = gets(stub).length;
    await openUrl(page, HUB);
    await pointer(page, "acme/widgets").getByRole("link", { name: "Open in vizi" }).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    for (const s of gets(stub).slice(again)) {
      expect(s.headers.authorization, s.url).toBe(`Bearer ${TOKEN}`);
    }
  });

  test("a token held only for another owner is not used for the hub, Open in vizi or Show status", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { cross: true });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN2, "other");
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toBeVisible();
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
    await pointer(page, "acme/widgets").getByRole("link", { name: "Open in vizi" }).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    expect(gets(stub).length).toBeGreaterThan(0);
    expect(gets(stub).every((s) => !("authorization" in s.headers))).toBe(true);
  });

  test("Open in vizi fills the Owner field with the pointed repo's owner until the user has typed in it", async ({
    page,
    context,
  }) => {
    await stubGithub(context, { cross: true });
    await page.goto("/");
    await openPanel(page);
    await openUrl(page, HUB);
    await expect(page.locator("#owner-input")).toHaveValue("acme");
    await pointer(page, "other/gadgets").getByRole("link", { name: "Open in vizi" }).click();
    await expect(page.locator("#project-name")).toHaveText("other/gadgets (main)");
    await expect(page.locator("#owner-input")).toHaveValue("other");

    await page.locator("#owner-input").fill("mine");
    await openUrl(page, HUB);
    await pointer(page, "other/gadgets").getByRole("link", { name: "Open in vizi" }).click();
    await expect(page.locator("#project-name")).toHaveText("other/gadgets (main)");
    await expect(page.locator("#owner-input")).toHaveValue("mine");
  });

  test("Forget for the other owner leaves the hub, its panel and the token read of the hub", async ({
    page,
    context,
  }) => {
    await stubGithub(context, { cross: true });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, "acme");
    await useToken(page, TOKEN2, "other");
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
    await forgetToken(page, "other").click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
    await expect(umbrellaTab(page)).toBeVisible();
    await forgetToken(page, "acme").click();
    await expect(panel(page)).toBeHidden();
    await expect(page.locator("#results")).toBeHidden();
  });

  test("a 401 on Show status forgets only the refused owner's token, and a newer token for that owner is kept", async ({
    page,
    context,
  }) => {
    await stubGithub(context, {
      cross: true,
      status: (url) => (url === NOTES_API ? 401 : undefined),
    });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, "acme");
    await useToken(page, TOKEN2, "other");
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect(page.locator("#message")).toContainText("GitHub refused the token for acme");
    await expect(tokenLine(page, "acme")).toBeHidden();
    await expect(tokenLine(page, "other")).toBeVisible();
    await expect(panel(page)).toBeHidden();
  });
});
