/**
 * Browser tests for the version history (docs/SPEC.md 3.17, PBI-1.40).
 * GitHub's answers are stubbed with routes: no test reaches the network.
 * The list under test is the shipped one, read from src/history.ts, and the
 * version is the `version` of package.json, which the build gives the page.
 * Runs at phone and desktop width, in light and dark mode.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { type BrowserContext, test as base, expect, type Page, type Route } from "@playwright/test";
import { compareVersions, HISTORY } from "../src/history";
import { isAllowedRequest } from "./guard";
import { branchListRead } from "./picker";
import { SEEN_KEY } from "./storage";

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

const VERSION = (
  JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { version: string }
).version;
const project = join(__dirname, "fixtures", "project");
const read = (p: string) => readFileSync(join(project, p), "utf8");
const cors = { "access-control-allow-origin": "*" };

/** Answers GitHub for acme/widgets, the project fixture, on the whole context. */
async function stubGithub(context: BrowserContext): Promise<void> {
  await context.route(
    /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//,
    async (route: Route) => {
      const url = route.request().url();
      const ok = (body: string) => route.fulfill({ status: 200, headers: cors, body });
      if (url.includes("/branches?per_page=100&page=")) return ok('[{"name":"main"}]');
      if (url === "https://api.github.com/repos/acme/widgets")
        return ok(JSON.stringify({ default_branch: "main" }));
      if (url.includes("/git/trees/"))
        return ok(
          JSON.stringify({
            truncated: false,
            tree: ["STATUS.md", "docs/BACKLOG.md"].map((path) => ({ path, type: "blob" })),
          }),
        );
      if (url.endsWith("/docs/BACKLOG.md")) return ok(read("docs/BACKLOG.md"));
      if (url.endsWith("/STATUS.md")) return ok(read("STATUS.md"));
      return route.fulfill({ status: 404, headers: cors, body: "" });
    },
  );
}

const link = (page: Page) => page.locator("#history-open");
const view = (page: Page) => page.locator("#history");
const title = (page: Page) => page.locator("#history-title");
const full = (page: Page) => page.locator("#history-full");
const start = (page: Page) => page.locator("#start");
const helpControl = (page: Page) => page.locator("#help-open");
const footer = (page: Page) => page.locator("footer");

/** The id of the focused element, or its tag when it has none. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return el ? el.id || el.tagName : null;
  });

/** What `vizi.seenVersion` holds, read by property so that a patched `getItem` does not matter. */
const seen = (page: Page) =>
  page.evaluate(
    (k) => (window.localStorage as unknown as Record<string, string | undefined>)[k] ?? null,
    SEEN_KEY,
  );

/** Sets the version this browser last saw, before the page's own script runs. */
async function seenBefore(page: Page, value: string) {
  await page.addInitScript(
    ([k, v]) => window.localStorage.setItem(k as string, v as string),
    [SEEN_KEY, value],
  );
}

/** Records every `setItem` the page makes, as `[key, value]`, in `window.__sets`. */
async function recordWrites(page: Page) {
  await page.addInitScript(() => {
    const sets: [string, string][] = [];
    (window as unknown as { __sets: [string, string][] }).__sets = sets;
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      sets.push([key, value]);
      return set.call(this, key, value);
    };
  });
}
const writes = (page: Page) =>
  page.evaluate(() => (window as unknown as { __sets: [string, string][] }).__sets);

/** The heading of an entry, 3.17 item 6. */
const heading = (e: { version: string; date: string }) => `Version ${e.version} · ${e.date}`;

/** What a view with these entries holds: the h3 headings and the lines under each, from the page. */
async function shown(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("#history-entries > h3")].map((h3) => ({
      heading: h3.textContent,
      lines: [...(h3.nextElementSibling?.querySelectorAll(":scope > li") ?? [])].map(
        (li) => li.textContent,
      ),
    })),
  );
}

const OLDER = "0.1.0";
const NEWER_THAN_OLDER = HISTORY.filter((e) => compareVersions(e.version, OLDER) > 0);

