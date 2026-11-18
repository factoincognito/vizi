# PBI-1.10 inventory

Written 2026-11-11 by a Clead session as a read-only check of the 79 points of [PBI-1.10](BACKLOG.md), against `main` at `7bdbad9`. The backlog entry points here. Read it as a start, not as current fact:

- Line numbers are those of `7bdbad9`. Since then #104 to #109 merged; #107 changed `e2e/token.e2e.ts`, `src/main.ts`, `src/start.ts`, `src/style.css` and `docs/SPEC.md` (3.8, 3.12, section 4), so re-check points 3, 4, 24, 35 and every SPEC line number before using them.
- Nothing was run. Every status below comes from reading files.
- 2026-11-18: spec PR A (points 9, 20, 22, 23, 24, 25, 27, 29, 36, 75) merged in #122 and spec PR B (points 41, 42, 51, 55, 62, 68, 69, 72) in #123, both reviewed by a review agent and approved in intent by Adam. Point 48 was left out of B: it compares 3.12 with the phone board of the design canvas, which is not in the repository. The statuses below are as of 2026-11-11 and were not changed.
- 2026-11-18: point 46 (group J) is fixed in #126. Point 47 was measured (117.8 px against 87.8 px, not the 75 and 70 of the row) and is item 14 in #127; point 48 is items 14 to 16 there, which waits for Adam's intent approval.
- Adam's go-line is needed before the PRs of groups D to I start; they change no behaviour, but G, H and I also edit `src/` and `playwright.config.ts` (see `STATUS.md`, Blockers).

Repository at main `7bdbad9`. Entry: docs/BACKLOG.md:180 at that commit. Each point was checked against the files as they were at `7bdbad9`.
79 points. FIXED 22, OPEN-CODE 20, OPEN-SPEC 19, DECISION 15, UNCLEAR 3.
Line numbers are those of `7bdbad9`. Where a point named an old line number, I mapped it by content and say so.
Nothing was run (no tests, no browser): every status is from reading files, and for three points that is not enough (47, 57, 70).

## Table

