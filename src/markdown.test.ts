/**
 * Tests for src/markdown.ts: the rendering contract of docs/SPEC.md 3.7.
 * Every fixture is made up for the test.
 */
import {
  type Block,
  classifyTarget,
  type Inline,
  type LinkTarget,
  render,
  renderInline,
  resolvePath,
  slugify,
} from "./markdown";

const lines = (...l: string[]) => l.join("\n");

/** All text of a tree, to check that something is shown as text. */
function textOf(nodes: (Block | Inline)[]): string {
  return nodes
    .map((n) => {
      if (n.t === "text" || n.t === "code") return n.text;
      if (n.t === "list") return n.items.map((i) => textOf(i)).join(" ");
      return textOf(n.children);
    })
    .join("");
}
function links(nodes: (Block | Inline)[]): LinkTarget[] {
  return nodes.flatMap((n) => {
    if (n.t === "text" || n.t === "code") return [];
    if (n.t === "list") return n.items.flatMap((i) => links(i));
    return [...(n.t === "link" ? [n.target] : []), ...links(n.children)];
  });
}

describe("3.7 item 3: what Markdown becomes", () => {
  it("reads headings with level and slug", () => {
    expect(render("## Hello, World!")).toEqual([
      {
        t: "heading",
        level: 2,
        slug: "hello-world",
        children: [{ t: "text", text: "Hello, World!" }],
      },
    ]);
  });

  it("joins the lines of a paragraph and splits paragraphs at blank lines", () => {
    expect(render(lines("one", "two", "", "three"))).toEqual([
      { t: "paragraph", children: [{ t: "text", text: "one two" }] },
      { t: "paragraph", children: [{ t: "text", text: "three" }] },
    ]);
  });

  it("reads emphasis, strong emphasis and code spans", () => {
    expect(renderInline("a *b* **c** `d` _e_ __f__")).toEqual([
      { t: "text", text: "a " },
      { t: "em", children: [{ t: "text", text: "b" }] },
      { t: "text", text: " " },
      { t: "strong", children: [{ t: "text", text: "c" }] },
      { t: "text", text: " " },
      { t: "code", text: "d" },
      { t: "text", text: " " },
      { t: "em", children: [{ t: "text", text: "e" }] },
      { t: "text", text: " " },
      { t: "strong", children: [{ t: "text", text: "f" }] },
    ]);
  });

  it("reads unordered and ordered lists, nested lists and multi-line items", () => {
    const [list] = render(
      lines("- one", "  more", "- two", "  - inner", "", "1. first", "2. second"),
    );
    expect(list?.t).toBe("list");
    const blocks = render(
      lines("- one", "  more", "- two", "  - inner", "", "1. first", "2. second"),
    );
    expect(blocks.map((b) => (b.t === "list" ? b.ordered : null))).toEqual([false, true]);
    const first = blocks[0];
    if (first?.t !== "list") throw new Error("expected a list");
    expect(first.items).toHaveLength(2);
    expect(textOf(first.items[0] ?? [])).toBe("one more");
    expect((first.items[1] ?? []).map((b) => b.t)).toEqual(["paragraph", "list"]);
  });

  it("reads block quotes and fenced code (backtick and tilde), keeping the code as written", () => {
    expect(
      render(
        lines(
          "> quoted",
          "> text",
          "",
          "```ts",
          "const a = 1;",
          "  <b>x</b>",
          "```",
          "",
          "~~~",
          "t",
          "~~~",
        ),
      ),
    ).toEqual([
      {
        t: "quote",
        children: [{ t: "paragraph", children: [{ t: "text", text: "quoted text" }] }],
      },
      { t: "code", lang: "ts", text: "const a = 1;\n  <b>x</b>" },
      { t: "code", lang: "", text: "t" },
    ]);
  });

  it("shows a fence that never closes as code to the end", () => {
    expect(render(lines("```", "a", "b"))).toEqual([{ t: "code", lang: "", text: "a\nb" }]);
  });

  it("shows tables and other unsupported Markdown as plain text", () => {
    const blocks = render(lines("| a | b |", "|---|---|", "| 1 | 2 |", "", "---", "", "Term[^1]"));
    expect(blocks.every((b) => b.t === "paragraph")).toBe(true);
    expect(textOf(blocks)).toContain("| a | b |");
    expect(textOf(blocks)).toContain("Term[^1]");
  });

  it("does not turn indented lines into code", () => {
    expect(render("        indented")).toEqual([
      { t: "paragraph", children: [{ t: "text", text: "indented" }] },
    ]);
  });

  it("keeps unmatched delimiters and brackets as text", () => {
    expect(textOf(renderInline("a * b _ c [d] ` e ** f"))).toBe("a * b _ c [d] ` e ** f");
  });

  it("reads a backslash escape as the character", () => {
    expect(textOf(renderInline("\\*not em\\* \\[x\\]"))).toBe("*not em* [x]");
  });
});

