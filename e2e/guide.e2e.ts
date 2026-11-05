/**
 * Browser tests for the opening guide (docs/SPEC.md 3.1, "Guided opening",
 * PBI-1.19): the datalist while typing, the select on leaving the field, and
 * Open. GitHub is stubbed with routes for synthetic owners (acme, beta) and
 * their repos; every repo answers with the same synthetic files. Every token
 * is an obviously fake value. Whether the browser shows the datalist's
 * suggestions is browser chrome, outside the DOM, so no test asserts it
 * (section 4, item 30).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { type BrowserContext, test as base, expect, type Page, type Route } from "@playwright/test";
import { isAllowedRequest } from "./guard";
import { openPanel } from "./panel";
import { branchListRead } from "./picker";

const test = base.extend<{ guard: undefined }>({
  guard: [
    async ({ context, baseURL }, use) => {
      const stray: string[] = [];
      const own = [`${baseURL}/`, pathToFileURL(join(__dirname, "..", "dist", "index.html")).href];
      // On the context, so a second tab's requests are guarded too.
      context.on("request", (r) => {
        if (!isAllowedRequest(r.url(), own)) stray.push(r.url());
      });
      await use(undefined);
      expect(stray, "requests the page should not make").toEqual([]);
    },
    { auto: true },
  ],
});

const project = join(__dirname, "fixtures", "project");
const umbrella = join(__dirname, "fixtures", "umbrella");
const read = (dir: string, p: string) => readFileSync(join(dir, p), "utf8");
const TOKEN = "github_pat_TEST_guide_abcd1234";
const API = "https://api.github.com";

type Kind = "User" | "Organization" | "Bot";
interface Owner {
  type: Kind;
  /** The owner's repo names, in the order GitHub gives them. */
  repos: string[];
}
interface StubOptions {
  owners?: Record<string, Owner>;
  /** What /user/repos gives, for the token's own account: each repo's name and owner login. */
  mine?: { name: string; login: string }[];
  /** Each repo's default branch ("owner/repo"); null: an answer without one. Default: main. */
  defaults?: Record<string, string | null>;
  /** Each repo's branches ("owner/repo"). Default: main, dev. */
  branches?: Record<string, string[]>;
  /** Keeps the answer to the n-th request (from 0) of a URL waiting until `release(url)`. */
  hold?: (url: string, n: number) => boolean;
  /** Overrides an answer's status (and headers) for the n-th request of a URL. */
  status?: (
    url: string,
    n: number,
  ) => { status: number; headers?: Record<string, string> } | undefined;
}
type Seen = { url: string; authorization: string | undefined };
interface Stub {
  seen: Seen[];
  release: (url?: string) => void;
}

const DEFAULT_OWNERS: Record<string, Owner> = {
  acme: { type: "Organization", repos: ["widgets", "gadgets", "plain"] },
  beta: { type: "User", repos: ["tools"] },
};

/** Answers GitHub on the whole context. */
async function stubGithub(context: BrowserContext, options: StubOptions = {}): Promise<Stub> {
  const seen: Seen[] = [];
  const count = new Map<string, number>();
  const gates: { url: string; open: () => void }[] = [];
  const opened = new Set<string>();
  let allOpened = false;
  const release = (url?: string) => {
    for (const g of gates) if (url === undefined || g.url === url) g.open();
    if (url === undefined) allOpened = true;
    else opened.add(url);
  };
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, accept, content-type",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-expose-headers": "x-ratelimit-remaining, x-ratelimit-reset",
  };
  const owners = options.owners ?? DEFAULT_OWNERS;
  const json = (route: Route, body: unknown) =>
    route.fulfill({ status: 200, headers: cors, body: JSON.stringify(body) });
  const paged = <T>(all: T[], n: number) => all.slice((n - 1) * 100, n * 100);
  await context.route(
    /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//,
    async (route: Route) => {
      const request = route.request();
      const url = request.url();
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      seen.push({ url, authorization: (await request.allHeaders()).authorization });
      const n = count.get(url) ?? 0;
      count.set(url, n + 1);
      if (options.hold?.(url, n) && !allOpened && !opened.has(url))
        await new Promise<void>((open) => gates.push({ url, open }));
      const forced = options.status?.(url, n);
      if (forced)
        return route.fulfill({
          status: forced.status,
          headers: { ...cors, ...forced.headers },
          body: "",
        });
      const path = url.replace(/^https:\/\/[^/]+/, "");
      let m = /^\/users\/([^/?]+)$/.exec(path);
      if (m?.[1]) {
        const o = owners[m[1].toLowerCase()];
        if (!o) return route.fulfill({ status: 404, headers: cors, body: "" });
        return json(route, { login: m[1], type: o.type });
      }
      m = /^\/(?:users|orgs)\/([^/]+)\/repos\?.*page=(\d+)$/.exec(path);
      if (m?.[1] && m[2]) {
        const o = owners[m[1].toLowerCase()];
        const items = (o?.repos ?? []).map((name) => ({ name, owner: { login: m?.[1] } }));
        return json(route, paged(items, Number(m[2])));
      }
      m = /^\/user\/repos\?.*page=(\d+)$/.exec(path);
      if (m?.[1]) {
        const mine =
          options.mine ??
          Object.entries(owners).flatMap(([login, o]) => o.repos.map((name) => ({ name, login })));
        const items = mine.map((r) => ({ name: r.name, owner: { login: r.login } }));
        return json(route, paged(items, Number(m[1])));
      }
      m = /^\/repos\/([^/]+)\/([^/]+)\/branches\?per_page=100&page=(\d+)$/.exec(path);
      if (m?.[1] && m[2] && m[3]) {
        const key = `${m[1].toLowerCase()}/${m[2].toLowerCase()}`;
        const all = options.branches?.[key] ?? ["main", "dev"];
        return json(
          route,
          paged(all, Number(m[3])).map((name) => ({
            name,
            commit: { sha: "0" },
            protected: false,
          })),
        );
      }
      m = /^\/repos\/([^/]+)\/([^/]+)$/.exec(path);
      if (m?.[1] && m[2]) {
        const key = `${m[1].toLowerCase()}/${m[2].toLowerCase()}`;
        // A repo of no stubbed owner, with no stubbed default, is not there (the umbrella's hub excepted).
        const known =
          owners[m[1].toLowerCase()]?.repos.includes(m[2]) ||
          options.defaults?.[key] !== undefined ||
          m[2] === "hub";
        if (!known) return route.fulfill({ status: 404, headers: cors, body: "" });
        const def = options.defaults?.[key];
        return json(route, def === null ? { name: m[2] } : { default_branch: def ?? "main" });
      }
      if (/\/git\/trees\/[^?]+\?recursive=1$/.test(url)) {
        const isHub = url.includes("/repos/acme/hub/");
        const files = isHub ? ["PROJECTS.md"] : ["STATUS.md", "docs/BACKLOG.md"];
        const tree = files.map((p) => ({ path: p, type: "blob" }));
        return json(route, { truncated: false, tree });
      }
      if (url.includes("PROJECTS.md"))
        return route.fulfill({ status: 200, headers: cors, body: read(umbrella, "PROJECTS.md") });
      if (url.includes("BACKLOG.md"))
        return route.fulfill({
          status: 200,
          headers: cors,
          body: read(project, "docs/BACKLOG.md"),
        });
      if (url.includes("STATUS.md"))
        return route.fulfill({ status: 200, headers: cors, body: read(project, "STATUS.md") });
      return route.fulfill({ status: 404, headers: cors, body: "" });
    },
  );
  return { seen, release };
}

