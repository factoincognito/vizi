/**
 * Browser tests for the branch picker (docs/SPEC.md 3.13, PBI-1.15). GitHub
 * is stubbed with routes for acme/widgets and acme/plain, every branch
 * answering with the same synthetic files; the branch list is set per test.
 * Every project is opened with a full address, which both forms of the
 * Repository field accept. Every token is an obviously fake value.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { type BrowserContext, test as base, expect, type Page, type Route } from "@playwright/test";
import { isAllowedRequest } from "./guard";
import { openPanel } from "./panel";

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
const TOKEN = "github_pat_TEST_branches_abcd1234";
const WIDGETS = "https://github.com/acme/widgets";
const PLAIN = "https://github.com/acme/plain";
const API = "https://api.github.com/repos/acme";
const branchesUrl = (repo: string, n: number) => `${API}/${repo}/branches?per_page=100&page=${n}`;

type Seen = { url: string; authorization: string | undefined };
interface StubOptions {
  /** The branch names of each repo; GitHub gives them in pages of 100. Default: main, dev, feat/x. */
  branches?: Record<string, string[]>;
  /** Keeps the answer to a URL waiting until `release(url)`. */
  hold?: (url: string) => boolean;
  /** Overrides an answer's status (and headers). */
  status?: (url: string) => { status: number; headers?: Record<string, string> } | undefined;
}
interface Stub {
  seen: Seen[];
  release: (url?: string) => void;
}

/** Answers GitHub for acme/widgets and acme/plain on the whole context, on any branch. */
async function stubGithub(context: BrowserContext, options: StubOptions = {}): Promise<Stub> {
  const seen: Seen[] = [];
  const gates = new Map<string, () => void>();
  const waiting = new Map<string, Promise<void>>();
  const release = (url?: string) => {
    for (const [u, open] of gates) if (url === undefined || u === url) open();
  };
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, accept, content-type",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-expose-headers": "x-ratelimit-remaining, x-ratelimit-reset",
  };
  const branches = options.branches ?? {
    widgets: ["main", "dev", "feat/x"],
    plain: ["main", "plain-only"],
  };
  await context.route(
    /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//,
    async (route: Route) => {
      const request = route.request();
      const url = request.url();
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      seen.push({ url, authorization: (await request.allHeaders()).authorization });
      if (options.hold?.(url)) {
        if (!waiting.has(url)) waiting.set(url, new Promise<void>((r) => gates.set(url, r)));
        await waiting.get(url);
      }
      const forced = options.status?.(url);
      if (forced)
        return route.fulfill({
          status: forced.status,
          headers: { ...cors, ...forced.headers },
          body: "",
        });
      const repoMatch = /^https:\/\/api\.github\.com\/repos\/acme\/([a-z-]+)$/.exec(url);
      if (repoMatch)
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ default_branch: "main" }),
        });
      const listMatch =
        /^https:\/\/api\.github\.com\/repos\/acme\/([a-z-]+)\/branches\?per_page=100&page=(\d+)$/.exec(
          url,
        );
      if (listMatch?.[1] && listMatch[2]) {
        const n = Number(listMatch[2]);
        const all = branches[listMatch[1]] ?? [];
        const items = all.slice((n - 1) * 100, n * 100).map((name) => ({
          name,
          commit: { sha: "0000000", url: "x" },
          protected: false,
        }));
        return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(items) });
      }
      if (/\/git\/trees\/[^?]+\?recursive=1$/.test(url)) {
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
  return { seen, release };
}

const urls = (stub: Stub) => stub.seen.map((s) => s.url);
const branchRequests = (stub: Stub) => urls(stub).filter((u) => u.includes("/branches?"));
const select = (page: Page) => page.locator("#branch-select");
const openBranch = (page: Page) => page.locator("#branch-open");
const optionTexts = (page: Page) => select(page).locator("option").allTextContents();
/** Gives the page time to make any request it would make (in the page, so no test clock is involved). */
const settle = (page: Page) => page.evaluate(() => new Promise<void>((r) => setTimeout(r, 250)));

