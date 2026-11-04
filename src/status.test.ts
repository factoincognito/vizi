/**
 * Tests for src/status.ts: S1 to S5 of docs/BACKLOG-FORMAT.md.
 * Every fixture is made up for the test.
 */
import { PRODUCT_OWNER_PREFIXES, parse } from "./status";

const lines = (...l: string[]) => l.join("\n");
const status = (blockers: string, extra: string[] = []) =>
  lines(
    "# Status",
    "",
    "Last update: 2026-11-04",
    "",
    "## Phase",
    "Build.",
    "",
    "## Current focus",
    "The settings page.",
    "",
    "## Next step",
    "Read the file.",
    "",
    "## Blockers",
    blockers,
    ...extra,
  );

describe("S1 and S2: layout and fields", () => {
  const example = lines(
    "<!-- How to keep this file. -->",
    "",
    "# Status",
    "",
    "Last update: 2026-11-04",
    "",
    "## Phase",
    "Build.",
    "",
    "## Current focus",
    "The settings page.",
    "",
    "## Next step",
    "Crog reads the settings file (PBI-2.4).",
    "",
    "## Blockers",
    "- Product Owner: choose the default port.",
    "- Crog: waits for CI on #12.",
    "- The build server is down.",
  );

  it("reads the four fields and Last update of the spec's example", () => {
    const r = parse(example);
    expect(r.phase).toBe("Build.");
    expect(r.currentFocus).toBe("The settings page.");
    expect(r.nextStep).toBe("Crog reads the settings file (PBI-2.4).");
    expect(r.lastUpdate).toBe("2026-11-04");
    expect(r.report).toEqual([]);
  });

  it("reads the three blockers of the example, the first highlighted", () => {
    const r = parse(example);
    expect(r.blockers?.map((b) => [b.text, b.waitingOnProductOwner, b.line])).toEqual([
      ["Product Owner: choose the default port.", true, 17],
      ["Crog: waits for CI on #12.", false, 18],
      ["The build server is down.", false, 19],
    ]);
    expect(r.none).toBe(false);
  });

  it("takes a field's text up to the next heading, multi-line, without blank lines at its ends", () => {
    const r = parse(lines("# Status", "## Phase", "", "One", "", "two", "", "## Next step", "x"));
    expect(r.phase).toBe("One\n\ntwo");
  });

  it("drops comments before reading, also a multi-line one, and keeps line numbers", () => {
    const r = parse(lines("<!--", "## Phase", "Hidden.", "-->", "## Phase", "Shown."));
    expect(r.phase).toBe("Shown.");
    const r2 = parse(
      status("- Product Owner: pick.").replace("# Status", "<!--\nx\n-->\n# Status"),
    );
    expect(r2.blockers?.[0]?.line).toBe(18);
  });

  it("does not drop a <!-- after other text, and does not read a heading inside a fence", () => {
    const r = parse(lines("## Phase", "Uses <!-- here", "```", "## Next step", "hidden", "```"));
    expect(r.phase).toContain("Uses <!-- here");
    expect(r.nextStep).toBeNull();
  });

  it("reports a missing field heading as info and gives null (not given)", () => {
    const r = parse(lines("# Status", "Last update: 2026-11-04", "## Phase", "x"));
    expect(r.currentFocus).toBeNull();
    expect(r.nextStep).toBeNull();
    expect(r.report.map((x) => [x.kind, x.code])).toEqual([
      ["info", "missing-field"],
      ["info", "missing-field"],
      ["info", "missing-field"],
    ]);
  });

  it("reports a missing Last update line as info", () => {
    const r = parse(
      lines("## Phase", "x", "## Current focus", "x", "## Next step", "x", "## Blockers", "None."),
    );
    expect(r.lastUpdate).toBeNull();
    expect(r.report.map((x) => [x.kind, x.code, x.line])).toEqual([
      ["info", "missing-last-update", null],
    ]);
  });

  it("reports a Last update date not in the form YYYY-MM-DD, with its line", () => {
    for (const bad of ["4 Nov 2026", "2026-1-4", "2026-11-04T10:00", ""]) {
      const r = parse(status("None.").replace("Last update: 2026-11-04", `Last update: ${bad}`));
      expect(r.lastUpdate).toBeNull();
      expect(r.report.map((x) => [x.code, x.line])).toEqual([["bad-last-update", 3]]);
    }
  });

  it("reads an empty file as all fields not given", () => {
    const r = parse("");
    expect([r.phase, r.currentFocus, r.nextStep, r.lastUpdate]).toEqual([null, null, null, null]);
    expect(r.blockers).toEqual([]);
    expect(r.report).toHaveLength(5);
  });

  it("reports a comment that never closes as info", () => {
    const r = parse(lines("## Phase", "x", "<!--", "## Next step"));
    expect(r.report.map((x) => [x.kind, x.code, x.line])).toContainEqual([
      "info",
      "unclosed-comment",
      3,
    ]);
  });
});

