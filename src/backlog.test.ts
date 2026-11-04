/**
 * Tests for src/backlog.ts: rules R0 to R9 and the report kinds of
 * docs/BACKLOG-FORMAT.md. Every fixture is made up for the test.
 */
import { parse, RECOMMENDED_MARKERS } from "./backlog";

const lines = (...l: string[]) => l.join("\n");
const codes = (text: string) => parse(text).report.map((r) => `${r.kind}:${r.code}@${r.line}`);

describe("worked example of docs/BACKLOG-FORMAT.md", () => {
  const example = lines(
    "## Phase 2 — Settings",
    "",
    "- **[NOW] PBI-2.4** (spec: `docs/SPEC.md` 3.2) (since 2026-11-01) — Read",
    "  the settings file (e.g. `settings.json`). Missing keys get defaults.",
    "",
    "  Unknown keys are kept and reported.",
    "- **[DONE]** PBI-2.3 — Add the settings page.",
    "- **[LATER]** Import settings from a file",
    "- **[LATER]** Export — as CSV or JSON.",
    "- **[IDEA] PBI-2.5** (from a user (by mail)) — Dark theme. Low priority.",
    "  - **[NEXT] PBI-2.6** — Pick the colours.",
    "  ## Not a heading",
    "  ```",
    "## Inside a fence",
    "- **[NOW]** Inside a fence too",
    "  ```",
    "- [x] Ask about the default port.",
    "1. Release once PBI-2.4 is done.",
  );
  const result = parse(example);

  it("reads exactly the five entries, in file order, with their lines", () => {
    expect(result.entries.map((e) => [e.line, e.marker, e.id])).toEqual([
      [3, "NOW", "PBI-2.4"],
      [7, "DONE", "PBI-2.3"],
      [8, "LATER", null],
      [9, "LATER", null],
      [10, "IDEA", "PBI-2.5"],
    ]);
  });

  it("puts all of them in the group of the heading above", () => {
    expect(result.groups).toEqual([{ level: 2, text: "Phase 2 — Settings", line: 1 }]);
    expect(new Set(result.entries.map((e) => e.group))).toEqual(new Set(["Phase 2 — Settings"]));
  });

  it("splits notes, title and description of line 3 (R3, R4)", () => {
    const e = result.entries[0];
    expect(e?.notes).toEqual(["spec: `docs/SPEC.md` 3.2", "since 2026-11-01"]);
    expect(e?.title).toBe("Read the settings file (e.g. `settings.json`).");
    expect(e?.description).toBe(
      "Missing keys get defaults.\n\n  Unknown keys are kept and reported.",
    );
  });

  it("keeps a later em dash as text when there is no separator (line 9)", () => {
    expect(result.entries[3]?.title).toBe("Export — as CSV or JSON.");
  });

  it("reads a nested parenthesis inside a note and the description of line 10", () => {
    const e = result.entries[4];
    expect(e?.notes).toEqual(["from a user (by mail)"]);
    expect(e?.title).toBe("Dark theme.");
    expect(e?.description).toBe(
      lines(
        "Low priority.",
        "  - **[NEXT] PBI-2.6** — Pick the colours.",
        "  ## Not a heading",
        "  ```",
        "## Inside a fence",
        "- **[NOW]** Inside a fence too",
        "  ```",
      ),
    );
  });

  it("reports exactly the items of the table", () => {
    expect(result.report.map((r) => [r.line, r.kind, r.code])).toEqual([
      [7, "warning", "id-outside-bold"],
      [8, "warning", "no-id"],
      [8, "warning", "no-dash"],
      [9, "warning", "no-id"],
      [9, "warning", "no-dash"],
      [11, "error", "not-read"],
      [17, "info", "unmarked-item"],
      [18, "info", "unmarked-item"],
    ]);
  });
});

