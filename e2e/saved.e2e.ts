/**
 * Browser tests for the Saved repos list (docs/SPEC.md 3.14, PBI-1.12).
 * GitHub is stubbed for acme/widgets, acme/plain (public) and acme/secret
 * (private: 404 without a token), every branch answering with the same
 * synthetic files. Projects are opened with a full address, which
 * PBI-1.17's field accepts too. Every token is an obviously fake value.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { type BrowserContext, test as base, expect, type Page, type Route } from "@playwright/test";
import { isAllowedRequest } from "./guard";
import { openPanel } from "./panel";
import { branchListRead } from "./picker";

/** Every test: no stray request, no console error and no uncaught error. */
const test = base.extend<{ guard: undefined }>({
  guard: [
    async ({ page, baseURL }, use) => {
      const stray: string[] = [];
      const problems: string[] = [];
      const own = [`${baseURL}/`, pathToFileURL(join(__dirname, "..", "dist", "index.html")).href];
      page.on("request", (r) => {
        if (!isAllowedRequest(r.url(), own)) stray.push(r.url());
      });
      page.on("console", (m) => {
        // A 404 or 401 answered by the stub is logged by Chromium as a failed resource load.
        if (m.type() === "error" && !m.text().startsWith("Failed to load resource"))
          problems.push(m.text());
      });
      page.on("pageerror", (e) => problems.push(e.message));
      await use(undefined);
      expect(stray, "requests the page should not make").toEqual([]);
      expect(problems, "console errors").toEqual([]);
    },
    { auto: true },
  ],
});

const fixture = join(__dirname, "fixtures", "project");
const read = (p: string) => readFileSync(join(fixture, p), "utf8");
const KEY = "vizi.savedRepos";
const TOKEN = "github_pat_TEST_saved_abcd1234";
const API = "https://api.github.com/repos/acme";
const WIDGETS = "https://github.com/acme/widgets";
const PLAIN = "https://github.com/acme/plain";
const SECRET = "https://github.com/acme/secret";

type Seen = { url: string; authorization: string | undefined };
interface StubOptions {
  /** Keeps the answer to a URL waiting until `release(url)`. */
  hold?: (url: string) => boolean;
  /** Overrides an answer's status. */
  status?: (url: string, authorization: string | undefined) => number | undefined;
}
interface Stub {
  seen: Seen[];
  release: (url?: string) => void;
}

