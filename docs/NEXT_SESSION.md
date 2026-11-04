# Vizi - backlog visualizer — Next Session Planning

**Last Updated:** 2026-11-04
**Author:** Clead (Tech Owner)
**Purpose:** Staging area for reasoning, revised assumptions, and plan-adaptation thoughts that aren't yet mature enough to be a PBI, a decision, a strategy update, or a vision-doc change. Complements `docs/BACKLOG.md` — it does not replace it. Discrete, scoped, actionable work belongs in the backlog as a PBI, not here.

**The rule that keeps this useful, not a junk drawer:** every entry below must get a disposition each session it's touched — promoted to a PBI, a decision, or a formal doc update; re-affirmed as still-next; or deleted as resolved/obsolete. This file is read and triaged at the start of every session (see `CLAUDE.md` session-start routine). It is not a substitute for the backlog — it's where things live before they're ready to become backlog items.

---

## Current situation summary

Phase 1 (the first version) is in design: the spec is PR #3. One
question for the product owner is staged below.

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
the list, the board and the status, with documentation links and a report of what it could not read; and CI `build` is green on
`main`.
**Impact on plan:** sets when PBI-1.1 and PBI-1.2 together close the
phase; it adds no new PBI.
**Action:** Clead asks the product owner to accept, change or replace
this; once he decides, Clead writes it into `memory/project.md` and
removes this entry.

---

## Items that do not change

(none yet)
