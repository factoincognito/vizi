/**
 * Browser tests for the saved tokens, one per owner (docs/SPEC.md 3.8). GitHub's answers
 * are stubbed with routes: no test reaches the network. Every token here
 * is an obviously fake value, and all fixtures are synthetic.
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

const TOKEN = "github_pat_TEST_e2e_abcd1234";
const TOKEN2 = "github_pat_TEST_e2e_wxyz9876";
const TOKEN3 = "github_pat_TEST_e2e_qrst5555";
const KEY = "vizi.githubTokens";
const OLD_KEY = "vizi.githubToken";
/** The Repository field's short form; other tests here type the full address (3.1, "The Repository field"). */
const REPO = "acme/widgets";
const API = "https://api.github.com/repos/acme/widgets";
const project = join(__dirname, "fixtures", "project");
const read = (p: string) => readFileSync(join(project, p), "utf8");

type Seen = { method: string; url: string; headers: Record<string, string> };
type Answer = { status: number; headers?: Record<string, string>; body?: string };
interface Stub {
  /** The GET requests the stub answered, with their headers as sent. */
  seen: Seen[];
  /** Lets a request that `hold` kept waiting go on. */
  release: () => void;
}
interface StubOptions {
  /** Overrides the answer for a URL. */
  answer?: (url: string) => Answer | undefined;
  /** Keeps the answer to this URL waiting until `release()`. */
  hold?: string;
  /** Milliseconds every request waits before the stub sees and answers it, as on a slow network. */
  lag?: number;
}

/** Answers the GitHub endpoints for any owner's repo (the files of acme/widgets) on a whole context, recording every GET. */
async function stubGithub(context: BrowserContext, options: StubOptions = {}): Promise<Stub> {
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
  await context.route(
    /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//,
    async (route: Route) => {
      const request = route.request();
      const url = request.url();
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      if (options.lag) await new Promise((resolve) => setTimeout(resolve, options.lag));
      seen.push({ method: request.method(), url, headers: await request.allHeaders() });
      if (options.hold === url) await gate;
      const custom = options.answer?.(url);
      if (custom) {
        return route.fulfill({
          status: custom.status,
          headers: { ...cors, ...custom.headers },
          body: custom.body ?? "",
        });
      }
      const repoPart = /^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/?]+(?:\/(.*))?$/.exec(
        url,
      )?.[1];
      if (/^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/?]+$/.test(url)) {
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ default_branch: "main" }),
        });
      }
      if (repoPart === "git/trees/main?recursive=1") {
        const tree = ["README.md", "STATUS.md", "docs/BACKLOG.md"].map((path) => ({
          path,
          type: "blob",
        }));
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ truncated: false, tree }),
        });
      }
      if (url.includes("BACKLOG.md")) {
        return route.fulfill({ status: 200, headers: cors, body: read("docs/BACKLOG.md") });
      }
      if (url.includes("STATUS.md")) {
        return route.fulfill({ status: 200, headers: cors, body: read("STATUS.md") });
      }
      return route.fulfill({ status: 404, headers: cors, body: "" });
    },
  );
  return { seen, release };
}

const gets = (stub: Stub) => stub.seen.filter((s) => s.method === "GET");

async function openUrl(page: Page, url = REPO) {
  await page.locator("#url-input").fill(url);
  await page.locator("#open-url").click();
}

/** An owner's row: its owner, its masked token, and its box ticked exactly when the token is saved (3.12). */
async function expectLine(page: Page, owner: string, masked: string, isSaved: boolean) {
  await expect(line(page, owner).getByTestId("token-owner")).toHaveText(owner);
  await expect(line(page, owner).getByTestId("token-text")).toHaveText(masked);
  if (isSaved) await expect(rememberBox(page, owner)).toBeChecked();
  else await expect(rememberBox(page, owner)).not.toBeChecked();
}

/** The row of an owner in the "Private repos" panel. */
const line = (page: Page, owner = "acme") =>
  page.locator(`[data-testid="token-line"][data-owner="${owner}"]`);
const lineText = (page: Page, owner = "acme") => line(page, owner).getByTestId("token-text");
const forgetButton = (page: Page, owner = "acme") => line(page, owner).getByTestId("token-forget");
const rememberBox = (page: Page, owner = "acme") =>
  line(page, owner).getByTestId("token-remember-owner");
const forgetAll = (page: Page) =>
  page.getByRole("button", { name: "Forget all tokens", exact: true });
const anyLine = (page: Page) => page.getByTestId("token-line");

/** The saved value of vizi.githubTokens, parsed, or null. */
async function saved(
  page: Page,
): Promise<{ tokens: Record<string, string>; forgot: string[] } | null> {
  const raw = await page.evaluate((k) => localStorage.getItem(k), KEY);
  return raw === null ? null : JSON.parse(raw);
}

/** A value of vizi.githubTokens as another tab would write it. */
const value = (tokens: Record<string, string>, forgot: string[] = []) =>
  JSON.stringify({ tokens, forgot });