describe("R0 and R1: what is an entry", () => {
  it("reads bullets with - and * and ordered items as entries at column 0", () => {
    const r = parse(
      lines("- **[NOW] AB-1** — a.", "* **[NOW] AB-2** — b.", "1. **[NOW] AB-3** — c."),
    );
    expect(r.entries.map((e) => e.id)).toEqual(["AB-1", "AB-2", "AB-3"]);
  });

  it("does not treat + as a list item: no entry, no report item", () => {
    const r = parse("+ **[NOW] AB-1** — a.");
    expect(r.entries).toEqual([]);
    expect(r.report).toEqual([]);
  });

  it("does not treat a bracket that is not upper-case letters as a marker", () => {
    const r = parse(lines("- **[Done]** AB-1 — a.", "- **[ ]** b", "- **[x]** c"));
    expect(r.entries).toEqual([]);
    expect(r.report.map((x) => x.code)).toEqual([
      "unmarked-item",
      "unmarked-item",
      "unmarked-item",
    ]);
  });

  it("reports an indented marked item as not read (error)", () => {
    const r = parse(lines("- **[NOW] AB-1** — a.", "  - **[NEXT] AB-2** — b."));
    expect(r.entries.map((e) => e.id)).toEqual(["AB-1"]);
    expect(codes(lines("  - **[NEXT] AB-2** — b."))).toEqual(["error:not-read@1"]);
  });

  it("reports a marked item that is not bold as not read (error)", () => {
    expect(codes("- [NOW] AB-1 — a.")).toEqual(["error:not-read@1"]);
  });

  it("reports a bold marker that never closes as not read (error)", () => {
    const r = parse("- **[NOW] AB-1 — a.");
    expect(r.entries).toEqual([]);
    expect(codes("- **[NOW] AB-1 — a.")).toEqual(["error:not-read@1"]);
  });

  it("reports unmarked column-0 items as info and nothing else", () => {
    expect(codes(lines("- a plain item", "2. another"))).toEqual([
      "info:unmarked-item@1",
      "info:unmarked-item@2",
    ]);
  });

  it("ignores indented unmarked items and plain text", () => {
    expect(parse(lines("text", "  - nested plain")).report).toEqual([]);
  });
});

describe("R2: the ID", () => {
  it("reads IDs of the documented shapes inside the bold", () => {
    const r = parse(
      lines("- **[NOW] ABC-12** — a.", "- **[NOW] PBI-2.4b** — a.", "- **[NOW] PBI-X.3** — a."),
    );
    expect(r.entries.map((e) => e.id)).toEqual(["ABC-12", "PBI-2.4b", "PBI-X.3"]);
    expect(r.report).toEqual([]);
  });

  it("reads an ID after the bold with a warning, leaving a trailing dot or comma out", () => {
    const r = parse(lines("- **[DONE]** AB-11, — a.", "- **[DONE]** PBI-2.3. — a."));
    expect(r.entries.map((e) => e.id)).toEqual(["AB-11", "PBI-2.3"]);
    expect(r.report.map((x) => x.code)).toEqual([
      "id-outside-bold",
      "no-dash",
      "id-outside-bold",
      "no-dash",
    ]);
  });

  it("reads other text inside the bold as no ID, one warning, and puts that text first in the entry text", () => {
    const r = parse("- **[NOW] ABC-12 urgent** — Fix it.");
    const e = r.entries[0];
    expect(e?.id).toBeNull();
    expect(e?.text).toBe("ABC-12 urgent Fix it.");
    expect(e?.title).toBe("ABC-12 urgent Fix it.");
    expect(r.report.map((x) => x.code)).toEqual(["text-in-bold"]);
  });

  it("does not look for an ID after the bold when the bold holds other text", () => {
    const r = parse("- **[NOW] urgent** AB-9 — Fix it.");
    expect(r.entries[0]?.id).toBeNull();
    expect(r.entries[0]?.text).toBe("urgent AB-9 — Fix it.");
    expect(r.report.map((x) => x.code)).toEqual(["text-in-bold", "no-dash"]);
  });

  it("reads an entry without an ID, with warnings for the ID and the dash", () => {
    const r = parse("- **[NOW]** Just text");
    expect(r.entries[0]?.id).toBeNull();
    expect(r.report.map((x) => x.code)).toEqual(["no-id", "no-dash"]);
  });

  it("does not take a lower-case or single-letter prefix as an ID", () => {
    expect(parse("- **[NOW]** ab-1 — a.").entries[0]?.id).toBeNull();
    expect(parse("- **[NOW]** A-1 — a.").entries[0]?.id).toBeNull();
  });
});