describe("3.7 item 1: no raw HTML", () => {
  it("shows a script element and an img with onerror as text, in block and inline position", () => {
    const blocks = render(
      lines(
        "<script>alert(1)</script>",
        "",
        "text <img src=x onerror=alert(1)> more",
        "",
        "<div>",
        "x",
        "</div>",
      ),
    );
    expect(textOf(blocks)).toContain("<script>alert(1)</script>");
    expect(textOf(blocks)).toContain("<img src=x onerror=alert(1)>");
    expect(textOf(blocks)).toContain("<div>");
    expect(JSON.stringify(blocks)).not.toContain('"t":"html"');
  });

  it("shows HTML inside code spans and fences as text", () => {
    expect(textOf(render(lines("`<b>x</b>`", "", "```", "<script>x</script>", "```")))).toBe(
      "<b>x</b><script>x</script>",
    );
  });

  it("drops HTML comments, block and inline, but not inside a fence", () => {
    const blocks = render(
      lines(
        "<!-- hidden -->",
        "visible <!-- gone --> text",
        "",
        "<!--",
        "multi",
        "-->",
        "",
        "```",
        "<!-- kept -->",
        "```",
      ),
    );
    expect(textOf(blocks)).toBe("visible  text<!-- kept -->");
  });

  it("keeps a <!-- that never closes as text inline", () => {
    expect(textOf(renderInline("a <!-- b"))).toBe("a <!-- b");
  });
});

describe("3.7 item 4: links", () => {
  const external = (href: string): LinkTarget => ({ kind: "external", href, newTab: true });

  it("makes absolute https and http links external, to open in a new tab", () => {
    expect(links(renderInline("[a](https://example.com/x) [b](http://example.com)"))).toEqual([
      external("https://example.com/x"),
      external("http://example.com/"),
    ]);
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "  javascript:alert(1)",
    "data:text/html,<b>x</b>",
    "vbscript:x",
    "file:///etc/passwd",
    "ftp://example.com",
    "mailto:a@example.com",
    "https:javascript",
    "//example.com/x",
    "java\tscript:alert(1)",
    "https://example.com/\u0001",
    "a:b",
    "\\\\server\\share",
  ])("shows %j as the link's text with no link", (target) => {
    expect(classifyTarget(target, {})).toBeNull();
    const tree = renderInline(
      `[click](${target.includes(" ") || target.includes("\t") ? `<${target}>` : target})`,
    );
    expect(links(tree)).toEqual([]);
  });

  it("shows the label of a refused link as text", () => {
    expect(renderInline("[click *me*](javascript:alert(1))")).toEqual([
      { t: "text", text: "click " },
      { t: "em", children: [{ t: "text", text: "me" }] },
    ]);
  });

  it("makes a # anchor a link within the document", () => {
    expect(classifyTarget("#hello-world", {})).toEqual({ kind: "anchor", id: "hello-world" });
    expect(classifyTarget("#", {})).toBeNull();
    expect(classifyTarget("#My Heading!", {})).toEqual({ kind: "anchor", id: "my-heading" });
    expect(classifyTarget("#---", {})).toBeNull();
  });

  it("resolves a relative path against the file it appears in, through resolveFile", () => {
    const seen: string[] = [];
    const resolveFile = (p: string): LinkTarget | null => {
      seen.push(p);
      return { kind: "external", href: p, newTab: true };
    };
    expect(classifyTarget("other.md", { basePath: "docs/a.md", resolveFile })).toEqual({
      kind: "external",
      href: "docs/other.md",
      newTab: true,
    });
    expect(classifyTarget("../README.md#top", { basePath: "docs/a.md", resolveFile })).toEqual({
      kind: "external",
      href: "README.md",
      newTab: true,
    });
    expect(classifyTarget("/docs/x.md", { basePath: "docs/a.md", resolveFile })).toEqual({
      kind: "external",
      href: "docs/x.md",
      newTab: true,
    });
    expect(classifyTarget("./sub/y%20z.md?raw=1", { basePath: "a.md", resolveFile })).toEqual({
      kind: "external",
      href: "sub/y z.md",
      newTab: true,
    });
    expect(seen).toHaveLength(4);
  });

  it("shows a relative link as text when it escapes the project, is empty, or the file does not exist", () => {
    const resolveFile = (p: string): LinkTarget | null =>
      p === "there.md" ? { kind: "external", href: p, newTab: true } : null;
    expect(classifyTarget("../../x.md", { basePath: "a.md", resolveFile })).toBeNull();
    expect(classifyTarget("missing.md", { basePath: "a.md", resolveFile })).toBeNull();
    expect(classifyTarget("there.md", { basePath: "a.md" })).toBeNull();
    expect(classifyTarget("%zz.md", { resolveFile })).toBeNull();
    expect(classifyTarget("", { resolveFile })).toBeNull();
    expect(classifyTarget(".", { resolveFile })).toBeNull();
  });

  it("resolvePath normalises . and .. segments", () => {
    expect(resolvePath("docs/a/b.md", "../c.md")).toBe("docs/c.md");
    expect(resolvePath("", "a//b/./c.md")).toBe("a/b/c.md");
    expect(resolvePath("a.md", "..")).toBeNull();
  });

  it("reads a link with a title, a <> destination and balanced parentheses", () => {
    expect(
      links(renderInline('[a](https://example.com/a_(b) "title") [c](<https://example.com/c d>)')),
    ).toEqual([external("https://example.com/a_(b)"), external("https://example.com/c%20d")]);
  });
});

