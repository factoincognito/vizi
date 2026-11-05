/**
 * Browser tests for the Repository field (docs/SPEC.md 3.1, "The
 * Repository field"; PBI-1.17): `<owner>/<repo>`, or a pasted GitHub address,
 * read by one reader. GitHub's answers are stubbed with routes: no test
 * reaches the network. All fixtures are synthetic, and every token is an
 * obviously fake value.
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

const project = join(__dirname, "fixtures", "project");
const read = (p: string) => readFileSync(join(project, p), "utf8");
const TOKEN = "github_pat_TEST_repofield_abcd1234";

const FIELD_MESSAGE =
  "Type the repository as <owner>/<repo>, for example fomo-t/fomo-f, or paste its GitHub address (github.com/<owner>/<repo>, optionally with /tree/<branch>).";
const BRANCH_MESSAGE = "vizi cannot open this branch: its name holds # or %.";
const CLONE_MESSAGE =
  "That is a clone address. Type the repository as <owner>/<repo>, without .git.";

type Seen = { url: string; authorization: string | undefined };

/** Answers GitHub for any acme repo and any branch, recording every GET with its Authorization header. */
async function stubGithub(context: BrowserContext): Promise<Seen[]> {
  const seen: Seen[] = [];
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
      seen.push({ url, authorization: (await request.allHeaders()).authorization });
      if (/^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+$/.test(url)) {
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ default_branch: "main" }),
        });
      }
      if (/\/git\/trees\/[^/]+\?recursive=1$/.test(url)) {
        const tree = ["STATUS.md", "docs/BACKLOG.md"].map((path) => ({ path, type: "blob" }));
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ truncated: false, tree }),
        });
      }
      if (url.includes("BACKLOG.md"))
        return route.fulfill({ status: 200, headers: cors, body: read("docs/BACKLOG.md") });
      if (url.includes("STATUS.md"))
        return route.fulfill({ status: 200, headers: cors, body: read("STATUS.md") });
      return route.fulfill({ status: 404, headers: cors, body: "" });
    },
  );
  return seen;
}

async function open(page: Page, text: string) {
  await page.locator("#url-input").fill(text);
  await page.locator("#open-url").click();
}

/** Gives the page time to make any request it would make (in the page, so no test clock is involved). */
const settle = (page: Page) => page.evaluate(() => new Promise<void>((r) => setTimeout(r, 200)));