test.describe("the footer's version line and link (3.17 item 5)", () => {
  test("the line is the version of package.json, a space, the middle dot, a space and a button, above the font notice", async ({
    page,
  }) => {
    await page.goto("/");
    const line = page.locator("#version-line");
    await expect(line).toBeVisible();
    expect(await line.evaluate((el) => el.textContent)).toBe(
      `Version ${VERSION} · Version history`,
    );
    expect(
      await line.evaluate((el) => [
        el.closest("footer") !== null,
        el.nextElementSibling?.id,
        el.querySelectorAll("button, a").length,
      ]),
    ).toEqual([true, "font-notice", 1]);
    // Above the font notice on the page, not only before it in the markup.
    const [lineBottom, noticeTop] = await page.evaluate(() => [
      document.getElementById("version-line")?.getBoundingClientRect().bottom ?? 0,
      document.getElementById("font-notice")?.getBoundingClientRect().top ?? 0,
    ]);
    expect(lineBottom).toBeLessThanOrEqual(noticeTop);
  });

  test("the link is a button of type button styled as a link: it has no address and acts inside the page", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(link(page)).toHaveText("Version history");
    expect(
      await link(page).evaluate((el) => [
        el.tagName,
        el.getAttribute("type"),
        el.getAttribute("href"),
        el.classList.contains("link-button"),
        el.closest("footer") !== null,
      ]),
    ).toEqual(["BUTTON", "button", null, true, true]);
  });

  test("on a first visit nothing opens and the link is there", async ({ page }) => {
    await page.goto("/");
    await expect(view(page)).toBeHidden();
    await expect(start(page)).toBeVisible();
    await expect(link(page)).toBeVisible();
    expect(await view(page).evaluate((el) => (el as HTMLElement).hidden)).toBe(true);
  });

  test("the footer takes no sideways scroll at 375 px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await expect(link(page)).toBeVisible();
    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(sideways, "page scrolls sideways").toBeLessThanOrEqual(0);
  });
});

test.describe("the view opened from the link (3.17 item 6)", () => {
  test("it is titled Version history, shows every entry newest first, each heading of the form, each line equal to the data", async ({
    page,
  }) => {
    await page.goto("/");
    await link(page).click();
    await expect(view(page)).toBeVisible();
    await expect(title(page)).toHaveText("Version history");
    expect(await title(page).evaluate((el) => [el.tagName, el.textContent])).toEqual([
      "H2",
      "Version history",
    ]);
    expect(await shown(page)).toEqual(
      HISTORY.map((e) => ({ heading: heading(e), lines: [...e.lines] })),
    );
    // Newest first, as the data is.
    const versions = HISTORY.map((e) => e.version);
    for (let i = 1; i < versions.length; i++)
      expect(compareVersions(versions[i - 1] ?? "", versions[i] ?? "")).toBeGreaterThan(0);
    await expect(full(page)).toHaveCount(0);
  });

  test("it holds only the elements 3.17 names: a Back button, the h2, the entries (h3 and a list of li each), a Back button", async ({
    page,
  }) => {
    await page.goto("/");
    await link(page).click();
    const structure = await view(page).evaluate((section) => ({
      top: [...section.children].map((c) => `${c.tagName}#${c.id}`),
      entries: [...(document.getElementById("history-entries")?.children ?? [])].map(
        (c) => c.tagName,
      ),
      items: [...section.querySelectorAll("#history-entries > ul")].map((ul) =>
        [...ul.children].map((li) => `${li.tagName}:${li.children.length}`),
      ),
      backs: [...section.querySelectorAll("button")].map((b) => [b.id, b.textContent, b.type]),
    }));
    expect(structure.top).toEqual([
      "BUTTON#history-back-top",
      "H2#history-title",
      "DIV#history-entries",
      "BUTTON#history-back-end",
    ]);
    expect(structure.entries).toEqual(HISTORY.flatMap(() => ["H3", "UL"]));
    // Each line is an li with no element inside it: text only.
    expect(structure.items).toEqual(HISTORY.map((e) => e.lines.map(() => "LI:0")));
    expect(structure.backs).toEqual([
      ["history-back-top", "Back to vizi", "button"],
      ["history-back-end", "Back to vizi", "button"],
    ]);
  });

  test("the view is a section labelled by its h2, a sibling of the start wrapper in main, and opening hides the wrapper, the help control and the footer", async ({
    page,
  }) => {
    await page.goto("/");
    await link(page).click();
    await expect(page.getByRole("region", { name: "Version history" })).toHaveId("history");
    expect(
      await view(page).evaluate((el) => [
        el.tagName,
        el.getAttribute("aria-labelledby"),
        el.closest("#start") === null,
        el.parentElement?.tagName,
        document.getElementById("start")?.parentElement === el.parentElement,
      ]),
    ).toEqual(["SECTION", "history-title", true, "MAIN", true]);
    await expect(start(page)).toBeHidden();
    await expect(helpControl(page)).toBeHidden();
    await expect(footer(page)).toBeHidden();
  });

  test("the focus is on the top Back to vizi button as it opens", async ({ page }) => {
    await page.goto("/");
    await link(page).focus();
    await page.keyboard.press("Enter");
    await expect(view(page)).toBeVisible();
    expect(await focused(page)).toBe("history-back-top");
  });
});