describe("the link kinds (3.11)", () => {
  it("has no kind for a file shown in the page: a link is to github.com, another site or an anchor", () => {
    // tsc and ts-jest fail on this line while LinkTarget still has a "file" kind.
    // @ts-expect-error the "file" kind went with the local folder (docs/SPEC.md 3.11)
    const target: LinkTarget = { kind: "file", path: "a.md" };
    expect(target).toEqual({ kind: "file", path: "a.md" });
  });
});

describe("a bracket that is not a link does not stop a later link", () => {
  const ext = (href: string): LinkTarget => ({ kind: "external", href, newTab: true });

  it.each([
    ["[NOW] see [docs](https://x.example/a)", ["https://x.example/a"]],
    ["[a] [b](https://x.example)", ["https://x.example/"]],
    ["x [ y [z](https://a.example)", ["https://a.example/"]],
    ["[a] then [b](https://x.example/i.png)", ["https://x.example/i.png"]],
    [
      "[a](https://x.example) [b] [c](https://y.example)",
      ["https://x.example/", "https://y.example/"],
    ],
    ["[a](bad target with spaces) and [c](https://y.example)", ["https://y.example/"]],
    ["[a]( and [c](https://y.example)", ["https://y.example/"]],
    ["\\[a](x) [c](https://y.example)", ["https://y.example/"]],
  ])("%s", (input, hrefs) => {
    expect(links(renderInline(input))).toEqual(hrefs.map(ext));
  });

  it("keeps the text of every bracket that is not a link", () => {
    expect(textOf(renderInline("[NOW] see [docs](https://x.example/a) [x]"))).toBe(
      "[NOW] see docs [x]",
    );
  });

  it("shows a link inside a link's label as its text, not as a nested link", () => {
    const tree = renderInline("[[x](https://a.example)](https://b.example)");
    expect(links(tree)).toEqual([ext("https://b.example/")]);
    expect(textOf(tree)).toBe("x");
  });

  it("reads links in a paragraph after a bracket, in blocks as well", () => {
    expect(links(render("- [NOW] item\n\nsee [a] and [b](https://x.example)"))).toEqual([
      ext("https://x.example/"),
    ]);
  });
});

describe("3.7 item 5: no loads from content", () => {
  it("shows an image as a link with its alt text when the target is allowed, never as an image", () => {
    const tree = renderInline("![a logo](https://example.com/logo.png)");
    expect(tree).toEqual([
      {
        t: "link",
        target: { kind: "external", href: "https://example.com/logo.png", newTab: true },
        children: [{ t: "text", text: "a logo" }],
      },
    ]);
    expect(JSON.stringify(tree)).not.toContain("image");
  });

  it("shows an image with a refused target as its alt text", () => {
    expect(renderInline("![x](javascript:alert(1))")).toEqual([{ t: "text", text: "x" }]);
  });
});

describe("links to project files from code spans", () => {
  it("links a code span for which codePathLink answers, and leaves others", () => {
    const codePathLink = (c: string): LinkTarget | null =>
      c === "docs/SPEC.md" ? { kind: "external", href: c, newTab: true } : null;
    expect(renderInline("see `docs/SPEC.md` and `other`", { codePathLink })).toEqual([
      { t: "text", text: "see " },
      {
        t: "link",
        target: { kind: "external", href: "docs/SPEC.md", newTab: true },
        children: [{ t: "code", text: "docs/SPEC.md" }],
      },
      { t: "text", text: " and " },
      { t: "code", text: "other" },
    ]);
  });
});

