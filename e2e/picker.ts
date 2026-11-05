/**
 * The branch picker reads a repo's branch list after a load has shown its
 * results (docs/SPEC.md 3.13). Tests that look at a load's requests wait for
 * that list first, so the list's request is counted with the load that made
 * it, not with the next one.
 */
import { expect, type Page } from "@playwright/test";

/** The first page of a repo's branch list, the request 3.13 makes after a load. */
export const branchesUrl = (owner: string, repo: string, page = 1) =>
  `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100&page=${page}`;

/** Waits until the branch list of the load on the page has been read, or has failed. */
export async function branchListRead(page: Page): Promise<void> {
  await expect(page.locator("#branch-picker")).not.toHaveAttribute("aria-busy", "true");
}