const urls = (stub: Stub) => stub.seen.map((s) => s.url);
const ownerUrl = (owner: string) => `${API}/users/${owner}`;
const orgPage = (owner: string, n = 1) =>
  `${API}/orgs/${owner}/repos?type=all&sort=full_name&per_page=100&page=${n}`;
const userPage = (owner: string, n = 1) =>
  `${API}/users/${owner}/repos?type=owner&sort=full_name&per_page=100&page=${n}`;
const minePage = (n = 1) =>
  `${API}/user/repos?affiliation=owner&sort=full_name&per_page=100&page=${n}`;
const repoUrl = (owner: string, repo: string) => `${API}/repos/${owner}/${repo}`;
const branchPage = (owner: string, repo: string, n = 1) =>
  `${API}/repos/${owner}/${repo}/branches?per_page=100&page=${n}`;
const times = (stub: Stub, url: string) => urls(stub).filter((u) => u === url).length;
/** The owner-list requests: /users/<owner>, and the three repo lists. */
const ownerRequests = (stub: Stub) =>
  urls(stub).filter((u) => /\/users\/|\/orgs\/|\/user\/repos/.test(u));

const field = (page: Page) => page.locator("#url-input");
const select = (page: Page) => page.locator("#guide-select");
const label = (page: Page) => page.locator('label[for="guide-select"]');
const guideMessage = (page: Page) => page.locator("#guide-message");
const openButton = (page: Page) => page.locator("#open-url");
const optionValues = (page: Page) =>
  page
    .locator("#repo-list option")
    .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
const selectTexts = (page: Page) => select(page).locator("option").allTextContents();
/** Gives the page time to make any request it would make (in the page, so no test clock is involved). */
const settle = (page: Page) => page.evaluate(() => new Promise<void>((r) => setTimeout(r, 250)));
/** Leaves the field by a click elsewhere on the page. */
const clickAway = (page: Page) => page.locator("#access-line").click();

async function typeIn(page: Page, text: string) {
  await field(page).click();
  await field(page).pressSequentially(text);
}

async function addToken(page: Page, owner = "acme", remember = false) {
  await openPanel(page);
  await page.locator("#owner-input").fill(owner);
  await page.locator("#token-input").fill(TOKEN);
  await page.locator("#token-remember").setChecked(remember);
  await page.locator("#token-use").click();
  await expect(page.locator(`[data-testid=token-line][data-owner="${owner}"]`)).toBeVisible();
}

test.describe("the list while typing: a native datalist (3.1)", () => {
  test("typing acme/ reads acme's repos once; typing on reads nothing; a second acme/ reads nothing; a reload reads again", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await expect(field(page)).toHaveAttribute("list", "repo-list");
    await typeIn(page, "acme/");
    await expect
      .poll(() => optionValues(page))
      .toEqual(["acme/gadgets", "acme/plain", "acme/widgets"]);
    expect(ownerRequests(stub)).toEqual([ownerUrl("acme"), orgPage("acme")]);
    await field(page).pressSequentially("widg");
    await settle(page);
    expect(ownerRequests(stub)).toHaveLength(2);
    await field(page).fill("");
    await field(page).pressSequentially("acme/");
    await settle(page);
    expect(ownerRequests(stub)).toHaveLength(2);
    await expect.poll(() => optionValues(page)).toHaveLength(3);
    await page.reload();
    await typeIn(page, "acme/");
    await expect.poll(() => ownerRequests(stub)).toHaveLength(4);
  });

  test("acme/, then leaving the field and Open while the read runs: the owner's requests once", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (u) => u === ownerUrl("acme") });
    await page.goto("/");
    await typeIn(page, "acme/");
    await clickAway(page);
    await openButton(page).click();
    await expect(guideMessage(page)).toHaveText("Reading acme's repos…");
    stub.release(ownerUrl("acme"));
    await expect(select(page)).toBeVisible();
    await settle(page);
    expect(times(stub, ownerUrl("acme"))).toBe(1);
    expect(times(stub, orgPage("acme"))).toBe(1);
  });

  test("acme/, then acme/wi before the list answers: the answer still fills the datalist", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (u) => u === orgPage("acme") });
    await page.goto("/");
    await typeIn(page, "acme/");
    await expect.poll(() => times(stub, orgPage("acme"))).toBe(1);
    await field(page).pressSequentially("wi");
    stub.release(orgPage("acme"));
    await expect.poll(() => optionValues(page)).toHaveLength(3);
  });

  test("typing makes no select appear until the field loses focus", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await typeIn(page, "acme/widgets");
    await settle(page);
    await expect(select(page)).toBeHidden();
    await clickAway(page);
    await expect(select(page)).toBeVisible();
  });

  test("typing github.com/acme/widgets makes no opening-guide request, nor leaving the field at github.com", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await typeIn(page, "github.com");
    await clickAway(page);
    await settle(page);
    expect(urls(stub)).toEqual([]);
    await typeIn(page, "/acme/widgets");
    await clickAway(page);
    await settle(page);
    expect(urls(stub)).toEqual([]);
  });

  test("the datalist's owner changes: it is emptied, and a text that is not guided empties it too", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await typeIn(page, "acme/");
    await expect.poll(() => optionValues(page)).toHaveLength(3);
    await field(page).fill("beta");
    await expect.poll(() => optionValues(page)).toEqual([]);
    await field(page).fill("acme/");
    await expect.poll(() => optionValues(page)).toHaveLength(3);
    await field(page).fill("acme/widgets/tree/main");
    await expect.poll(() => optionValues(page)).toEqual([]);
  });

  test("newest wins: acme/ then beta/ with acme's answer last shows beta's repos; acme's kept list is used with no request", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (u) => u === orgPage("acme") });
    await page.goto("/");
    await typeIn(page, "acme/");
    await expect.poll(() => times(stub, orgPage("acme"))).toBe(1);
    await field(page).fill("");
    await field(page).pressSequentially("beta/");
    await expect.poll(() => optionValues(page)).toEqual(["beta/tools"]);
    stub.release(orgPage("acme"));
    await settle(page);
    expect(await optionValues(page)).toEqual(["beta/tools"]);
    const before = urls(stub).length;
    await field(page).fill("");
    await field(page).pressSequentially("acme/");
    await expect.poll(() => optionValues(page)).toHaveLength(3);
    expect(urls(stub).length).toBe(before);
  });
});

