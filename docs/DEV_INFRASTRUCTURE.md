# Development Infrastructure

How vizi is set up, built and checked: a new machine, the starting
files, branch protection, CI, and the web pack. The rules are
product-office Process P-11 and the pack's
`languages/web/code-standards.md`; this file keeps the steps and the
facts of this repository.

---

## Part 1: The repository

### 1. New machine setup

The steps are product-office Process P-11 § 4 (1). In vizi, the
language pack's runtime is Node.js 24 (Part 2), the recommended
extensions are in `.vscode/extensions.json`, from the pack, and the
pack's "First-time setup" and its full CI command list are in
`languages/web/code-standards.md`.

No git line-ending settings are needed on any OS: `.gitattributes`
handles it (section 2).

### 2. Starting files

Both of these shipped with the project from the bootstrapper.

**`.gitattributes`** at the repo root sets `* text=auto eol=lf`: LF line
endings in the repo and in every checkout, on every OS. Why: in an
earlier project, an editor set to "auto" line endings silently rewrote
whole files between LF and CRLF when edits made on Windows and
elsewhere touched the same file. It happened three separate times on
one pull request, and the fix came only after the damage.

**`docs/NEXT_SESSION.md`** is the staging file (product-office Process
P-9 § 1 (2)), read and triaged at session start (Process P-1 § 4 (3)).
Why it ships wired into session start: in an earlier project the same
kind of file was added mid-project, never wired into the session start,
and went unread for nearly a month.

### 3. Branch protection runbook

**What it enforces:** product-office Process P-11 § 3 (1). The pull
request needs no approvals because every PR is opened under the owner's
own GitHub account, and GitHub does not let authors approve their own
PRs; review happens as a verdict comment instead. vizi is public, so
protection is available on GitHub's free plan.

**Turning it on.** The setup script, `bootstrap-project.sh`, protects
`main` right after it creates the project, and adds `build` as a
required check once the setup pull request's `build` has passed. It
then reads the protection back and reports it. For a project set up
without the script, or whose protection was changed by hand, the
fallback is product-office Process P-11 § 3 (3), done by the repo
owner once, after the first push of the pack's `ci.yml`. In GitHub:
CI runs once first, because the required-checks picker only offers
checks that have run in the repo recently; the rule for `main` is
added under Settings, Branches; its settings are "Require a pull
request before merging" (required approvals 0), "Require status checks
to pass before merging" and "Do not allow bypassing the above
settings". The pack's `ci.yml` has one job, named `build`, so `build`
alone covers the required checks.

**Checking that it works:** product-office Process P-11 § 3 (2).

**Deleting merged branches.** Settings, General, Pull Requests: tick
"Automatically delete head branches", so GitHub deletes a PR's branch
when it is merged (product-office Process P-4 § 5 (2)).

### 4. CI

CI is GitHub Actions, `.github/workflows/ci.yml`; its rules are
product-office Process P-11 § 2.

- **The job is named `build`.** Branch protection requires a check by
  that name. Rename the job and every pull request waits for a `build`
  check that never arrives, until the required check is changed too.
- **The test-change check.** After the checkout, the first step of
  `build` runs `.github/scripts/require-test-change.sh` with the pack's
  patterns. The checkout needs `fetch-depth: 0` so the base branch is
  there to compare with. To run it locally, give it the base with
  `TEST_FIRST_BASE`; `languages/web/code-standards.md` has the full
  command.
- **Local commands.** `languages/web/code-standards.md` gives the
  commands to run the checks locally, in the order of `ci.yml`.

Deployment: product-office Process P-11 § 6.

---

## Part 2: The language pack

The pack's `code-standards.md` is the reference for its rules and
commands. It sits in `languages/web/`.

### Static web page (`web` pack)

Node.js 24, Biome, TypeScript strict mode and Jest with an 80% line
coverage gate, plus a Vite build into one self-contained HTML file and
Playwright browser tests. The first `npm install` creates
`package-lock.json`, which the project commits, because CI installs with
`npm ci`. Setup, commands and the optional Cloudflare deploy:
`languages/web/code-standards.md`.