test.describe("closing the view (3.17 item 6)", () => {
  for (const how of ["Escape", "the top Back button", "the end Back button"] as const) {
    test(`${how} closes it: the wrapper, the help control and the footer are shown, the focus is on the link, nothing is written`, async ({
      page,
      context,
    }) => {
      await stubGithub(context);
      await recordWrites(page);
      await page.goto("/");
      await expect(link(page)).toBeVisible();
      const before = await seen(page);
      const writesBefore = await writes(page);
      await link(page).click();
      await expect(view(page)).toBeVisible();
      if (how === "Escape") await page.keyboard.press("Escape");
      else if (how === "the top Back button") await page.locator("#history-back-top").click();
      else {
        await page.locator("#history-back-end").focus();
        await page.keyboard.press("Enter");
      }
      await expect(view(page)).toBeHidden();
      await expect(start(page)).toBeVisible();
      await expect(helpControl(page)).toBeVisible();
      await expect(footer(page)).toBeVisible();
      expect(await focused(page)).toBe("history-open");
      expect(await seen(page)).toBe(before);
      expect(await writes(page)).toEqual(writesBefore);
    });
  }

  test("a project loaded while the view opens stays unseen and shows when the view closes, and the load does not move the focus", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await page.goto("/");
    await page.locator("#url-input").fill("acme/widgets");
    await page.locator("#open-url").click();
    await link(page).click();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await expect(page.locator("#results")).toBeHidden();
    expect(await focused(page)).toBe("history-back-top");
    await page.keyboard.press("Escape");
    await expect(page.locator("#results")).toBeVisible();
    expect(await focused(page)).toBe("history-open");
  });

  test("Escape with the view closed does nothing: the help view stays closed and the focus stays", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#url-input").focus();
    await page.keyboard.press("Escape");
    await expect(view(page)).toBeHidden();
    await expect(page.locator("#help")).toBeHidden();
    await expect(start(page)).toBeVisible();
    expect(await focused(page)).toBe("url-input");
  });
});

