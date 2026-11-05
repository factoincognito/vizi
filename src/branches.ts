/**
 * The branch list of docs/SPEC.md 3.13, as pure functions: reading one page
 * of GitHub's "List branches" answer, merging the pages, the cap, and the
 * picker's options with their order, their default mark and which names
 * the page cannot open. A branch name is untrusted text: the page sets it
 * with textContent, never as HTML.
 */

/** Items per page; the most "List branches" gives (3.13). */
export const BRANCHES_PER_PAGE = 100;
/** Pages read at most: 300 names. */
export const BRANCH_PAGES = 3;

export const BRANCH_LIST_NOT_UNDERSTOOD = "GitHub's answer for the branch list was not understood.";
export const READING_BRANCHES = "Reading the branches…";

/** One page: the names it gives, and its item count (counted before any item is skipped). */
export type BranchPage = { ok: true; names: string[]; count: number } | { ok: false };

/** Reads one page: a JSON array whose objects with a non-empty `name` string give one name each. */
export function readBranchPage(text: string): BranchPage {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false };
  }
  if (!Array.isArray(body)) return { ok: false };
  const names: string[] = [];
  for (const item of body as unknown[]) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) continue;
    const name = (item as { name?: unknown }).name;
    if (typeof name === "string" && name !== "") names.push(name);
  }
  return { ok: true, names, count: body.length };
}

/** The pages' names in order, each name once. */
export function mergeBranchPages(pages: readonly (readonly string[])[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const page of pages)
    for (const name of page)
      if (!seen.has(name)) {
        seen.add(name);
        out.push(name);
      }
  return out;
}

/** Whether a page of this many items calls for the next one. */
export function nextPageWanted(count: number, pagesRead: number): boolean {
  return count === BRANCHES_PER_PAGE && pagesRead < BRANCH_PAGES;
}

/** Whether the repo may have more branches than were read: the last allowed page was full. */
export function morePagesMayExist(counts: readonly number[]): boolean {
  return counts.length === BRANCH_PAGES && counts[BRANCH_PAGES - 1] === BRANCHES_PER_PAGE;
}

/** The message past the cap, with the project's owner and repo written in; `<branch>` stays (3.13, #61). */
export function capMessage(owner: string, repo: string): string {
  return `vizi lists the first ${BRANCH_PAGES * BRANCHES_PER_PAGE} branches GitHub gives. To open another branch, paste its address, https://github.com/${owner}/${repo}/tree/<branch>, with the branch's name in place of <branch>.`;
}

/** The picker's message for a failure: "incomplete" when at least one page was read. */
export function listFailureMessage(message: string, pagesRead: number): string {
  return pagesRead > 0
    ? `The branch list is incomplete: ${message}`
    : `The branch list could not be read: ${message}`;
}

/** Names the page cannot open: # and % (3.1's request 3 and links), and ? as a defence. */
export function cannotOpen(name: string): boolean {
  return /[#%?]/.test(name);
}

export interface BranchOption {
  name: string;
  label: string;
  disabled: boolean;
  selected: boolean;
}

/** Character-code order, as the documentation list of 3.4. */
const byCodes = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * The picker's options: the current branch first when it is not among the
 * names, then the default (when known) with " (default)", then the others
 * by character codes. Exactly the current branch is selected.
 */
export function branchOptions(
  names: readonly string[],
  current: string,
  defaultBranch: string | null,
): BranchOption[] {
  const unique = mergeBranchPages([names]);
  const order: string[] = [];
  if (!unique.includes(current)) order.push(current);
  if (defaultBranch !== null && unique.includes(defaultBranch)) order.push(defaultBranch);
  order.push(...unique.filter((n) => n !== defaultBranch).sort(byCodes));
  return order.map((name) => {
    const disabled = cannotOpen(name);
    let label = name;
    if (name === defaultBranch) label += " (default)";
    if (disabled) label += " (cannot be opened in vizi)";
    return { name, label, disabled, selected: name === current };
  });
}
