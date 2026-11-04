/**
 * Browser tests for the saved token (docs/SPEC.md 3.8). GitHub's answers
 * are stubbed with routes: no test reaches the network. Every token here
 * is an obviously fake value, and all fixtures are synthetic.
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

const TOKEN = "github_pat_TEST_e2e_abcd1234";
const TOKEN2 = "github_pat_TEST_e2e_wxyz9876";
const KEY = "vizi.githubToken";
const REPO = "https://github.com/acme/widgets";
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
}

/** Answers the GitHub endpoints for acme/widgets on a whole context, recording every GET. */
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
      if (url === API) {
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ default_branch: "main" }),
        });
      }
      if (url === `${API}/git/trees/main?recursive=1`) {
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

async function useToken(page: Page, token: string, remember = false) {
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
    const field = page.locator("#token-input");
    await expect(field).toHaveAttribute("type", "password");
    await expect(field).toHaveAttribute("autocomplete", "off");
    await expect(field).toHaveAttribute("spellcheck", "false");
    expect(await field.evaluate((el) => el.closest("form"))).toBeNull();
    expect(await page.locator("#token-use").evaluate((el) => el.closest("form"))).toBeNull();
    expect(
      await page.locator("#token-remember").evaluate((el) => (el as HTMLInputElement).checked),
    ).toBe(false);
    await expect(page.getByText("GitHub token (for private repos)")).toBeVisible();
    await expect(page.getByTestId("token-note")).toContainText("factoincognito Pages sites");
    await expect(page.getByTestId("token-line")).toBeHidden();
  });

  test("Use clears the field and shows only the masked form; the token is nowhere on the page", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await useToken(page, `  ${TOKEN} `);
    await expect(page.locator("#token-input")).toHaveValue("");
    const line = page.getByTestId("token-line");
    await expect(line).toHaveText("Token in use: github_pat_…1234, for this page only.");
    await expect(page.getByRole("button", { name: "Forget the token" })).toBeVisible();
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
      await useToken(page, text, true);
      await expect(page.getByTestId("token-message")).toContainText("github_pat_");
      await expect(page.getByTestId("token-line")).toBeHidden();
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
    await useToken(page, TOKEN);
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
    await page.reload();
    await expect(page.getByTestId("token-line")).toBeHidden();
  });

  test("with Remember the token: localStorage holds it under vizi.githubToken, and a reload finds it and uses it", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await useToken(page, TOKEN, true);
    await expect(page.getByTestId("token-line")).toHaveText(
      "Token in use: github_pat_…1234, saved in this browser.",
    );
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(TOKEN);

    await page.reload();
    await expect(page.getByTestId("token-line")).toHaveText(
      "Token in use: github_pat_…1234, saved in this browser.",
    );
    await expect(page.locator("#token-remember")).toBeChecked();
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
    await useToken(page, TOKEN, true);
    await page.locator("#token-remember").uncheck();
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
    await expect(page.getByTestId("token-line")).toHaveText(
      "Token in use: github_pat_…1234, for this page only.",
    );
    await page.locator("#token-remember").check();
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(TOKEN);
  });

  test("at startup a stored value that does not match the rule is removed and no token is held", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate((k) => localStorage.setItem(k, "ghp_TEST_classic"), KEY);
    await page.reload();
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
    await expect(page.getByTestId("token-line")).toBeHidden();
  });
});