describe("R3: head, notes and the dash", () => {
  it("joins the indented lines under the entry line with single spaces", () => {
    const e = parse(lines("- **[NOW] AB-1** — First", "    second   ", "  third.")).entries[0];
    expect(e?.text).toBe("First second third.");
  });

  it("ends the head at a blank line, at an indented list item and at a column-0 line", () => {
    expect(parse(lines("- **[NOW] AB-1** — A", "", "  B.")).entries[0]?.text).toBe("A");
    expect(parse(lines("- **[NOW] AB-1** — A", "  1. B.")).entries[0]?.text).toBe("A");
    expect(parse(lines("- **[NOW] AB-1** — A", "B.")).entries[0]?.text).toBe("A");
  });

  it("ends the head at an indented fence line right under the entry line, and the fence belongs to the description", () => {
    const e = parse(lines("- **[NOW] AB-1** — Title. Rest", "  ```", "  x. y", "  ```")).entries[0];
    expect(e?.text).toBe("Title. Rest");
    expect(e?.title).toBe("Title.");
    expect(e?.description).toBe(lines("Rest", "  ```", "  x. y", "  ```"));
  });

  it("reads several notes and nested parentheses", () => {
    const e = parse("- **[NOW] AB-1** (a (b) c)   (d) — Text.").entries[0];
    expect(e?.notes).toEqual(["a (b) c", "d"]);
    expect(e?.text).toBe("Text.");
  });

  it("reads notes right after the bold marker when there is no ID", () => {
    const r = parse("- **[NOW]** (note) — Text.");
    expect(r.entries[0]?.notes).toEqual(["note"]);
    expect(r.entries[0]?.text).toBe("Text.");
    expect(r.report.map((x) => x.code)).toEqual(["no-id"]);
  });

  it("reads a note whose parentheses never close to the end of the head: empty title and a warning", () => {
    const r = parse(lines("- **[NOW] AB-1** (open note — Text.", "  more"));
    const e = r.entries[0];
    expect(e?.notes).toEqual(["open note — Text. more"]);
    expect(e?.text).toBe("");
    expect(e?.title).toBe("");
    expect(r.report.map((x) => x.code)).toEqual(["unclosed-note"]);
  });

  it("counts a dash only directly after the ID or the notes", () => {
    const e = parse("- **[NOW] AB-1** Do — this.").entries[0];
    expect(e?.text).toBe("Do — this.");
  });

  it("needs a space on each side of the dash", () => {
    const r = parse("- **[NOW] AB-1** —Text.");
    expect(r.entries[0]?.text).toBe("—Text.");
    expect(r.report.map((x) => x.code)).toEqual(["no-dash"]);
  });

  it("does not take a dash at the very end of the head as the separator", () => {
    const r = parse("- **[NOW] AB-1** —");
    expect(r.entries[0]?.text).toBe("—");
    expect(r.report.map((x) => x.code)).toEqual(["no-dash"]);
  });

  it("keeps a later dash as part of the text", () => {
    expect(parse("- **[NOW] AB-1** — A — B.").entries[0]?.text).toBe("A — B.");
  });
});

describe("R4: title and description", () => {
  const title = (text: string) => parse(`- **[NOW] AB-1** — ${text}`).entries[0]?.title;

  it("takes the first sentence with its full stop", () => {
    expect(title("One. Two.")).toBe("One.");
  });

  it("does not end the title at a full stop inside backticks or parentheses", () => {
    expect(title("Read `a. b` now. Rest.")).toBe("Read `a. b` now.");
    expect(title("Read (a. b) now. Rest.")).toBe("Read (a. b) now.");
  });

  it("does not end the title at a full stop not followed by a space", () => {
    expect(title("Open v1.2 file. Rest.")).toBe("Open v1.2 file.");
  });

  it("takes the whole text when there is no sentence end", () => {
    expect(title("No stop here")).toBe("No stop here");
  });

  it("ends the title at a full stop that ends the head", () => {
    const e = parse(lines("- **[NOW] AB-1** — One.", "  Two.")).entries[0];
    expect(e?.title).toBe("One.");
    expect(e?.description).toBe("Two.");
  });

  it("ends the description at the next non-blank column-0 line", () => {
    const e = parse(lines("- **[NOW] AB-1** — T.", "", "  Detail.", "", "Plain paragraph"))
      .entries[0];
    expect(e?.description).toBe("  Detail.");
  });

  it("ends the description at a heading at column 0 but not at an indented #", () => {
    const e = parse(lines("- **[NOW] AB-1** — T.", "  # Kept", "# Ends")).entries[0];
    expect(e?.description).toBe("# Kept");
  });

  it("ends the description at a fence that opens at column 0, and that fence belongs to no entry", () => {
    const r = parse(
      lines("- **[NOW] AB-1** — T.", "  Detail.", "```", "- **[NOW] AB-2** — Hidden.", "```"),
    );
    expect(r.entries.map((e) => e.id)).toEqual(["AB-1"]);
    expect(r.entries[0]?.description).toBe("Detail.");
  });

  it("has an empty description when nothing follows", () => {
    expect(parse("- **[NOW] AB-1** — T.").entries[0]?.description).toBe("");
  });
});

