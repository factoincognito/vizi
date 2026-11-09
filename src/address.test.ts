/**
 * Tests for src/address.ts, reading the repository named in the page's own
 * address (docs/SPEC.md 3.16, "Reading the address"). Pure: no DOM, no
 * network.
 */
import { repoFromSearch } from "./address";
import { readRepository } from "./github";

describe("repoFromSearch: which parameter (3.16)", () => {
  test("no search gives no value: the empty search and a lone ?", () => {
    expect(repoFromSearch("")).toBeNull();
    expect(repoFromSearch("?")).toBeNull();
  });

  test("?repo=acme/widgets gives acme/widgets", () => {
    expect(repoFromSearch("?repo=acme/widgets")).toBe("acme/widgets");
  });

  test("a second repo parameter is ignored: the first one counts", () => {
    expect(repoFromSearch("?repo=acme/widgets&repo=beta/tools")).toBe("acme/widgets");
  });

  test("?repo=&repo=acme/widgets gives no value: the first repo part is empty", () => {
    expect(repoFromSearch("?repo=&repo=acme/widgets")).toBeNull();
  });

  test("other parameters are ignored, before and after", () => {
    expect(repoFromSearch("?x=1&repo=acme/widgets")).toBe("acme/widgets");
    expect(repoFromSearch("?repo=acme/widgets&x=1")).toBe("acme/widgets");
    expect(repoFromSearch("?x=1&y=2")).toBeNull();
  });

  test("?repo without = gives no value: a part without = is not the parameter", () => {
    expect(repoFromSearch("?repo")).toBeNull();
  });

  test("?repo&repo=acme/widgets gives acme/widgets: the next repo part is the first one", () => {
    expect(repoFromSearch("?repo&repo=acme/widgets")).toBe("acme/widgets");
  });

  test("the name is compared as written: REPO, r%65po and repos are other parameters", () => {
    expect(repoFromSearch("?REPO=acme/widgets")).toBeNull();
    expect(repoFromSearch("?r%65po=acme/widgets")).toBeNull();
    expect(repoFromSearch("?repos=acme/widgets")).toBeNull();
    expect(repoFromSearch("?Repo=acme/widgets&repo=beta/tools")).toBe("beta/tools");
  });

  test("the value is the text after the part's first =, so a later = stays in it", () => {
    expect(repoFromSearch("?repo=acme/w/tree/a=b")).toBe("acme/w/tree/a=b");
  });

  test("a search without its leading ? is read the same way", () => {
    expect(repoFromSearch("repo=acme/widgets")).toBe("acme/widgets");
  });
});

describe("repoFromSearch: no value (3.16)", () => {
  test("an empty value gives no value", () => {
    expect(repoFromSearch("?repo=")).toBeNull();
  });

  test("a value of white space only, as the field's trim reads it, gives no value", () => {
    expect(repoFromSearch("?repo=%20%20")).toBeNull();
    expect(repoFromSearch("?repo=+++")).toBeNull();
    expect(repoFromSearch("?repo=%09%0A")).toBeNull();
  });

  test("a value with white space around a name is given as decoded; the field trims it", () => {
    expect(repoFromSearch("?repo=+acme/widgets+")).toBe(" acme/widgets ");
  });
});

describe("repoFromSearch: decoding (3.16)", () => {
  test("+ and %20 decode to a space", () => {
    expect(repoFromSearch("?repo=a+b")).toBe("a b");
    expect(repoFromSearch("?repo=a%20b")).toBe("a b");
  });

  test("%25 decodes to % once", () => {
    expect(repoFromSearch("?repo=acme/w/tree/50%25")).toBe("acme/w/tree/50%");
    expect(repoFromSearch("?repo=acme/w/tree/fix-%25C3%25A5")).toBe("acme/w/tree/fix-%C3%A5");
  });

  test("a value with /tree/<branch> is given whole", () => {
    expect(repoFromSearch("?repo=sugose/snake-demo/tree/dev")).toBe("sugose/snake-demo/tree/dev");
    expect(repoFromSearch("?repo=acme/w/tree/feat%2Fx")).toBe("acme/w/tree/feat/x");
  });

  test("an encoded + or & is part of the value", () => {
    expect(repoFromSearch("?repo=acme/w/tree/a%2Bb")).toBe("acme/w/tree/a+b");
    expect(repoFromSearch("?repo=acme/w/tree/a%26b")).toBe("acme/w/tree/a&b");
  });

  test("a raw & ends the value", () => {
    expect(repoFromSearch("?repo=acme/w/tree/a&b")).toBe("acme/w/tree/a");
  });

  test("a full GitHub address is given as written", () => {
    expect(repoFromSearch("?repo=https://github.com/acme/widgets")).toBe(
      "https://github.com/acme/widgets",
    );
    expect(repoFromSearch("?repo=https%3A%2F%2Fgithub.com%2Facme%2Fwidgets")).toBe(
      "https://github.com/acme/widgets",
    );
  });

  test("a malformed escape gives the value undecoded, with only + replaced", () => {
    expect(repoFromSearch("?repo=acme/w/tree/a%E0")).toBe("acme/w/tree/a%E0");
    expect(repoFromSearch("?repo=acme/w/tree/a%E0+b%20c")).toBe("acme/w/tree/a%E0 b%20c");
    expect(repoFromSearch("?repo=acme/w/tree/a%zz")).toBe("acme/w/tree/a%zz");
  });

  test("a lone % gives the value undecoded", () => {
    expect(repoFromSearch("?repo=acme/w/tree/50%")).toBe("acme/w/tree/50%");
  });

  test("no U+FFFD comes from a malformed escape", () => {
    for (const s of ["?repo=acme/w/tree/a%E0", "?repo=acme/w/tree/a%C3", "?repo=a%ED%A0%80"]) {
      expect(repoFromSearch(s)).not.toContain("�");
    }
  });
});

describe("what the field makes of the value (3.16, 3.1)", () => {
  test("a malformed escape and a lone % reach the field, which refuses the branch with its branch message", () => {
    for (const s of ["?repo=acme/w/tree/a%E0", "?repo=acme/w/tree/50%"]) {
      const read = readRepository(repoFromSearch(s) ?? "");
      expect(read.ok).toBe(false);
      if (!read.ok) expect(read.reason).toBe("branch");
    }
  });

  test("fix-å opens from a branch encoded once and from one encoded twice", () => {
    for (const s of ["?repo=acme/w/tree/fix-%C3%A5", "?repo=acme/w/tree/fix-%25C3%25A5"]) {
      const read = readRepository(repoFromSearch(s) ?? "");
      expect(read).toEqual({ ok: true, ref: { owner: "acme", repo: "w", branch: "fix-å" } });
    }
  });

  test("%23 in a link's branch reaches the field as #, which it refuses as a typed # is", () => {
    const value = repoFromSearch("?repo=acme/w/tree/a%23b") ?? "";
    expect(value).toBe("acme/w/tree/a#b");
    const read = readRepository(value);
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.reason).toBe("form");
    expect(read).toEqual(readRepository("acme/w/tree/a#b"));
  });
});