test.describe("what opens by itself (3.17 item 4)", () => {
  test("with 0.1.0 stored, it opens titled What's new with the newer entries only and a Show full history button, the focus on the top Back button, and the build's version is stored", async ({
    page,
  }) => {
    await seenBefore(page, OLDER);
    await page.goto("/");
    await expect(view(page)).toBeVisible();
    await expect(title(page)).toHaveText("What's new");
    expect(await shown(page)).toEqual(
      NEWER_THAN_OLDER.map((e) => ({ heading: heading(e), lines: [...e.lines] })),
    );
    expect(NEWER_THAN_OLDER.map((e) => e.version)).toEqual([VERSION]);
    await expect(full(page)).toHaveText("Show full history");
    expect(await full(page).evaluate((el) => [el.tagName, el.getAttribute("type")])).toEqual([
      "BUTTON",
      "button",
    ]);
    expect(await focused(page)).toBe("history-back-top");
    expect(await seen(page)).toBe(VERSION);
    // As the view opened from the link, it hides the wrapper, the help control and the footer.
    await expect(start(page)).toBeHidden();
    await expect(helpControl(page)).toBeHidden();
    await expect(footer(page)).toBeHidden();
  });

  test("Show full history shows every entry under Version history, removes the button and puts the focus on the top Back button", async ({
    page,
  }) => {
    await seenBefore(page, OLDER);
    await page.goto("/");
    await expect(full(page)).toBeVisible();
    await full(page).click();
    await expect(title(page)).toHaveText("Version history");
    expect(await shown(page)).toEqual(
      HISTORY.map((e) => ({ heading: heading(e), lines: [...e.lines] })),
    );
    await expect(full(page)).toHaveCount(0);
    expect(await focused(page)).toBe("history-back-top");
  });

  test("closing the view that opened by itself puts the focus on the link, and the key is not written again", async ({
    page,
  }) => {
    await seenBefore(page, OLDER);
    await recordWrites(page);
    await page.goto("/");
    await expect(view(page)).toBeVisible();
    const after = await writes(page);
    expect(after).toEqual([[SEEN_KEY, VERSION]]);
    await page.keyboard.press("Escape");
    await expect(view(page)).toBeHidden();
    expect(await focused(page)).toBe("history-open");
    expect(await writes(page)).toEqual(after);
  });

  test("it opens once: a reload after it has opened shows the start page", async ({
    page,
    context,
  }) => {
    await context.addInitScript(
      ([k, v]) => {
        // Only the first load of the context is an upgrade.
        if (window.localStorage.getItem(k as string) === null)
          window.localStorage.setItem(k as string, v as string);
      },
      [SEEN_KEY, OLDER],
    );
    await page.goto("/");
    await expect(view(page)).toBeVisible();
    await page.reload();
    await expect(view(page)).toBeHidden();
    await expect(start(page)).toBeVisible();
    expect(await seen(page)).toBe(VERSION);
  });

  const NOT_OPENING: [string, string | null][] = [
    ["is missing", null],
    ["equals the build's version", VERSION],
    ["is higher than the build's version", "99.0.0"],
    ["is higher by number, not by text (0.10.0 against 0.2.0)", "0.10.0"],
    ["is not of the form: text", "garbage"],
    ["is not of the form: a v in front", "v0.1.0"],
    ["is not of the form: two numbers", "0.1"],
    ["is not of the form: empty", ""],
    ["is not of the form: a trailing space", "0.1.0 "],
  ];
  for (const [name, value] of NOT_OPENING) {
    test(`with the stored version ${name}, nothing opens and the key holds the build's version`, async ({
      page,
    }) => {
      if (value !== null) await seenBefore(page, value);
      await page.goto("/");
      await expect(link(page)).toBeVisible();
      await expect(view(page)).toBeHidden();
      await expect(start(page)).toBeVisible();
      expect(await seen(page)).toBe(VERSION);
    });
  }

  test("with ?repo= and an older stored version the view opens, the load's result is on the start page when it closes, and the address is the one given", async ({
    page,
    context,
  }) => {
    await stubGithub(context);
    await seenBefore(page, OLDER);
    await page.goto("/?repo=acme/widgets");
    await expect(view(page)).toBeVisible();
    await expect(title(page)).toHaveText("What's new");
    expect(await focused(page)).toBe("history-back-top");
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await expect(page.locator("#results")).toBeHidden();
    await branchListRead(page);
    expect(await focused(page)).toBe("history-back-top");
    await page.keyboard.press("Escape");
    await expect(start(page)).toBeVisible();
    await expect(page.locator("#results")).toBeVisible();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await expect(page.locator("#url-input")).toHaveValue("acme/widgets");
    expect(page.url().endsWith("/?repo=acme/widgets")).toBe(true);
  });
});

test.describe("the view and the help view (3.17 item 6)", () => {
  test("the help control is hidden while the view is open, nothing outside the view can be focused, and Escape closes only the view", async ({
    page,
  }) => {
    await page.goto("/");
    await link(page).click();
    await expect(helpControl(page)).toBeHidden();
    const reached = new Set<string | null>();
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      reached.add(
        await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return "body";
          return document.getElementById("history")?.contains(el) ? "view" : el.id || el.tagName;
        }),
      );
    }
    reached.delete("body");
    expect([...reached]).toEqual(["view"]);
    await page.keyboard.press("Escape");
    await expect(view(page)).toBeHidden();
    await expect(page.locator("#help")).toBeHidden();
    await expect(helpControl(page)).toBeVisible();
  });

  test("the view cannot be opened while the help view is open: the link is hidden and never takes the focus; Escape closes only the help view", async ({
    page,
  }) => {
    await page.goto("/");
    await helpControl(page).click();
    await expect(page.locator("#help")).toBeVisible();
    await expect(link(page)).toBeHidden();
    await expect(footer(page)).toBeHidden();
    const reached = new Set<string | null>();
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      reached.add(await focused(page));
    }
    expect(reached.has("history-open")).toBe(false);
    await page.keyboard.press("Escape");
    await expect(page.locator("#help")).toBeHidden();
    await expect(view(page)).toBeHidden();
    await expect(link(page)).toBeVisible();
    expect(await focused(page)).toBe("help-open");
  });
});

