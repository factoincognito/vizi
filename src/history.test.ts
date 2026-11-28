/**
 * Tests for src/history.ts, the version history (docs/SPEC.md 3.17). The
 * list is checked by `checkHistory`, which is given lists that are wrong as
 * well as the shipped one. The decision of what opens at a load is given
 * the version and a store as arguments, so no browser is needed; the getter
 * that throws, `browserStorage()` in src/main.ts, is covered by Playwright.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkHistory,
  compareVersions,
  entryHeading,
  HISTORY,
  HISTORY_TITLE,
  type HistoryEntry,
  isVersion,
  SEEN_KEY,
  type SeenStore,
  SHOW_FULL_HISTORY,
  upgradeEntries,
  versionLabel,
  WHATS_NEW_TITLE,
} from "./history";

const entry = (
  version: string,
  lines: string[] = ["A line."],
  date = "2026-11-28",
): HistoryEntry => ({
  version,
  date,
  lines,
});

describe("the form of a version (3.17 item 2)", () => {
  test.each(["0.2.0", "1.10.0", "0.0.0", "10.20.30", "0.18446744073709551616.0"])(
    "accepts %j",
    (text) => {
      expect(isVersion(text)).toBe(true);
    },
  );

  test.each([
    ["the empty string", ""],
    ["a v in front", "v0.2.0"],
    ["a space before", " 0.2.0"],
    ["a space after", "0.2.0 "],
    ["a line break after", "0.2.0\n"],
    ["two numbers", "0.2"],
    ["four numbers", "0.2.0.1"],
    ["a leading zero in the first", "00.2.0"],
    ["a leading zero in the second", "0.02.0"],
    ["a leading zero in the third", "0.2.00"],
    ["a prerelease part", "0.2.0-rc.1"],
    ["a build part", "0.2.0+a"],
    ["a negative number", "-1.0.0"],
    ["an empty number", "0..0"],
    ["full-width digits", "０.２.０"],
    ["Arabic-Indic digits", "٠.٢.٠"],
    ["a letter", "0.2.x"],
  ])("refuses %s", (_name, text) => {
    expect(isVersion(text)).toBe(false);
  });

  test("refuses what is not a string", () => {
    for (const value of [null, undefined, 2, {}, ["0.2.0"]]) expect(isVersion(value)).toBe(false);
  });
});

describe("the comparison of two versions (3.17 item 2)", () => {
  const lower = (a: string, b: string) => {
    expect(compareVersions(a, b)).toBeLessThan(0);
    expect(compareVersions(b, a)).toBeGreaterThan(0);
  };

  test("is by number, not by text: 0.9.0 < 0.10.0 < 0.11.0", () => {
    lower("0.9.0", "0.10.0");
    lower("0.10.0", "0.11.0");
    lower("0.9.0", "0.11.0");
  });

  test("the first difference decides", () => {
    lower("0.99.99", "1.0.0");
    lower("1.2.3", "1.2.4");
    lower("1.2.99", "1.3.0");
    lower("0.0.1", "0.1.0");
  });

  test("equal versions are equal", () => {
    expect(compareVersions("0.2.0", "0.2.0")).toBe(0);
    expect(compareVersions("10.20.30", "10.20.30")).toBe(0);
  });

  test("numbers longer than a machine integer compare correctly", () => {
    lower("0.18446744073709551615.0", "0.18446744073709551616.0");
    lower("0.9007199254740993.0", "0.9007199254740994.0");
    expect(compareVersions("0.18446744073709551616.0", "0.18446744073709551616.0")).toBe(0);
  });
});

describe("the list's check (3.17 item 3)", () => {
  test("the shipped list has no problem", () => {
    expect(checkHistory(HISTORY)).toEqual([]);
  });

  test("a list that is right has no problem", () => {
    expect(checkHistory([entry("1.10.0"), entry("1.9.0", ["a", "b"]), entry("0.0.0")])).toEqual([]);
  });

  test("an empty list has a problem", () => {
    expect(checkHistory([])).toEqual(["The list is empty."]);
  });

  test.each(["v0.2.0", "0.2", "00.2.0", "", "0.2.0\n"])(
    "an entry with the version %j of the wrong form is reported",
    (version) => {
      const problems = checkHistory([entry(version)]);
      expect(problems).toHaveLength(1);
      expect(problems[0]).toContain("is not of the form");
    },
  );

  test("a version that is repeated is reported, next to itself or later", () => {
    for (const list of [
      [entry("0.2.0"), entry("0.2.0")],
      [entry("0.3.0"), entry("0.2.0"), entry("0.3.0")],
    ]) {
      const problems = checkHistory(list);
      expect(problems.some((p) => p.includes("is repeated"))).toBe(true);
    }
    expect(checkHistory([entry("0.2.0"), entry("0.2.0")])).toHaveLength(1);
  });

  test("an ascending order is reported", () => {
    const problems = checkHistory([entry("0.1.0"), entry("0.2.0")]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("descending order");
  });

  test("the order is by number: 0.10.0 above 0.9.0 is right, below it is not", () => {
    expect(checkHistory([entry("0.10.0"), entry("0.9.0")])).toEqual([]);
    expect(checkHistory([entry("0.9.0"), entry("0.10.0")])).toHaveLength(1);
  });

  test.each([
    ["2026-02-30", "a day that does not exist"],
    ["2026-13-01", "a month that does not exist"],
    ["2026-00-10", "month zero"],
    ["2026-04-31", "April 31"],
    ["2026-2-3", "no leading zeros"],
    ["", "the empty text"],
    ["28-11-2026", "the wrong order"],
    ["2026-11-28 ", "a trailing space"],
    ["2026-11-28\n", "a trailing line break"],
    ["２０２６-11-28", "full-width digits"],
  ])("a date of %j (%s) is reported", (date) => {
    const problems = checkHistory([entry("0.2.0", ["A line."], date)]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("is not a calendar date");
  });

  test("a real calendar date is accepted, a leap day too", () => {
    expect(checkHistory([entry("0.2.0", ["A line."], "2024-02-29")])).toEqual([]);
    expect(checkHistory([entry("0.2.0", ["A line."], "2026-02-29")])).toHaveLength(1);
    expect(checkHistory([entry("0.2.0", ["A line."], "2000-02-29")])).toEqual([]);
    expect(checkHistory([entry("0.2.0", ["A line."], "1900-02-29")])).toHaveLength(1);
  });

  test("an entry with no lines is reported", () => {
    const problems = checkHistory([entry("0.2.0", [])]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("has no lines");
  });

  test.each([
    ["an empty line", ""],
    ["a line of spaces only", "   "],
    ["a line of a tab and a line break", "\t\n"],
  ])("%s is reported", (_name, line) => {
    const problems = checkHistory([entry("0.2.0", ["A good line.", line])]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("line 2 is empty or only spaces");
  });

  test("a line that is not text is reported", () => {
    const bad = { version: "0.2.0", date: "2026-11-28", lines: [42] } as unknown as HistoryEntry;
    expect(checkHistory([bad]).some((p) => p.includes("line 1"))).toBe(true);
  });

  test("every problem of a list is reported, with the entry it is in", () => {
    const problems = checkHistory([entry("0.1.0", []), entry("x", [""], "2026-02-30")]);
    expect(problems.length).toBeGreaterThanOrEqual(4);
    expect(problems.every((p) => /^Entry [12] \(/.test(p))).toBe(true);
  });

  test("a line with markup is data like any other: the check does not read it as HTML", () => {
    expect(checkHistory([entry("0.2.0", ["Use <b>bold</b> & more."])])).toEqual([]);
  });
});

describe("the shipped list and package.json (3.17 items 2 and 3)", () => {
  const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as {
    version: string;
  };

  test("the version of package.json is of the form", () => {
    expect(isVersion(pkg.version)).toBe(true);
  });

  test("the first entry of the list is the version of package.json", () => {
    expect(HISTORY[0]?.version).toBe(pkg.version);
  });

  test("the list starts with the entries 0.2.0 and 0.1.0, dated 2026-11-28", () => {
    expect(HISTORY.map((e) => [e.version, e.date])).toEqual([
      ["0.2.0", "2026-11-28"],
      ["0.1.0", "2026-11-28"],
    ]);
  });

  test("package-lock.json holds the same version twice, as the package's own entries", () => {
    const lock = JSON.parse(readFileSync(join(__dirname, "..", "package-lock.json"), "utf8")) as {
      version: string;
      packages: Record<string, { version: string }>;
    };
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages[""]?.version).toBe(pkg.version);
  });
});

/** A store that keeps one value and records every write. */
function memoryStore(initial: string | null) {
  let value = initial;
  const writes: [string, string][] = [];
  const reads: string[] = [];
  const store: SeenStore = {
    getItem: (key) => {
      reads.push(key);
      return key === SEEN_KEY ? value : null;
    },
    setItem: (key, text) => {
      writes.push([key, text]);
      if (key === SEEN_KEY) value = text;
    },
  };
  return { store, writes, reads, value: () => value };
}