async function open(page: Page, address: string) {
  await page.locator("#url-input").fill(address);
  await page.locator("#open-url").click();
}

/** Opens acme/widgets and waits until its branch list has been read. */
async function openWidgets(page: Page, address = WIDGETS) {
  await open(page, address);
  await expect(page.locator("#project-name")).toContainText("acme/widgets (");
  await expect(openBranch(page)).toBeEnabled();
  await expect(page.locator("#branch-picker")).not.toHaveAttribute("aria-busy", "true");
}

async function pick(page: Page, name: string) {
  await select(page).selectOption(name);
  await openBranch(page).click();
}

async function useToken(page: Page, owner = "acme") {
  await openPanel(page);
  await page.locator("#owner-input").fill(owner);
  await page.locator("#token-input").fill(TOKEN);
  await page.locator("#token-use").click();
  await expect(page.locator(`[data-testid="token-line"][data-owner="${owner}"]`)).toBeVisible();
}

const focused = (page: Page) => page.evaluate(() => document.activeElement?.id || "");

test.describe("where the picker sits (3.13)", () => {
  test("under the heading, before the status: the loaded branch selected, the default first and marked, the others by character codes", async ({
    page,
    context,
  }) => {
    await stubGithub(context, {
      branches: { widgets: ["dev", "a-lower", "main", "B-upper", "feat/x"] },
    });
    await page.goto("/");
    await openWidgets(page);
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    const order = await page.evaluate(() => {
      const ids = [...(document.getElementById("results")?.children ?? [])].map((e) => e.id);
      return ids.slice(0, 3);
    });
    expect(order).toEqual(["project-name", "branch-picker", "status"]);
    expect(await optionTexts(page)).toEqual([
      "main (default)",
      "B-upper",
      "a-lower",
      "dev",
      "feat/x",
    ]);
    await expect(select(page)).toHaveValue("main");
    await expect(page.locator("#branch-message")).toHaveText("");
  });

  test("one branches request after a load whose first page holds fewer than 100, to api.github.com", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openWidgets(page);
    await settle(page);
    expect(branchRequests(stub)).toEqual([branchesUrl("widgets", 1)]);
    expect(
      urls(stub).filter(
        (u) => u.startsWith("https://raw.githubusercontent.com/") && u.includes("branches"),
      ),
    ).toEqual([]);
  });

  test("an address with /tree/<branch>: no request 1, the select shows that branch, and no option is marked default", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openWidgets(page, `${WIDGETS}/tree/dev`);
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (dev)");
    expect(urls(stub)).not.toContain(`${API}/widgets`);
    await expect(select(page)).toHaveValue("dev");
    expect((await optionTexts(page)).join(" ")).not.toContain("(default)");
  });
});

