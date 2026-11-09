/**
 * Browser tests for the help view, "How to make your project vizi
 * compatible" (docs/SPEC.md 3.10). GitHub's answers are stubbed with
 * routes: no test reaches the network. The view's text is compared with
 * the data in src/help.ts, which the unit tests read with the page's own
 * readers. Runs at phone and desktop width, in light and dark mode.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test as base, expect, type Page, type Route } from "@playwright/test";
import {
  CLOSING_LINK,
  HELP_STEPS,
  HELP_TITLE,
  plainText,
  READ_ONLY_SENTENCE,
  REPO_LINK_HELP,
} from "../src/help";
import { isAllowedRequest } from "./guard";
import { branchesUrl, branchListRead } from "./picker";

/** Every test: any request other than the page's own document and GitHub's two hosts fails it (2.3). */
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

const BUILT = join(__dirname, "..", "dist", "index.html");
const project = join(__dirname, "fixtures", "project");
const read = (p: string) => readFileSync(join(project, p), "utf8");
const REPO = "https://github.com/acme/widgets";
const cors = { "access-control-allow-origin": "*" };

/**
 * Answers GitHub for acme/widgets. While `gate` is pending, every answer
 * waits for it, so a test can act while a load is under way. `failWith`
 * answers every request with that status instead.
 */
async function stubGithub(
  page: Page,
  opts: { gate?: Promise<void>; failWith?: number } = {},
): Promise<string[]> {
  const requested: string[] = [];
  await page.route(
    /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//,
    async (route: Route) => {
      const url = route.request().url();
      requested.push(url);
      if (opts.gate) await opts.gate;
      if (opts.failWith) return route.fulfill({ status: opts.failWith, headers: cors, body: "" });
      // The branch list the picker reads after a load (3.13): one branch.
      if (url.includes("/branches?per_page=100&page="))
        return route.fulfill({ status: 200, headers: cors, body: '[{"name":"main"}]' });
      if (url === "https://api.github.com/repos/acme/widgets")
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({ default_branch: "main" }),
        });
      if (url === "https://api.github.com/repos/acme/widgets/git/trees/main?recursive=1")
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({
            truncated: false,
            tree: ["README.md", "STATUS.md", "docs/BACKLOG.md"].map((path) => ({
              path,
              type: "blob",
            })),
          }),
        });
      if (url.endsWith("/docs/BACKLOG.md"))
        return route.fulfill({ status: 200, headers: cors, body: read("docs/BACKLOG.md") });
      if (url.endsWith("/STATUS.md"))
        return route.fulfill({ status: 200, headers: cors, body: read("STATUS.md") });
      return route.fulfill({ status: 404, headers: cors, body: "" });
    },
  );
  return requested;
}

/** A gate a test opens when it is ready for GitHub's answers to arrive. */
function gate(): { promise: Promise<void>; open: () => void } {
  let open = () => {};
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
}

const control = (page: Page) => page.locator("#help-open");
const view = (page: Page) => page.locator("#help");
const start = (page: Page) => page.locator("#start");

async function load(page: Page) {
  await page.locator("#url-input").fill(REPO);
  await page.locator("#open-url").click();
}

async function loadProject(page: Page) {
  await stubGithub(page);
  await page.goto("/");
  await load(page);
  await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
}

async function openView(page: Page) {
  await control(page).click();
  await expect(view(page)).toBeVisible();
}

