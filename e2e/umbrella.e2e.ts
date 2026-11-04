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
const PROJECT = join(fixtures, "project");
const read = (dir: string, path: string) => readFileSync(join(dir, path), "utf8");
const TOKEN = "github_pat_TEST_umbrella_abcd1234";
const HUB = "https://github.com/acme/hub";
const API = "https://api.github.com/repos/acme";

type Seen = { method: string; url: string; headers: Record<string, string> };
interface StubOptions {
  /** The hub repo has a docs/BACKLOG.md as well. */
  hubBacklog?: boolean;
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

/** The files of each synthetic repo: acme/hub (the umbrella), acme/widgets and acme/plain. */
function repoFiles(repo: string, hubBacklog: boolean): Record<string, string> {
  if (repo === "hub") {
    return {
      "PROJECTS.md": read(UMBRELLA, "PROJECTS.md"),
      "STATUS.md": read(UMBRELLA, "STATUS.md"),
      "projects/notes/STATUS.md": read(UMBRELLA, "projects/notes/STATUS.md"),
      "projects/odd/STATUS.md": read(UMBRELLA, "projects/odd/STATUS.md"),
      "projects/bare/README.md": read(UMBRELLA, "projects/bare/README.md"),
      ...(hubBacklog ? { "docs/BACKLOG.md": read(UMBRELLA_BACKLOG, "docs/BACKLOG.md") } : {}),
    };
  }
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

      const repoMatch = /^https:\/\/api\.github\.com\/repos\/acme\/([a-z0-9-]+)$/.exec(url);
      if (repoMatch) {
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ default_branch: "main" }),
        });
      }
      const treeMatch =
        /^https:\/\/api\.github\.com\/repos\/acme\/([a-z0-9-]+)\/git\/trees\/main\?recursive=1$/.exec(
          url,
        );
      if (treeMatch?.[1]) {
        const tree = Object.keys(repoFiles(treeMatch[1], options.hubBacklog ?? false)).map(
          (path) => ({ path, type: "blob" }),
        );
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ truncated: false, tree }),
        });
      }
      const fileMatch =
        /^https:\/\/api\.github\.com\/repos\/acme\/([a-z0-9-]+)\/contents\/([^?]+)\?ref=main$/.exec(
          url,
        ) ?? /^https:\/\/raw\.githubusercontent\.com\/acme\/([a-z0-9-]+)\/main\/(.+)$/.exec(url);
      if (fileMatch?.[1] && fileMatch[2]) {
        const text =
          options.text?.(url, n) ??
          repoFiles(fileMatch[1], options.hubBacklog ?? false)[decodeURIComponent(fileMatch[2])];
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

async function pickFolder(page: Page, dir: string) {
  await page.locator("#folder-input").setInputFiles(dir);
}

const pointer = (page: Page, text: string) =>
  page.locator(`[data-testid=pointer][data-pointer="${text}"]`).first();
const showStatus = (page: Page, text: string) =>
  pointer(page, text).getByRole("link", { name: "Show status" });
const panel = (page: Page) => page.getByTestId("project-status");

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
  test("is not there without a PROJECTS.md, in either mode", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openUrl(page, "https://github.com/acme/plain");
    await expect(page.getByTestId("column").first()).toBeVisible();
    await expect(umbrellaTab(page)).toHaveCount(0);
    await pickFolder(page, PROJECT);
    await expect(page.locator("#project-name")).toHaveText("project");
    await expect(page.getByTestId("column").first()).toBeVisible();
    await expect(umbrellaTab(page)).toHaveCount(0);
  });

  test("folder mode: opens on the tab when there is no backlog, shows the tree in file order, and reports under the Report tab", async ({
    page,
  }) => {
    const violations: string[] = [];
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e) =>
        console.error(`CSP violation: ${e.violatedDirective}`),
      );
    });
    page.on("console", (m) => m.type() === "error" && violations.push(m.text()));
    await page.goto("/");
    await pickFolder(page, UMBRELLA);
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

  test("folder mode: a project with a backlog opens on the Board, and the Umbrella tab is still there", async ({
    page,
  }) => {
    await page.goto("/");
    await pickFolder(page, UMBRELLA_BACKLOG);
    await expect(page.getByRole("tab", { name: "Board" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("column").first()).toBeVisible();
    await expect(umbrellaTab(page)).toBeVisible();
    await umbrellaTab(page).click();
    expect(await treeOutline(page)).toEqual([{ h: "Hub", p: ["acme/widgets"], c: [] }]);
  });

  test("the tab comes after Report", async ({ page }) => {
    await page.goto("/");
    await pickFolder(page, UMBRELLA);
    const names = await page.getByRole("tab").allTextContents();
    expect(names.at(-1)).toBe("Umbrella");
    expect(names.at(-2)).toMatch(/^Report/);
  });

  test("a file with no pointer gives an empty tree and an Info item", async ({ page }) => {
    await page.goto("/");
    await pickFolder(page, UMBRELLA_EMPTY);
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
    await openUrl(page, HUB);
    await expect(page.locator("#message")).toContainText("HTTP 500");
    await expect(page.locator("#results")).toBeHidden();
  });
});

test.describe("the links of a repo pointer (3.9)", () => {
  test("On GitHub opens the repo in a new tab, with rel noopener noreferrer", async ({ page }) => {
    await page.goto("/");
    await pickFolder(page, UMBRELLA);
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
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toBeVisible();
    const before = gets(stub).length;
    await pointer(page, "acme/widgets").getByRole("link", { name: "Open in vizi" }).click();
    await expect(page.locator("#url-input")).toHaveValue("https://github.com/acme/widgets");
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
    await pickFolder(page, UMBRELLA);
    await pointer(page, "acme/lab-1").getByRole("link", { name: "Open in vizi" }).click();
    await expect(page.locator("#message")).toContainText("Not found or not public");
    await expect(page.locator("#results")).toBeHidden();
  });
});

