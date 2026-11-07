/**
 * Tests for src/include.ts: the include keyword of docs/SPEC.md 3.15,
 * rules I1 to I11 of docs/BACKLOG-FORMAT.md section 6. Every fixture is
 * made up for the test.
 */
import { parse } from "./backlog";
import {
  type IncludedFile,
  MAX_INCLUDES,
  planIncludes,
  readBacklog,
  resolveIncludePath,
} from "./include";

const lines = (...l: string[]) => l.join("\n");

const I2 =
  "Not followed: an include is `<!-- vizi:include <path> -->` alone on its line, at column 0.";
const I3 = (path: string) =>
  `Not followed: ${path} is not a path vizi includes: it must be relative, made of the letters A to Z and a to z, digits, \`.\`, \`_\`, \`-\` and \`/\`, and end in \`.md\`.`;
const I3_LEAVES = (path: string) => `Not followed: ${path} leaves the project.`;
const I4 = (path: string) => `Not followed: ${path} is not in the repo on this branch.`;
const I4_TRUNCATED = (path: string) =>
  `Not followed: ${path} is not in the repo on this branch. GitHub's file list was truncated, so the file may exist.`;
const I4_OWN = (path: string) =>
  `Not followed: ${path} is read by vizi in its own way and cannot be included.`;
const I5_ITSELF = "Not followed: the file includes itself.";
const I5_TWICE = (path: string, line: number) =>
  `Not followed: ${path} is already named on line ${line}.`;
const I6 = "Not followed: an included file cannot include another file.";
const I7 = "Not followed: vizi reads at most five included files.";
const FAILED = (path: string, message: string) => `Not read: ${path} could not be read: ${message}`;
const I8 = (path: string) => `${path} holds no backlog entry.`;
const I10 = (id: string, file: string, line: number) =>
  `The ID ${id} is also used in ${file} line ${line}.`;

const FILES = ["BACKLOG.md", "BACKLOG-DONE.md", "a.md", "DONE.md", "docs/BACKLOG.md"];

/** The plan of a backlog file at `backlog`, with the file list `files`. */
const plan = (text: string, files = FILES, backlog = "BACKLOG.md", truncated = false) =>
  planIncludes(backlog, text, files, truncated);

const ok = (path: string, text: string): IncludedFile => ({ path, ok: true, text });

describe("I1: the include line", () => {
  it.each([
    ["one space each", "<!-- vizi:include BACKLOG-DONE.md -->"],
    ["two spaces where one stands", "<!--  vizi:include  BACKLOG-DONE.md  -->"],
    ["trailing spaces", "<!-- vizi:include BACKLOG-DONE.md -->   "],
    ["a trailing tab after -->", "<!-- vizi:include BACKLOG-DONE.md -->\t"],
  ])("is an include of BACKLOG-DONE.md with %s", (_n, line) => {
    const p = plan(lines("- **[NOW] AB-1** — First.", line));
    expect(p.reads).toEqual([{ path: "BACKLOG-DONE.md", line: 2 }]);
    expect(p.report).toEqual([]);
  });

  it("is not an include inside a fence, and is not reported", () => {
    const p = plan(lines("```", "<!-- vizi:include a.md -->", "```"));
    expect(p).toEqual({ reads: [], report: [] });
  });

  it("is not an include inside a comment opened on an earlier line, and is not reported", () => {
    const p = plan(lines("<!--", "<!-- vizi:include a.md -->", "-->"));
    expect(p).toEqual({ reads: [], report: [] });
  });

  it("is dropped like any comment, so the file reads as if the line were not there", () => {
    const text = lines(
      "## Open",
      "- **[NOW] AB-1** — First.",
      "<!-- vizi:include a.md -->",
      "  More of AB-1's description.",
    );
    const b = readBacklog("BACKLOG.md", text, FILES, false, [
      ok("a.md", "- **[DONE] AB-2** — Old."),
    ]);
    const own = b.entries.find((e) => e.id === "AB-1");
    // A description keeps its indent as read (edge case 6).
    expect(own?.description).toBe("  More of AB-1's description.");
  });
});

