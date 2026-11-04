/**
 * Browser tests for the page (docs/SPEC.md 3.1 to 3.7). GitHub's answers
 * are stubbed with routes: no test reaches the network. All fixtures are
 * synthetic (e2e/fixtures/project).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test as base, expect, type Page, type Route } from "@playwright/test";
import { isAllowedRequest } from "./guard";

/**
 * Every test: any request other than the page's own document (served, or
 * opened from disk) and the two GitHub hosts of 3.1 fails the test (SPEC
 * 2.3, 3.7 item 5).
 */
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

  test("hides the results of the previous load when a later load fails", async ({ page }) => {
    await stubGithub(page);
    await page.goto("/");
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    await openUrl(page, "https://github.com/acme/other");
    await expect(page.locator("#message")).toContainText("Not found or not public");
    await expect(page.locator("#results")).toBeHidden();
    await expect(page.getByTestId("column")).toHaveCount(0);
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
    await expect(page.locator("#message")).toContainText(
      "Type the repository as <owner>/<repo>, for example fomo-t/fomo-f",
    );
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

  test("a truncated file list: the report says so, and the documentation list and code-span links hold only the files GitHub sent", async ({
    page,
  }) => {
    // docs/guide.md is in the backlog's text but not in the (truncated) list.
    await stubGithub(page, {
      truncated: true,
      tree: ["README.md", "STATUS.md", "docs/BACKLOG.md"],
    });
    await page.goto("/");
    await openUrl(page);
    await page.getByRole("tab", { name: /^Report/ }).click();
    const note = page
      .locator('[data-testid="report-item"][data-kind="info"]')
      .filter({ hasText: "file list was truncated" });
    await expect(note).toHaveCount(1);
    await expect(note).toContainText("documentation list and file links may be incomplete");
    await page.getByRole("tab", { name: "Documentation" }).click();
    await expect(page.getByTestId("doc-link")).toHaveText(["README.md", "docs/BACKLOG.md"]);
    await page.getByRole("tab", { name: "Board" }).click();
    const card = page.locator('[data-testid="card"][data-id="WG-1"]');
    await card.locator("summary").click();
    // The code span names a file that is not in the list: no link. The relative link still goes to github.com.
    await expect(card.locator('a:has(code:text("docs/guide.md"))')).toHaveCount(0);
    await expect(card.locator('a[href$="/blob/main/docs/guide.md"]')).toHaveCount(1);
  });

  test("a complete file list adds no truncation note to the report", async ({ page }) => {
    await stubGithub(page);
    await page.goto("/");
    await openUrl(page);
    await page.getByRole("tab", { name: /^Report/ }).click();
    await expect(page.getByTestId("report-item").filter({ hasText: "truncated" })).toHaveCount(0);
  });

  test("works on a page opened from disk (file://)", async ({ page }) => {
    await stubGithub(page);
    await page.goto(pathToFileURL(join(here, "..", "dist", "index.html")).href);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
  });
});

