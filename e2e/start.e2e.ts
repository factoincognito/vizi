/**
 * Browser tests for the start page redesign (docs/SPEC.md 3.12, PBI-1.16):
 * the header, "Open a project from GitHub", the "Private repos" panel with
 * its rows, the earlier token's block, "Add a token", the token guide and
 * "Forget all tokens", the focus, the tab order, contrast, the bundled font
 * and the phone layout. Every token is an obviously fake value; no test
 * reaches the network. The 3.8 behaviour behind the controls is tested in
 * e2e/token.e2e.ts.
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test as base, expect, type Page } from "@playwright/test";
import {
  ACCESS_LINE,
  GUIDE_AFTER,
  GUIDE_STEPS,
  GUIDE_TITLE,
  type GuidePart,
  partsText,
} from "../src/start";
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

const TOKEN = "github_pat_TEST_start_abcd1234";
const TOKEN2 = "github_pat_TEST_start_wxyz9876";
const OLD_KEY = "vizi.githubToken";

const toggle = (page: Page) => page.locator("#private-repos-toggle");
const body = (page: Page) => page.locator("#private-repos-body");
const summary = (page: Page) => page.locator("#private-repos-summary");
const row = (page: Page, owner: string) =>
  page.locator(`[data-testid="token-line"][data-owner="${owner}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 800;

async function openPanel(page: Page) {
  if ((await toggle(page).getAttribute("aria-expanded")) !== "true") await toggle(page).click();
  await expect(body(page)).toBeVisible();
}

async function addToken(page: Page, owner: string, token: string, remember = false) {
  await openPanel(page);
  await page.locator("#owner-input").fill(owner);
  await page.locator("#token-input").fill(token);
  await page.locator("#token-remember").setChecked(remember);
  await page.locator("#token-use").click();
  await expect(row(page, owner)).toBeVisible();
}

async function withOldKey(page: Page) {
  await page.goto("/");
  await page.evaluate(([k, v]) => localStorage.setItem(k as string, v as string), [OLD_KEY, TOKEN]);
  await page.reload();
}

/** The id of the focused element, or its data-testid with its row's owner. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return "body";
    if (el.id) return el.id;
    const owner = el.closest<HTMLElement>("[data-testid=token-line]")?.dataset.owner;
    return `${el.dataset.testid ?? el.tagName}${owner ? `@${owner}` : ""}`;
  });

const storageKeys = (page: Page) =>
  page.evaluate(() =>
    Object.keys(localStorage)
      .sort()
      .map((k) => [k, localStorage.getItem(k)]),
  );

test.describe("the header and the address section (3.12)", () => {
  test("the h1, the help control in the header, the section's h2, the row and the access line", async ({
    page,
  }) => {
    await page.goto("/");
    const h1 = page.locator("header h1");
    await expect(h1).toHaveText("vizi backlog visualizer");
    await expect(
      page.getByRole("heading", { level: 1, name: "vizi backlog visualizer" }),
    ).toBeVisible();
    await expect(h1.locator("span")).toHaveText("backlog visualizer");
    await expect(page.locator("header #help-open")).toBeVisible();
    await expect(page).toHaveTitle("Vizi - backlog visualizer");
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { level: 2, name: "Open a project from GitHub", exact: true }),
    ).toBeVisible();
    await expect(page.locator("#access-line")).toHaveText(ACCESS_LINE);
    const field = await page.locator("#url-input").boundingBox();
    const open = await page.locator("#open-url").boundingBox();
    if (!field || !open) throw new Error("the field or Open has no box");
    if (isPhone(page)) {
      // Open under the field, across the width.
      expect(open.y).toBeGreaterThanOrEqual(field.y + field.height);
      expect(Math.abs(open.width - field.width)).toBeLessThanOrEqual(1);
    } else {
      // One row: Open beside the field.
      expect(open.x).toBeGreaterThanOrEqual(field.x + field.width);
      expect(Math.abs(open.y - field.y)).toBeLessThanOrEqual(1);
    }
    expect(Math.round(open.height)).toBe(48);
    expect(Math.round(field.height)).toBe(48);
  });
});

test.describe("the Private repos panel (3.12)", () => {
  test("is folded at start, opens and folds with Enter and Space, keeps the focus, and is folded again after a reload with nothing stored", async ({
    page,
  }) => {
    await page.goto("/");
    const before = await storageKeys(page);
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
    await expect(toggle(page)).toHaveAttribute("aria-controls", "private-repos-body");
    await expect(body(page)).toBeHidden();
    await expect(summary(page)).toHaveText("No tokens");
    expect(await toggle(page).evaluate((b) => b.parentElement?.tagName)).toBe("H2");
    await toggle(page).focus();
    await page.keyboard.press("Enter");
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "true");
    await expect(body(page)).toBeVisible();
    expect(await focused(page)).toBe("private-repos-toggle");
    await page.keyboard.press("Space");
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
    await expect(body(page)).toBeHidden();
    expect(await focused(page)).toBe("private-repos-toggle");
    await page.keyboard.press("Space");
    await expect(body(page)).toBeVisible();
    await page.reload();
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
    await expect(body(page)).toBeHidden();
    expect(await storageKeys(page)).toEqual(before);
  });

  test("two owners' rows: each masked, with its own box and Forget, their accessible names, and the summary in both states", async ({
    page,
  }) => {
    await page.goto("/");
    await addToken(page, "acme", TOKEN, true);
    await addToken(page, "fomo-t", TOKEN2);
    await expect(page.getByRole("list", { name: "Tokens" })).toBeVisible();
    for (const [owner, masked, saved] of [
      ["acme", "github_pat_…1234", true],
      ["fomo-t", "github_pat_…9876", false],
    ] as const) {
      await expect(row(page, owner).getByTestId("token-owner")).toHaveText(owner);
      await expect(row(page, owner).getByTestId("token-text")).toHaveText(masked);
      const box = row(page, owner).getByRole("checkbox", {
        name: `Remember in this browser, ${owner}`,
        exact: true,
      });
      await expect(box).toBeVisible();
      if (saved) await expect(box).toBeChecked();
      else await expect(box).not.toBeChecked();
      await expect(
        row(page, owner).getByRole("button", {
          name: `Forget the token for ${owner}`,
          exact: true,
        }),
      ).toBeVisible();
      await expect(row(page, owner)).not.toContainText("saved in this browser");
      await expect(row(page, owner)).not.toContainText("for this page only");
    }
    await expect(summary(page)).toHaveText("2 tokens");
    await toggle(page).click();
    await expect(summary(page)).toHaveText("2 tokens: acme, fomo-t");
    await expect(page.locator("#token-status")).toHaveCount(0);
    await expect(page.getByText("Tokens in use")).toHaveCount(0);
  });

  test("a token saved by an earlier vizi: one highlighted group with its sentence; Keep and Forget it; the summary names it", async ({
    page,
  }) => {
    await withOldKey(page);
    await expect(summary(page)).toHaveText(
      "No tokens; a token saved by an earlier vizi needs its owner",
    );
    await openPanel(page);
    const block = page.getByRole("group", {
      name: "A token saved by an earlier vizi (github_pat_…1234) has no owner yet. Whose repos is it for?",
    });
    await expect(block).toBeVisible();
    await expect(block.locator("strong")).toHaveText("A token saved by an earlier vizi");
    const [bg, card] = await page.evaluate(() => [
      getComputedStyle(document.getElementById("token-migrate") as HTMLElement).backgroundColor,
      getComputedStyle(document.getElementById("private-repos") as HTMLElement).backgroundColor,
    ]);
    expect(bg).not.toBe(card);
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
    await expect(block.getByLabel("Owner")).toHaveAttribute("placeholder", "e.g. factoincognito");
    await expect(page.locator("#migrate-keep")).toHaveText("Keep");
    await expect(page.locator("#migrate-forget")).toHaveText("Forget it");
    await expect(summary(page)).toHaveText(
      "No tokens; a token saved by an earlier vizi needs its owner",
    );

    await page.locator("#migrate-owner").fill("acme");
    await page.locator("#migrate-keep").click();
    await expect(block).toBeHidden();
    await expect(row(page, "acme").getByTestId("token-remember-owner")).toBeChecked();
    expect(await page.evaluate((k) => localStorage.getItem(k), OLD_KEY)).toBeNull();
    await expect(summary(page)).toHaveText("1 token");

    await withOldKey(page);
    await openPanel(page);
    await page.locator("#migrate-forget").click();
    await expect(page.locator("#token-migrate")).toBeHidden();
    expect(await page.evaluate((k) => localStorage.getItem(k), OLD_KEY)).toBeNull();
    await expect(summary(page)).toHaveText("1 token");
  });

  test("Forget all tokens is shown only while a token is held", async ({ page }) => {
    await page.goto("/");
    await openPanel(page);
    const all = page.getByRole("button", { name: "Forget all tokens", exact: true });
    await expect(all).toBeHidden();
    await addToken(page, "acme", TOKEN);
    await expect(all).toBeVisible();
    await all.click();
    await expect(all).toBeHidden();
    await expect(page.getByTestId("token-line")).toHaveCount(0);
  });

  test("Add a token: its group, labels and placeholders, the box before Add, and the note", async ({
    page,
  }) => {
    await page.goto("/");
    await openPanel(page);
    const group = page.getByRole("group", { name: "Add a token" });
    await expect(group.getByRole("heading", { level: 3, name: "Add a token" })).toBeVisible();
    await expect(group.getByLabel("Owner", { exact: true })).toHaveAttribute(
      "placeholder",
      "owner",
    );
    await expect(group.getByLabel("Fine-grained token, read-only")).toHaveAttribute(
      "placeholder",
      "github_pat_…",
    );
    await expect(page.locator("#token-use")).toHaveText("Add");
    await expect(group.getByLabel("Remember in this browser")).not.toBeChecked();
    const order = await page.evaluate(
      () =>
        (document.getElementById("token-remember") as HTMLElement).compareDocumentPosition(
          document.getElementById("token-use") as HTMLElement,
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(order).toBeTruthy();
    for (const id of ["owner-input", "token-input", "token-use", "token-remember"]) {
      expect(await page.locator(`#${id}`).evaluate((el) => el.closest("form")), id).toBeNull();
    }
  });
});

test.describe("the token guide (3.12)", () => {
  test("is folded at start, opens with the keyboard, and shows the six steps and the paragraph of src/start.ts", async ({
    page,
  }) => {
    await page.goto("/");
    await openPanel(page);
    const guide = page.locator("#token-guide-toggle");
    await expect(guide).toHaveText(GUIDE_TITLE);
    await expect(guide).toHaveAttribute("aria-expanded", "false");
    await expect(guide).toHaveAttribute("aria-controls", "token-guide-body");
    await expect(page.locator("#token-guide-body")).toBeHidden();
    await guide.focus();
    await page.keyboard.press("Enter");
    await expect(guide).toHaveAttribute("aria-expanded", "true");
    const steps = page.locator("#token-guide-body ol > li");
    await expect(steps).toHaveText(GUIDE_STEPS.map(partsText));
    await expect(page.locator("#token-guide-body > p")).toHaveText(partsText(GUIDE_AFTER));
    const strongs = (parts: readonly GuidePart[]) =>
      parts.filter((p) => p.kind === "strong").map((p) => p.text);
    await expect(page.locator("#token-guide-body strong")).toHaveText([
      ...GUIDE_STEPS.flatMap(strongs),
      ...strongs(GUIDE_AFTER),
    ]);
    await page.keyboard.press("Space");
    await expect(page.locator("#token-guide-body")).toBeHidden();
  });
});

test.describe("the focus (3.12, Accessibility)", () => {
  test("after a row's Forget it moves to the toggle; after Remember it stays on the same box", async ({
    page,
  }) => {
    await page.goto("/");
    await addToken(page, "acme", TOKEN);
    await addToken(page, "fomo-t", TOKEN2);
    await row(page, "fomo-t").getByTestId("token-remember-owner").focus();
    await page.keyboard.press("Space");
    await expect(row(page, "fomo-t").getByTestId("token-remember-owner")).toBeChecked();
    expect(await focused(page)).toBe("token-remember-owner@fomo-t");
    await row(page, "acme").getByTestId("token-forget").focus();
    await page.keyboard.press("Enter");
    await expect(row(page, "acme")).toHaveCount(0);
    expect(await focused(page)).toBe("private-repos-toggle");
  });

  test("after Forget all tokens and after Keep it moves to the toggle", async ({ page }) => {
    await page.goto("/");
    await addToken(page, "acme", TOKEN);
    await page.locator("#token-forget-all").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#token-forget-all")).toBeHidden();
    expect(await focused(page)).toBe("private-repos-toggle");

    await withOldKey(page);
    await openPanel(page);
    await page.locator("#migrate-owner").fill("acme");
    await page.locator("#migrate-keep").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#token-migrate")).toBeHidden();
    expect(await focused(page)).toBe("private-repos-toggle");
  });

  test("after a forget in another tab: to the toggle when its control is gone, on the same control when it is not", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await addToken(page, "acme", TOKEN, true);
    await addToken(page, "fomo-t", TOKEN2, true);
    const other = await context.newPage();
    await other.goto("/");
    await openPanel(other);

    await row(page, "acme").getByTestId("token-forget").focus();
    await row(other, "fomo-t").getByTestId("token-forget").click();
    await expect(row(page, "fomo-t")).toHaveCount(0);
    expect(await focused(page)).toBe("token-forget@acme");

    await row(other, "acme").getByTestId("token-forget").click();
    await expect(row(page, "acme")).toHaveCount(0);
    expect(await focused(page)).toBe("private-repos-toggle");
  });
});

test.describe("the tab order (3.12, Accessibility)", () => {
  test("follows the page: help, address, Open, the toggle, each row, the earlier token, Add a token, the guide, Forget all tokens, the footer's link", async ({
    page,
  }) => {
    await withOldKey(page);
    await addToken(page, "acme", TOKEN);
    await addToken(page, "fomo-t", TOKEN2);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    const seen: string[] = [];
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press("Tab");
      seen.push(await focused(page));
    }
    expect(seen).toEqual([
      "help-open",
      "url-input",
      "open-url",
      "private-repos-toggle",
      "token-remember-owner@acme",
      "token-forget@acme",
      "token-remember-owner@fomo-t",
      "token-forget@fomo-t",
      "migrate-owner",
      "migrate-keep",
      "migrate-forget",
      "owner-input",
      "token-input",
      "token-remember",
      "token-use",
      "token-guide-toggle",
      "token-forget-all",
      "notices-link",
    ]);
    // The footer's link is the page's last control.
    await page.keyboard.press("Tab");
    expect(seen).not.toContain(await focused(page));
  });
});

test.describe("contrast (3.12, Light, dark and phone)", () => {
  test("every visible text at least 4.5:1, every placeholder 4.5:1 against its field, every field's border 3:1", async ({
    page,
  }) => {
    await withOldKey(page);
    await addToken(page, "acme", TOKEN, true);
    await page.locator("#token-guide-toggle").click();
    await expect(page.locator("#token-guide-body")).toBeVisible();
    const problems = await page.evaluate(() => {
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
      /** The nearest opaque background: the element's own, else its nearest ancestor's. */
      const background = (el: Element | null): number[] => {
        for (let e = el; e; e = e.parentElement) {
          const c = rgba(getComputedStyle(e).backgroundColor);
          if (c[3] === 1) return c;
        }
        return rgba(getComputedStyle(document.documentElement).backgroundColor);
      };
      const out: string[] = [];
      const start = [...document.querySelectorAll("header *, #start *, footer *")].filter(
        (el) => (el as HTMLElement).checkVisibility?.() !== false,
      );
      for (const el of start) {
        const hasText = [...el.childNodes].some(
          (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim() !== "",
        );
        if (hasText) {
          const r = ratio(rgba(getComputedStyle(el).color), background(el));
          if (r < 4.5)
            out.push(
              `text ${el.tagName}#${el.id} "${el.textContent?.trim().slice(0, 30)}" ${r.toFixed(2)}`,
            );
        }
      }
      for (const field of document.querySelectorAll<HTMLInputElement>(
        "input[type=text], input[type=password], input:not([type])",
      )) {
        if (!field.checkVisibility()) continue;
        const own = background(field);
        const ph = ratio(rgba(getComputedStyle(field, "::placeholder").color), own);
        if (field.placeholder && ph < 4.5) out.push(`placeholder #${field.id} ${ph.toFixed(2)}`);
        const border = ratio(
          rgba(getComputedStyle(field).borderTopColor),
          background(field.parentElement),
        );
        if (border < 3) out.push(`border #${field.id} ${border.toFixed(2)}`);
      }
      return out;
    });
    expect(problems).toEqual([]);
  });
});