/** The id of the focused element, or its tag when it has none. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return el ? el.id || el.tagName : null;
  });

test.describe("opening the help view (3.10)", () => {
  test("the control is in the page's header, after the h1, is a button, and Tab reaches it", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(control(page)).toBeVisible();
    await expect(control(page)).toHaveText(HELP_TITLE);
    expect(await control(page).evaluate((el) => [el.tagName, el.getAttribute("type")])).toEqual([
      "BUTTON",
      "button",
    ]);
    // In the header, at the right of the h1 (3.12, "Changes to the help view", item 1): after it in the page.
    const after = await page.evaluate(() => {
      const h1 = document.querySelector("header > h1");
      const c = document.querySelector("header #help-open");
      return Boolean(h1 && c && h1.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(after).toBe(true);
    await expect(view(page)).toBeHidden();
    await page.keyboard.press("Tab");
    expect(await focused(page)).toBe("help-open");
  });

  test("Enter opens the view: the inputs and results are hidden and the focus is on its h2", async ({
    page,
  }) => {
    await loadProject(page);
    await control(page).focus();
    await page.keyboard.press("Enter");
    await expect(view(page)).toBeVisible();
    await expect(start(page)).toBeHidden();
    await expect(page.locator("#url-input")).toBeHidden();
    await expect(page.locator("#token-input")).toBeHidden();
    await expect(page.locator("#results")).toBeHidden();
    // The control and the footer are outside the wrapper, so opening hides them too (3.12, item 2).
    await expect(control(page)).toBeHidden();
    await expect(page.locator("footer")).toBeHidden();
    expect(await focused(page)).toBe("help-title");
    await expect(page.locator("#help-title")).toHaveAttribute("tabindex", "-1");
    await expect(page.locator("#help-title")).toHaveText(HELP_TITLE);
    // Opening hides the wrapper only: the load code's own hidden flag on the results is untouched.
    expect(await page.locator("#results").evaluate((el) => (el as HTMLElement).hidden)).toBe(false);
  });

  test("Space opens it too", async ({ page }) => {
    await page.goto("/");
    await control(page).focus();
    await page.keyboard.press(" ");
    await expect(view(page)).toBeVisible();
    expect(await focused(page)).toBe("help-title");
  });

  test("the view is a section labelled by its h2, outside the wrapper, and the address does not change", async ({
    page,
  }) => {
    await page.goto("/");
    const before = page.url();
    // The tab starts at about:blank, so compare the history's length before and after opening.
    const entries = await page.evaluate(() => history.length);
    await openView(page);
    await expect(page.getByRole("region", { name: HELP_TITLE })).toHaveId("help");
    expect(
      await view(page).evaluate((el) => [
        el.tagName,
        el.getAttribute("aria-labelledby"),
        el.closest("#start") === null,
        el.parentElement?.tagName,
        document.getElementById("start")?.parentElement === el.parentElement,
      ]),
    ).toEqual(["SECTION", "help-title", true, "MAIN", true]);
    expect(page.url()).toBe(before);
    expect(await page.evaluate(() => history.length)).toBe(entries);
    expect(await page.evaluate(() => location.hash)).toBe("");
  });

  test("the page opens on the start page, not the view, after a reload", async ({ page }) => {
    await page.goto("/");
    await openView(page);
    await page.reload();
    await expect(view(page)).toBeHidden();
    await expect(control(page)).toBeVisible();
  });
});

test.describe("the view's structure and text (3.10)", () => {
  test("headings: the h1, then the section's one h2 and five h3, none deeper; the closing link is outside the list with no heading", async ({
    page,
  }) => {
    await page.goto("/");
    await openView(page);
    const tags = await page.evaluate(() => {
      const h1 = document.querySelector("header > h1");
      const section = document.getElementById("help");
      const inView = section ? [...section.querySelectorAll("h1, h2, h3, h4, h5, h6")] : [];
      return [h1, ...inView].map((el) => el?.tagName ?? "none");
    });
    expect(tags).toEqual(["H1", "H2", "H3", "H3", "H3", "H3", "H3"]);
    // The start page's other headings are all in the hidden wrapper, so none is read while the view
    // is open: the h2 "Open a project from GitHub", the panel's h2 and its h3 "Add a token" (3.10,
    // "Accessibility", as 3.12 changes it; its list leaves out the new h2, which is there too), and
    // the h2 "Saved repos" of 3.14, there whether or not its section is shown.
    const hidden = await page.evaluate(() => {
      const start = document.getElementById("start");
      return [...document.querySelectorAll("h2, h3")]
        .filter((el) => !document.getElementById("help")?.contains(el))
        .map((el) => [el.id, el.tagName, start?.contains(el) ?? false, start?.hidden ?? false]);
    });
    expect(hidden).toEqual([
      ["open-project-title", "H2", true, true],
      ["saved-repos-title", "H2", true, true],
      ["private-repos-title", "H2", true, true],
      ["token-add-title", "H3", true, true],
      ["project-name", "H2", true, true],
    ]);
    // Each h3 is a step of the ordered list.
    expect(await page.locator("#help ol > li > h3").count()).toBe(5);
    expect(await page.locator("#help ol > li").count()).toBe(5);
    const link = page.locator("#help-format-link");
    expect(
      await link.evaluate((a) => [
        a.closest("ol") === null,
        a.parentElement?.querySelector("h1, h2, h3, h4, h5, h6") === null,
      ]),
    ).toEqual([true, true]);
  });

  test("the step titles are in order, and each example block's text is the constant of src/help.ts", async ({
    page,
  }) => {
    await page.goto("/");
    await openView(page);
    await expect(page.locator("#help ol > li > h3")).toHaveText(
      HELP_STEPS.map((s) => plainText(s.title)),
    );
    const blocks = page.locator("#help pre");
    expect(await blocks.count()).toBe(5);
    const texts = await blocks.evaluateAll((els) => els.map((el) => el.textContent));
    expect(texts).toEqual(HELP_STEPS.map((s) => s.example));
    // Each paragraph, as data: the plain text of its parts; code parts in <code>.
    for (const [i, step] of HELP_STEPS.entries()) {
      const li = page.locator("#help ol > li").nth(i);
      await expect(li.locator(":scope > p")).toHaveText(step.paragraphs.map(plainText));
      const code = step.paragraphs.flatMap((p) =>
        p.filter((part) => part.kind === "code").map((part) => part.text),
      );
      await expect(li.locator(":scope > p code")).toHaveText(code);
    }
  });

  test("the paragraph of 3.16 is after the last step and before the closing link, with its code parts as code; it is not a step", async ({
    page,
  }) => {
    await page.goto("/");
    await openView(page);
    const paragraph = page.locator("#help-repo-link");
    await expect(paragraph).toHaveText(plainText(REPO_LINK_HELP));
    await expect(paragraph.locator("code")).toHaveText(
      REPO_LINK_HELP.filter((p) => p.kind === "code").map((p) => p.text),
    );
    // Order in the view: the ordered list of steps, then this paragraph, then the closing link's paragraph.
    expect(
      await paragraph.evaluate((p) => [
        p.tagName,
        p.closest("ol") === null,
        p.previousElementSibling?.tagName,
        Boolean(p.nextElementSibling?.querySelector("#help-format-link")),
      ]),
    ).toEqual(["P", true, "OL", true]);
    await expect(page.locator("#help ol > li")).toHaveCount(5);
  });

  test("every example block takes the focus, is a region and has a name naming its step", async ({
    page,
  }) => {
    await page.goto("/");
    await openView(page);
    const blocks = page.locator("#help pre");
    const n = await blocks.count();
    expect(n).toBe(5);
    for (let i = 0; i < n; i++) {
      const block = blocks.nth(i);
      await expect(block).toHaveAttribute("tabindex", "0");
      await expect(block).toHaveAttribute("role", "region");
      await expect(block).toHaveAccessibleName(`Example: ${plainText(HELP_STEPS[i]?.title ?? [])}`);
    }
  });

  test("the view's text holds none of 3.11's folder strings, and step 5 has only the token way", async ({
    page,
  }) => {
    await page.goto("/");
    await openView(page);
    const text = ((await view(page).textContent()) ?? "").toLowerCase();
    for (const words of [
      "local project folder",
      "local folder",
      "as a folder",
      "project's folder",
    ]) {
      expect(text, words).not.toContain(words);
    }
    const step5 = page.locator("#help ol > li").nth(4);
    await expect(step5.locator("h3")).toHaveText("A private repo: with a token");
    expect(((await step5.textContent()) ?? "").toLowerCase()).not.toContain("folder");
  });

  test("the read-only sentence is the first text after the h2, before the first step's h3, as static text", async ({
    page,
  }) => {
    await page.goto("/");
    await openView(page);
    const after = await page.evaluate(() => {
      const h2 = document.getElementById("help-title");
      const next = h2?.nextElementSibling;
      const h3 = document.querySelector("#help h3");
      return {
        tag: next?.tagName,
        text: next?.textContent,
        beforeSteps: Boolean(
          next && h3 && next.compareDocumentPosition(h3) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
        // Every text node between the h2 and the first h3 belongs to the sentence.
        between: (() => {
          if (!h2 || !h3) return null;
          const range = document.createRange();
          range.setStartAfter(h2);
          range.setEndBefore(h3);
          return range.toString().replace(/\s+/g, " ").trim();
        })(),
      };
    });
    expect(after).toEqual({
      tag: "P",
      text: READ_ONLY_SENTENCE,
      beforeSteps: true,
      between: READ_ONLY_SENTENCE,
    });
  });

  test("every control label the text names exists on the start page, inside the panel", async ({
    page,
  }) => {
    await page.goto("/");
    // The panel's own name, on its toggle; the other labels inside the panel (3.12, item 6).
    await expect(page.locator("#private-repos-toggle .toggle-label")).toHaveText("Private repos");
    const labels = await page.evaluate(() =>
      [...document.querySelectorAll("#private-repos label, #private-repos button")].map((el) =>
        (el.textContent ?? "").trim(),
      ),
    );
    for (const label of ["Owner", "Remember in this browser", "Add"]) {
      expect(labels, label).toContain(label);
    }
  });

  test("the final link has the right href, target and rel, and the approved label", async ({
    page,
  }) => {
    await page.goto("/");
    await openView(page);
    const link = page.locator("#help-format-link");
    await expect(link).toHaveAttribute("href", CLOSING_LINK.href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveText(plainText(CLOSING_LINK.label));
    await expect(link.locator("code")).toHaveText("docs/BACKLOG-FORMAT.md");
  });
});

test.describe("closing the help view (3.10)", () => {
  for (const how of ["Escape", "the top Back button", "the end Back button"] as const) {
    test(`${how} closes it: the control is shown and focused, and the project loaded before is still there`, async ({
      page,
    }) => {
      await loadProject(page);
      await openView(page);
      if (how === "Escape") await page.keyboard.press("Escape");
      else if (how === "the top Back button") await page.locator("#help-back-top").click();
      else {
        // Keyboard: Tab order reaches it, and Enter works on it.
        await page.locator("#help-back-end").focus();
        await page.keyboard.press("Enter");
      }
      await expect(view(page)).toBeHidden();
      await expect(start(page)).toBeVisible();
      await expect(control(page)).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
      expect(await focused(page)).toBe("help-open");
      await expect(page.locator("#results")).toBeVisible();
      await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    });
  }

  test("both Back buttons say Back to vizi, one at the top and one at the end; Space works on them", async ({
    page,
  }) => {
    await page.goto("/");
    await openView(page);
    await expect(page.locator("#help-back-top")).toHaveText("Back to vizi");
    await expect(page.locator("#help-back-end")).toHaveText("Back to vizi");
    const order = await page.evaluate(() => {
      const section = document.getElementById("help");
      return section
        ? [section.firstElementChild?.id, section.lastElementChild?.id]
        : [undefined, undefined];
    });
    expect(order).toEqual(["help-back-top", "help-back-end"]);
    await page.locator("#help-back-top").focus();
    await page.keyboard.press(" ");
    await expect(view(page)).toBeHidden();
  });

  test("Escape with the view closed does nothing", async ({ page }) => {
    await loadProject(page);
    await page.locator("#url-input").focus();
    await page.keyboard.press("Escape");
    await expect(view(page)).toBeHidden();
    await expect(start(page)).toBeVisible();
    await expect(page.locator("#results")).toBeVisible();
    expect(await focused(page)).toBe("url-input");
  });

  test("while the view is open nothing outside it can be focused", async ({ page }) => {
    await loadProject(page);
    await openView(page);
    const reached = new Set<string | null>();
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      reached.add(
        await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return "body";
          return document.getElementById("help")?.contains(el) ? "view" : el.id || el.tagName;
        }),
      );
    }
    reached.delete("body");
    expect([...reached]).toEqual(["view"]);
  });
});

test.describe("loads while the help view is open (3.10)", () => {
  test("a load that succeeds while the view is open stays unseen until the view closes, and then shows; the focus does not move", async ({
    page,
  }) => {
    const g = gate();
    const requested = await stubGithub(page, { gate: g.promise });
    await page.goto("/");
    await load(page);
    await expect.poll(() => requested.length).toBeGreaterThan(0);
    await openView(page);
    g.open();
    // The load fills the hidden wrapper: the results get shown by the load code, unseen.
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    expect(await page.locator("#results").evaluate((el) => (el as HTMLElement).hidden)).toBe(false);
    await expect(page.locator("#results")).toBeHidden();
    await expect(view(page)).toBeVisible();
    expect(await focused(page)).toBe("help-title");
    await page.keyboard.press("Escape");
    await expect(page.locator("#results")).toBeVisible();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
  });

  test("a load that fails while the view is open leaves the results hidden after closing, with its message shown", async ({
    page,
  }) => {
    await loadProject(page);
    await page.unrouteAll();
    const g = gate();
    const requested = await stubGithub(page, { gate: g.promise, failWith: 500 });
    await load(page);
    await expect.poll(() => requested.length).toBeGreaterThan(0);
    await openView(page);
    g.open();
    await expect(page.locator("#message")).toContainText("500");
    expect(await page.locator("#results").evaluate((el) => (el as HTMLElement).hidden)).toBe(true);
    await expect(view(page)).toBeVisible();
    await page.locator("#help-back-end").click();
    await expect(page.locator("#results")).toBeHidden();
    await expect(page.locator("#message")).toBeVisible();
    await expect(page.locator("#message")).toContainText("500");
  });

  test("opening and closing the view starts no load and cancels none", async ({ page }) => {
    const g = gate();
    const requested = await stubGithub(page, { gate: g.promise });
    await page.goto("/");
    await load(page);
    await expect.poll(() => requested.length).toBe(1);
    await openView(page);
    await page.keyboard.press("Escape");
    await openView(page);
    g.open();
    await expect(page.locator("#project-name")).toHaveText("acme/widgets (main)");
    await branchListRead(page);
    // The load's own requests only (3.1): repo, file list, backlog, STATUS.md; then its branch list (3.13).
    expect(requested).toHaveLength(5);
    expect(requested[4]).toBe(branchesUrl("acme", "widgets"));
  });
});

test.describe("the help view and the page's rules (2.3, 3.10)", () => {
  test("opening the view makes no request: the page's requests stay its own document", async ({
    page,
    baseURL,
  }) => {
    const requested: string[] = [];
    page.on("request", (r) => requested.push(r.url()));
    await page.goto("/");
    await openView(page);
    await page.keyboard.press("Escape");
    await openView(page);
    await page.waitForLoadState("networkidle");
    expect(requested).toEqual([`${baseURL}/`]);
  });

  test("with the view open the page has no sideways scroll", async ({ page }) => {
    await page.goto("/");
    await openView(page);
    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(sideways, "page scrolls sideways").toBeLessThanOrEqual(0);
  });

  test("at phone width (375 px) with the view open the page has no sideways scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await openView(page);
    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(sideways, "page scrolls sideways").toBeLessThanOrEqual(0);
  });

  test("the view's text and background differ, as on the start page, in light and dark", async ({
    page,
    colorScheme,
  }) => {
    await page.goto("/");
    await openView(page);
    const colours = await page.evaluate(() => {
      const section = document.getElementById("help");
      return {
        body: getComputedStyle(document.body).backgroundColor,
        text: section ? getComputedStyle(section).color : "",
        code: getComputedStyle(document.querySelector("#help pre") ?? document.body).color,
      };
    });
    const [red = 0] = colours.body.match(/\d+/g)?.map(Number) ?? [];
    expect(red > 128, `body background ${colours.body} in ${colorScheme} mode`).toBe(
      colorScheme === "light",
    );
    expect(colours.text).not.toBe(colours.body);
    expect(colours.code).not.toBe(colours.body);
  });

  test("the built page holds the view's title and every example's text, and no real-looking token", () => {
    const html = readFileSync(BUILT, "utf8");
    // The text sits in the inline script as string literals: undo the escapes a JS string may use.
    const decoded = html
      .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex: string) =>
        String.fromCodePoint(Number.parseInt(hex, 16)),
      )
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) =>
        String.fromCharCode(Number.parseInt(hex, 16)),
      )
      .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex: string) =>
        String.fromCharCode(Number.parseInt(hex, 16)),
      )
      .replace(/\\n/g, "\n")
      .replace(/\\(["'`\\])/g, "$1");
    expect(decoded).toContain(HELP_TITLE);
    expect(decoded).toContain(READ_ONLY_SENTENCE);
    for (const step of HELP_STEPS) {
      for (const line of step.example.split("\n")) {
        if (line.trim() !== "") expect(decoded, line).toContain(line);
      }
    }
    // The paragraph of 3.16, as its parts.
    for (const part of REPO_LINK_HELP) expect(decoded, part.text).toContain(part.text);
    expect(html).not.toMatch(/github_pat_[A-Za-z0-9_]{10,}/);
    expect(html).not.toMatch(/ghp_[A-Za-z0-9]{20,}/);
    expect(decoded).not.toMatch(/github_pat_[A-Za-z0-9_]{10,}/);
    expect(decoded).not.toMatch(/ghp_[A-Za-z0-9]{20,}/);
  });

  test("with the view open the policy holds: no violation, no console error, and a script added at run time is blocked", async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(e.message));
    await page.addInitScript(() => {
      const seen: string[] = [];
      (window as unknown as { __violations: string[] }).__violations = seen;
      document.addEventListener("securitypolicyviolation", (e) => seen.push(e.violatedDirective));
    });
    const violations = () =>
      page.evaluate(() => (window as unknown as { __violations: string[] }).__violations);
    await page.goto("/");
    await openView(page);
    await page.locator("#help pre").first().focus();
    await page.keyboard.press("Escape");
    await openView(page);
    expect(await violations()).toEqual([]);
    expect(problems).toEqual([]);
    await page.evaluate(() => {
      const s = document.createElement("script");
      s.textContent = "window.__injected = true";
      document.body.append(s);
    });
    expect(await page.evaluate(() => "__injected" in window)).toBe(false);
    // The browser fires securitypolicyviolation from a queued task, so it may come after evaluate returns.
    await expect.poll(violations).toContain("script-src-elem");
    // Exactly that one: a late violation from opening the view would show here too.
    expect(await violations()).toEqual(["script-src-elem"]);
  });

  test("the view works on the built page opened from disk (file://)", async ({ page }) => {
    await page.goto(pathToFileURL(BUILT).href);
    await openView(page);
    await expect(page.locator("#help-title")).toHaveText(HELP_TITLE);
    await page.keyboard.press("Escape");
    await expect(control(page)).toBeVisible();
  });
});
