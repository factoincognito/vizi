/**
 * Browser tests for the page (docs/SPEC.md 3.1 to 3.7). GitHub's answers
 * are stubbed with routes: no test reaches the network. All fixtures are
 * synthetic (e2e/fixtures/project).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, type Page, type Route, test } from "@playwright/test";

const here = __dirname;
const project = join(here, "fixtures", "project");
const read = (p: string) => readFileSync(join(project, p), "utf8");
const REPO = "https://github.com/acme/widgets";

type Stub = {
  tree?: string[];
  truncated?: boolean;
  backlog?: string;
  status?: string;
  apiStatus?: number;
};

/** Answers GitHub's endpoints for acme/widgets and records every request the page makes. */
async function stubGithub(page: Page, stub: Stub = {}): Promise<string[]> {
  const requested: string[] = [];
  const cors = { "access-control-allow-origin": "*" };
  const files = stub.tree ?? [
    "README.md",
    "STATUS.md",
    "docs/BACKLOG.md",
    "docs/guide.md",
    "src/index.ts",
  ];
  await page.route(
    /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//,
    async (route: Route) => {
      const url = route.request().url();
      requested.push(url);
      if (stub.apiStatus) return route.fulfill({ status: stub.apiStatus, headers: cors, body: "" });
      if (url === "https://api.github.com/repos/acme/widgets") {
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ default_branch: "main" }),
        });
      }
      if (url === "https://api.github.com/repos/acme/widgets/git/trees/main?recursive=1") {
        const tree = files.map((path) => ({ path, type: "blob" }));
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ truncated: stub.truncated ?? false, tree }),
        });
      }
      if (url.endsWith("/docs/BACKLOG.md"))
        return route.fulfill({
          status: 200,
          headers: cors,
          body: stub.backlog ?? read("docs/BACKLOG.md"),
        });
      if (url.endsWith("/STATUS.md"))
        return route.fulfill({
          status: 200,
          headers: cors,
          body: stub.status ?? read("STATUS.md"),
        });
      return route.fulfill({ status: 404, headers: cors, body: "" });
    },
  );
  return requested;
}

/** Fails the test on any request the page should not make: anything but its own document and the stubbed GitHub hosts. */
function watchRequests(page: Page, allowed: (url: string) => boolean): string[] {
  const stray: string[] = [];
  page.on("request", (r) => {
    if (!allowed(r.url())) stray.push(r.url());
  });
  return stray;
}

async function openUrl(page: Page, url = REPO) {
  await page.locator("#url-input").fill(url);
  await page.locator("#open-url").click();
}

test.describe("GitHub URL input (3.1)", () => {
  test("makes the requests of 3.1 in order, and nothing else", async ({ page, baseURL }) => {
    const requested = await stubGithub(page);
    const stray = watchRequests(
      page,
      (u) =>
        u === `${baseURL}/` ||
        requested.includes(u) ||
        u.startsWith("https://api.github.com/") ||
        u.startsWith("https://raw.githubusercontent.com/"),
    );
    const problems: string[] = [];
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(e.message));
    await page.goto("/");
    expect(requested, "no request before the user enters a URL").toEqual([]);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    expect(requested).toEqual([
      "https://api.github.com/repos/acme/widgets",
      "https://api.github.com/repos/acme/widgets/git/trees/main?recursive=1",
      "https://raw.githubusercontent.com/acme/widgets/main/docs/BACKLOG.md",
      "https://raw.githubusercontent.com/acme/widgets/main/STATUS.md",
    ]);
    expect(stray).toEqual([]);
    expect(problems).toEqual([]);
  });

  test("shows 'not found or not public' on a 404", async ({ page }) => {
    await stubGithub(page, { apiStatus: 404 });
    await page.goto("/");
    await openUrl(page);
    await expect(page.locator("#message")).toContainText("Not found or not public");
  });

  test("shows another HTTP status with the status", async ({ page }) => {
    await stubGithub(page, { apiStatus: 403 });
    await page.goto("/");
    await openUrl(page);
    await expect(page.locator("#message")).toContainText("403");
  });

  test("refuses an address that is not a github.com repo, without a request", async ({ page }) => {
    const requested = await stubGithub(page);
    await page.goto("/");
    await openUrl(page, "https://example.com/acme/widgets");
    await expect(page.locator("#message")).toContainText("https://github.com/<owner>/<repo>");
    expect(requested).toEqual([]);
  });

  test("says that no backlog file was found and still shows the status", async ({ page }) => {
    await stubGithub(page, { tree: ["README.md", "STATUS.md"] });
    await page.goto("/");
    await openUrl(page);
    await expect(page.locator("#message")).toContainText("No backlog file was found");
    await expect(page.getByTestId("status-phase")).toHaveText("Build.");
  });

  test("tells that the file list was truncated", async ({ page }) => {
    await stubGithub(page, { truncated: true });
    await page.goto("/");
    await openUrl(page);
    await expect(page.locator("#message")).toContainText("truncated");
  });

  test("works on a page opened from disk (file://)", async ({ page }) => {
    await stubGithub(page);
    await page.goto(pathToFileURL(join(here, "..", "dist", "index.html")).href);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
  });
});