async function useToken(page: Page, token: string, remember = false, owner = "acme") {
  await page.locator("#owner-input").fill(owner);
  await page.locator("#token-input").fill(token);
  await page.locator("#token-remember").setChecked(remember);
  await page.locator("#token-use").click();
}

/** Collects every console message and uncaught error text of a page. */
function watchConsole(page: Page): string[] {
  const texts: string[] = [];
  page.on("console", (m) => texts.push(`${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => texts.push(`pageerror: ${e.message}`));
  return texts;
}

/** Everything a person or a script could read from the page, apart from storage. */
async function pageContents(page: Page): Promise<string> {
  return page.evaluate(() => {
    const parts = [location.href, document.title, document.body.outerHTML];
    parts.push(document.body.innerText);
    for (const input of Array.from(document.querySelectorAll("input"))) parts.push(input.value);
    return parts.join("\n");
  });
}

test.describe("entering the token (3.8)", () => {
  test("the field is a password field outside any form, with autocomplete and spellcheck off; the note names the shared origin", async ({
    page,
  }) => {
    await page.goto("/");
    await openPanel(page);
    const field = page.locator("#token-input");
    await expect(field).toHaveAttribute("type", "password");
    await expect(field).toHaveAttribute("autocomplete", "off");
    await expect(field).toHaveAttribute("spellcheck", "false");
    expect(await field.evaluate((el) => el.closest("form"))).toBeNull();
    expect(await page.locator("#token-use").evaluate((el) => el.closest("form"))).toBeNull();
    expect(
      await page.locator("#token-remember").evaluate((el) => (el as HTMLInputElement).checked),
    ).toBe(false);
    // The field's own label: the help view quotes the same text (3.10, step 5).
    await expect(page.locator("label[for=token-input]")).toHaveText(
      "Fine-grained token, read-only",
    );
    await expect(page.locator("label[for=token-input]")).toBeVisible();
    await expect(page.locator("label[for=owner-input]")).toHaveText("Owner");
    await expect(page.getByTestId("token-note")).toContainText("factoincognito Pages sites");
    await expect(anyLine(page)).toBeHidden();
    await expect(forgetAll(page)).toBeHidden();
  });

  test("Use clears the field and shows only the masked form; the token is nowhere on the page", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, `  ${TOKEN} `);
    await expect(page.locator("#token-input")).toHaveValue("");
    await expectLine(page, "acme", "github_pat_…1234", false);
    await expect(forgetButton(page)).toBeVisible();
    await expect(forgetAll(page)).toBeVisible();
    const everything = await pageContents(page);
    expect(everything).not.toContain(TOKEN);
    expect(everything).not.toContain("TEST_e2e");
  });

  for (const [name, text] of [
    ["a classic token", "ghp_TEST0123456789abcdefghijklmnopqrstuv"],
    ["text with a space inside", "github_pat_TEST abcd"],
    ["only the prefix", "github_pat_"],
    ["another kind of text", "hunter2"],
  ] as const) {
    test(`refuses ${name}: a message, nothing kept, nothing sent`, async ({ page, context }) => {
      const stub = await stubGithub(context);
      await page.goto("/");
      await openPanel(page);
      await useToken(page, text, true);
      await expect(page.getByTestId("token-message")).toContainText("github_pat_");
      await expect(anyLine(page)).toBeHidden();
      await expect(page.locator("#token-input")).toHaveValue("");
      expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
      // The prefix alone is also the message's own wording.
      if (text !== "github_pat_") expect(await pageContents(page)).not.toContain(text);
      await openUrl(page);
      await expect(page.getByTestId("column").first()).toBeVisible();
      expect(gets(stub).every((s) => !("authorization" in s.headers))).toBe(true);
    });
  }
});

test.describe("where the token is kept (3.8)", () => {
  test("by default in memory only: no storage write, and a reload forgets it", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN);
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
    await page.reload();
    await openPanel(page);
    await expect(anyLine(page)).toBeHidden();
  });

  test("with Remember the token: localStorage holds it under vizi.githubTokens, by owner inside the value, and a reload finds it and uses it", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await expectLine(page, "acme", "github_pat_…1234", true);
    expect(await saved(page)).toEqual({ tokens: { acme: TOKEN }, forgot: [] });
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([KEY]);

    await page.reload();

    await openPanel(page);
    await expectLine(page, "acme", "github_pat_…1234", true);
    await expect(rememberBox(page)).toBeChecked();
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    expect(gets(stub).length).toBeGreaterThan(0);
    for (const s of gets(stub)) expect(s.headers.authorization).toBe(`Bearer ${TOKEN}`);
  });

  test("unticking Remember later removes the saved copy and keeps the token for this page", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await rememberBox(page).uncheck();
    expect(await saved(page)).toEqual({ tokens: {}, forgot: [] });
    await expectLine(page, "acme", "github_pat_…1234", false);
    await rememberBox(page).check();
    expect((await saved(page))?.tokens).toEqual({ acme: TOKEN });
  });

  test("at startup a stored value that does not match the rule is removed and no token is held", async ({
    page,
  }) => {
    await page.goto("/");
    await openPanel(page);
    await page.evaluate((k) => localStorage.setItem(k, "ghp_TEST_classic"), KEY);
    await page.reload();
    await openPanel(page);
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
    await expect(anyLine(page)).toBeHidden();
  });

  test("at startup a bad entry is dropped, the good one kept, and the cleaned value written back", async ({
    page,
  }) => {
    await page.goto("/");
    await openPanel(page);
    await page.evaluate(
      ([k, v]) => localStorage.setItem(k as string, v as string),
      [KEY, value({ acme: TOKEN, "a/b": TOKEN2, fomo: "ghp_TEST_classic" })],
    );
    await page.reload();
    await openPanel(page);
    await expect(anyLine(page)).toHaveCount(1);
    await expectLine(page, "acme", "github_pat_…1234", true);
    expect(await saved(page)).toEqual({ tokens: { acme: TOKEN }, forgot: [] });
  });
});

test.describe("what a load with a token sends (3.8)", () => {
  test("every request goes to api.github.com as Authorization: Bearer, request 3 through the contents API, none to raw.githubusercontent.com", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    expect(gets(stub).map((s) => s.url)).toEqual([
      API,
      `${API}/git/trees/main?recursive=1`,
      `${API}/contents/docs/BACKLOG.md?ref=main`,
      `${API}/contents/STATUS.md?ref=main`,
    ]);
    for (const s of gets(stub)) expect(s.headers.authorization).toBe(`Bearer ${TOKEN}`);
    expect(
      gets(stub)
        .slice(2)
        .map((s) => s.headers.accept),
    ).toEqual(["application/vnd.github.raw+json", "application/vnd.github.raw+json"]);
    await expect(page.getByTestId("status-phase")).toBeVisible();
  });

  test("no cookies are sent (the no-store cache mode is a unit test of the options)", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await context.addCookies([
      {
        name: "session",
        value: "TESTCOOKIE",
        domain: "api.github.com",
        path: "/",
        secure: true,
        sameSite: "None",
      },
    ]);
    await page.goto("/");
    await openPanel(page);
    // Control: a request that does include credentials carries the cookie, so the check below can fail.
    await page.evaluate(() =>
      fetch("https://api.github.com/repos/acme/control", { credentials: "include" }).catch(
        () => {},
      ),
    );
    await useToken(page, TOKEN);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    const control = gets(stub).find((s) => s.url.endsWith("/acme/control"));
    expect(control?.headers.cookie).toContain("TESTCOOKIE");
    for (const s of gets(stub).filter((g) => g.headers.authorization)) {
      expect(s.headers.cookie).toBeUndefined();
    }
  });

  test("without a token the requests are those of 3.1: raw.githubusercontent.com, no Authorization header", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    expect(gets(stub).map((s) => s.url)).toEqual([
      API,
      `${API}/git/trees/main?recursive=1`,
      "https://raw.githubusercontent.com/acme/widgets/main/docs/BACKLOG.md",
      "https://raw.githubusercontent.com/acme/widgets/main/STATUS.md",
    ]);
    expect(gets(stub).every((s) => !("authorization" in s.headers))).toBe(true);
  });
});

test.describe("the token is never shown or logged (3.8)", () => {
  test("not in any request URL, console message, page text, attribute, field or report, on success or on any failure", async ({
    page,
    context,
  }) => {
    const console_ = watchConsole(page);
    const urls: string[] = [];
    page.on("request", (r) => urls.push(r.url()));
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    await page.locator("#tab-report").click();
    expect(await pageContents(page)).not.toContain(TOKEN);

    // Failures of each kind: 404, 403, 500, and a request that never gets an answer.
    for (const status of [404, 403, 500]) {
      await stubFailure(context, status);
      await openUrl(page, `${REPO}-f${status}`);
      await expect(page.locator("#message")).not.toHaveText("Loading…");
      expect(await pageContents(page)).not.toContain(TOKEN);
    }
    await context.route("https://api.github.com/repos/acme/aborted", (route) =>
      route.abort("failed"),
    );
    await openUrl(page, "https://github.com/acme/aborted");
    await expect(page.locator("#message")).toContainText("api.github.com");
    expect(await pageContents(page)).not.toContain(TOKEN);

    expect(urls.filter((u) => u.includes("github_pat_"))).toEqual([]);
    expect(console_.filter((t) => t.includes(TOKEN) || t.includes("github_pat_"))).toEqual([]);
    expect(stub.seen.filter((s) => s.url.includes("github_pat_"))).toEqual([]);
  });

  test("a network failure names the host and says the request failed", async ({
    page,
    context,
  }) => {
    await context.route("https://api.github.com/**", (route) => route.abort("failed"));
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN);
    await openUrl(page);
    await expect(page.locator("#message")).toHaveText("The request to api.github.com failed.");
  });
});

/** Makes every request for acme/widgets-f<status> answer with that status. */
async function stubFailure(context: BrowserContext, status: number) {
  await context.route(`https://api.github.com/repos/acme/widgets-f${status}`, (route) =>
    route.fulfill({
      status,
      headers: { "access-control-allow-origin": "*", "x-ratelimit-remaining": "7" },
      body: "",
    }),
  );
}

test.describe("answers to a token (3.8)", () => {
  test("401: says the token was refused, forgets it everywhere, and later loads of public repos carry none", async ({
    page,
    context,
  }) => {
    let refuse = true;
    const stub = await stubGithub(context, {
      answer: (url) => {
        if (url !== API || !refuse) return undefined;
        refuse = false;
        return { status: 401 };
      },
    });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect(page.locator("#message")).toHaveText(
      "GitHub refused the token for acme: it may have expired. It has been forgotten; enter a new one.",
    );
    await expect(anyLine(page)).toBeHidden();
    await expect(page.locator("#results")).toBeHidden();
    expect((await saved(page))?.tokens ?? {}).toEqual({});
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    const later = gets(stub).slice(1);
    expect(later.length).toBeGreaterThan(0);
    expect(later.every((s) => !("authorization" in s.headers))).toBe(true);
  });

  test("403 at the rate limit: says so and when it resets; the token is kept", async ({
    page,
    context,
  }) => {
    await stubGithub(context, {
      answer: (url) =>
        url === API
          ? {
              status: 403,
              headers: {
                "x-ratelimit-remaining": "0",
                "x-ratelimit-reset": "1793700000",
                "access-control-expose-headers": "x-ratelimit-remaining, x-ratelimit-reset",
              },
            }
          : undefined,
    });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect(page.locator("#message")).toHaveText(
      "GitHub's rate limit is reached. It resets at 2026-11-03 10:00:00 UTC.",
    );
    await expect(line(page)).toBeVisible();
    expect((await saved(page))?.tokens).toEqual({ acme: TOKEN });
  });

  test("403 otherwise: the token may not read this repo; the token is kept", async ({
    page,
    context,
  }) => {
    await stubGithub(context, { answer: (url) => (url === API ? { status: 403 } : undefined) });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN);
    await openUrl(page);
    await expect(page.locator("#message")).toContainText("the token may not read this repo");
    await expect(line(page)).toBeVisible();
  });

  test("404 on request 1: not found, or no access; the token is kept", async ({
    page,
    context,
  }) => {
    await stubGithub(context, { answer: (url) => (url === API ? { status: 404 } : undefined) });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN);
    await openUrl(page);
    await expect(page.locator("#message")).toHaveText(
      "Not found, or the token does not give access to this repo.",
    );
    await expect(line(page)).toBeVisible();
  });
});

