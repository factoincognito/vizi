/**
 * The backlog parser (docs/BACKLOG-FORMAT.md, rules R0 to R9 and the
 * report kinds of section 3). Pure: it takes the file's text and returns
 * the entries, the headings and the report of what it skipped or guessed.
 * The report is not a second pass: it is what this same parser found.
 */
import { heading, indentOf, isBlank, type Line, listItem, type ReportItem, scan } from "./scan";

export type { ReportItem, ReportKind } from "./scan";

/** The markers of the template's legend (docs/BACKLOG-FORMAT.md section 3). */
export const RECOMMENDED_MARKERS: readonly string[] = [
  "NOW",
  "NEXT",
  "LATER",
  "IDEA",
  "BLOCKED",
  "DONE",
  "SUPERSEDED",
  "MOVED",
];

export interface BacklogEntry {
  marker: string;
  id: string | null;
  notes: string[];
  /** The text after the bold, notes and dash (R3): title and the rest of the head. */
  text: string;
  title: string;
  description: string;
  /** The rest of the head after the title: the first line of the description when not empty (SPEC 3.7 item 2). */
  headRest: string;
  /** Text of the nearest heading above (R6), or null. */
  group: string | null;
  /** The line the entry starts on (R8). */
  line: number;
}

export interface BacklogHeading {
  level: number;
  text: string;
  line: number;
}

export interface BacklogResult {
  entries: BacklogEntry[];
  /** Headings in file order (R5). */
  groups: BacklogHeading[];
  report: ReportItem[];
}

const ID = "[A-Z]{2,}-(?:[A-Z0-9][A-Za-z0-9.]*[A-Za-z0-9]|[A-Z0-9])";
const ID_INSIDE = new RegExp(`^ (${ID})$`);
const ID_AFTER = new RegExp(`^ +(${ID})(?![A-Za-z0-9_-])`);
const BOLD_MARKER = /^\*\*\[([A-Z]+)\]/;
const ANY_MARKER = /^(?:\*\*)?\[[A-Z]+\]/;

function item(kind: ReportItem["kind"], code: string, line: number, message: string): ReportItem {
  return { kind, code, line, message };
}

/** R3: the head is the entry line plus the indented lines right under it that are not blank, fences or list items. */
function readHead(lines: Line[], i: number, firstBody: string): { head: string; next: number } {
  const parts = [firstBody.trim()];
  let j = i + 1;
  for (; j < lines.length; j++) {
    const l = lines[j];
    if (!l || l.fence || isBlank(l.text) || indentOf(l.text) === 0 || listItem(l.text)) break;
    parts.push(l.text.trim());
  }
  return { head: parts.join(" "), next: j };
}

/** R3: reads `(note)` groups, nesting parentheses. Returns where they end and whether the last one never closed. */
function readNotes(
  head: string,
  from: number,
): { notes: string[]; end: number; unclosed: boolean } {
  const notes: string[] = [];
  let p = from;
  for (;;) {
    let q = p;
    while (head[q] === " ") q++;
    if (head[q] !== "(") return { notes, end: p, unclosed: false };
    let depth = 0;
    let k = q;
    for (; k < head.length; k++) {
      if (head[k] === "(") depth++;
      else if (head[k] === ")") depth--;
      if (depth === 0) break;
    }
    if (depth !== 0) {
      notes.push(head.slice(q + 1).trim());
      return { notes, end: head.length, unclosed: true };
    }
    notes.push(head.slice(q + 1, k).trim());
    p = k + 1;
  }
}

/** R4: the first sentence of the text, its full stop included. */
function splitTitle(text: string): { title: string; rest: string } {
  let ticks = false;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "`") ticks = !ticks;
    else if (!ticks && c === "(") depth++;
    else if (!ticks && c === ")" && depth > 0) depth--;
    else if (!ticks && depth === 0 && c === "." && (i === text.length - 1 || text[i + 1] === " ")) {
      return { title: text.slice(0, i + 1), rest: text.slice(i + 1).trim() };
    }
  }
  return { title: text, rest: "" };
}