test.describe("no address (3.17 item 8)", () => {
  test("the address, the hash and the history's length are the same before opening, with the view open and after closing; a reload shows the start page", async ({
    page,
  }) => {
    await page.goto("/");
    const state = () => page.evaluate(() => [location.href, location.hash, history.length]);
    const before = await state();
    await link(page).click();
    await expect(view(page)).toBeVisible();
    expect(await state()).toEqual(before);
    await page.keyboard.press("Escape");
    expect(await state()).toEqual(before);
    expect(before[1]).toBe("");
    await link(page).click();
    await page.reload();
    await expect(view(page)).toBeHidden();
    await expect(start(page)).toBeVisible();
    await expect(helpControl(page)).toBeVisible();
  });
});

test.describe("a storage that fails (3.17 items 4 and 7)", () => {
  /** Collects the page's console errors and uncaught errors. */
  function problems(page: Page): string[] {
    const list: string[] = [];
    page.on("console", (m) => m.type() === "error" && list.push(m.text()));
    page.on("pageerror", (e) => list.push(e.message));
    return list;
  }

  /** The page works: its field is there, and the link opens the view and Escape closes it. */
  async function pageWorks(page: Page) {
    await expect(page.locator("#url-input")).toBeVisible();
    await expect(view(page)).toBeHidden();
    await expect(link(page)).toHaveText("Version history");
    await link(page).click();
    await expect(title(page)).toHaveText("Version history");
    expect(await shown(page)).toEqual(
      HISTORY.map((e) => ({ heading: heading(e), lines: [...e.lines] })),
    );
    await page.keyboard.press("Escape");
    await expect(view(page)).toBeHidden();
    await expect(start(page)).toBeVisible();
  }

  test("a localStorage whose getter throws: nothing opens, the page works, no error", async ({
    page,
  }) => {
    const errors = problems(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new DOMException("denied", "SecurityError");
        },
      });
    });
    await page.goto("/");
    await pageWorks(page);
    expect(errors).toEqual([]);
  });

  test("a getItem that throws: nothing opens, V is still written, the page works, no error", async ({
    page,
  }) => {
    const errors = problems(page);
    await page.addInitScript((key) => {
      const get = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k: string) {
        if (k === key) throw new DOMException("denied", "SecurityError");
        return get.call(this, k);
      };
    }, SEEN_KEY);
    await page.goto("/");
    await pageWorks(page);
    expect(await seen(page)).toBe(VERSION);
    expect(errors).toEqual([]);
  });

  test("a setItem that throws: nothing opens, the key stays missing, the page works, no error", async ({
    page,
  }) => {
    const errors = problems(page);
    await page.addInitScript((key) => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (k === key) throw new DOMException("full", "QuotaExceededError");
        return set.call(this, k, v);
      };
    }, SEEN_KEY);
    await page.goto("/");
    await pageWorks(page);
    expect(await seen(page)).toBeNull();
    expect(errors).toEqual([]);
  });

  test("a setItem that throws with an older version stored: the view still opens, and the stored version stays, so it may open again at the next load", async ({
    page,
  }) => {
    const errors = problems(page);
    await page.addInitScript(
      ([key, old]) => {
        window.localStorage.setItem(key as string, old as string);
        const set = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k: string, v: string) {
          if (k === key) throw new DOMException("full", "QuotaExceededError");
          return set.call(this, k, v);
        };
      },
      [SEEN_KEY, OLDER],
    );
    await page.goto("/");
    await expect(view(page)).toBeVisible();
    await expect(title(page)).toHaveText("What's new");
    expect(await seen(page)).toBe(OLDER);
    await page.keyboard.press("Escape");
    await expect(start(page)).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("the view and the page's rules (2.3, 3.12, 3.17 item 9)", () => {
  /** The visible text elements of the view whose text and background differ by less than 4.5:1. */
  const contrastProblems = (page: Page) =>
    page.evaluate(() => {
      const rgba = (c: string): number[] => {
        const m = /rgba?\(([^)]+)\)/.exec(c);
        if (!m?.[1]) throw new Error(`cannot read the colour ${c}`);
        const p = m[1]
          .split(/[\s,/]+/)
          .filter(Boolean)
          .map(Number);
        return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0, p[3] ?? 1];
      };
      const lum = (c: number[]) => {
        const ch = c.slice(0, 3).map((v) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * (ch[0] ?? 0) + 0.7152 * (ch[1] ?? 0) + 0.0722 * (ch[2] ?? 0);
      };
      const ratio = (a: number[], b: number[]) => {
        const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
        return ((x ?? 0) + 0.05) / ((y ?? 0) + 0.05);
      };
      const background = (el: Element | null): number[] => {
        for (let e = el; e; e = e.parentElement) {
          const c = rgba(getComputedStyle(e).backgroundColor);
          if (c[3] === 1) return c;
        }
        return rgba(getComputedStyle(document.documentElement).backgroundColor);
      };
      const out: string[] = [];
      let checked = 0;
      for (const el of document.querySelectorAll("#history, #history *")) {
        if ((el as HTMLElement).checkVisibility?.() === false) continue;
        const hasText = [...el.childNodes].some(
          (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim() !== "",
        );
        if (!hasText) continue;
        checked += 1;
        const r = ratio(rgba(getComputedStyle(el).color), background(el));
        if (r < 4.5)
          out.push(
            `${el.tagName}#${el.id} "${el.textContent?.trim().slice(0, 30)}" ${r.toFixed(2)}`,
          );
      }
      // The view must have had text to check: its title, headings, lines and buttons.
      if (checked < 6) out.push(`only ${checked} text elements were checked`);
      return out;
    });

  test("every visible text of the view is at least 4.5:1 against its background, in both forms of the view, light and dark", async ({
    page,
  }) => {
    await seenBefore(page, OLDER);
    await page.goto("/");
    await expect(full(page)).toBeVisible();
    expect(await contrastProblems(page)).toEqual([]);
    await full(page).click();
    await expect(full(page)).toHaveCount(0);
    expect(await contrastProblems(page)).toEqual([]);
  });

  test("the view's text and background differ in light and dark, as the start page's do", async ({
    page,
    colorScheme,
  }) => {
    await page.goto("/");
    await link(page).click();
    const colours = await page.evaluate(() => ({
      body: getComputedStyle(document.body).backgroundColor,
      text: getComputedStyle(document.getElementById("history") as HTMLElement).color,
    }));
    const [red = 0] = colours.body.match(/\d+/g)?.map(Number) ?? [];
    expect(red > 128, `body background ${colours.body} in ${colorScheme} mode`).toBe(
      colorScheme === "light",
    );
    expect(colours.text).not.toBe(colours.body);
  });

  test("at 375 px, with the view open in either form, the page has no sideways scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await seenBefore(page, OLDER);
    await page.goto("/");
    await expect(full(page)).toBeVisible();
    const sideways = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
    expect(await sideways(), "page scrolls sideways").toBeLessThanOrEqual(0);
    await full(page).click();
    expect(await sideways(), "page scrolls sideways").toBeLessThanOrEqual(0);
  });

  test("opening and closing the view makes no request: the page's requests stay its own document", async ({
    page,
    baseURL,
  }) => {
    const requested: string[] = [];
    page.on("request", (r) => requested.push(r.url()));
    await seenBefore(page, OLDER);
    await page.goto("/");
    await expect(view(page)).toBeVisible();
    await full(page).click();
    await page.keyboard.press("Escape");
    await link(page).click();
    await page.keyboard.press("Escape");
    await page.waitForLoadState("networkidle");
    expect(requested).toEqual([`${baseURL}/`]);
  });

  test("with the view open the policy holds: no violation, no console error, and a script added at run time is blocked", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await seenBefore(page, OLDER);
    await page.addInitScript(() => {
      const list: string[] = [];
      (window as unknown as { __violations: string[] }).__violations = list;
      document.addEventListener("securitypolicyviolation", (e) => list.push(e.violatedDirective));
    });
    const violations = () =>
      page.evaluate(() => (window as unknown as { __violations: string[] }).__violations);
    await page.goto("/");
    await expect(view(page)).toBeVisible();
    await full(page).click();
    await page.keyboard.press("Escape");
    await link(page).click();
    expect(await violations()).toEqual([]);
    expect(errors).toEqual([]);
    await page.evaluate(() => {
      const s = document.createElement("script");
      s.textContent = "window.__injected = true";
      document.body.append(s);
    });
    expect(await page.evaluate(() => "__injected" in window)).toBe(false);
    await expect.poll(violations).toContain("script-src-elem");
    expect(await violations()).toEqual(["script-src-elem"]);
  });
});