/** Answers GitHub for acme's three repos on the whole context, on any branch. */
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
  };
  await context.route(
    /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//,
    async (route: Route) => {
      const request = route.request();
      const url = request.url();
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      const authorization = (await request.allHeaders()).authorization;
      seen.push({ url, authorization });
      if (options.hold?.(url)) {
        if (!waiting.has(url)) waiting.set(url, new Promise<void>((r) => gates.set(url, r)));
        await waiting.get(url);
      }
      const forced = options.status?.(url, authorization);
      if (forced) return route.fulfill({ status: forced, headers: cors, body: "" });
      // acme/secret is private: without a token GitHub answers 404.
      if (url.toLowerCase().includes("/acme/secret") && authorization === undefined)
        return route.fulfill({ status: 404, headers: cors, body: "" });
      // Request 1 of any repo; GitHub reads owner and repo without regard to case.
      if (/^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+$/.test(url))
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ default_branch: "main" }),
        });
      if (url.includes("/branches?per_page=100&page=")) {
        const items = ["main", "dev", "feat/x"].map((name) => ({ name }));
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
const settle = (page: Page) => page.evaluate(() => new Promise<void>((r) => setTimeout(r, 250)));

const section = (page: Page) => page.locator("#saved-repos");
const entries = (page: Page) => page.getByTestId("saved-entry");
const openOf = (page: Page, i: number) => entries(page).nth(i).getByTestId("saved-open");
const removeOf = (page: Page, i: number) => entries(page).nth(i).getByTestId("saved-remove");
const saveButton = (page: Page) => page.locator("#save-repo");
const heading = (page: Page) => page.locator("#project-name");

type Entry = { owner: string; repo: string; branch: string | null };
const e = (repo: string, branch: string | null = null, owner = "acme"): Entry => ({
  owner,
  repo,
  branch,
});

/** The stored value, parsed, or null. */
const storedValue = (page: Page) =>
  page.evaluate((k) => {
    const raw = localStorage.getItem(k);
    return raw === null ? null : JSON.parse(raw);
  }, KEY);
const storedRaw = (page: Page) => page.evaluate((k) => localStorage.getItem(k), KEY);

/** Plants a stored value and reloads, so the page starts with it. */
async function plant(page: Page, value: unknown) {
  await page.goto("/");
  await page.evaluate(
    ([k, v]) => localStorage.setItem(k as string, v as string),
    [KEY, typeof value === "string" ? value : JSON.stringify(value)],
  );
  await page.reload();
}

async function open(page: Page, address: string, name: string) {
  await page.locator("#url-input").fill(address);
  await page.locator("#url-input").press("Enter");
  await expect(heading(page)).toHaveText(name);
  await branchListRead(page);
}

async function useToken(page: Page, owner = "acme") {
  await openPanel(page);
  await page.locator("#owner-input").fill(owner);
  await page.locator("#token-input").fill(TOKEN);
  await page.locator("#token-use").click();
  await expect(page.locator(`[data-testid="token-line"][data-owner="${owner}"]`)).toBeVisible();
}

/** The focused element: its id, or its test id and its entry's key. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return "body";
    if (el.id) return el.id;
    const key = el.closest<HTMLElement>("[data-testid=saved-entry]")?.dataset.key;
    return `${el.dataset.testid ?? el.tagName}${key ? `@${key}` : ""}`;
  });

test.describe("where the list sits (3.14)", () => {
  test("with nothing stored there is no section, and nothing is written", async ({ page }) => {
    await page.goto("/");
    await expect(section(page)).toBeHidden();
    await expect(entries(page)).toHaveCount(0);
    expect(await storedRaw(page)).toBeNull();
  });

  test("with entries: between the address section and the Private repos panel, labelled Saved repos, a list", async ({
    page,
  }) => {
    await plant(page, { repos: [e("widgets"), e("plain", "dev")] });
    await expect(section(page)).toBeVisible();
    const order = await page.evaluate(() =>
      [...(document.querySelector(".start-col")?.children ?? [])].map((c) => c.id),
    );
    expect(order).toEqual(["open-project", "message", "saved-repos", "private-repos"]);
    await expect(page.getByRole("region", { name: "Saved repos" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Saved repos" })).toBeVisible();
    await expect(section(page).getByRole("list").getByRole("listitem")).toHaveCount(2);
    await expect(openOf(page, 0)).toHaveText("acme/widgets");
    await expect(openOf(page, 1)).toHaveText("acme/plain (dev)");
    await expect(
      page.getByRole("button", { name: "Remove acme/widgets from Saved repos" }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Remove acme/plain (dev) from Saved repos" }),
    ).toHaveCount(1);
    // The "×" itself is hidden from assistive technology; the name says what it does.
    await expect(removeOf(page, 0).locator("[aria-hidden=true]")).toHaveText("×");
  });
});

test.describe("Save (3.14)", () => {
  test("Save after a load: the entry appears first, Saved with aria-disabled and the focus kept; a reload shows it; the stored JSON", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await plant(page, { repos: [e("plain")] });
    await open(page, WIDGETS, "acme/widgets (main)");
    await expect(saveButton(page)).toHaveText("Save");
    await expect(saveButton(page)).not.toHaveAttribute("aria-disabled", "true");
    await saveButton(page).focus();
    await page.keyboard.press("Enter");
    await expect(saveButton(page)).toHaveText("Saved");
    await expect(saveButton(page)).toHaveAttribute("aria-disabled", "true");
    expect(await focused(page)).toBe("save-repo");
    await expect(openOf(page, 0)).toHaveText("acme/widgets");
    expect(await storedValue(page)).toEqual({
      repos: [
        { owner: "acme", repo: "widgets", branch: null },
        { owner: "acme", repo: "plain", branch: null },
      ],
    });
    await page.reload();
    await expect(openOf(page, 0)).toHaveText("acme/widgets");
    // Using "Saved" does nothing: with the stored value emptied behind the page's back (a tab
    // gets no storage event of its own writes), neither Enter nor a click saves again.
    // Playwright does not click an aria-disabled button, so the click is dispatched.
    await open(page, WIDGETS, "acme/widgets (main)");
    await expect(saveButton(page)).toHaveText("Saved");
    await page.evaluate((k) => localStorage.removeItem(k), KEY);
    await saveButton(page).focus();
    await page.keyboard.press("Enter");
    await saveButton(page).dispatchEvent("click");
    await settle(page);
    expect(await storedRaw(page)).toBeNull();
  });

  test("Save sits in the results with the project: right of the heading on desktop, under it across the width on a phone, before the branch picker", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await open(page, WIDGETS, "acme/widgets (main)");
    const ids = await page.evaluate(() =>
      [...(document.getElementById("results")?.children ?? [])].slice(0, 3).map((c) => c.id),
    );
    expect(ids).toEqual(["project-name", "save-repo", "branch-picker"]);
    const h = await heading(page).boundingBox();
    const b = await saveButton(page).boundingBox();
    const results = await page.locator("#results").boundingBox();
    if (!h || !b || !results) throw new Error("no box");
    if ((page.viewportSize()?.width ?? 1280) < 800) {
      expect(b.y).toBeGreaterThanOrEqual(h.y + h.height - 1);
      expect(Math.abs(b.width - results.width)).toBeLessThanOrEqual(1);
      expect(Math.round(b.height)).toBe(44);
    } else {
      expect(b.x).toBeGreaterThanOrEqual(h.x + h.width);
      expect(b.y).toBeLessThan(h.y + h.height);
      expect(Math.round(b.height)).toBe(40);
    }
    // The same gap above the branch picker at both widths: 12 px under the lower of the heading and "Save".
    const picker = await page.locator("#branch-picker").boundingBox();
    if (!picker) throw new Error("no box");
    expect(Math.round(picker.y - Math.max(h.y + h.height, b.y + b.height))).toBe(12);
  });

  test("a load of the default branch saves null; a /tree/<branch> address and a pick save the branch; the same repo with two branches is two entries", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await open(page, WIDGETS, "acme/widgets (main)");
    await saveButton(page).click();
    await open(page, `${WIDGETS}/tree/dev`, "acme/widgets (dev)");
    await expect(saveButton(page)).toHaveText("Save");
    await saveButton(page).click();
    // A pick of another branch, and a pick of the default branch, which is saved by its name.
    await page.locator("#branch-select").selectOption("feat/x");
    await page.locator("#branch-open").click();
    await expect(heading(page)).toHaveText("acme/widgets (feat/x)");
    await saveButton(page).click();
    await page.locator("#branch-select").selectOption("main");
    await page.locator("#branch-open").click();
    await expect(heading(page)).toHaveText("acme/widgets (main)");
    await expect(saveButton(page)).toHaveText("Save");
    await saveButton(page).click();
    expect(await storedValue(page)).toEqual({
      repos: [e("widgets", "main"), e("widgets", "feat/x"), e("widgets", "dev"), e("widgets")],
    });
    await expect(entries(page)).toHaveCount(4);
  });

  test("Save after a guided open: null for the default branch, the name for another branch (3.1, Guided opening)", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    const field = page.locator("#url-input");
    const guide = page.locator("#guide-select");
    await field.fill("acme/widgets");
    await field.press("Tab");
    await expect(guide).toHaveValue("main");
    await page.locator("#open-url").press("Enter");
    await expect(heading(page)).toHaveText("acme/widgets (main)");
    await saveButton(page).click();
    await field.fill("acme/plain");
    await field.press("Tab");
    await expect(guide).toHaveValue("main");
    await guide.selectOption("dev");
    await page.locator("#open-url").click();
    await expect(heading(page)).toHaveText("acme/plain (dev)");
    await saveButton(page).click();
    expect(await storedValue(page)).toEqual({ repos: [e("plain", "dev"), e("widgets")] });
  });

  test("the owner is saved in lower case; an entry differing in case only is the same, and Save reads Saved", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await plant(page, { repos: [e("Widgets")] });
    await open(page, "https://github.com/ACME/widgets", "ACME/widgets (main)");
    await expect(saveButton(page)).toHaveText("Saved");
    await open(page, PLAIN, "acme/plain (main)");
    await saveButton(page).click();
    await open(page, "https://github.com/Acme/Other", "Acme/Other (main)");
    await saveButton(page).click();
    expect((await storedValue(page)).repos[0]).toEqual({
      owner: "acme",
      repo: "Other",
      branch: null,
    });
  });

  test("the cap: with 50 entries Save is refused with its message, and nothing is written", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    const fifty = Array.from({ length: 50 }, (_, i) => e(`r${i}`));
    await plant(page, { repos: fifty });
    await expect(entries(page)).toHaveCount(50);
    await open(page, WIDGETS, "acme/widgets (main)");
    const raw = await storedRaw(page);
    await saveButton(page).click();
    await expect(page.locator("#message")).toHaveText(
      "Saved repos holds at most 50 repos. Remove one to save another.",
    );
    await expect(saveButton(page)).toHaveText("Save");
    expect(await storedRaw(page)).toBe(raw);
  });

  test("storage refused: Save shows its message, and the section stays hidden", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.addInitScript((k) => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === k) throw new DOMException("refused", "QuotaExceededError");
        return set.call(this, key, value);
      };
    }, KEY);
    await page.goto("/");
    await open(page, WIDGETS, "acme/widgets (main)");
    await saveButton(page).click();
    await expect(page.locator("#message")).toHaveText("The browser would not save the repo.");
    await expect(section(page)).toBeHidden();
    await expect(saveButton(page)).toHaveText("Save");
  });
});

test.describe("opening an entry (3.14)", () => {
  test("loads its reference: no request 1 for an entry with a branch, the heading, Saved, the branch picker; the field and the address unchanged", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await plant(page, { repos: [e("widgets", "dev"), e("plain")] });
    await page.locator("#url-input").fill("something typed");
    const url = page.url();
    await openOf(page, 0).click();
    await expect(heading(page)).toHaveText("acme/widgets (dev)");
    await expect(saveButton(page)).toHaveText("Saved");
    await branchListRead(page);
    expect(urls(stub)).toEqual([
      `${API}/widgets/git/trees/dev?recursive=1`,
      "https://raw.githubusercontent.com/acme/widgets/dev/docs/BACKLOG.md",
      "https://raw.githubusercontent.com/acme/widgets/dev/STATUS.md",
      `${API}/widgets/branches?per_page=100&page=1`,
    ]);
    // The focus stays on the open button.
    expect(await focused(page)).toBe("saved-open@acme/widgets@dev");
    const mark = stub.seen.length;
    await openOf(page, 1).click();
    await expect(heading(page)).toHaveText("acme/plain (main)");
    await branchListRead(page);
    expect(urls(stub).slice(mark)[0]).toBe(`${API}/plain`);
    await expect(page.locator("#url-input")).toHaveValue("something typed");
    expect(page.url()).toBe(url);
  });

  test("with a token held for the owner, every request goes to api.github.com with it; without one, a private repo gets 3.1's 404 message and stays listed", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await plant(page, { repos: [e("secret")] });
    await openOf(page, 0).click();
    await expect(page.locator("#message")).toHaveText(
      "Not found or not public. If the repo is private, add a token for its owner.",
    );
    await expect(page.locator("#results")).toBeHidden();
    await expect(entries(page)).toHaveCount(1);
    await useToken(page);
    const mark = stub.seen.length;
    await openOf(page, 0).click();
    await expect(heading(page)).toHaveText("acme/secret (main)");
    await branchListRead(page);
    const after = stub.seen.slice(mark);
    expect(after.length).toBeGreaterThan(0);
    for (const s of after) {
      expect(new URL(s.url).host).toBe("api.github.com");
      expect(s.authorization).toBe(`Bearer ${TOKEN}`);
    }
  });

  test("newest wins: two entries used in quick succession, the first answered last, show the second", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (u) => u === `${API}/widgets` });
    await plant(page, { repos: [e("widgets"), e("plain")] });
    await openOf(page, 0).click();
    await expect.poll(() => urls(stub)).toContain(`${API}/widgets`);
    await openOf(page, 1).click();
    await expect(heading(page)).toHaveText("acme/plain (main)");
    stub.release();
    await settle(page);
    await expect(heading(page)).toHaveText("acme/plain (main)");
  });

  test("an entry used while a load from the address is due drops the older answer", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context, { hold: (u) => u === `${API}/widgets` });
    await plant(page, { repos: [e("plain")] });
    await page.locator("#url-input").fill(WIDGETS);
    await page.locator("#url-input").press("Enter");
    await expect.poll(() => urls(stub)).toContain(`${API}/widgets`);
    await openOf(page, 0).click();
    await expect(heading(page)).toHaveText("acme/plain (main)");
    stub.release();
    await settle(page);
    await expect(heading(page)).toHaveText("acme/plain (main)");
  });

  test("opening an entry hides the opening guide's select and message (3.1)", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await plant(page, { repos: [e("plain")] });
    await page.locator("#url-input").fill("acme/widgets");
    await page.locator("#url-input").press("Tab");
    await expect(page.locator("#guide-select")).toBeVisible();
    await openOf(page, 0).click();
    await expect(heading(page)).toHaveText("acme/plain (main)");
    await expect(page.locator("#guide-select")).toBeHidden();
    await expect(page.locator("#guide-message")).toHaveText("");
  });

  test("opening an entry stops a running opening-guide branch read: no branch request after its request 1, and no select (3.1)", async ({
    page,
    context,
  }) => {
    const guideRepo = `${API}/widgets`;
    const guideBranches = `${API}/widgets/branches?per_page=100&page=1`;
    const stub = await stubGithub(context, { hold: (u) => u === guideRepo });
    await plant(page, { repos: [e("plain")] });
    await page.locator("#url-input").fill("acme/widgets");
    await page.locator("#url-input").press("Tab");
    // The guide's request 1 is made and held back.
    await expect.poll(() => urls(stub)).toContain(guideRepo);
    await expect(page.locator("#guide-message")).toHaveText("Reading the branches…");
    await openOf(page, 0).click();
    await expect(heading(page)).toHaveText("acme/plain (main)");
    await branchListRead(page);
    stub.release(guideRepo);
    await settle(page);
    await settle(page);
    expect(urls(stub)).not.toContain(guideBranches);
    await expect(page.locator("#guide-select")).toBeHidden();
    await expect(page.locator("#guide-message")).toHaveText("");
    await expect(heading(page)).toHaveText("acme/plain (main)");
  });

  test("drawing the list makes no request: with entries stored, the page requests only its own document", async ({
    page,
    context,
  }) => {
    const stub = await stubGithub(context);
    await page.goto("/");
    await page.evaluate(
      ([k, v]) => localStorage.setItem(k as string, v as string),
      [KEY, JSON.stringify({ repos: [e("widgets"), e("secret", "dev")] })],
    );
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await page.reload();
    await expect(entries(page)).toHaveCount(2);
    await settle(page);
    expect(requests).toEqual([page.url()]);
    expect(stub.seen).toEqual([]);
  });
});

test.describe("removing an entry (3.14)", () => {
  test("× with the focus elsewhere (a click that does not focus the button, as WebKit's): the focus still moves to the next entry, the one before, then the heading", async ({
    page,
  }) => {
    await plant(page, { repos: [e("a"), e("b"), e("c")] });
    const field = page.locator("#url-input");
    await field.focus();
    await removeOf(page, 1).dispatchEvent("click");
    await expect(entries(page)).toHaveCount(2);
    expect(await focused(page)).toBe("saved-open@acme/c!");
    await field.focus();
    await removeOf(page, 1).dispatchEvent("click");
    await expect(entries(page)).toHaveCount(1);
    expect(await focused(page)).toBe("saved-open@acme/a!");
    await field.focus();
    await removeOf(page, 0).dispatchEvent("click");
    await expect(section(page)).toBeHidden();
    expect(await focused(page)).toBe("open-project-title");
  });

  test("× refused by storage: the entry stays listed, no message, and the focus is on that entry's ×, also when the click did not focus it", async ({
    page,
  }) => {
    await plant(page, { repos: [e("a"), e("b")] });
    await page.addInitScript((k) => {
      const set = Storage.prototype.setItem;
      const remove = Storage.prototype.removeItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === k) throw new DOMException("refused", "QuotaExceededError");
        return set.call(this, key, value);
      };
      Storage.prototype.removeItem = function (key: string) {
        if (key === k) throw new DOMException("refused", "SecurityError");
        return remove.call(this, key);
      };
    }, KEY);
    await page.reload();
    await expect(entries(page)).toHaveCount(2);
    const raw = await storedRaw(page);
    await removeOf(page, 0).click();
    await settle(page);
    await expect(entries(page)).toHaveCount(2);
    await expect(page.locator("#message")).toHaveText("");
    expect(await focused(page)).toBe("saved-remove@acme/a!");
    await page.locator("#url-input").focus();
    await removeOf(page, 1).dispatchEvent("click");
    await settle(page);
    await expect(entries(page)).toHaveCount(2);
    await expect(page.locator("#message")).toHaveText("");
    expect(await focused(page)).toBe("saved-remove@acme/b!");
    expect(await storedRaw(page)).toBe(raw);
  });

  test("× removes the entry and leaves the results; Save reads Save again; the focus moves to the next entry, the one before, then the heading", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await plant(page, { repos: [e("widgets"), e("plain"), e("other")] });
    await openOf(page, 0).click();
    await expect(saveButton(page)).toHaveText("Saved");
    await branchListRead(page);
    await removeOf(page, 0).click();
    await expect(entries(page)).toHaveCount(2);
    await expect(heading(page)).toHaveText("acme/widgets (main)");
    await expect(saveButton(page)).toHaveText("Save");
    expect(await focused(page)).toBe("saved-open@acme/plain!");
    // The last entry: the focus goes to the one before it.
    await removeOf(page, 1).click();
    await expect(entries(page)).toHaveCount(1);
    expect(await focused(page)).toBe("saved-open@acme/plain!");
    await removeOf(page, 0).click();
    await expect(section(page)).toBeHidden();
    expect(await focused(page)).toBe("open-project-title");
    expect(await storedRaw(page)).toBeNull();
    await expect(page.locator("#results")).toBeVisible();
  });

  test("a Forget, Forget all tokens and a 401 that forgets the token leave the list as it was; no stored entry holds a token", async ({
    page,
    context,
  }) => {
    let refuse = false;
    await stubGithub(context, {
      status: (u, auth) =>
        refuse && auth !== undefined && u === `${API}/secret` ? 401 : undefined,
    });
    await page.goto("/");
    await useToken(page);
    await open(page, SECRET, "acme/secret (main)");
    await saveButton(page).click();
    const raw = await storedRaw(page);
    expect(raw).not.toBeNull();
    expect(raw).not.toContain("github_pat_");
    await page.getByTestId("token-forget").click();
    expect(await storedRaw(page)).toBe(raw);
    await useToken(page);
    await page.locator("#token-forget-all").click();
    expect(await storedRaw(page)).toBe(raw);
    await useToken(page);
    refuse = true;
    await openOf(page, 0).click();
    await expect(page.locator("#message")).toContainText("GitHub refused the token for acme");
    await expect(page.getByTestId("token-line")).toHaveCount(0);
    expect(await storedRaw(page)).toBe(raw);
    await expect(entries(page)).toHaveCount(1);
  });
});

test.describe("what the page reads from storage (3.14)", () => {
  test("startup: a malformed value is removed; a value with bad entries is cleaned and written back, a repo holding markup dropped", async ({
    page,
  }) => {
    await plant(page, "not json");
    await expect(section(page)).toBeHidden();
    expect(await storedRaw(page)).toBeNull();
    await plant(page, {
      repos: [
        { owner: "acme", repo: "<img src=x onerror=alert(1)>", branch: null },
        { owner: "acme", repo: "widgets", branch: null, token: "x" },
      ],
    });
    await expect(entries(page)).toHaveCount(1);
    expect(await storedValue(page)).toEqual({ repos: [e("widgets")] });
  });

  test("a planted branch holding markup is shown as text: no img element, nothing runs", async ({
    page,
  }) => {
    const markup = "<img/src=x/onerror=window.__pwned=1>";
    await plant(page, { repos: [e("widgets", markup)] });
    await expect(openOf(page, 0)).toHaveText(`acme/widgets (${markup})`);
    await expect(removeOf(page, 0)).toHaveAccessibleName(
      `Remove acme/widgets (${markup}) from Saved repos`,
    );
    await settle(page);
    expect(await page.locator("img").count()).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBe(
      undefined,
    );
  });
});

test.describe("other open vizi tabs (3.14)", () => {
  test("an entry saved, removed, and storage cleared in one tab are shown in the other, which writes nothing on the event", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.addInitScript((k) => {
      const writes: string[] = [];
      (window as unknown as { __writes: string[] }).__writes = writes;
      const set = Storage.prototype.setItem;
      const remove = Storage.prototype.removeItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === k) writes.push(`set ${value}`);
        return set.call(this, key, value);
      };
      Storage.prototype.removeItem = function (key: string) {
        if (key === k) writes.push("remove");
        return remove.call(this, key);
      };
    }, KEY);
    await page.goto("/");
    await open(page, WIDGETS, "acme/widgets (main)");
    await expect(saveButton(page)).toHaveText("Save");

    const other = await context.newPage();
    await other.goto("/");
    await open(other, WIDGETS, "acme/widgets (main)");
    await saveButton(other).click();
    await expect(openOf(page, 0)).toHaveText("acme/widgets");
    // Save follows the event for the project shown here.
    await expect(saveButton(page)).toHaveText("Saved");
    await removeOf(other, 0).click();
    await expect(section(page)).toBeHidden();
    await expect(saveButton(page)).toHaveText("Save");
    await saveButton(other).click();
    await expect(entries(page)).toHaveCount(1);
    await other.evaluate(() => localStorage.clear());
    await expect(section(page)).toBeHidden();
    // An entry removed elsewhere leaves the project shown here.
    await expect(heading(page)).toHaveText("acme/widgets (main)");
    expect(
      await page.evaluate(() => (window as unknown as { __writes: string[] }).__writes),
    ).toEqual([]);
  });

  test("the focus is kept on a redraw: on B's open button, and on B's ×, while another tab saves an entry", async ({
    page,
    context,
  }) => {
    await plant(page, { repos: [e("a"), e("b")] });
    const other = await context.newPage();
    await other.goto("/");
    const addFirst = (repo: string) =>
      other.evaluate(
        ([k, r]) => {
          const value = JSON.parse(localStorage.getItem(k as string) ?? '{"repos":[]}');
          value.repos.unshift({ owner: "acme", repo: r, branch: null });
          localStorage.setItem(k as string, JSON.stringify(value));
        },
        [KEY, repo],
      );
    await openOf(page, 1).focus();
    await addFirst("x");
    await expect(entries(page)).toHaveCount(3);
    expect(await focused(page)).toBe("saved-open@acme/b!");
    await removeOf(page, 2).focus();
    await addFirst("y");
    await expect(entries(page)).toHaveCount(4);
    expect(await focused(page)).toBe("saved-remove@acme/b!");
  });

  test("the last entry removed in another tab while the focus is on it: the focus moves to the address section's heading", async ({
    page,
    context,
  }) => {
    await plant(page, { repos: [e("a")] });
    const other = await context.newPage();
    await other.goto("/");
    await removeOf(page, 0).focus();
    await removeOf(other, 0).click();
    await expect(section(page)).toBeHidden();
    expect(await focused(page)).toBe("open-project-title");
  });

  test("another entry removed in another tab leaves the focus where it is: on B's open button, and on B's ×", async ({
    page,
    context,
  }) => {
    await plant(page, { repos: [e("a"), e("b"), e("c")] });
    const other = await context.newPage();
    await other.goto("/");
    await openOf(page, 1).focus();
    await removeOf(other, 0).click();
    await expect(entries(page)).toHaveCount(2);
    expect(await focused(page)).toBe("saved-open@acme/b!");
    await removeOf(page, 0).focus();
    await removeOf(other, 1).click();
    await expect(entries(page)).toHaveCount(1);
    expect(await focused(page)).toBe("saved-remove@acme/b!");
  });

  test("an entry removed in another tab while the focus is on it moves the focus as × does; with the help view open no focus moves", async ({
    page,
    context,
  }) => {
    await plant(page, { repos: [e("a"), e("b")] });
    const other = await context.newPage();
    await other.goto("/");
    await openOf(page, 0).focus();
    await removeOf(other, 0).click();
    await expect(entries(page)).toHaveCount(1);
    expect(await focused(page)).toBe("saved-open@acme/b!");
    await page.locator("#help-open").click();
    expect(await focused(page)).toBe("help-title");
    await removeOf(other, 0).click();
    await expect(entries(other)).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("vizi.savedRepos")))
      .toBeNull();
    await settle(page);
    expect(await focused(page)).toBe("help-title");
  });
});

test.describe("accessibility and layout (3.14)", () => {
  test("the tab order: the field, Open, each entry's open button and ×, then the Private repos panel", async ({
    page,
  }) => {
    await plant(page, { repos: [e("a"), e("b", "dev")] });
    await page.locator("#url-input").focus();
    const order: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press("Tab");
      order.push(await focused(page));
    }
    expect(order).toEqual([
      "open-url",
      "saved-open@acme/a!",
      "saved-remove@acme/a!",
      "saved-open@acme/b@dev",
      "saved-remove@acme/b@dev",
      "private-repos-toggle",
    ]);
  });

  test("no sideways scroll with an entry of a 100-character owner, repo and branch; the buttons at least 44 px high on a phone", async ({
    page,
  }) => {
    const long = e("r".repeat(100), "b".repeat(100), "o".repeat(100));
    await plant(page, { repos: [long, e("short")] });
    await expect(entries(page)).toHaveCount(2);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
    const phone = (page.viewportSize()?.width ?? 1280) < 800;
    for (const button of [openOf(page, 0), removeOf(page, 0), openOf(page, 1), removeOf(page, 1)]) {
      const box = await button.boundingBox();
      if (!box) throw new Error("no box");
      expect(box.height).toBeGreaterThanOrEqual(phone ? 44 : 40);
    }
    const remove = await removeOf(page, 1).boundingBox();
    if (!remove) throw new Error("no box");
    expect(Math.round(remove.width)).toBe(phone ? 44 : 40);
    // The long name wraps inside its row.
    const row = await entries(page).nth(0).boundingBox();
    const list = await page.locator("#saved-list").boundingBox();
    if (!row || !list) throw new Error("no box");
    expect(row.x + row.width).toBeLessThanOrEqual(list.x + list.width + 1);
  });

  test("the entries' text has at least 4.5:1 contrast against its background", async ({ page }) => {
    await plant(page, { repos: [e("widgets", "dev")] });
    const ratios = await page.evaluate(() => {
      const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
      const lum = (c: string) => {
        const [r = 0, g = 0, b = 0] = rgb(c).map((v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const bg = (el: Element | null): string => {
        for (let n = el; n; n = n.parentElement) {
          const c = getComputedStyle(n).backgroundColor;
          if ((rgb(c)[3] ?? 1) > 0 && c !== "transparent") return c;
        }
        return "rgb(255, 255, 255)";
      };
      return [
        ...document.querySelectorAll("#saved-repos h2, [data-testid=saved-entry] button"),
      ].map((el) => {
        const a = lum(getComputedStyle(el).color);
        const b = lum(bg(el));
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
    });
    expect(ratios.length).toBe(3);
    for (const r of ratios) expect(r).toBeGreaterThanOrEqual(4.5);
  });
});