test.describe("leaving the field, and the select (3.1)", () => {
  test("acme by a click elsewhere: Repo of acme; arrow keys choose with no request; leaving the select reads its branches, master preselected", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      defaults: { "acme/gadgets": "master" },
      branches: { "acme/gadgets": ["dev", "master"] },
    });
    await page.goto("/");
    await typeIn(page, "acme");
    await clickAway(page);
    await expect(select(page)).toBeVisible();
    await expect(label(page)).toHaveText("Repo of acme");
    expect(await selectTexts(page)).toEqual(["Choose a repo", "gadgets", "plain", "widgets"]);
    await expect(guideMessage(page)).toHaveText("Choose one of acme's repos, or type acme/<repo>.");
    const before = urls(stub).length;
    await select(page).focus();
    await page.keyboard.press("ArrowDown");
    await expect(field(page)).toHaveValue("acme/gadgets");
    await settle(page);
    expect(urls(stub).length).toBe(before);
    await page.keyboard.press("Tab");
    await expect(label(page)).toHaveText("Branch of acme/gadgets");
    expect(urls(stub).slice(before)).toEqual([
      repoUrl("acme", "gadgets"),
      branchPage("acme", "gadgets"),
    ]);
    expect(await selectTexts(page)).toEqual(["master (default)", "dev"]);
    await expect(select(page)).toHaveValue("master");
    await expect(openButton(page)).toBeFocused();
  });

  test("Open then loads with its own request 1 and the picker's own branch request; another branch is loaded by name", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await typeIn(page, "acme/widgets");
    await page.keyboard.press("Tab");
    await expect(label(page)).toHaveText("Branch of acme/widgets");
    const before = urls(stub).length;
    await openButton(page).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await branchListRead(page);
    const load = urls(stub).slice(before);
    expect(load[0]).toBe(repoUrl("acme", "widgets"));
    expect(load.filter((u) => u === branchPage("acme", "widgets"))).toHaveLength(1);
    await expect(select(page)).toBeHidden();
    await expect(guideMessage(page)).toHaveText("");

    await field(page).click();
    await page.keyboard.press("Tab");
    await expect(label(page)).toHaveText("Branch of acme/widgets");
    await select(page).selectOption("dev");
    const again = urls(stub).length;
    await openButton(page).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (dev)");
    await branchListRead(page);
    const named = urls(stub).slice(again);
    expect(named).not.toContain(repoUrl("acme", "widgets"));
    expect(named[0]).toBe(`${repoUrl("acme", "widgets")}/git/trees/dev?recursive=1`);
  });

  test("leaving the field twice with acme/widgets reads the repo and its branches twice; a held first read is replaced", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await typeIn(page, "acme/widgets");
    await clickAway(page);
    await expect(label(page)).toHaveText("Branch of acme/widgets");
    await field(page).click();
    await clickAway(page);
    await expect.poll(() => times(stub, branchPage("acme", "widgets"))).toBe(2);
    expect(times(stub, repoUrl("acme", "widgets"))).toBe(2);
  });

  test("a late owner-list answer with a repo in the field fills the datalist only: the branch read's 404 message and its select stay", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (u) => u === orgPage("acme") });
    await page.goto("/");
    await typeIn(page, "acme/");
    await expect.poll(() => times(stub, orgPage("acme"))).toBe(1);
    await field(page).pressSequentially("missing");
    await clickAway(page);
    const notFound = "Not found or not public. If the repo is private, add a token for its owner.";
    await expect(guideMessage(page)).toHaveText(notFound);
    stub.release(orgPage("acme"));
    await expect.poll(() => optionValues(page)).toHaveLength(3);
    await settle(page);
    await expect(guideMessage(page)).toHaveText(notFound);
    await expect(select(page)).toBeHidden();
  });

  test("a late owner-list answer leaves a shown branch select and its line alone", async ({
    page,
    context,
  }) => {
    const many = Array.from({ length: 300 }, (_, i) => `r${String(i).padStart(3, "0")}`);
    const stub = await stubGithub(context, {
      owners: { acme: { type: "Organization", repos: ["widgets", ...many] } },
      hold: (u) => u === orgPage("acme"),
    });
    await page.goto("/");
    await typeIn(page, "acme/");
    await expect.poll(() => times(stub, orgPage("acme"))).toBe(1);
    await field(page).pressSequentially("widgets");
    await clickAway(page);
    await expect(label(page)).toHaveText("Branch of acme/widgets");
    await expect(guideMessage(page)).toHaveText("");
    stub.release(orgPage("acme"));
    // The list is past the cap, so its own outcome would be the past-cap line.
    await expect.poll(() => times(stub, orgPage("acme", 3))).toBe(1);
    await settle(page);
    await expect(label(page)).toHaveText("Branch of acme/widgets");
    await expect(guideMessage(page)).toHaveText("");
  });

  test("a second blur replaces a first whose request 1 is held: the first makes no branch request, the second's branches show", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      hold: (u, n) => u === repoUrl("acme", "widgets") && n === 0,
      branches: { "acme/widgets": ["main", "second"] },
    });
    await page.goto("/");
    await typeIn(page, "acme/widgets");
    await clickAway(page);
    await expect.poll(() => times(stub, repoUrl("acme", "widgets"))).toBe(1);
    await field(page).click();
    await clickAway(page);
    await expect(label(page)).toHaveText("Branch of acme/widgets");
    stub.release(repoUrl("acme", "widgets"));
    await settle(page);
    expect(times(stub, branchPage("acme", "widgets"))).toBe(1);
    expect(await selectTexts(page)).toEqual(["main (default)", "second"]);
  });

  test("Tab out with acme: the focus stays on Open, the select shows once read, Shift+Tab reaches it; Tab out with acme/widgets the same", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await typeIn(page, "acme");
    await page.keyboard.press("Tab");
    await expect(openButton(page)).toBeFocused();
    await expect(label(page)).toHaveText("Repo of acme");
    await expect(guideMessage(page)).toHaveText("Choose one of acme's repos, or type acme/<repo>.");
    await expect(openButton(page)).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(select(page)).toBeFocused();

    await field(page).fill("acme/widgets");
    await page.keyboard.press("Tab");
    await expect(openButton(page)).toBeFocused();
    await expect(label(page)).toHaveText("Branch of acme/widgets");
    await expect(select(page)).toHaveValue("main");
    await expect(openButton(page)).toBeFocused();
  });

  test("choosing a repo in the owner's select and Tab on to Open: the select's blur reads its branches", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await typeIn(page, "acme");
    await clickAway(page);
    await select(page).selectOption("plain");
    await expect(field(page)).toHaveValue("acme/plain");
    await expect(select(page)).toBeVisible();
    await select(page).focus();
    await page.keyboard.press("Tab");
    await expect(label(page)).toHaveText("Branch of acme/plain");
    expect(urls(stub)).toContain(branchPage("acme", "plain"));
  });

  test("with acme/widgets's branches shown, Shift+Tab to the field and Tab back: no request, the chosen branch stays", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await typeIn(page, "acme/widgets");
    await page.keyboard.press("Tab");
    await expect(label(page)).toHaveText("Branch of acme/widgets");
    await page.keyboard.press("Shift+Tab");
    await expect(select(page)).toBeFocused();
    await select(page).selectOption("dev");
    await page.keyboard.press("Shift+Tab");
    await expect(field(page)).toBeFocused();
    const before = urls(stub).length;
    await page.keyboard.press("Tab");
    await expect(select(page)).toBeFocused();
    await settle(page);
    expect(urls(stub).length).toBe(before);
    await expect(select(page)).toHaveValue("dev");
  });

  test("typing a change of the repo hides the branch select and its message; choosing a repo in the owner's select leaves it shown", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await typeIn(page, "acme");
    await clickAway(page);
    await select(page).selectOption("widgets");
    await expect(select(page)).toBeVisible();
    await expect(label(page)).toHaveText("Repo of acme");
    await field(page).click();
    await clickAway(page);
    await expect(label(page)).toHaveText("Branch of acme/widgets");
    await field(page).click();
    await page.keyboard.press("Backspace");
    await expect(select(page)).toBeHidden();
    await expect(guideMessage(page)).toHaveText("");
  });

  test("Open in vizi and a pick of the branch picker each hide the select and the message", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await field(page).fill("https://github.com/acme/hub");
    await openButton(page).click();
    await expect(page.locator("#tab-umbrella")).toBeVisible();
    await field(page).fill("acme/gadgets");
    await clickAway(page);
    await expect(label(page)).toHaveText("Branch of acme/gadgets");
    await page.getByRole("link", { name: "Open in vizi" }).first().click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await expect(select(page)).toBeHidden();
    await expect(guideMessage(page)).toHaveText("");

    await branchListRead(page);
    await field(page).fill("acme/gadgets");
    await clickAway(page);
    await expect(label(page)).toHaveText("Branch of acme/gadgets");
    await page.locator("#branch-select").selectOption("dev");
    await page.locator("#branch-open").click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (dev)");
    await expect(select(page)).toBeHidden();
    await expect(guideMessage(page)).toHaveText("");
  });

  test("leaving the field with ., .., ./ or ../ makes no request", async ({ page, context }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    for (const text of [".", "..", "./", "../"]) {
      await field(page).fill(text);
      await clickAway(page);
    }
    await settle(page);
    expect(urls(stub)).toEqual([]);
  });
});