test.describe("Forget, per owner (3.8)", () => {
  test("clears memory, storage, the line and the results loaded with the token; the next load carries no token", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    const before = gets(stub).length;

    await forgetButton(page).click();
    await expect(page.locator("#message")).toHaveText("The token for acme has been forgotten.");
    await expect(anyLine(page)).toBeHidden();
    await expect(page.locator("#results")).toBeHidden();
    await expect(page.locator("#board")).toBeEmpty();
    await expect(page.locator("#status")).toBeEmpty();
    await expect(page.locator("#doc-list")).toBeEmpty();
    await expect(page.locator("#token-input")).toHaveValue("");
    // Only the owner's entry goes; the key stays with "forgot" so other tabs forget that owner too.
    expect(await saved(page)).toEqual({ tokens: {}, forgot: ["acme"] });
    expect(await pageContents(page)).not.toContain("Bearer");

    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    for (const s of gets(stub).slice(before)) expect("authorization" in s.headers).toBe(false);
  });

  test("results loaded without a token stay", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    await useToken(page, TOKEN);
    await forgetButton(page).click();
    await expect(page.getByTestId("column").first()).toBeVisible();
  });

  test("during a load: the load's late answer is dropped and shows nothing, and no later request carries the token", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: API });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN);
    await openUrl(page);
    await expect(page.locator("#message")).toHaveText("Loading…");
    await expect.poll(() => gets(stub).length).toBe(1);

    await forgetButton(page).click();
    await expect(anyLine(page)).toBeHidden();
    const late = page.waitForResponse((r) => r.url() === API);
    stub.release();
    await late;
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 200)));

    await expect(page.locator("#results")).toBeHidden();
    await expect(page.getByTestId("column")).toHaveCount(0);
    await expect(page.locator("#message")).not.toHaveText("Loading…");
    expect(gets(stub)).toHaveLength(1);
  });
});