| # | Point (first words) | Status | Evidence / what is missing |
|---|---|---|---|
| 1 | "a 401 forgets the token that is current, not the one GitHub refused" | FIXED | src/token.ts `forgetIfCurrent` (forgets only if still the held token); used at src/main.ts:602, 835, 915, 1667. SPEC 3.8 "Answers", 401 bullet (from line 1939) says so. Unit test exists in src/token.test.ts (not individually line-checked). |
| 2 | "unticking "Remember" in one tab makes every other tab do a full Forget" | FIXED | src/token.ts `onStorage` returns `keptForPage`; src/token.test.ts:560-571 and :593-603; SPEC 3.8 "Other open vizi tabs", bullet at line 1893 ("This settles PBI-1.10's point..."). |
| 3 | "the browser leak check looks at `body.outerHTML` only" | OPEN-CODE | e2e/token.e2e.ts:189-196 `pageContents` reads location.href, title, `document.body.outerHTML`, body.innerText, input values. Not `<head>` or the whole `documentElement`. |
| 4 | "the token browser tests should assert that `window.__pwned` stays unset" | OPEN-CODE | No `__pwned` in e2e/token.e2e.ts (grep). Only e2e/csp.e2e.ts:229-287 and e2e/guide.e2e.ts:1611 use it. |
| 5 | "a 429, or a 403 for the secondary rate limit, is reported as "the token may not read this repo"" | OPEN-CODE | src/github.ts:222-236: only 403 with `X-RateLimit-Remaining: 0` gives "rate-limit"; any other 403 (secondary limit: Retry-After, remaining not 0) gives "forbidden". 429 is not handled (falls to the generic status message). No `429`/`Retry-After` in SPEC 3.8 (grep). User-visible message, so a failing test first. Wording of the new message is Clead's/Adam's to approve (spec text needed in the same PR). |
| 6 | "Enter in the token field does nothing" | DECISION | No keydown/submit handler on `#token-input` in src/main.ts. SPEC 3.12 lines ~2825-2826 says "Enter in the token field does nothing, as today (PBI-1.10 lists it)". Choice: keep (and close the point) or make Enter press "Add". Behaviour is documented, the choice is not recorded as decided. |
| 7 | "`addCsp` misses a second policy spelled with an entity (harmless)" | DECISION | src/csp.ts:~76-79 comment states the plain spelling only is caught and a missed second policy can only narrow. Choice: close as accepted (no change) or extend the regex. |
| 8 | "the spec lines #31 lists as outdated (2.2 and 2.3 "until PBI-1.8"" | FIXED | SPEC 2.2 line 396-398 ("built in PBI-1.8... Before PBI-1.8 it held nothing secret"); 2.3 lines 440-445 ("Before PBI-1.8 the page set none... Since PBI-1.8 ... it sets one"). |
| 9 | "3.8 "a spec ahead of its code"" | OPEN-SPEC | SPEC 3.8 "Built and to build." paragraph, lines 1680-1690, still says "a spec ahead of their code" and "Until PBI-1.11 is built, the page holds one token". Same paragraph as point 20. Code has per-owner tokens (src/token.ts). |
| 10 | "the messages as built" (3.8 Answers) | FIXED | SPEC 3.8 "Answers" from line 1939 gives the rate-limit time format, 403 text, refused-text and storage-refused texts; they match src/github.ts:218-236, src/token.ts:23-24 and src/main.ts:1099. |
| 11 | "a replaced load sends nothing more with the token" | FIXED | SPEC 3.8 "Which token a load uses" (line 1823): "(built: the page's fetch refuses before the request is made)". Code: `guardedFetch` src/main.ts:875. |
| 12 | "the no-store check as a unit test" | FIXED | src/github.test.ts:406, 719, 814, 959 assert `cache: "no-store"`. SPEC 3.8 Tests lists it under src/github.ts unit tests. |
| 13 | "the same 401 race applies to "Show status"" | FIXED | src/main.ts:596-608 (`showProjectStatus` uses `forgetIfCurrent` with `read.token`); SPEC 3.8 401 bullet says "for a load and for "Show status" alike". |
| 14 | "the pointer `- .../x` is accepted (harmless, as P4 allows)" | DECISION | src/projects.ts:61 `POINTER` allows `.` inside names; only exactly `.` and `..` are refused (line 82). Choice: close as accepted. No spec/BACKLOG-FORMAT change checked. |
| 15 | "the spec lines #35 lists as outdated (3.9 "a spec ahead of its code" and the section 4 item 3 note" | FIXED | "spec ahead of" occurs once in SPEC (line 1682, 3.8 only), not in 3.9. Section 4 item 3 (lines ~5159-5172) now describes the built requests. |
| 16 | "the report messages as built" (3.9) | FIXED | SPEC 3.9 "Report" lines 2099-2109 list the four messages; they match src/projects.ts:89-129. |
| 17 | "the 401 token forget" (3.9 Show status) | FIXED | SPEC 3.9 lines 2084-2088 ("A read GitHub refuses the token for (401) forgets that token as 3.8 sets out and hides the results loaded with it, the panel included"). |
| 18 | "the panel's "What could not be read" list" | FIXED | SPEC 3.9 lines 2078-2082; code src/main.ts:627. |
| 19 | "a planted value that the startup clean-up removes entirely counts as no entries" | FIXED | SPEC 3.8 "What an event is compared with", lines 1858-1862: "a value that is missing or that the clean-up would remove counts as no entries and no forgot". Unit test src/token.test.ts:593. |
| 20 | "3.8 "Built and to build" and the single-token fallback" | OPEN-SPEC | Same text as point 9 (SPEC lines 1680-1690): the paragraph and the `vizi.githubToken` single-key fallback description are still there. |
| 21 | "the line format as built" | FIXED | SPEC 3.8 "Never shown back in full" (line 1725) gives the format and says from PBI-1.16 each line is a panel row; 3.12 lines ~2750-2770 and "Differences" item 9 (line ~3247) describe the built row. |
| 22 | "the Owner prefill as typed, kept in lower case" | OPEN-SPEC | Code: src/main.ts:999-1003 fills `read.ref.owner` as typed; token kept lower-case (src/token.ts `parseOwner`). SPEC 3.8 "Which owner a token is for" (line 1696) says "filled with the owner of the address"; does not say as typed (grep "as typed": no hit for this). |
| 23 | "the messages for refusing an owner and for "Keep for this owner" when the browser will not save" | OPEN-SPEC | Strings in src/token.ts:20-24 (`OWNER_REFUSED`, `NOT_MOVED`). Neither string is in SPEC (grep "Enter the owner", "was not moved": no hits). SPEC 3.12 line ~2785 mentions "3.8's message" for the owner refusal without giving it. |
| 24 | ""Use" without Remember removes only this tab's own saved copy" | OPEN-SPEC | Code src/token.ts `use` (`wasSaved` then delete). SPEC 3.8 (lines 1704-1722, 1771) says a "Use"d token replaces one held; nothing on the saved copy. |
| 25 | "Forget for one owner also drops another owner's running load" | OPEN-SPEC | Code src/main.ts:1107-1112 `forgetResultsFor` does `latestLoad += 1` for any owner. SPEC 3.8 "Forget, per owner" (line 1835) says it "counts as a newer load" but not that this includes another owner's load. Whether it should be so is not questioned in the entry; only the statement is missing. |
| 26 | "the 401 message after the token was already replaced" | DECISION | src/github.ts:218 always says "It has been forgotten"; src/main.ts:840 comment: "the message is 3.8's as the spec reads (PBI-1.10)". Choice: a different message when the refused token was replaced, or accept the wording. Not recorded. |
| 27 | "an upper-case stored owner is lower-cased" | OPEN-SPEC | src/token.ts `clean` uses `parseOwner` (lower-cases). SPEC 3.8 startup bullet (line 1765-1770) says entries breaking the owner rule are dropped; lower-casing not stated. Test e2e/token.e2e.ts:920 uses a stored `ACME`. |
| 28 | "a value without `"forgot"` is removed" | FIXED | src/token.ts:116-117 (`Array.isArray(forgot)` else null, key removed); test src/token.test.ts:345 (`'{"tokens":{}}'`). SPEC line 1765-1767 says "`forgot` not a list" is removed (a missing one is read as not a list; not spelled out). |
| 29 | "the 3.9 test fixture `umbrella-cross`" | OPEN-SPEC | Fixture exists (e2e/fixtures/umbrella-cross, used e2e/umbrella.e2e.ts:35); SPEC has no mention (grep). |
| 30 | ""Forget all" leaves the old `vizi.githubToken` key and its migration line (a spec decision, Clead's)" | DECISION | src/token.ts `forgetAll` removes only `TOKENS_KEY`. SPEC 3.12 line ~2829 says "as today it leaves the old key and its block". Choice: keep, or make Forget all also remove the old key. Documented only as "as today". |
| 31 | ""Forget all" with nothing saved does not reach another tab's page-only tokens" | DECISION | src/token.ts `forgetAll`: `removeItem` on an absent key raises no `storage` event. Not in SPEC (grep). Choice: accept and document, or make Forget all raise an event when nothing is saved. |
| 32 | ""Keep for this owner", when the browser will not save, drops that owner's existing token" | DECISION | src/token.ts `keepMigrated` (~line 270): `use()` replaces the held entry, then `held.delete(name)` on failure. SPEC says only that the token stays under the old key. Choice: restore the owner's previous token, or accept. |
| 33 | "keep a Playwright trace on failure in CI" | OPEN-CODE | playwright.config.ts has no `trace` setting; .github/workflows/ci.yml:51-57 uploads only `playwright-report/`. CI/config only, not user-visible. |
| 34 | "`e2e/csp.e2e.ts` lines 98 and 110 check for no violations with a single read" | OPEN-CODE | Mapped by content: now e2e/csp.e2e.ts:106 and :126 (same single `expect(await violations()).toEqual([])`); the same pattern at 177, 211, 237, 292, 322, 357. Only :422 polls. |
| 35 | "`e2e/token.e2e.ts` around line 826 uses a fixed 300 ms wait" | OPEN-CODE | e2e/token.e2e.ts:928 (`setTimeout(resolve, 300)`); also 200 ms at :662 and :1165. |
| 36 | "SPEC 3.8's test line "its 404 names the owner" is out of date since 3.11" | OPEN-SPEC | SPEC line 2023 still reads "...carries none and its 404 names the owner". 3.1/3.8 now say the 404 message is 3.1's. |
| 37 | "3.1's branch message could say "#, % or ?"" | DECISION | src/github.ts:56 message is "...its name holds # or %."; SPEC line 678 notes a decoded `?` gets the same message. Choice: change the wording (user-visible, needs test change) or leave. |
| 38 | "3.1's list of old-message tests missed `e2e/page.e2e.ts:162`" | FIXED | The list (SPEC 686-693) is a historic build instruction. "Enter a public repo address" no longer occurs in src/ or e2e/ (grep), so no test still asserts the old message. Moot. |
| 39 | "3.1 lets an owner hold dots, so `gist.github.com/acme` is read as owner `gist.github.com`" | DECISION | src/github.ts:106 uses `isName` for the owner (dots allowed). Three-segment `gist.github.com/acme/widgets` is refused (src/github.test.ts:87, e2e/repofield.e2e.ts:190), but two-segment `gist.github.com/acme` reads as owner/repo. Whether GitHub owners may hold dots was not checked; SPEC section 4 item 18 is related but not this. Choice: forbid dots in owners or accept. |
| 40 | "decoded branches may hold names git refuses (`..`, a newline), harmless" | DECISION | src/github.ts:107-114 only rejects `#`, `%`, `?`. Choice: close as accepted. Not otherwise checked. |
| 41 | "an umbrella pointer whose repo ends in `.git` gets the clone message on "Open in vizi", which 3.9 does not mention" | OPEN-SPEC | Code path: pointer regex allows `.git`; load goes through `readRepository`, which refuses (src/github.ts:105). SPEC 3.9 has no `.git`/clone mention (grep: only 3.1 lines 650, 680). Not run. |
| 42 | "SPEC 3.10 says only the script hash changes, while the style hash changes too" | OPEN-SPEC | SPEC line 2284-2285 ("only the hash of the inline script changes with the build"). Same wording at line 2151 (3.9) and 5036 (3.16), not checked whether those builds change the style. |
| 43 | "no test drives a Forget from another tab while the help view is open" | OPEN-CODE | e2e/help.e2e.ts has no second page/context or storage event (grep). |
| 44 | "`src/markdown.test.ts:389` ... a 1500 ms wall-clock limit" | OPEN-CODE | Now src/markdown.test.ts:385 `expect(Date.now() - start).toBeLessThan(1500)`; still wall clock. |
| 45 | "the 3.12 list of help-view changes could name the new `h2`" | FIXED | SPEC 3.12 "Changes to the help view at the PBI-1.16 build", item 5 (lines ~3290-3293) names the panel's `h2` and the "Add a token" `h3`. |
| 46 | "on a phone, a token row's "Forget" stretches to its grid column's width" | OPEN-CODE | src/style.css:1023-1031 (phone rule): `justify-self: end` is on `.token-text` only; `#token-list button` (1038-1043) has none, so the grid cell stretches it. The 125 px / 76 px sizes not measured (nothing rendered). Visual change. |
| 47 | "the header is 75 px high against the board's 70 px" | UNCLEAR | Needs rendering at 375 px. CSS: src/style.css:949-967 (padding 18 px 20 px; h1 22 px; help 44 px min-height). SPEC "Phone" (line ~3127) gives no height. I did not render the page. |
| 48 | "the phone differences that come from 3.12's text ... could be listed in 3.12" | OPEN-SPEC | "Differences from the mockup" (SPEC 3198-3262) lists none of the three (guide toggle box, "Forget all tokens" on a phone, 44 px help control). Partly in "Phone" (3125-3146): the help control is listed without the 44 px. |
| 49 | "no test checks the branch picker's contrast in light and dark" | OPEN-CODE | Contrast test is e2e/start.e2e.ts:439 (start page). No contrast check of `#branch-select`, `#branch-label`, `#branch-open`, `#branch-message` anywhere in e2e/ (grep). |
| 50 | "`hideResults` leaves `aria-busy` on the picker and "Open branch" disabled" | OPEN-CODE | src/main.ts:735-750 `hideResults` does not clear `aria-busy` on `#branch-picker` or enable `#branch-open`; `renderPicker` (788-791) sets them. Tidiness only. |
| 51 | "3.13 notes: "Errors" could state the code's reading of 3.8's "a Forget counts as a newer load"" | OPEN-SPEC | SPEC 3.13 Errors (last bullet, ~line 3660) says "after a Forget of the token it carried". Code src/main.ts:820-825 `tokenForgotten` only for the token it carried. 3.8 says a Forget counts as a newer load for all; the two are not reconciled in text. |
| 52 | "a 401 on the list after the token was replaced meanwhile ... shows "It has been forgotten"" | DECISION | Same as 26, here for the picker (src/main.ts:833-841) and `openRef` (:915-918, shows `result.message`). |
| 53 | "while the list loads, the current branch's option has no " (default)" mark" | DECISION | src/main.ts:773-775 passes `null` as default while reading; SPEC 3.13 "The options" says the default is marked "when the page knows it" and "the select holds the current branch only" while loading. Choice: which applies. |
| 54 | "a default branch past the cap is not added" | DECISION | src/branches.ts:92-93: default added only if among the names. SPEC silent for past the cap. Choice: add it or leave. |
| 55 | "a name both default and disabled gets " (default) (cannot be opened in vizi)", an order 3.13 does not set" | OPEN-SPEC | src/branches.ts:99-102 produces that order; SPEC 3.13 sets neither order. No unit test for the combined label (src/branches.test.ts:136-158 checked). Record the code's order or choose another (small choice for Clead). |
| 56 | "the arrow-key test does not check whether Chromium fires `change` per key" | OPEN-CODE | e2e/branches.e2e.ts:248-264 asserts no requests and unchanged heading; no `change` event count. |
| 57 | "3.1's request-order tests text does not mention the branch list after the load's requests" | UNCLEAR | I could not tell which 3.1 test text is meant. SPEC 3.1 line ~530 now mentions the branch list after a load; 3.16 tests (line ~5106) name "then 3.13's branch list". |
| 58 | "the "without a PROJECTS.md" browser test ... also assert that `#panel-umbrella` is hidden" | OPEN-CODE | e2e/umbrella.e2e.ts:404-415 asserts only `help(page)` `toBeHidden()`. |
| 59 | "the order check in `src/help.test.ts` passes vacuously" | OPEN-CODE | src/help.test.ts:298 `toBeGreaterThan(text.indexOf(...))` with no `>= 0` check on the earlier sentence. |
| 60 | "the contrast helper in `e2e/umbrella.e2e.ts` falls back to `<html>`'s background" | OPEN-CODE | e2e/umbrella.e2e.ts:386 starts `bg` from `<html>` colour without testing alpha. |
| 61 | "the fixed 200 ms wait before counting requests in `e2e/umbrella.e2e.ts`" | OPEN-CODE | e2e/umbrella.e2e.ts:358 (then `expect(stub.seen.length).toBe(before)`); other fixed waits at 534, 605, 687, 704, 725. |
| 62 | "3.10 step 4's "after the sentence on pointers" should name which of its two pointer sentences" | OPEN-SPEC | SPEC line 2363 still says "After the sentence on pointers". src/help.ts:179-191 puts the pre-project sentence after "A line `- owner/repo` points ..." and before "Each pointer is alone on its line". |
| 63 | "the blur exception is ambiguous after a repo is chosen in the owner's select" | FIXED | SPEC 3.1 lines 989-1010: select counts as showing the text only while the field holds the owner alone; otherwise a fresh read (#85). The Shift+Tab/Tab back case is not spelled out; it follows the same rule. |
| 64 | "the datalist rule does not say what happens when the text becomes not guided" | FIXED | SPEC 3.1 lines 983-986: a not-guided text counts as an owner change; datalist emptied (#85). |
| 65 | "the guide's browser tests have no case for a disabled `#` or `%` branch, or ... markup" | FIXED | e2e/guide.e2e.ts:1607-1620 (markup and `a#b`); `%` uses the same `cannotOpen` regex (src/branches.ts:77) but has no case of its own in that test. |
| 66 | "each "Open" ... first blurs the field, which spends one request 1 ... each Tab out ... two to four requests" | FIXED | SPEC 3.1 "The anonymous rate limit" (lines 956-967) states both costs. |
| 67 | "in vizi's `CLAUDE.md`, rule 7's line ... is 99 characters wide" | FIXED | CLAUDE.md is now 13 lines, none over 75 characters; the text is not in CLAUDE.md or RULES.md (grep). Moot. |
| 68 | "SPEC 3.9's bullet "The help view, at the PBI-1.18 build" still says 3.10 is not changed" | OPEN-SPEC | SPEC lines 2187-2188: "3.10 is not changed by this spec (PR #73 changes it now)". |
| 69 | "SPEC 3.10's line "3.10 is not changed by this spec: PR #45 is building it now"" | OPEN-SPEC | Line is now at SPEC 3265 (inside 3.12, "Changes to the help view at the PBI-1.16 build"). Still present. |
| 70 | "the non-blocking 3.9 and 3.10 wording points of the four reviews of #80" | UNCLEAR | Points not listed in the entry. I read the #80 review comments (gh api, read-only). Seen fixed: cross-reference now "What is decided", item 14, 21:01; 3.1 (SPEC 2145); no `aria-describedby` on the panel (2163). Not checked: the other ~10 (straight-quote wording, [sic] on "expalin" line 166 (not present), "under headings", the "(no heading)" P-rule citation, new ids, contrast pair, heading naming PBI-1.18, "a pointer is a pre-project" wording at 2190/2365). |
| 71 | "the tagline gap relies on Inter's space width" | DECISION | src/style.css:184-187 (6.5 px margin + the space; comment says 12 px). Choice: leave, or set the gap without relying on the font's space. Not measured. |
| 72 | "3.12 could name the migration Owner field's 14 px on a phone" | OPEN-SPEC | src/style.css:1054-1062 keeps `#owner-input`/`#token-input` at 15 px; the migration `#migrate-owner` gets 14 px from the panel rule (src/style.css:~498). SPEC "Phone" (3139-3144) names no size for it. |
| 73 | "switching browser tabs blurs the Repository field, so each switch ... starts the opening guide's read" | DECISION | SPEC 3.1 line 989 "Every blur of the field acts ... wherever the focus goes". Choice: accept (spec allows it) or ignore blurs caused by the tab losing visibility. |
| 74 | "the guide's browser tests use one token value for every owner" | OPEN-CODE | e2e/guide.e2e.ts:37 one `TOKEN`; only used at :231, 832, 1071. No two-token case. |
| 75 | "a 401 on a guide read counts as a newer load and drops a running load of any owner" | OPEN-SPEC | src/main.ts:1657-1671 `guideRefused` -> `forgetResultsFor` -> `latestLoad += 1`. Same rule as point 25; SPEC 3.1 "Edge cases" 401 bullet (~line 1130) does not state it. Whether it should be so is a choice (see 25). |
| 76 | "the kept-list code has no rejection handler" | OPEN-CODE | src/guide.ts `createOwnerLists.read` (~345-358) `.then(...)` with no catch; `running` is not cleared on rejection. src/main.ts:1713 and 1724 `.then` with no catch. `guardFetcher` (guide.ts:330-335) does reject when abandoned. |
| 77 | "no unit test fails if `encodeURIComponent` is removed from `contents()`" | OPEN-CODE | src/github.ts:296. Tests only use paths with no characters to encode (src/github.test.ts:424-428, 1132-1150); the branch part is covered via `feat%2Fx` (:427). A direct `readRepoFile` unit test with a space in a path segment is missing. No e2e fixture needed (see 78). |
| 78 | "whether such a path can reach `contents()` through `readRepoFile` (3.9) was not checked" | FIXED | Answered by reading: paths reaching `contents()` are the fixed backlog/STATUS/PROJECTS paths (src/github.ts:376-396), include paths limited to `[A-Za-z0-9._/-]` (src/include.ts:19, 57) and `projects/<name>/STATUS.md` with `<name>` limited to `[A-Za-z0-9_.-]` (src/projects.ts:58, main.ts:937). None needs encoding. No code change; the answer can be recorded. |
| 79 | "the leading-`/` check in `resolveIncludePath` ... never changes the result" | OPEN-CODE | src/include.ts:57 `written.startsWith("/")`; line 59 `segments.includes("")` already gives `reason: "form"` for any leading `/`. Dead condition. No user-visible change, so no failing test possible; a code tidy-up. |

## Proposed pull requests

Behaviour-changing = needs a failing test first. All others are test, spec or tidy-up only.

| PR | Points | Files | Behaviour change? |
|---|---|---|---|
| A. Spec: 3.8 stale text and missing as-built statements | 9, 20, 22, 23, 24, 25, 27, 29, 36, 75 | docs/SPEC.md (3.8 lines 1680-1690, 1696, 1771, 1765, 1835, 2023; 3.9 test list; 3.1 Edge cases) | No |
| B. Spec: 3.9 / 3.10 / 3.12 / 3.13 stale or missing wording | 41, 42, 48, 51, 55, 62, 68, 69, 72 | docs/SPEC.md (2187, 2284, 2363, 3265, 3.12 Differences and Phone, 3.13 Errors/options, 3.9) | No (55 records the code's current order; if a different order is chosen it becomes code) |
| C. Rate-limit messages: 429 and secondary 403 | 5 | src/github.ts, src/github.test.ts, e2e/token.e2e.ts, docs/SPEC.md 3.8 Answers | Yes (message text needs approval) |
| D. Token e2e hardening | 3, 4, 35 | e2e/token.e2e.ts | No |
| E. CSP e2e polling | 34 | e2e/csp.e2e.ts | No |
| F. Umbrella / help test hardening | 43, 58, 59, 60, 61 | e2e/help.e2e.ts, e2e/umbrella.e2e.ts, src/help.test.ts | No |
| G. Branch picker tests and tidy-up (add the missing `%` branch case of point 65, which is marked FIXED above) | 49, 50, 56 | e2e/branches.e2e.ts (or a new contrast test), src/main.ts `hideResults` | No (50 is invisible) |
| H. Guide robustness | 74, 76 | e2e/guide.e2e.ts, src/guide.ts, src/main.ts | 76 no visible change normally; 74 test only |
| I. Small code/test items | 33, 44, 77, 79 | playwright.config.ts, src/markdown.test.ts, src/github.test.ts, src/include.ts | No |
| J. Phone row layout | 46 (and 47 once measured) | src/style.css, e2e/start.e2e.ts | Yes (visual) |
| K. Decisions for Adam / Clead, then small PRs each | 6, 7, 14, 26+52, 30, 31, 32, 37, 39, 40, 53, 54, 71, 73 | depends on the choice: src/main.ts, src/token.ts, src/github.ts, src/branches.ts, docs/SPEC.md | Mostly yes once decided |

Decision list (what the choice is):
- 6 Enter in the token field: keep as is or submit.
- 7 addCsp entity: accept or extend.
- 14, 40: accept `- .../x` and git-invalid decoded branches (close).
- 26 / 52: message when the refused token was already replaced.
- 30: should "Forget all" also remove the old key and its migration line.
- 31: "Forget all" with nothing saved: accept or make other tabs hear it.
- 32: failed "Keep for this owner": restore the owner's previous token or drop it.
- 37: add `?` to the branch message.
- 39: forbid dots in owner names.
- 53: "(default)" mark on the current branch while the list loads.
- 54: add the default branch when it is past the 300 cap.
- 71: tagline gap: keep font-dependent or set explicitly.
- 73: ignore blurs from switching browser tabs.

## Not checked
- No test, build, lint or browser run; nothing rendered (so 46's sizes, 47, all phone/contrast numbers are unverified).
- The unit test for point 1 (401 only if still current) was not opened line by line; only the code path was.
- Points 57 and 70: could not identify or only partly checked (see the table).
- Point 42: whether the style hash really changes in 3.10, 3.9 and 3.16 builds was not checked; the point states it.
- Point 41: not run; the pointer-to-load path was read, not exercised.
- Point 39: whether GitHub owner names can hold dots.
- SPEC lines I cite for 3.8 are from reading; a few are given as "~" where I did not grep the exact number.
- I used `gh api` read-only to read the PR descriptions and comments of #31, #35, #42 and #80, to identify points whose entry text is short. No other external call.
- No file of the repository was changed by the check.