describe("I2: a line that looks like an include", () => {
  it.each([
    ["indented", "  <!-- vizi:include a.md -->"],
    ["text after -->", "<!-- vizi:include a.md --> x"],
    ["no path", "<!-- vizi:include -->"],
    ["two words", "<!-- vizi:include a.md b.md -->"],
    ["no space before -->", "<!-- vizi:include a.md-->"],
    ["a tab before vizi:include", "<!--\tvizi:include a.md -->"],
    ["a tab after vizi:include", "<!-- vizi:include\ta.md -->"],
    ["a tab inside the path", "<!-- vizi:include a\tb.md -->"],
    ["no space after <!--", "<!--vizi:include a.md -->"],
    ["--> inside the path", "<!-- vizi:include a-->b.md -->"],
    ["--> as the path", "<!-- vizi:include --> -->"],
    ["a no-break space after -->", "<!-- vizi:include a.md -->\u00a0"],
  ])("is reported as not read when %s, and not followed", (_n, line) => {
    const p = plan(line);
    expect(p.reads).toEqual([]);
    expect(p.report).toEqual([{ kind: "error", code: "include-form", line: 1, message: I2 }]);
  });

  it("is reported when the comment does not close on its line", () => {
    const p = plan(lines("- **[NOW] AB-1** — First.", "<!-- vizi:include a.md", "-->"));
    expect(p.reads).toEqual([]);
    expect(p.report).toEqual([{ kind: "error", code: "include-form", line: 2, message: I2 }]);
  });

  it.each([
    ["vizi:Include", "<!-- vizi:Include a.md -->"],
    ["vizi without the keyword", "<!-- vizi a.md -->"],
    ["vizi:includes", "<!-- vizi:includes a.md -->"],
  ])("leaves an ordinary comment (%s) dropped and unreported", (_n, line) => {
    expect(plan(line)).toEqual({ reads: [], report: [] });
  });

  it("never reads a <!-- after other text as an include: it stays the entry's text", () => {
    const text = "- **[NOW] AB-1** — Text <!-- vizi:include a.md -->";
    expect(plan(text)).toEqual({ reads: [], report: [] });
    const b = readBacklog("BACKLOG.md", text, FILES, false, []);
    expect(b.entries[0]?.text).toBe("Text <!-- vizi:include a.md -->");
  });
});

