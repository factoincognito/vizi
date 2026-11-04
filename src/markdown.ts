/**
 * Markdown to a tree of allowed nodes, under the rendering contract of
 * docs/SPEC.md 3.7. Text from a project is untrusted: this module returns
 * data, never HTML, and the page builds elements from it with calls that
 * set text. Raw HTML is plain text, HTML comments are dropped, and a link
 * is only produced for the targets 3.7 item 4 allows.
 *
 * It is a small reader, not CommonMark: headings, paragraphs, lists, block
 * quotes, fenced code, emphasis, code spans and links. Everything else is
 * text. Hostile input must stay fast: every search for a closing delimiter
 * that fails is remembered, and nesting is capped.
 */
import { heading as atxHeading, scan } from "./scan";

export type LinkTarget =
  | { kind: "external"; href: string; newTab: boolean }
  | { kind: "file"; path: string }
  | { kind: "anchor"; id: string };

export type Inline =
  | { t: "text"; text: string }
  | { t: "code"; text: string }
  | { t: "em"; children: Inline[] }
  | { t: "strong"; children: Inline[] }
  | { t: "link"; target: LinkTarget; children: Inline[] };

export type Block =
  | { t: "heading"; level: number; slug: string; children: Inline[] }
  | { t: "paragraph"; children: Inline[] }
  | { t: "list"; ordered: boolean; items: Block[][] }
  | { t: "quote"; children: Block[] }
  | { t: "code"; lang: string; text: string };

export interface RenderOptions {
  /** The project path of the file being rendered, to resolve relative links against. */
  basePath?: string;
  /** Turns a normalised project path into a link, or null (the link stays text). */
  resolveFile?: (path: string) => LinkTarget | null;
  /** Turns a code span's text into a link when it names a project file, or null. */
  codePathLink?: (code: string) => LinkTarget | null;
}

const MAX_DEPTH = 12;
function hasControl(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x20 || (c >= 0x7f && c <= 0x9f)) return true;
  }
  return false;
}