test.describe("status (3.3)", () => {
  test("shows the fields above the board, Last update, and highlights blockers waiting on the product owner", async ({
    page,
  }) => {
    await stubGithub(page);
    await page.goto("/");
    await openUrl(page);
    await expect(page.getByTestId("status-phase")).toHaveText("Build.");
    await expect(page.getByTestId("status-focus")).toHaveText("The widget itself.");
    await expect(page.getByTestId("status-focus").locator("em")).toHaveText("widget");
    await expect(page.getByTestId("status-next")).toHaveText("Polish it.");
    await expect(page.getByTestId("status-updated")).toContainText("2026-11-04");
    const blockers = page.getByTestId("blocker");
    await expect(blockers).toHaveCount(2);
    await expect(blockers.nth(0)).toHaveAttribute("data-waiting", "true");
    await expect(blockers.nth(1)).toHaveAttribute("data-waiting", "false");
    const board = await page.getByTestId("column").first().boundingBox();
    const status = await page.getByTestId("status-phase").boundingBox();
    expect((status?.y ?? 1e9) < (board?.y ?? 0)).toBe(true);
  });

  test("says so without a STATUS.md", async ({ page }) => {
    await stubGithub(page, { tree: ["docs/BACKLOG.md"] });
    await page.goto("/");
    await openUrl(page);
    await expect(page.locator("#status")).toContainText("No STATUS.md");
    await expect(page.getByTestId("column").first()).toBeVisible();
  });

  test("shows None for a status without blockers", async ({ page }) => {
    await stubGithub(page, {
      status:
        "# Status\nLast update: 2026-11-04\n## Phase\nx\n## Current focus\nx\n## Next step\nx\n## Blockers\nNone. Waiting on nothing.\n",
    });
    await page.goto("/");
    await openUrl(page);
    await expect(page.getByTestId("blockers-none")).toContainText("None");
    await expect(page.getByTestId("blockers-none")).toContainText("Waiting on nothing.");
    await expect(page.getByTestId("blocker")).toHaveCount(0);
  });
});