test.describe("picking a branch (3.13)", () => {
  test("Open branch on another name loads it: request 2 and the files of that branch, no request 1, no new branches request", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openWidgets(page);
    await settle(page);
    const fieldBefore = await page.locator("#url-input").inputValue();
    const mark = stub.seen.length;
    await pick(page, "feat/x");
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (feat/x)");
    await expect(select(page)).toHaveValue("feat/x");
    await settle(page);
    const after = urls(stub).slice(mark);
    expect(after).toEqual([
      `${API}/widgets/git/trees/feat%2Fx?recursive=1`,
      "https://raw.githubusercontent.com/acme/widgets/feat/x/docs/BACKLOG.md",
      "https://raw.githubusercontent.com/acme/widgets/feat/x/STATUS.md",
    ]);
    // The list the page holds stays; the default stays marked.
    expect(await optionTexts(page)).toEqual(["main (default)", "dev", "feat/x"]);
    // The address field is left as it was.
    await expect(page.locator("#url-input")).toHaveValue(fieldBefore);
    expect(page.url()).not.toContain("feat");
  });

  test("choosing an option starts no request until Open branch is used, also with the arrow keys", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openWidgets(page);
    await settle(page);
    const mark = stub.seen.length;
    await select(page).focus();
    for (const key of ["ArrowDown", "ArrowDown", "ArrowUp"]) await page.keyboard.press(key);
    await select(page).selectOption("dev");
    await settle(page);
    expect(urls(stub).slice(mark)).toEqual([]);
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
  });

  test("Open branch with the loaded branch selected makes no request", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await openWidgets(page);
    await settle(page);
    const mark = stub.seen.length;
    await openBranch(page).click();
    await settle(page);
    expect(urls(stub).slice(mark)).toEqual([]);
  });

  test("newest wins: of two picks in a row, the first answered last, the second is shown", async ({
    page,
    context,
  }) => {
    const devTree = `${API}/widgets/git/trees/dev?recursive=1`;
    const stub = await stubGithub(context, { hold: (u) => u === devTree });
    await page.goto("/");
    await openWidgets(page);
    await pick(page, "dev");
    await expect.poll(() => urls(stub).includes(devTree)).toBe(true);
    // The select and Open branch stay usable while a pick runs.
    await expect(openBranch(page)).toBeEnabled();
    await pick(page, "feat/x");
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (feat/x)");
    stub.release(devTree);
    await settle(page);
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (feat/x)");
    await expect(select(page)).toHaveValue("feat/x");
  });

  test("while the list is due: only the current branch, Open branch disabled, aria-busy and the reading message; an address load then drops its answer", async ({
    page,
    context,
  }) => {
    const due = branchesUrl("widgets", 1);
    const stub = await stubGithub(context, { hold: (u) => u === due });
    await page.goto("/");
    await open(page, WIDGETS);
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await expect(page.locator("#branch-picker")).toHaveAttribute("aria-busy", "true");
    await expect(openBranch(page)).toBeDisabled();
    expect(await optionTexts(page)).toEqual(["main"]);
    await expect(page.locator("#branch-message")).toHaveText("Reading the branches…");
    await open(page, PLAIN);
    await expect(page.locator("#project-name")).toHaveText("acme/plain (main)");
    await expect(openBranch(page)).toBeEnabled();
    expect(await optionTexts(page)).toEqual(["main (default)", "plain-only"]);
    stub.release(due);
    await settle(page);
    expect(await optionTexts(page)).toEqual(["main (default)", "plain-only"]);
  });
});

test.describe("the cap and names (3.13)", () => {
  const many = Array.from({ length: 300 }, (_, i) => `b${String(i).padStart(3, "0")}`);

  test("three pages of 100 give 300 options and the message with the project's owner and repo; no fourth request", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { branches: { widgets: ["main", ...many] } });
    await page.goto("/");
    await openWidgets(page);
    await settle(page);
    expect(branchRequests(stub)).toEqual([1, 2, 3].map((n) => branchesUrl("widgets", n)));
    expect(await select(page).locator("option").count()).toBe(300);
    await expect(page.locator("#branch-message")).toHaveText(
      "vizi lists the first 300 branches GitHub gives. To open another branch, paste its address, https://github.com/acme/widgets/tree/<branch>, with the branch's name in place of <branch>.",
    );
  });

  test("the current branch past the cap is added first, selected", async ({ page, context }) => {
    await stubGithub(context, { branches: { widgets: [...many, "zzz-later"] } });
    await page.goto("/");
    await openWidgets(page, `${WIDGETS}/tree/zzz-later`);
    await expect(select(page).locator("option").first()).toHaveText("zzz-later");
    await expect(select(page)).toHaveValue("zzz-later");
    expect(await select(page).locator("option").count()).toBe(301);
  });

  test("a name holding # is shown disabled; a name like markup is shown as text and nothing runs", async ({
    page,
    context,
  }) => {
    const markup = "<img src=x onerror=alert(1)>";
    await stubGithub(context, { branches: { widgets: ["main", "a#b", markup] } });
    const dialogs: string[] = [];
    page.on("dialog", (d) => {
      dialogs.push(d.message());
      void d.dismiss();
    });
    await page.goto("/");
    await openWidgets(page);
    const hash = select(page).locator("option", { hasText: "a#b" });
    await expect(hash).toHaveText("a#b (cannot be opened in vizi)");
    await expect(hash).toBeDisabled();
    await expect(select(page).locator("option", { hasText: "<img" })).toHaveText(markup);
    await expect(page.locator("#branch-picker img")).toHaveCount(0);
    await settle(page);
    expect(dialogs).toEqual([]);
  });
});

