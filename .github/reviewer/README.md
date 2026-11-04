# CI reviewer (PO-68 pilot)

Crog's pull request review in GitHub Actions, as a script on the Claude Agent
SDK. Workflow: `.github/workflows/crog-review.yml`. How it fits the review
process: `docs/ROUTINES.md`, "CI review". Third-party material:
`THIRD-PARTY-NOTICES.md`.

It is installed in CI only (`npm ci --ignore-scripts --prefix .github/reviewer`)
and is not part of the built page or the root `package.json`.

## Files

- `review.mjs`: reads the diff of base...head from the GitHub API (pinned to the
  two SHAs) and three documents from the base commit, calls the model, posts one
  comment. The only GitHub calls: read the compare diff, list the PR's comments,
  post a comment.
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

## Prompt caching

The system prompt is `[instructions + CLAUDE.md + standards + SPEC, boundary
marker, PR number and SHAs]`; the diff is the user message. The fixed block is
the same for every review of the same base commit, so a second review within the
cache lifetime (5 minutes by default) reads it from the cache. The job summary
shows the cache read and cache write tokens of every run.

## Secrets and trust

- `ANTHROPIC_API_KEY` is the repository secret; the key `vizi-ci-review`
  expires 2026-12-04 (product-office PO-68). After that the job fails visibly
  and posts nothing.
- The model gets no tools and no settings files, and its process does not see the
  GitHub token.
- A pull request from a fork gets no secrets and the job is skipped for it. The
  workflow runs as it is in the pull request, so anyone who can push a branch
  here can change what runs with the key: that is the same trust as for any
  workflow in this repo.
