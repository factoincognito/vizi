/**
 * Shared first pass over a Markdown file's lines (docs/BACKLOG-FORMAT.md):
 * fences (R7) and HTML comments (R9) are found in one pass from the top,
 * and the small helpers the backlog and status readers both use (list
 * items R0, headings R5). Pure: no DOM, no I/O.
 */

export type ReportKind = "error" | "warning" | "info";

/** One thing the parsers skipped or guessed. `line` counts from 1 (R8); null when no line applies. */
export interface ReportItem {
  kind: ReportKind;
  code: string;
  line: number | null;
  message: string;
}

export interface Line {
  /** Line number from 1 (R8). */
  number: number;
  /** The line's text with comments dropped (R9). Fence lines are kept as they are. */
  text: string;
  /** Whether this line opens, is inside, or closes a fence (R7); null outside fences. */
  fence: "open" | "inside" | "close" | null;
}

/** An HTML comment R9 found, on the line it opens on (docs/SPEC.md 3.15: include lines are read in this pass). */
export interface Comment {
  /** The line the comment opens on (R8). */
  line: number;
  /** The indent before its `<!--`. */
  indent: number;
  /** The line's text from its `<!--` to the end of the line, as written: the text after a `-->` on it included. */
  text: string;
}

export interface Scanned {
  lines: Line[];
  /** Info items: a fence or a comment that never closes. */
  report: ReportItem[];
  /** The comments, in file order. */
  comments: Comment[];
}

const FENCE_OPEN = /^(`{3,}|~{3,})/;

export function indentOf(text: string): number {
  return text.length - text.trimStart().length;
}

export function isBlank(text: string): boolean {
  return text.trim() === "";
}

export function scan(source: string): Scanned {
  const raw = source.replace(/^﻿/, "").split(/\r?\n/);
  const lines: Line[] = [];
  const report: ReportItem[] = [];
  const comments: Comment[] = [];
  let fence: { char: string; length: number; line: number } | null = null;
  let commentLine: number | null = null;

  for (const [i, original] of raw.entries()) {
    const number = i + 1;
    if (commentLine !== null) {
      const end = original.indexOf("-->");
      if (end < 0) {
        lines.push({ number, text: "", fence: null });
      } else {
        lines.push({
          number,
          text: original.slice(0, indentOf(original)) + original.slice(end + 3),
          fence: null,
        });
        commentLine = null;
      }
      continue;
    }
    if (fence) {
      const closer = new RegExp(`^\\s*${fence.char === "`" ? "`" : "~"}{${fence.length},}\\s*$`);
      if (closer.test(original)) {
        lines.push({ number, text: original, fence: "close" });
        fence = null;
      } else {
        lines.push({ number, text: original, fence: "inside" });
      }
      continue;
    }
    const indent = indentOf(original);
    const body = original.slice(indent);
    if (body.startsWith("<!--")) {
      comments.push({ line: number, indent, text: body });
      const end = original.indexOf("-->", indent + 4);
      if (end < 0) {
        commentLine = number;
        lines.push({ number, text: "", fence: null });
      } else {
        lines.push({
          number,
          text: original.slice(0, indent) + original.slice(end + 3),
          fence: null,
        });
      }
      continue;
    }
    const opener = FENCE_OPEN.exec(body);
    if (opener?.[1]) {
      fence = { char: opener[1].charAt(0), length: opener[1].length, line: number };
      lines.push({ number, text: original, fence: "open" });
      continue;
    }
    lines.push({ number, text: original, fence: null });
  }

  if (fence) {
    report.push({
      kind: "info",
      code: "unclosed-fence",
      line: fence.line,
      message: "A code fence never closes; the rest of the file is read as inside it.",
    });
  }
  if (commentLine !== null) {
    report.push({
      kind: "info",
      code: "unclosed-comment",
      line: commentLine,
      message: "An HTML comment never closes; the rest of the file is dropped.",
    });
  }
  return { lines, report, comments };
}

/** R0: a list item is `- `, `* ` or `1. ` after any indent. Returns the text after the marker. */
export function listItem(text: string): { indent: number; body: string } | null {
  const indent = indentOf(text);
  const m = /^(?:[-*]|\d+\.) /.exec(text.slice(indent));
  if (!m) return null;
  return { indent, body: text.slice(indent + m[0].length) };
}

/** R5: a heading starts at column 0 with one to six # and a space. */
export function heading(text: string): { level: number; text: string } | null {
  const m = /^(#{1,6}) (.*)$/.exec(text);
  if (!m?.[1]) return null;
  return { level: m[1].length, text: stripClosingHashes((m[2] ?? "").trim()) };
}

/** Drops a closing run of # when it is the whole text or follows whitespace. Linear: no backtracking regex. */
function stripClosingHashes(text: string): string {
  let k = text.length;
  while (k > 0 && text[k - 1] === "#") k--;
  if (k === text.length || (k > 0 && !/\s/.test(text[k - 1] ?? ""))) return text;
  return text.slice(0, k).trim();
}