test.describe("a second tab (3.8)", () => {
  test("removing the key there makes this tab drop its token and hide its token-loaded results", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();

    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);
    await expect(line(other)).toBeVisible();
    await other.evaluate((k) => localStorage.removeItem(k), KEY);

    await expect(anyLine(page)).toBeHidden();
    await expect(page.locator("#results")).toBeHidden();
    await expect(page.locator("#message")).toHaveText(
      "The tokens were removed in another tab, so they have been forgotten.",
    );
    const before = gets(stub).length;
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    for (const s of gets(stub).slice(before)) expect("authorization" in s.headers).toBe(false);
  });

  test("removing the key there also makes a tab that held a token for its page only forget it", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, false);
    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);
    await other.evaluate(
      ([k, v]) => localStorage.setItem(k as string, v as string),
      [KEY, value({ fomo: TOKEN3 })],
    );
    await expect(line(page, "fomo")).toBeVisible();
    await other.evaluate((k) => localStorage.removeItem(k), KEY);
    // Two lines show until the event arrives, and toBeHidden fails at once on two
    // matches (strict mode) instead of waiting: count them instead.
    await expect(anyLine(page)).toHaveCount(0);
  });

  test("clearing all of storage there counts as the key removed", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, false);
    await useToken(page, TOKEN2, true, "fomo-t");
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);
    await other.evaluate(() => localStorage.clear());
    // Two lines until the event arrives: toHaveCount waits, toBeHidden would fail on two matches.
    await expect(anyLine(page)).toHaveCount(0);
    await expect(page.locator("#results")).toBeHidden();
  });

  test("forgetting an owner there forgets that owner here, and only that owner", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await useToken(page, TOKEN2, true, "fomo-t");
    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);
    await expect(line(other, "fomo-t")).toBeVisible();
    await forgetButton(other, "fomo-t").click();
    await expect(line(page, "fomo-t")).toBeHidden();
    await expect(line(page)).toBeVisible();
    await expect(page.locator("#message")).toHaveText("The token for fomo-t has been forgotten.");
    expect((await saved(page))?.tokens).toEqual({ acme: TOKEN });
  });

  test("an owner forgotten there loses its token here even if this tab held one for this page only", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await useToken(page, TOKEN2, false, "fomo-t");
    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);
    await other.evaluate(
      ([k, v]) => localStorage.setItem(k as string, v as string),
      [KEY, value({ acme: TOKEN }, ["fomo-t"])],
    );
    await expect(line(page, "fomo-t")).toBeHidden();
    await expect(line(page)).toBeVisible();
  });

  test("forgetting there hides results loaded with that owner's token here, and drops a load that is running", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);
    await forgetButton(other).click();
    await expect(page.locator("#results")).toBeHidden();
    await expect(anyLine(page)).toBeHidden();
  });

  test("saving a new token there makes this tab use it for its next loads; results already shown stay", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { lag: 400 });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();

    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);
    await other.evaluate(
      ([k, v]) => localStorage.setItem(k as string, v as string),
      [KEY, value({ acme: TOKEN2 })],
    );

    await expectLine(page, "acme", "github_pat_…9876", true);
    await expect(page.getByTestId("column").first()).toBeVisible();
    const before = gets(stub).length;
    await openUrl(page);
    // The old results stay on screen, so a visible column proves nothing about the new
    // load: wait for its first request, then for the load to end.
    await expect.poll(() => gets(stub).length - before).toBeGreaterThan(0);
    await expect(page.locator("#message")).not.toHaveText("Loading…");
    await expect(page.getByTestId("column").first()).toBeVisible();
    const sent = gets(stub).slice(before);
    for (const s of sent) expect(s.headers.authorization).toBe(`Bearer ${TOKEN2}`);
  });

  test("a token saved there for another owner is adopted for that owner only", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);
    await useToken(other, TOKEN2, true, "fomo-t");
    await expectLine(page, "fomo-t", "github_pat_…9876", true);
    await openUrl(page, "https://github.com/fomo-t/app");
    await expect(page.getByTestId("column").first()).toBeVisible();
    for (const s of gets(stub)) expect(s.headers.authorization).toBe(`Bearer ${TOKEN2}`);
  });

  test("a saved copy removed there without forgetting keeps the token here, for this page only, and still used", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);
    await rememberBox(other).uncheck();
    await expectLine(page, "acme", "github_pat_…1234", false);
    await expect(rememberBox(page)).not.toBeChecked();
    // No full Forget: the results stay and the next load carries the token.
    await expect(page.getByTestId("column").first()).toBeVisible();
    const before = gets(stub).length;
    await openUrl(page);
    await expect.poll(() => gets(stub).length - before).toBeGreaterThan(0);
    for (const s of gets(stub).slice(before))
      expect(s.headers.authorization).toBe(`Bearer ${TOKEN}`);
  });

  test("another tab's write about owner Y, which carries the stored X entry unchanged, leaves this tab's page-only X token as it was", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, false);
    // What the browser delivers when another tab, whose X entry differs from this tab's page-only token,
    // saves owner Y: the old and new values both hold the stored X entry.
    await page.evaluate(
      ([k, o, n]) =>
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: k,
            oldValue: o,
            newValue: n,
            storageArea: localStorage,
          }),
        ),
      [KEY, value({ acme: TOKEN3 }), value({ acme: TOKEN3, "fomo-t": TOKEN2 })],
    );
    await expect(line(page, "fomo-t")).toBeVisible();
    await expectLine(page, "acme", "github_pat_…1234", false);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    for (const s of gets(stub)) expect(s.headers.authorization).toBe(`Bearer ${TOKEN}`);
  });

  test("a new tab's startup clean-up does not carry the stored forgot list: a page-only token here stays", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    // A stored value that needs cleaning (an upper-case owner) and whose forgot names fomo-t.
    await page.evaluate(
      ([k, v]) => localStorage.setItem(k as string, v as string),
      [KEY, JSON.stringify({ tokens: { ACME: TOKEN3 }, forgot: ["fomo-t"] })],
    );
    await useToken(page, TOKEN2, false, "fomo-t");
    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);
    await expect(line(other, "acme")).toBeVisible();
    expect(await saved(other)).toEqual({ tokens: { acme: TOKEN3 }, forgot: [] });
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)));
    await expectLine(page, "fomo-t", "github_pat_…9876", false);
  });

  test("following an event writes nothing to storage", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, false);
    const before = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
    await page.evaluate(
      ([k, n]) =>
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: k,
            oldValue: null,
            newValue: n,
            storageArea: localStorage,
          }),
        ),
      [KEY, value({ "fomo-t": TOKEN2 }, ["acme"])],
    );
    await expect(line(page)).toBeHidden();
    expect(await page.evaluate(() => JSON.stringify(Object.entries(localStorage)))).toBe(before);
  });

  test("a value written there that is not JSON is not adopted; the token held stays in use, for this page only", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);
    await other.evaluate((k) => localStorage.setItem(k, "ghp_TEST_classic"), KEY);
    await expectLine(page, "acme", "github_pat_…1234", false);
  });
});

