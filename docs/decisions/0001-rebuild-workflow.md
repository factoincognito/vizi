# ADR 0001 — Rebuilt AI-Assisted Development Workflow

- **Date:** 2026-06-27
- **Status:** Adopted 2026-06-28
- **Author:** Clead (Claude, acting as Tech Owner)
- **Supersedes:** current template scaffolding (`dump.sh`, `pr_dump.sh`,
  `TEAM_STRUCTURE.md`, `NEXT_SESSION.*`, et al.)
- **Vision:** a self-contained, self-documented, AI-workflow-guided repo —
  clone it and everything needed to run the workflow (human or agent)
  is inside it.

> This document is itself the first entry in the decision log it proposes.
> The *why* behind every retained control and every discarded workaround
> lives here so the workflow cannot silently re-accumulate scaffolding,
> and so no one removes a control without understanding the fence they
> are tearing down.

---

## 1. The Problem With What We Built

The current workflow works, but it is more complex than the problem requires.

Almost every piece of custom scaffolding — `dump.sh`, `pr_dump.sh`, the
`?i=1` convention, the hard-stop rule, the STOP-and-wait pattern, the
`NEXT_SESSION` files, the dump-and-paste startup ritual — exists for one
reason: Clead (Claude Chat) and Crog (Claude Code CLI) could not talk to
each other, and Clead had no GitHub access. Adam's clipboard was the only
channel between them.

That constraint no longer exists. The scaffolding that compensated for it
should not be carried forward.

A second problem: the workflow was discovered by running into walls. Every
rule and tool represents a problem that was hit, diagnosed, and patched.
The result works, but its complexity is proportional to the number of walls
hit, not to the complexity of the underlying problem. Starting over —
informed by what we learned, using tools that now exist — produces something
much smaller.

**One caveat carried into the rebuild:** "discovered by running into walls"
is not the same as "pointless." Some controls that look like scaffolding are
circuit breakers. We discard the *relay* mechanics but preserve the *safety*
functions they happened to carry (see §4 and the loop cap in §5).

---

## 2. The Collaboration Model (WHAT and HOW)

This section is the philosophical foundation of the workflow. The mechanics
in §5 are designed the way they are because of what is written here.

### The basic split

**The PO owns the WHAT.** Always. Everything the PO brings — at whatever
level of abstraction or technical depth — is the WHAT. It expresses what
he wants: outcomes, constraints, intent, and the definition of done.

**Clead owns the HOW.** Everything from the PO's expression to working
code is Clead's responsibility. The HOW includes architecture, spec detail,
implementation approach, and review. Clead fills this gap regardless of
how wide it is.

**The bridge is joint.** Translating WHAT into something precise enough
to build is shared work. Adam brings domain knowledge and intent; Clead
brings technical framing. Neither can do it alone. The balance point
shifts per PBI.

### The gap is multidimensional

The gap between Adam's WHAT and Clead's HOW is not a single linear
spectrum. It has at least three independent axes:

- **Domain knowledge** — how deeply the PO understands the problem space.
  High domain knowledge narrows the gap on what the system needs to do
  and why.
- **Process knowledge** — how well the PO understands what kinds of
  processes, workflows, and controls are appropriate for a given project
  type. A PO with strong process knowledge may specify "we need a review
  gate here" or "this doesn't need a formal spec" — and be right — without
  being technical at all. This is an independent axis from technical
  knowledge.
- **Technical knowledge** — how deeply the PO understands implementation,
  architecture, and tooling. This is the axis most commonly assumed to
  define the split, but it is only one of three.

The shape of the gap differs on each axis. Clead reads that shape and fills
it accordingly, rather than assuming a uniform gap.

### The PO's knowledge changes the gap, not the ownership

A technically experienced or process-strong PO may narrow the gap
significantly — sometimes bringing requirements that leave Clead very
little latitude. A PO may also push back on a proposed HOW as
over-engineered. Both of these are WHAT signals, not HOW incursions.

When Adam says "that's too much, we don't need that" — regardless of
whether he is speaking from domain, process, or technical knowledge —
that is a product constraint. Clead does not defend its architectural
choices against it on grounds of technical superiority. The PO's WHAT
is authoritative.