test.describe("Open and Enter (3.1)", () => {
  test("Open while the guide's request 1 runs: no branch request follows it, the load goes on, no select", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      hold: (u, n) => u === repoUrl("acme", "widgets") && n === 0,
    });
    await page.goto("/");
    await typeIn(page, "acme/widgets");
    await clickAway(page);
    await expect.poll(() => times(stub, repoUrl("acme", "widgets"))).toBe(1);
    await openButton(page).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await branchListRead(page);
    stub.release(repoUrl("acme", "widgets"));
    await settle(page);
    // The picker's own list only.
    expect(times(stub, branchPage("acme", "widgets"))).toBe(1);
    await expect(select(page)).toBeHidden();
  });

  test("the same with Enter in the field", async ({ page, context }) => {
    const stub = await stubGithub(context, {
      hold: (u, n) => u === repoUrl("acme", "widgets") && n === 0,
    });
    await page.goto("/");
    await typeIn(page, "acme/widgets");
    await clickAway(page);
    await expect.poll(() => times(stub, repoUrl("acme", "widgets"))).toBe(1);
    await field(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await branchListRead(page);
    stub.release(repoUrl("acme", "widgets"));
    await settle(page);
    expect(times(stub, branchPage("acme", "widgets"))).toBe(1);
    await expect(select(page)).toBeHidden();
  });

  test("Open while page 1 of the guide's branches (100 items) is held: when it answers, the guide asks for no page 2", async ({
    page,
    context,
  }) => {
    const hundred = Array.from({ length: 100 }, (_, i) => `b${String(i).padStart(3, "0")}`);
    const stub = await stubGithub(context, {
      branches: { "acme/widgets": hundred },
      defaults: { "acme/widgets": "b000" },
      hold: (u, n) => u === branchPage("acme", "widgets") && n === 0,
    });
    await page.goto("/");
    await typeIn(page, "acme/widgets");
    await clickAway(page);
    await expect.poll(() => times(stub, branchPage("acme", "widgets"))).toBe(1);
    await openButton(page).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (b000)");
    stub.release(branchPage("acme", "widgets"));
    await branchListRead(page);
    await settle(page);
    // The picker reads page 1 and page 2 itself; the guide asks for no page 2.
    expect(times(stub, branchPage("acme", "widgets", 2))).toBe(1);
    await expect(select(page)).toBeHidden();
  });

  test("a click on Open with acme/widgets: the blur's read is stopped after its request 1, and the load makes its own", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      hold: (u, n) => u === repoUrl("acme", "widgets") && n === 0,
    });
    await page.goto("/");
    await typeIn(page, "acme/widgets");
    await openButton(page).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await branchListRead(page);
    expect(times(stub, repoUrl("acme", "widgets"))).toBe(2);
    stub.release(repoUrl("acme", "widgets"));
    await settle(page);
    expect(times(stub, branchPage("acme", "widgets"))).toBe(1);
  });

  test("a pasted full address, and github.com/acme/widgets, make no opening-guide request and load as before", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await field(page).fill("https://github.com/acme/widgets/tree/dev");
    await openButton(page).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (dev)");
    await branchListRead(page);
    expect(urls(stub)[0]).toBe(`${repoUrl("acme", "widgets")}/git/trees/dev?recursive=1`);
    expect(ownerRequests(stub)).toEqual([]);
    const before = urls(stub).length;
    await field(page).fill("github.com/acme/widgets");
    await openButton(page).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await branchListRead(page);
    // One request 1, the load's own.
    expect(
      urls(stub)
        .slice(before)
        .filter((u) => u === repoUrl("acme", "widgets")),
    ).toHaveLength(1);
    await expect(select(page)).toBeHidden();
  });

  test("Open with acme alone loads nothing, shows the select and clears no results; a running load goes on", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      hold: (u) => u.includes("/repos/beta/tools/git/trees/"),
    });
    await page.goto("/");
    await field(page).fill("https://github.com/acme/widgets");
    await openButton(page).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await branchListRead(page);
    await field(page).fill("acme");
    await openButton(page).click();
    await expect(label(page)).toHaveText("Repo of acme");
    await expect(guideMessage(page)).toHaveText("Choose one of acme's repos, or type acme/<repo>.");
    await expect(page.locator("#results")).toBeVisible();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");

    await field(page).fill("https://github.com/beta/tools");
    await openButton(page).click();
    await expect(page.locator("#message")).toHaveText("Loading…");
    await field(page).fill("acme");
    await openButton(page).click();
    await expect(label(page)).toHaveText("Repo of acme");
    await expect(page.locator("#message")).toHaveText("Loading…");
    stub.release();
    await expect(page.locator("#project-name")).toHaveText("beta/tools (main)");
  });

  test("Open with acme alone while its list reads: only Reading acme's repos…", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (u) => u === orgPage("acme") });
    await page.goto("/");
    await field(page).fill("acme");
    await openButton(page).click();
    await expect(guideMessage(page)).toHaveText("Reading acme's repos…");
    await expect(select(page)).toBeHidden();
    stub.release();
    await expect(select(page)).toBeVisible();
  });

  test("Open with acme answered 404, and with an empty list: no select, #message unchanged, the outcome in the guide's line", async ({
    page,
    context,
  }) => {
    await stubGithub(context, {
      owners: { empty: { type: "Organization", repos: [] } },
    });
    await page.goto("/");
    await field(page).fill("acme");
    await openButton(page).click();
    await expect(guideMessage(page)).toHaveText("GitHub has no account named acme.");
    await expect(select(page)).toBeHidden();
    await expect(page.locator("#message")).toHaveText("");
    await field(page).fill("empty");
    await openButton(page).click();
    await expect(guideMessage(page)).toHaveText("empty has no repos vizi can see.");
    await expect(select(page)).toBeHidden();
    await expect(page.locator("#message")).toHaveText("");
  });

  test("a repo whose branch list is empty: no select; Open loads its default branch", async ({
    page,
    context,
  }) => {
    await stubGithub(context, { branches: { "acme/widgets": [] } });
    await page.goto("/");
    await typeIn(page, "acme/widgets");
    await clickAway(page);
    await settle(page);
    await expect(select(page)).toBeHidden();
    await openButton(page).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
  });
});

