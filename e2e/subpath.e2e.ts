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
