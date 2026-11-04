# Routines and Trigger Wiring

*Scope note: this document describes how reviews and Crog's work are triggered. Which changes need which review is in CLAUDE.md's "Change execution model" section.*

## Current state (2026-09-30)

1. The author opens the PR (Crog for code, Clead for docs, process and
   its own config changes).
2. Clead starts the review directly. No automation triggers it yet:
   `review.yml` only posts a `<!-- clead-review-ready -->` marker
   comment on PRs that touch `src/`, and nothing reads it.
3. The reviewer posts the verdict on the PR. Fix loop until approved,
   escalating to Adam after 3 rounds.
4. Crog merges once CI is green and the review has passed.
5. `changelog.yml` posts a reminder on every merge to open a CHANGELOG
   PR, except for a PR that already changed `CHANGELOG.md`.

Adam is not in this loop and never relays messages. How Clead reaches
Crog today: by starting Crog as a separate agent from its own session,
with only the diff and `memory/standards.md` as input. Clead cannot
reach a Crog session running in Adam's VS Code (tested 2026-09-30 with
Remote Control from a cloud Clead session: not reachable).

## CI review (PO-68 pilot, from PR #68)

`.github/workflows/crog-review.yml` runs Crog's review on a pull request that
is not a `[claim]` PR, not a draft and not from a fork, when it is opened,
gets a new head, is edited or leaves draft. It is a script on the Claude Agent
SDK (`.github/reviewer/`), not `anthropics/claude-code-action`, run with the
repository secret `ANTHROPIC_API_KEY` on Opus 5.5 and paid by the Console
organization's monthly API credits (product-office PO-68).

- Input: the diff of base...head, and `CLAUDE.md`, `memory/standards.md` and
  `docs/SPEC.md` as they are on the base commit. Nothing else: not the PR
  description, comments or commit messages, and no tools.
- Output: one comment that starts `Crog review: APPROVE` or
  `Crog review: CHANGES NEEDED` and ends `Head reviewed: <SHA>`. A head that
  already has such a comment from the Actions bot is not reviewed again.
- Guards: at most 3 turns and a budget cap per run, a diff cap (over it the
  comment says "Not reviewed" and the model is not called), prompt caching
  (fixed instructions and documents first, the diff last), and the token use,
  cache fields included, in the job summary.
- Permissions: `contents: read` and `pull-requests: write`. The job never
  merges, approves through GitHub's review API or pushes; merging stays with
  the sessions.
- Whether this verdict counts as Crog's required review is set in
  `CLAUDE.md`, not here.
- Known limit: the script and `instructions.md` come from the PR's own
  checkout (only the three documents come from the base commit), so a PR
  that changes `.github/reviewer/**` or the workflow is reviewed by its own
  changed reviewer. Such a PR needs a review outside CI.
- A run that fails after its model call (no verdict line, the budget cap)
  posts nothing, so the next `synchronize` or `edited` event runs it again,
  each up to the budget cap. Acceptable for the pilot; watch the spend.

## Target state

- PR opened: a workflow triggers Clead's review without Clead having to
  notice the PR.
- Clead's task comment on a PR triggers Crog from GitHub Actions, with
  Crog's token held as an Actions secret so it never appears in any
  Claude context.

Neither is built or tested yet.

## Review Routine — input contract (hard constraint)

The review Routine must receive **only**:
- The PR diff
- `docs/SPEC.md`
- `memory/standards.md`
- `CLAUDE.md` (added for the CI reviewer, PO-68 pilot, by the product owner's
  brief of 2026-11-04; `memory/standards.md` section 7 still lists three inputs
  and changes in the PR that makes the CI verdict count)

It must **not** receive:
- The implementation conversation history
- Design-time memory
- Any context from the session that produced the spec

This is a hard constraint. Reviewer independence is structural,
not conventional. Same-session context reset is not sufficient —
the context remains in the window and will influence the review.

## Crog prompt conventions

When Clead hands Crog a prompt, it is wrapped in a delimiter block:

    ========== CROG PROMPT HH:MM #N ==========
    <prompt text>
    ====================================

- **HH:MM** — 24h local time, freshly checked at write time (not
  reused from a prior prompt in the session).
- **#N** — a session-unique ID, starting at `#1` and incrementing by
  one for every subsequent Crog prompt in that same Clead session,
  regardless of which repo or PR the prompt concerns. Clead maintains
  this counter itself — it is not Adam's manual bookkeeping.
- **Purpose** — lets anyone refer back to a specific prompt
  unambiguously (e.g. "see CROG PROMPT 10:47 #1"). Since 2026-09-30
  Clead sends prompts to Crog itself; when Adam chooses to run a task
  in his own Crog tab, the delimiters show him exactly what to paste.
