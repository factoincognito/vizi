/**
 * Documentation links (docs/SPEC.md 3.4) and the file list of a local
 * folder (3.1). Pure: paths in, paths out.
 */

/** README.md and every .md file under docs/, subfolders included, sorted by path. */
export function documentationList(files: string[]): string[] {
  return files
    .filter((f) => f === "README.md" || (f.startsWith("docs/") && f.endsWith(".md")))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** Whether a file of the project is read as Markdown: its name ends in `.md` (case-sensitive, as in `documentationList`). Any other file is shown as code. */
export function isMarkdownPath(path: string): boolean {
  return path.endsWith(".md");
}

/** The path a code span names, without a leading ./, when it is a file of the project; else null. */
export function projectFilePath(codeText: string, files: string[]): string | null {
  const path = codeText.startsWith("./") ? codeText.slice(2) : codeText;
  return files.includes(path) ? path : null;
}

/** Folders whose files are never part of the project listing. */
const SKIPPED = (segment: string) => segment === ".git" || segment === "node_modules";

/**
 * The project's file paths from the relative paths of a picked folder
 * (`name/dir/file`): the folder's own name is dropped, and files inside a
 * folder named `.git` or `node_modules`, at any depth, are left out. Other
 * dot-folders, such as `.github/`, are kept.
 */
export function folderFiles(relativePaths: string[]): string[] {
  const out: string[] = [];
  for (const p of relativePaths) {
    const parts = p.split("/");
    const inner = parts.length > 1 ? parts.slice(1) : parts;
    if (inner.slice(0, -1).some(SKIPPED)) continue;
    out.push(inner.join("/"));
  }
  return out;
}