describe("R5 and R6: headings and groups", () => {
  it("reads headings of any level, trimmed, without a closing run of #", () => {
    const r = parse(lines("# One #", "###### Six   ", "####### Seven", "#NoSpace", "## Two ##  "));
    expect(r.groups).toEqual([
      { level: 1, text: "One", line: 1 },
      { level: 6, text: "Six", line: 2 },
      { level: 2, text: "Two", line: 5 },
    ]);
  });

  it("gives an entry the nearest heading above, of any level, and none before the first", () => {
    const r = parse(
      lines(
        "- **[NOW] AB-1** — a.",
        "## H2",
        "- **[NOW] AB-2** — b.",
        "#### H4",
        "- **[NOW] AB-3** — c.",
        "# H1",
        "- **[NOW] AB-4** — d.",
      ),
    );
    expect(r.entries.map((e) => e.group)).toEqual([null, "H2", "H4", "H1"]);
  });

  it("parses a heading line of 50,000 spaces quickly and keeps the results", () => {
    const long = `# a${" ".repeat(50000)}b`;
    const start = Date.now();
    const r = parse(long);
    expect(Date.now() - start).toBeLessThan(500);
    expect(r.groups).toEqual([{ level: 1, text: `a${" ".repeat(50000)}b`, line: 1 }]);
    expect(parse(`# a${" ".repeat(50000)}#`).groups[0]?.text).toBe("a");
    expect(
      parse(lines("## C#", "## Two ##  ", "# One #", "## ##", "# #x")).groups.map((g) => g.text),
    ).toEqual(["C#", "Two", "One", "", "#x"]);
  });

  it("does not read an indented line starting with # as a heading", () => {
    expect(parse("  # Not").groups).toEqual([]);
  });

  it("reads any marker, and warns about one outside the recommended set", () => {
    const r = parse(lines("- **[WAITING] AB-1** — a.", "- **[NOW] AB-2** — b."));
    expect(r.entries.map((e) => e.marker)).toEqual(["WAITING", "NOW"]);
    expect(r.report.map((x) => `${x.code}@${x.line}`)).toEqual(["unknown-marker@1"]);
  });

  it("lists the template's legend as the recommended set", () => {
    expect([...RECOMMENDED_MARKERS].sort()).toEqual(
      ["BLOCKED", "DONE", "IDEA", "LATER", "MOVED", "NEXT", "NOW", "SUPERSEDED"].sort(),
    );
  });

  it("warns on the later of two entries with the same ID, and reads both", () => {
    const r = parse(lines("- **[NOW] AB-1** — a.", "- **[NEXT] AB-1** — b."));
    expect(r.entries).toHaveLength(2);
    expect(r.report.map((x) => `${x.code}@${x.line}`)).toEqual(["duplicate-id@2"]);
  });
});

describe("R7: fences", () => {
  it("reads nothing inside a backtick fence, its marker lines included", () => {
    const r = parse(
      lines(
        "```md",
        "- **[NOW] AB-1** — Hidden.",
        "# Hidden",
        "- [NOW] bad",
        "- plain",
        "```",
        "- **[NOW] AB-2** — Shown.",
      ),
    );
    expect(r.entries.map((e) => e.id)).toEqual(["AB-2"]);
    expect(r.groups).toEqual([]);
    expect(r.report).toEqual([]);
  });

  it("closes a fence only with a run at least as long, of the same character, and only spaces after", () => {
    const r = parse(
      lines(
        "````",
        "```",
        "~~~~",
        "```` x",
        "- **[NOW] AB-1** — Hidden.",
        "````  ",
        "- **[NOW] AB-2** — Shown.",
      ),
    );
    expect(r.entries.map((e) => e.id)).toEqual(["AB-2"]);
  });

  it("opens a tilde fence, also indented", () => {
    const r = parse(
      lines("  ~~~", "- **[NOW] AB-1** — Hidden.", "  ~~~", "- **[NOW] AB-2** — Shown."),
    );
    expect(r.entries.map((e) => e.id)).toEqual(["AB-2"]);
  });

  it("reports a fence that never closes as info at the line it opens, and hides the rest", () => {
    const r = parse(lines("- **[NOW] AB-1** — a.", "```", "- **[NOW] AB-2** — Hidden."));
    expect(r.entries.map((e) => e.id)).toEqual(["AB-1"]);
    expect(r.report.map((x) => `${x.kind}:${x.code}@${x.line}`)).toEqual(["info:unclosed-fence@2"]);
  });
});

