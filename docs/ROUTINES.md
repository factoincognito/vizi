# Routines and Trigger Wiring

*Scope note: this document describes how reviews are triggered in this
repository. Which changes need which review: product-office `RULES.md`
§ 28; the review inputs and the CI reviewer's rules: `RULES.md` L § 3
and L § 4.*

## Workflows that comment

- `review.yml` only posts a `<!-- clead-review-ready -->` marker comment
  on PRs that touch `src/`, and nothing reads it.
- `changelog.yml` posts a reminder on every merge to open a CHANGELOG
  PR, except for a PR that already changed `CHANGELOG.md`.

Clead cannot reach a Crog session running in Adam's VS Code (tested
2026-09-30 with Remote Control from a cloud Clead session: not
reachable).

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
- Skip (product owner, 2026-11-04 23:02, product-office `DECISIONS.md`): a PR
  whose changed files are all ones the change model gives no review gate
  (`docs/BACKLOG.md`, `CHANGELOG.md`, `STATUS.md`, `docs/NEXT_SESSION.md`,
  exact paths) is not reviewed: no model call, no comment, the job succeeds and
  its summary says "skipped". The script decides from the compare's file list
  of base...head on every event (old and new path of a rename both count), not
  from a workflow paths filter, so a later push that adds any other file is
  reviewed on that push. An empty compare, or one of 300 files or more, is not
  skipped.
- Guards: at most 3 turns and a budget cap per run, a diff cap (over it the
  comment says "Not reviewed" and the model is not called), prompt caching
  (fixed instructions and documents first, the diff last), and the token use,
  cache fields included, in the job summary.
- Cache lifetime (same decision): 1 hour, not the 5 minutes an API key gets by
  default, so reviews 10 to 15 minutes apart read the cache. Set with the SDK
  option `settings: { promptCacheTtl: "1h" }`. The 1-hour writes show as
  `cacheCreationEphemeral1hInputTokens` in the log's `usage:` line and as their
  own column in the job summary.
- Permissions: `contents: read` and `pull-requests: write`. The job never
  merges, approves through GitHub's review API or pushes; merging stays with
  the sessions.
- Whether this verdict counts as Crog's required review is set in
  `RULES.md` L § 4, not here.
- Known limit: the script and `instructions.md` come from the PR's own
  checkout (only the three documents come from the base commit), so a PR
  that changes `.github/reviewer/**` or the workflow is reviewed by its own
  changed reviewer. Such a PR needs a review outside CI.
- A verdict is keyed on the head only: an `edited` event that moves the PR to
  another base branch does not get a new review of the same head.
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