test.describe("tokens and the guide's requests (3.1, 3.8)", () => {
  test("with a token for acme an organisation's requests carry it; a user's list comes from /user/repos with only its repos; without a token /users/<owner>/repos", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      owners: {
        acme: { type: "Organization", repos: ["widgets"] },
        beta: { type: "User", repos: ["tools"] },
        gamma: { type: "User", repos: ["g1"] },
      },
      mine: [
        { name: "tools", login: "beta" },
        { name: "other", login: "someone" },
      ],
    });
    await page.goto("/");
    await addToken(page, "acme");
    await addToken(page, "beta");
    await typeIn(page, "acme/");
    await expect.poll(() => optionValues(page)).toEqual(["acme/widgets"]);
    for (const s of stub.seen.filter((x) => ownerRequests(stub).includes(x.url)))
      expect(s.authorization).toBe(`Bearer ${TOKEN}`);
    expect(urls(stub)).toContain(orgPage("acme"));

    await field(page).fill("");
    await field(page).pressSequentially("beta/");
    await expect.poll(() => optionValues(page)).toEqual(["beta/tools"]);
    expect(urls(stub)).toContain(minePage());
    expect(urls(stub)).not.toContain(userPage("beta"));

    await field(page).fill("");
    await field(page).pressSequentially("gamma/");
    await expect.poll(() => optionValues(page)).toEqual(["gamma/g1"]);
    const gamma = stub.seen.filter((x) => x.url.includes("gamma"));
    expect(gamma.map((x) => x.url)).toEqual([ownerUrl("gamma"), userPage("gamma")]);
    for (const s of gamma) expect(s.authorization).toBeUndefined();
  });

  test("a token for acme from another account: /user/repos lists nothing, no further request, the with-its-token line; acme/<repo> still opens", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      owners: { acme: { type: "User", repos: ["widgets"] } },
      mine: Array.from({ length: 100 }, (_, i) => ({ name: `x${i}`, login: "someone" })),
    });
    await page.goto("/");
    await addToken(page, "acme");
    await typeIn(page, "acme");
    await clickAway(page);
    await expect(guideMessage(page)).toHaveText(
      "acme has no repos vizi can see with its token. If the token belongs to another account, add one made by acme, or type acme/<repo>.",
    );
    await expect(select(page)).toBeHidden();
    expect(urls(stub)).toEqual([ownerUrl("acme"), minePage()]);
    await field(page).click();
    await clickAway(page);
    await settle(page);
    // The empty list is kept: no request.
    expect(urls(stub)).toHaveLength(2);
    await field(page).fill("acme/widgets");
    await openButton(page).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
  });

  test("Add or Forget of acme's token drops acme's kept list: the next acme/ reads again", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await typeIn(page, "acme/");
    await expect.poll(() => times(stub, orgPage("acme"))).toBe(1);
    // Leave the field first: on a phone the select of a kept list appears above what follows (section 4, item 30).
    await clickAway(page);
    await expect(select(page)).toBeVisible();
    await addToken(page, "acme");
    await field(page).fill("");
    await field(page).pressSequentially("acme/");
    await expect.poll(() => times(stub, orgPage("acme"))).toBe(2);
    await clickAway(page);
    await expect(select(page)).toBeVisible();
    await page
      .locator('[data-testid=token-line][data-owner="acme"] [data-testid=token-forget]')
      .click();
    await field(page).fill("");
    await field(page).pressSequentially("acme/");
    await expect.poll(() => times(stub, orgPage("acme"))).toBe(3);
  });

  test("Forget while acme's list reads (page 1 of 100 held): no page 2, the late answer neither shown nor kept", async ({
    page,
    context,
  }) => {
    const many = Array.from({ length: 150 }, (_, i) => `r${String(i).padStart(3, "0")}`);
    const stub = await stubGithub(context, {
      owners: { acme: { type: "Organization", repos: many } },
      hold: (u, n) => u === orgPage("acme") && n === 0,
    });
    await page.goto("/");
    await addToken(page, "acme");
    await typeIn(page, "acme/");
    await expect.poll(() => times(stub, orgPage("acme"))).toBe(1);
    await page
      .locator('[data-testid=token-line][data-owner="acme"] [data-testid=token-forget]')
      .click();
    stub.release(orgPage("acme"));
    await settle(page);
    expect(urls(stub)).not.toContain(orgPage("acme", 2));
    expect(await optionValues(page)).toEqual([]);
    await field(page).fill("");
    await field(page).pressSequentially("acme/");
    await expect.poll(() => times(stub, orgPage("acme"))).toBe(2);
  });

  test("Forget while a repo's request 1 runs: no branch request after it, no select", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      hold: (u, n) => u === repoUrl("acme", "widgets") && n === 0,
    });
    await page.goto("/");
    await addToken(page, "acme");
    await typeIn(page, "acme/widgets");
    await clickAway(page);
    await expect.poll(() => times(stub, repoUrl("acme", "widgets"))).toBe(1);
    await page
      .locator('[data-testid=token-line][data-owner="acme"] [data-testid=token-forget]')
      .click();
    stub.release();
    await settle(page);
    expect(times(stub, branchPage("acme", "widgets"))).toBe(0);
    await expect(select(page)).toBeHidden();
  });

  test("Forget while a repo's branch list runs: its answer is dropped, no select", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      hold: (u, n) => u === branchPage("acme", "widgets") && n === 0,
    });
    await page.goto("/");
    await addToken(page, "acme");
    await typeIn(page, "acme/widgets");
    await clickAway(page);
    await expect.poll(() => times(stub, branchPage("acme", "widgets"))).toBe(1);
    await page
      .locator('[data-testid=token-line][data-owner="acme"] [data-testid=token-forget]')
      .click();
    stub.release();
    await settle(page);
    await expect(select(page)).toBeHidden();
  });

  test("Forget while the datalist holds acme's repos and the select shows an acme repo's branches: both go, the text stays; from another tab the focus moves to the field", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await addToken(page, "acme", true);
    await typeIn(page, "acme/");
    await expect.poll(() => optionValues(page)).toHaveLength(3);
    await field(page).pressSequentially("widgets");
    await clickAway(page);
    await expect(label(page)).toHaveText("Branch of acme/widgets");
    await select(page).focus();

    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);
    await other
      .locator('[data-testid=token-line][data-owner="acme"] [data-testid=token-forget]')
      .click();

    await expect(select(page)).toBeHidden();
    await expect.poll(() => optionValues(page)).toEqual([]);
    await expect(field(page)).toHaveValue("acme/widgets");
    await expect(field(page)).toBeFocused();
  });
});

