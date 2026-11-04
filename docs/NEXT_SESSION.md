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

### 2. What the CI reviewer cannot see — new, a question for the product owner

**Previous assumption:** the CI reviewer (PO-68 pilot) gets the diff,
`memory/standards.md`, `docs/SPEC.md` and `CLAUDE.md`, as the input
contract in `docs/ROUTINES.md` and the pilot's brief say.
**Revised assessment:** the Review Standard asks the reviewer to check the
test coverage table and the red run (section 4) and to judge each
`Test-exempt:` reason. The first two live in the PR description and the
third in commit messages, which the contract keeps from the reviewer as the
author's reasoning. So the CI reviewer lists them under "What I did not
check" and cannot approve on them. Clead's proposal, not decided: give it
the two PR description sections ("Test coverage narrative", "Red run") and the
`Test-exempt:` trailer lines, nothing else of the description or messages.
**Impact on plan:** widens the contract (a WHAT); the reviewer's script and
instructions change by a few lines.
**Action:** Clead asks the product owner to accept, change or reject; until he
decides the contract stays as it is.

### 3. Third-party inventory of vizi — new, found while recording the Agent SDK

**Previous assumption:** vizi ships only its own code.
**Revised assessment:** checked 2026-11-04 on `main` (`9560d78`) with
`npm run build`: the built `dist/index.html` contains Vite's inlined
`modulepreload` polyfill (Vite is MIT; the MIT licence requires its notice to
go with copies of the code), and the page carries no notice for it. The repo
had no `THIRD-PARTY-NOTICES.md` before PR #68, which lists the root
devDependencies at the top level only; the transitive dependencies of the root
`package-lock.json` have not been checked licence by licence.
**Impact on plan:** the policy (`policies/third-party-ip.md`, rule 5 and the
Merge and Release gates) asks for the notice to reach the end user before
vizi ships; the page is live on GitHub Pages now. A PBI (the fix is either
turning the polyfill off in `vite.config.mts`, which changes the CSP hashes,
or adding the notice to the page) plus a licence check of the root lockfile.
**Action:** Clead adds the PBI, placed where the product owner wants it in the
order, and reports the finding to the product owner.

---

## Items that do not change

(none yet)