/** Joins a relative path to the directory of `base` and normalises it. Null when it leaves the project or is empty. */
export function resolvePath(base: string, rel: string): string | null {
  const cut = rel.search(/[?#]/);
  let path = cut >= 0 ? rel.slice(0, cut) : rel;
  try {
    path = decodeURI(path);
  } catch {
    return null;
  }
  const parts = path.startsWith("/") ? [] : base.split("/").slice(0, -1);
  for (const seg of path.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") {
      if (parts.length === 0) return null;
      parts.pop();
    } else {
      parts.push(seg);
    }
  }
  return parts.length > 0 ? parts.join("/") : null;
}

/** 3.7 item 4: the only targets that become links. Null: show the link's text with no link. */
export function classifyTarget(raw: string, opts: RenderOptions): LinkTarget | null {
  const t = raw.trim();
  if (t === "" || hasControl(t)) return null;
  if (t.startsWith("#")) return t.length > 1 ? { kind: "anchor", id: t.slice(1) } : null;
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(t)) {
    if (!/^https?:\/\//i.test(t)) return null;
    try {
      const url = new URL(t);
      return url.hostname === "" ? null : { kind: "external", href: url.href, newTab: true };
    } catch {
      return null;
    }
  }
  if (t.startsWith("//") || t.includes("\\")) return null;
  const firstSegment = t.split("/")[0] ?? "";
  if (firstSegment.includes(":")) return null;
  const path = resolvePath(opts.basePath ?? "", t);
  return path === null ? null : (opts.resolveFile?.(path) ?? null);
}

// ---------------------------------------------------------------- inline

function textNode(text: string): Inline {
  return { t: "text", text };
}

/** Appends nodes, joining neighbouring text. */
function push(out: Inline[], node: Inline): void {
  const last = out[out.length - 1];
  if (node.t === "text" && last?.t === "text") last.text += node.text;
  else out.push(node);
}

const PUNCT = /[!-/:-@[-`{-~]/;

/** Index of the `]` that closes the `[` at `open`, or -1. */
function closingBracket(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const c = s.charAt(i);
    if (c === "\\") i++;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) return i;
  }
  return -1;
}

/** Reads `(destination "title")` starting at the `(`. Returns the destination and the index after `)`. */
function readDestination(s: string, open: number): { dest: string; end: number } | null {
  let i = open + 1;
  while (s.charAt(i) === " ") i++;
  let dest: string;
  if (s.charAt(i) === "<") {
    const close = s.indexOf(">", i + 1);
    if (close < 0 || s.slice(i + 1, close).includes("\n")) return null;
    dest = s.slice(i + 1, close);
    i = close + 1;
  } else {
    const start = i;
    let depth = 0;
    for (; i < s.length; i++) {
      const c = s.charAt(i);
      if (c === " ") break;
      if (c === "(") depth++;
      else if (c === ")") {
        if (depth === 0) break;
        depth--;
      }
    }
    dest = s.slice(start, i);
  }
  while (s.charAt(i) === " ") i++;
  const q = s.charAt(i);
  if (q === '"' || q === "'") {
    const close = s.indexOf(q, i + 1);
    if (close < 0) return null;
    i = close + 1;
    while (s.charAt(i) === " ") i++;
  }
  return s.charAt(i) === ")" ? { dest, end: i + 1 } : null;
}

export function renderInline(src: string, opts: RenderOptions = {}): Inline[] {
  return parseInline(src, opts, 0);
}

function parseInline(src: string, opts: RenderOptions, depth: number): Inline[] {
  const out: Inline[] = [];
  /** For each delimiter, the position from which a closing search already failed. */
  const failedFrom = new Map<string, number>();
  const failed = (key: string, at: number) => {
    const f = failedFrom.get(key);
    return f !== undefined && at >= f;
  };
  const fail = (key: string, at: number) => {
    if (!failedFrom.has(key)) failedFrom.set(key, at);
  };
  let i = 0;
  while (i < src.length) {
    const c = src.charAt(i);

    if (c === "\\" && PUNCT.test(src.charAt(i + 1))) {
      push(out, textNode(src.charAt(i + 1)));
      i += 2;
      continue;
    }

    if (c === "`") {
      let n = 1;
      while (src.charAt(i + n) === "`") n++;
      const key = `\`${n}`;
      let close = -1;
      if (!failed(key, i)) {
        for (let k = src.indexOf("`", i + n); k >= 0; ) {
          let m = 1;
          while (src.charAt(k + m) === "`") m++;
          if (m === n) {
            close = k;
            break;
          }
          k = src.indexOf("`", k + m);
        }
        if (close < 0) fail(key, i);
      }
      if (close >= 0) {
        let code = src.slice(i + n, close);
        if (code.length > 2 && code.startsWith(" ") && code.endsWith(" ") && code.trim() !== "")
          code = code.slice(1, -1);
        const target = opts.codePathLink?.(code) ?? null;
        const node: Inline = { t: "code", text: code };
        push(out, target ? { t: "link", target, children: [node] } : node);
        i = close + n;
      } else {
        push(out, textNode("`".repeat(n)));
        i += n;
      }
      continue;
    }

    if (c === "<" && src.startsWith("<!--", i)) {
      const end = src.indexOf("-->", i + 4);
      if (end >= 0) {
        i = end + 3;
        continue;
      }
    }

    if ((c === "[" || (c === "!" && src.charAt(i + 1) === "[")) && !failed("[", i)) {
      const image = c === "!";
      const open = image ? i + 1 : i;
      const close = closingBracket(src, open);
      const dest =
        close >= 0 && src.charAt(close + 1) === "(" ? readDestination(src, close + 1) : null;
      if (dest) {
        const label = src.slice(open + 1, close);
        const target = classifyTarget(dest.dest, opts);
        const children =
          image || depth >= MAX_DEPTH ? [textNode(label)] : parseInline(label, opts, depth + 1);
        if (target) push(out, { t: "link", target, children });
        else for (const child of children) push(out, child);
        i = dest.end;
        continue;
      }
      fail("[", i);
    }

    if ((c === "*" || c === "_") && depth < MAX_DEPTH) {
      const double = src.charAt(i + 1) === c;
      const len = double ? 2 : 1;
      const key = c.repeat(len);
      const prev = src.charAt(i - 1);
      const next = src.charAt(i + len);
      const canOpen = next !== "" && !/\s/.test(next) && (c === "*" || !/[A-Za-z0-9]/.test(prev));
      if (canOpen && !failed(key, i)) {
        let close = -1;
        for (let k = src.indexOf(c, i + len); k >= 0; k = src.indexOf(c, k + 1)) {
          const before = src.charAt(k - 1);
          if (/\s/.test(before) || k - 1 < i + len) continue;
          if (double ? src.charAt(k + 1) !== c : src.charAt(k + 1) === c || src.charAt(k - 1) === c)
            continue;
          if (c === "_" && /[A-Za-z0-9]/.test(src.charAt(k + len))) continue;
          close = k;
          break;
        }
        if (close >= 0) {
          const children = parseInline(src.slice(i + len, close), opts, depth + 1);
          push(out, { t: double ? "strong" : "em", children });
          i = close + len;
          continue;
        }
        fail(key, i);
      }
    }

    push(out, textNode(c));
    i++;
  }
  return out;
}

// ----------------------------------------------------------------- block