const THREE = [entry("0.4.0"), entry("0.3.0"), entry("0.2.0"), entry("0.1.0")];
const versions = (list: readonly HistoryEntry[] | null) => list?.map((e) => e.version) ?? null;

describe("what opens at a load (3.17 item 4)", () => {
  test("the key is vizi.seenVersion", () => {
    expect(SEEN_KEY).toBe("vizi.seenVersion");
  });

  test("S missing: nothing opens and V is written", () => {
    const m = memoryStore(null);
    expect(upgradeEntries("0.3.0", m.store, THREE)).toBeNull();
    expect(m.writes).toEqual([[SEEN_KEY, "0.3.0"]]);
  });

  test.each([
    "",
    "v0.1.0",
    "0.1",
    "0.1.0 ",
    "0.1.0\n",
    "00.1.0",
    "garbage",
    '{"version":"0.1.0"}',
    "０.１.０",
  ])("S %j is not of the form: nothing opens and V is written", (stored) => {
    const m = memoryStore(stored);
    expect(upgradeEntries("0.3.0", m.store, THREE)).toBeNull();
    expect(m.writes).toEqual([[SEEN_KEY, "0.3.0"]]);
  });

  test("S equal to V: nothing opens and V is written", () => {
    const m = memoryStore("0.3.0");
    expect(upgradeEntries("0.3.0", m.store, THREE)).toBeNull();
    expect(m.writes).toEqual([[SEEN_KEY, "0.3.0"]]);
    expect(m.value()).toBe("0.3.0");
  });

  test("S higher than V (an older build): nothing opens and V is written", () => {
    const m = memoryStore("0.10.0");
    expect(upgradeEntries("0.3.0", m.store, THREE)).toBeNull();
    expect(m.writes).toEqual([[SEEN_KEY, "0.3.0"]]);
    expect(m.value()).toBe("0.3.0");
  });

  test("S lower than V with one entry in between: that entry, and V is written", () => {
    const m = memoryStore("0.2.0");
    expect(versions(upgradeEntries("0.3.0", m.store, THREE))).toEqual(["0.3.0"]);
    expect(m.writes).toEqual([[SEEN_KEY, "0.3.0"]]);
  });

  test("S lower than V with several entries in between: those, newest first as given, none of S or below, none above V", () => {
    const m = memoryStore("0.1.0");
    expect(versions(upgradeEntries("0.3.0", m.store, THREE))).toEqual(["0.3.0", "0.2.0"]);
    expect(m.writes).toEqual([[SEEN_KEY, "0.3.0"]]);
  });

  test("the entries are compared by number: 0.9.0 is lower than 0.10.0", () => {
    const list = [entry("0.11.0"), entry("0.10.0"), entry("0.9.0")];
    const m = memoryStore("0.9.0");
    expect(versions(upgradeEntries("0.10.0", m.store, list))).toEqual(["0.10.0"]);
  });

  test("S lower than V with no entry in between: nothing opens, V is written", () => {
    const m = memoryStore("0.2.0");
    const list = [entry("0.4.0"), entry("0.1.0")];
    expect(upgradeEntries("0.3.0", m.store, list)).toBeNull();
    expect(m.writes).toEqual([[SEEN_KEY, "0.3.0"]]);
  });

  test("an empty list: nothing opens, V is written", () => {
    const m = memoryStore("0.1.0");
    expect(upgradeEntries("0.3.0", m.store, [])).toBeNull();
    expect(m.writes).toEqual([[SEEN_KEY, "0.3.0"]]);
  });

  test("an entry whose version is of the wrong form is never shown", () => {
    const m = memoryStore("0.1.0");
    const list = [entry("0.3.0"), entry("v0.2.5"), entry("0.2.0")];
    expect(versions(upgradeEntries("0.3.0", m.store, list))).toEqual(["0.3.0", "0.2.0"]);
  });

  test("V not of the form: nothing opens, nothing is written, the store is not read", () => {
    for (const bad of ["", "v0.3.0", "0.3", "0.3.0\n", "0.3.0-rc.1", "undefined", "０.３.０"]) {
      const m = memoryStore("0.1.0");
      expect(upgradeEntries(bad, m.store, THREE)).toBeNull();
      expect(m.writes).toEqual([]);
      expect(m.reads).toEqual([]);
      expect(m.value()).toBe("0.1.0");
    }
  });

  test("a store that throws on reading: nothing opens, V is written", () => {
    const writes: [string, string][] = [];
    const store: SeenStore = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: (key, text) => void writes.push([key, text]),
    };
    expect(upgradeEntries("0.3.0", store, THREE)).toBeNull();
    expect(writes).toEqual([[SEEN_KEY, "0.3.0"]]);
  });

  test("a store that throws on writing: the decision is still made, and the failure is ignored", () => {
    const failing = (stored: string | null): SeenStore => ({
      getItem: () => stored,
      setItem: () => {
        throw new Error("quota");
      },
    });
    expect(versions(upgradeEntries("0.3.0", failing("0.1.0"), THREE))).toEqual(["0.3.0", "0.2.0"]);
    expect(upgradeEntries("0.3.0", failing(null), THREE)).toBeNull();
    expect(upgradeEntries("0.3.0", failing("0.3.0"), THREE)).toBeNull();
    expect(upgradeEntries("0.3.0", failing("junk"), THREE)).toBeNull();
  });

  test("a store that throws on reading and on writing: nothing opens and nothing throws", () => {
    const store: SeenStore = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    expect(upgradeEntries("0.3.0", store, THREE)).toBeNull();
  });

  test("no store (the storage cannot be got hold of): nothing opens and nothing throws", () => {
    expect(upgradeEntries("0.3.0", null, THREE)).toBeNull();
    expect(upgradeEntries("0.3.0", undefined, THREE)).toBeNull();
  });

  test("a read that returns something that is not text counts as missing", () => {
    const writes: [string, string][] = [];
    const store = {
      getItem: () => 5,
      setItem: (key: string, text: string) => void writes.push([key, text]),
    } as unknown as SeenStore;
    expect(upgradeEntries("0.3.0", store, THREE)).toBeNull();
    expect(writes).toEqual([[SEEN_KEY, "0.3.0"]]);
  });

  test("the version is written once and only the one key is touched", () => {
    const m = memoryStore("0.1.0");
    upgradeEntries("0.3.0", m.store, THREE);
    expect(m.writes).toHaveLength(1);
    expect(m.reads).toEqual([SEEN_KEY]);
  });

  test("the second load of the same version opens nothing: it opens once in a browser", () => {
    const m = memoryStore("0.1.0");
    expect(versions(upgradeEntries("0.3.0", m.store, THREE))).toEqual(["0.3.0", "0.2.0"]);
    expect(upgradeEntries("0.3.0", m.store, THREE)).toBeNull();
  });

  test("the list given is not changed", () => {
    const list = [...THREE];
    const copy = JSON.stringify(list);
    upgradeEntries("0.3.0", memoryStore("0.1.0").store, list);
    expect(JSON.stringify(list)).toBe(copy);
  });
});