test.describe("the font (3.12)", () => {
  test("the page's three Inter faces, 400, 600 and 700, are loaded", async ({ page }) => {
    await page.goto("/");
    const faces = await page.evaluate(async () => {
      await document.fonts.ready;
      for (const w of [400, 600, 700]) await document.fonts.load(`${w} 16px Inter`);
      return [...document.fonts]
        .filter((f) => f.family.replace(/["']/g, "") === "Inter")
        .map((f) => [f.weight, f.status])
        .sort();
    });
    expect(faces).toEqual([
      ["400", "loaded"],
      ["600", "loaded"],
      ["700", "loaded"],
    ]);
  });

  test("the footer credits it and links to the notices in a new tab", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toHaveText(
      "Font: Inter, copyright 2016 The Inter Project Authors, SIL Open Font License 1.1. Third-party notices",
    );
    const link = page.locator("footer a");
    await expect(link).toHaveText("Third-party notices");
    await expect(link).toHaveAttribute(
      "href",
      "https://github.com/factoincognito/vizi/blob/main/THIRD-PARTY-NOTICES.md",
    );
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

test.describe("the phone (3.12, below 800 px)", () => {
  test("no sideways scroll with everything opened, and every control at least 44 px high", async ({
    page,
  }) => {
    test.skip(!isPhone(page), "the phone layout only");
    await withOldKey(page);
    await addToken(page, "a-rather-long-organisation-name-for-wrapping", TOKEN, true);
    await addToken(page, "fomo-t", TOKEN2);
    await page.locator("#token-guide-toggle").click();
    await expect(page.locator("#token-guide-body")).toBeVisible();
    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(sideways).toBeLessThanOrEqual(0);
    const small = await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLElement>(
          "button, input:not([type=checkbox]), label:has(> input[type=checkbox])",
        ),
      ]
        .filter((el) => el.checkVisibility())
        .map(
          (el) =>
            [
              el.id || el.dataset.testid || el.textContent?.trim(),
              el.getBoundingClientRect().height,
            ] as const,
        )
        .filter(([, h]) => h < 44),
    );
    expect(small).toEqual([]);
  });
});
