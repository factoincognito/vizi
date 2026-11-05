/**
 * Tests for src/branches.ts: reading the branch list and building the
 * picker's options (docs/SPEC.md 3.13). Pure: no network, no DOM.
 */
import {
  BRANCH_LIST_NOT_UNDERSTOOD,
  BRANCH_PAGES,
  BRANCHES_PER_PAGE,
  branchOptions,
  cannotOpen,
  capMessage,
  listFailureMessage,
  mergeBranchPages,
  morePagesMayExist,
  READING_BRANCHES,
  readBranchPage,
} from "./branches";

const page = (items: unknown[]) => JSON.stringify(items);
const named = (...names: string[]) => names.map((name) => ({ name, commit: { sha: "0" } }));

describe("readBranchPage (3.13, an answer read as a list)", () => {
  test("reads each item's name, in order, and counts every item of the array", () => {
    expect(readBranchPage(page(named("main", "dev")))).toEqual({
      ok: true,
      names: ["main", "dev"],
      count: 2,
    });
  });

  test("skips items that are not objects, have no name string, or an empty one; they still count", () => {
    const r = readBranchPage(
      page([
        { name: "main" },
        null,
        "dev",
        7,
        [],
        { name: 12 },
        { nom: "x" },
        { name: "" },
        { name: "feat/x" },
      ]),
    );
    expect(r).toEqual({ ok: true, names: ["main", "feat/x"], count: 9 });
  });

  test("an empty array is a page with no names", () => {
    expect(readBranchPage("[]")).toEqual({ ok: true, names: [], count: 0 });
  });

  test.each([
    ["an object", '{"message":"Not Found"}'],
    ["null", "null"],
    ["a string", '"main"'],
    ["not JSON", "<html>"],
    ["empty", ""],
  ])("an answer that is %s is a failure", (_what, text) => {
    expect(readBranchPage(text)).toEqual({ ok: false });
  });

  test("the failure's message", () => {
    expect(BRANCH_LIST_NOT_UNDERSTOOD).toBe(
      "GitHub's answer for the branch list was not understood.",
    );
  });
});

describe("mergeBranchPages", () => {
  test("keeps the pages' order, and lists a name that is there twice once", () => {
    expect(mergeBranchPages([["main", "dev", "main"], ["x", "dev"], ["y"]])).toEqual([
      "main",
      "dev",
      "x",
      "y",
    ]);
  });
});

describe("the pages and the cap (3.13)", () => {
  test("pages of 100, at most 3", () => {
    expect(BRANCHES_PER_PAGE).toBe(100);
    expect(BRANCH_PAGES).toBe(3);
  });

  test("more may exist only when the third page held 100 items", () => {
    expect(morePagesMayExist([100, 100, 100])).toBe(true);
    expect(morePagesMayExist([100, 37])).toBe(false);
    expect(morePagesMayExist([100, 100, 99])).toBe(false);
    expect(morePagesMayExist([12])).toBe(false);
    expect(morePagesMayExist([])).toBe(false);
  });

  test("a page that counts 100 items for 99 names (one skipped or a repeat) still counts as full", () => {
    const items = [...named(...Array.from({ length: 99 }, (_, i) => `b${i}`)), { name: "" }];
    const read = readBranchPage(page(items));
    expect(read).toMatchObject({ ok: true, count: 100 });
    if (!read.ok) throw new Error("not read");
    expect(read.names).toHaveLength(99);
    expect(morePagesMayExist([100, 100, read.count])).toBe(true);
    const repeat = readBranchPage(
      page(named(...Array.from({ length: 99 }, (_, i) => `c${i}`), "c0")),
    );
    expect(repeat).toMatchObject({ ok: true, count: 100 });
  });

  test("the cap message, with the project's owner and repo written in and <branch> left as written", () => {
    expect(capMessage("fomo-t", "fomo-f")).toBe(
      "vizi lists the first 300 branches GitHub gives. To open another branch, paste its address, https://github.com/fomo-t/fomo-f/tree/<branch>, with the branch's name in place of <branch>.",
    );
  });

  test("the failure messages: could not be read, or incomplete when a page was read", () => {
    expect(listFailureMessage("GitHub answered HTTP 500 for x.", 0)).toBe(
      "The branch list could not be read: GitHub answered HTTP 500 for x.",
    );
    expect(listFailureMessage("GitHub answered HTTP 500 for x.", 1)).toBe(
      "The branch list is incomplete: GitHub answered HTTP 500 for x.",
    );
    expect(READING_BRANCHES).toBe("Reading the branches…");
  });
});

describe("branchOptions (3.13, the options)", () => {
  const labels = (opts: ReturnType<typeof branchOptions>) => opts.map((o) => o.label);

  test("the default first with (default), then the others by character codes, so B before a", () => {
    const opts = branchOptions(["dev", "a-lower", "main", "B-upper", "feat/x"], "main", "main");
    expect(labels(opts)).toEqual(["main (default)", "B-upper", "a-lower", "dev", "feat/x"]);
    expect(opts.map((o) => o.name)).toEqual(["main", "B-upper", "a-lower", "dev", "feat/x"]);
    expect(opts.filter((o) => o.selected).map((o) => o.name)).toEqual(["main"]);
  });

  test("no default mark when the default is not known", () => {
    const opts = branchOptions(["main", "dev"], "dev", null);
    expect(labels(opts)).toEqual(["dev", "main"]);
    expect(opts.find((o) => o.selected)?.name).toBe("dev");
  });

  test("the current branch is added first, selected, when it is not in the list", () => {
    const opts = branchOptions(["main", "dev"], "gone", "main");
    expect(labels(opts)).toEqual(["gone", "main (default)", "dev"]);
    expect(opts[0]).toMatchObject({ name: "gone", selected: true, disabled: false });
    expect(opts.filter((o) => o.selected)).toHaveLength(1);
  });

  test("with no names read, the current branch is the only option", () => {
    expect(branchOptions([], "main", "main")).toEqual([
      { name: "main", label: "main (default)", disabled: false, selected: true },
    ]);
  });

  test("names with # or %, and ? as a defence, are disabled and say so; others are not", () => {
    const opts = branchOptions(["a#b", "50%", "q?x", "ok-name", "feat/x"], "ok-name", null);
    const by = Object.fromEntries(opts.map((o) => [o.name, o]));
    for (const name of ["a#b", "50%", "q?x"]) {
      expect(by[name]).toMatchObject({
        disabled: true,
        label: `${name} (cannot be opened in vizi)`,
      });
    }
    for (const name of ["ok-name", "feat/x"]) expect(by[name]?.disabled).toBe(false);
    expect(cannotOpen("a#b")).toBe(true);
    expect(cannotOpen("<img src=x>")).toBe(false);
  });
});