describe("hostile input stays fast and does not throw", () => {
  // The limit is on the CPU time `render` uses, not on the wall clock: on a loaded
  // machine the wall clock also counts the time the process waits for a core, which
  // says nothing about the algorithm. A quadratic or worse `render` still exceeds it.
  const CPU_LIMIT_MS = 1500;
  const cpuMs = (run: () => void): number => {
    const before = process.cpuUsage();
    run();
    const used = process.cpuUsage(before);
    return (used.user + used.system) / 1000;
  };
  const big = 50000;
  it.each([
    ["stars", "*".repeat(big)],
    ["underscores", "_".repeat(big)],
    ["double stars", "**a ".repeat(big / 4)],
    ["open brackets", "[".repeat(big)],
    ["bracket pairs", "[a](".repeat(big / 4)],
    ["backticks", "`a".repeat(big / 2)],
    ["nested quotes", "> ".repeat(big)],
    ["nested lists", "  ".repeat(100) + "- a\n".repeat(1000)],
    ["comment starts", "<!--".repeat(big / 4)],
    ["backslashes", "\\".repeat(big)],
  ])("%s", (_name, input) => {
    let used = Number.NaN;
    expect(() => {
      used = cpuMs(() => render(input));
    }).not.toThrow();
    expect(used).toBeLessThan(CPU_LIMIT_MS);
  });

  // One megabyte on a single line. Every `](` used to scan up to 4096
  // characters for its destination, so these took 1.5 to 7 seconds.
  const mb = 1_000_000;
  // 30 combining marks of 30 different classes, in descending order of class (the order NFC must reverse):
  // U+0345 240, U+0315 232, U+0300 230, U+0316 220, U+0321 202, Arabic points 34 to 27,
  // Hebrew points 25 to 10, U+0334 1.
  const DESCENDING =
    "\u0345\u0315\u0300\u0316\u0321\u0652\u0651\u0650\u064f\u064e\u064d\u064c\u064b\u05c2\u05c1\u05bf\u05bd\u05bc\u05bb\u05b9\u05b8\u05b7\u05b6\u05b5\u05b4\u05b3\u05b2\u05b1\u05b0\u0334";
  it.each([
    ["empty labels", "[](".repeat(mb / 3)],
    ["labels", "[a](".repeat(mb / 4)],
    ["images", "![](".repeat(mb / 4)],
    ["angle destinations", "[](<".repeat(mb / 4)],
    ["angle destinations with a space", "[](<x ".repeat(mb / 6)],
    ["nested parentheses", "[]((((".repeat(mb / 6)],
    ["unclosed links", "[](a".repeat(mb / 4)],
    ["a heading of decomposed letters", `# ${"e\u0301".repeat(mb / 2)}`],
    [
      "anchors of decomposed letters at the length limit",
      `[a](#${"o\u0308".repeat(2000)}) `.repeat(mb / 4000),
    ],
    // Marks of two combining classes: NFC sorts a run of them, which takes time that grows with the
    // square of the run (UAX #15), so the slug of a text with a long run is made without NFC.
    ["a heading of alternating marks of two classes", `# a${"\u0316\u0301".repeat(50_000)}`],
    ["a 1 MB heading of alternating marks of two classes", `# a${"\u0316\u0301".repeat(mb / 2)}`],
    [
      "a heading of 100000 marks of one class, then 100000 of another",
      `# a${"\u0301".repeat(100_000)}${"\u0316".repeat(100_000)}`,
    ],
    [
      "a heading of the worst runs that are still normalised (30 marks of strictly descending combining class)",
      `# ${`x${DESCENDING}`.repeat(mb / 31)}`,
    ],
    [
      "a heading of the runs that grow most when normalised (30 U+0344, which become 60 marks, after U+FB2C)",
      `# ${`\ufb2c${"\u0344".repeat(30)}`.repeat(mb / 32)}`,
    ],
    [
      "a heading of runs that grow when lower-cased (U+0130, then 30 marks of descending class)",
      `# ${`\u0130${DESCENDING}`.repeat(mb / 32)}`,
    ],
    [
      "a heading of one class of marks, then another",
      `# a${"\u0301".repeat(50_000)}${"\u0316".repeat(50_000)}`,
    ],
    [
      "anchors of marks of two classes at the length limit",
      `[a](#a${"\u0301".repeat(2000)}${"\u0316".repeat(2000)}) `.repeat(mb / 4000),
    ],
    [
      "anchors of alternating marks of two classes at the length limit",
      `[a](#a${"\u0316\u0301".repeat(2000)}) `.repeat(mb / 4000),
    ],
    [
      "anchors of the longest runs that are still normalised",
      `[a](#a${"\u0316\u0301".repeat(15)}) `.repeat(mb / 40),
    ],
  ])("a 1 MB line of %s", (_name, input) => {
    let used = Number.NaN;
    expect(() => {
      used = cpuMs(() => render(input));
    }).not.toThrow();
    expect(used).toBeLessThan(CPU_LIMIT_MS);
  });

  it("nests deeply without a stack overflow", () => {
    const deep = `${"> ".repeat(5000)}x\n\n${"- ".repeat(5000)}y\n\n${"*a ".repeat(5000)}`;
    expect(() => render(deep)).not.toThrow();
  });
});

