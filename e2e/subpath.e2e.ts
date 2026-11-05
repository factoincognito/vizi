import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// The site is served under /vizi/ on GitHub Pages. The page is one file with its script and
// style inlined, so nothing may point at a root-relative path such as /assets/x.js or /src/x.ts.
test("the built page has no root-relative references, so it works under a sub-path", () => {
  const html = readFileSync("dist/index.html", "utf8");
  expect(html).not.toMatch(/\b(?:src|href|action|poster)\s*=\s*["']\/(?!\/)/);
  expect(html).not.toMatch(/url\(\s*["']?\/(?!\/)/);
  expect(html).not.toMatch(/import\s*\(?\s*["']\//);
  expect(html).not.toMatch(/<script[^>]+\bsrc\s*=/);
  expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet["']/);
});

// The three Inter faces are inlined as data: URLs, so the page still loads nothing but itself (3.12).
test("every url() in the built page is one of the three inlined WOFF2 fonts, and it holds no token", () => {
  const html = readFileSync("dist/index.html", "utf8");
  const urls = [...html.matchAll(/url\(\s*["']?([^"')\s]+)/g)].map((m) => m[1] ?? "");
  expect(urls).toHaveLength(3);
  for (const u of urls) expect(u.startsWith("data:font/woff2;base64,")).toBe(true);
  expect(new Set(urls).size).toBe(3);
  expect(html).not.toMatch(/github_pat_[A-Za-z0-9_]{10,}/);
});
