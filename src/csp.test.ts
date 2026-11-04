/// <reference types="node" />
/**
 * Tests for src/csp.ts: the Content-Security-Policy of docs/SPEC.md 2.3,
 * added to the built page at build time. Synthetic pages only.
 */
import { createHash } from "node:crypto";
import { addCsp, buildPolicy, sha256Source } from "./csp";

const hashOf = (text: string) => `'sha256-${createHash("sha256").update(text).digest("base64")}'`;

const SCRIPT = 'console.log("one");\nwindow.x = 1;\n';
const STYLE = "body{margin:0}\n/*$vite$:1*/";
const page = (extra = "", script = SCRIPT, style = STYLE) =>
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="data:," />
    <title>Synthetic</title>
    <script type="module" crossorigin>${script}</script>
    <style rel="stylesheet" crossorigin>${style}</style>
  </head>
  <body>
    <main id="app"></main>${extra}
  </body>
</html>
`;

/** The policy text of the one CSP meta tag of a page. */
function policyOf(html: string): string {
  const tags = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"\s*\/?>/g);
  expect(tags).toHaveLength(1);
  const m = /content="([^"]*)"/.exec(tags?.[0] ?? "");
  return m?.[1] ?? "";
}

describe("sha256Source", () => {
  it("is the CSP source expression of the SHA-256 of the text, in base64", () => {
    expect(sha256Source("")).toBe("'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='");
    expect(sha256Source("abc")).toBe("'sha256-ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0='");
  });

  it("hashes the text as a browser reads it: line breaks are LF", () => {
    expect(sha256Source("a\r\nb\rc")).toBe(sha256Source("a\nb\nc"));
  });

  it("hashes non-ASCII text as UTF-8", () => {
    expect(sha256Source("åäö")).toBe(hashOf("åäö"));
  });
});

describe("buildPolicy", () => {
  it("is the policy of SPEC 2.3, hashes in place, nothing else allowed", () => {
    expect(buildPolicy("'sha256-AAA='", "'sha256-BBB='")).toBe(
      "default-src 'none'; script-src 'sha256-AAA='; style-src 'sha256-BBB='; " +
        "connect-src https://api.github.com https://raw.githubusercontent.com; " +
        "img-src data:; base-uri 'none'; form-action 'none'",
    );
  });
});

describe("addCsp", () => {
  it("puts one policy tag after <meta charset> and before any script, style or link", () => {
    const out = addCsp(page());
    const tag = out.indexOf('<meta http-equiv="Content-Security-Policy"');
    expect(tag).toBeGreaterThan(out.indexOf('<meta charset="utf-8" />'));
    for (const later of ["<meta name=", "<link", "<script", "<style", "<title"]) {
      expect(tag, later).toBeLessThan(out.indexOf(later));
    }
  });

  it("hashes the exact text of the inline script and the inline style", () => {
    const policy = policyOf(addCsp(page()));
    expect(policy).toContain(`script-src ${hashOf(SCRIPT)};`);
    expect(policy).toContain(`style-src ${hashOf(STYLE)};`);
  });

  it("changes nothing else in the page", () => {
    const html = page();
    const out = addCsp(html);
    expect(out.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/, "")).toBe(html);
  });

  it("allows nothing inline and no eval: no 'unsafe-inline', no 'unsafe-eval'", () => {
    const policy = policyOf(addCsp(page()));
    expect(policy).not.toContain("unsafe-inline");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).toMatch(/^default-src 'none'; /);
  });

  it("lets the page connect only to GitHub's two hosts", () => {
    const policy = policyOf(addCsp(page()));
    expect(policy).toContain(
      "connect-src https://api.github.com https://raw.githubusercontent.com;",
    );
    expect(policy.match(/https?:\/\/[^\s;]+/g)).toEqual([
      "https://api.github.com",
      "https://raw.githubusercontent.com",
    ]);
  });

  it("hashes a script with CRLF line breaks as the browser will read it", () => {
    const crlf = page("", "a();\r\nb();\r\n");
    expect(policyOf(addCsp(crlf))).toContain(`script-src ${hashOf("a();\nb();\n")};`);
  });

  it("is not fooled by text inside the script or style that looks like markup", () => {
    const tricky = page(
      "",
      'el.setAttribute("style", "x"); const s = "<div onclick=1 style=2>";',
      'a::after{content:"<script src=x>"}',
    );
    expect(() => addCsp(tricky)).not.toThrow();
  });

  it.each([
    ["no inline script", page().replace(/<script[\s\S]*?<\/script>/, "")],
    ["two inline scripts", page("<script>1</script>")],
    ["an external script", page('<script src="https://evil.example/x.js"></script>')],
    ["a script with a src and a body", page('<script src="/x.js">1</script>')],
    ["no inline style", page().replace(/<style[\s\S]*?<\/style>/, "")],
    ["two style blocks", page("<style>a{}</style>")],
    ["a stylesheet link", page('<link rel="stylesheet" href="/x.css">')],
    ["a modulepreload link", page('<link rel="modulepreload" href="/x.js">')],
    ["a style attribute", page('<p style="color:red">x</p>')],
    ["an event handler attribute", page('<button onclick="go()">x</button>')],
    ["an uppercase event handler attribute", page('<button ONCLICK="go()">x</button>')],
    ["no <meta charset>", page().replace('<meta charset="utf-8" />', "")],
    [
      "a policy already there",
      page().replace(
        "<title>",
        '<meta http-equiv="Content-Security-Policy" content="default-src *"><title>',
      ),
    ],
  ])(
    "refuses a page with %s, so a hash never covers more than the build's own code",
    (_n, html) => {
      expect(() => addCsp(html)).toThrow();
    },
  );
});
