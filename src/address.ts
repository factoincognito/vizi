/**
 * The repository named in the page's own address, `?repo=<owner>/<repo>`
 * (docs/SPEC.md 3.16, "Reading the address"). Pure: it reads the text of
 * `location.search` and touches no DOM. What it gives is written into the
 * Repository field, which then reads it as typed text (3.1).
 */

/** The parameter's name, compared as written. */
const NAME = "repo";

/**
 * The value of the first `repo` parameter of `search` (the address's
 * `?…` part), or null when there is none or it is empty or white space only.
 *
 * The text after one leading `?` is split on `&`; the first part whose name
 * (the text before its first `=`) is exactly `repo` is the parameter, so a
 * part `repo` without `=` is not one, and every later `repo` part is
 * ignored. Its value, the text after the first `=`, has each `+` replaced by
 * a space and is decoded once with `decodeURIComponent`; when that fails (a
 * malformed escape, a lone `%`) the value is kept undecoded, with only the
 * `+` replaced, so the field refuses it as it refuses the same text typed.
 * `URLSearchParams` is not used: it turns an escape that is not valid UTF-8
 * into U+FFFD.
 */
export function repoFromSearch(search: string): string | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  for (const part of query.split("&")) {
    const eq = part.indexOf("=");
    if (eq < 0 || part.slice(0, eq) !== NAME) continue;
    const spaced = part.slice(eq + 1).replace(/\+/g, " ");
    let value: string;
    try {
      value = decodeURIComponent(spaced);
    } catch {
      value = spaced;
    }
    // White space only, as the field's own trim reads it, counts as no value.
    return value.trim() === "" ? null : value;
  }
  return null;
}
