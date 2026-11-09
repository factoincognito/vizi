/**
 * Browser tests for the repository named in the page's address,
 * `?repo=<owner>/<repo>` (docs/SPEC.md 3.16, PBI-1.35). GitHub is stubbed
 * with routes for the synthetic owner acme; no test reaches the network.
 * Every token is an obviously fake value. Runs at phone and desktop width,
 * in light and dark mode.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { type BrowserContext, test as base, expect, type Page, type Route } from "@playwright/test";
import { isAllowedRequest } from "./guard";
import { branchesUrl, branchListRead } from "./picker";

/** Every test: any request other than the page's own document and GitHub's two hosts fails it (2.3). */
const test = base.extend<{ guard: undefined }>({
  guard: [
    async ({ context, baseURL }, use) => {
      const stray: string[] = [];
      const own = [`${baseURL}/`, pathToFileURL(join(__dirname, "..", "dist", "index.html")).href];
      context.on("request", (r) => {
        const url = r.url();
        // The page's own document, with the search the test opened it with.
        if (baseURL && url.startsWith(`${baseURL}/?`)) return;
        if (!isAllowedRequest(url, own)) stray.push(url);
      });
      await use(undefined);
      expect(stray, "requests the page should not make").toEqual([]);
    },
    { auto: true },
  ],
});

const project = join(__dirname, "fixtures", "project");
const read = (p: string) => readFileSync(join(project, p), "utf8");
const TOKEN = "github_pat_TEST_address_abcd1234";
const API = "https://api.github.com";
const RAW = "https://raw.githubusercontent.com";

type Seen = { url: string; authorization: string | undefined };
interface Stub {
  seen: Seen[];
  release: () => void;
}

/**
 * Answers GitHub on the whole context: acme is an organisation with the
 * repos widgets and gadgets, each with the default branch main, the branches
 * main and dev, and the project fixture's files. `hold` keeps the answers to
 * the URLs it matches waiting until `release()`.
 */
async function stubGithub(
  context: BrowserContext,
  hold: (url: string) => boolean = () => false,
): Promise<Stub> {
  const seen: Seen[] = [];
  const gates: (() => void)[] = [];
  let released = false;
  const release = () => {
    released = true;
    for (const open of gates) open();
  };
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, accept, content-type",
    "access-control-allow-methods": "GET, OPTIONS",
  };
  const json = (route: Route, body: unknown) =>
    route.fulfill({ status: 200, headers: cors, body: JSON.stringify(body) });
  const repos = ["widgets", "gadgets"];
  await context.route(
    /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//,
    async (route: Route) => {
      const request = route.request();
      const url = request.url();
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      seen.push({ url, authorization: (await request.allHeaders()).authorization });
      if (hold(url) && !released) await new Promise<void>((open) => gates.push(open));
      const path = url.replace(/^https:\/\/[^/]+/, "");
      if (path === "/users/acme") return json(route, { login: "acme", type: "Organization" });
      if (/^\/orgs\/acme\/repos\?/.test(path))
        return json(
          route,
          path.endsWith("page=1") ? repos.map((name) => ({ name, owner: { login: "acme" } })) : [],
        );
      if (/^\/repos\/acme\/[^/]+\/branches\?per_page=100&page=1$/.test(path))
        return json(route, [{ name: "main" }, { name: "dev" }]);
      const repo = /^\/repos\/acme\/([^/]+)$/.exec(path);
      if (repo?.[1] && repos.includes(repo[1])) return json(route, { default_branch: "main" });
      if (/\/git\/trees\/[^?]+\?recursive=1$/.test(path))
        return json(route, {
          truncated: false,
          tree: ["STATUS.md", "docs/BACKLOG.md"].map((p) => ({ path: p, type: "blob" })),
        });
      // Request 3, anonymous or through the contents API with `?ref=` (3.8).
      const file = path.replace(/\?ref=[^?]*$/, "");
      if (file.endsWith("BACKLOG.md"))
        return route.fulfill({ status: 200, headers: cors, body: read("docs/BACKLOG.md") });
      if (file.endsWith("STATUS.md"))
        return route.fulfill({ status: 200, headers: cors, body: read("STATUS.md") });
      return route.fulfill({ status: 404, headers: cors, body: "" });
    },
  );
  return { seen, release };
}

const urls = (stub: Stub) => stub.seen.map((s) => s.url);
const field = (page: Page) => page.locator("#url-input");
const select = (page: Page) => page.locator("#guide-select");
const guideMessage = (page: Page) => page.locator("#guide-message");
const projectName = (page: Page) => page.locator("#project-name");
/** Gives the page time to make any request it would make (in the page, so no test clock is involved). */
const settle = (page: Page) => page.evaluate(() => new Promise<void>((r) => setTimeout(r, 250)));