describe("R8: line numbers", () => {
  it("counts from 1 and keeps the numbers across CRLF line ends", () => {
    const r = parse("\r\n## H\r\n- **[NOW] AB-1** — a.\r\n");
    expect(r.groups[0]?.line).toBe(2);
    expect(r.entries[0]?.line).toBe(3);
  });

  it("returns nothing for an empty file", () => {
    expect(parse("")).toEqual({ entries: [], groups: [], report: [] });
  });
});

describe("R9: HTML comments", () => {
  const spec = lines(
    "<!-- - **[NOW] AB-9** — Hidden. -->",
    "- **[NEXT] AB-10** — Drop `<!--` markers.",
    "<!--",
    "- **[NOW] AB-11** — Also hidden.",
    "-->",
  );

  it("drops a one-line comment and a comment across lines, and keeps an entry with <!-- in backticks", () => {
    const r = parse(spec);
    expect(r.entries.map((e) => [e.id, e.line, e.title])).toEqual([
      ["AB-10", 2, "Drop `<!--` markers."],
    ]);
    expect(r.report).toEqual([]);
  });

  it("opens a comment after an indent, and hides headings and report items inside it", () => {
    const r = parse(
      lines("  <!--", "# H", "- [NOW] bad", "- plain", "-->", "- **[NOW] AB-1** — a."),
    );
    expect(r.groups).toEqual([]);
    expect(r.report).toEqual([]);
    expect(r.entries[0]?.line).toBe(6);
  });

  it("treats a <!-- after other text as text", () => {
    const r = parse(lines("text <!--", "- **[NOW] AB-1** — Shown.", "-->"));
    expect(r.entries.map((e) => e.id)).toEqual(["AB-1"]);
  });

  it("closes at the first --> and keeps the text after it on that line", () => {
    const r = parse(
      lines(
        "<!--",
        "- **[NOW] AB-1** — Hidden. --> - **[NOW] AB-2** — Kept.",
        "- **[NOW] AB-3** — Shown.",
      ),
    );
    expect(r.entries.map((e) => e.id)).toEqual(["AB-3"]);
    expect(parse("<!-- x --> # Text").groups).toEqual([]);
  });

  it("keeps the indent of the line: text after --> that starts with a space is an indented marked item (error)", () => {
    const r = parse("<!-- x --> - **[NOW] AB-1** — a.");
    expect(r.entries).toEqual([]);
    expect(r.report.map((x) => `${x.kind}:${x.code}@${x.line}`)).toEqual(["error:not-read@1"]);
  });

  it("keeps the indent of the closing line of a multi-line comment too", () => {
    const r = parse(lines("<!--", "  hidden", "  -->- **[NOW] AB-1** — a."));
    expect(r.entries).toEqual([]);
    expect(r.report.map((x) => `${x.kind}:${x.code}@${x.line}`)).toEqual(["error:not-read@3"]);
    expect(parse(lines("<!--", "-->- **[NOW] AB-1** — a.")).entries.map((e) => e.id)).toEqual([
      "AB-1",
    ]);
  });

  it("reads an entry whose list marker follows --> directly, at column 0", () => {
    expect(parse("<!-- x -->- **[NOW] AB-1** — a.").entries.map((e) => e.id)).toEqual(["AB-1"]);
  });

  it("does not open a fence inside a comment, and does not open a comment inside a fence", () => {
    const r = parse(
      lines(
        "<!--",
        "```",
        "-->",
        "- **[NOW] AB-1** — Shown.",
        "```",
        "<!--",
        "- **[NOW] AB-2** — Still in fence.",
        "-->",
        "```",
      ),
    );
    expect(r.entries.map((e) => e.id)).toEqual(["AB-1"]);
  });

  it("reports a comment that never closes as info at the line it opens, and hides the rest", () => {
    const r = parse(lines("- **[NOW] AB-1** — a.", "<!--", "- **[NOW] AB-2** — Hidden."));
    expect(r.entries.map((e) => e.id)).toEqual(["AB-1"]);
    expect(r.report.map((x) => `${x.kind}:${x.code}@${x.line}`)).toEqual([
      "info:unclosed-comment@2",
    ]);
  });

  it("counts a line that holds only a comment as blank: it ends a head", () => {
    const e = parse(lines("- **[NOW] AB-1** — First", "<!-- gone -->", "  second.")).entries[0];
    expect(e?.text).toBe("First");
  });

  it("keeps line numbers true after a multi-line comment", () => {
    const r = parse(lines("<!--", "a", "b", "-->", "- **[NOW] AB-1** — x."));
    expect(r.entries[0]?.line).toBe(5);
  });
});