describe("I3: the path", () => {
  it.each([
    ["DONE.md", "DONE.md"],
    ["./DONE.md", "DONE.md"],
    ["old/DONE.md", "old/DONE.md"],
    ["old/../DONE.md", "DONE.md"],
  ])("from BACKLOG.md, %s resolves to %s", (written, resolved) => {
    expect(resolveIncludePath("BACKLOG.md", written)).toEqual({ ok: true, path: resolved });
  });

  it.each([
    "/DONE.md",
    "https://github.com/acme/widgets/blob/main/DONE.md",
    "C:\\DONE.md",
    "a%20b.md",
    "a//b.md",
    "old/",
    "DONE.txt",
    "DONE.MD",
    "ÄNDRAT.md",
  ])("from BACKLOG.md, refuses %s by its form", (written) => {
    expect(resolveIncludePath("BACKLOG.md", written)).toEqual({ ok: false, reason: "form" });
  });

  it("from BACKLOG.md, refuses ../DONE.md as leaving the project", () => {
    expect(resolveIncludePath("BACKLOG.md", "../DONE.md")).toEqual({ ok: false, reason: "leaves" });
  });

  it.each([
    ["docs/BACKLOG.md", "DONE.md", "docs/DONE.md"],
    ["docs/BACKLOG.md", "../DONE.md", "DONE.md"],
    ["docs/PRODUCT_BACKLOG.md", "DONE.md", "docs/DONE.md"],
  ])("from %s, %s resolves to %s", (backlog, written, resolved) => {
    expect(resolveIncludePath(backlog, written)).toEqual({ ok: true, path: resolved });
  });

  it("from docs/BACKLOG.md, refuses ../../DONE.md as leaving the project", () => {
    expect(resolveIncludePath("docs/BACKLOG.md", "../../DONE.md")).toEqual({
      ok: false,
      reason: "leaves",
    });
  });

  it.each(["../x.txt", "/../x.md", "a//../b.md"])(
    "checks the form first: %s gets the general message",
    (written) => {
      expect(resolveIncludePath("BACKLOG.md", written)).toEqual({ ok: false, reason: "form" });
      expect(plan(`<!-- vizi:include ${written} -->`).report).toEqual([
        { kind: "error", code: "include-path", line: 1, message: I3(written) },
      ]);
    },
  );

  it.each(["../x.md", "a/../../x.md"])(
    "resolves a path of the right form: %s from BACKLOG.md leaves the project",
    (written) => {
      expect(resolveIncludePath("BACKLOG.md", written)).toEqual({ ok: false, reason: "leaves" });
      expect(plan(`<!-- vizi:include ${written} -->`).report).toEqual([
        { kind: "error", code: "include-leaves", line: 1, message: I3_LEAVES(written) },
      ]);
    },
  );

  it("refuses a URL in an include line with the general message, and follows nothing", () => {
    const url = "https://github.com/acme/widgets/blob/main/DONE.md";
    const p = plan(`<!-- vizi:include ${url} -->`);
    expect(p.reads).toEqual([]);
    expect(p.report).toEqual([{ kind: "error", code: "include-path", line: 1, message: I3(url) }]);
  });
});

describe("I4: the included file", () => {
  it("reports a path the file list lacks, and asks for no file", () => {
    const p = plan("<!-- vizi:include old/DONE.md -->");
    expect(p.reads).toEqual([]);
    expect(p.report).toEqual([
      { kind: "error", code: "include-missing", line: 1, message: I4("old/DONE.md") },
    ]);
  });

  it("adds the truncation sentence when the file list was truncated", () => {
    const p = plan("<!-- vizi:include old/DONE.md -->", FILES, "BACKLOG.md", true);
    expect(p.report).toEqual([
      { kind: "error", code: "include-missing", line: 1, message: I4_TRUNCATED("old/DONE.md") },
    ]);
  });

  it("names the path as resolved", () => {
    const p = plan("<!-- vizi:include ./old/../gone.md -->");
    expect(p.report[0]?.message).toBe(I4("gone.md"));
  });

  it.each([
    ["STATUS.md", "BACKLOG.md", "STATUS.md"],
    ["PROJECTS.md", "BACKLOG.md", "PROJECTS.md"],
    ["../STATUS.md", "docs/BACKLOG.md", "STATUS.md"],
  ])(
    "refuses %s from %s with I4's own message, with no file asked for",
    (written, backlog, path) => {
      for (const files of [[...FILES, "STATUS.md", "PROJECTS.md"], FILES]) {
        const p = plan(`<!-- vizi:include ${written} -->`, files, backlog);
        expect(p.reads).toEqual([]);
        expect(p.report).toEqual([
          { kind: "error", code: "include-own-file", line: 1, message: I4_OWN(path) },
        ]);
      }
    },
  );

  it("follows docs/STATUS.md from BACKLOG.md", () => {
    const p = plan("<!-- vizi:include docs/STATUS.md -->", [...FILES, "docs/STATUS.md"]);
    expect(p.reads).toEqual([{ path: "docs/STATUS.md", line: 1 }]);
    expect(p.report).toEqual([]);
  });
});

