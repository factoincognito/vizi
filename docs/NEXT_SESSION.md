# Vizi - backlog visualizer — Next Session Planning

**Last Updated:** 2026-11-05
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
(b) The Review Standard asks every reviewer, the manual Crog agents
included, to check the test coverage table
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
- `ci.yml` has no `permissions` block, so its jobs, which run PR code, may
  hold a write token (the repository default was not readable from the
  session); give it `permissions: contents: read` in a PR of its own, and
  let the script log the URL of the comment it posted, so the merger can
  tie a comment to its run.
- `hasVerdictFor` trusts any comment by the Actions bot that starts
  `Crog review:` (rule 7 of `CLAUDE.md` says which comment counts, but the
  script's skip check is looser); the script could record the base SHA
  next to the head; actions are pinned by major tag, as in `ci.yml`.
**Impact on plan:** none now.
**Action:** Clead does them in one small PR when the pilot is judged, or
drops them if the pilot ends.

### 5. PBI-1.19 spec, parked after ten CI review rounds — new, for the product owner

**Previous assumption:** the guided-opening spec (#82) would settle in a
few rounds, as the other specs did on 2026-11-04.
**Revised assessment:** the CI Crog review asked for changes ten times
(heads `e98d14c` to `23ae1dc`) and approved once, at `17e4f85`, before
Clead asked for four more points. Author and reviewer agree on every
finding; each round finds one further edge case in the caching of the
repo and branch lists. Last verdict:
https://github.com/factoincognito/vizi/pull/82#issuecomment-6647253703.
Clead's proposed settlement for the two open points: keep a successful
request 1 on its own, so a later Open never repeats it; keep capped owner
lists with their cap flag; treat only failed later pages as not kept,
re-read on blur or Open, not on `/`.
**Impact on plan:** PBI-1.19 is not built in the unattended run of
2026-11-04; the rest of the run goes on without it (PBI-1.18, PBI-1.12,
PBI-1.10, PBI-1.6). #82 stays open.
**Action:** the product owner says whether to settle it as proposed (one
more push and review), to simplify the feature (for example no cache
beyond one page visit's owner list), or to wait until he has tried the
branch picker.

---

## Items that do not change

(none yet)