test.describe("the repository in the page's address (3.16)", () => {
  test("?repo=acme/widgets makes request 1, request 2 and the requests 3 in order, then the branch list, and nothing else; the project loads and the field holds acme/widgets", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/?repo=acme/widgets");
    await expect(projectName(page)).toHaveText("acme/widgets (main)");
    await branchListRead(page);
    await settle(page);
    expect(urls(stub)).toEqual([
      `${API}/repos/acme/widgets`,
      `${API}/repos/acme/widgets/git/trees/main?recursive=1`,
      `${RAW}/acme/widgets/main/docs/BACKLOG.md`,
      `${RAW}/acme/widgets/main/STATUS.md`,
      branchesUrl("acme", "widgets"),
    ]);
    await expect(field(page)).toHaveValue("acme/widgets");
    // No opening-guide request and no select: the open is "Open", with no blur before it.
    await expect(select(page)).toBeHidden();
  });

  test("?repo=acme shows acme's repos in the guide's select and loads no project; the message line is reserved before the list answers; typing / after it keeps the select", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, (u) => u.includes("/orgs/acme/repos"));
    await page.goto("/?repo=acme");
    await expect(field(page)).toHaveValue("acme");
    await expect(guideMessage(page)).toHaveText("Reading acme's repos…");
    await expect(guideMessage(page)).toHaveClass(/\breserved\b/);
    await expect(select(page)).toBeHidden();
    stub.release();
    await expect(page.locator('label[for="guide-select"]')).toHaveText("Repo of acme");
    await expect(select(page)).toBeVisible();
    await expect(select(page).locator("option")).toHaveText([
      "Choose a repo",
      "gadgets",
      "widgets",
    ]);
    await expect(guideMessage(page)).toHaveText("Choose one of acme's repos, or type acme/<repo>.");
    await expect(page.locator("#results")).toBeHidden();
    await expect(page.locator("#message")).toHaveText("");
    expect(urls(stub)).toEqual([
      `${API}/users/acme`,
      `${API}/orgs/acme/repos?type=all&sort=full_name&per_page=100&page=1`,
    ]);
    // Typing / after it, as after a typed acme and Open: the select stays, and nothing is read again.
    await field(page).focus();
    await page.keyboard.press("End");
    await page.keyboard.type("/");
    await expect(field(page)).toHaveValue("acme/");
    await settle(page);
    await expect(select(page)).toBeVisible();
    await expect(page.locator('label[for="guide-select"]')).toHaveText("Repo of acme");
    expect(urls(stub)).toHaveLength(2);
  });

  test("?repo=acme/w/tree/a%E0 shows the field's branch message and makes no request", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/?repo=acme/w/tree/a%E0");
    await expect(page.locator("#message")).toHaveText(
      "vizi cannot open this branch: its name holds # or %.",
    );
    await expect(field(page)).toHaveValue("acme/w/tree/a%E0");
    await settle(page);
    expect(urls(stub)).toEqual([]);
    await expect(page.locator("#results")).toBeHidden();
  });

  test("a refused value, ?repo=acme/widgets.git, shows the field's message and makes no request", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/?repo=acme/widgets.git");
    await expect(page.locator("#message")).toHaveText(
      "That is a clone address. Type the repository as <owner>/<repo>, without .git.",
    );
    await settle(page);
    expect(urls(stub)).toEqual([]);
  });

  for (const address of ["/", "/?x=1", "/?repo=", "/?repo", "/?REPO=acme/widgets"]) {
    test(`no repo value (${address}): no request at startup, the field empty, nothing in the message lines`, async ({
      page,
      context,
    }) => {
      const stub = await stubGithub(context);
      await page.goto(address);
      await expect(page.locator("#app")).not.toBeEmpty();
      await settle(page);
      expect(urls(stub)).toEqual([]);
      await expect(field(page)).toHaveValue("");
      await expect(page.locator("#message")).toHaveText("");
      await expect(guideMessage(page)).toHaveText("");
      await expect(guideMessage(page)).not.toHaveClass(/\breserved\b/);
      await expect(page.locator("#results")).toBeHidden();
    });
  }

  test("with a token saved for acme, the open sends it, only to api.github.com; the Owner prefill holds acme after the open", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await page.evaluate(
      (token) =>
        localStorage.setItem(
          "vizi.githubTokens",
          JSON.stringify({ tokens: { acme: token }, forgot: [] }),
        ),
      TOKEN,
    );
    await page.goto("/?repo=acme/widgets");
    await expect(projectName(page)).toHaveText("acme/widgets (main)");
    await branchListRead(page);
    expect(stub.seen.length).toBeGreaterThan(0);
    for (const s of stub.seen) {
      expect(s.url.startsWith(`${API}/`), s.url).toBe(true);
      expect(s.authorization, s.url).toBe(`Bearer ${TOKEN}`);
      expect(s.url).not.toContain(TOKEN);
    }
    await expect(page.locator("#owner-input")).toHaveValue("acme");
  });

  test("the address is unchanged after the open and after opening another repo from the field", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/?repo=acme/widgets");
    const href = await page.evaluate(() => location.href);
    const entries = await page.evaluate(() => history.length);
    await expect(projectName(page)).toHaveText("acme/widgets (main)");
    await branchListRead(page);
    expect(await page.evaluate(() => [location.href, history.length])).toEqual([href, entries]);
    await field(page).fill("acme/gadgets");
    await field(page).press("Enter");
    await expect(projectName(page)).toHaveText("acme/gadgets (main)");
    await branchListRead(page);
    expect(await page.evaluate(() => [location.href, history.length, location.hash])).toEqual([
      href,
      entries,
      "",
    ]);
    expect(href.endsWith("/?repo=acme/widgets")).toBe(true);
  });

  test("the focus is on document.body after the startup open", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/?repo=acme/widgets");
    await expect(projectName(page)).toHaveText("acme/widgets (main)");
    await branchListRead(page);
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  });
});
