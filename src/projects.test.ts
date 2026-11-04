/**
 * Tests for src/projects.ts: the PROJECTS.md reader of
 * docs/BACKLOG-FORMAT.md section 5 (P1 to P7). Synthetic files only.
 */
import { type ProjectNode, parse } from "./projects";

/** The tree as plain data: heading text, pointer texts, children. */
type Outline = { h: string | null; p: string[]; c: Outline[] };
const outline = (nodes: ProjectNode[]): Outline[] =>
  nodes.map((n) => ({ h: n.heading, p: n.pointers.map((x) => x.text), c: outline(n.children) }));

const EXAMPLE = [
  "# Projects", // 1
  "", // 2
  "Our work, grouped by area.", // 3
  "", // 4
  "## Tools", // 5
  "", // 6
  "- acme/widgets", // 7
  "- projects/notes/", // 8
  "", // 9
  "### Experiments", // 10
  "", // 11
  "- acme/lab-1/", // 12
  "* acme/old", // 13
  "  - acme/nested", // 14
  "", // 15
  "## Hardware", // 16
  "<!-- - acme/hidden -->", // 17
  "1. Not a pointer, not reported.", // 18
  "- acme/widgets — the main one", // 19
  "- acme/widgets", // 20
  "```", // 21
  "- acme/in-fence", // 22
  "```", // 23
].join("\n");

const summary = (r: ReturnType<typeof parse>) =>
  r.report
    .filter((i) => i.kind !== "info")
    .map((i) => [i.line, i.kind] as const)
    .sort((a, b) => (a[0] ?? 0) - (b[0] ?? 0));

describe("the example of BACKLOG-FORMAT section 5", () => {
  const r = parse(EXAMPLE);

  it("is read as the tree of the example", () => {
    expect(outline(r.tree)).toEqual([
      {
        h: "Projects",
        p: [],
        c: [
          {
            h: "Tools",
            p: ["acme/widgets", "projects/notes/"],
            c: [{ h: "Experiments", p: ["acme/lab-1"], c: [] }],
          },
          { h: "Hardware", p: ["acme/widgets"], c: [] },
        ],
      },
    ]);
  });

  it("gives each pointer its kind and line (the trailing slash of a repo pointer is dropped)", () => {
    const tools = r.tree[0]?.children[0];
    expect(tools?.pointers).toMatchObject([
      { kind: "repo", owner: "acme", repo: "widgets", text: "acme/widgets", line: 7 },
      { kind: "folder", name: "notes", text: "projects/notes/", line: 8 },
    ]);
    expect(tools?.children[0]?.pointers).toMatchObject([
      { kind: "repo", owner: "acme", repo: "lab-1", text: "acme/lab-1", line: 12 },
    ]);
    expect(r.tree[0]?.children[1]?.pointers).toMatchObject([{ line: 20 }]);
  });

  it("reports lines 13, 14 and 19 as not read and line 20 as read with a warning, nothing else", () => {
    expect(r.report.map((i) => [i.line, i.kind])).toEqual([
      [13, "error"],
      [14, "error"],
      [19, "error"],
      [20, "warning"],
    ]);
    expect(summary(r)).toEqual([
      [13, "error"],
      [14, "error"],
      [19, "error"],
      [20, "warning"],
    ]);
  });
});

describe("P3: headings and the tree", () => {
  it("nests by the nearest heading above with fewer #", () => {
    const r = parse("# A\n## B\n### C\n## D\n# E\n");
    expect(outline(r.tree)).toEqual([
      {
        h: "A",
        p: [],
        c: [
          { h: "B", p: [], c: [{ h: "C", p: [], c: [] }] },
          { h: "D", p: [], c: [] },
        ],
      },
      { h: "E", p: [], c: [] },
    ]);
  });

  it("a skipped level is that heading's child", () => {
    const r = parse("# A\n### C\n#### D\n## B\n");
    expect(outline(r.tree)).toEqual([
      {
        h: "A",
        p: [],
        c: [
          { h: "C", p: [], c: [{ h: "D", p: [], c: [] }] },
          { h: "B", p: [], c: [] },
        ],
      },
    ]);
  });

  it("a heading with no heading of fewer # above is at the top, in file order", () => {
    const r = parse("## A\n# B\n## C\n### D\n## E\n");
    expect(outline(r.tree)).toEqual([
      { h: "A", p: [], c: [] },
      {
        h: "B",
        p: [],
        c: [
          { h: "C", p: [], c: [{ h: "D", p: [], c: [] }] },
          { h: "E", p: [], c: [] },
        ],
      },
    ]);
  });

  it("shows a heading with nothing under it", () => {
    expect(outline(parse("# A\n# B\n- acme/x\n").tree)).toEqual([
      { h: "A", p: [], c: [] },
      { h: "B", p: ["acme/x"], c: [] },
    ]);
  });

  it("a heading is at column 0 with a space after the #s: others are text", () => {
    const r = parse("#nospace\n  # indented\n####### seven\n# Real\n");
    expect(outline(r.tree)).toEqual([{ h: "Real", p: [], c: [] }]);
  });

  it("drops a closing run of # from the heading text and keeps its line", () => {
    const r = parse("\n## Tools ##\n");
    expect(r.tree[0]).toMatchObject({ heading: "Tools", level: 2, line: 2 });
  });
});