test.describe("every kind of token change reaches the guide (3.1, 3.8)", () => {
  const forgetAll = (page: Page) => page.locator("#token-forget-all");

  /** acme's list typed and read, the field left: datalist, select and message hold acme's repos. */
  async function acmeShown(page: Page, stub: Stub) {
    await typeIn(page, "acme/");
    await expect.poll(() => optionValues(page)).toHaveLength(3);
    await clickAway(page);
    await expect(label(page)).toHaveText("Repo of acme");
    await expect(guideMessage(page)).toHaveText("Choose one of acme's repos, or type acme/<repo>.");
    expect(times(stub, orgPage("acme"))).toBe(1);
  }

  /** After the change: acme's datalist, select and message are gone, and the next acme/ reads again. */
  async function acmeDropped(page: Page, stub: Stub) {
    await expect(select(page)).toBeHidden();
    await expect.poll(() => optionValues(page)).toEqual([]);
    await expect(guideMessage(page)).toHaveText("");
    await field(page).fill("");
    await field(page).pressSequentially("acme/");
    await expect.poll(() => times(stub, orgPage("acme"))).toBe(2);
  }

  test("another tab saves a token for acme", async ({ page, context }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await acmeShown(page, stub);
    const other = await context.newPage();
    await other.goto("/");
    await addToken(other, "acme", true);
    await acmeDropped(page, stub);
  });

  test("Keep of a token an earlier vizi saved, for acme", async ({ page, context }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await page.evaluate(() =>
      localStorage.setItem("vizi.githubToken", "github_pat_TEST_guide_old1234"),
    );
    await page.reload();
    await acmeShown(page, stub);
    await openPanel(page);
    await page.locator("#migrate-owner").fill("acme");
    await page.locator("#migrate-keep").click();
    await expect(page.locator('[data-testid=token-line][data-owner="acme"]')).toBeVisible();
    await acmeDropped(page, stub);
  });

  test("Forget all tokens", async ({ page, context }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await addToken(page, "acme");
    await acmeShown(page, stub);
    await forgetAll(page).click();
    await expect(page.locator("[data-testid=token-line]")).toHaveCount(0);
    await acmeDropped(page, stub);
  });

  test("with a token for acme, a click on Open with acme/widgets: the guide's request 1 carries it and is stopped, the load uses it", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      hold: (u, n) => u === repoUrl("acme", "widgets") && n === 0,
    });
    await page.goto("/");
    await addToken(page, "acme");
    await typeIn(page, "acme/widgets");
    await openButton(page).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await branchListRead(page);
    stub.release(repoUrl("acme", "widgets"));
    await settle(page);
    const ones = stub.seen.filter((x) => x.url === repoUrl("acme", "widgets"));
    // The guide's (from the click's blur) and the load's own.
    expect(ones).toHaveLength(2);
    for (const s of stub.seen) expect(s.authorization).toBe(`Bearer ${TOKEN}`);
    // The picker's list only: the guide made no branch request.
    expect(times(stub, branchPage("acme", "widgets"))).toBe(1);
    await expect(select(page)).toBeHidden();
  });
});