test.describe("the Owner field (3.8)", () => {
  test("is filled from the address until the user types in it, then left alone; an emptied field is filled again", async ({
    page,
  }) => {
    await page.goto("/");
    await openPanel(page);
    const owner = page.locator("#owner-input");
    const address = page.locator("#url-input");
    await expect(owner).toHaveValue("");
    await address.fill("https://github.com/acme/widgets");
    await expect(owner).toHaveValue("acme");
    await address.fill("https://github.com/fomo-t/app");
    await expect(owner).toHaveValue("fomo-t");
    // An address vizi cannot read leaves the field as it was.
    await address.fill("not an address");
    await expect(owner).toHaveValue("fomo-t");

    await owner.fill("mine");
    await address.fill("https://github.com/other/thing");
    await expect(owner).toHaveValue("mine");

    await owner.fill("");
    await expect(owner).toHaveValue("other");
    await address.fill("https://github.com/last/one");
    await expect(owner).toHaveValue("last");
  });

  test("Use takes the owner trimmed and without regard to case", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true, "  ACME ");
    await expect(line(page, "acme")).toBeVisible();
    expect((await saved(page))?.tokens).toEqual({ acme: TOKEN });
  });

  for (const [name, owner] of [
    ["an empty owner", ""],
    ["an owner with a slash", "acme/widgets"],
    ["a dot", "."],
    ["two dots", ".."],
    ["an owner with a space inside", "ac me"],
  ] as const) {
    test(`refuses ${name}: a message, nothing kept`, async ({ page }) => {
      await page.goto("/");
      await openPanel(page);
      await useToken(page, TOKEN, true, owner);
      await expect(page.getByTestId("token-message")).toContainText("owner");
      await expect(anyLine(page)).toBeHidden();
      expect(await page.evaluate(() => localStorage.length)).toBe(0);
      expect(await pageContents(page)).not.toContain(TOKEN);
    });
  }

  test("a token used for an owner that has one replaces it", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await useToken(page, TOKEN2, true);
    await expect(anyLine(page)).toHaveCount(1);
    await expectLine(page, "acme", "github_pat_…9876", true);
    expect((await saved(page))?.tokens).toEqual({ acme: TOKEN2 });
  });
});

