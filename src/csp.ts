/// <reference types="node" />
/**
 * The Content-Security-Policy of docs/SPEC.md 2.3, added to the built page.
 *
 * Build-time code, never part of the page: it takes the built `index.html`
 * (script and style already inlined by the single-file plugin), hashes the
 * one inline script and the one inline style, and writes a `<meta>` policy
 * that allows exactly those two blocks and nothing inline. A page that
 * holds anything else inline is refused, so a hash can never cover more
 * than the build's own code.
 */
import { createHash } from "node:crypto";

/** GitHub's two hosts of docs/SPEC.md 3.1: the only places the page may connect to. */
const CONNECT_HOSTS = ["https://api.github.com", "https://raw.githubusercontent.com"];

/**
 * The CSP source expression for an inline block: `'sha256-<base64>'`. The
 * browser hashes the text as its HTML parser read it, where every line
 * break is LF, so CR LF and CR are turned into LF first.
 */
export function sha256Source(text: string): string {
  const read = text.replace(/\r\n?/g, "\n");
  return `'sha256-${createHash("sha256").update(read, "utf8").digest("base64")}'`;
}

/** The policy text. `script` and `style` are the hash source expressions. */
export function buildPolicy(script: string, style: string): string {
  return [
    "default-src 'none'",
    `script-src ${script}`,
    `style-src ${style}`,
    `connect-src ${CONNECT_HOSTS.join(" ")}`,
    "img-src data:",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
}

const SCRIPT_BLOCK = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const STYLE_BLOCK = /<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi;
const CHARSET_META = /<meta\s+charset\s*=\s*["']?[^>]*>/i;

/** Adds the policy `<meta>` tag after `<meta charset>`. Throws when the page holds anything the policy would not cover. */
export function addCsp(html: string): string {
  const scripts = [...html.matchAll(SCRIPT_BLOCK)];
  const styles = [...html.matchAll(STYLE_BLOCK)];
  const script = scripts[0];
  const style = styles[0];
  if (scripts.length !== 1 || !script) {
    throw new Error(`The page must have exactly one inline script, found ${scripts.length}.`);
  }
  if (styles.length !== 1 || !style) {
    throw new Error(`The page must have exactly one <style> block, found ${styles.length}.`);
  }
  if (/\bsrc\s*=/i.test(script[1] ?? "")) {
    throw new Error("The page's script must be inline, not loaded from a src.");
  }

  // What is left outside the two blocks is the page's markup: text inside a
  // block may look like markup and is not looked at here. A block is blanked
  // out with spaces of the same length, so an offset in the markup is the same
  // offset in the page.
  const blank = (block: string) => " ".repeat(block.length);
  const markup = html.replace(SCRIPT_BLOCK, blank).replace(STYLE_BLOCK, blank);
  if (
    /<link\b[^>]*\brel\s*=\s*["']?[^"'>]*\b(?:stylesheet|modulepreload|preload)\b/i.test(markup)
  ) {
    throw new Error("The page must not link a stylesheet or a script.");
  }
  if (/<[a-z][^>]*[\s/](?:style|on[a-z]+)\s*=/i.test(markup)) {
    throw new Error("The page must have no style attribute and no event handler attribute.");
  }
  // Catches the plain spelling only; a second policy can only narrow what is allowed, so a missed one is harmless.
  if (/http-equiv\s*=\s*["']?content-security-policy/i.test(markup)) {
    throw new Error("The page already has a Content-Security-Policy.");
  }
  // Looked for in the markup, so text inside a script is not taken for the tag. The
  // markup keeps the blocks' places, so an offset in it is the same offset in the page.
  const charset = CHARSET_META.exec(markup);
  if (!charset) throw new Error("The page needs a <meta charset> for the policy to follow.");
  if (charset.index > Math.min(script.index, style.index)) {
    throw new Error("The <meta charset> must come before the page's script and style.");
  }

  const policy = buildPolicy(sha256Source(script[2] ?? ""), sha256Source(style[2] ?? ""));
  const tag = `<meta http-equiv="Content-Security-Policy" content="${policy}" />`;
  const end = charset.index + charset[0].length;
  const gap = /^\s*/.exec(html.slice(end))?.[0] ?? "";
  return `${html.slice(0, end)}${gap}${tag}${html.slice(end)}`;
}
