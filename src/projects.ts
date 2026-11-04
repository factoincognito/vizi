/**
 * The PROJECTS.md reader (docs/BACKLOG-FORMAT.md, section 5, P1 to P7):
 * the headings as a tree, with the project pointers under them, and what
 * could not be read. Pure: it takes the file's text. Text from the file
 * is data; nothing here makes a request or builds markup.
 */
import { heading, type ReportItem, scan } from "./scan";

export type { ReportItem, ReportKind } from "./scan";

export type Pointer =
  | {
      kind: "repo";
      owner: string;
      repo: string;
      /** `owner/repo`, a trailing slash dropped. */
      text: string;
      line: number;
    }
  | {
      kind: "folder";
      name: string;
      /** `projects/<name>/` */
      text: string;
      line: number;
    };

export interface ProjectNode {
  /** The heading's text (inline Markdown), or null for the pointers above the first heading. */
  heading: string | null;
  /** 1 to 6; 0 for the "no heading" node. */
  level: number;
  /** The heading's line, or null for the "no heading" node. */
  line: number | null;
  pointers: Pointer[];
  children: ProjectNode[];
}

export interface ProjectsResult {
  /** The top of the tree, in file order; a "no heading" node comes first when pointers precede the first heading. */
  tree: ProjectNode[];
  report: ReportItem[];
}

/** P4: a `- ` at column 0, two names joined by one `/`, an optional trailing `/`, and nothing but trailing spaces. */
const POINTER = /^- ([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(\/?)\s*$/;
/** P5: any other line that starts, after any indent, with a bullet character and a whitespace character. */
const BULLET = /^\s*[-*+]\s/;

const isDots = (name: string) => name === "." || name === "..";

export function parse(source: string): ProjectsResult {
  const scanned = scan(source);
  const report: ReportItem[] = [...scanned.report];
  const top: ProjectNode[] = [];
  const stack: ProjectNode[] = [];
  let noHeading: ProjectNode | null = null;
  const seen = new Map<string, number>();
  let pointers = 0;

  for (const line of scanned.lines) {
    if (line.fence !== null) continue;
    const h = heading(line.text);
    if (h) {
      const node: ProjectNode = {
        heading: h.text,
        level: h.level,
        line: line.number,
        pointers: [],
        children: [],
      };
      while ((stack[stack.length - 1]?.level ?? 0) >= h.level) stack.pop();
      (stack[stack.length - 1]?.children ?? top).push(node);
      stack.push(node);
      continue;
    }
    const m = POINTER.exec(line.text);
    if (m?.[1] && m[2] !== undefined) {
      if (isDots(m[1]) || isDots(m[2])) {
        report.push({
          kind: "error",
          code: "pointer-dots",
          line: line.number,
          message: "Not read: a pointer cannot name . or ..",
        });
        continue;
      }
      const pointer: Pointer =
        m[1] === "projects"
          ? { kind: "folder", name: m[2], text: `projects/${m[2]}/`, line: line.number }
          : { kind: "repo", owner: m[1], repo: m[2], text: `${m[1]}/${m[2]}`, line: line.number };
      let owner = stack[stack.length - 1];
      if (!owner) {
        if (!noHeading) {
          noHeading = { heading: null, level: 0, line: null, pointers: [], children: [] };
          top.unshift(noHeading);
        }
        owner = noHeading;
      }
      owner.pointers.push(pointer);
      pointers += 1;
      const earlier = seen.get(pointer.text);
      if (earlier === undefined) seen.set(pointer.text, line.number);
      else
        report.push({
          kind: "warning",
          code: "repeated-pointer",
          line: line.number,
          message: `The same pointer is on line ${earlier}; it is shown again.`,
        });
      continue;
    }
    if (BULLET.test(line.text)) {
      report.push({
        kind: "error",
        code: "not-a-pointer",
        line: line.number,
        message:
          "Not read: a pointer is `- owner/repo` or `- projects/<name>/` at column 0, with nothing after it.",
      });
    }
  }

  if (pointers === 0) {
    report.push({
      kind: "info",
      code: "no-pointer",
      line: null,
      message: "The file holds no project pointer.",
    });
  }
  report.sort((a, b) => (a.line ?? Number.MAX_SAFE_INTEGER) - (b.line ?? Number.MAX_SAFE_INTEGER));
  return { tree: top, report };
}
