/**
 * What the page keeps in `localStorage`, as the browser tests count it
 * (docs/SPEC.md 3.17 item 10): the page writes `vizi.seenVersion` at every
 * load, so a test that asserts that no token or repo name is stored looks at
 * the keys other than that one.
 */
import type { Page } from "@playwright/test";

/** The key of the version last seen (3.17 item 7). */
export const SEEN_KEY = "vizi.seenVersion";

/** The keys in `localStorage` other than `vizi.seenVersion`, sorted. */
export function storedKeys(page: Page): Promise<string[]> {
  return page.evaluate(
    (seen) =>
      Object.keys(localStorage)
        .filter((k) => k !== seen)
        .sort(),
    SEEN_KEY,
  );
}
