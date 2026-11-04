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
  });

  it("resolves a relative path against the file it appears in, through resolveFile", () => {
    const seen: string[] = [];
    const resolveFile = (p: string): LinkTarget | null => {
      seen.push(p);
      return { kind: "file", path: p };
    };
    expect(classifyTarget("other.md", { basePath: "docs/a.md", resolveFile })).toEqual({
      kind: "file",
      path: "docs/other.md",
    });
    expect(classifyTarget("../README.md#top", { basePath: "docs/a.md", resolveFile })).toEqual({
      kind: "file",
      path: "README.md",
    });
    expect(classifyTarget("/docs/x.md", { basePath: "docs/a.md", resolveFile })).toEqual({
      kind: "file",
      path: "docs/x.md",
    });
    expect(classifyTarget("./sub/y%20z.md?raw=1", { basePath: "a.md", resolveFile })).toEqual({
      kind: "file",
      path: "sub/y z.md",
    });
    expect(seen).toHaveLength(4);
  });

  it("shows a relative link as text when it escapes the project, is empty, or the file does not exist", () => {
    const resolveFile = (p: string): LinkTarget | null =>
      p === "there.md" ? { kind: "file", path: p } : null;
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
      c === "docs/SPEC.md" ? { kind: "file", path: c } : null;
    expect(renderInline("see `docs/SPEC.md` and `other`", { codePathLink })).toEqual([
      { t: "text", text: "see " },
      {
        t: "link",
        target: { kind: "file", path: "docs/SPEC.md" },
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

  it("nests deeply without a stack overflow", () => {
    const deep = `${"> ".repeat(5000)}x\n\n${"- ".repeat(5000)}y\n\n${"*a ".repeat(5000)}`;
    expect(() => render(deep)).not.toThrow();
  });
});
