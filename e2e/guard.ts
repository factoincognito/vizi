/**
 * The stray-request rule of docs/SPEC.md 2.3 and 3.7 item 5, as a function
 * the browser tests share: the page may request its own document and the
 * two GitHub hosts of 3.1, and nothing else.
 */

/** Whether the page may make this request. `ownDocuments` are the URLs the page itself is served from. */
export function isAllowedRequest(url: string, ownDocuments: string[]): boolean {
  return (
    ownDocuments.includes(url) ||
    url.startsWith("file:") ||
    url.startsWith("https://api.github.com/") ||
    url.startsWith("https://raw.githubusercontent.com/")
  );
}