describe("S3: one blocker", () => {
  it("reads each column-0 list item with its indented lines as one blocker, and ignores other lines", () => {
    const r = parse(
      status(lines("Intro text.", "- First", "  continues.", "1. Second", "", "Stray.")),
    );
    expect(r.blockers?.map((b) => b.text)).toEqual(["First continues.", "Second"]);
  });

  it("reads each paragraph as one blocker when there are no column-0 list items", () => {
    const r = parse(status(lines("Product Owner: approve", "the spec.", "", "CI is red on main.")));
    expect(r.blockers?.map((b) => [b.text, b.waitingOnProductOwner])).toEqual([
      ["Product Owner: approve the spec.", true],
      ["CI is red on main.", false],
    ]);
  });

  it("does not count an indented list item as a column-0 item", () => {
    const r = parse(status("  - indented only"));
    expect(r.blockers?.map((b) => b.text)).toEqual(["- indented only"]);
  });
});

describe("S4: None", () => {
  it("reads None. as no blockers", () => {
    const r = parse(status("None."));
    expect(r.blockers).toEqual([]);
    expect(r.none).toBe(true);
    expect(r.remark).toBeNull();
  });

  it("reads None on its own, and in a list item, as no blockers", () => {
    expect(parse(status("None")).none).toBe(true);
    expect(parse(status("- None")).none).toBe(true);
  });

  it("keeps the rest after None. as a remark, not highlighted", () => {
    const r = parse(status("None. The release waits until the next test run passes."));
    expect(r.none).toBe(true);
    expect(r.blockers).toEqual([]);
    expect(r.remark).toBe("The release waits until the next test run passes.");
  });

  it("reads None followed by other words as a blocker", () => {
    const r = parse(status("None of the CI runners start."));
    expect(r.none).toBe(false);
    expect(r.blockers?.map((b) => [b.text, b.waitingOnProductOwner])).toEqual([
      ["None of the CI runners start.", false],
    ]);
  });

  it("still reads the other blockers next to a None item", () => {
    const r = parse(status(lines("- None.", "- Product Owner: decide.")));
    expect(r.none).toBe(true);
    expect(r.blockers?.map((b) => b.text)).toEqual(["Product Owner: decide."]);
  });

  it("tells a missing Blockers heading (null, not given) from an empty Blockers section ([])", () => {
    const missing = parse(lines("## Phase", "x"));
    expect(missing.blockers).toBeNull();
    expect(missing.none).toBe(false);
    expect(missing.report.map((x) => x.code)).toContain("missing-field");
    const empty = parse(lines("## Phase", "x", "## Blockers", ""));
    expect(empty.blockers).toEqual([]);
    expect(empty.none).toBe(false);
  });

  it("reads the first of two sections with the same heading and ignores the second", () => {
    const r = parse(lines("## Phase", "First", "## Phase", "Second"));
    expect(r.phase).toBe("First");
  });
});

describe("S5: waiting on the product owner", () => {
  it("has Product Owner: as the default prefix", () => {
    expect(PRODUCT_OWNER_PREFIXES).toEqual(["Product Owner:"]);
  });

  it("highlights only a blocker that starts exactly with the prefix, case-sensitive", () => {
    const r = parse(
      status(
        lines(
          "- Product Owner: yes",
          "- product owner: no",
          "- Crog: no",
          "- CI: no",
          "- Waits for Product Owner: no",
          "-  Product Owner: after spaces",
        ),
      ),
    );
    expect(r.blockers?.map((b) => b.waitingOnProductOwner)).toEqual([
      true,
      false,
      false,
      false,
      false,
      true,
    ]);
  });
});