describe("I5: itself and twice", () => {
  it("reads the file itself with a warning, and does not follow it", () => {
    for (const [backlog, written] of [
      ["BACKLOG.md", "BACKLOG.md"],
      ["BACKLOG.md", "./BACKLOG.md"],
      ["docs/BACKLOG.md", "BACKLOG.md"],
    ] as const) {
      const p = plan(`<!-- vizi:include ${written} -->`, FILES, backlog);
      expect(p.reads).toEqual([]);
      expect(p.report).toEqual([
        { kind: "warning", code: "include-itself", line: 1, message: I5_ITSELF },
      ]);
    }
  });

  it("reads a file named twice once, at its first line, with a warning on the later one", () => {
    const p = plan(
      lines(
        "<!-- vizi:include DONE.md -->",
        "<!-- vizi:include ./DONE.md -->",
        "<!-- vizi:include DONE.md -->",
      ),
    );
    expect(p.reads).toEqual([{ path: "DONE.md", line: 1 }]);
    expect(p.report).toEqual([
      { kind: "warning", code: "include-twice", line: 2, message: I5_TWICE("DONE.md", 1) },
      { kind: "warning", code: "include-twice", line: 3, message: I5_TWICE("DONE.md", 1) },
    ]);
  });

  it("names a failed file again with the warning, and asks for it once", () => {
    const text = lines("<!-- vizi:include DONE.md -->", "<!-- vizi:include DONE.md -->");
    expect(plan(text).reads).toEqual([{ path: "DONE.md", line: 1 }]);
    const message =
      "GitHub answered HTTP 404 for https://raw.githubusercontent.com/a/b/main/DONE.md.";
    const b = readBacklog("BACKLOG.md", text, FILES, false, [
      { path: "DONE.md", ok: false, message },
    ]);
    expect(b.reports[0]?.items).toEqual([
      { kind: "error", code: "include-failed", line: 1, message: FAILED("DONE.md", message) },
      { kind: "warning", code: "include-twice", line: 2, message: I5_TWICE("DONE.md", 1) },
    ]);
  });

  it("reports a path the file list lacks by I4 each time it is named", () => {
    const p = plan(lines("<!-- vizi:include gone.md -->", "<!-- vizi:include gone.md -->"));
    expect(p.reads).toEqual([]);
    expect(p.report.map((r) => [r.line, r.message])).toEqual([
      [1, I4("gone.md")],
      [2, I4("gone.md")],
    ]);
  });

  it("reports a path past the cap by I7 each time it is named", () => {
    const names = ["f1.md", "f2.md", "f3.md", "f4.md", "f5.md", "f6.md", "f6.md"];
    const p = plan(lines(...names.map((n) => `<!-- vizi:include ${n} -->`)), [
      ...names,
      "BACKLOG.md",
    ]);
    expect(p.reads.map((r) => r.path)).toEqual(["f1.md", "f2.md", "f3.md", "f4.md", "f5.md"]);
    expect(p.report).toEqual([
      { kind: "error", code: "include-cap", line: 6, message: I7 },
      { kind: "error", code: "include-cap", line: 7, message: I7 },
    ]);
  });
});

describe("I6: one level", () => {
  it("reports an include line, and a line that looks like one, in an included file, on that file's line", () => {
    const included = lines(
      "- **[DONE] AB-2** — Old.",
      "<!-- vizi:include a.md -->",
      "  <!-- vizi:include a.md -->",
    );
    const b = readBacklog("BACKLOG.md", "<!-- vizi:include DONE.md -->", FILES, false, [
      ok("DONE.md", included),
    ]);
    expect(b.reports).toEqual([
      { file: "BACKLOG.md", items: [] },
      {
        file: "DONE.md",
        items: [
          { kind: "error", code: "include-nested", line: 2, message: I6 },
          { kind: "error", code: "include-nested", line: 3, message: I6 },
        ],
      },
    ]);
    expect(b.entries.map((e) => e.id)).toEqual(["AB-2"]);
    expect(b.incomplete).toBe(true);
  });
});