test.describe("tokens and failures (3.13, 3.8)", () => {
  test("with a token for the owner, the branches requests go to api.github.com with the header", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await useToken(page);
    await openWidgets(page);
    await settle(page);
    const list = stub.seen.filter((s) => s.url.includes("/branches?"));
    expect(list).toHaveLength(1);
    for (const s of list) {
      expect(new URL(s.url).host).toBe("api.github.com");
      expect(s.authorization).toBe(`Bearer ${TOKEN}`);
    }
  });

  test("a 401 on the list forgets the token, hides the results, and says so in #message", async ({
    page,
    context,
  }) => {
    await stubGithub(context, {
      status: (u) => (u.includes("/branches?") ? { status: 401 } : undefined),
    });
    await page.goto("/");
    await useToken(page);
    await open(page, WIDGETS);
    await expect(page.locator("#message")).toHaveText(
      "GitHub refused the token for acme: it may have expired. It has been forgotten; enter a new one.",
    );
    await expect(page.locator("#results")).toBeHidden();
    await expect(page.locator('[data-testid="token-line"][data-owner="acme"]')).toHaveCount(0);
  });

  test("a 403 at the rate limit shows the message and keeps the project", async ({
    page,
    context,
  }) => {
    await stubGithub(context, {
      status: (u) =>
        u.includes("/branches?")
          ? {
              status: 403,
              headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1793836800" },
            }
          : undefined,
    });
    await page.goto("/");
    await useToken(page);
    await openWidgets(page);
    await expect(page.locator("#branch-message")).toHaveText(
      "The branch list could not be read: GitHub's rate limit is reached. It resets at 2026-11-05 00:00:00 UTC.",
    );
    await expect(page.locator("#results")).toBeVisible();
    expect(await optionTexts(page)).toEqual(["main (default)"]);
  });

  test("a failure on page 2 keeps page 1's names with the incomplete message", async ({
    page,
    context,
  }) => {
    const hundred = Array.from({ length: 100 }, (_, i) => `p${String(i).padStart(2, "0")}`);
    await stubGithub(context, {
      branches: { widgets: ["main", ...hundred] },
      status: (u) => (u === branchesUrl("widgets", 2) ? { status: 500 } : undefined),
    });
    await page.goto("/");
    await openWidgets(page);
    await expect(page.locator("#branch-message")).toHaveText(
      `The branch list is incomplete: GitHub answered HTTP 500 for ${branchesUrl("widgets", 2)}.`,
    );
    expect(await select(page).locator("option").count()).toBe(100);
  });

  test("Forget of the owner's token hides the picker with the results", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await useToken(page);
    await openWidgets(page);
    await expect(page.locator("#branch-picker")).toBeVisible();
    await page
      .locator('[data-testid="token-line"][data-owner="acme"] [data-testid="token-forget"]')
      .click();
    await expect(page.locator("#results")).toBeHidden();
    await expect(page.locator("#branch-picker")).toBeHidden();
  });
});