const FENCE = /^( {0,3})(`{3,}|~{3,})(.*)$/;

function slugOf(inlines: Inline[]): string {
  const text = inlines
    .map((n) => (n.t === "text" || n.t === "code" ? n.text : slugText(n)))
    .join("")
    .toLowerCase();
  return text.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function slugText(n: Inline): string {
  return n.t === "text" || n.t === "code" ? n.text : n.children.map(slugText).join("");
}

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

interface Marker {
  indent: number;
  ordered: boolean;
  /** Width of the marker with its following space. */
  width: number;
  rest: string;
}

function listMarker(line: string): Marker | null {
  const indent = indentOf(line);
  if (indent > 3) return null;
  const body = line.slice(indent);
  const m = /^(?:([-*+])|(\d{1,9})[.)])(?: +|$)/.exec(body);
  if (!m) return null;
  return {
    indent,
    ordered: m[2] !== undefined,
    width: indent + (m[1] ? 1 : (m[2] ?? "").length + 1) + 1,
    rest: body.slice(m[0].length),
  };
}

function startsBlock(line: string): boolean {
  return (
    FENCE.test(line) ||
    /^ {0,3}>/.test(line) ||
    (indentOf(line) < 4 && atxHeading(line.trimStart()) !== null) ||
    listMarker(line) !== null
  );
}

export function render(text: string, opts: RenderOptions = {}): Block[] {
  // Comments are dropped once, at the top, by the same pass as in the parsers (R9).
  const lines = scan(text).lines.map((l) => l.text);
  return parseBlocks(lines, opts, 0);
}

function parseBlocks(lines: string[], opts: RenderOptions, depth: number): Block[] {
  const out: Block[] = [];
  const inline = (s: string) => parseInline(s, opts, 0);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (depth >= MAX_DEPTH) {
      // Deep nesting is shown as plain text, not parsed further.
      out.push({
        t: "paragraph",
        children: [textNode(lines.slice(i).join(" ").replace(/\s+/g, " ").trim())],
      });
      break;
    }

    const fence = FENCE.exec(line);
    if (fence?.[2]) {
      const char = fence[2].charAt(0);
      const len = fence[2].length;
      const indent = (fence[1] ?? "").length;
      const body: string[] = [];
      let j = i + 1;
      const closer = new RegExp(`^ {0,3}${char === "`" ? "`" : "~"}{${len},} *$`);
      for (; j < lines.length; j++) {
        const l = lines[j] ?? "";
        if (closer.test(l)) break;
        body.push(l.slice(Math.min(indent, indentOf(l))));
      }
      out.push({
        t: "code",
        lang: (fence[3] ?? "").trim().split(/\s+/)[0] ?? "",
        text: body.join("\n"),
      });
      i = j + 1;
      continue;
    }

    const stripped = line.trimStart();
    const h = indentOf(line) < 4 ? atxHeading(stripped) : null;
    if (h) {
      const children = inline(h.text);
      out.push({ t: "heading", level: h.level, slug: slugOf(children), children });
      i++;
      continue;
    }

    if (/^ {0,3}>/.test(line)) {
      const inner: string[] = [];
      let j = i;
      for (; j < lines.length; j++) {
        const l = lines[j] ?? "";
        if (/^ {0,3}>/.test(l)) inner.push(l.replace(/^ {0,3}> ?/, ""));
        else if (l.trim() !== "" && !startsBlock(l)) inner.push(l);
        else break;
      }
      out.push({ t: "quote", children: parseBlocks(inner, opts, depth + 1) });
      i = j;
      continue;
    }

    const marker = listMarker(line);
    if (marker) {
      const items: Block[][] = [];
      let j = i;
      while (j < lines.length) {
        const m = listMarker(lines[j] ?? "");
        if (!m || m.ordered !== marker.ordered) break;
        const itemLines = [m.rest];
        let k = j + 1;
        for (; k < lines.length; k++) {
          const l = lines[k] ?? "";
          if (l.trim() === "") {
            let n = k + 1;
            while (n < lines.length && (lines[n] ?? "").trim() === "") n++;
            if (n < lines.length && indentOf(lines[n] ?? "") >= m.width) {
              itemLines.push("");
              continue;
            }
            break;
          }
          if (indentOf(l) >= m.width) itemLines.push(l.slice(m.width));
          else if ((lines[k - 1] ?? "").trim() !== "" && !startsBlock(l))
            itemLines.push(l.trimStart());
          else break;
        }
        items.push(parseBlocks(itemLines, opts, depth + 1));
        j = k;
      }
      out.push({ t: "list", ordered: marker.ordered, items });
      i = j;
      continue;
    }

    const para: string[] = [line.trim()];
    let j = i + 1;
    for (; j < lines.length; j++) {
      const l = lines[j] ?? "";
      if (l.trim() === "" || startsBlock(l)) break;
      para.push(l.trim());
    }
    out.push({ t: "paragraph", children: inline(para.join(" ")) });
    i = j;
  }
  return out;
}