test.describe("Show status of a folder pointer (3.9)", () => {
  test("folder mode: the status is shown in the panel outside the tree, headed with the pointer, blockers waiting on the product owner highlighted; the tree holds no status", async ({
    page,
  }) => {
    await page.goto("/");
    await pickFolder(page, UMBRELLA);
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

  test("what the status could not give is shown with it", async ({ page }) => {
    await page.goto("/");
    await pickFolder(page, UMBRELLA);
    await showStatus(page, "projects/odd/").click();
    await expect(panel(page).getByTestId("pstatus-focus")).toHaveText("Odd focus.");
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("not given");
    await expect(panel(page).getByTestId("panel-report-item").first()).toBeVisible();
    expect(await panel(page).getByTestId("panel-report-item").count()).toBeGreaterThanOrEqual(2);
  });

  test("a folder without STATUS.md says so, with no request", async ({ page, context }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toBeVisible();
    const before = stub.seen.length;
    await showStatus(page, "projects/bare/").click();
    await expect(panel(page)).toContainText("No STATUS.md in projects/bare/");
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 150)));
    expect(stub.seen.length).toBe(before);
  });

  test("folder mode: a folder without STATUS.md says so", async ({ page }) => {
    await page.goto("/");
    await pickFolder(page, UMBRELLA);
    await showStatus(page, "projects/bare/").click();
    await expect(panel(page)).toContainText("No STATUS.md in projects/bare/");
  });

  test("URL mode: one request for that path, none before it is used, and a fresh one each time", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
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
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page)).toContainText("HTTP 500");
    expect(await treeOutline(page)).toEqual(EXPECTED_TREE);
  });
});

test.describe("one panel, the newest wins (3.9)", () => {
  test("the next Show status, for any pointer, replaces the panel", async ({ page }) => {
    await page.goto("/");
    await pickFolder(page, UMBRELLA);
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

  test("an answer that arrives after the page has opened another project (a folder) is dropped", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (url, n) => url === NOTES_RAW && n === 1 });
    await page.goto("/");
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect.poll(() => gets(stub).filter((s) => s.url === NOTES_RAW).length).toBe(1);
    await pickFolder(page, PROJECT);
    await expect(page.locator("#project-name")).toHaveText("project");
    stub.release();
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)));
    await expect(page.locator("body")).not.toContainText("Notes phase");
  });

  test("a new project starts with no panel", async ({ page }) => {
    await page.goto("/");
    await pickFolder(page, UMBRELLA);
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page)).toBeVisible();
    await pickFolder(page, UMBRELLA_BACKLOG);
    await umbrellaTab(page).click();
    await expect(panel(page)).toBeHidden();
  });
});

test.describe("with a token held (3.8, 3.9)", () => {
  async function useToken(page: Page) {
    await page.locator("#token-input").fill(TOKEN);
    await page.locator("#token-use").click();
    await expect(page.getByTestId("token-line")).toBeVisible();
  }

  test("loading the umbrella project, Open in vizi and Show status all use it; no request goes to raw.githubusercontent.com", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
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
    await openUrl(page, HUB);
    await expect(umbrellaTab(page)).toBeVisible();
    await page.locator("#token-input").fill(TOKEN);
    await page.locator("#token-remember").setChecked(remember);
    await page.locator("#token-use").click();
    await expect(page.getByTestId("token-line")).toBeVisible();
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
    await page.getByRole("button", { name: "Forget the token" }).click();
    await expect(panel(page)).toBeHidden();
    await expect(panel(page)).toBeEmpty();
    await expect(page.locator("body")).not.toContainText("Notes phase");
    expect(await treeOutline(page)).toEqual(EXPECTED_TREE);
  });

  test("the key removed in another tab clears the panel", async ({ page, context }) => {
    await tokenlessUmbrellaThenToken(page, context, true);
    const other = await context.newPage();
    await other.goto("/");
    await other.evaluate(() => localStorage.removeItem("vizi.githubToken"));
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
    await openUrl(page, HUB);
    await showStatus(page, "projects/notes/").click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
    await page.locator("#token-input").fill(TOKEN);
    await page.locator("#token-use").click();
    await page.getByRole("button", { name: "Forget the token" }).click();
    await expect(panel(page).getByTestId("pstatus-phase")).toHaveText("Notes phase.");
  });

  test("a read that replaces a token read without one is not cleared by Forget", async ({
    page,
    context,
  }) => {
    await tokenlessUmbrellaThenToken(page, context, false);
    await page.getByRole("button", { name: "Forget the token" }).click();
    await showStatus(page, "projects/odd/").click();
    await expect(panel(page).getByTestId("pstatus-focus")).toHaveText("Odd focus.");
    await page.locator("#token-input").fill(TOKEN);
    await page.locator("#token-use").click();
    await page.getByRole("button", { name: "Forget the token" }).click();
    await expect(panel(page).getByTestId("pstatus-focus")).toHaveText("Odd focus.");
  });

  test("a 401 on Show status leaves no empty panel", async ({ page, context }) => {
    await stubGithub(context, { status: (url) => (url === NOTES_API ? 401 : undefined) });
    await page.goto("/");
    await openUrl(page, HUB);
    await page.locator("#token-input").fill(TOKEN);
    await page.locator("#token-use").click();
    await showStatus(page, "projects/notes/").click();
    await expect(page.locator("#message")).toContainText("GitHub refused the token");
    await expect(panel(page)).toBeHidden();
    await expect(panel(page)).toBeEmpty();
  });
});