Conversely, a PO with deep knowledge who chooses to specify down to
implementation detail is still doing the WHAT: expressing what he
wants. Clead turning that into a buildable, reviewable, working system
is still the HOW.

### What this means for the spec gate

Adam's spec approval is not a check on technical correctness. It is a
confirmation that the spec correctly captures his intent. Clead is
responsible for technical correctness. Adam is responsible for intent.
These are different checks and together they cover the real failure modes.

### What this means for Clead's default posture

Clead does not assume it knows better than Adam on any axis without
evidence. The default is to fill the gap that exists, not the gap Clead
expects to find. When Adam pushes back — on architecture, on process,
on scope — Clead treats it as a WHAT signal and adapts.

---

## 3. What We Know Works (Keep)

Genuine process controls, not workarounds:

- **Role separation** — one agent implements, a structurally separate
  agent reviews. Different *inputs*, not just a different prompt.
- **TDD discipline** — red, green, refactor. Non-negotiable as a
  *practice*. (Note: enforced only as far as CI can see it — see §6.)
- **Branch protection + CI as the hard gate** — nothing merges without
  lint, format, tests, and coverage passing. Enforced at GitHub level.
- **Adam as sole merge authority** — the one genuine human control.
  A judgment point, not friction.
- **The Clead Review Standard** — threat-model statement, spec-compliance
  check, error-handling second pass, test-quality check, explicit list
  of what was *not* checked. Kept verbatim.
- **GitHub as single source of truth** — if it is not in the repo, it
  does not exist. This rule now governs memory too — see §4.
- **One task at a time** — complete, review, merge, then next. No
  accumulating unreviewed changes.
- **Spec precedes implementation** — a validated spec exists before
  Crog writes a line.

---

## 4. What We Know Doesn't Work (Discard)

| Discarded | Why it existed | What replaces it |
|-----------|----------------|------------------|
| `dump.sh` + paste startup | No persistent memory | Repo-committed memory files, auto-loaded |
| `pr_dump.sh` as the only diff path | Clead had no GitHub access | Direct GitHub fetch via connector |
| `?i=1` re-report convention | Tracked clipboard relay iterations | Gone with the relay |
| Hard-stop rule | Gated implementer on Adam | Direct Clead↔Crog via PR comments — loop cap retained as safety control (§5) |
| STOP-and-wait scaffolding | Same root cause | Same |
| Adam relaying fix prompts / verdicts | Pure relay, zero added value | Direct PR comments |
| Adam updating CHANGELOG | Automatable, no judgment | Crog post-merge step |
| Ten-page `TEAM_STRUCTURE.md` | Documented workarounds | One page of principles |
| Multiple `NEXT_SESSION` files | Memory problem | Repo-committed memory |

### The memory correction (load-bearing)

The original proposal moved Clead's persistent state into Cowork's local
memory. That breaks the self-contained vision and contradicts the
single-source-of-truth rule: a fresh clone, another person, or a headless
Routine would find Clead amnesiac.

**Correction:** memory files are repo files. `CLAUDE.md` and `/memory`
are committed to the repo. Cowork's working folder is the repo clone, so
it auto-loads them — but the canonical copy is always in Git.

**Corollary — do not store derivable state.** "Current PBI" is derived
from repo state (open PRs + `docs/BACKLOG.md`), not written into memory.
Memory holds only what cannot be derived: project description and goals,
the Review Standard (verbatim), key architectural decisions, and the
one-page role rules.

---

## 5. The New Team

Three roles. No role exists unless it does something another role cannot.

### Adam — Product Owner
- Owns the WHAT on all axes (see §2).
- Approves the spec — confirming intent, not technical correctness.
- Approves the merge. Always. Never automated.
- Overrides any decision.
- Handles escalations when the review loop cap is hit.

### Clead — Tech Owner / Reviewer (runs in Cowork)
- Owns the HOW — fills the gap from Adam's WHAT to working code,
  regardless of gap width.
- Maintains repo-committed memory: project description, Review Standard,
  key decisions, role rules.
- Produces or validates the spec before implementation.
- Reviews every PR as a structurally isolated invocation (see §7),
  fetching the diff via GitHub connector and posting verdict as PR comment.
- Posts fix prompts directly to the PR for Crog.
- Plans with Adam in Cowork chat; runs review loops via dedicated review
  Routine.
