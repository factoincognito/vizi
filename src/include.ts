/**
 * The include keyword (docs/SPEC.md 3.15; docs/BACKLOG-FORMAT.md section 6,
 * rules I1 to I11). Pure: it reads include lines from the comments the
 * first pass found (src/scan.ts), resolves their paths, decides which
 * files a load reads, and puts the backlog file and its included files
 * together into one backlog, with each file's report. No DOM, no I/O.
 */
import { type BacklogEntry, parse } from "./backlog";
import { type Comment, type ReportItem, scan } from "./scan";

/** I7: at most this many included files are read for one backlog file. */
export const MAX_INCLUDES = 5;

/** I1: `<!--`, spaces, `vizi:include`, spaces, the path, spaces, `-->`, and nothing else. */
const INCLUDE_LINE = /^<!-- +vizi:include +((?:(?!-->)[^ \t])+) +-->$/;
/** I2: a comment whose text, after `<!--` and any spaces or tabs, starts with the keyword and a space, a tab, `-->` or the end. */
const LOOKS_LIKE = /^<!--[ \t]*vizi:include(?:[ \t]|-->|$)/;
/** I3: the characters a path may hold. */
const PATH_CHARS = /^[A-Za-z0-9._/-]+$/;
/** The root's files vizi reads in its own way (I4). */
const OWN_FILES = ["STATUS.md", "PROJECTS.md"];

/** How a comment reads as an include: an include line (I1), one that only looks like one (I2), or neither. */
export type IncludeComment = { kind: "include"; path: string } | { kind: "looks-like" } | null;

/** I1 and I2, for one comment the first pass found. */
export function readIncludeComment(comment: Comment): IncludeComment {
  // I1 trims only spaces and tabs: any other white space at the end is text after the `-->`.
  const m = comment.indent === 0 ? INCLUDE_LINE.exec(comment.text.replace(/[ \t]+$/, "")) : null;
  if (m?.[1]) return { kind: "include", path: m[1] };
  return LOOKS_LIKE.test(comment.text) ? { kind: "looks-like" } : null;
}

/** The I11 info item of `STATUS.md` and `PROJECTS.md`: one for each include line by I1. */
export function includesElsewhere(comments: Comment[]): ReportItem[] {
  return comments
    .filter((c) => readIncludeComment(c)?.kind === "include")
    .map((c) => ({
      kind: "info",
      code: "include-elsewhere",
      line: c.line,
      message: "Not followed: only the backlog file can include another file.",
    }));
}

export type PathRead = { ok: true; path: string } | { ok: false; reason: "form" | "leaves" };

/**
 * I3: first the form, on the path as written; then, for a path of the right
 * form, its resolution from the backlog file's folder, `.` dropped and `..`
 * removing the segment before it.
 */
export function resolveIncludePath(backlogPath: string, written: string): PathRead {
  const segments = written.split("/");
  const last = segments[segments.length - 1] ?? "";
  if (
    written.startsWith("/") ||
    !PATH_CHARS.test(written) ||
    segments.includes("") ||
    !last.endsWith(".md")
  )
    return { ok: false, reason: "form" };
  const parts = backlogPath.split("/").slice(0, -1);
  for (const seg of segments) {
    if (seg === ".") continue;
    if (seg === "..") {
      if (parts.length === 0) return { ok: false, reason: "leaves" };
      parts.pop();
    } else {
      parts.push(seg);
    }
  }
  return { ok: true, path: parts.join("/") };
}

/** A file the load reads, and the include line that named it first. */
export interface IncludeRead {
  path: string;
  line: number;
}

export interface IncludePlan {
  /** The files to read, in the order of their include lines, at most MAX_INCLUDES. */
  reads: IncludeRead[];
  /** The backlog file's include items (I2 to I5, I7), by line. */
  report: ReportItem[];
}

const item = (
  kind: ReportItem["kind"],
  code: string,
  line: number | null,
  message: string,
): ReportItem => ({ kind, code, line, message });

/**
 * I1 to I5 and I7 for the backlog file at `backlogPath`: which files a load
 * reads, and what is reported for the include lines it does not follow. The
 * checks are made in the order I2, I3, I5, I4, I7; a line gets the first
 * that applies.
 */
