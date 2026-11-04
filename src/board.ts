/**
 * The board's columns and the list (docs/SPEC.md 3.2). Pure: entries in,
 * groups out. The page builds elements from these.
 */
import type { BacklogEntry } from "./backlog";

export interface Column {
  marker: string;
  /** DONE, SUPERSEDED and MOVED are collapsed until opened. */
  folded: boolean;
  entries: BacklogEntry[];
}

const FIRST = ["NOW", "NEXT", "BLOCKED", "LATER", "IDEA"];
const FOLDED = ["DONE", "SUPERSEDED", "MOVED"];

/** One column per marker found: the order of 3.2, then any other marker in the order first seen. */
export function boardColumns(entries: BacklogEntry[]): Column[] {
  const byMarker = new Map<string, BacklogEntry[]>();
  for (const e of entries) {
    const list = byMarker.get(e.marker);
    if (list) list.push(e);
    else byMarker.set(e.marker, [e]);
  }
  const others = [...byMarker.keys()].filter((m) => !FIRST.includes(m) && !FOLDED.includes(m));
  const columns: Column[] = [];
  for (const marker of [...FIRST, ...FOLDED, ...others]) {
    const list = byMarker.get(marker);
    if (list) columns.push({ marker, folded: FOLDED.includes(marker), entries: list });
  }
  return columns;
}

/** The search of 3.2: ID, notes, title and description, ignoring case. */
export function entryMatches(entry: BacklogEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  const hay = [entry.id ?? "", ...entry.notes, entry.title, entry.description]
    .join("\n")
    .toLowerCase();
  return hay.includes(q);
}

export interface Section {
  heading: string;
  entries: BacklogEntry[];
}

export const NO_HEADING = "(no heading)";

/** Entries that pass the filter, grouped under their heading in file order; sections left empty are dropped. */
export function listSections(
  entries: BacklogEntry[],
  filter: { marker: string | null; query: string },
): Section[] {
  const sections: Section[] = [];
  for (const e of entries) {
    if (filter.marker !== null && filter.marker !== "" && e.marker !== filter.marker) continue;
    if (!entryMatches(e, filter.query)) continue;
    const heading = e.group ?? NO_HEADING;
    const last = sections[sections.length - 1];
    if (last && last.heading === heading) last.entries.push(e);
    else sections.push({ heading, entries: [e] });
  }
  return sections;
}

/**
 * SPEC 3.7 item 2: the smallest indent of the description's non-blank lines
 * below the head is removed from them, so indented lines are not shown as code.
 */
export function descriptionForDisplay(entry: BacklogEntry): string {
  if (entry.description === "") return "";
  const all = entry.description.split("\n");
  const skip = entry.headRest === "" ? 0 : 1;
  const below = all.slice(skip);
  let min = Number.POSITIVE_INFINITY;
  for (const l of below) {
    if (l.trim() === "") continue;
    min = Math.min(min, l.length - l.trimStart().length);
  }
  if (!Number.isFinite(min) || min === 0) return entry.description;
  return [...all.slice(0, skip), ...below.map((l) => (l.trim() === "" ? l : l.slice(min)))].join(
    "\n",
  );
}
