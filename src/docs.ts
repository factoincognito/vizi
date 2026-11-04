/**
 * Documentation links (docs/SPEC.md 3.4). Pure: paths in, paths out.
 */

/** README.md and every .md file under docs/, subfolders included, sorted by path. */
export function documentationList(files: string[]): string[] {
  return files
    .filter((f) => f === "README.md" || (f.startsWith("docs/") && f.endsWith(".md")))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** The path a code span names, without a leading ./, when it is a file of the project; else null. */
export function projectFilePath(codeText: string, files: string[]): string | null {
  const path = codeText.startsWith("./") ? codeText.slice(2) : codeText;
  return files.includes(path) ? path : null;
}
