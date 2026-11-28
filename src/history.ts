/**
 * The version history of docs/SPEC.md 3.17 (PBI-1.40), as data and pure
 * functions: what a version looks like, how two are compared, the list of
 * entries and its check, and what opens by itself at a load. The page builds
 * the view from the list with calls that set text; nothing here is HTML, and
 * nothing is loaded for it: no import, no request. The version of the build
 * and the store are given to the functions as arguments, so Jest tests them
 * without a build or a browser.
 */

/** One version's entry: its version, the day it was set, and the lines that say what it brings (shown as text). */
export interface HistoryEntry {
  version: string;
  date: string;
  lines: readonly string[];
}

/** The part of `Storage` this module uses. */
export interface SeenStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** The `localStorage` key of the version last seen: the version's text, not JSON (3.17 item 7). */
export const SEEN_KEY = "vizi.seenVersion";

/** Three whole numbers joined by dots, none with a leading zero, ASCII digits only, nothing else (3.17 item 2). */
const VERSION_FORM = /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/;

/** Whether a value is a version in the form of 3.17 item 2. */
export function isVersion(value: unknown): value is string {
  return typeof value === "string" && VERSION_FORM.test(value);
}

/** Two numbers written without a leading zero, compared as numbers of any length: the longer is the larger. */
function compareNumbers(a: string, b: string): number {
  if (a.length !== b.length) return a.length < b.length ? -1 : 1;
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** Negative when `a` is the lower version, positive when it is the higher, 0 when equal; the first difference decides. Both must be of the form. */
export function compareVersions(a: string, b: string): number {
  const left = a.split(".");
  const right = b.split(".");
  for (let i = 0; i < 3; i++) {
    const difference = compareNumbers(left[i] ?? "", right[i] ?? "");
    if (difference !== 0) return difference;
  }
  return 0;
}

/** Whether a text is `YYYY-MM-DD` and a real calendar date (`2026-02-30` is not). */
function isCalendarDate(text: unknown): boolean {
  if (typeof text !== "string") return false;
  const parts = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(text);
  if (!parts) return false;
  const [year, month, day] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Returns what is wrong with a list, one text for each problem; an empty array when the list is right (3.17 item 3). */
export function checkHistory(list: readonly HistoryEntry[]): string[] {
  const problems: string[] = [];
  if (list.length === 0) problems.push("The list is empty.");
  const earlier = new Set<string>();
  let previous: string | null = null;
  list.forEach((entry, index) => {
    const where = `Entry ${index + 1} (${String(entry.version)})`;
    const formed = isVersion(entry.version);
    if (!formed) problems.push(`${where}: the version is not of the form n.n.n.`);
    if (formed && earlier.has(entry.version)) problems.push(`${where}: the version is repeated.`);
    else if (formed && previous !== null && compareVersions(previous, entry.version) < 0)
      problems.push(
        `${where}: the version is higher than the one before it; the list is in descending order.`,
      );
    if (formed) {
      earlier.add(entry.version);
      previous = entry.version;
    }
    if (!isCalendarDate(entry.date))
      problems.push(
        `${where}: the date "${String(entry.date)}" is not a calendar date written YYYY-MM-DD.`,
      );
    if (entry.lines.length === 0) problems.push(`${where}: it has no lines.`);
    entry.lines.forEach((line, i) => {
      if (typeof line !== "string" || line.trim() === "")
        problems.push(`${where}: line ${i + 1} is empty or only spaces.`);
    });
  });
  return problems;
}

/**
 * The entries the view opens by itself with at a load, or null when nothing
 * opens (3.17 item 4). `version` is V, the build's; the stored text S is read
 * from `store`. V is written in every case except a V that is not of the
 * form, which opens nothing and writes nothing. Every access to the store is
 * inside error handling: a store that is missing, that throws on reading or
 * that throws on writing leaves the decision made and the page going on. The
 * entries are those of `list` higher than S and not higher than V, in the
 * order given (newest first).
 */
export function upgradeEntries(
  version: string,
  store: SeenStore | null | undefined,
  list: readonly HistoryEntry[],
): HistoryEntry[] | null {
  if (!isVersion(version)) return null;
  let seen: unknown = null;
  try {
    seen = store ? store.getItem(SEEN_KEY) : null;
  } catch {
    seen = null;
  }
  try {
    store?.setItem(SEEN_KEY, version);
  } catch {
    // The write is only tried: a browser that refuses it opens the view again at the next load.
  }
  if (!isVersion(seen) || compareVersions(seen, version) >= 0) return null;
  const entries = list.filter(
    (entry) =>
      isVersion(entry.version) &&
      compareVersions(entry.version, seen as string) > 0 &&
      compareVersions(entry.version, version) <= 0,
  );
  return entries.length === 0 ? null : entries;
}

/** The title of the view when the link opens it, and of the full history. */
export const HISTORY_TITLE = "Version history";
/** The title of the view when it opens by itself (the apostrophe is U+0027). */
export const WHATS_NEW_TITLE = "What's new";
/** The button of the view that opened by itself. */
export const SHOW_FULL_HISTORY = "Show full history";
/** The footer's line: the version, and the number is left out when the build's is not of the form. */
export function versionLabel(version: string): string | null {
  return isVersion(version) ? `Version ${version}` : null;
}
/** An entry's heading: the version, a space, U+00B7, a space and the date. */
export function entryHeading(entry: HistoryEntry): string {
  return `Version ${entry.version} · ${entry.date}`;
}

/**
 * The list, newest first (3.17 item 3). The texts are drafts that the
 * product owner approves (product-office RULES.md § 7 (2)).
 */
export const HISTORY: readonly HistoryEntry[] = [
  {
    version: "0.2.0",
    date: "2026-11-28",
    lines: [
      'New: the version history. The footer now shows the version of vizi and a "Version history" link that opens this list.',
      "From the next version on, vizi shows what is new the first time you open it after an upgrade.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-11-28",
    lines: [
      "vizi as it was before it had a version history.",
      "Open a project from GitHub by its address, with a read-only token for private repos, and see its backlog as a board and a list, its status, its documents and a report of what could not be read.",
      "Pick another branch, keep a list of saved repos, open a repo straight from a link, and see a group of projects under one umbrella.",
    ],
  },
];
