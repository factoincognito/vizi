/**
 * Tests for the stray-request guard (e2e/guard.ts). No page is opened.
 */
import { expect, test } from "@playwright/test";
import { isAllowedRequest } from "./guard";

const own = ["http://localhost:4173/", "file:///work/vizi/dist/index.html"];

test.describe("the stray-request guard", () => {
  for (const url of [
    "http://localhost:4173/",
    "file:///work/vizi/dist/index.html",
    "https://api.github.com/repos/acme/widgets",
    "https://raw.githubusercontent.com/acme/widgets/main/STATUS.md",
  ]) {
    test(`allows ${url}`, () => {
      expect(isAllowedRequest(url, own)).toBe(true);
    });
  }

  for (const url of [
    "file:///etc/passwd",
    "file:///work/vizi/dist/other.html",
    "file:///work/vizi/dist/index.html?x=1",
    "http://localhost:4173/other",
    "http://localhost:4173/index.html",
    "https://api.github.com.evil.example/",
    "https://raw.githubusercontent.com.evil.example/x",
    "https://evil.example/",
    "https://github.com/acme/widgets",
    "data:text/plain,x",
  ]) {
    test(`refuses ${url}`, () => {
      expect(isAllowedRequest(url, own)).toBe(false);
    });
  }
});
