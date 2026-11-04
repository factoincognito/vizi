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
    const start = Date.now();
    expect(() => render(input)).not.toThrow();
    expect(Date.now() - start).toBeLessThan(1500);
  });

  // One megabyte on a single line. Every `](` used to scan up to 4096
  // characters for its destination, so these took 1.5 to 7 seconds.
  const mb = 1_000_000;
  it.each([
    ["empty labels", "[](".repeat(mb / 3)],
    ["labels", "[a](".repeat(mb / 4)],
    ["images", "![](".repeat(mb / 4)],
    ["angle destinations", "[](<".repeat(mb / 4)],
    ["angle destinations with a space", "[](<x ".repeat(mb / 6)],
    ["nested parentheses", "[]((((".repeat(mb / 6)],
    ["unclosed links", "[](a".repeat(mb / 4)],
  ])("a 1 MB line of %s", (_name, input) => {
    const start = Date.now();
    expect(() => render(input)).not.toThrow();
    expect(Date.now() - start).toBeLessThan(1500);
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
    ["Cafe\u0301", "cafe\u0301"],
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