test.describe("accessibility (3.13)", () => {
  test("the label and the group's name, and aria-busy while the list loads", async ({
    page,
    context,
  }) => {
    const due = branchesUrl("widgets", 1);
    const stub = await stubGithub(context, { hold: (u) => u === due });
    await page.goto("/");
    await open(page, WIDGETS);
    await expect(page.getByRole("group", { name: "Branch", exact: true })).toBeVisible();
    await expect(page.getByLabel("Branch", { exact: true })).toHaveId("branch-select");
    await expect(page.getByRole("button", { name: "Open branch", exact: true })).toBeVisible();
    await expect(page.locator("#branch-message")).toHaveAttribute("role", "status");
    await expect(page.locator("#branch-picker")).toHaveAttribute("aria-busy", "true");
    stub.release(due);
    await expect(page.locator("#branch-picker")).not.toHaveAttribute("aria-busy", "true");
  });

  test("the focus stays on Open branch after a pick", async ({ page, context }) => {
    await stubGithub(context);
    await page.goto("/");
    await openWidgets(page);
    await select(page).selectOption("dev");
    await openBranch(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (dev)");
    expect(await focused(page)).toBe("branch-open");
  });

  test("a pick that fails while the focus is on Open branch moves it to #message", async ({
    page,
    context,
  }) => {
    await stubGithub(context, {
      status: (u) => (u.includes("/git/trees/dev?") ? { status: 500 } : undefined),
    });
    await page.goto("/");
    await openWidgets(page);
    await select(page).selectOption("dev");
    await openBranch(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#results")).toBeHidden();
    await expect(page.locator("#message")).toContainText("HTTP 500");
    expect(await focused(page)).toBe("message");
    await expect(page.locator("#message")).toHaveAttribute("tabindex", "-1");
  });

  test("a pick that fails while the focus is elsewhere leaves the focus where it was", async ({
    page,
    context,
  }) => {
    const devTree = `${API}/widgets/git/trees/dev?recursive=1`;
    const stub = await stubGithub(context, {
      hold: (u) => u === devTree,
      status: (u) => (u === devTree ? { status: 500 } : undefined),
    });
    await page.goto("/");
    await openWidgets(page);
    await pick(page, "dev");
    await expect.poll(() => urls(stub).includes(devTree)).toBe(true);
    await page.locator("#url-input").focus();
    stub.release(devTree);
    await expect(page.locator("#results")).toBeHidden();
    expect(await focused(page)).toBe("url-input");
  });

  test("a pick that fails while the help view is open leaves the focus on the view's h2", async ({
    page,
    context,
  }) => {
    const devTree = `${API}/widgets/git/trees/dev?recursive=1`;
    const stub = await stubGithub(context, {
      hold: (u) => u === devTree,
      status: (u) => (u === devTree ? { status: 500 } : undefined),
    });
    await page.goto("/");
    await openWidgets(page);
    await select(page).selectOption("dev");
    await openBranch(page).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => urls(stub).includes(devTree)).toBe(true);
    await page.locator("#help-open").click();
    expect(await focused(page)).toBe("help-title");
    stub.release(devTree);
    await expect(page.locator("#results")).toBeHidden();
    await settle(page);
    expect(await focused(page)).toBe("help-title");
  });
});

test.describe("layout (3.13)", () => {
  test("no sideways scroll with a 200-character branch name; the select and the button 44 px high on a phone, 40 px on desktop", async ({
    page,
    context,
  }) => {
    const long = `long-${"x".repeat(195)}`;
    await stubGithub(context, { branches: { widgets: ["main", long] } });
    await page.goto("/");
    await openWidgets(page, `${WIDGETS}/tree/${long}`);
    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(sideways).toBeLessThanOrEqual(0);
    const phone = (page.viewportSize()?.width ?? 1280) < 800;
    for (const el of [select(page), openBranch(page)]) {
      const box = await el.boundingBox();
      if (!box) throw new Error("no box");
      if (phone) expect(box.height).toBeGreaterThanOrEqual(44);
      else expect(Math.round(box.height)).toBe(40);
    }
    const s = await select(page).boundingBox();
    const b = await openBranch(page).boundingBox();
    if (!s || !b) throw new Error("no box");
    if (phone) expect(b.y).toBeGreaterThanOrEqual(s.y + s.height);
    else {
      expect(s.width).toBeLessThanOrEqual(420);
      expect(Math.abs(b.y - s.y)).toBeLessThanOrEqual(1);
    }
  });
});
