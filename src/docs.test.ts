/**
 * Tests for src/docs.ts: the documentation links of docs/SPEC.md 3.4.
 */
import * as docs from "./docs";
import { documentationList, projectFilePath } from "./docs";

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

describe("the module's exports (3.11)", () => {
  it("are the documentation links' helpers only: no file list of a picked folder, no in-page Markdown check", () => {
    expect(Object.keys(docs).sort()).toEqual(["documentationList", "projectFilePath"]);
  });
});
