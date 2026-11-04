/**
 * The "Private repos" panel is folded whenever the page opens (docs/SPEC.md
 * 3.12); the token controls are inside it. The browser tests open it after
 * every navigation, before they use a control inside it.
 */
import { expect, type Page } from "@playwright/test";

/** Opens the panel if it is folded, and waits until its body is shown. */
export async function openPanel(page: Page): Promise<void> {
  const toggle = page.locator("#private-repos-toggle");
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  await expect(page.locator("#private-repos-body")).toBeVisible();
}