describe("heading slugs keep Unicode letters and digits", () => {
  it.each([
    ["Översikt", "översikt"],
    ["Привет, мир!", "привет-мир"],
    ["日本語 メモ 2", "日本語-メモ-2"],
    ["Café au lait", "café-au-lait"],
    ["Cafe\u0301", "caf\u00e9"],
    ["Caf\u00e9", "caf\u00e9"],
    ["Ärende #4: Åtgärd", "ärende-4-åtgärd"],
    ["Hello, World!", "hello-world"],
    ["---", ""],
    ["★ ✓", ""],
  ])("slugify(%j) is %j", (text, slug) => {
    expect(slugify(text)).toBe(slug);
  });

  it("gives a heading and an anchor the same slug", () => {
    expect(render("## Översikt")).toMatchObject([{ t: "heading", slug: "översikt" }]);
    expect(classifyTarget("#Översikt", {})).toEqual({ kind: "anchor", id: "översikt" });
    expect(classifyTarget("#%C3%96versikt", {})).toEqual({ kind: "anchor", id: "översikt" });
    expect(render("## Привет")).toMatchObject([{ t: "heading", slug: "привет" }]);
  });
});

describe("heading slugs are unique within a document", () => {
  const slugs = (src: string): string[] => {
    const found: string[] = [];
    const walk = (blocks: Block[]) => {
      for (const b of blocks) {
        if (b.t === "heading") found.push(b.slug);
        else if (b.t === "quote") walk(b.children);
        else if (b.t === "list") for (const item of b.items) walk(item);
      }
    };
    walk(render(src));
    return found;
  };

  it("numbers a repeated heading, and skips a number that is taken", () => {
    expect(slugs(lines("# Foo", "# Foo", "# Foo 1", "# Foo"))).toEqual([
      "foo",
      "foo-1",
      "foo-1-1",
      "foo-2",
    ]);
  });

  it("counts headings inside block quotes and list items", () => {
    expect(slugs(lines("# Foo", "", "> # Foo", "", "- # Foo"))).toEqual(["foo", "foo-1", "foo-2"]);
  });

  it("leaves a heading without a slug without one", () => {
    expect(slugs(lines("# ---", "# ---", "# a"))).toEqual(["", "", "a"]);
  });

  it("starts again for the next document", () => {
    expect(slugs("# Foo")).toEqual(["foo"]);
    expect(slugs("# Foo")).toEqual(["foo"]);
  });
});

describe("one length limit for both destination forms", () => {
  const url = (length: number) => `https://example.com/${"a".repeat(length - 20)}`;

  it.each([
    ["bare", (d: string) => `[a](${d})`],
    ["angle", (d: string) => `[a](<${d}>)`],
  ])("a %s destination of 4096 characters is read, of 4097 is not", (_form, wrap) => {
    expect(links(renderInline(wrap(url(4096))))).toEqual([
      { kind: "external", href: url(4096), newTab: true },
    ]);
    expect(links(renderInline(wrap(url(4097))))).toEqual([]);
    expect(textOf(renderInline(wrap(url(4097))))).toContain("[a](");
  });

  it("does not read a bare destination of 4096 characters as ending at a quote", () => {
    expect(links(renderInline(`[a](${url(4096)}"t")`))).toEqual([]);
  });

  it("still reads a title after a destination at the limit", () => {
    expect(links(renderInline(`[a](${url(4096)} "t")`))).toHaveLength(1);
  });
});

describe("relative link targets are fully percent-decoded", () => {
  const resolveFile = (p: string): LinkTarget | null => ({
    kind: "external",
    href: p,
    newTab: true,
  });
  const path = (target: string, basePath = "docs/a.md") =>
    classifyTarget(target, { basePath, resolveFile });

  it("decodes the escapes of reserved characters", () => {
    expect(path("sub%2Ffile.md")).toEqual({
      kind: "external",
      href: "docs/sub/file.md",
      newTab: true,
    });
    expect(path("a%23b.md")).toEqual({ kind: "external", href: "docs/a#b.md", newTab: true });
    expect(path("a%3Fb.md")).toEqual({ kind: "external", href: "docs/a?b.md", newTab: true });
    expect(path("a%3Ab.md")).toEqual({ kind: "external", href: "docs/a:b.md", newTab: true });
  });

  it("still decodes the ordinary escapes and still cuts at a literal ? or #", () => {
    expect(path("y%20z%C3%96.md")).toEqual({
      kind: "external",
      href: "docs/y zÖ.md",
      newTab: true,
    });
    expect(path("x.md?raw=1")).toEqual({ kind: "external", href: "docs/x.md", newTab: true });
    expect(path("x.md#top")).toEqual({ kind: "external", href: "docs/x.md", newTab: true });
  });

  it("resolves . and .. written as escapes, and refuses to leave the project", () => {
    expect(path("%2E%2E/x.md")).toEqual({ kind: "external", href: "x.md", newTab: true });
    expect(path("..%2F..%2Fx.md")).toBeNull();
    expect(path("%2E%2E%2F%2E%2E%2Fx.md")).toBeNull();
  });

  it("makes bad percent-encoding text", () => {
    expect(path("%zz.md")).toBeNull();
    expect(path("%E0%A4%A.md")).toBeNull();
  });

  it("resolvePath decodes fully", () => {
    expect(resolvePath("a.md", "b%2Fc%23d.md")).toBe("b/c#d.md");
  });
});

