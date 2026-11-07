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
| [BLOCKED] | Waiting on dependency or decision |
| [DONE] | Completed and merged |

The markers are those of product-office Process P-9 § 2 (2).

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
- **[DONE] PBI-1.13** (2026-11-04: PR #45, merge `ae9ab60`, Clead-role review approved in round 3; live on Pages) (product owner, 2026-11-04; intent approved 12:43; spec PRs #44 and #51) — A help view, "How
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
- **[DONE] PBI-1.17** (2026-11-04: PR #67, merge `cc7652c`, Clead-role review approved in round 2; spec PRs #65 and #69; live on Pages) (product owner, 2026-11-04 17:07, on Clead's
  recommendation; replaces the 16:36 prefill of `https://github.com/`) —
  One "Repository" field where the user types `owner/repo`, for example
  `fomo-t/fomo-f`; a full GitHub address pasted into it, with or without
  `/tree/<branch>`, still works, and the token is still picked by the
  owner. A spec change first, then the code. In the unattended run of
  2026-11-04 (product owner, 19:18 "All"); built after PBI-1.14, which
  was already under way, and before PBI-1.16.
- **[DONE] PBI-1.14** (2026-11-04: PR #63, merge `9560d78`, Clead-role review approved; live on Pages) (product owner, 2026-11-04 15:15, on Clead's recommendation) — Remove
  opening a local project folder: vizi opens projects from GitHub only
  (public by address, private with the saved token). The folder input, its
  code and tests go, and the folder step of the help view (PBI-1.13). This
  replaces the 2026-11-03 decision that local mode opens a folder. Spec merged in #47 (`1a84c1a`); the help
  text in #45 followed it before #45 merged. The code is next.
- **[DONE] PBI-1.16** (2026-11-05: PR #73, merge `28f9c87`, Clead-role review approved in round 2; spec PR #57; the Pages run on the merge succeeded) (product owner, 2026-11-04; intent approved 15:48, on
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
  GitHub's own documentation (with SPEC section 4, item 19). Spec
  merged in #57 (`4325ad3`); the code after PBI-1.14.
- **[DONE] PBI-1.18** (2026-11-05: PR #84, merge `a60167e`, Clead-role review approved in round 1; spec PR #80; the Pages run on the merge succeeded) (product owner, 2026-11-04 22:21) — A help text in
  the umbrella view that explains what an umbrella is, and what
  "pre-projects" are: projects at an early stage with no repo of their own
  yet, living in the umbrella repo for now (the `projects/<name>/`
  pointers; product owner, 22:24). The wording is Clead's. A spec change first, then the code. In the unattended run of
  2026-11-04, after PBI-1.16.
- **[DONE] PBI-1.15** (2026-11-05: PR #81, merge `f13f020`, Clead-role review approved in round 2; spec PR #59; the Pages run on the merge succeeded) (product owner, 2026-11-04; intent approved 15:15) — A branch
  picker: after a repo loads, a list of its branches, and picking one
  opens that branch. The `/tree/<branch>` address keeps working. A spec
  change first, then the code. After PBI-1.16, in the redesigned start
  page.
- **[DONE] PBI-1.19** (2026-11-06: PR #85, merge `58b6e17`; product owner, 2026-11-04 22:47, on Clead's
  recommendation; open to change after trying it) — Guided opening from
  the Repository field: it takes `<owner>` or `<owner>/<repo>`. While
  typing after `<owner>/`, a list of that owner's repos drops down
  (private ones the owner's token can see). When the field loses focus,
  an owner alone shows the repo list, and a repo shows its branches with
  the repo's own default branch preselected (fomo-f's is `master`). A
  pasted full address still opens directly. PBI-1.15's picker on a loaded
  project stays, and its branch request is reused. Simplified (product
  owner, 2026-11-05 07:41): no list caching beyond the owner's repo list
  for one page visit. A spec change first, then the code. Spec merged
  in #82 (`3c2fdb4`) on 2026-11-05; the build follows.
- **[DONE] PBI-1.34** (2026-11-07: PR #98; product owner, 2026-11-07 01:05, intent approval of the spec, product-office `DECISIONS.md`; product-office PO-105 step 3; vizi is `NOW` as PO-50 since 01:09; first in the order, product owner 2026-11-07 07:40, product-office `DECISIONS.md`) — Build the include keyword as `docs/SPEC.md` 3.15 specifies, tests first, through vizi's flow. The build PR changes `RULES.md` L § 5 (1) (the one exception for include lines), so it needs a separate Crog agent's review besides the CI verdict (L § 4 (11)); it also writes 3.15's section 6 into `docs/BACKLOG-FORMAT.md` and the changes 3.15 lists for 2.3, 3.1, 3.5, 3.7, 3.13 and the help view's link. From the round 2 review of #93 (non-blocking, for the build): I4 does not say which message the root's `STATUS.md` or `PROJECTS.md` gets when the file list lacks it (check those two names before the file list); `docs/NEXT_SESSION.md` entry 5's list of SPEC sections lacks 3.13; the replaced-load unit test says the load succeeds without `STATUS.md`, true only if the file list also lacks `PROJECTS.md`, so the test names both. After the build: the product office's `BACKLOG.md` gets the include line for `BACKLOG-DONE.md` (the first use).
---

## Audit findings (2026-11-06)

The findings of the product office's audit of this project (Process P-6 § 8 (2)). Adam's decision: conditional accept, 2026-11-06.

- **[NEXT] PBI-1.12** (product owner, 2026-11-04; intent approved 11:59) — A "Saved repos"
  quick-access list on the start page: "Save" adds the open address, an
  entry loads on click (with the right token if private), "×" removes it.
  Kept in the browser, addresses only, never tokens; other factoincognito
  Pages sites (trusted, under the Pages rule) could read the repo names,
  not their contents. A spec change first, then the code. After PBI-1.15, in the redesigned
  start page (PBI-1.16).
- **[NEXT] PBI-1.10** (in the unattended run of 2026-11-04, product owner 19:18, after PBI-1.12) (Clead, 2026-11-04, from the code reviews of PRs #30 and #31) — Optional points, none a leak: a 401 forgets the token that is current, not the one GitHub refused (a new token entered during a load is forgotten); unticking "Remember" in one tab makes every other tab do a full Forget; the browser leak check looks at `body.outerHTML` only and should check the whole page; the token browser tests should assert that `window.__pwned` stays unset; a 429, or a 403 for the secondary rate limit, is reported as "the token may not read this repo"; Enter in the token field does nothing; `addCsp` misses a second policy spelled with an entity (harmless). Also: the spec lines #31 lists as outdated (2.2 and 2.3 "until PBI-1.8", 3.8 "a spec ahead of its code", the messages as built, a replaced load sends nothing more with the token, the no-store check as a unit test). Added from the code review of PR #35: the same 401 race applies to "Show status"; the pointer `- .../x` is accepted (harmless, as P4 allows); the spec lines #35 lists as outdated (3.9 "a spec ahead of its code" and the section 4 item 3 note, the report messages as built, the 401 token forget and the panel's "What could not be read" list). Added from the spec review of PR #40: a planted value that the startup clean-up removes entirely counts as no entries (the spec should say so). Added from PR #42 and its code review: the spec lines #42 lists (3.8 "Built and to build" and the single-token fallback; the line format as built; the Owner prefill as typed, kept in lower case; the messages for refusing an owner and for "Keep for this owner" when the browser will not save; "Use" without Remember removes only this tab's own saved copy; Forget for one owner also drops another owner's running load; the 401 message after the token was already replaced; an upper-case stored owner is lower-cased; a value without `"forgot"` is removed; the 3.9 test fixture `umbrella-cross`); "Forget all" leaves the old `vizi.githubToken` key and its migration line, so that earlier token survives it (a spec decision, Clead's); "Forget all" with nothing saved does not reach another tab's page-only tokens, while a per-owner Forget does; "Keep for this owner", when the browser will not save, drops that owner's existing token from memory; keep a Playwright trace on failure in CI. Added from the review of #55: `e2e/csp.e2e.ts` lines 98 and 110 check for no violations with a single read, so a late violation would slip past them; `e2e/token.e2e.ts` around line 826 uses a fixed 300 ms wait to show that nothing changes. Added from the PBI-1.14 and PBI-1.17 reviews (#63, #67), spec points: SPEC 3.8's test line "its 404 names the owner" is out of date since 3.11; 3.1's branch message could say "#, % or ?" since a decoded `?` gets it too; 3.1's list of old-message tests missed `e2e/page.e2e.ts:162`; 3.1 lets an owner hold dots, so `gist.github.com/acme` is read as owner `gist.github.com` (GitHub owners have no dots, unchecked here); decoded branches may hold names git refuses (`..`, a newline), harmless as 3.1's requests stand; an umbrella pointer whose repo ends in `.git` gets the clone message on "Open in vizi", which 3.9 does not mention. Added from PR #45 and its code review (the CSP race and the `token.e2e.ts:620` failure were fixed in #55, merge `6fee666`): SPEC 3.10 says only the script hash changes, while the style hash changes too; no test drives a Forget from another tab while the help view is open. Added from the round 2 review of #45: `src/markdown.test.ts:389` ("hostile input stays fast", a 1500 ms wall-clock limit) fails on a heavily loaded machine although `render` takes 0.2–0.7 s of CPU; measure CPU time or raise the limit so the test checks the algorithm, not the machine. From the review of #57: the 3.12 list of help-view changes could name the new `h2` among the hidden wrapper's headings. Added from the review of #73: on a phone, a token row's "Forget" stretches to its grid column's width (about 125 px against the board's 76 px, so "Remember in this browser" wraps); `justify-self: end` on the row's button would give the board's look; the header is 75 px high against the board's 70 px; the phone differences that come from 3.12's text (the guide's toggle in its bordered box, "Forget all tokens" shown on a phone, the 44 px help control) could be listed in 3.12. Added from the reviews of #81 (the reviews of #80 list no 3.13 point): no test checks the branch picker's contrast in light and dark (`#branch-select` and its options, `#branch-label`, `#branch-open`, `#branch-message`; 3.12's contrast test covers the start page, not the results); `hideResults` leaves `aria-busy` on the picker and "Open branch" disabled when the results are hidden while the list is read (harmless while hidden, and the next `renderPicker` resets both), and could clear them for tidiness. 3.13 notes from those reviews: "Errors" could state the code's reading of 3.8's "a Forget counts as a newer load", that a Forget of another owner's token, or "Forget all tokens" when the read carried none, does not drop the list's answer; a 401 on the list after the token was replaced meanwhile keeps the new token but shows 3.8's "It has been forgotten" (the wording point from #42 above, here for the picker, and for the 401 of `openRef` too); while the list loads, the current branch's option has no " (default)" mark; a default branch past the cap is not added; a name both default and disabled gets " (default) (cannot be opened in vizi)", an order 3.13 does not set; the arrow-key test does not check whether Chromium fires `change` per key; 3.1's request-order tests text does not mention the branch list after the load's requests. Added from the reviews of #84: the "without a PROJECTS.md" browser test in `e2e/umbrella.e2e.ts` asserts `toBeHidden()`, which passes before and after the change because the paragraph is mounted in the hidden panel; also assert that `#panel-umbrella` is hidden; the order check in `src/help.test.ts` passes vacuously if the earlier sentence ("to a folder of the same project.") is missing, so assert that it is found (`>= 0`) first; the contrast helper in `e2e/umbrella.e2e.ts` falls back to `<html>`'s background even when that background is transparent; the fixed 200 ms wait before counting requests in `e2e/umbrella.e2e.ts`; 3.10 step 4's "after the sentence on pointers" should name which of its two pointer sentences it means. Added from the round 4 review of #82 (the PBI-1.19 spec): the blur exception is ambiguous after a repo is chosen in the owner's select (the field holds `acme/widgets` while the select still shows `acme`'s repos; does Shift+Tab to the field and Tab back count as the select showing the field's text?); the datalist rule does not say what happens when the text becomes not guided, for example `acme/widgets/tree/main`; the guide's browser tests have no case for a disabled `#` or `%` branch, or a branch name with markup, in the guide's own select (they rely on 3.13's tests); each "Open" with an owner and a repo first blurs the field, which spends one request 1 that is then dropped, and each Tab out of the field spends two to four requests, against the anonymous limit of 60 an hour. Added from the wrap-up of 2026-11-05: in vizi's `CLAUDE.md`, rule 7's line starting "finds the old verdict and posts nothing):" is 99 characters wide, against at most 75 for the file's other lines. Also from the wrap-up: SPEC 3.9's bullet "The help view, at the PBI-1.18 build" still says 3.10 is not changed by that spec (PR #73 changes it now), out of date since #84 (point 3 of the CI review of #84); SPEC 3.10's line "3.10 is not changed by this spec: PR #45 is building it now" is out of date since #45 merged; the non-blocking 3.9 and 3.10 wording points of the four reviews of #80 are to be checked against main and fixed where still open; from the review of #73, the tagline gap relies on Inter's space width, and 3.12 could name the migration Owner field's 14 px on a phone. Added from the review of #85: switching browser tabs blurs the Repository field, so each switch with `<owner>/<repo>` in it starts the opening guide's read, two to four anonymous requests against the limit of 60 an hour, which 3.1's "every blur" allows (the #82 point above on a disabled `#` or `%` branch, or a branch name with markup, in the guide's own select is closed by #85's browser test). Added from the Clead review of #85 (2026-11-06): the guide's browser tests use one token value for every owner, so they would not catch one owner's token sent with another's request (a test with two tokens would); a 401 on a guide read counts as a newer load and drops a running load of any owner (3.8's "a Forget counts as a newer load", now reachable from the guide); the kept-list code has no rejection handler, so if a path ever rejected, the owner's line would stay on "Reading…" for the visit.
- **[NEXT] PBI-1.6** (in the unattended run of 2026-11-04, product owner 19:18, after PBI-1.10) (Clead, 2026-11-04, from the code reviews of PRs #16 and #17) — Optional points, none a defect: check a link target again for control characters and backslashes after percent-decoding (today `%00`, `%0A` and `%5C` survive; SPEC 3.7 says a target with control characters is text); normalise heading text to NFC before making its slug, so a precomposed `Ö` and `O` plus a combining mark give the same anchor; a ~900k-character line of nested brackets takes about 1.4 s, close to the tests' 1.5 s limit; in `e2e/page.e2e.ts` two "no link" checks (around lines 207 and 370) run before the description renders, so they prove nothing — check after rendering; `showDoc` does not check after its `await` that the project is still the current one; a test for an older slow success arriving after a newer fast error.

- **[DONE] PBI-1.20** (done 2026-11-06: product-office #562; audit of 2026-11-06, finding F1, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06) — (§ 3 sign-off): product-office `PROJECTS.md` line 49 names vizi's sign-off by PR and commit as plain text, not as a link.
- **[DONE] PBI-1.21** (done 2026-11-06 in #92: `memory/standards.md` cut to pointers to P-3 §§ 2 to 4 and 6, P-2 § 3 (2), §§ 12 (2) and 13 (2), (3), and L § 3 and L § 4 (6); two test-quality questions and the fomo-f incident note kept; audit of 2026-11-06, finding F2, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06; due 2026-11-20) — (§ 4 no global rule restated): `memory/standards.md` restates P-3 §§ 2, 3, 4 and 6, P-2 § 3 (2) and `RULES.md` § 13 (2).
- **[DONE] PBI-1.22** (done 2026-11-06 in #92: `docs/decisions/0001-rebuild-workflow.md`: the status line says it is a historical record and that the product office's Rules and Processes prevail wherever it differs from them; the passages restating §§ 6, 16 (1) and (3), 34 (4) and 36 (4) cut to pointers, and the five merge lines (lines 134, 188, 211, 288 and 370 at the audited commit `f2b49c2`) to pointers to § 10 (2) and P-4 § 2 (1); other rule text in it is left as history; audit of 2026-11-06, finding F3, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06; due 2026-11-20) — (§ 4): `docs/decisions/0001-rebuild-workflow.md`, marked adopted and not superseded and named as founding decisions by `memory/decisions.md`, restates §§ 6, 16, 34 (4) and 36 (4) and states merge rules that § 10 (2) and P-4 § 2 (1) replace.
- **[DONE] PBI-1.23** (done 2026-11-06 in #92: `.github/PULL_REQUEST_TEMPLATE.md`: the two comments cut to pointers to P-2 § 3 (2) and § 30 (1), (3) and (4); audit of 2026-11-06, finding F4, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06; due 2026-11-20) — (§ 4): `.github/PULL_REQUEST_TEMPLATE.md` lines 11 to 12 and 20 to 23 restate P-2 § 3 (2) and `RULES.md` § 30 (3), (4).
- **[DONE] PBI-1.24** (done 2026-11-06 in #92: the header comment of `STATUS.md` cut to a pointer to P-9 § 6; audit of 2026-11-06, finding F5, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06; due 2026-11-20) — (§ 4): `STATUS.md` lines 1 to 8 restate P-9 § 6 (2) to (4).
- **[DONE] PBI-1.25** (done 2026-11-06 in #92: `docs/DEV_INFRASTRUCTURE.md`: "New machine setup" and the protection fallback cut to pointers to P-11 § 4 (1) and § 3 (3), with vizi's facts kept; `README.md`'s reference to the setup steps repointed; audit of 2026-11-06, finding F6, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06; due 2026-11-20) — (§ 4): `docs/DEV_INFRASTRUCTURE.md` lines 15 to 23 and 61 to 70 restate P-11 § 4 (1) and § 3 (3).
- **[DONE] PBI-1.26** (done 2026-11-06 in #92: `languages/web/code-standards.md`: "Test first" and the `Test-exempt:` lines cut to pointers to § 30 (1), (4) and P-11 § 2 (3); audit of 2026-11-06, finding F7, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06; due 2026-11-20) — (§ 4): `languages/web/code-standards.md` line 12 and lines 92 to 94 restate `RULES.md` § 30 (1), (4) and P-11 § 2 (3).
- **[DONE] PBI-1.27** (done 2026-11-06 in #92: `CLAUDE.md`: the reading list cut to pointers to § 1 (2), P-1 § 1 and L § 2; audit of 2026-11-06, finding F8, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06; due 2026-11-20) — (§ 4): `CLAUDE.md` lines 9 to 15 restate P-1 § 1 (1) and `RULES.md` § 1 (2).
- **[DONE] PBI-1.28** (done 2026-11-07 in #95: L § 4 (1) cites "Overrides § 34 (2)", Adam's option (a), 2026-11-07 01:05, product-office `DECISIONS.md`; audit of 2026-11-06, finding F9, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06; due 2026-11-20) — (§ 5 overrides): L § 4 (1) makes a CI workflow Crog, against `RULES.md` § 34 (2), without citing it as overridden.
- **[DONE] PBI-1.29** (done 2026-11-06 in #92: the `[IDEA]` and `[SUPERSEDED]` rows taken out of the marker legend, which no entry used, and a pointer to P-9 § 2 (2) added under it; audit of 2026-11-06, finding F10, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06; due 2026-11-20) — (§ 5): `docs/BACKLOG.md` lines 10 to 18 list markers `[IDEA]` and `[SUPERSEDED]` beyond P-9 § 2 (2), with no local rule citing it; not itself a local rule.
- **[DONE] PBI-1.30** (done 2026-11-06 in #92: `CHANGELOG.md` lines for #87 to #90; audit of 2026-11-06, finding F11, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06; due 2026-11-20) — (§ 7 practice): `CHANGELOG.md` lacks #87 to #90, and no changelog PR was open (P-4 § 5 (1)).
- **[LATER] PBI-1.31** (audit of 2026-11-06, finding F12, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06; past practice, re-checked at the next audit) — (§ 7): the required manual review of #89 used the PR description and the product office's Rules, which L § 3 (1) withholds; pre-cutover reviews of #73, #78, #79 and #88 also read beyond their restricted inputs.
- **[LATER] PBI-1.32** (audit of 2026-11-06, finding F13, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06; past practice, re-checked at the next audit) — (§ 7): #90 and eight pre-cutover PRs were opened with their whole change, with no claim beforehand (P-2 § 4 (1), (3)).
- **[LATER] PBI-1.33** (audit of 2026-11-06, finding F14, record `audits/vizi.md` in the product office; Adam's conditional accept, 2026-11-06; past practice, re-checked at the next audit) — (§ 7): #82 went through nine CHANGES NEEDED verdicts (seven in a row) before it was parked for Adam, without the escalation message of `memory/standards.md` § 6 (pre-cutover).

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
