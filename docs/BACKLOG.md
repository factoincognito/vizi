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

- **[NEXT] PBI-1.1** (waits on PR #3 merging, after Crog's review) — The
  backlog parser and its report, as a pure module with tests.
  `src/backlog.ts` reads a backlog file by the rules in
  `docs/BACKLOG-FORMAT.md` and returns the entries, their groups and the
  report of what it could not read or read with a warning;
  `src/status.ts` reads `STATUS.md`. No DOM. Tested with Jest, test
  first, on synthetic fixtures only (`docs/SPEC.md` 2.2).

- **[LATER] PBI-1.2** — The page. Folder and GitHub URL input, the board
  and the list, the status, the documentation links and the report tab,
  wired in `src/main.ts` on top of PBI-1.1, covered by Playwright tests
  with GitHub's answers stubbed (`docs/SPEC.md`).

- **[LATER] PBI-1.3** (after PR #3 merges) — A link to vizi's
  `docs/BACKLOG-FORMAT.md` from the template's `docs/BACKLOG.md` header.
  The template links to the format spec and does not hold a copy
  (product owner, 2026-11-03). A change in
  `factoincognito/ai-project-template-v2`, through that repo's own flow.

---

## Explicitly out of scope

- Editing a backlog: vizi only reads; the backlog file is the only
  source of truth (product owner, 2026-11-03).
- Reading private repos by URL, or any GitHub token (product owner,
  2026-11-03). Private projects are opened as a local folder.
- In the first version: deployment, and a command-line lint for CI
  (product owner, 2026-11-03).