describe("a decoded relative path is checked again for controls and backslashes (3.7 item 4)", () => {
  const seen: string[] = [];
  const resolveFile = (p: string): LinkTarget | null => {
    seen.push(p);
    return { kind: "external", href: p, newTab: true };
  };
  const path = (target: string, basePath = "docs/a.md") =>
    classifyTarget(target, { basePath, resolveFile });
  beforeEach(() => {
    seen.length = 0;
  });

  it.each([
    ["NUL", "a%00b.md"],
    ["line feed", "a%0Ab.md"],
    ["carriage return", "a%0Db.md"],
    ["tab", "a%09b.md"],
    ["the last C0 control, U+001F", "a%1Fb.md"],
    ["DEL", "a%7Fb.md"],
    ["the first C1 control, U+0080", "a%C2%80b.md"],
    ["the last C1 control, U+009F", "a%C2%9Fb.md"],
    ["a backslash", "a%5Cb.md"],
    ["a backslash in lower-case hex", "a%5cb.md"],
    ["a backslash that starts the path", "%5Ca.md"],
    ["a backslash in a directory name", "sub%5Cdir/a.md"],
    ["a backslash before a decoded slash", "a%5C%2Fb.md"],
    ["a control character at the end", "a.md%0A"],
    ["a control character after a decoded # (the cut is made before decoding)", "a%23%0Ab.md"],
    ["an overlong UTF-8 NUL (bad encoding)", "a%C0%80b.md"],
  ])("is text for %s: %s", (_what, target) => {
    expect(path(target)).toBeNull();
    expect(seen).toEqual([]);
    expect(links(renderInline(`[x](${target})`, { basePath: "docs/a.md", resolveFile }))).toEqual(
      [],
    );
    expect(seen).toEqual([]);
  });

  it("does not make a link text of the characters just outside the controls", () => {
    expect(path("a%20b.md")).toEqual({ kind: "external", href: "docs/a b.md", newTab: true });
    expect(path("a%7Eb.md")).toEqual({ kind: "external", href: "docs/a~b.md", newTab: true });
    expect(path("a%C2%A0b.md")).toEqual({
      kind: "external",
      href: "docs/a\u00a0b.md",
      newTab: true,
    });
    expect(path("a%2Fb.md")).not.toBeNull();
    expect(path("a%2Bb.md")).not.toBeNull();
  });

  it("decodes once: a double-encoded backslash or line break stays plain text of the path", () => {
    expect(path("a%255Cb.md")).toEqual({ kind: "external", href: "docs/a%5Cb.md", newTab: true });
    expect(path("a%250Ab.md")).toEqual({ kind: "external", href: "docs/a%0Ab.md", newTab: true });
    expect(path("a%2500b.md")).toEqual({ kind: "external", href: "docs/a%00b.md", newTab: true });
    expect(seen).toEqual(["docs/a%5Cb.md", "docs/a%0Ab.md", "docs/a%00b.md"]);
  });

  it("cuts at a literal ? or # before decoding, so an escape after the cut is not looked at", () => {
    expect(path("a.md?x=%0A")).toEqual({ kind: "external", href: "docs/a.md", newTab: true });
    expect(path("a.md#%5C")).toEqual({ kind: "external", href: "docs/a.md", newTab: true });
    expect(path("a.md?x=%5C#%00")).toEqual({ kind: "external", href: "docs/a.md", newTab: true });
  });

  it("keeps bad percent-encoding as text", () => {
    expect(path("%zz%5C.md")).toBeNull();
    expect(path("a%0Gb.md")).toBeNull();
    expect(path("%E0%A4%A.md")).toBeNull();
  });

  it("resolvePath refuses a decoded control character or backslash, and still decodes the rest", () => {
    expect(resolvePath("a.md", "b%00")).toBeNull();
    expect(resolvePath("a.md", "b%0Ac.md")).toBeNull();
    expect(resolvePath("a.md", "b%5Cc.md")).toBeNull();
    expect(resolvePath("a.md", "..%5C..%5Cx.md")).toBeNull();
    expect(resolvePath("a.md", "b%2Fc%23d.md")).toBe("b/c#d.md");
    expect(resolvePath("a.md", "b%255Cc.md")).toBe("b%5Cc.md");
  });

  it("a decoded # anchor needs no second check: its slug holds only letters, marks and numbers", () => {
    expect(classifyTarget("#%0A", {})).toBeNull();
    expect(classifyTarget("#%5C", {})).toBeNull();
    expect(classifyTarget("#a%5Cb", {})).toEqual({ kind: "anchor", id: "a-b" });
    expect(classifyTarget("#a%0Ab%00c", {})).toEqual({ kind: "anchor", id: "a-b-c" });
  });

  it("leaves a link that is not a relative path as it was", () => {
    expect(classifyTarget("https://example.com/a%5Cb%0A", {})).toEqual({
      kind: "external",
      href: "https://example.com/a%5Cb%0A",
      newTab: true,
    });
    expect(path("a%3Ab.md")).toEqual({ kind: "external", href: "docs/a:b.md", newTab: true });
    expect(path("%2F%2Fa.md")).toEqual({ kind: "external", href: "a.md", newTab: true });
  });
});