/** R4: the lines after the head, up to the next non-blank column-0 line that is not inside a fence opened in the description. */
function readDescription(lines: Line[], from: number, headRest: string): string {
  const out: string[] = headRest === "" ? [] : [headRest];
  for (let j = from; j < lines.length; j++) {
    const l = lines[j];
    if (!l) break;
    if (l.fence) {
      // The head always stops at a fence line, so the first one met here is an opener.
      if (l.fence === "open" && indentOf(l.text) === 0) break;
    } else if (indentOf(l.text) === 0 && !isBlank(l.text)) {
      break;
    }
    out.push(l.text.replace(/\s+$/, ""));
  }
  while (out.length > 0 && isBlank(out[out.length - 1] ?? "")) out.pop();
  while (out.length > 0 && isBlank(out[0] ?? "")) out.shift();
  return out.join("\n");
}

export function parse(source: string): BacklogResult {
  const { lines, report } = scan(source);
  const entries: BacklogEntry[] = [];
  const groups: BacklogHeading[] = [];
  const seen = new Set<string>();
  let group: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.fence) continue;
    const h = heading(line.text);
    if (h) {
      groups.push({ level: h.level, text: h.text, line: line.number });
      group = h.text;
      continue;
    }
    const li = listItem(line.text);
    if (!li) continue;
    const at = line.number;
    const marked = ANY_MARKER.test(li.body);

    if (li.indent !== 0) {
      if (marked)
        report.push(
          item("error", "not-read", at, "A marked item that is indented is not an entry."),
        );
      continue;
    }
    if (!marked) {
      report.push(
        item("info", "unmarked-item", at, "A list item without a marker is not an entry."),
      );
      continue;
    }
    const { head, next } = readHead(lines, i, li.body);
    const m = BOLD_MARKER.exec(head);
    const close = m ? head.indexOf("**", m[0].length) : -1;
    if (!m?.[1] || close < 0) {
      report.push(
        item("error", "not-read", at, "A marked item that is not in bold is not an entry."),
      );
      continue;
    }

    const marker = m[1];
    const insideRest = head.slice(m[0].length, close);
    let id: string | null = null;
    let afterBold = close + 2;
    let leading = "";
    const problems: ReportItem[] = [];
    if (insideRest === "") {
      const outside = ID_AFTER.exec(head.slice(afterBold));
      if (outside?.[1]) {
        id = outside[1];
        afterBold += outside[0].length;
        problems.push(
          item("warning", "id-outside-bold", at, "The ID stands after the bold marker."),
        );
      } else {
        problems.push(item("warning", "no-id", at, "The entry has no ID."));
      }
    } else {
      const inside = ID_INSIDE.exec(insideRest);
      if (inside?.[1]) {
        id = inside[1];
      } else {
        leading = insideRest.trim();
        problems.push(
          item(
            "warning",
            "text-in-bold",
            at,
            "The bold marker holds other text besides the marker and one ID.",
          ),
        );
      }
    }

    const { notes, end, unclosed } = readNotes(head, afterBold);
    let text = "";
    if (unclosed) {
      problems.push(item("warning", "unclosed-note", at, "The parentheses of a note never close."));
    } else {
      const rest = head.slice(end);
      const dash = /^ +— +/.exec(rest);
      if (!dash)
        problems.push(item("warning", "no-dash", at, "No ' — ' separator after the ID and notes."));
      const after = dash ? rest.slice(dash[0].length) : rest.trim();
      text = [leading, after].filter((s) => s !== "").join(" ");
    }
    if (!RECOMMENDED_MARKERS.includes(marker)) {
      problems.push(
        item(
          "warning",
          "unknown-marker",
          at,
          `The marker ${marker} is not in the recommended set.`,
        ),
      );
    }
    if (id !== null) {
      if (seen.has(id))
        problems.push(
          item("warning", "duplicate-id", at, `The ID ${id} is used by an earlier entry.`),
        );
      seen.add(id);
    }

    const { title, rest } = splitTitle(text);
    entries.push({
      marker,
      id,
      notes,
      text,
      title,
      description: readDescription(lines, next, rest),
      headRest: rest,
      group,
      line: at,
    });
    report.push(...problems);
  }

  report.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
  return { entries, groups, report };
}
