/**
 * The STATUS.md reader (docs/BACKLOG-FORMAT.md, section 4, S1 to S5).
 * Pure: it takes the file's text and returns the fields, the blockers
 * and what it could not read.
 */
import { includesElsewhere } from "./include";
import { heading, indentOf, isBlank, type Line, listItem, type ReportItem, scan } from "./scan";

export type { ReportItem, ReportKind } from "./scan";

/** S5: a blocker that starts with one of these waits on the product owner. Add a prefix through a PR, with a test. */
export const PRODUCT_OWNER_PREFIXES: readonly string[] = ["Product Owner:"];

export interface Blocker {
  text: string;
  line: number;
  waitingOnProductOwner: boolean;
}

export interface StatusResult {
  phase: string | null;
  currentFocus: string | null;
  nextStep: string | null;
  /** The date of "Last update", YYYY-MM-DD, or null. */
  lastUpdate: string | null;
  /** null when the Blockers heading is missing (not given); [] when the section holds none. */
  blockers: Blocker[] | null;
  /** S4: the Blockers section holds a "None" item. */
  none: boolean;
  /** S4: the text after "None.", if any. */
  remark: string | null;
  report: ReportItem[];
}

const FIELDS = [
  ["Phase", "phase"],
  ["Current focus", "currentFocus"],
  ["Next step", "nextStep"],
] as const;

/** Trims blank lines at the ends of a block of lines. */
function trimBlank(block: Line[]): Line[] {
  let a = 0;
  let b = block.length;
  while (a < b && isBlank(block[a]?.text ?? "")) a++;
  while (b > a && isBlank(block[b - 1]?.text ?? "")) b--;
  return block.slice(a, b);
}

/** S3: column-0 list items with their indented lines, else one blocker per paragraph. */
function readBlockers(block: Line[]): { text: string; line: number }[] {
  const out: { text: string; line: number }[] = [];
  if (block.some((l) => !l.fence && indentOf(l.text) === 0 && listItem(l.text))) {
    let current: { parts: string[]; line: number } | null = null;
    const flush = () => {
      if (current) out.push({ text: current.parts.join(" "), line: current.line });
      current = null;
    };
    for (const l of block) {
      const li = !l.fence && indentOf(l.text) === 0 ? listItem(l.text) : null;
      if (li) {
        flush();
        current = { parts: [li.body.trim()], line: l.number };
      } else if (current && indentOf(l.text) > 0 && !isBlank(l.text)) {
        current.parts.push(l.text.trim());
      } else if (!isBlank(l.text)) {
        flush();
      }
    }
    flush();
    return out;
  }
  let para: { parts: string[]; line: number } | null = null;
  for (const l of [...block, { number: 0, text: "", fence: null } as Line]) {
    if (isBlank(l.text)) {
      if (para) out.push({ text: para.parts.join(" "), line: para.line });
      para = null;
    } else if (para) {
      para.parts.push(l.text.trim());
    } else {
      para = { parts: [l.text.trim()], line: l.number };
    }
  }
  return out;
}

export function parse(source: string): StatusResult {
  const { lines, report, comments } = scan(source);
  // I11: an include line here is not followed; the report says so.
  report.push(...includesElsewhere(comments));
  const sections = new Map<string, Line[]>();
  let current: Line[] | null = null;
  for (const l of lines) {
    const h = l.fence ? null : heading(l.text);
    if (h) {
      current = sections.has(h.text) ? null : [];
      if (current) sections.set(h.text, current);
    } else {
      current?.push(l);
    }
  }
  const missing = (name: string) =>
    report.push({
      kind: "info",
      code: "missing-field",
      line: null,
      message: `STATUS.md has no "${name}" heading.`,
    });
  const field = (name: string): string | null => {
    const block = sections.get(name);
    if (!block) {
      missing(name);
      return null;
    }
    return trimBlank(block)
      .map((l) => l.text)
      .join("\n");
  };

  const [phase, currentFocus, nextStep] = FIELDS.map(([name]) => field(name));
  const blockerBlock = sections.get("Blockers");
  if (!blockerBlock) missing("Blockers");

  let lastUpdate: string | null = null;
  const lu = lines.find((l) => !l.fence && l.text.startsWith("Last update: "));
  if (!lu) {
    report.push({
      kind: "info",
      code: "missing-last-update",
      line: null,
      message: 'STATUS.md has no "Last update: " line.',
    });
  } else {
    const date = lu.text.slice("Last update: ".length).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) lastUpdate = date;
    else {
      report.push({
        kind: "info",
        code: "bad-last-update",
        line: lu.number,
        message: '"Last update" is not a date in the form YYYY-MM-DD.',
      });
    }
  }

  const blockers: Blocker[] | null = blockerBlock ? [] : null;
  let none = false;
  const remarks: string[] = [];
  for (const b of readBlockers(trimBlank(blockerBlock ?? []))) {
    if (b.text === "None" || b.text.startsWith("None.")) {
      none = true;
      const remark = b.text.slice(5).trim();
      if (remark !== "") remarks.push(remark);
    } else {
      blockers?.push({
        ...b,
        waitingOnProductOwner: PRODUCT_OWNER_PREFIXES.some((p) => b.text.startsWith(p)),
      });
    }
  }

  report.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
  return {
    phase: phase ?? null,
    currentFocus: currentFocus ?? null,
    nextStep: nextStep ?? null,
    lastUpdate,
    blockers,
    none,
    remark: remarks.length > 0 ? remarks.join(" ") : null,
    report,
  };
}