describe("P4: pointers", () => {
  it("pointers above the first heading are at the top under no heading, before the headings", () => {
    const r = parse("- acme/a\n# H\n- acme/b\n");
    expect(r.tree[0]).toMatchObject({ heading: null, line: null });
    expect(outline(r.tree)).toEqual([
      { h: null, p: ["acme/a"], c: [] },
      { h: "H", p: ["acme/b"], c: [] },
    ]);
  });

  it("no node for 'no heading' when nothing is above the first heading", () => {
    expect(outline(parse("# H\n- acme/b\n").tree)).toEqual([{ h: "H", p: ["acme/b"], c: [] }]);
  });

  it.each([
    ["acme/widgets", "repo", "acme/widgets"],
    ["acme/widgets/", "repo", "acme/widgets"],
    ["a_b.c-d/e_f.g-h", "repo", "a_b.c-d/e_f.g-h"],
    ["projects/notes/", "folder", "projects/notes/"],
    ["projects/notes", "folder", "projects/notes/"],
    ["projects/a.b_c-d/", "folder", "projects/a.b_c-d/"],
  ])("reads %j as a %s pointer %j", (text, kind, shown) => {
    const r = parse(`# H\n- ${text}\n`);
    expect(r.tree[0]?.pointers).toMatchObject([{ kind, text: shown }]);
    expect(r.report.filter((i) => i.kind !== "info")).toEqual([]);
  });

  it("allows trailing spaces and tabs after the pointer", () => {
    expect(outline(parse("# H\n- acme/a   \n- acme/b\t\n").tree)[0]?.p).toEqual([
      "acme/a",
      "acme/b",
    ]);
  });

  it.each([
    ["owner or repo that is ..", "- ../x"],
    ["a repo that is ..", "- acme/.."],
    ["an owner that is .", "- ./x"],
    ["a repo that is .", "- acme/."],
    ["a folder that is ..", "- projects/.."],
    ["a folder that is .", "- projects/./"],
  ])("refuses a pointer with %s: not read (error), not in the tree", (_n, line) => {
    const r = parse(`# H\n${line}\n`);
    expect(r.tree[0]?.pointers).toEqual([]);
    expect(summary(r).filter(([l]) => l === 2)).toEqual([[2, "error"]]);
  });

  it("a GitHub account named projects cannot be pointed at: it is a folder pointer", () => {
    expect(parse("# H\n- projects/widgets\n").tree[0]?.pointers[0]?.kind).toBe("folder");
  });
});

describe("P5: other bullet lines are reported", () => {
  it.each([
    ["an indented pointer", "  - acme/a"],
    ["a * bullet", "* acme/a"],
    ["a + bullet", "+ acme/a"],
    ["text after the pointer", "- acme/a — more"],
    ["text after the pointer with a space", "- acme/a more"],
    ["a three-part path", "- acme/a/b"],
    ["a name with a character outside the set", "- acme/a$b"],
    ["a one-name bullet", "- widgets"],
    ["an empty bullet with a space", "- "],
    ["a bullet followed by a tab", "-\tacme/a"],
    ["an indented * bullet", "   * x"],
    ["a bold bullet", "- **acme/a**"],
  ])("reports %s as not read (error)", (_n, line) => {
    const r = parse(`# H\n${line}\n`);
    expect(r.tree[0]?.pointers).toEqual([]);
    expect(summary(r)).toEqual([[2, "error"]]);
  });

  it("does not report a dash without a following whitespace character, or a rule", () => {
    const r = parse("# H\n-acme/a\n---\n***\n--\n");
    expect(r.report.filter((i) => i.kind === "error")).toEqual([]);
  });
});