describe("I7: at most five", () => {
  it("is five", () => {
    expect(MAX_INCLUDES).toBe(5);
  });

  it("reads the first five of six include lines, and reports the sixth", () => {
    const names = ["f1.md", "f2.md", "f3.md", "f4.md", "f5.md", "f6.md"];
    const p = plan(lines(...names.map((n) => `<!-- vizi:include ${n} -->`)), names);
    expect(p.reads.map((r) => r.path)).toEqual(names.slice(0, 5));
    expect(p.report).toEqual([{ kind: "error", code: "include-cap", line: 6, message: I7 }]);
  });

  it("does not count refused lines before them", () => {
    const names = ["f1.md", "f2.md", "f3.md", "f4.md", "f5.md", "f6.md"];
    const p = plan(
      lines(
        "<!-- vizi:include gone.md -->",
        "  <!-- vizi:include f1.md -->",
        "<!-- vizi:include ../x.md -->",
        "<!-- vizi:include BACKLOG.md -->",
        ...names.map((n) => `<!-- vizi:include ${n} -->`),
      ),
      [...names, "BACKLOG.md"],
    );
    expect(p.reads.map((r) => r.path)).toEqual(names.slice(0, 5));
    expect(p.report.map((r) => [r.line, r.code])).toEqual([
      [1, "include-missing"],
      [2, "include-form"],
      [3, "include-leaves"],
      [4, "include-itself"],
      [10, "include-cap"],
    ]);
  });

  it("counts a followed file whose read failed", () => {
    const names = ["f1.md", "f2.md", "f3.md", "f4.md", "f5.md", "f6.md"];
    const text = lines(...names.map((n) => `<!-- vizi:include ${n} -->`));
    const b = readBacklog("BACKLOG.md", text, names, false, [
      { path: "f1.md", ok: false, message: "x." },
      ...names.slice(1, 5).map((n) => ok(n, "- **[DONE] AB-1** — A.")),
    ]);
    expect(b.reports[0]?.items.map((r) => [r.line, r.code])).toEqual([
      [1, "include-failed"],
      [6, "include-cap"],
    ]);
  });
});

describe("I8: reading an included file", () => {
  const backlog = lines("## Mine", "- **[NOW] AB-1** — Mine.", "<!-- vizi:include DONE.md -->");
  const done = lines(
    "- **[DONE] AB-2** — Above the first heading.",
    "",
    "## Old",
    "- **[DONE] AB-3** — Under Old.",
  );

  it("keeps the included file's own lines and groups; an entry above its first heading has no group", () => {
    const b = readBacklog("BACKLOG.md", backlog, FILES, false, [ok("DONE.md", done)]);
    expect(b.entries.map((e) => [e.id, e.line, e.group, e.file])).toEqual([
      ["AB-1", 2, "Mine", undefined],
      ["AB-2", 1, null, "DONE.md"],
      ["AB-3", 4, "Old", "DONE.md"],
    ]);
  });

  it("reads the included file with every rule, its own report included", () => {
    const b = readBacklog("BACKLOG.md", backlog, FILES, false, [
      ok("DONE.md", lines("- [x] unmarked", "  - **[NOW] AB-9** — Indented.", "```")),
    ]);
    expect(b.reports[1]?.file).toBe("DONE.md");
    expect(b.reports[1]?.items.map((r) => [r.kind, r.line])).toEqual([
      ["info", 1],
      ["error", 2],
      ["info", 3],
      ["info", null],
    ]);
  });

  it("gives the info item for a file with no entry", () => {
    const b = readBacklog("BACKLOG.md", backlog, FILES, false, [
      ok("DONE.md", "# Just a README\n"),
    ]);
    expect(b.reports[1]).toEqual({
      file: "DONE.md",
      items: [{ kind: "info", code: "include-empty", line: null, message: I8("DONE.md") }],
    });
    // Info items put nothing in #message.
    expect(b.incomplete).toBe(false);
  });

  it("skips a planned file it has no answer for", () => {
    const b = readBacklog("BACKLOG.md", backlog, FILES, false, []);
    expect(b.entries.map((e) => e.id)).toEqual(["AB-1"]);
    expect(b.reports).toEqual([{ file: "BACKLOG.md", items: [] }]);
  });
});