test.describe("one token per owner (3.8)", () => {
  test("each owner's token is used only for that owner's addresses, without regard to case; another owner's load carries none", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      answer: (url) =>
        url === "https://api.github.com/repos/other/thing" ? { status: 404 } : undefined,
    });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, false, "acme");
    await useToken(page, TOKEN2, false, "fomo-t");
    await expectLine(page, "acme", "github_pat_…1234", false);
    await expectLine(page, "fomo-t", "github_pat_…9876", false);

    await openUrl(page, "https://github.com/ACME/widgets");
    await expect(page.getByTestId("column").first()).toBeVisible();
    expect(gets(stub).length).toBeGreaterThan(0);
    for (const s of gets(stub)) expect(s.headers.authorization).toBe(`Bearer ${TOKEN}`);

    let mark = gets(stub).length;
    await openUrl(page, "https://github.com/fomo-t/app");
    await expect(page.locator("#project-name")).toHaveText("fomo-t/app (main)");
    expect(gets(stub).length).toBeGreaterThan(mark);
    for (const s of gets(stub).slice(mark))
      expect(s.headers.authorization).toBe(`Bearer ${TOKEN2}`);

    mark = gets(stub).length;
    await openUrl(page, "https://github.com/other/thing");
    await expect(page.locator("#message")).toHaveText(
      "Not found or not public. If the repo is private, add a token for its owner.",
    );
    const sent = gets(stub).slice(mark);
    expect(sent.length).toBeGreaterThan(0);
    for (const s of sent) expect("authorization" in s.headers).toBe(false);
  });

  test("with no token held for any owner, a 404 is 3.1's message", async ({ page, context }) => {
    await stubGithub(context, { answer: (url) => (url === API ? { status: 404 } : undefined) });
    await page.goto("/");
    await openPanel(page);
    await openUrl(page);
    await expect(page.locator("#message")).toHaveText(
      "Not found or not public. If the repo is private, add a token for its owner.",
    );
  });

  test("each line is masked and has its own Remember box and Forget button", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true, "acme");
    await useToken(page, TOKEN2, false, "fomo-t");
    await expect(rememberBox(page, "acme")).toBeChecked();
    await expect(rememberBox(page, "fomo-t")).not.toBeChecked();
    await rememberBox(page, "fomo-t").check();
    expect((await saved(page))?.tokens).toEqual({ acme: TOKEN, "fomo-t": TOKEN2 });
    await rememberBox(page, "acme").uncheck();
    expect((await saved(page))?.tokens).toEqual({ "fomo-t": TOKEN2 });
    await expectLine(page, "acme", "github_pat_…1234", false);
    await expectLine(page, "fomo-t", "github_pat_…9876", true);
    const everything = await pageContents(page);
    for (const t of [TOKEN, TOKEN2]) expect(everything).not.toContain(t);
  });

  test("owners named like what an object inherits are kept apart from the others", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    for (const name of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      await expect(line(page, name)).toBeHidden();
    }
    await useToken(page, TOKEN, true, "constructor");
    await useToken(page, TOKEN2, true, "__proto__");
    await expect(line(page, "constructor")).toBeVisible();
    await expect(line(page, "__proto__")).toBeVisible();
    await expect(line(page, "tostring")).toBeHidden();
    await page.reload();
    await openPanel(page);
    await expect(anyLine(page)).toHaveCount(2);
    await expectLine(page, "__proto__", "github_pat_…9876", true);
  });
});

