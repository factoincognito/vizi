/**
 * Browser tests for docs/SPEC.md 3.11 (PBI-1.14): vizi opens projects from
 * GitHub only. The start page has no file input, and neither the start
 * page, the help view nor the 404 messages, with a token and without,
 * offer a local folder. GitHub's answers are stubbed with routes: no test
 * reaches the network. Every token is an obviously fake value.
 */
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

/** The strings 3.11 lists; the help's "folder pointer" and "a folder of the same project" are allowed. */
const FOLDER_WORDS = ["local project folder", "local folder", "as a folder", "project's folder"];

/** 3.1's message for a 404 without a token for the owner, word for word. */
const NOT_FOUND = "Not found or not public. If the repo is private, add a token for its owner.";
/** 3.8's message for a 404 with a token for the owner, word for word. */
const NOT_FOUND_WITH_TOKEN = "Not found, or the token does not give access to this repo.";

const SECRET = "https://github.com/acme/secret";
const TOKEN = "github_pat_TEST_nofolder_abcd1234";

/** GitHub answers 404 to every request, as it does for a private repo it will not show. */
async function stubNotFound(context: BrowserContext): Promise<void> {
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, accept, content-type",
    "access-control-allow-methods": "GET, OPTIONS",
  };
  await context.route(
    /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//,
    async (route: Route) => {
      if (route.request().method() === "OPTIONS")
        return route.fulfill({ status: 204, headers: cors });
      return route.fulfill({ status: 404, headers: cors, body: "" });
    },
  );
}

async function useToken(page: Page, owner: string) {
  await page.locator("#owner-input").fill(owner);
  await page.locator("#token-input").fill(TOKEN);
  await page.locator("#token-use").click();
  await expect(page.locator(`[data-testid="token-line"][data-owner="${owner}"]`)).toBeVisible();
}

async function openUrl(page: Page, url: string) {
  await page.locator("#url-input").fill(url);
  await page.locator("#open-url").click();
}

/** Fails on any of 3.11's strings in the text, in any case. */
function expectNoFolderWords(text: string | null, where: string) {
  const lower = (text ?? "").toLowerCase();
  for (const words of FOLDER_WORDS) expect(lower, `${where} holds "${words}"`).not.toContain(words);
}

test.describe("no local folder (3.11)", () => {
  test("the start page has no file input and none of 3.11's folder strings", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#url-input")).toBeVisible();
    await expect(page.locator("input[type=file]")).toHaveCount(0);
    await expect(page.locator("[webkitdirectory]")).toHaveCount(0);
    expectNoFolderWords(await page.locator("#start").textContent(), "the start page");
    expectNoFolderWords(await page.locator("body").innerText(), "the page as shown");
  });

  test("the help view holds none of 3.11's folder strings, and step 5 has only the token way", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#help-open").click();
    const help = page.locator("#help");
    await expect(help).toBeVisible();
    expectNoFolderWords(await help.textContent(), "the help view");
    const step5 = help.locator(".help-steps > li").nth(4);
    const text = ((await step5.textContent()) ?? "").toLowerCase();
    expect(text).toContain("token");
    expect(text).not.toContain("folder");
  });

  test("a 404 with no token held is 3.1's message, word for word", async ({ page, context }) => {
    await stubNotFound(context);
    await page.goto("/");
    await openUrl(page, SECRET);
    await expect(page.locator("#message p")).toHaveText([NOT_FOUND]);
    expectNoFolderWords(await page.locator("#message").textContent(), "the 404 message");
    await expect(page.locator("#results")).toBeHidden();
  });

  test("a 404 with a token held only for another owner is 3.1's message, with no sentence after it", async ({
    page,
    context,
  }) => {
    await stubNotFound(context);
    await page.goto("/");
    await useToken(page, "other");
    await openUrl(page, SECRET);
    await expect(page.locator("#message p")).toHaveText([NOT_FOUND]);
    await expect(page.locator("#message")).not.toContainText("No token is held");
    expectNoFolderWords(await page.locator("#message").textContent(), "the 404 message");
  });

  test("a 404 with a token held for the owner is 3.8's message, word for word", async ({
    page,
    context,
  }) => {
    await stubNotFound(context);
    await page.goto("/");
    await useToken(page, "acme");
    await openUrl(page, SECRET);
    await expect(page.locator("#message p")).toHaveText([NOT_FOUND_WITH_TOKEN]);
    expectNoFolderWords(await page.locator("#message").textContent(), "the 404 message");
    expectNoFolderWords(await page.locator("#start").textContent(), "the start page");
  });
});