describe("I9 and the spec's example", () => {
  const backlog = lines(
    "## Open",
    "",
    "- **[NOW] AB-3** — Draw the chart.",
    "<!-- vizi:include BACKLOG-DONE.md -->",
    "<!-- vizi:include ../OLD.md -->",
    "- **[NEXT] AB-4** — Export the chart.",
  );
  const done = lines(
    "## Open",
    "",
    "- **[DONE] AB-1** — Read the data. See [the notes](notes/data.md).",
    "- **[DONE] AB-3** — Draw a first chart.",
    "<!-- vizi:include MORE.md -->",
  );
  const files = ["BACKLOG.md", "BACKLOG-DONE.md", "MORE.md", "OLD.md"];

  it("asks for BACKLOG-DONE.md only", () => {
    expect(planIncludes("BACKLOG.md", backlog, files, false).reads).toEqual([
      { path: "BACKLOG-DONE.md", line: 4 },
    ]);
  });

  it("reads four entries, in the order of I9", () => {
    const b = readBacklog("BACKLOG.md", backlog, files, false, [ok("BACKLOG-DONE.md", done)]);
    expect(b.entries.map((e) => [e.id, e.file ?? "BACKLOG.md", e.line, e.group])).toEqual([
      ["AB-3", "BACKLOG.md", 3, "Open"],
      ["AB-1", "BACKLOG-DONE.md", 3, "Open"],
      ["AB-3", "BACKLOG-DONE.md", 4, "Open"],
      ["AB-4", "BACKLOG.md", 6, "Open"],
    ]);
  });

  it("reports the example's three items, word for word, by file", () => {
    const b = readBacklog("BACKLOG.md", backlog, files, false, [ok("BACKLOG-DONE.md", done)]);
    expect(b.reports).toEqual([
      {
        file: "BACKLOG.md",
        items: [
          { kind: "error", code: "include-leaves", line: 5, message: I3_LEAVES("../OLD.md") },
        ],
      },
      {
        file: "BACKLOG-DONE.md",
        items: [
          {
            kind: "warning",
            code: "include-id-elsewhere",
            line: 4,
            message: I10("AB-3", "BACKLOG.md", 3),
          },
          { kind: "error", code: "include-nested", line: 5, message: I6 },
        ],
      },
    ]);
    expect(b.incomplete).toBe(true);
  });

  it("puts included entries where the include line stands, also after an entry whose description goes on below it", () => {
    const text = lines(
      "- **[NOW] AB-1** — First.",
      "<!-- vizi:include DONE.md -->",
      "  Still AB-1.",
      "- **[NOW] AB-5** — Last.",
    );
    const b = readBacklog("BACKLOG.md", text, FILES, false, [
      ok("DONE.md", "- **[DONE] AB-2** — Old."),
    ]);
    expect(b.entries.map((e) => e.id)).toEqual(["AB-1", "AB-2", "AB-5"]);
    expect(b.entries[0]?.description).toBe("  Still AB-1.");
  });

  it("keeps the order of two included files", () => {
    const text = lines(
      "<!-- vizi:include a.md -->",
      "- **[NOW] AB-1** — Middle.",
      "<!-- vizi:include DONE.md -->",
    );
    const b = readBacklog("BACKLOG.md", text, FILES, false, [
      ok("DONE.md", "- **[DONE] AB-3** — Third."),
      ok("a.md", "- **[DONE] AB-0** — First."),
    ]);
    expect(b.entries.map((e) => e.id)).toEqual(["AB-0", "AB-1", "AB-3"]);
    expect(b.reports.map((r) => r.file)).toEqual(["BACKLOG.md", "a.md", "DONE.md"]);
  });
});