test.describe("Forget all, and Forget with several owners (3.8)", () => {
  test("Forget for one owner hides only results loaded with that owner's token", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true, "acme");
    await useToken(page, TOKEN2, true, "fomo-t");
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();

    await forgetButton(page, "fomo-t").click();
    await expect(line(page, "fomo-t")).toBeHidden();
    await expect(page.getByTestId("column").first()).toBeVisible();
    expect((await saved(page))?.tokens).toEqual({ acme: TOKEN });

    await forgetButton(page, "acme").click();
    await expect(page.locator("#results")).toBeHidden();
    await expect(page.locator("#board")).toBeEmpty();
    expect(await pageContents(page)).not.toContain("Bearer");
  });

  test("Forget for any owner drops a load that is running", async ({ page, context }) => {
    const stub = await stubGithub(context, { hold: API });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, false, "acme");
    await useToken(page, TOKEN2, false, "fomo-t");
    await openUrl(page);
    await expect.poll(() => gets(stub).length).toBe(1);
    await forgetButton(page, "fomo-t").click();
    const late = page.waitForResponse((r) => r.url() === API);
    stub.release();
    await late;
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 200)));
    await expect(page.locator("#results")).toBeHidden();
    await expect(page.locator("#message")).not.toHaveText("Loading…");
    expect(gets(stub)).toHaveLength(1);
  });

  test("Forget all removes every token and the key, hides every result loaded with a token, and says so", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true, "acme");
    await useToken(page, TOKEN2, false, "fomo-t");
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    await forgetAll(page).click();
    await expect(page.locator("#message")).toHaveText("All tokens have been forgotten.");
    await expect(anyLine(page)).toBeHidden();
    await expect(forgetAll(page)).toBeHidden();
    await expect(page.locator("#results")).toBeHidden();
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
  });

  test("Forget all leaves results loaded without a token", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openPanel(page);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    await useToken(page, TOKEN, true);
    await forgetAll(page).click();
    await expect(page.getByTestId("column").first()).toBeVisible();
  });
});

test.describe("a 401 forgets only the refused token (3.8)", () => {
  test("the other owners' tokens stay", async ({ page, context }) => {
    await stubGithub(context, { answer: (url) => (url === API ? { status: 401 } : undefined) });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true, "acme");
    await useToken(page, TOKEN2, true, "fomo-t");
    await openUrl(page);
    await expect(page.locator("#message")).toHaveText(
      "GitHub refused the token for acme: it may have expired. It has been forgotten; enter a new one.",
    );
    await expect(line(page, "acme")).toBeHidden();
    await expect(line(page, "fomo-t")).toBeVisible();
    expect((await saved(page))?.tokens).toEqual({ "fomo-t": TOKEN2 });
  });

  test("a new token entered for the same owner while the request ran is kept", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, {
      hold: API,
      answer: (url) => (url === API ? { status: 401 } : undefined),
    });
    await page.goto("/");
    await openPanel(page);
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect.poll(() => gets(stub).length).toBe(1);
    await useToken(page, TOKEN2, true);
    stub.release();
    await expect(page.locator("#message")).toContainText("GitHub refused the token for acme");
    await expectLine(page, "acme", "github_pat_…9876", true);
    expect((await saved(page))?.tokens).toEqual({ acme: TOKEN2 });
    expect(gets(stub)).toHaveLength(1);
  });
});