/** Replaces the STATUS.md answer of an already stubbed page. */
async function stubGithubStatus(page: Page, status: string) {
  await page.route("https://raw.githubusercontent.com/acme/widgets/main/STATUS.md", (r) =>
    r.fulfill({ status: 200, headers: { "access-control-allow-origin": "*" }, body: status }),
  );
}

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

  test("says 'No blockers listed' for an empty Blockers section, and 'not given' for a missing one", async ({
    page,
  }) => {
    await stubGithub(page, {
      status: "# Status\nLast update: 2026-11-04\n## Phase\nx\n## Blockers\n\n",
    });
    await page.goto("/");
    await openUrl(page);
    await expect(page.getByTestId("blockers-empty")).toHaveText("No blockers listed");
    await expect(page.getByTestId("blockers-none")).toHaveCount(0);
    await stubGithubStatus(page, "# Status\n## Phase\nx\n");
    await openUrl(page);
    await expect(page.getByTestId("blockers-missing")).toHaveText("not given");
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
    await expect(page.getByTestId("blockers-empty")).toHaveCount(0);
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

test.describe("heading ids and anchors (3.7 item 4)", () => {
  const backlog = [
    "# Backlog",
    "",
    "- **[NOW] UC-1** — Headings in a description.",
    "  Intro.",
    "",
    "  ## Översikt",
    "",
    "  Go to [the overview](#Översikt) or [the second one](#översikt-1).",
    "",
    "  ## Översikt",
    "",
    "  Done.",
  ].join("\n");

  test("every id on the page is unique when one description is open in a board card and a list row", async ({
    page,
  }) => {
    await stubGithub(page, { tree: ["docs/BACKLOG.md"], backlog });
    await page.goto("/");
    await openUrl(page);
    await page.locator('[data-testid="card"][data-id="UC-1"] summary').click();
    await expect(page.locator('[data-testid="card"] [data-testid="description"] h4')).toHaveCount(
      2,
    );
    await page.getByRole("tab", { name: "List" }).click();
    await page.locator('[data-testid="list-row"][data-id="UC-1"] summary').click();
    await expect(
      page.locator('[data-testid="list-row"] [data-testid="description"] h4'),
    ).toHaveCount(2);
    const ids = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[id]"), (e) => e.id),
    );
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    const headings = await page
      .locator('[data-testid="description"] h4')
      .evaluateAll((els) => els.map((e) => e.id));
    expect(headings).toHaveLength(4);
    expect(headings.every((id) => id.startsWith("md-") && id.includes("översikt"))).toBe(true);
  });

  test("an anchor in a description points at the heading of the same description, Unicode slug included", async ({
    page,
  }) => {
    await stubGithub(page, { tree: ["docs/BACKLOG.md"], backlog });
    await page.goto("/");
    await openUrl(page);
    await page.locator('[data-testid="card"][data-id="UC-1"] summary').click();
    await page.getByRole("tab", { name: "List" }).click();
    const row = page.locator('[data-testid="list-row"][data-id="UC-1"]');
    await row.locator("summary").click();
    const first = row.getByRole("link", { name: "the overview" });
    const second = row.getByRole("link", { name: "the second one" });
    for (const [link, index] of [
      [first, 0],
      [second, 1],
    ] as const) {
      const id = decodeURIComponent(((await link.getAttribute("href")) ?? "").slice(1));
      const inRow = await row.locator("h4").nth(index).getAttribute("id");
      expect(id).toBe(inRow);
      await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
    }
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

/**
 * A second repo, acme/slow, whose first answer waits until `release()`.
 * `finished` resolves when its last answer has been sent.
 */
async function stubSlowRepo(page: Page, answer: "files" | "error") {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let finish!: () => void;
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const cors = { "access-control-allow-origin": "*" };
  await page.route(/\/acme\/slow/, async (route: Route) => {
    const url = route.request().url();
    if (url === "https://api.github.com/repos/acme/slow") {
      await gate;
      if (answer === "error") {
        await route.fulfill({ status: 500, headers: cors, body: "" });
        finish();
        return;
      }
      return route.fulfill({
        status: 200,
        headers: cors,
        body: JSON.stringify({ default_branch: "main" }),
      });
    }
    if (url.endsWith("recursive=1")) {
      return route.fulfill({
        status: 200,
        headers: cors,
        body: JSON.stringify({
          truncated: false,
          tree: [{ path: "docs/BACKLOG.md", type: "blob" }],
        }),
      });
    }
    await route.fulfill({ status: 200, headers: cors, body: "- **[NOW] SL-1** — Slow.\n" });
    finish();
  });
  return { release, finished };
}

/** Gives the page time to act on an answer it has just been sent (in the page, so no test clock is involved). */
const settle = (page: Page) => page.evaluate(() => new Promise<void>((r) => setTimeout(r, 150)));

test.describe("a late answer from an older load (3.1)", () => {
  const SLOW = "https://github.com/acme/slow";

  test("is ignored when a newer address was submitted", async ({ page }) => {
    await stubGithub(page);
    const slow = await stubSlowRepo(page, "files");
    await page.goto("/");
    await openUrl(page, SLOW);
    await openUrl(page);
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    slow.release();
    await slow.finished;
    await settle(page);
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await expect(page.getByTestId("card").filter({ hasText: "SL-1" })).toHaveCount(0);
    await expect(page.locator('[data-testid="card"][data-id="WG-1"]')).toHaveCount(1);
  });

  test("does not show its error over the newer load's results", async ({ page }) => {
    await stubGithub(page);
    const slow = await stubSlowRepo(page, "error");
    await page.goto("/");
    await openUrl(page, SLOW);
    await openUrl(page);
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    slow.release();
    await slow.finished;
    await settle(page);
    await expect(page.locator("#results")).toBeVisible();
    await expect(page.locator("#message")).not.toContainText("500");
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
  });

  test("is ignored when a refused address was submitted after it", async ({ page }) => {
    await stubGithub(page);
    const slow = await stubSlowRepo(page, "files");
    await page.goto("/");
    await openUrl(page, SLOW);
    await openUrl(page, "not an address");
    await expect(page.locator("#message")).toContainText(
      "Type the repository as <owner>/<repo>, for example fomo-t/fomo-f",
    );
    slow.release();
    await slow.finished;
    await settle(page);
    await expect(page.locator("#message")).toContainText(
      "Type the repository as <owner>/<repo>, for example fomo-t/fomo-f",
    );
    await expect(page.locator("#results")).toBeHidden();
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