test.describe("board and list (3.2)", () => {
  test.beforeEach(async ({ page }) => {
    await stubGithub(page);
    await page.goto("/");
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
  });

  test("has one column per marker in the order of 3.2, with counts, DONE folded and open-able", async ({
    page,
  }) => {
    const markers = await page
      .getByTestId("column")
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-marker")));
    expect(markers).toEqual(["NOW", "NEXT", "LATER", "IDEA", "DONE", "WAITING"]);
    await expect(page.locator('[data-testid="column"][data-marker="NOW"] h3')).toContainText("1");
    const done = page.locator('[data-testid="column"][data-marker="DONE"]');
    await expect(done.getByTestId("card")).toBeHidden();
    await done.locator(":scope > summary").click();
    await expect(done.getByTestId("card")).toBeVisible();
  });

  test("shows marker, ID, notes and title on a card, and the description when opened", async ({
    page,
  }) => {
    const card = page.locator('[data-testid="card"][data-id="WG-1"]');
    await expect(card).toContainText("WG-1");
    await expect(card).toContainText("since 2026-11-01");
    await expect(card).toContainText("Build the widget.");
    await expect(card.getByTestId("description")).toBeHidden();
    await card.locator("summary").click();
    await expect(card.getByTestId("description")).toContainText("See the guide and outside.");
  });

  test("lists entries under the backlog's own headings, with a marker filter and a search", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "List" }).click();
    await expect(page.getByTestId("list-group")).toHaveText([/Phase 1 — Basics/, /Phase 2 — More/]);
    await page.locator("#marker-filter").selectOption("IDEA");
    await expect(page.getByTestId("list-row")).toHaveCount(1);
    await page.locator("#marker-filter").selectOption("");
    await page.locator("#search").fill("NEEDLE");
    await expect(page.getByTestId("list-row")).toHaveCount(1);
    await expect(page.getByTestId("list-row")).toContainText("WG-9");
    await page.locator("#search").fill("zzzz");
    await expect(page.getByTestId("list-row")).toHaveCount(0);
  });

  test("does not scroll sideways", async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("documentation links (3.4)", () => {
  test("lists README and docs files, linking to github.com in a new tab in URL mode; code spans naming files become links", async ({
    page,
  }) => {
    await stubGithub(page);
    await page.goto("/");
    await openUrl(page);
    await page.getByRole("tab", { name: "Documentation" }).click();
    const links = page.getByTestId("doc-link");
    await expect(links).toHaveText(["README.md", "docs/BACKLOG.md", "docs/guide.md"]);
    await expect(links.nth(2)).toHaveAttribute(
      "href",
      "https://github.com/acme/widgets/blob/main/docs/guide.md",
    );
    await expect(links.nth(2)).toHaveAttribute("target", "_blank");
    await expect(links.nth(2)).toHaveAttribute("rel", "noopener noreferrer");
    await page.getByRole("tab", { name: "Board" }).click();
    const card = page.locator('[data-testid="card"][data-id="WG-1"]');
    await card.locator("summary").click();
    await expect(card.locator('a[href$="/blob/main/docs/guide.md"]')).toHaveCount(2);
    await expect(card.locator("code", { hasText: "src/missing.ts" })).toBeVisible();
    await expect(card.locator('a:has(code:text("src/missing.ts"))')).toHaveCount(0);
  });
});

test.describe("report tab (3.5)", () => {
  test("lists what could not be read with line numbers, sorted into the three kinds, with counts", async ({
    page,
  }) => {
    await stubGithub(page);
    await page.goto("/");
    await openUrl(page);
    const tab = page.getByRole("tab", { name: /^Report/ });
    await expect(tab).toContainText("(");
    await tab.click();
    const warning = page.locator('[data-testid="report-item"][data-kind="warning"]');
    await expect(
      warning.filter({ hasText: "unusual" }).or(warning.filter({ hasText: "recommended" })),
    ).not.toHaveCount(0);
    await expect(
      page.locator('[data-testid="report-item"][data-kind="info"]').first(),
    ).toContainText(/line \d+/);
    await expect(page.getByTestId("report-count-info")).toBeVisible();
    await expect(page.getByTestId("report-count-warning")).toBeVisible();
    await expect(page.getByTestId("report-count-error")).toBeVisible();
  });

  test("names the second backlog file when more than one exists", async ({ page }) => {
    await stubGithub(page, { tree: ["BACKLOG.md", "docs/BACKLOG.md", "STATUS.md"] });
    await page.route("https://raw.githubusercontent.com/acme/widgets/main/BACKLOG.md", (r) =>
      r.fulfill({
        status: 200,
        headers: { "access-control-allow-origin": "*" },
        body: "- **[NOW] AB-1** — Only.\n",
      }),
    );
    await page.goto("/");
    await openUrl(page);
    await page.getByRole("tab", { name: /^Report/ }).click();
    await expect(
      page.getByTestId("report-item").filter({ hasText: "BACKLOG.md" }).first(),
    ).toContainText("more than one");
  });
});

test.describe("rendering contract (3.7)", () => {
  test("shows script and img markup as text, runs nothing, links nothing dangerous, loads no image", async ({
    page,
    baseURL,
  }) => {
    const requested = await stubGithub(page);
    const stray = watchRequests(
      page,
      (u) =>
        u === `${baseURL}/` ||
        requested.includes(u) ||
        /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//.test(u),
    );
    await page.goto("/");
    await openUrl(page);
    const card = page.locator('[data-testid="card"][data-id="WG-3"]');
    await card.locator("summary").click();
    const description = card.getByTestId("description");
    await expect(description).toContainText("<script>window.__pwned = 1</script>");
    await expect(description).toContainText('<img src=x onerror="window.__pwned = 2">');
    await expect(description.locator("script, img")).toHaveCount(0);
    await expect(description).toContainText("bad link");
    await expect(description.locator('a[href^="javascript" i]')).toHaveCount(0);
    await expect(description.getByRole("link", { name: "bad link" })).toHaveCount(0);
    await expect(description.getByRole("link", { name: "mixed" })).toHaveCount(0);
    await expect(description.getByRole("link", { name: "remote" })).toHaveAttribute(
      "href",
      "https://example.com/tracker.png",
    );
    expect(
      await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned),
    ).toBeUndefined();
    expect(stray, "the image and nothing else was requested").toEqual([]);
  });
});