describe("the texts of the view (3.17 items 5 and 6)", () => {
  test("the titles and the button are those of 3.17, the apostrophe being U+0027", () => {
    expect(HISTORY_TITLE).toBe("Version history");
    expect(WHATS_NEW_TITLE).toBe("What's new");
    expect(WHATS_NEW_TITLE.charCodeAt(4)).toBe(0x27);
    expect(SHOW_FULL_HISTORY).toBe("Show full history");
  });

  test("an entry's heading is the version, a space, U+00B7, a space and the date", () => {
    expect(entryHeading(entry("0.2.0", ["x"], "2026-11-28"))).toBe(
      "Version 0.2.0 \u00b7 2026-11-28",
    );
  });

  test("the footer's label is Version and the number, and nothing when V is not of the form", () => {
    expect(versionLabel("0.2.0")).toBe("Version 0.2.0");
    for (const bad of ["", "v0.2.0", "0.2", "undefined"]) expect(versionLabel(bad)).toBeNull();
  });
});

describe("the rendering path (3.17 item 9, 3.7 item 3)", () => {
  for (const file of ["history.ts", "main.ts"]) {
    test(`src/${file} holds no innerHTML, outerHTML or insertAdjacentHTML`, () => {
      const source = readFileSync(join(__dirname, file), "utf8");
      expect(source).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML/);
    });
  }

  test("src/history.ts loads nothing: no import, no fetch, no XMLHttpRequest", () => {
    const source = readFileSync(join(__dirname, "history.ts"), "utf8");
    expect(source).not.toMatch(/^\s*import\b/m);
    expect(source).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|import\s*\(/);
  });
});