test.describe("a token saved by an earlier vizi (3.8, migration)", () => {
  const migrateLine = (page: Page) => page.getByTestId("migrate-line");

  async function withOldKey(page: Page, value_: string) {
    await page.goto("/");
    await openPanel(page);
    await page.evaluate(
      ([k, v]) => localStorage.setItem(k as string, v as string),
      [OLD_KEY, value_],
    );
    await page.reload();
    await openPanel(page);
  }

  test("is listed with its masked form, an Owner field and two buttons, and is used for no load until it has an owner", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await withOldKey(page, TOKEN);
    await expect(migrateLine(page)).toHaveText(
      "A token saved by an earlier vizi (github_pat_…1234) has no owner yet. Whose repos is it for?",
    );
    await expect(page.locator("#migrate-owner")).toBeVisible();
    await expect(page.locator("#migrate-keep")).toHaveText("Keep");
    await expect(page.locator("#migrate-forget")).toHaveText("Forget it");
    await expect(anyLine(page)).toBeHidden();
    expect(await pageContents(page)).not.toContain(TOKEN);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    expect(gets(stub).every((s) => !("authorization" in s.headers))).toBe(true);
  });

  test("Keep moves it into vizi.githubTokens, saved, removes the old key, and the owner's loads then use it", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await withOldKey(page, TOKEN);
    await page.locator("#migrate-owner").fill("Acme");
    await page.locator("#migrate-keep").click();
    await expect(migrateLine(page)).toBeHidden();
    await expectLine(page, "acme", "github_pat_…1234", true);
    expect(await saved(page)).toEqual({ tokens: { acme: TOKEN }, forgot: [] });
    expect(await page.evaluate((k) => localStorage.getItem(k), OLD_KEY)).toBeNull();
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    for (const s of gets(stub)) expect(s.headers.authorization).toBe(`Bearer ${TOKEN}`);
  });

  test("Keep with an owner that breaks the rule says so and changes nothing", async ({ page }) => {
    await withOldKey(page, TOKEN);
    await page.locator("#migrate-owner").fill("a/b");
    await page.locator("#migrate-keep").click();
    await expect(page.getByTestId("token-message")).toContainText("owner");
    await expect(migrateLine(page)).toBeVisible();
    expect(await page.evaluate((k) => localStorage.getItem(k), OLD_KEY)).toBe(TOKEN);
    expect(await saved(page)).toBeNull();
  });

  test("Forget removes the old key and the line", async ({ page }) => {
    await withOldKey(page, TOKEN);
    await page.locator("#migrate-forget").click();
    await expect(migrateLine(page)).toBeHidden();
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
  });

  test("an old value that is not a token is removed at startup and no line is shown", async ({
    page,
  }) => {
    await withOldKey(page, "ghp_TEST_classic");
    await expect(migrateLine(page)).toBeHidden();
    expect(await page.evaluate((k) => localStorage.getItem(k), OLD_KEY)).toBeNull();
  });

  for (const action of ["Keep", "Forget it"] as const) {
    test(`a second tab's line is hidden when this tab chooses "${action}"`, async ({
      page,
      context,
    }) => {
      await stubGithub(context);
      await withOldKey(page, TOKEN);
      const other = await context.newPage();
      await other.goto("/");
      await openPanel(other);
      await expect(migrateLine(other)).toBeVisible();
      if (action === "Forget it") await page.locator("#migrate-forget").click();
      else {
        await page.locator("#migrate-owner").fill("acme");
        await page.locator("#migrate-keep").click();
      }
      await expect(migrateLine(other)).toBeHidden();
      if (action !== "Forget it") await expect(lineText(other)).toBeVisible();
    });
  }

  test("a token an earlier vizi saves in another tab shows the line here, and removing it hides the line", async ({
    page,
  }) => {
    await page.goto("/");
    await openPanel(page);
    const other = await page.context().newPage();
    await other.goto("/");
    await openPanel(other);
    await other.evaluate(
      ([k, v]) => localStorage.setItem(k as string, v as string),
      [OLD_KEY, TOKEN],
    );
    await expect(migrateLine(page)).toHaveText(
      "A token saved by an earlier vizi (github_pat_…1234) has no owner yet. Whose repos is it for?",
    );
    await other.evaluate((k) => localStorage.removeItem(k), OLD_KEY);
    await expect(migrateLine(page)).toBeHidden();
  });
});