describe("heading text and anchor text are made NFC before the slug (3.7 item 4)", () => {
  const PRE = "\u00d6versikt";
  const DEC = "O\u0308versikt";
  const slugOfHeading = (src: string): string[] =>
    render(src).flatMap((b) => (b.t === "heading" ? [b.slug] : []));

  it("gives a precomposed letter and a letter with a combining mark the same slug", () => {
    expect(slugify(PRE)).toBe("\u00f6versikt");
    expect(slugify(DEC)).toBe("\u00f6versikt");
    expect(slugify("Cafe\u0301")).toBe(slugify("Caf\u00e9"));
    expect(slugify("A\u030Angstr\u00f6m")).toBe(slugify("\u00c5ngstro\u0308m"));
  });

  it("composes a Hangul syllable written as jamo", () => {
    expect(slugify("\u1112\u1161\u11ab")).toBe("\ud55c");
  });

  it("is NFC and not NFKC: compatibility characters keep their own slug", () => {
    expect(slugify("\u00bd x")).toBe("\u00bd-x");
    expect(slugify("\ufb01le")).toBe("\ufb01le");
    expect(slugify("\uff21\uff22")).toBe("\uff41\uff42");
  });

  it("a heading in either form gets the same id", () => {
    expect(slugOfHeading(`## ${PRE}`)).toEqual(["\u00f6versikt"]);
    expect(slugOfHeading(`## ${DEC}`)).toEqual(["\u00f6versikt"]);
  });

  it("joins the text of a heading first: a combining mark in a code span or in emphasis composes with its letter", () => {
    expect(slugOfHeading("## O`\u0308`versikt")).toEqual(["\u00f6versikt"]);
    expect(slugOfHeading("## O*\u0308*versikt")).toEqual(["\u00f6versikt"]);
  });

  it("the two forms in one document are one slug, and the second gets -1", () => {
    expect(slugOfHeading(lines(`# ${PRE}`, "", `# ${DEC}`))).toEqual([
      "\u00f6versikt",
      "\u00f6versikt-1",
    ]);
  });

  it("an anchor in either form, written or percent-encoded, gets the slug of the heading", () => {
    const id = { kind: "anchor", id: "\u00f6versikt" };
    expect(classifyTarget(`#${PRE}`, {})).toEqual(id);
    expect(classifyTarget(`#${DEC}`, {})).toEqual(id);
    expect(classifyTarget("#%C3%96versikt", {})).toEqual(id);
    expect(classifyTarget("#O%CC%88versikt", {})).toEqual(id);
    expect(classifyTarget("#O%CC%88versikt-1", {})).toEqual({
      kind: "anchor",
      id: "\u00f6versikt-1",
    });
  });

  it("an anchor with bad percent-encoding is kept as written and made NFC", () => {
    expect(classifyTarget("#O\u0308%zz", {})).toEqual({ kind: "anchor", id: "\u00f6-zz" });
  });

  it("a decomposed heading is reached by a precomposed anchor, and the other way round", () => {
    for (const [heading, anchor] of [
      [DEC, PRE],
      [PRE, DEC],
    ] as const) {
      const [block] = render(`# ${heading}`);
      const target = classifyTarget(`#${anchor}`, {});
      expect(block).toMatchObject({ t: "heading" });
      expect(target).toEqual({ kind: "anchor", id: block?.t === "heading" ? block.slug : null });
    }
  });

  it("changes no heading text that is shown: only the slug is normalised", () => {
    expect(render(`# ${DEC}`)).toMatchObject([
      { t: "heading", children: [{ t: "text", text: DEC }] },
    ]);
  });
});