test.describe("what a load with a token sends (3.8)", () => {
  test("every request goes to api.github.com as Authorization: Bearer, request 3 through the contents API, none to raw.githubusercontent.com", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
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

  test("folder mode never uses the token", async ({ page, context }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await useToken(page, TOKEN);
    await page.locator("#folder-input").setInputFiles(project);
    await expect(page.locator("#results")).toBeVisible();
    expect(stub.seen).toEqual([]);
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
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect(page.locator("#message")).toHaveText(
      "GitHub refused the token: it may have expired. It has been forgotten; enter a new one.",
    );
    await expect(page.getByTestId("token-line")).toBeHidden();
    await expect(page.locator("#results")).toBeHidden();
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
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
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect(page.locator("#message")).toHaveText(
      "GitHub's rate limit is reached. It resets at 2026-11-03 10:00:00 UTC.",
    );
    await expect(page.getByTestId("token-line")).toBeVisible();
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(TOKEN);
  });

  test("403 otherwise: the token may not read this repo; the token is kept", async ({
    page,
    context,
  }) => {
    await stubGithub(context, { answer: (url) => (url === API ? { status: 403 } : undefined) });
    await page.goto("/");
    await useToken(page, TOKEN);
    await openUrl(page);
    await expect(page.locator("#message")).toContainText("the token may not read this repo");
    await expect(page.getByTestId("token-line")).toBeVisible();
  });

  test("404 on request 1: not found, or no access; offers the folder; the token is kept", async ({
    page,
    context,
  }) => {
    await stubGithub(context, { answer: (url) => (url === API ? { status: 404 } : undefined) });
    await page.goto("/");
    await useToken(page, TOKEN);
    await openUrl(page);
    await expect(page.locator("#message")).toHaveText(
      "Not found, or the token does not give access to this repo. Open the project as a local folder instead.",
    );
    await expect(page.getByTestId("token-line")).toBeVisible();
  });
});

test.describe("Forget the token (3.8)", () => {
  test("clears memory, storage, the line and the results loaded with the token; the next load carries no token", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    const before = gets(stub).length;

    await page.getByRole("button", { name: "Forget the token" }).click();
    await expect(page.getByTestId("token-line")).toBeHidden();
    await expect(page.locator("#results")).toBeHidden();
    await expect(page.locator("#board")).toBeEmpty();
    await expect(page.locator("#status")).toBeEmpty();
    await expect(page.locator("#doc-list")).toBeEmpty();
    await expect(page.locator("#token-input")).toHaveValue("");
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
    expect(await pageContents(page)).not.toContain("Bearer");

    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    for (const s of gets(stub).slice(before)) expect("authorization" in s.headers).toBe(false);
  });

  test("results loaded without a token stay", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    await useToken(page, TOKEN);
    await page.getByRole("button", { name: "Forget the token" }).click();
    await expect(page.getByTestId("column").first()).toBeVisible();
  });

  test("during a load: the load's late answer is dropped and shows nothing, and no later request carries the token", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: API });
    await page.goto("/");
    await useToken(page, TOKEN);
    await openUrl(page);
    await expect(page.locator("#message")).toHaveText("Loading…");
    await expect.poll(() => gets(stub).length).toBe(1);

    await page.getByRole("button", { name: "Forget the token" }).click();
    await expect(page.getByTestId("token-line")).toBeHidden();
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
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();

    const other = await context.newPage();
    await other.goto("/");
    await expect(other.getByTestId("token-line")).toBeVisible();
    await other.evaluate((k) => localStorage.removeItem(k), KEY);

    await expect(page.getByTestId("token-line")).toBeHidden();
    await expect(page.locator("#results")).toBeHidden();
    await expect(other.getByTestId("token-line")).toBeVisible();
    const before = gets(stub).length;
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    for (const s of gets(stub).slice(before)) expect("authorization" in s.headers).toBe(false);
  });

  test("removing the key there also makes a tab that held the token for its page only forget it", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await useToken(page, TOKEN, false);
    const other = await context.newPage();
    await other.goto("/");
    await other.evaluate((k) => localStorage.setItem(k, "github_pat_TEST_other"), KEY);
    await page.getByTestId("token-line").waitFor();
    await other.evaluate((k) => localStorage.removeItem(k), KEY);
    await expect(page.getByTestId("token-line")).toBeHidden();
  });

  test("saving a new token there makes this tab use it for its next loads; results already shown stay", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await useToken(page, TOKEN, true);
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();

    const other = await context.newPage();
    await other.goto("/");
    await other.evaluate(([k, v]) => localStorage.setItem(k as string, v as string), [KEY, TOKEN2]);

    await expect(page.getByTestId("token-line")).toHaveText(
      "Token in use: github_pat_…9876, saved in this browser.",
    );
    await expect(page.getByTestId("column").first()).toBeVisible();
    const before = gets(stub).length;
    await openUrl(page);
    await expect(page.getByTestId("column").first()).toBeVisible();
    const sent = gets(stub).slice(before);
    expect(sent.length).toBeGreaterThan(0);
    for (const s of sent) expect(s.headers.authorization).toBe(`Bearer ${TOKEN2}`);
  });

  test("a value written there that does not match the rule is not adopted", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await useToken(page, TOKEN, true);
    const other = await context.newPage();
    await other.goto("/");
    await other.evaluate((k) => localStorage.setItem(k, "ghp_TEST_classic"), KEY);
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 200)));
    await expect(page.getByTestId("token-line")).toHaveText(
      "Token in use: github_pat_…1234, saved in this browser.",
    );
  });
});