test.describe("messages for each outcome (3.1, Edge cases)", () => {
  test("404 on the user, and /users/acme with type Bot", async ({ page, context }) => {
    await stubGithub(context, { owners: { bot: { type: "Bot", repos: [] } } });
    await page.goto("/");
    await field(page).fill("nobody");
    await clickAway(page);
    await expect(guideMessage(page)).toHaveText("GitHub has no account named nobody.");
    await field(page).fill("bot");
    await clickAway(page);
    await expect(guideMessage(page)).toHaveText(
      "The repo list could not be read: GitHub's answer for bot was not understood.",
    );
    await expect(select(page)).toBeHidden();
  });

  test("404 on the repo, and a repo answered without default_branch", async ({ page, context }) => {
    await stubGithub(context, { defaults: { "acme/plain": null } });
    await page.goto("/");
    await field(page).fill("acme/missing");
    await clickAway(page);
    await expect(guideMessage(page)).toHaveText(
      "Not found or not public. If the repo is private, add a token for its owner.",
    );
    await field(page).fill("acme/plain");
    await clickAway(page);
    await expect(guideMessage(page)).toHaveText(
      "The branch list could not be read: GitHub's answer for the repo had no default branch.",
    );
    await expect(select(page)).toBeHidden();
  });

  test("a 403 at the rate limit on /users/acme and on the guide's /repos/acme/widgets", async ({
    page,
    context,
  }) => {
    const limit = { status: 403, headers: { "X-RateLimit-Remaining": "0" } };
    await stubGithub(context, {
      status: (u) =>
        u === ownerUrl("acme") || u === repoUrl("acme", "widgets") ? limit : undefined,
    });
    await page.goto("/");
    await field(page).fill("acme");
    await clickAway(page);
    await expect(guideMessage(page)).toHaveText(
      `The repo list could not be read: GitHub answered HTTP 403 for ${ownerUrl("acme")}.`,
    );
    await field(page).fill("acme/widgets");
    await clickAway(page);
    await expect(guideMessage(page)).toHaveText(
      `The branch list could not be read: GitHub answered HTTP 403 for ${repoUrl("acme", "widgets")}.`,
    );
  });

  test("a 401 with a token: the token is forgotten, 3.8's message is in #message, the results loaded with it are hidden, and the next acme/ reads again", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      status: (u, n) => (u === ownerUrl("acme") && n === 0 ? { status: 401 } : undefined),
    });
    await page.goto("/");
    await addToken(page, "acme");
    await field(page).fill("https://github.com/acme/widgets");
    await openButton(page).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await branchListRead(page);
    await field(page).fill("acme");
    await clickAway(page);
    await expect(page.locator("#message")).toHaveText(
      "GitHub refused the token for acme: it may have expired. It has been forgotten; enter a new one.",
    );
    await expect(page.locator('[data-testid=token-line][data-owner="acme"]')).toHaveCount(0);
    await expect(page.locator("#results")).toBeHidden();
    await expect(select(page)).toBeHidden();
    await field(page).fill("");
    await field(page).pressSequentially("acme/");
    await expect.poll(() => times(stub, ownerUrl("acme"))).toBe(2);
    await expect.poll(() => optionValues(page)).toHaveLength(3);
  });

  test("an owner list that fails on page 2 shows its names, incomplete, and is read again; a page 1 failure is read again on the next blur, once", async ({
    page,
    context,
  }) => {
    const many = Array.from({ length: 150 }, (_, i) => `r${String(i).padStart(3, "0")}`);
    const stub = await stubGithub(context, {
      owners: { acme: { type: "Organization", repos: many }, beta: { type: "User", repos: ["t"] } },
      status: (u, n) =>
        u === orgPage("acme", 2) || (u === userPage("beta") && n === 0)
          ? { status: 500 }
          : undefined,
    });
    await page.goto("/");
    await field(page).fill("acme");
    await clickAway(page);
    await expect(guideMessage(page)).toHaveText(
      `The repo list is incomplete: GitHub answered HTTP 500 for ${orgPage("acme", 2)}. Choose one of acme's repos, or type acme/<repo>.`,
    );
    expect(await selectTexts(page)).toHaveLength(101);
    await field(page).click();
    await clickAway(page);
    await expect.poll(() => times(stub, orgPage("acme", 2))).toBe(2);

    await field(page).fill("beta");
    await clickAway(page);
    await expect(guideMessage(page)).toHaveText(
      `The repo list could not be read: GitHub answered HTTP 500 for ${userPage("beta")}.`,
    );
    await field(page).click();
    await clickAway(page);
    await expect(label(page)).toHaveText("Repo of beta");
    expect(times(stub, userPage("beta"))).toBe(2);
  });

  test("an owner list past the cap: the past-cap message, and it is read again", async ({
    page,
    context,
  }) => {
    const many = Array.from({ length: 300 }, (_, i) => `r${String(i).padStart(3, "0")}`);
    const stub = await stubGithub(context, {
      owners: { acme: { type: "Organization", repos: many } },
    });
    await page.goto("/");
    await field(page).fill("acme");
    await clickAway(page);
    await expect(guideMessage(page)).toHaveText(
      "vizi lists the first 300 repos GitHub gives for acme. Type the repo's name to open another. Choose one of acme's repos, or type acme/<repo>.",
    );
    await field(page).fill("");
    await field(page).pressSequentially("acme/");
    await expect.poll(() => times(stub, orgPage("acme", 1))).toBe(2);
  });
});

test.describe("the field and the Owner prefill (3.1, 3.8)", () => {
  test("the field keeps autocomplete=off and has list=repo-list", async ({ page }) => {
    await page.goto("/");
    await expect(field(page)).toHaveAttribute("autocomplete", "off");
    await expect(field(page)).toHaveAttribute("list", "repo-list");
  });

  test("a repo chosen in the guide's select, and a datalist value filled in, set the Owner field", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await field(page).fill("acme");
    await expect(page.locator("#owner-input")).toHaveValue("");
    await clickAway(page);
    await select(page).selectOption("widgets");
    await expect(page.locator("#owner-input")).toHaveValue("acme");

    await page.reload();
    await openPanel(page);
    await typeIn(page, "beta/");
    await expect.poll(() => optionValues(page)).toEqual(["beta/tools"]);
    await field(page).fill("beta/tools");
    await expect(page.locator("#owner-input")).toHaveValue("beta");
  });
});

