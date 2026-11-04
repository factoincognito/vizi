# Vizi - backlog visualizer — Next Session Planning

**Last Updated:** 2026-11-04
**Author:** Clead (Tech Owner)
**Purpose:** Staging area for reasoning, revised assumptions, and plan-adaptation thoughts that aren't yet mature enough to be a PBI, a decision, a strategy update, or a vision-doc change. Complements `docs/BACKLOG.md` — it does not replace it. Discrete, scoped, actionable work belongs in the backlog as a PBI, not here.

**The rule that keeps this useful, not a junk drawer:** every entry below must get a disposition each session it's touched — promoted to a PBI, a decision, or a formal doc update; re-affirmed as still-next; or deleted as resolved/obsolete. This file is read and triaged at the start of every session (see `CLAUDE.md` session-start routine). It is not a substitute for the backlog — it's where things live before they're ready to become backlog items.

---

## Current situation summary

Phase 1 (the first version) is built and live; follow-up items are
being built unattended. One question for the product owner is staged
below.

---

## What needs adapting

<!-- One entry per item, in this shape:

### 1. Short title — new

**Previous assumption:** what was believed before.
**Revised assessment:** what is believed now, and why.
**Impact on plan:** what this changes, if adopted.
**Action:** the next step and who takes it.
-->

### 1. Definition of done for Phase 1 — new, a question for the product owner

**Previous assumption:** none; `memory/project.md` leaves it as
"[Product Owner decides]".
**Revised assessment:** Clead's proposal, not decided: Phase 1 is done
when the page, built with `npm run build` and opened locally from
`dist/index.html`, shows the public template's `docs/BACKLOG.md` and
`STATUS.md`, from the template's GitHub URL (the local folder was
dropped on 2026-11-04, `docs/SPEC.md` "What is decided", item 9), as
the list, the board and the status, with documentation links and a
report of what it could not read; and CI `build` is green on `main`.
**Impact on plan:** sets when PBI-1.1 and PBI-1.2 together close the
phase; it adds no new PBI.
**Action:** Clead asks the product owner to accept, change or replace
this; once he decides, Clead writes it into `memory/project.md` and
removes this entry.

### 2. What the CI reviewer sees — a question for the product owner

**Previous assumption:** the CI reviewer (PO-68 pilot) gets the diff,
`memory/standards.md`, `docs/SPEC.md` and `CLAUDE.md`, as the pilot's brief
says.
**Revised assessment:** two gaps, found in the reviews of PR #68.
(a) `memory/standards.md` section 7 listed three inputs, without
`CLAUDE.md`, and the contract in `docs/ROUTINES.md` said the same; the
brief of 2026-11-04 adds `CLAUDE.md`. Resolved: both list four now, and the
CI reviewer is Crog in `CLAUDE.md`, rule 7.
(b) The Review Standard asks the reviewer to check the test coverage table
and the red run (section 4) and to judge each `Test-exempt:` reason. The
first two live in the PR description and the third in commit messages,
which the contract keeps from the reviewer as the author's reasoning. So
the CI reviewer lists them under "What I did not check" and cannot approve
on them. Clead's proposal, not decided: give it the two PR description
sections ("Test coverage narrative", "Red run") and the `Test-exempt:`
trailer lines, nothing else of the description or messages.
**Impact on plan:** (b) widens the contract (a WHAT); the script and
instructions change by a few lines.
**Action:** Clead asks the product owner to accept, change or reject (b);
until he decides the contract stays as it is.

### 3. Vite's code in the built page — new, answers SPEC open item 22

**Previous assumption:** SPEC "Known unknowns" item 22 left open whether the
built page holds code of Vite's own that needs an entry in
`THIRD-PARTY-NOTICES.md`, for the builder of PBI-1.16 to check.
**Revised assessment:** checked 2026-11-04 on `main` (`9560d78`) with
`npm run build`: yes. The built `dist/index.html` contains Vite's inlined
`modulepreload` polyfill (Vite is MIT, whose licence requires its notice to
go with copies of the code), and the live page carries no notice for it.
`THIRD-PARTY-NOTICES.md` exists since PR #68 (it lists the root
devDependencies at the top level, not their transitive dependencies, which
have not been checked licence by licence); the PBI-1.16 spec said it
would create the file.
**Impact on plan:** none on the order. The page is live on GitHub Pages now,
and the policy (rule 5, Merge and Release gates) asks for the notice to
reach the end user, so the entry and the footer link of PBI-1.16 should
cover the polyfill; the other fix is turning the polyfill off in
`vite.config.mts` (it changes the CSP hashes).
**Action:** Clead tells the PBI-1.16 builder (this entry is the pointer),
adds the Inter section to the existing file instead of creating it, and
reports the finding to the product owner.

### 4. Follow-ups of the CI reviewer pilot — new, small, none blocks the pilot

**Previous assumption:** the CI reviewer as merged in #68 needs nothing more.
**Revised assessment:** from the round 3 review of #68 and the first live
runs (non-blocking points, all Clead's call):
- The `realDeps` wiring test checks `fetch` and `query` only as functions;
  assert they are `globalThis.fetch` and the SDK's `query`.
- The real `appendSummary` (writes `GITHUB_STEP_SUMMARY`) and `log` are not
  exercised by a test; point `GITHUB_STEP_SUMMARY` at a temporary file.
- The SDK makes an extra small call on Haiku with the whole prompt as input
  (about 57,000 uncached input tokens, about $0.006 per review), which the
  script does not use; look for an option that turns it off.
- `hasVerdictFor` trusts any comment by the Actions bot that starts
  `Crog review:`; actions are pinned by major tag, as in `ci.yml`.
**Impact on plan:** none now.
**Action:** Clead does them in one small PR when the pilot is judged, or
drops them if the pilot ends.

---

## Items that do not change

(none yet)
