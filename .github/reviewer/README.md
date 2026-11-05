# CI reviewer (PO-68 pilot)

Crog's pull request review in GitHub Actions, as a script on the Claude Agent
SDK. Workflow: `.github/workflows/crog-review.yml`. How it fits the review
process: `docs/ROUTINES.md`, "CI review". Third-party material:
`THIRD-PARTY-NOTICES.md`.

It is installed in CI only (`npm ci --ignore-scripts --prefix .github/reviewer`)
and is not part of the built page or the root `package.json`.

## Files

- `review.mjs`: reads the changed files and the diff of base...head from the
  GitHub API (pinned to the two SHAs) and four documents from the base commit
  (`REVIEW_DOCS`: `CLAUDE.md`, `RULES.md`, `memory/standards.md`, `docs/SPEC.md`),
  calls the model, posts one comment. The only GitHub calls: read the compare
  (its file list, then its diff), list the PR's comments, post a comment. A
  document missing on the base commit (a PR based on a commit before `RULES.md`
  existed) fails the job before the model is called, and nothing is posted:
  a head the workflow did not review (`RULES.md` L § 4 (3) and (4)).
- `instructions.md`: the reviewer's fixed instructions (first in the cached
  prompt).
- `test/`: `node --test`; the SDK and GitHub are faked, so no key and no cost.
  `npm test --prefix .github/reviewer`.

## Settings (environment, all optional)

| Variable | Default | Meaning |
|---|---|---|
| `REVIEW_MODEL` | `claude-opus-5-5` | The model. Opus is the rule for reviews until the product owner decides otherwise. |
| `REVIEW_MAX_TURNS` | 3 | Turn cap per run. |
| `REVIEW_MAX_BUDGET_USD` | 3 | The SDK stops the run past this estimated cost. |
| `REVIEW_MAX_DIFF_BYTES` | 300000 | Over this, the comment says "Not reviewed" and the model is not called. |

## Skipped pull requests

A pull request whose changed files are all review-free (`docs/BACKLOG.md`,
`CHANGELOG.md`, `STATUS.md`, `docs/NEXT_SESSION.md`; exact paths, `REVIEW_FREE_FILES`
in `review.mjs`) is not reviewed: no model call, no comment, and the job
summary says "skipped" and names the files. The check runs on every event from
the compare's file list of base...head, counting the old and the new path of a
rename, so a later push that adds any other file is reviewed on that push. A
compare with no files, or with 300 files or more (GitHub may cut the list
there), is not skipped.

## Prompt caching

The system prompt is `[instructions + CLAUDE.md + RULES.md + standards + SPEC,
boundary marker, PR number and SHAs]`; the diff is the user message. The fixed block is
the same for every review of the same base commit, so a second review within the
cache lifetime reads it from the cache. The lifetime is 1 hour: `review.mjs`
passes `settings: { promptCacheTtl: "1h" }` to the SDK (its `--settings` layer,
which `settingSources: []` does not turn off). Without it an API key gets 5
minutes. `CLAUDE_CODE_PROMPT_CACHE_TTL` would override it, and is not passed to
the SDK's process. The SDK's documentation says 1-hour cache writes are billed at
a higher rate. The job summary shows the cache read and cache write tokens of
every run, and the 1-hour part of the writes (`cacheCreationEphemeral1hInputTokens`,
also in the log's `usage:` line).

## Secrets and trust

- `ANTHROPIC_API_KEY` is the repository secret. The key expires; after that, or
  when the monthly credits are used up, the job fails visibly and posts nothing.
  The product office tracks the key and the spend (product-office PO-68).
- The model gets no tools and no settings files, and its process does not see the
  GitHub token.
- A pull request from a fork gets no secrets and the job is skipped for it. The
  workflow runs as it is in the pull request, so anyone who can push a branch
  here can change what runs with the key: that is the same trust as for any
  workflow in this repo.