- Does not defend HOW decisions against Adam's WHAT signals.

### Crog — Implementer (runs in Claude Code / Routines)
- Receives task via PR comment from Clead (or Adam paste, transitional).
- Implements TDD-first: tests red, implementation green, refactor.
- Opens PR, posts `pr_done` comment.
- Picks up Clead's fix prompts from PR comments, implements, pushes.
- Updates `CHANGELOG.md` as the post-merge step.
- Never merges.

---

## 6. The New Workflow

### Session startup
Memory is committed to the repo (`CLAUDE.md` hot cache + `/memory`).
Cowork's working folder is the repo, so startup loads it automatically.
No dump file, no paste, no ritual. Canonical copy is always in Git.

### Cowork project setup (isolation + portability)
Each repo gets its own **Cowork project** — Cowork projects are
persistent, self-contained workspaces with their own files, instructions,
and project-scoped memory. This gives **isolation**: what Clead learns
working on one repo never bleeds into another.

But Cowork project memory lives **locally in the Cowork app**, not in
Git. Isolation is not portability. So the rule is:

1. **One Cowork project per repo.**
2. **Set the project's save location to the repo's working folder**
   (the Git clone).
3. **Commit the canonical memory** (`CLAUDE.md` + `/memory`) to that
   repo, so the repo — not the Cowork app — remains the single source
   of truth.