export function planIncludes(
  backlogPath: string,
  backlogText: string,
  files: readonly string[],
  truncated: boolean,
): IncludePlan {
  const reads: IncludeRead[] = [];
  const report: ReportItem[] = [];
  const followed = new Map<string, number>();
  for (const c of scan(backlogText).comments) {
    const read = readIncludeComment(c);
    if (read === null) continue;
    if (read.kind === "looks-like") {
      report.push(
        item(
          "error",
          "include-form",
          c.line,
          "Not followed: an include is `<!-- vizi:include <path> -->` alone on its line, at column 0.",
        ),
      );
      continue;
    }
    const resolved = resolveIncludePath(backlogPath, read.path);
    if (!resolved.ok) {
      report.push(
        resolved.reason === "leaves"
          ? item(
              "error",
              "include-leaves",
              c.line,
              `Not followed: ${read.path} leaves the project.`,
            )
          : item(
              "error",
              "include-path",
              c.line,
              `Not followed: ${read.path} is not a path vizi includes: it must be relative, made of the letters A to Z and a to z, digits, \`.\`, \`_\`, \`-\` and \`/\`, and end in \`.md\`.`,
            ),
      );
      continue;
    }
    const path = resolved.path;
    if (path === backlogPath) {
      report.push(
        item("warning", "include-itself", c.line, "Not followed: the file includes itself."),
      );
      continue;
    }
    const earlier = followed.get(path);
    if (earlier !== undefined) {
      report.push(
        item(
          "warning",
          "include-twice",
          c.line,
          `Not followed: ${path} is already named on line ${earlier}.`,
        ),
      );
      continue;
    }
    // The root's STATUS.md and PROJECTS.md are checked before the file list, so they get I4's own message either way.
    if (OWN_FILES.includes(path)) {
      report.push(
        item(
          "error",
          "include-own-file",
          c.line,
          `Not followed: ${path} is read by vizi in its own way and cannot be included.`,
        ),
      );
      continue;
    }
    if (!files.includes(path)) {
      report.push(
        item(
          "error",
          "include-missing",
          c.line,
          `Not followed: ${path} is not in the repo on this branch.${truncated ? " GitHub's file list was truncated, so the file may exist." : ""}`,
        ),
      );
      continue;
    }
    if (reads.length >= MAX_INCLUDES) {
      report.push(
        item(
          "error",
          "include-cap",
          c.line,
          "Not followed: vizi reads at most five included files.",
        ),
      );
      continue;
    }
    followed.set(path, c.line);
    reads.push({ path, line: c.line });
  }
  return { reads, report };
}

/** What reading one included file gave: its text, or the message of its failed request (3.1, 3.8). */
export type IncludedFile =
  | { path: string; ok: true; text: string }
  | { path: string; ok: false; message: string };

/** One file's report items, by line. */
export interface FileReport {
  file: string;
  items: ReportItem[];
}

/** The backlog file and its included files, read together. */
export interface Backlog {
  /** Every entry, in the order of I9. An included file's entries name it (`file`). */
  entries: BacklogEntry[];
  /** The backlog file's report first, then each included file's, in the order of I9. */
  reports: FileReport[];
  /** An include was not followed or not read (a "not read" item of I2 to I7, or a failed read): the message line says so. */
  incomplete: boolean;
}

/** Items by line; items without a line after them, in the order given. */
function byLine(items: ReportItem[]): ReportItem[] {
  return [...items].sort(
    (a, b) => (a.line ?? Number.MAX_SAFE_INTEGER) - (b.line ?? Number.MAX_SAFE_INTEGER),
  );
}

/**
 * Reads the backlog file and the included files a load read (`included`,
 * the answers to planIncludes' reads), by I1 to I10. Without an include
 * line it gives what `parse` gives for the backlog file, as one report.
 */
export function readBacklog(
  backlogPath: string,
  backlogText: string,
  files: readonly string[],
  truncated: boolean,
  included: readonly IncludedFile[],
): Backlog {
  const own = parse(backlogText);
  const plan = planIncludes(backlogPath, backlogText, files, truncated);
  const ownItems: ReportItem[] = [...own.report, ...plan.report];
  let incomplete = plan.report.some((r) => r.kind === "error");
  const entries: BacklogEntry[] = [];
  const reports: FileReport[] = [];
  let next = 0;

  for (const read of plan.reads) {
    const answer = included.find((f) => f.path === read.path);
    if (!answer) continue;
    // I9: the backlog file's entries above the include line come first.
    while ((own.entries[next]?.line ?? Number.POSITIVE_INFINITY) < read.line) {
      const e = own.entries[next];
      if (e) entries.push(e);
      next++;
    }
    if (!answer.ok) {
      incomplete = true;
      ownItems.push(
        item(
          "error",
          "include-failed",
          read.line,
          `Not read: ${read.path} could not be read: ${answer.message}`,
        ),
      );
      continue;
    }
    const parsed = parse(answer.text, read.path);
    const items = [...parsed.report];
    // I6: one level only; an include line, or one that looks like it, is not followed.
    for (const c of scan(answer.text).comments) {
      if (readIncludeComment(c) === null) continue;
      incomplete = true;
      items.push(
        item(
          "error",
          "include-nested",
          c.line,
          "Not followed: an included file cannot include another file.",
        ),
      );
    }
    if (parsed.entries.length === 0)
      items.push(item("info", "include-empty", null, `${read.path} holds no backlog entry.`));
    entries.push(...parsed.entries);
    reports.push({ file: read.path, items });
  }
  entries.push(...own.entries.slice(next));

  // I10: an ID an entry of another file has, earlier in the order of I9; the warning names the first such entry.
  const firstById = new Map<string, BacklogEntry[]>();
  for (const e of entries) {
    if (e.id === null) continue;
    const file = e.file ?? backlogPath;
    const earlier = firstById.get(e.id) ?? [];
    const other = earlier.find((x) => (x.file ?? backlogPath) !== file);
    if (other) {
      const warning = item(
        "warning",
        "include-id-elsewhere",
        e.line,
        `The ID ${e.id} is also used in ${other.file ?? backlogPath} line ${other.line}.`,
      );
      if (e.file === undefined) ownItems.push(warning);
      else reports.find((r) => r.file === e.file)?.items.push(warning);
    }
    earlier.push(e);
    firstById.set(e.id, earlier);
  }

  return {
    entries,
    reports: [
      { file: backlogPath, items: byLine(ownItems) },
      ...reports.map((r) => ({ file: r.file, items: byLine(r.items) })),
    ],
    incomplete,
  };
}
