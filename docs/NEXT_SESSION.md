# Vizi - backlog visualizer — Next Session Planning

**Last Updated:** 2026-11-07
**Author:** Clead (Tech Owner)
**Purpose:** Staging area for reasoning, revised assumptions, and plan-adaptation thoughts that aren't yet mature enough to be a PBI, a decision, a strategy update, or a vision-doc change. Complements `docs/BACKLOG.md` — it does not replace it. How it is read and kept: product-office Process P-1 § 4 (3), P-8 § 4 and P-9 § 1 (2).

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
brief of 2026-11-04 adds `CLAUDE.md`. Resolved: `memory/standards.md`
section 7 and `RULES.md` L § 3 (1) list the diff and the four documents now (the
`docs/ROUTINES.md` contract was removed at the PO-72 cutover), and the
CI reviewer is Crog in `RULES.md` L § 4 (until the PO-72 cutover,
`CLAUDE.md` rule 7).
(b) The Review Standard asks every reviewer, the manual Crog agents
included, to check the test coverage table
and the red run (section 4) and to judge each `Test-exempt:` reason. The
first two live in the PR description and the third in commit messages,
which the contract keeps from the reviewer as the author's reasoning. So
the CI reviewer lists them under "What I did not check" and cannot approve
on them. Clead's proposal, not decided: give it the two PR description
sections ("Test coverage narrative", "Red run") and the `Test-exempt:`
trailer lines, nothing else of the description or messages.
(c) Since the PO-72 cutover (#88), `CLAUDE.md` is a short entry point:
vizi's local rules are in `RULES.md`, and the global ones in the product
office's Rules, a private repository the CI reviewer cannot read. Decided by
the product owner, 2026-11-05 18:49 (product-office DECISIONS.md): `RULES.md`
is added to the documents the CI reviewer reads. Done in #89: `RULES.md`
L § 3 (1), `memory/standards.md` § 7, `REVIEW_DOCS` in
`.github/reviewer/review.mjs`, `.github/reviewer/instructions.md` (it checks
against `RULES.md` and lists what needs the global Rules under "What I did not
check") and `docs/ROUTINES.md` name it. That gives it the local rules; the
global Rules stay unreadable in CI. Under `RULES.md` L § 4 (2) and (7), a CI
`APPROVE` counted as Crog's review of a rules or process change
(product-office `RULES.md` § 28 (1)(b)), and the CI reviewer cannot check such
a change against the global Rules that govern it. Decided by the product
owner, 2026-11-05 18:34 (product-office DECISIONS.md): until the template
ships its public copy of the product office's `RULES.md`, a CI verdict counts
as Crog's review for vizi code and config only, and a rules or process change
gets a manual Opus Crog review (`RULES.md` L § 4 (11)). That decision accepts
the gap for code PRs: a CI review of vizi code checks it against `CLAUDE.md`,
`RULES.md`, `memory/standards.md` and `docs/SPEC.md` (`RULES.md` L § 3 (1)),
and the global Rules stay unchecked by the CI reviewer until the public copy
exists.
**Impact on plan:** (b) widens the contract (a WHAT); the script and
instructions change by a few lines.
**Action:** (b): Clead asks the product owner to accept, change or reject it;
until he decides, that part of the contract stays as it is. (c): none; done
in #89.

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
  `Crog review:` (`RULES.md` L § 4 (2) says which comment counts, but the
  script's skip check is looser); the script could record the base SHA
  next to the head; actions are pinned by major tag, as in `ci.yml`.
**Impact on plan:** none now.
- After #89 the CI review job reads the documents at the PR's recorded base
  commit. Open PR #85's recorded base, `11ec525`, predates #88 and has no
  `RULES.md`; if a new push to #85 keeps that base, the job fails with
  nothing posted, and `RULES.md` L § 4 (3) and (4) then call for a manual
  Crog review. Whether GitHub refreshes the base on a push was not checked.
**Action:** Clead does them in one small PR when the pilot is judged, or
drops them if the pilot ends.

### 5. The include keyword (PO-105) — intent approved; the build is next

**Previous assumption:** vizi reads one backlog file, the first of its three
paths found, and follows no reference in it (`docs/SPEC.md` 3.1, 3.4). Since
the product office moved its `DONE` entries to `BACKLOG-DONE.md`
(product-office #520), vizi shows none of them.
**Revised assessment:** the product owner asked on 2026-11-06 (12:38) for an
include keyword, and put it in the unattended batch (12:42; product-office
PO-105). The spec is `docs/SPEC.md` 3.15 (PR #93): the keyword
`<!-- vizi:include <path> -->`, a path relative to the backlog file in the
same repo and branch, backlog files only, one level, included entries on the
board and in the list naming their file, with rules I1 to I11 for
`docs/BACKLOG-FORMAT.md`, the requests, the report messages, the edge cases
and the acceptance criteria. Intent approval: Adam, 2026-11-07 01:05, in chat,
"Po-105 apyr", all seven points Clead put to him (Clead's five proposals and
the six questions they left open), each as proposed (product-office
`DECISIONS.md`, #576; `docs/SPEC.md` "What is decided", item 17; recorded as a
comment on PR #93).
**Impact on plan:** the build is the next step (product-office PO-105 step
3): tests first, through vizi's flow; in that build's PR,
`docs/BACKLOG-FORMAT.md` gains its section 6, and `docs/SPEC.md` 2.3, 3.1,
3.2, 3.5, 3.7 item 5, 3.8, section 4 item 3 and `RULES.md` L § 5 (1) change as
3.15, "What changes elsewhere at the build", sets out. The first use, after
the build: the product office adds the include line to its `BACKLOG.md`.
**Action:** Clead starts the build once #93 has its manual Crog review
(`RULES.md` L § 4 (11)) and has merged. The build PR changes `RULES.md` L § 5
(1), so it too gets a separate Crog agent's review and is not merged on a CI
verdict alone (L § 4 (11)). This entry is removed when the build merges.

---

## Items that do not change

(none yet)
