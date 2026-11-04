/**
 * Tests for src/docs.ts: the documentation links of docs/SPEC.md 3.4 and
 * the folder input's file list of 3.1.
 */
import { documentationList, folderFiles, isMarkdownPath, projectFilePath } from "./docs";

describe("documentationList", () => {
  it("lists README.md and every .md file under docs/, subfolders included, sorted by path", () => {
    const files = [
      "src/a.ts",
      "docs/z.md",
      "README.md",
      "docs/sub/b.md",
      "docs/a.md",
      "docs/notes.txt",
      "CHANGELOG.md",
      "docs/sub/deep/c.MD",
      "readme.md",
      "sub/README.md",
    ];
    expect(documentationList(files)).toEqual([
      "README.md",
      "docs/a.md",
      "docs/sub/b.md",
      "docs/z.md",
    ]);
  });

  it("is empty when there is none", () => {
    expect(documentationList(["src/a.ts"])).toEqual([]);
    expect(documentationList([])).toEqual([]);
  });
});

describe("projectFilePath", () => {
  const files = ["docs/SPEC.md", "src/a.ts"];

  it("returns the path of a code span that names a project file, without a leading ./", () => {
    expect(projectFilePath("docs/SPEC.md", files)).toBe("docs/SPEC.md");
    expect(projectFilePath("./src/a.ts", files)).toBe("src/a.ts");
  });

  it("returns null for anything else", () => {
    expect(projectFilePath("docs/MISSING.md", files)).toBeNull();
    expect(projectFilePath("docs", files)).toBeNull();
    expect(projectFilePath("npm run build", files)).toBeNull();
    expect(projectFilePath("../docs/SPEC.md", files)).toBeNull();
    expect(projectFilePath(" docs/SPEC.md", files)).toBeNull();
  });
});

describe("folderFiles", () => {
  it("drops the chosen folder's name from each relative path", () => {
    expect(folderFiles(["proj/BACKLOG.md", "proj/docs/a.md"])).toEqual(["BACKLOG.md", "docs/a.md"]);
  });

  it("skips files inside .git and node_modules only, so .github paths are kept", () => {
    expect(
      folderFiles([
        "proj/.git/config",
        "proj/node_modules/x/y.md",
        "proj/sub/node_modules/z.md",
        "proj/.github/w.yml",
        "proj/.hidden/a.md",
        "proj/ok.md",
      ]),
    ).toEqual([".github/w.yml", ".hidden/a.md", "ok.md"]);
  });

  it("keeps a path with no folder part as it is", () => {
    expect(folderFiles(["BACKLOG.md"])).toEqual(["BACKLOG.md"]);
  });
});

describe("isMarkdownPath", () => {
  it("is true for a name ending in .md, in the root or a subfolder", () => {
    expect(isMarkdownPath("README.md")).toBe(true);
    expect(isMarkdownPath("docs/sub/guide.md")).toBe(true);
  });

  it("is false for every other file, so it is shown as code", () => {
    expect(isMarkdownPath("src/index.ts")).toBe(false);
    expect(isMarkdownPath("docs/notes.txt")).toBe(false);
    expect(isMarkdownPath("Makefile")).toBe(false);
    expect(isMarkdownPath("docs/guide.md.bak")).toBe(false);
    expect(isMarkdownPath("md")).toBe(false);
    expect(isMarkdownPath("docs/c.MD")).toBe(false);
  });
});
