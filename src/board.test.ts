/**
 * Tests for src/board.ts: the board columns and the list of docs/SPEC.md 3.2.
 */
import { type BacklogEntry, parse } from "./backlog";
import { boardColumns, descriptionForDisplay, entryMatches, listSections } from "./board";

const lines = (...l: string[]) => l.join("\n");
const entry = (marker: string, id: string, extra: Partial<BacklogEntry> = {}): BacklogEntry => ({
  marker,
  id,
  notes: [],
  text: "",
  title: `Title of ${id}.`,
  description: "",
  headRest: "",
  group: null,
  line: 1,
  ...extra,
});

describe("boardColumns", () => {
  it("orders the markers NOW, NEXT, BLOCKED, LATER, IDEA, then DONE, SUPERSEDED, MOVED folded, then others in order first seen", () => {
    const entries = [
      "DONE",
      "ZETA",
      "NOW",
      "MOVED",
      "ALPHA",
      "IDEA",
      "SUPERSEDED",
      "LATER",
      "BLOCKED",
      "NEXT",
      "ZETA",
    ].map((m, i) => entry(m, `AB-${i}`));
    expect(boardColumns(entries).map((c) => [c.marker, c.folded])).toEqual([
      ["NOW", false],
      ["NEXT", false],
      ["BLOCKED", false],
      ["LATER", false],
      ["IDEA", false],
      ["DONE", true],
      ["SUPERSEDED", true],
      ["MOVED", true],
      ["ZETA", false],
      ["ALPHA", false],
    ]);
  });

  it("makes a column only for a marker found, with its entries in file order", () => {
    const cols = boardColumns([entry("NEXT", "AB-1"), entry("NOW", "AB-2"), entry("NEXT", "AB-3")]);
    expect(cols.map((c) => [c.marker, c.entries.map((e) => e.id)])).toEqual([
      ["NOW", ["AB-2"]],
      ["NEXT", ["AB-1", "AB-3"]],
    ]);
  });

  it("has no column for an empty backlog", () => {
    expect(boardColumns([])).toEqual([]);
  });
});

describe("entryMatches and listSections", () => {
  const parsed = parse(
    lines(
      "- **[NOW] AA-1** — Early entry before any heading.",
      "## First",
      "- **[NEXT] AB-2** (spec: `x`) — Read the Settings file. More detail here.",
      "- **[LATER] AB-3** — Other thing.",
      "  Hidden Needle in the description.",
      "## Empty",
      "## Second",
      "- **[NOW] AB-4** — Fourth.",
    ),
  );

  it("groups entries under the backlog's own headings in file order, with (no heading) first for early entries", () => {
    expect(
      listSections(parsed.entries, { marker: null, query: "" }).map((s) => [
        s.heading,
        s.entries.map((e) => e.id),
      ]),
    ).toEqual([
      ["(no heading)", ["AA-1"]],
      ["First", ["AB-2", "AB-3"]],
      ["Second", ["AB-4"]],
    ]);
  });

  it("filters by marker and drops sections left empty", () => {
    expect(
      listSections(parsed.entries, { marker: "NOW", query: "" }).map((s) => [
        s.heading,
        s.entries.map((e) => e.id),
      ]),
    ).toEqual([
      ["(no heading)", ["AA-1"]],
      ["Second", ["AB-4"]],
    ]);
  });

  it("searches the ID, notes, title and description, ignoring case", () => {
    const ids = (q: string) => parsed.entries.filter((e) => entryMatches(e, q)).map((e) => e.id);
    expect(ids("ab-3")).toEqual(["AB-3"]);
    expect(ids("SPEC:")).toEqual(["AB-2"]);
    expect(ids("settings FILE")).toEqual(["AB-2"]);
    expect(ids("needle")).toEqual(["AB-3"]);
    expect(ids("")).toHaveLength(4);
    expect(ids("nothing like this")).toEqual([]);
  });

  it("combines the marker filter and the search", () => {
    expect(listSections(parsed.entries, { marker: "NEXT", query: "needle" })).toEqual([]);
    expect(
      listSections(parsed.entries, { marker: "LATER", query: "needle" }).map((s) => s.heading),
    ).toEqual(["First"]);
  });
});

describe("descriptionForDisplay (SPEC 3.7 item 2)", () => {
  it("removes the smallest indent of the lines below the head, leaving the rest of the head alone", () => {
    const e = entry("NOW", "AB-1", {
      headRest: "Rest of head.",
      description: "Rest of head.\n\n    deep\n      deeper\n    deep again",
    });
    expect(descriptionForDisplay(e)).toBe("Rest of head.\n\ndeep\n  deeper\ndeep again");
  });

  it("works when the head has no rest: every line is below the head", () => {
    const e = entry("NOW", "AB-1", { headRest: "", description: "  one\n\n   two" });
    expect(descriptionForDisplay(e)).toBe("one\n\n two");
  });

  it("removes nothing when a line is at column 0 (a fence line inside the description)", () => {
    const e = entry("NOW", "AB-1", { headRest: "", description: "  ```\nx\n  ```" });
    expect(descriptionForDisplay(e)).toBe("  ```\nx\n  ```");
  });

  it("returns an empty description as it is", () => {
    expect(descriptionForDisplay(entry("NOW", "AB-1"))).toBe("");
  });

  it("is fed by the parser: the head's rest is the first line only when there is one", () => {
    const [a, b] = parse(
      lines(
        "- **[NOW] AB-1** — T. Rest.",
        "",
        "    code-looking",
        "- **[NOW] AB-2** — T.",
        "",
        "    code-looking",
      ),
    ).entries;
    expect(a?.headRest).toBe("Rest.");
    expect(b?.headRest).toBe("");
    expect(descriptionForDisplay(a as BacklogEntry)).toBe("Rest.\n\ncode-looking");
    expect(descriptionForDisplay(b as BacklogEntry)).toBe("code-looking");
  });
});