test.describe("the Repository field (3.1)", () => {
  test("is labelled Repository, with the placeholder <owner>/<repo>, starts empty, and is not spell-checked or capitalised", async ({
    page,
  }) => {
    await page.goto("/");
    await openPanel(page);
    const field = page.getByLabel("Repository", { exact: true });
    await expect(field).toHaveAttribute("id", "url-input");
    await expect(page.locator("label[for=url-input]")).toHaveText("Repository");
    await expect(field).toHaveAttribute("placeholder", "<owner>/<repo>");
    await expect(field).toHaveAttribute("type", "text");
    await expect(field).toHaveAttribute("autocomplete", "off");
    await expect(field).toHaveAttribute("spellcheck", "false");
    await expect(field).toHaveAttribute("autocapitalize", "none");
    await expect(field).toHaveValue("");
    await expect(page.locator("#url-form #open-url")).toHaveText("Open");
    await expect(page.locator("#start")).not.toContainText("Public GitHub repo");
  });

  test("acme/widgets, github.com/acme/widgets and https://github.com/acme/widgets make the same requests", async ({
    page,
    context,
  }) => {
    const seen = await stubGithub(context);
    const lists: string[][] = [];
    for (const text of [
      "acme/widgets",
      "github.com/acme/widgets",
      "https://github.com/acme/widgets",
    ]) {
      // A fresh page each time, so the wait below is for this load's results.
      await page.goto("/");
      await openPanel(page);
      await expect(page.locator("#results")).toBeHidden();
      const mark = seen.length;
      await open(page, text);
      await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
      await expect(page.getByTestId("column").first()).toBeVisible();
      lists.push(seen.slice(mark).map((s) => s.url));
    }
    expect(lists[0]).toEqual([
      "https://api.github.com/repos/acme/widgets",
      "https://api.github.com/repos/acme/widgets/git/trees/main?recursive=1",
      "https://raw.githubusercontent.com/acme/widgets/main/docs/BACKLOG.md",
      "https://raw.githubusercontent.com/acme/widgets/main/STATUS.md",
    ]);
    expect(lists[1]).toEqual(lists[0]);
    expect(lists[2]).toEqual(lists[0]);
  });

  test("the short form with /tree/<branch> makes no request 1", async ({ page, context }) => {
    const seen = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await open(page, "acme/widgets/tree/dev");
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (dev)");
    expect(seen.map((s) => s.url)).toEqual([
      "https://api.github.com/repos/acme/widgets/git/trees/dev?recursive=1",
      "https://raw.githubusercontent.com/acme/widgets/dev/docs/BACKLOG.md",
      "https://raw.githubusercontent.com/acme/widgets/dev/STATUS.md",
    ]);
  });

  test("a branch copied percent-encoded is decoded once: request 2 sends it encoded once, and the heading shows it", async ({
    page,
    context,
  }) => {
    const seen = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await open(page, "acme/widgets/tree/fix-%C3%A5");
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (fix-å)");
    expect(seen[0]?.url).toBe(
      "https://api.github.com/repos/acme/widgets/git/trees/fix-%C3%A5?recursive=1",
    );
  });

  for (const [text, message] of [
    ["", FIELD_MESSAGE],
    ["acme", FIELD_MESSAGE],
    ["http://github.com/acme/widgets", FIELD_MESSAGE],
    ["gist.github.com/acme/widgets", FIELD_MESSAGE],
    ["acme/widgets/tree/a%23b", BRANCH_MESSAGE],
    ["github.com/acme/widgets.git", CLONE_MESSAGE],
  ] as const) {
    test(`${JSON.stringify(text)} makes no request and says so`, async ({ page, context }) => {
      const seen = await stubGithub(context);
      await page.goto("/");
      await openPanel(page);
      await open(page, text);
      await expect(page.locator("#message p")).toHaveText([message]);
      await settle(page);
      expect(seen).toEqual([]);
      await expect(page.locator("#results")).toBeHidden();
    });
  }

  test("a refused text counts as a load: the previous project's results are cleared and hidden", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await open(page, "acme/widgets");
    await expect(page.locator("#results")).toBeVisible();
    await open(page, "acme/widgets/tree/50%");
    await expect(page.locator("#message p")).toHaveText([BRANCH_MESSAGE]);
    await expect(page.locator("#results")).toBeHidden();
  });

  test("with a token held for acme, ACME/widgets uses it", async ({ page, context }) => {
    const seen = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await page.locator("#owner-input").fill("acme");
    await page.locator("#token-input").fill(TOKEN);
    await page.locator("#token-use").click();
    await expect(page.locator('[data-testid="token-line"][data-owner="acme"]')).toBeVisible();
    await open(page, "ACME/widgets");
    await expect(page.locator("#project-name")).toHaveText("ACME/widgets (main)");
    expect(seen.length).toBeGreaterThan(0);
    for (const s of seen) {
      expect(s.url.startsWith("https://api.github.com/repos/ACME/widgets")).toBe(true);
      expect(s.authorization).toBe(`Bearer ${TOKEN}`);
    }
  });

  test("the Owner field follows the field's text in either form until the user types in it", async ({
    page,
  }) => {
    await page.goto("/");
    await openPanel(page);
    const owner = page.locator("#owner-input");
    const field = page.locator("#url-input");
    await field.fill("acme/widgets");
    await expect(owner).toHaveValue("acme");
    await field.fill("github.com/fomo-t/app/tree/main");
    await expect(owner).toHaveValue("fomo-t");
    await field.fill("https://www.github.com/other/thing");
    await expect(owner).toHaveValue("other");
    // A text the field refuses leaves the Owner field as it was.
    await field.fill("short/x.git");
    await expect(owner).toHaveValue("other");
    await field.fill("github.com/solo");
    await expect(owner).toHaveValue("other");
    await owner.fill("mine");
    await field.fill("last/one");
    await expect(owner).toHaveValue("mine");
  });
});
