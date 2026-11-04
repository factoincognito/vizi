# Vizi - backlog visualizer Product Backlog

**Status:** Living document
**Owner:** Adam Smolowicz with Clead

---

## How to read this backlog

| Marker | Meaning |
|---|---|
| [NOW] | Active — being worked on |
| [NEXT] | Queued — ready to start after current work |
| [LATER] | Confirmed future work, not yet scheduled |
| [IDEA] | Unvalidated — needs discussion |
| [BLOCKED] | Waiting on dependency or decision |
| [DONE] | Completed and merged |
| [SUPERSEDED] | No longer needed; the reason is given inline |

Items are numbered `PBI-<phase>.<n>`, for example the first item of
phase one is phase 1, item 1. Numbers are never reused.

---

## Phase 1 — First version

**Goal:** the first version of vizi, a generated web page opened
locally, not deployed (product owner, 2026-11-03). When it counts as
done is the product owner's call (`memory/project.md`); Clead's
proposal is a question in `docs/NEXT_SESSION.md`, entry 1.

Build order: Clead's proposal, from the design the spec is taken from.

- **[DONE] PBI-1.1** (2026-11-04: PR #6, merge `e758085`, Clead-role code review approved in round 2; edge cases recorded in the spec by #7) — The
  backlog parser and its report, as a pure module with tests.
  `src/backlog.ts` reads a backlog file by the rules in
  `docs/BACKLOG-FORMAT.md` and returns the entries, their groups and the
  report of what it could not read or read with a warning;
  `src/status.ts` reads `STATUS.md`. No DOM. Tested with Jest, test
  first, on synthetic fixtures only (`docs/SPEC.md` 2.2).

- **[DONE] PBI-1.2** (2026-11-04: PR #9, merge `d7cecb5`, Clead-role code review approved in round 2) — The page. Folder and GitHub URL input, the board
  and the list, the status, the documentation links and the report tab,
  wired in `src/main.ts` on top of PBI-1.1, covered by Playwright tests
  with GitHub's answers stubbed (`docs/SPEC.md`).

- **[DONE] PBI-1.3** (2026-11-04: template PR #344, merge `b1139d9`) — A link to vizi's
  `docs/BACKLOG-FORMAT.md` from the template's `docs/BACKLOG.md` header.
  The template links to the format spec and does not hold a copy
  (product owner, 2026-11-03). A change in
  `factoincognito/ai-project-template-v2`, through that repo's own flow.
- **[LATER] PBI-1.4** (Clead, 2026-11-04, from the code review of PR #9) — Settle the known unknowns of `docs/SPEC.md` section 4 that PBI-1.2 left open, each checked in a real browser on the product owner's computer, not through this session's proxy: folder picking with the browser's own folder picker (the tests set the files directly), in Chromium and in other browsers; GitHub requests from a page opened from disk; GitHub's anonymous rate limit; what GitHub answers for a private repo. Record each result in the spec.
- **[DONE] PBI-1.5** (2026-11-04: PR #16, merge `d5bb2c3`, and PR #17, merge `c94918b`, each approved by a Clead-role review in round 1) (Clead, 2026-11-04, from the code review of PR #9, round 2) — The review's optional points, none a defect: heading slugs keep Unicode letters and digits (today `Översikt` becomes `versikt`); the same 4096-character limit for both link destination forms (one is 4095); the cost of a 1 MB hostile line (about 4 s); the stray-request test guard allows only the page's own file; separate test ids for "No blockers listed" and "None"; duplicate heading ids when one description shows in a board card and a list row; non-`.md` files shown as code in folder mode; a late answer from an older load ignored when a newer address was submitted. Added from the review of PR #11: the doc comment on `folderFiles` in `src/docs.ts` still says dot-folders are skipped, while the code skips only `.git` and `node_modules`; relative link targets fully percent-decoded (today `decodeURI` leaves `%2F` and `%23` as written); tests for the report's Info item and the documentation list when GitHub's file list is truncated (today only the message under the address is tested).
- **[LATER] PBI-1.6** (Clead, 2026-11-04, from the code reviews of PRs #16 and #17) — Optional points, none a defect: check a link target again for control characters and backslashes after percent-decoding (today `%00`, `%0A` and `%5C` survive; SPEC 3.7 says a target with control characters is text); normalise heading text to NFC before making its slug, so a precomposed `Ö` and `O` plus a combining mark give the same anchor; a ~900k-character line of nested brackets takes about 1.4 s, close to the tests' 1.5 s limit; in `e2e/page.e2e.ts` two "no link" checks (around lines 207 and 370) run before the description renders, so they prove nothing — check after rendering; `showDoc` does not check after its `await` that the project is still the current one; a test for an older slow success arriving after a newer fast error.

---

## Explicitly out of scope

- Editing a backlog: vizi only reads; the backlog file is the only
  source of truth (product owner, 2026-11-03).
- Reading private repos by URL, or any GitHub token (product owner,
  2026-11-03). Private projects are opened as a local folder.
- In the first version: deployment, and a command-line lint for CI
  (product owner, 2026-11-03).