describe("NFC is skipped for a long run of combining marks (3.7 item 4)", () => {
  const MARKS = "\u0301".repeat(29);
  it("normalises a text whose longest run of marks is 30, and does not normalise one of 31", () => {
    expect(slugify(`O\u0308${MARKS}`)).toBe(`\u00f6${MARKS}`);
    expect(slugify(`O\u0308${MARKS}\u0301`)).toBe(`o\u0308${MARKS}\u0301`);
  });

  it("counts a run, not the marks of the text: a letter between two runs ends the first", () => {
    const run = "\u0301".repeat(29);
    expect(slugify(`O\u0308${run}x O\u0308${run}`)).toBe(`\u00f6${run}x-\u00f6${run}`);
  });

  it("makes the slug from the text as written, and changes nothing else, when a run is long", () => {
    const long = "\u0316\u0301".repeat(20);
    expect(slugify(`Ab ${long} Cd`)).toBe(`ab-${long}-cd`);
    expect(slugify(`\u00d6${long}`)).toBe(`\u00f6${long}`);
  });

  it("applies to a heading and to an anchor alike", () => {
    const long = "\u0301".repeat(31);
    const [h] = render(`# O\u0308${long}`);
    expect(h).toMatchObject({ t: "heading", slug: `o\u0308${long}` });
    expect(classifyTarget(`#O\u0308${long}`, {})).toEqual({
      kind: "anchor",
      id: `o\u0308${long}`,
    });
  });
});

describe("the run limit counts combining marks, and is decided once on the text as written (3.7 item 4)", () => {
  // U+1D167 to U+1D169 are marks outside the BMP: two UTF-16 units each.
  const astral = (n: number) =>
    Array.from({ length: n }, (_, i) => String.fromCodePoint(0x1d167 + (i % 3))).join("");

  it("counts a mark outside the BMP once: 29 of them after a diaeresis (30 marks) are normalised", () => {
    expect(slugify(`O\u0308${astral(29)}`)).toBe(`\u00f6${astral(29)}`);
    expect(render(`# O\u0308${astral(29)}`)).toMatchObject([{ slug: `\u00f6${astral(29)}` }]);
    expect(classifyTarget(`#O\u0308${astral(29)}`, {})).toEqual({
      kind: "anchor",
      id: `\u00f6${astral(29)}`,
    });
  });

  it("counts a mark outside the BMP once: 30 of them after a diaeresis (31 marks) are not", () => {
    expect(slugify(`O\u0308${astral(30)}`)).toBe(`o\u0308${astral(30)}`);
  });

  it("a run of 16 marks outside the BMP (32 UTF-16 units) is normalised", () => {
    expect(slugify(`O\u0308${astral(16)}`)).toBe(`\u00f6${astral(16)}`);
  });

  it("decides once, on the text as written: U+0130 and 30 marks are normalised at both steps", () => {
    // U+0130 lower-cases to `i` + U+0307, so the second step sees a run of 31. Normalised at both steps,
    // U+0316 is sorted before U+0307.
    expect(slugify(`\u0130${"\u0316".repeat(30)}`)).toBe(`i${"\u0316".repeat(30)}\u0307`);
  });

  it("decides once, on the text as written: U+0130 and 31 marks are not normalised at either step", () => {
    expect(slugify(`\u0130${"\u0316".repeat(31)}`)).toBe(`i\u0307${"\u0316".repeat(31)}`);
  });

  it("a run that grows when normalised (U+0344 becomes two marks) is normalised", () => {
    const text = `\ufb2c${"\u0344".repeat(30)}`;
    expect(slugify(text)).toBe(text.normalize("NFC"));
    expect([...slugify(text)].length).toBeGreaterThan(60);
  });
});

describe("a capital with a mark whose precomposed form is only a small letter (3.7 item 4)", () => {
  it.each([
    ["J with caron", "J\u030c", "\u01f0"],
    ["T with diaeresis", "T\u0308", "\u1e97"],
    ["H with line below", "H\u0331", "\u1e96"],
    ["Greek capital iota with diaeresis and tonos", "\u03aa\u0301", "\u0390"],
  ])("%s: the heading and the anchor, in either form, give one slug", (_name, heading, small) => {
    expect(slugify(heading)).toBe(small);
    expect(slugify(small)).toBe(small);
    const [block] = render(`# ${heading}`);
    expect(block).toMatchObject({ t: "heading", slug: small });
    expect(classifyTarget(`#${heading}`, {})).toEqual({ kind: "anchor", id: small });
    expect(classifyTarget(`#${small}`, {})).toEqual({ kind: "anchor", id: small });
    expect(classifyTarget(`#${encodeURIComponent(heading)}`, {})).toEqual({
      kind: "anchor",
      id: small,
    });
  });
});