test.describe("local folder input (3.1, 3.4)", () => {
  test("reads a project folder: board, status, docs; opens a doc in the page; resolves relative links", async ({
    page,
    baseURL,
  }) => {
    const stray = watchRequests(page, (u) => u === `${baseURL}/`);
    await page.goto("/");
    await page.locator("#folder-input").setInputFiles(project);
    await expect(page.getByTestId("column").first()).toBeVisible();
    await expect(page.getByTestId("status-phase")).toHaveText("Build.");
    await page.getByRole("tab", { name: "Documentation" }).click();
    await expect(page.getByTestId("doc-link")).toHaveText([
      "README.md",
      "docs/BACKLOG.md",
      "docs/guide.md",
    ]);
    await page.getByTestId("doc-link").filter({ hasText: "docs/guide.md" }).click();
    const view = page.locator("#doc-view");
    await expect(view.locator(".md h3")).toHaveText("Widget guide");
    await expect(view).toContainText("<script>window.__pwned = 4</script>");
    await expect(view.locator("script")).toHaveCount(0);
    await expect(view.getByRole("link", { name: "readme" })).toBeVisible();
    await expect(view.getByRole("link", { name: "missing file" })).toHaveCount(0);
    await view.getByRole("link", { name: "readme" }).click();
    await expect(view.locator(".md h3")).toHaveText("Widget");
    expect(stray).toEqual([]);
  });

  test("picks a folder on a page opened from disk (file://)", async ({ page }) => {
    await page.goto(pathToFileURL(join(here, "..", "dist", "index.html")).href);
    await page.locator("#folder-input").setInputFiles(project);
    await expect(page.getByTestId("column").first()).toBeVisible();
  });

  test("a code span naming a project file is a link in folder mode, too", async ({ page }) => {
    await page.goto("/");
    await page.locator("#folder-input").setInputFiles(project);
    const card = page.locator('[data-testid="card"][data-id="WG-1"]');
    await card.locator("summary").click();
    await card.locator('a:has(code:text("docs/guide.md"))').first().click();
    await expect(page.locator("#doc-view .md h3")).toHaveText("Widget guide");
  });
});

test.describe("a long backlog (SPEC 4, item 6)", () => {
  test("a synthetic file of 1500 lines loads and renders in a few seconds", async ({ page }) => {
    const rows: string[] = ["# Long backlog", ""];
    for (let i = 1; rows.length < 1500; i++) {
      rows.push(
        `- **[${["NOW", "NEXT", "LATER"][i % 3]}] LB-${i}** — Item number ${i}. Detail with \`code\` and *emphasis*.`,
        "  More detail on a second line.",
        "",
      );
    }
    await stubGithub(page, { tree: ["docs/BACKLOG.md"], backlog: rows.join("\n") });
    await page.goto("/");
    const start = Date.now();
    await openUrl(page);
    await expect(page.getByTestId("card").first()).toBeVisible();
    await page.getByRole("tab", { name: "List" }).click();
    await expect(page.getByTestId("list-row").first()).toBeVisible();
    expect(Date.now() - start).toBeLessThan(8000);
    expect(await page.getByTestId("list-row").count()).toBeGreaterThan(400);
  });
});