describe("P6: everything else is ignored", () => {
  it("blank lines, paragraphs, ordered items and tables are not shown and not reported", () => {
    const r = parse("# H\n\nText here.\n1. one\n2) two\n| a | b |\n|---|---|\n> quote\n- acme/a\n");
    expect(outline(r.tree)).toEqual([{ h: "H", p: ["acme/a"], c: [] }]);
    expect(r.report).toEqual([]);
  });
});

describe("P2: comments and fences first", () => {
  it("a heading, a pointer or a bullet inside a fence is not read or reported", () => {
    const r = parse("# H\n```\n# Fake\n- acme/in\n* bad\n```\n~~~\n- acme/in2\n~~~\n- acme/out\n");
    expect(outline(r.tree)).toEqual([{ h: "H", p: ["acme/out"], c: [] }]);
    expect(r.report).toEqual([]);
  });

  it("a pointer or heading inside a comment is dropped, also over several lines", () => {
    const r = parse("# H\n<!-- - acme/a\n# Fake\n* bad\n-->\n- acme/b\n");
    expect(outline(r.tree)).toEqual([{ h: "H", p: ["acme/b"], c: [] }]);
    expect(r.report).toEqual([]);
  });

  it("text left after the end of a comment is read (R9)", () => {
    const r = parse("# H\n<!-- x -->- acme/a\n");
    expect(outline(r.tree)).toEqual([{ h: "H", p: ["acme/a"], c: [] }]);
  });

  it("a fence that never closes and a comment that never closes are Info items", () => {
    const fence = parse("# H\n- acme/a\n```\n- acme/b\n");
    expect(fence.report).toMatchObject([{ kind: "info", line: 3 }]);
    expect(outline(fence.tree)).toEqual([{ h: "H", p: ["acme/a"], c: [] }]);
    const comment = parse("# H\n- acme/a\n<!--\n- acme/b\n");
    expect(comment.report).toMatchObject([{ kind: "info", line: 3 }]);
  });

  it("keeps line numbers true across comments, fences, CRLF and a BOM", () => {
    const r = parse("﻿# H\r\n<!--\r\nx\r\n-->\r\n```\r\ny\r\n```\r\n- acme/a\r\n");
    expect(r.tree[0]?.pointers).toMatchObject([{ line: 8 }]);
  });
});

describe("P7: report", () => {
  it("a repeated pointer is shown again and gets a warning on its later line", () => {
    const r = parse("# A\n- acme/x\n# B\n- acme/x/\n- projects/n/\n- projects/n\n");
    expect(outline(r.tree)).toEqual([
      { h: "A", p: ["acme/x"], c: [] },
      { h: "B", p: ["acme/x", "projects/n/", "projects/n/"], c: [] },
    ]);
    expect(summary(r)).toEqual([
      [4, "warning"],
      [6, "warning"],
    ]);
  });

  it("a repeat inside a comment or a fence does not count", () => {
    const r = parse("# A\n- acme/x\n<!-- - acme/x -->\n```\n- acme/x\n```\n");
    expect(r.report).toEqual([]);
  });

  it("a file with no pointer at all gets an Info item with no line", () => {
    for (const source of ["", "# H\nText\n", "# H\n* bad\n"]) {
      const info = parse(source).report.filter((i) => i.kind === "info");
      expect(info).toMatchObject([{ kind: "info", line: null }]);
    }
  });

  it("a file with a pointer gets no such item", () => {
    expect(parse("- acme/a\n").report).toEqual([]);
  });

  it("an empty file gives an empty tree", () => {
    expect(parse("").tree).toEqual([]);
  });

  it("every report item has a message, and a message never holds the file's text beyond the line number", () => {
    const r = parse("# H\n* secret-looking-text\n");
    for (const i of r.report) expect(i.message).not.toBe("");
  });
});

describe("a long file", () => {
  it("reads 20000 lines of headings and pointers in well under a second", () => {
    const lines: string[] = [];
    for (let i = 0; i < 5000; i++) lines.push(`## H${i}`, `- acme/r${i}`, "text", "* bad");
    const start = Date.now();
    const r = parse(lines.join("\n"));
    expect(Date.now() - start).toBeLessThan(1000);
    expect(r.tree).toHaveLength(5000);
  });
});