Result: Cowork projects provide *isolation*; the committed files provide
*portability* (a fresh clone, another machine, or a headless Routine
reproduces Clead's context). You want both — neither alone is sufficient.

Two cautions:
- **Project memory does not relax the reviewer-independence rule (§7).**
  A scoped project still auto-loads design-time context; review must run
  as a separate scoped invocation that loads only `{diff, SPEC.md,
  Review Standard}`.
- **If local project memory and committed memory diverge, Git wins.**
  Treat the Cowork project's local memory as a cache of the committed
  files, not a second source of truth.

### Orchestration: GitHub is the event bus, not Clead
A Cowork chat session cannot poll. GitHub Actions drives the loop,
consistent with the single-source-of-truth principle:

- PR opened → Action dispatches the review Routine.
- Review approved → Action notifies Adam.
- PR merged → Action triggers the changelog step.

The PR thread is the coordination log — auditable, persistent,
in-repo-adjacent, self-documenting.

### PBI execution loop

```
Adam picks next PBI
        ↓
Adam describes it to Clead in Cowork chat (one sentence to one paragraph)
        ↓
Clead bridges the gap (§2): elaborates spec, confirms intent with Adam
Adam approves the spec (intent gate, not technical gate)
        ↓
Clead fires Crog (Routines dispatch, or Adam pastes — transitional)
        ↓
Crog implements TDD-first, opens PR, posts pr_done comment
        ↓
GitHub Action dispatches the review Routine
        ↓
Review Routine loads ONLY {diff, spec, Review Standard} — runs standard
        ↓
Clead posts verdict as PR comment
        ↓
    [If changes needed]
    Clead posts fix prompt → Crog implements & pushes → re-review
    Loop until approved — capped at N cycles (default 3)
    If cap hit: ESCALATE to Adam
        ↓
    [If approved]
    Clead posts approval comment → Adam merges
        ↓
Crog updates CHANGELOG (merge-triggered)
        ↓
Next PBI
```

### Circuit breaker
An uncapped Clead↔Crog loop can ping-pong indefinitely and burn cost.
After N review cycles (default 3), the loop escalates to Adam instead
of continuing. This is a safety control requiring human judgment — not
relay work.

### Spec-author blind spot (named, not fully solved)
Clead writes the spec and reviews against it. A flawed spec passes
"compliance" invisibly. Mitigations: (a) Adam's intent approval is a
real gate — he confirms the spec captures his WHAT; (b) the Review
Standard includes a first-principles check — "does this actually solve
the PBI?" — distinct from "does it match the spec?" The risk is bounded
but not eliminated. Tracked as an open question.

### Honest touchpoint count
Steady-state target: two (describe PBI, approve merge).
Today, before Actions wiring and Routines secrets: realistically four
(describe PBI, fire Crog, trigger review, approve merge) plus escalations.
We do not claim two until the machinery exists.

### Transitional state
Until Anthropic adds secret injection to Routines: Clead produces a
`curl`, Adam substitutes the token and fires it. One paste, not a relay
loop. Documented in `docs/ROUTINES.md`.

---

## 7. What Replaces the Current Documentation

Everything lives in the repo.

| File | Purpose | Replaces |
|------|---------|----------|
| `CLAUDE.md` | Cold-start router — points to rules, spec, backlog, standard, memory | Current `CLAUDE.md` |
| `/memory/` | Clead's persistent context (committed) | `dump.sh` + `NEXT_SESSION.*` + most of `TEAM_STRUCTURE.md` |
| `docs/CROG_ONBOARDING.md` | Crog's rules: TDD, branch, PR flow, Review Standard — one page | Current `CROG_ONBOARDING.md` (minus workaround scaffolding) |
| `docs/SPEC.md` | Technical product specification | Current TPS |
| `docs/BACKLOG.md` | PBI list (source of current PBI) | `PRODUCT_BACKLOG.md` |
| `docs/decisions/` | ADR log — this document is `0001` | (new) |
| `docs/ROUTINES.md` | Transitional trigger + future Actions wiring | (existing) |
| `CHANGELOG.md` | Change history | Current `CHANGELOG.md` |

`CLAUDE.md` is a router, not a paragraph. A cold-start agent must be
able to find everything else from it.

**Removed:** `tools/dump.sh`, `tools/dump-wrapper.sh`,
`docs/TEAM_STRUCTURE.md`, `docs/CLEAD_ONBOARDING.md`,
`docs/NEXT_SESSION.md`. `tools/pr_dump.sh` retained as non-load-bearing
fallback for Chat-only sessions only.

---

## 8. The Reviewer Independence Problem

Solved structurally, not by convention.

The tension: session startup relies on auto-loading memory for continuity,
while review requires that design context not be loaded. The same mechanism
that gives continuity pollutes the reviewer.

"Same session + explicit context reset" is rejected — the context is still
in the window and will influence the review.

**Solution:** the review runs as a separate invocation whose only inputs
are `{diff, SPEC.md, Review Standard}`. A dedicated review Routine or
clean subagent that does not load the implementation conversation or
design-time memory. This is the one architectural constraint that must
be enforced. Everything else is tooling.

---

## 9. What This Is Not

- Not removing the review gate. Every PR still goes through Clead.
  The standard is unchanged.
- Not automating merge authority. Adam merges, always.
- Not urgent. The current workflow functions on all active projects.
  This applies to new projects and the template. Existing projects
  (`titan-comptracker`, `python-blackjack`, `fomo-f`) migrate only
  if Adam chooses.

---

## 10. Decisions Taken (2026-06-28)

Items 1–5 were adopted as recommended; the v2 repo is the realised result. Item 6 lists assumptions still being validated — see memory/decisions.md open questions.

1. **Rebuild vs. iterate** — *Recommend rebuild*, conditional on memory
   being repo-committed (§4). Iterating onto local memory would
   re-contradict the vision.
2. **Cowork as primary Clead surface** — *Recommend yes*, with the repo
   (not Cowork) holding canonical state.
3. **Reviewer independence implementation** — *Recommend a dedicated
   review Routine / clean subagent with scoped inputs.* Reject same-session
   context reset.
4. **Active-project migration** — *Recommend no forced migration*;
   age them out.
5. **Pilot scope** — *Recommend a new project*, used to prove the two
   unproven pieces: GitHub Actions trigger and review isolation.
6. **Assumptions to validate before committing** — confirm (a) the GitHub
   connector can write PR comments, not just fetch diffs; (b) timeline
   for Routines secret injection. Both are load-bearing for the autonomy
   claims.

---

## 11. One-Sentence Summary

We built a complex system to compensate for constraints that no longer
exist; the rebuild discards the compensation, keeps the principles,
roots the collaboration model in a multidimensional WHAT/HOW split where
Adam owns intent on all axes and Clead fills whatever gap that leaves,
moves all state into the repo so it is genuinely self-contained, and
drives the loop through GitHub events — so that, once the machinery is
wired, Adam describes the next PBI in one sentence and approves the merge,
and everything else is machine-driven.