test.describe("leaving the field by a click below it: nothing moves (3.1, Clead, 2026-11-05, #85; the line reserved while the guide is in use)", () => {
  /**
   * Records where `selector` is before, and again inside the field's own
   * `blur` event, after the opening guide's handler (registered first) has
   * written "Reading…". The owner's answer is held, so what is compared is
   * the blur's effect alone.
   */
  async function watchPosition(page: Page, selector: string) {
    await page.evaluate((sel) => {
      const w = window as unknown as { __rects: { top: number; left: number }[] };
      const at = () => {
        const r = document.querySelector(sel)?.getBoundingClientRect();
        return { top: r?.top ?? Number.NaN, left: r?.left ?? Number.NaN };
      };
      w.__rects = [at()];
      document.getElementById("url-input")?.addEventListener("blur", () => w.__rects.push(at()), {
        once: true,
      });
    }, selector);
    return () =>
      page.evaluate(
        () => (window as unknown as { __rects: { top: number; left: number }[] }).__rects,
      );
  }

  test("an owner typed, then one click on a token's Forget: the click registers, and Forget had not moved", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (u) => u === ownerUrl("acme") });
    await page.goto("/");
    await addToken(page, "acme");
    await typeIn(page, "acme");
    const forget = '[data-testid=token-line][data-owner="acme"] [data-testid=token-forget]';
    const rects = await watchPosition(page, forget);
    await page.locator(forget).click();
    await expect(page.locator('[data-testid=token-line][data-owner="acme"]')).toHaveCount(0);
    const [before, atBlur] = await rects();
    expect(atBlur).toEqual(before);
    stub.release();
  });

  test("an owner typed, then one click on the Private repos toggle: the click registers, and the toggle had not moved", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (u) => u === ownerUrl("acme") });
    await page.goto("/");
    await typeIn(page, "acme");
    const rects = await watchPosition(page, "#private-repos-toggle");
    await page.locator("#private-repos-toggle").click();
    await expect(page.locator("#private-repos-toggle")).toHaveAttribute("aria-expanded", "true");
    await expect(guideMessage(page)).toHaveText("Reading acme's repos…");
    const [before, atBlur] = await rects();
    expect(atBlur).toEqual(before);
    stub.release();
  });

  test("after Open in vizi writes acme/widgets, focusing and leaving the field by a click on the toggle moves nothing", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await field(page).fill("https://github.com/acme/hub");
    await openButton(page).click();
    await expect(page.locator("#tab-umbrella")).toBeVisible();
    await page.getByRole("link", { name: "Open in vizi" }).first().click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await expect(field(page)).toHaveValue("acme/widgets");
    await field(page).focus();
    const rects = await watchPosition(page, "#private-repos-toggle");
    await page.locator("#private-repos-toggle").click();
    await expect(page.locator("#private-repos-toggle")).toHaveAttribute("aria-expanded", "true");
    const [before, atBlur] = await rects();
    expect(atBlur).toEqual(before);
  });

  /** The space between the address row and the access line, in px. */
  const rowToAccess = (page: Page) =>
    page.evaluate(
      () =>
        (document.getElementById("access-line")?.getBoundingClientRect().top ?? 0) -
        (document.querySelector(".url-row")?.getBoundingClientRect().bottom ?? 0),
    );
  /** 3.12's spacing as main builds it: 10 px on desktop, 8 px on a phone. */
  const idleGap = (page: Page) => ((page.viewportSize()?.width ?? 0) < 800 ? 8 : 10);

  test("the guide idle: the row-to-access-line gap is 3.12's, with an empty field and with a full address", async ({
    page,
  }) => {
    await page.goto("/");
    expect(await rowToAccess(page)).toBe(idleGap(page));
    await field(page).fill("https://github.com/acme/widgets");
    expect(await rowToAccess(page)).toBe(idleGap(page));
  });

  test("the message line takes one line's height on typing acme, and gives it back on clearing the field", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await typeIn(page, "acme");
    await expect(guideMessage(page)).toHaveText("");
    expect((await guideMessage(page).boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(20);
    expect(await rowToAccess(page)).toBeGreaterThan(idleGap(page) + 20);
    await field(page).fill("");
    expect(await rowToAccess(page)).toBe(idleGap(page));
  });
});

test.describe("accessibility and layout (3.1)", () => {
  test("the select's label changes, the focus stays on it while its branches arrive, the tab order is field, select, Open, and the line is a status", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      hold: (u) => u === repoUrl("acme", "widgets"),
    });
    await page.goto("/");
    await expect(guideMessage(page)).toHaveAttribute("role", "status");
    await typeIn(page, "acme");
    await clickAway(page);
    await expect(label(page)).toHaveText("Repo of acme");
    await field(page).focus();
    await page.keyboard.press("Tab");
    await expect(select(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(openButton(page)).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await select(page).selectOption("widgets");
    await page.keyboard.press("Shift+Tab");
    await expect(field(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(select(page)).toBeFocused();
    stub.release();
    await expect(label(page)).toHaveText("Branch of acme/widgets");
    await expect(select(page)).toBeFocused();
  });

  test("on a phone: no sideways scroll with a 100-character repo name; the select and Open full width, at least 44 px high", async ({
    page,
    context,
  }) => {
    const long = "r".repeat(100);
    await stubGithub(context, { owners: { acme: { type: "Organization", repos: [long] } } });
    await page.goto("/");
    await field(page).fill("acme");
    await clickAway(page);
    await expect(select(page)).toBeVisible();
    await select(page).selectOption(long);
    const width = page.viewportSize()?.width ?? 0;
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    if (width < 800) {
      const row = await page.locator(".url-row").boundingBox();
      for (const el of [select(page), openButton(page)]) {
        const box = await el.boundingBox();
        expect(box?.width).toBeCloseTo(row?.width ?? 0, 0);
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
    } else {
      const box = await select(page).boundingBox();
      expect(box?.width ?? 0).toBeLessThanOrEqual(260);
      expect(box?.height).toBe(48);
    }
  });
});
