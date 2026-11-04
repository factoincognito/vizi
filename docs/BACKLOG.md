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
- **[LATER] PBI-1.4** (Clead, 2026-11-04, from the code review of PR #9) — Settle the known unknowns of `docs/SPEC.md` section 4 that PBI-1.2 left open, each checked in a real browser on the product owner's computer, not through this session's proxy: GitHub requests from a page opened from disk; GitHub's anonymous rate limit; what GitHub answers for a private repo. Record each result in the spec.
- **[DONE] PBI-1.5** (2026-11-04: PR #16, merge `d5bb2c3`, and PR #17, merge `c94918b`, each approved by a Clead-role review in round 1) (Clead, 2026-11-04, from the code review of PR #9, round 2) — The review's optional points, none a defect: heading slugs keep Unicode letters and digits (today `Översikt` becomes `versikt`); the same 4096-character limit for both link destination forms (one is 4095); the cost of a 1 MB hostile line (about 4 s); the stray-request test guard allows only the page's own file; separate test ids for "No blockers listed" and "None"; duplicate heading ids when one description shows in a board card and a list row; non-`.md` files shown as code in folder mode; a late answer from an older load ignored when a newer address was submitted. Added from the review of PR #11: the doc comment on `folderFiles` in `src/docs.ts` still says dot-folders are skipped, while the code skips only `.git` and `node_modules`; relative link targets fully percent-decoded (today `decodeURI` leaves `%2F` and `%23` as written); tests for the report's Info item and the documentation list when GitHub's file list is truncated (today only the message under the address is tested).
- **[DONE] PBI-1.7** (2026-11-04: workflow PR #22, merge `8054f14`, Clead-role review approved in round 3; spec PR #23, merge `bec8392`; Pages source set by the product owner 09:44; the first deploy before that failed with GitHub's 404 "Ensure GitHub Pages has been enabled", runs 41801704611 and 41801782427 after it succeeded; the live page answered 200 and made no request but its own, checked from this session) (product owner, 2026-11-04) — Publish vizi on
  GitHub Pages (`https://factoincognito.github.io/vizi/`): a workflow
  builds the page and deploys it on every merge to `main`. The product
  owner sets the repo's Pages source to "GitHub Actions" (a setting a
  session cannot change). Needs a spec update (SPEC 2 and 3.6: the page is
  published, not only opened locally) with the product owner's intent
  approval of 2026-11-04 recorded on it. Every Pages site of the
  factoincognito account shares the `factoincognito.github.io` browser
  storage; a custom domain can isolate vizi later if needed.
- **[DONE] PBI-1.8** (2026-11-04: CSP PR #30, merge `f9427c5`, and token PR #31, merge `122d641`, each approved by a Clead-role review; live on Pages with the policy; the checks against real GitHub with a real token, SPEC section 4 items 9 to 15, are open for the product owner's first try) (product owner, 2026-11-04, after PBI-1.7) — Private
  repos by address: a fine-grained, read-only GitHub token, limited to
  chosen repos and with an expiry, pasted into vizi and, behind a
  "Remember the token" box, saved in the browser's storage, with a
  "Forget the token" button. Intent approval given by the product owner
  on 2026-11-04 (09:27, in chat); it replaces "no token, no private repos
  by address" (2026-11-03). Expiry chosen by the product owner. A spec
  change first (records the approval), then the code. Check first that
  GitHub accepts such a token from the published page. The spec change
  also records that the first deploy failed until Pages was enabled (SPEC
  2.2 says "not checked"; now checked, see PBI-1.7). Consider a
  Content-Security-Policy that limits where the page may send data, since
  the token sits in storage shared by all factoincognito Pages sites
  (Clead-role review of PR #22). Spec: PR #26, merge `d4c2d26` (Crog
  approved in round 2). Defence for the shared `factoincognito.github.io`
  origin chosen by the product owner on 2026-11-04 (10:22): a rule — no
  repo named `factoincognito.github.io`, and Pages only for factoincognito
  repos he trusts; a domain of vizi's own stays the stronger option for
  later (SPEC 3.8).
- **[DONE] PBI-1.9** (2026-11-04: PR #35, merge `6ce4963`, Clead-role review approved in round 2; live on Pages) (product owner, 2026-11-04; intent approved 11:06; spec PR #33, merge `3c61bd4`) — The umbrella view:
  when vizi opens a project whose root has a `PROJECTS.md` in the product
  office's format (pointers `- owner/repo` or `- projects/<name>/` under
  headings), it shows the headings as a tree with the projects under
  them, and each project links on, to that project in vizi or to its
  repo. The tree is drawn from the file, never kept anywhere else. A spec
  change first, which needs the product owner's intent approval.
- **[DONE] PBI-1.11** (2026-11-04: PR #42, merge `21b259f`, Clead-role review approved in round 2; live on Pages) (product owner, 2026-11-04; intent approved 11:57; spec PR #40, merge `7ce0205`) — One saved GitHub
  token per owner (for example factoincognito and fomo-t), picked
  automatically by the owner in the address opened, the umbrella view's
  "Open in vizi" included. Each token has its own "Remember" box and
  "Forget", plus a "Forget all". Otherwise as PBI-1.8: read-only, sent
  only to GitHub, never shown. Reason: a fine-grained token belongs to one
  owner. A spec change first (records the approval), then the code. After
  PBI-1.9.
- **[NOW] PBI-1.13** (product owner, 2026-11-04; intent approved 12:43) — A help view, "How
  to make your project vizi compatible": a link on the start page opens
  it inside the page. Early in the text it says vizi is a read-only tool
  (product owner, 2026-11-04 16:13). Short steps with one example each: where the
  backlog file goes (`BACKLOG.md`, `docs/BACKLOG.md`,
  `docs/PRODUCT_BACKLOG.md`); how an entry is written and which markers
  are shown; the `STATUS.md` headings; `PROJECTS.md` for an umbrella;
  opening a private repo with a token (the folder way was dropped with
  PBI-1.14, product owner, 2026-11-04 15:15). A link at the end
  to `docs/BACKLOG-FORMAT.md` on GitHub. The text ships in the page, and
  a test checks that its examples read as stated. A spec change first,
  then the code. Before PBI-1.12.
- **[NEXT] PBI-1.17** (product owner, 2026-11-04 16:36) — The GitHub
  address field starts with `https://github.com/` filled in, so only
  `owner/repo` needs typing; a full address pasted into it still works
  (Clead's design). A spec change first, then the code. Right after
  PBI-1.13, before PBI-1.14.
- **[NEXT] PBI-1.14** (product owner, 2026-11-04 15:15, on Clead's recommendation) — Remove
  opening a local project folder: vizi opens projects from GitHub only
  (public by address, private with the saved token). The folder input, its
  code and tests go, and the folder step of the help view (PBI-1.13). This
  replaces the 2026-11-03 decision that local mode opens a folder. A spec
  change first, then the code; the help text in #45 follows the spec
  before #45 merges.
- **[NEXT] PBI-1.16** (product owner, 2026-11-04; intent approved 15:48, on
  Clead's mockup, recorded in the product office's decisions) — Redesign
  the start page: "Open a project from GitHub" with the address and
  Open on one row, the help link in the header, and the line "Public
  repos open without a token. Private repos need a token for their
  owner. All access is read-only: vizi never changes anything on
  GitHub."; a folded "Private repos" panel with one row per owner
  (Remember and Forget each), a token saved by an earlier vizi as one
  row asking for its owner, "Add a token" and "Forget all tokens"; one
  font, Inter, built into the page (the spec checks its licence against
  the product office's third-party policy); light, dark and phone. Next
  to the token fields, a step-by-step guide on how to make the read-only
  token (product owner, 2026-11-04 16:11), and a line that a saved
  token can be used by anyone with access to this browser, and that on
  a shared computer the token is better used for the page only, without
  saving it (16:18); the
  steps checked against
  GitHub's own documentation (with SPEC section 4, item 19). A spec
  change first, then the code. After PBI-1.14.
- **[NEXT] PBI-1.15** (product owner, 2026-11-04; intent approved 15:15) — A branch
  picker: after a repo loads, a list of its branches, and picking one
  opens that branch. The `/tree/<branch>` address keeps working. A spec
  change first, then the code. After PBI-1.16, in the redesigned start
  page.
- **[NEXT] PBI-1.12** (product owner, 2026-11-04; intent approved 11:59) — A "Saved repos"
  quick-access list on the start page: "Save" adds the open address, an
  entry loads on click (with the right token if private), "×" removes it.
  Kept in the browser, addresses only, never tokens; other factoincognito
  Pages sites (trusted, under the Pages rule) could read the repo names,
  not their contents. A spec change first, then the code. After PBI-1.15, in the redesigned
  start page (PBI-1.16).
- **[LATER] PBI-1.10** (Clead, 2026-11-04, from the code reviews of PRs #30 and #31) — Optional points, none a leak: a 401 forgets the token that is current, not the one GitHub refused (a new token entered during a load is forgotten); unticking "Remember" in one tab makes every other tab do a full Forget; the browser leak check looks at `body.outerHTML` only and should check the whole page; the token browser tests should assert that `window.__pwned` stays unset; a 429, or a 403 for the secondary rate limit, is reported as "the token may not read this repo"; Enter in the token field does nothing; `addCsp` misses a second policy spelled with an entity (harmless). Also: the spec lines #31 lists as outdated (2.2 and 2.3 "until PBI-1.8", 3.8 "a spec ahead of its code", the messages as built, a replaced load sends nothing more with the token, the no-store check as a unit test). Added from the code review of PR #35: the same 401 race applies to "Show status"; the pointer `- .../x` is accepted (harmless, as P4 allows); the spec lines #35 lists as outdated (3.9 "a spec ahead of its code" and the section 4 item 3 note, the report messages as built, the 401 token forget and the panel's "What could not be read" list). Added from the spec review of PR #40: a planted value that the startup clean-up removes entirely counts as no entries (the spec should say so). Added from PR #42 and its code review: the spec lines #42 lists (3.8 "Built and to build" and the single-token fallback; the line format as built; the Owner prefill as typed, kept in lower case; the messages for refusing an owner and for "Keep for this owner" when the browser will not save; "Use" without Remember removes only this tab's own saved copy; Forget for one owner also drops another owner's running load; the 401 message after the token was already replaced; an upper-case stored owner is lower-cased; a value without `"forgot"` is removed; the 3.9 test fixture `umbrella-cross`); "Forget all" leaves the old `vizi.githubToken` key and its migration line, so that earlier token survives it (a spec decision, Clead's); "Forget all" with nothing saved does not reach another tab's page-only tokens, while a per-owner Forget does; "Keep for this owner", when the browser will not save, drops that owner's existing token from memory; keep a Playwright trace on failure in CI, for the one-off failure of the second-tab test seen while building #42. Added from PR #45 and its code review: `e2e/csp.e2e.ts` lines 122, 135 and 151 read the security-policy violations before the browser reports them (the same race #45 fixed with `expect.poll`); `e2e/token.e2e.ts:620` failed once in a full run (desktop-light) and then passed 200 times, cause unknown; SPEC 3.10 says only the script hash changes, while the style hash changes too; no test drives a Forget from another tab while the help view is open.
- **[LATER] PBI-1.6** (Clead, 2026-11-04, from the code reviews of PRs #16 and #17) — Optional points, none a defect: check a link target again for control characters and backslashes after percent-decoding (today `%00`, `%0A` and `%5C` survive; SPEC 3.7 says a target with control characters is text); normalise heading text to NFC before making its slug, so a precomposed `Ö` and `O` plus a combining mark give the same anchor; a ~900k-character line of nested brackets takes about 1.4 s, close to the tests' 1.5 s limit; in `e2e/page.e2e.ts` two "no link" checks (around lines 207 and 370) run before the description renders, so they prove nothing — check after rendering; `showDoc` does not check after its `await` that the project is still the current one; a test for an older slow success arriving after a newer fast error.

---

## Explicitly out of scope

- Editing a backlog, moving or reordering cards included: vizi only
  reads; the backlog file is the only source of truth (product owner,
  2026-11-03, as the first version's scope). Kept for now on
  2026-11-04 15:31: changes go through Clead, or by hand in GitHub; may
  change later if there is a reason.
- Opening a local project folder (product owner, 2026-11-04 15:15;
  PBI-1.14 removes it). Private repos open with a saved token (PBI-1.8,
  PBI-1.11).
- In the first version: a command-line lint for CI (product owner,
  2026-11-03). Deployment was out of scope in the first version too;
  publishing on GitHub Pages is PBI-1.7 (product owner, 2026-11-04).