describe("I10: the same ID in two files", () => {
  it("warns on the later entry, naming the first entry of another file; a repeat within one file keeps its own warning", () => {
    const text = lines(
      "- **[NOW] AB-1** — Own.",
      "<!-- vizi:include a.md -->",
      "<!-- vizi:include DONE.md -->",
    );
    const b = readBacklog("BACKLOG.md", text, FILES, false, [
      ok("a.md", lines("- **[DONE] AB-1** — In a.", "- **[DONE] AB-1** — In a again.")),
      ok("DONE.md", "- **[DONE] AB-1** — In DONE."),
    ]);
    expect(b.reports).toEqual([
      { file: "BACKLOG.md", items: [] },
      {
        file: "a.md",
        items: [
          {
            kind: "warning",
            code: "include-id-elsewhere",
            line: 1,
            message: I10("AB-1", "BACKLOG.md", 1),
          },
          {
            kind: "warning",
            code: "duplicate-id",
            line: 2,
            message: "The ID AB-1 is used by an earlier entry.",
          },
          {
            kind: "warning",
            code: "include-id-elsewhere",
            line: 2,
            message: I10("AB-1", "BACKLOG.md", 1),
          },
        ],
      },
      {
        file: "DONE.md",
        items: [
          {
            kind: "warning",
            code: "include-id-elsewhere",
            line: 1,
            message: I10("AB-1", "BACKLOG.md", 1),
          },
        ],
      },
    ]);
    // Warnings put nothing in #message.
    expect(b.incomplete).toBe(false);
  });

  it("names an included file when the earlier entry is there, and warns on the backlog file's own later entry", () => {
    const text = lines("<!-- vizi:include a.md -->", "- **[NOW] AB-7** — Own, after.");
    const b = readBacklog("BACKLOG.md", text, FILES, false, [
      ok("a.md", "- **[DONE] AB-7** — First."),
    ]);
    expect(b.reports[0]?.items).toEqual([
      { kind: "warning", code: "include-id-elsewhere", line: 2, message: I10("AB-7", "a.md", 1) },
    ]);
  });
});

describe("what goes to #message", () => {
  it.each([
    ["I2", "  <!-- vizi:include a.md -->"],
    ["I3", "<!-- vizi:include ../a.md -->"],
    ["I4", "<!-- vizi:include gone.md -->"],
  ])("an include not followed by %s makes the backlog incomplete", (_n, line) => {
    expect(readBacklog("BACKLOG.md", line, FILES, false, []).incomplete).toBe(true);
  });

  it("a failed read makes it incomplete; a warning alone does not", () => {
    expect(
      readBacklog("BACKLOG.md", "<!-- vizi:include a.md -->", FILES, false, [
        { path: "a.md", ok: false, message: "x." },
      ]).incomplete,
    ).toBe(true);
    expect(
      readBacklog("BACKLOG.md", "<!-- vizi:include BACKLOG.md -->", FILES, false, []).incomplete,
    ).toBe(false);
  });
});

describe("no include line", () => {
  const text = lines(
    "## Phase 2",
    "- **[NOW] PBI-2.4** — Read the settings.",
    "- **[DONE]** PBI-2.3 — Add the page.",
    "<!-- an ordinary comment -->",
    "- [x] unmarked",
  );

  it("gives exactly what parse gives, and no file to read", () => {
    expect(plan(text)).toEqual({ reads: [], report: [] });
    const b = readBacklog("BACKLOG.md", text, FILES, false, []);
    const p = parse(text);
    expect(b.entries).toEqual(p.entries);
    expect(b.reports).toEqual([{ file: "BACKLOG.md", items: p.report }]);
    expect(b.incomplete).toBe(false);
    expect(b.entries.every((e) => !("file" in e))).toBe(true);
  });
});
