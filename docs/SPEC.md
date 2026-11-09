# Vizi - backlog visualizer — Technical Specification

**Date:** 2026-11-04
**Status:** Intent approved by the product owner, 2026-11-04 (the summary
quoted below; recorded on PR #3). The paragraphs headed "As built
(PBI-1.2)" record what the page does, so spec and code agree.
**Owner:** Clead (technical correctness) / Adam (intent)

The backlog file format the parser reads is in `docs/BACKLOG-FORMAT.md`.

## What is decided, and what is Clead's design

**Decided by the product owner.** These decisions, and nothing else:

1. His decisions of 2026-11-03, listed in section 1 (also in
   `memory/project.md`), as changed by items 3, 4 and 9.
2. His intent approval of 2026-11-04, given in chat and recorded as a
   comment on PR #3: "I approve the intent of the vizi spec as
   summarised: inputs, board, list, status, documentation links, report
   tab, build and the web pack rule reading". The summary he approved:

   > inputs (a local project folder, or a public GitHub repo address;
   > the backlog file looked for as `BACKLOG.md`, `docs/BACKLOG.md`,
   > `docs/PRODUCT_BACKLOG.md`; `STATUS.md` read); a board with one
   > column per marker (NOW, NEXT, BLOCKED, LATER, IDEA, then DONE and
   > SUPERSEDED folded); a list under the backlog's own headings with a
   > marker filter and search; the four `STATUS.md` fields above the
   > board, blockers waiting on the product owner highlighted;
   > documentation links (README, `docs/`, file paths named in
   > entries); a report tab of what could not be read, with line
   > numbers; one self-contained page from the web pack, tests with
   > synthetic data and no network; the web pack's no-external-requests
   > rule read as covering what the page loads at startup, so fetching a
   > backlog after an address is typed is allowed.
3. His decision of 2026-11-04 (08:56, "apyr", on Clead's
   recommendation): vizi is published on GitHub Pages at
   `https://factoincognito.github.io/vizi/`, built and deployed by a
   workflow on every merge to `main` (PBI-1.7). It replaces "the first
   version is opened locally, not deployed" of 2026-11-03 (section 1).
   His intent approval of this spec change is recorded as a comment on
   PR #23.
4. His intent approval of 2026-11-04 (09:27, in chat, "saved token
   apyr") of PBI-1.8: private repos by address, with a fine-grained,
   read-only GitHub token, limited to chosen repos and with an expiry
   the product owner chooses, pasted into vizi once per browser, saved
   in the browser's storage behind a "Remember the token" box, removed
   with a "Forget the token" button, and sent only to GitHub. It
   replaces "no token; private repos are not read by address" of
   2026-11-03 (section 1). It is recorded as a comment on PR #26. How
   vizi does it is 3.8.
5. His decision of 2026-11-04 (10:22, in chat, "apyr", on Clead's
   recommendation; recorded in the product office's decision record,
   merge `b43c811`) on the defence for the shared origin (3.8, "The
   shared origin"): no repo named `factoincognito.github.io` is
   created, and GitHub Pages is switched on only for factoincognito
   repos he trusts. A domain of vizi's own stays the stronger option for
   later, if more sites go on factoincognito Pages.
6. His intent approval of 2026-11-04 (11:06, in chat) of PBI-1.9, the
   umbrella view: "I approve the intent of the vizi umbrella view as
   described: the Umbrella tab, the tree from PROJECTS.md, and the links
   per project". What was described: when vizi opens a project, from a
   folder or by address (a private one with the saved token; the folder
   is replaced by item 9), that has a
   `PROJECTS.md` at its root, an "Umbrella" tab shows the file's headings
   as a tree with the projects under them. A repo pointer
   (`owner/repo`) opens in vizi by its address (a private one needs the
   token to cover that repo) and also links to the repo on GitHub. A
   `projects/<name>/` pointer shows that folder's `STATUS.md` in vizi.
   The tree is drawn from the file each time; nothing is stored or
   copied. Each project's status in the tree itself is not included.
   The approval is recorded as a comment on PR #33. How vizi does it is
   3.9.
7. His intent approval of 2026-11-04 (11:57, in chat, "apyr") of
   PBI-1.11: vizi holds one token per owner (for example factoincognito
   and fomo-t), picked automatically by the owner in the address
   opened, the umbrella view's "Open in vizi" included; each token has
   its own "Remember" box and "Forget", plus a "Forget all"; otherwise
   as PBI-1.8 was approved (item 4): read-only, sent only to GitHub,
   never shown. His approval was "apyr", on Clead's proposal, whose
   reason (Clead's note, not the product owner's words) was that a
   fine-grained token belongs to one owner. It changes item 4's one
   token to one per owner. The approval is
   recorded as a comment on PR #40. How vizi does it is 3.8.
8. His intent approval of 2026-11-04 (12:43, in chat, "apyr", on Clead's
   proposal) of PBI-1.13, the help view (recorded as a comment on PR #44,
   and in the PBI-1.13 entry of `docs/BACKLOG.md`): a help view,
   "How to make your project vizi compatible", opened by a link on the
   start page inside the page; short steps with one example each for the
   backlog file's place, how an entry is written and which markers are
   shown, the `STATUS.md` headings, `PROJECTS.md` for an umbrella, and
   opening a private repo with a token or as a folder (the folder is
   replaced by item 9); a link at the end
   to `docs/BACKLOG-FORMAT.md` on GitHub; the text shipped in the page;
   a test that its examples read as stated. How vizi does it is 3.10;
   item 10 adds to it.
9. His decision of 2026-11-04 (15:15, in chat, "apyr"; recorded in the
   product office's `DECISIONS.md`, PR #390, and as PBI-1.14 in
   `docs/BACKLOG.md`): vizi no longer opens a local project folder. It
   opens projects from GitHub only: public ones by address, private ones
   with the saved token (3.8). It replaces point (4) of the decisions of
   2026-11-03 (section 1), "local files; local mode opens a project
   folder", and with it the folder in the inputs of item 2, in the
   umbrella view of item 6 and in the help view of item 8. What the
   code change must remove is in 3.11.
10. His decision of 2026-11-04 (16:13, in chat; recorded in the product
    office's `DECISIONS.md`, PR #393): the help view says early in its
    text that vizi is a read-only tool. It adds to item 8. How vizi does
    it is 3.10.
11. His intent approval of 2026-11-04 (15:48, in chat, "mockups are much
    better" and "go with it", on Clead's recommendation; recorded in the
    product office's `DECISIONS.md`) of PBI-1.16, the start page
    redesign, as shown in Clead's mockup (the Claude design canvas "vizi
    start page redesign", version 1793803575-d7d4): "Open a project from
    GitHub" with the address and Open on one row and the help link in
    the header; the line "Public repos open without a token. Private
    repos need a token for their owner. All access is read-only: vizi
    never changes anything on GitHub."; a folded "Private repos" panel
    with one row per owner (Remember and Forget each), a token saved by
    an earlier vizi as one highlighted row asking for its owner, "Add a
    token" and "Forget all tokens"; one font (Inter) everywhere, built
    into the page; light, dark and phone. With it, his decisions of the
    same day, recorded in the same file: next to the token fields, a
    step-by-step guide on how to make the read-only GitHub token (16:11);
    and, next to adding a token, that a saved token can be used in vizi
    by everyone with access to this browser, and that on a shared
    computer the token is better used only for the page, without saving
    it (16:17 to 16:18). PBI-1.17 is not part of it: his decision of
    17:07 (recorded in the same file, #399), one "Repository" field for
    `owner/repo`, which replaces his prefill decision of 16:36. How vizi
    does it is 3.12; the token behaviour of 3.8 does not change.
12. His intent approval of 2026-11-04 (15:15, in chat, "apyr", on
    Clead's recommendation, after his 15:14 "possibily broaden the
    possibility to load branches from repo"; recorded in the product
    office's `DECISIONS.md`, PR #390, and in the PBI-1.15 entry of
    `docs/BACKLOG.md`) of PBI-1.15, a branch picker: after a repo loads,
    a list of its branches, and picking one opens that branch; the
    `/tree/<branch>` address keeps working. How vizi does it is 3.13.
13. His intent approval of 2026-11-04 (11:59, in chat, "apyr", on
    Clead's recommendation, after his 11:58 request; recorded in the
    product office's `DECISIONS.md`, PR #386, and in the PBI-1.12 entry
    of `docs/BACKLOG.md`) of PBI-1.12, a "Saved repos" quick-access list
    on the start page: a "Save" button adds the open address, clicking
    an entry loads it (with the right token if private), an "×" removes
    it; kept in the browser, addresses only, never tokens; other
    factoincognito Pages sites (trusted, under the Pages rule) could
    read the repo names, not their contents. How vizi does it is 3.14.
14. His decision of 2026-11-04 (17:07, in chat, "Apyr", on Clead's
    recommendation, after his 17:04 "wouldn't it be better to just have
    a GitHub repo name field where the user puts <owner>/<reponame>";
    recorded in the product office's `DECISIONS.md`, PR #399, and as
    PBI-1.17 in `docs/BACKLOG.md`): the address field becomes one
    "Repository" field where the user types `owner/repo` (for example
    `fomo-t/fomo-f`); a full GitHub address pasted into it, with or
    without `/tree/<branch>`, still works, and the token is still picked
    by the owner. It replaces his decision of 16:36 to prefill
    `https://github.com/`. He put it in the unattended run of that night
    at 19:18 ("All"; recorded in the product office's `DECISIONS.md`,
    and in this repo's backlog and `docs/NEXT_SESSION.md` by PR #64),
    built after PBI-1.14 and before PBI-1.16. How vizi does it is 3.1,
    "The Repository field". His decision of 21:01 the same day
    (recorded in the product office's `DECISIONS.md`) adds to it: the
    field's hint reads `<owner>/<repo>`, not `owner/repo`, so it shows
    two parts to fill in, and so do the field's messages that show the
    form.
15. His decisions of 2026-11-04 (22:21, in chat, "add help text in the
    umbrella view to expalin what an umbrella is"; and 22:24, "also
    explain \"pre-projects\", i.e those projects that are in an early
    stage and therefore does not have a repo of their own but lives in
    the umbrella repo for now"; recorded in the product office's
    `DECISIONS.md`, PRs #430 and #432, and as PBI-1.18 in
    `docs/BACKLOG.md`): the umbrella view gets a help text that explains
    what an umbrella is, and what pre-projects are: projects at an early
    stage with no repo of their own yet, living in the umbrella repo for
    now (the `projects/<name>/` pointers). The wording is Clead's. How
    vizi does it is 3.9, "The help text (PBI-1.18)".
16. His decision of 2026-11-04 (22:47, in chat, "apyr. under the
    condition you don't flip out if i want to change it 5 minutes
    later", on Clead's recommendation, after his ideas of 22:28 to
    22:44; recorded in the product office's `DECISIONS.md`, PR #435,
    and as PBI-1.19 in `docs/BACKLOG.md`): guided opening from the
    Repository field, in that night's unattended run after PBI-1.15.
    One field takes `<owner>` or `<owner>/<repo>`; while typing after
    `<owner>/`, a list of that owner's repos (private ones the owner's
    token can see); when the field loses focus, an owner alone shows the
    repo list and a repo shows its branches with the repo's own default
    branch preselected; a pasted full address still opens directly. The
    picker of PBI-1.15 on a loaded project stays and its branch request
    is reused. Open to change after he tries it. Simplified by his
    decision of 2026-11-05 (07:41, in chat, "apyr" to Clead's
    recommendation of 07:35; recorded in the product office's
    `DECISIONS.md`, PR #444, and in PBI-1.19 in `docs/BACKLOG.md`): no
    caching of repo or branch lists beyond the owner's repo list for one
    page visit. How vizi does it is 3.1, "Guided opening".
17. His intent approval of 2026-11-07 (01:05, in chat, "Po-105 apyr",
    on Clead's proposals; recorded in the product office's
    `DECISIONS.md`, PR #576, and as a comment on PR #93) of the include
    keyword (product-office PO-105): a backlog file can name another file
    of the same repo and branch with `<!-- vizi:include <path> -->`, a
    path relative to it, and vizi reads that file too, one level only,
    only from the backlog file; included entries show on the board and in
    the list like the file's own, and only they name their file; they
    stand where the include line stands; a failed read of an included
    file lets the load go on (only a 401 fails it), and the page says
    what is missing; at most five included
    files a load; the help view does not change; and an include line is
    the one exception to "content never makes a request of its own" (2.3,
    3.7 item 5, `RULES.md` L § 5 (1)). How vizi does it is 3.15.
18. His intent approval of 2026-11-09 (15:41, in chat, "I approve the
    intent of the vizi ?repo= link spec as written, points 1 to 5", on
    Clead's proposal of 15:36 after his request of 15:34, the form left
    to Clead; recorded in the product office's `DECISIONS.md`, PR #696,
    and as PBI-1.35 in `docs/BACKLOG.md`): the repository to open can be
    given in the page's address as `?repo=<owner>/<repo>`, read exactly
    as the Repository field reads typed text; at startup the page puts
    the value in the field and opens it as if "Open" was pressed, an
    owner alone showing that owner's repo list; without it nothing
    changes; the page still writes no address of its own; other
    parameters are ignored, and of several `repo` parameters the first is
    used; the help view gets one line with the link form; a link can open
    a private repo with a token saved in that browser, with no new kind of
    request and no change to the Content-Security-Policy. How vizi does it
    is 3.16.

**Clead's design (the HOW), within the approved intent.** Everything else
in sections 2 and 3, and the rules in `docs/BACKLOG-FORMAT.md`. It is
Clead's call, not a question for the product owner, and it does not
block building. It changes through a reviewed PR like any spec change.
Points that come from the approved summary are marked **(approved)**.

**Not decided.** Marked "not decided" where they appear: a lint mode
beyond the page's report (section 1), and a change to the template's own
wording of the external-requests rule (section 4, item 8).

---

## 1. System overview

**Purpose (product owner):** a graphical representation of a project's
status, its work items, their state and description, with links to the
project's documentation.

**Decided by the product owner (2026-11-03; three points replaced on
2026-11-04):**

- vizi shows a project's backlog file as a backlog list and as a kanban
  board, with columns by marker (`NOW`, `NEXT`, `LATER` and so on). It
  only reads; the backlog file stays the only source of truth.
- It works for any project whose backlog is close enough to the
  template's format. It finds the backlog at `BACKLOG.md` (the project's
  root), `docs/BACKLOG.md` and `docs/PRODUCT_BACKLOG.md`.
- It reads a GitHub repo by its URL, and local files. Local mode opens
  a project folder, not a single file, so documentation links work for
  private projects.
  - 2026-11-03: public repos only, with no token; private repos are not
    read by URL.
  - Replaced on 2026-11-04: private repos too, with a fine-grained,
    read-only token the product owner saves in the browser (3.8;
    PBI-1.8); from PBI-1.11, one such token per owner, picked by the
    owner in the address (3.8).
  - Replaced on 2026-11-04 (15:15; item 9), the sentence above on
    local files and the folder: no local files and no folder. vizi
    opens projects from GitHub only, by address.
  - Added on 2026-11-04 (17:07; item 14): the address is typed into one
    "Repository" field as `owner/repo`, or pasted as the URL (3.1, "The
    Repository field"; PBI-1.17).
- A project's status is read from its `STATUS.md`.
- It is a generated web page, built with the template's web pack
  (`languages/web/`).
  - 2026-11-03: the first version is opened locally, not deployed;
    deployment comes later.
  - Replaced on 2026-11-04: vizi is published on GitHub Pages at
    `https://factoincognito.github.io/vizi/`, built and deployed by a
    workflow on every merge to `main` (2.2; PBI-1.7).
- The page reports what it could not read. There is no command-line lint
  for CI in the first version.
- A backlog format spec ships with it: `docs/BACKLOG-FORMAT.md`.
- Added on 2026-11-04: the umbrella view of a project with a
  `PROJECTS.md` (3.9; PBI-1.9).
- Added on 2026-11-04: a help view on how to make a project vizi
  compatible (3.10; PBI-1.13).
- Added on 2026-11-04: the start page redesign, with the Inter font
  built into the page and a guide to making the read-only token (3.12;
  PBI-1.16).
- Added on 2026-11-04: a branch picker on a loaded project (3.13;
  PBI-1.15).
- Added on 2026-11-04: a "Saved repos" quick-access list on the start
  page (3.14; PBI-1.12).
- Added on 2026-11-04: a help text in the umbrella view on what an
  umbrella and a pre-project are (3.9; PBI-1.18).
- Added on 2026-11-04: guided opening from the Repository field, with
  an owner's repo list and a repo's branches (3.1; PBI-1.19).
- Added on 2026-11-07: the include keyword, by which a backlog file
  names another file vizi reads too (3.15; product-office PO-105).
- Added on 2026-11-09: the repository to open given in the page's
  address, `?repo=<owner>/<repo>` (3.16; PBI-1.35).

Not decided: a lint mode beyond the page's report (Clead's suggestion,
which the product owner found worth considering). The parser is
tolerant by design: it reads what it can and reports the rest (3.5).

---

## 2. Architecture

Clead's design, within the approved intent.

### 2.1 Modules and data flow

```
 GitHub address ──> source (src/main.ts) ──> file texts
                                              │
          ┌───────────────────────────────────┼─────────────────────┐
          v                                   v                     v
 src/backlog.ts: parse(text)      src/status.ts: parse(text)   src/markdown.ts:
 -> entries, groups, report       -> fields, blockers, report  render(text) -> tree
          └───────────────────────────────────┼─────────────────────┘
                                              v
                    src/main.ts: board, list, status, documentation, report
```

- `src/backlog.ts`: a pure module. It takes a backlog file's text and
  returns the entries (marker, ID, notes, title, description, group,
  line), the groups in file order, and the report of what it could not
  read or read with a warning (3.5). The report is not a second pass: it
  is what the same parser skipped or guessed.
- `src/status.ts`: a pure module. It takes `STATUS.md`'s text and
  returns its fields, its blockers and what it could not read
  (`docs/BACKLOG-FORMAT.md`, section 4).
- `src/markdown.ts`: a pure module. It turns Markdown text into a tree
  of allowed nodes under the rendering contract (3.7). It returns data,
  not HTML.
- `src/guide.ts` (from PBI-1.19): a pure module for the opening guide of
  3.1 ("Guided opening"): how it reads the field, its requests' kinds,
  the parsing of its lists and its messages.
- `src/main.ts`: reads the files from GitHub and
  builds the page from the modules' results. It holds no parsing logic.

### 2.2 Build

**(approved)** One self-contained page from the web pack: TypeScript,
one `dist/index.html` (`npm run build`). The pure modules are tested
with Jest, test first; `src/main.ts` is covered by the Playwright tests
(`languages/web/code-standards.md`, "Web rules").

**(approved)** Test data is synthetic: every fixture is written for the
test. No fixture is copied from a real project's backlog or status file.
No test reaches the network (2.3).

**Published on GitHub Pages** (product owner, 2026-11-04; PBI-1.7,
workflow in PR #22, merged as `8054f14`). Clead's design for how:

- `.github/workflows/pages.yml` builds the page and deploys `dist/` to
  `https://factoincognito.github.io/vizi/` on every push to `main`
  (every merge), and when started by hand (`workflow_dispatch`). A run
  started by hand from another branch builds but does not deploy: the
  deploy job runs only for `refs/heads/main`.
- Its job `site` runs `npm ci` and `npm run build`, the scripts CI uses,
  with the same `checkout` and `setup-node` actions and Node.js 24, and
  uploads `dist/` with `upload-pages-artifact`. Its checkout sets
  `persist-credentials: false`, so the job's token is not kept in the
  checkout's git config. The job `deploy` runs after it and deploys
  with `deploy-pages` to the `github-pages` environment. Both Pages
  actions are GitHub's own, pinned to a major version.
- Permissions: `contents: read` for the workflow, which `site` keeps,
  as it sets no permissions of its own; `pages: write` and
  `id-token: write` for the `deploy` job only. One deploy runs at a
  time (concurrency group `pages`), and a running deploy is allowed to
  finish.
- It runs no tests. It relies on the required `build` check of
  `ci.yml` (lint, type check, unit tests, the browser tests): branch
  protection on `main` requires a pull request and a passing `build`
  check for every change, administrators included (checked 2026-11-04
  through the API).
- It has no `pull_request` trigger and no job named `build`, so it never
  touches the required `build` check of `ci.yml`.
- It publishes only once the repo's Pages source is set to "GitHub
  Actions", a setting only the product owner can change. Checked on
  2026-11-04 through the API: the first run (41800804007, 08:36 UTC),
  before the source was set, built in `site` and failed in `deploy`
  with GitHub's 404 "Ensure GitHub Pages has been enabled". The runs
  after the product owner set it (41801704611 and 41801782427, from
  08:43 UTC) succeeded, and `https://factoincognito.github.io/vizi/`
  answers 200 with the page.
- The site is served under `/vizi/`. The single file has no
  root-relative reference, so Vite's default `base` stays.
- The pack's Cloudflare `deploy.yml` stays in `languages/web/`, unused:
  it is not in `.github/workflows/` (checked at `0191768`).

**One origin for every factoincognito Pages site.** Every Pages site of
the factoincognito account is served from one origin,
`https://factoincognito.github.io`. To the browser they are one site:
they share that origin's storage (local storage, IndexedDB and the
like), and a script on any of them can open another one, `/vizi/`
included, and script into it. vizi holds GitHub tokens in the page's
memory and saves those the user asks it to remember in `localStorage`
(3.8; built in PBI-1.8, one token per owner from PBI-1.11); 3.8, "The
shared origin", sets out what that exposes. Before PBI-1.8 it held
nothing secret and stored nothing in the browser. From PBI-1.12 it also
stores the saved repos' names under `vizi.savedRepos`, which every site
on the origin can read and write (3.14, "The shared origin, and
tokens"); no token is ever in it.

### 2.3 The web pack's "no external requests" rule

The pack's standards say: "No CDN scripts, web fonts, images or other
external requests." Reading a GitHub URL is an external request. The
pack's browser test (`e2e/smoke.e2e.ts`) checks only what the page
requests while it loads, so a request made after the user enters a URL,
or opens the page with one in its address (3.16), passes it.

**(approved)** vizi reads the rule as covering what the page loads at
startup: fetching a backlog after an address is typed is allowed.
`languages/web/code-standards.md` in this repo says so.

Clead's design: the load check stays as it is. The only requests the
page ever makes are the GitHub requests of 3.1, after the user enters a
URL or opens the page with one in its address (3.16), and, from
PBI-1.15, the branch list of 3.13 after such a load, also
to `api.github.com`. From PBI-1.19 the opening guide of 3.1 ("Guided
opening") also reads an owner's repo list and a repo's branches, from
`api.github.com` only, while the user types in, leaves or submits the
Repository field, or opens the page with an owner alone in its address
(3.16), before or with the load. From PBI-1.34 a load also
reads, with one more request 3 each, the files its backlog file includes
(3.15), at most five, from the same repo and branch on the same two
hosts. The approved reading still holds: it covers what the page loads
at startup, and every such request follows something the user typed
or gave in the page's address (3.16), or is named by an include line of
the backlog file that load read
(3.15). Content the page shows never makes a request of its own (3.7);
include lines are the one exception, decided by the product owner on
2026-11-07 01:05 (3.15, decided point 7). The browser tests stub GitHub's answers with
Playwright routes, so no test reaches the network. Publishing on GitHub
Pages (2.2) does not change this reading: what the page loads at startup,
without a `repo` value in its address (3.16), is still only its own
document.

**Content-Security-Policy.** Clead's design.

- Before PBI-1.8 the page set none: GitHub Pages cannot send custom
  response headers, the single-file build inlines the page's script and
  style, and untrusted content is handled by the rendering contract
  (3.7).
- Since PBI-1.8 (built in PR #30) it sets one, because the page holds
  secrets, the tokens (3.8). It is a
  `<meta http-equiv="Content-Security-Policy">` tag in `<head>`, right
  after `<meta charset>` and before any script or style:

  ```
  default-src 'none'; script-src 'sha256-<script>';
  style-src 'sha256-<style>'; connect-src https://api.github.com
  https://raw.githubusercontent.com; img-src data:; font-src data:;
  base-uri 'none'; form-action 'none'
  ```

  `<script>` and `<style>` are the SHA-256 hashes of the page's one
  inline script and one inline style block. `'unsafe-inline'` is not
  used, `img-src data:` is for the inline favicon, and `font-src data:`
  (from PBI-1.16, 3.12) is for the Inter font inlined in the style
  block. As built (before PBI-1.16, without `font-src`): the
  build plugin `vizi:content-security-policy` in `vite.config.mts` runs
  after the single-file plugin (the same `post` stage, later in the
  list) and calls `addCsp` in `src/csp.ts`. That hashes the inlined
  script and style, with every line break read as LF, as the browser's
  parser reads them, and writes the tag. The build fails instead when
  the page has more or fewer than one inline script or one `<style>`
  block, a script with a `src`, a linked stylesheet, `modulepreload` or
  `preload`, a `style=` or `on…=` attribute, a policy already (written
  plainly), or no `<meta charset>` before the script and style. So the
  hashes cover everything the page runs, and nothing else.
- What it adds: no script other than the build's own runs, and a
  script that did run could send data by `fetch` and the like only to
  GitHub's two hosts. From PBI-1.16 a font loads only from a `data:` URL;
  since only the build's own style runs, only the build's fonts can
  (3.12, "The font").
- What it does not close:
  - sending the token out through GitHub itself: a script that has
    broken 3.7 can call `api.github.com` with credentials of its own and
    put the token in, say, a gist or an issue comment. The policy
    narrows the ways out; it does not shut them;
  - navigating away with data in the address;
  - anything from the shared origin (3.8, "The shared origin"): other
    factoincognito Pages sites reading storage or scripting into vizi,
    and a root site's service worker, which can rewrite the page and
    its policy;
  - `frame-ancestors` and reporting, which a `<meta>` policy cannot set.

  3.7 stays the first protection.

---

## 3. Component specs

Clead's design, within the approved intent. Points from the approved
summary are marked **(approved)**. Each "As built (PBI-1.2)" paragraph
is Clead's design too: it records how the page, merged in PR #9, reads
the points the text above it leaves open.

### 3.1 Inputs

- **(approved)** A public GitHub repo address (a local project folder
  was approved too, and is replaced by item 9 of "What is decided").
  The backlog file is looked for as `BACKLOG.md`,
  `docs/BACKLOG.md` and `docs/PRODUCT_BACKLOG.md`; `STATUS.md` is read.
- **Order.** The three paths are tried in that order, and the first one
  found is read. When more than one exists, the report says so and names
  the one read. When none exists, the page says that no backlog file was
  found, and shows the status if there is one.
- **No local folder.** From PBI-1.14 (item 9) the page opens no folder
  and reads no local file: it has no folder input and no file input, and
  it picks no files. Every project comes from GitHub.
- **GitHub URL.** `https://github.com/<owner>/<repo>`, optionally
  followed by `/tree/<branch>`, where the branch is everything after
  `/tree/`, a trailing `/` dropped (branch names can hold `/`). Without
  a token the page makes these anonymous requests, in this order (with
  a token held for the address's owner, 3.8 changes them):
  1. `GET https://api.github.com/repos/<owner>/<repo>`, for the default
     branch (skipped when the URL names a branch);
  2. `GET https://api.github.com/repos/<owner>/<repo>/git/trees/<branch>?recursive=1`,
     the file list: it tells which of the three backlog paths exist, and
     feeds the documentation list and the path links (3.4);
  3. `GET https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>`,
     once each for the backlog file, the files it includes (3.15, at
     most five), `STATUS.md` and `PROJECTS.md` (3.9), each only if the
     file list has it; documentation files are not fetched (3.4).

  So one load makes one or two requests to `api.github.com` (requests 1
  and 2) and up to eight to `raw.githubusercontent.com` (request 3): two
  to ten in all when the backlog file is found (two to five without an
  include line). From PBI-1.15 the
  branch picker reads the repo's branch list after a load succeeds, with
  one to three more requests to `api.github.com` (3.13). From PBI-1.19
  the opening guide ("Guided opening" below) makes requests of its own
  before a load; the load still makes its own, as here. If request 1 or
  2 answers 404 and no token is held for the owner, the page says: "Not
  found or not public. If the repo is private, add a token for its
  owner." (3.8 sets out the tokens; Clead's design; with a token held
  for the owner, 3.8 sets out the message.) Any other failed request is
  shown with its HTTP status and is not retried.
- `api.github.com` and `raw.githubusercontent.com` both answer with
  `Access-Control-Allow-Origin: *`, so a browser page can read them
  (checked with `curl` on 2026-11-03, and again on 2026-11-04 against
  the public template repo).

**As built (PBI-1.2).**

- **The address** (replaced from PBI-1.17 by "The Repository field"
  below). The input is trimmed. Only
  `https://github.com/<owner>/<repo>` is read (`https`, the host
  `github.com` exactly), optionally followed by `/tree/<branch>` and a
  trailing `/`, with no `?` or `#`. Owner and repo are letters, digits,
  `.`, `_` and `-`, and neither is `.` or `..`. Any other address makes
  no request: the page says what an address looks like.
- **Encoding.** The branch is percent-encoded in request 2 (so a `/` in
  it becomes `%2F`) and used as written in request 3 and in github.com
  links. Request 3's path is one of the three backlog paths,
  `STATUS.md`, `PROJECTS.md` or an included file's path as resolved by
  I3 (3.15), used as written. In a github.com link (3.4) each segment
  of the file's path is percent-encoded.
- **Failures.** A failed request 3 (the backlog file or `STATUS.md`)
  fails the whole load (an included file's does not: 3.15, "A failed
  read of an included file") and is shown with its HTTP status; a 404 there is
  shown as a status, not as the 404 message of request 1 or 2. A
  request that cannot be made says so with the host and the reason. An answer to
  request 1 without a default branch is shown as "GitHub's answer for
  the repo had no default branch", and an answer to request 2 without a
  file list as "GitHub's answer for the file list was not understood".
  After any failed load, and after a refused address, the previous
  project's results are cleared and hidden.
- **Two loads at once.** The newest load is shown. Every submitted
  address starts a load, and a refused address counts as one. A load's
  answer that arrives after a newer load has started is dropped, whether
  it succeeded or failed, so an older error never replaces a newer
  project.
- **The file list** holds every file (blob) of request 2's
  answer; none is left out.
- **A truncated file list.** When GitHub marks request 2's answer as
  truncated, the page reads the files it got, says so under the address,
  and adds an Info item to the report: the documentation list and the
  code-span links may be incomplete.

**The Repository field (PBI-1.17).** The product owner's decision of
2026-11-04 (17:07; see "What is decided", item 14): one "Repository"
field where the user types `owner/repo`, for example `fomo-t/fomo-f`; a
full GitHub address pasted into it, with or without `/tree/<branch>`,
still works, and the token is still picked by the owner. It replaces
the 16:36 prefill of `https://github.com/`, which is not built. Clead's
design, within that decision; it replaces "The address" of "As built"
above from PBI-1.17. It is built after PBI-1.14 and before PBI-1.16
(`docs/BACKLOG.md`).

- **The field.** The address field keeps its id `#url-input`, its form
  `#url-form`, its "Open" button `#open-url`, `type="text"` and
  `autocomplete="off"`, and gains `spellcheck="false"` and
  `autocapitalize="none"` (a phone would capitalise the owner).
  - Its label, a `<label for="url-input">`, reads "Repository".
  - Its placeholder reads "<owner>/<repo>" (the product owner's
    decision of 21:01, item 14).
  - It starts empty, and the page never fills it at startup, except
    from the page's address (3.16).
  - Placement before PBI-1.16: where today's label "Public GitHub repo"
    is, which it replaces. From PBI-1.16 (3.12): under the section's
    heading `h2` "Open a project from GitHub", the label "Repository"
    (13 px, muted, as the field labels of "Add a token" are) sits above
    the row of the field and "Open", 4 px above it, and the heading 10
    px above the label. The heading names the section; the label names
    the field.
- **What it accepts.** The text is trimmed at both ends. Then it is
  read as one of these, and nothing else:
  1. `<owner>/<repo>`;
  2. `<host>/<owner>/<repo>`, where `<host>` is `github.com` or
     `www.github.com`, with or without `https://` in front: so
     `https://github.com/<owner>/<repo>` (as 3.1 reads an address
     today), `github.com/<owner>/<repo>`,
     `https://www.github.com/<owner>/<repo>` and
     `www.github.com/<owner>/<repo>`. People copy addresses without the
     scheme (Clead's call). The scheme and the host are compared
     without regard to case: they are lower-cased, then compared, so
     `GitHub.com/acme/widgets` and `HTTPS://GITHUB.COM/acme/widgets`
     are accepted, as a browser reads a host. `http://` is not
     accepted;

  each optionally followed by `/tree/<branch>`, and then by one `/`.
  Owner and repo follow 3.1's name rule: letters, digits, `.`, `_` and
  `-`, and neither is `.` or `..`. The branch is everything after
  `/tree/`, one trailing `/` dropped, non-empty, as 3.1 reads it, then
  decoded (below); the text holds no `?` or `#` anywhere. A text that
  starts with `github.com/`, `www.github.com/` or `https://`, in any
  case, is read only as form 2, never as form 1, so `github.com/acme` is
  refused (no repo), and is not taken for an owner named `github.com`.
  - **The branch is decoded once** with `decodeURIComponent`, and the
    decoded name is the branch. A copied address percent-encodes every
    character outside ASCII, and characters such as `<`, `>`, `"`, `{`
    and `}`, which git allows in a branch name; GitHub's own links do
    so, and so does the address bar's copy. So a branch `fix-å` arrives
    as `/tree/fix-%C3%A5`, and `feat/x` may arrive as `/tree/feat%2Fx`;
    decoded, they are `fix-å` and `feat/x`, which the page opens (the
    requests encode them again, 3.1 "Encoding"). A branch typed
    unencoded, such as `fix-å`, has no `%` and decodes to itself.
  - **The branch is refused**, with its own message (below), when
    decoding fails (a malformed `%`, such as `a%E0`, or a lone `%`, such
    as `50%`), or when the decoded name holds `#`, `%` or `?` (from
    `%23`, `%25` or `%3F`). Those are the names the page cannot open:
    3.13 disables them in the picker ("Names the page cannot open"; `?`
    as a defence, since git refuses it), and 3.14 does not save them.
    So one rule holds across the page: a branch whose name holds `#`,
    `%` or `?` is not opened, and every other name the picker lists or
    the saved list holds can also be opened by this field.
  - **A repo ending in `.git` is refused**, without regard to case, with
    its own message (below). `github.com/acme/widgets.git` is a clone
    address, which people copy from GitHub's "Code" button; it passes
    the name rule as the repo `widgets.git`, and would make requests
    that end in a 404. Whether GitHub allows a repo name that ends in
    `.git` at all was not checked; if one exists, vizi cannot open it
    by this field.
  - **`<owner>/<repo>/tree/<branch>` without the host is accepted**
    (Clead's call): it is the same grammar with or without the host, a
    repo name cannot hold `/`, so the form cannot mean anything else, and
    a user who types the short form and a branch gets what the long form
    gives.
  - Not accepted (Clead's call): `http://`, any other scheme, any other
    host (`gist.github.com`, `example.com`, …), a leading `/`, anything
    after the repo but `/tree/<branch>` (such as `/issues` or
    `/blob/…`), and `?` or `#`.
  - The owner is used as written in the requests (GitHub reads it
    without regard to case, section 4, item 18) and in lower case to
    pick the token (3.8).
- **Errors.** Any other text makes no request, counts as a load (3.1,
  "Two loads at once": the results are cleared and hidden, and an older
  load's answer is dropped), and `#message` says: "Type the repository
  as <owner>/<repo>, for example fomo-t/fomo-f, or paste its GitHub
  address (github.com/<owner>/<repo>, optionally with /tree/<branch>)."
  An empty field gives the same message. (From PBI-1.19 an owner alone
  is not refused but guided: "Guided opening" below.) Two cases have
  their own message, with the same effect (no request, counted as a
  load):
  - a branch refused as above: "vizi cannot open this branch: its name
    holds # or %.". (A decoded `?` gets the same message; it comes only
    from `%3F` and git refuses it, so no real branch meets it.)
  - a repo ending in `.git`: "That is a clone address. Type the
    repository as <owner>/<repo>, without .git."

  The form is written `<owner>/<repo>` in every text the user sees (the
  placeholder and these messages, decision of 21:01, item 14); the real
  example `fomo-t/fomo-f` stays as it is.

  These replace today's "Enter a public repo address like
  https://github.com/<owner>/<repo>, optionally followed by
  /tree/<branch>.". The tests that assert today's message change with
  it: `e2e/csp.e2e.ts` (lines 97 and 109) and `e2e/page.e2e.ts` (lines
  603 and 607, at `main` `90405fb`) check "Enter a public repo address";
  they check the new message instead, with the same input, `not an
  address`, which stays refused.
- **The load.** Accepted text gives the reference `{owner, repo,
  branch}` (branch `null` without `/tree/`), and the load is the one of
  3.1, unchanged: its requests, messages, the newest-wins rule, and the
  token held for the owner, compared in lower case (3.8, "Which token a
  load uses"). The short form and the long form of one repo load the
  same way.
- **Where other parts set or read the field.**
  - The umbrella view's "Open in vizi" (3.9) puts `<owner>/<repo>`,
    the field's own form, into the field (in place of
    `https://github.com/<owner>/<repo>`), then loads that repo as it
    does today.
  - The token Owner prefill (3.8, "Which owner a token is for") reads
    the field with the same reader: while the user has not typed in the
    Owner field, it holds the owner of the field's text whenever that
    text is accepted, in either form.
  - The branch picker (3.13) and the saved repos list (3.14) neither
    read nor write the field, so they are not affected.
  - From PBI-1.19 the opening guide ("Guided opening" below) writes into
    the field: the browser does when a datalist option is chosen, and
    the opening guide's select does when a repo is chosen, each
    `<owner>/<repo>`. The opening guide's own write fires no `input`
    event, so it updates the Owner prefill explicitly, right after
    writing, by the same rule as typed text (3.8); the browser's write
    from the datalist fires one, and the prefill follows it as typed
    text. For an owner alone (`acme`), which the one reader refuses, the
    Owner prefill fills nothing, as today; it fills the owner once a
    repo is in the field.
  - From PBI-1.35 the page writes the `repo` value of its own address
    into the field once at startup (3.16). It is one of the page's own
    writes, as "Open in vizi" is: it fires no `input` event, so right
    after it the page updates the Owner prefill by the rule for typed
    text (3.8) and the opening guide follows the field as after its
    other page writes; then the page opens the field's text as "Open"
    does.
- **One reader.** `src/github.ts` exports one function that reads the
  field's text into a reference, used for submitting the form, for the
  Owner prefill, and, from PBI-1.19, by the opening guide for its
  owner-and-repo case ("Guided opening" below), and nowhere else; the
  old `parseGithubUrl` is replaced by it. It does not change for
  PBI-1.19: it still refuses an owner alone (`acme`, `acme/`), and its
  unit tests stay. The owner-alone case is the opening guide's own, in
  `src/guide.ts`.
- **Tests** (test first):
  - unit (`src/github.test.ts`), the reader: `acme/widgets`;
    `acme/widgets/`; `  acme/widgets  `; `acme/widgets/tree/main`;
    `acme/widgets/tree/feat/new-thing/` (branch `feat/new-thing`);
    `acme/widgets/tree/fix-%C3%A5` (branch `fix-å`);
    `github.com/acme/widgets/tree/feat%2Fx` (branch `feat/x`);
    `acme/widgets/tree/fix-å`, typed unencoded (branch `fix-å`);
    `https://github.com/acme/widgets`, with `/tree/<branch>`, with a
    trailing `/`, and with spaces around; `github.com/acme/widgets`,
    `www.github.com/acme/widgets` and
    `https://www.github.com/acme/widgets/tree/main`, each the same
    reference as the `https://github.com` form; `GitHub.com/acme/widgets`
    and `HTTPS://GITHUB.COM/acme/widgets` accepted, the same reference;
    `Acme/Widgets` kept as written. Refused: empty; `acme`; `acme/`;
    `/acme/widgets`; `acme/widgets/tree/`; `acme/widgets/issues`;
    `acme/widgets/blob/main/x`; `acme/widgets?x=1`; `acme/widgets#x`;
    `ac me/widgets`; `../..`; `./widgets`; `acme/..`;
    `http://github.com/acme/widgets`;
    `http://www.github.com/acme/widgets`;
    `https://example.com/acme/widgets`; `gist.github.com/acme/widgets`;
    `github.com/acme`; `github.com/acme/widgets/issues`;
    `javascript:alert(1)`; and, with their own messages,
    `acme/widgets/tree/a%23b`, `acme/widgets/tree/50%25`,
    `acme/widgets/tree/a%E0`, `acme/widgets/tree/50%`,
    `acme/widgets/tree/a%3Fb`, `acme/widgets.git`,
    `github.com/acme/widgets.GIT` and
    `https://github.com/acme/widgets.git/tree/main`. Today's refused
    case `acme/widgets` moves to the accepted cases;
  - browser: the label "Repository" for `#url-input` and the placeholder
    "<owner>/<repo>"; the refusal and `.git` messages word for word,
    with `<owner>/<repo>`; `acme/widgets`, `github.com/acme/widgets` and
    `https://github.com/acme/widgets` load the same way: submitted with
    Enter they make the same requests (from PBI-1.19 a click on "Open"
    first blurs the field, which for the short form adds the opening
    guide's request 1, "Guided opening"; Clead, 2026-11-05, #85); the
    short form with `/tree/<branch>` makes no request 1; a refused text makes
    no request and shows the message; `acme/widgets/tree/fix-%C3%A5`
    makes request 2 for the branch `fix-å` (sent encoded once, as
    `fix-%C3%A5`) and the heading reads `acme/widgets (fix-å)`;
    `acme/widgets/tree/a%23b` makes no request and shows the branch
    message; with a token held for `acme`, `ACME/widgets` uses it; the
    Owner prefill follows both forms; "Open in vizi" writes the
    pointer's own owner and repo (such as `acme/widgets`) into the
    field; the token, CSP and umbrella tests that open a
    project by address pass with either form.
- **The help view.** 3.10's step 5 places the token fields "under the
  address" (in the help text: "Under the address, type the owner…").
  That stays true with the Repository field, so the help text does not
  change for PBI-1.17. The changes 3.12 lists for the PBI-1.16 build
  are not affected.
- The Content-Security-Policy (2.3) does not change: the requests are
  those of 3.1.

**Guided opening (PBI-1.19).** The product owner's decision of
2026-11-04 (22:47, "apyr", on Clead's recommendation, "open to change
after trying it"; see "What is decided", item 16): one field takes
`<owner>` or `<owner>/<repo>`. While typing after `<owner>/`, a list of
that owner's repos drops down, private ones the owner's token can see.
When the field loses focus, an owner alone shows the repo list, and a
repo shows its branches with the repo's own default branch preselected
(fomo-f's is `master`). A pasted full address still opens directly.
The branch picker of 3.13 on a loaded project stays, and its branch
request is reused. Simplified by his decision of 2026-11-05 (07:41;
"What is decided", item 16): no
caching of repo or branch lists beyond the owner's repo list for one
page visit. So "reused" is read as the request, not its answer (Clead's
reading): the opening guide lists a repo's branches with 3.13's own
request, and the picker still reads its list after a load as 3.13 sets
out. Clead calls the feature "the opening guide". Clead's design, within
those decisions; built after PBI-1.15 (`docs/BACKLOG.md`); its order
against PBI-1.12, also after PBI-1.15, is not fixed, so the one test
that needs both (3.14's "Save" after a guided open) is written in
whichever is built second. It adds to "The Repository field" above and
changes none of its reading rules, with one exception, an owner alone
(below).

- **What the opening guide reads from the field** (a pure function of
  the field's text, `src/guide.ts`, Clead's design). It calls the one
  reader of "The Repository field" for the owner-and-repo case and adds
  only the owner-alone case of its own, so the two cannot drift. After
  trimming:
  - **an owner alone:** text that matches 3.1's name rule, with no `/`,
    or with one `/` at its end (`acme`, `acme/`), and that is not a
    host: text that, in lower case, is `github.com` or `www.github.com`,
    with or without a `/` at its end, is never an owner for the opening
    guide, since 3.1 reads text starting with `github.com/` or
    `www.github.com/` only as form 2. Someone typing
    `github.com/acme/widgets` by hand therefore makes no opening-guide
    request at `github.com/`, nor at `github.com` on leaving the field.
    Other text that only looks like a host, such as `gist.github.com/`,
    `http` or `https` typed without the colon, or a typo, is read as an
    owner: it costs one request
    (`/users/<owner>`, answered 404, "GitHub has no account named …")
    each time the field loses focus with it, since a failed read is not
    kept (Clead's call: accepted, as no rule can tell a typo from an
    owner);
  - **an owner and a repo:** text that the Repository field reads as
    form 1, `<owner>/<repo>`, with no `/tree/` (`acme/widgets`,
    `acme/widgets/`), as the one reader reads it (form 1);
  - **anything else** (a host form, with or without a scheme, and any
    text that starts, in any case, with `github.com/`,
    `www.github.com/`, `https:` or `http:`, so `https:/` and `http://gi`
    too; any text with `/tree/`; a refused text) is **not guided**: no
    opening-guide request is made for it, and Open and Enter load it
    exactly as "The Repository field" sets out. So a pasted full address
    opens as before, with Open or Enter (Clead's reading of "still opens
    directly": nothing is put between the address and its load; the page
    does not open on paste by itself, as today).
- **The owner's repo list** (the decision's "list of that owner's
  repos").
  - **Which requests** (checked against `github/docs` at
    `58b7b56aa507ad1269b9f8e9e89a172f0976c7ce`, its `main` on
    2026-11-04 when this was written (3.12 and 3.13 read `e44c283`,
    `main` earlier that day; the docs moved on between them, and
    `branches.json`, which 3.13 cites, is the same blob, `f998136…`, at
    both), read through git as for 3.12 and 3.13; files
    `src/rest/data/fpt-2022-11-28/repos.json`, blob
    `b5be6a41fa48073e04f94cf8ac912a8063ef6181`,
    `src/rest/data/fpt-2022-11-28/users.json`, blob
    `d7c69a661817f16919dbc99139d22c91c16c5798`, and
    `src/github-apps/data/fpt-2022-11-28/fine-grained-pat-permissions.json`,
    blob `0ea0357fb33360c4d474f81e0a9a15b5eafffb38`):
    1. `GET https://api.github.com/users/<owner>`, "Get a user", to
       learn whether the owner is a user or an organisation: the answer's
       `type` is `"User"` or `"Organization"`. The documentation gives it
       `"fineGrainedPat": true`, no permission (`"permissions": []`,
       `"allowPermissionlessAccess": true`), `"allowsPublicRead": true`,
       and the status codes 200 and 404. An answer that is not an
       object, or whose `type` is missing or neither `"User"` nor
       `"Organization"`: "GitHub's answer for `<owner>` was not
       understood." No repo request, no list, no select.
    2. Then the repos, `per_page=100&page=<n>`, `<n>` from 1:
       - an **organisation:** `GET /orgs/<owner>/repos?type=all&sort=full_name`,
         "List organization repositories": "Lists repositories for the
         specified organization", `type` one of `all` (the default),
         `public`, `private`, `forks`, `sources`, `member`;
       - a **user, with a token held for that owner:**
         `GET /user/repos?affiliation=owner&sort=full_name`, "List
         repositories for the authenticated user": "Lists repositories
         that the authenticated user has explicit permission (:read,
         :write, or :admin) to access", with `affiliation`
         `owner,collaborator,organization_member` by default. Only the
         items whose `owner.login` equals the owner (without regard to
         case) are listed, since a token named for an owner may belong
         to another account (3.8). There is no second page when page 1
         leaves no item (Clead's call: with `affiliation=owner`, an empty
         page 1 for that owner means the token belongs to another
         account, so later pages hold none of the owner's repos either),
         and the list counts as read in full: the line then says the
         owner has no repos vizi can see with its token, with the hint
         below;
       - a **user, without a token for that owner:**
         `GET /users/<owner>/repos?type=owner&sort=full_name`, "List
         repositories for a user": "Lists public repositories for the
         specified user." It shows no private repo, with a token or
         without, which is why the token case uses `/user/repos`.

       All three: `"fineGrainedPat": true`, the permission `"Metadata"
       repository permissions: "read"`, `"additional-permissions":
       false`, `"allowsPublicRead": true`; `per_page` "max 100", default
       30. Metadata read is the permission GitHub adds to every
       fine-grained token by itself (3.12), so the read-only token of
       3.8 needs nothing more, and the guide in 3.12 does not change.
  - **Not checked:** which repos `/user/repos` gives for a fine-grained
    token (the ones it covers, or more), and whether `/orgs/<org>/repos`
    with such a token shows the private repos it covers; the
    documentation does not say. "Tokens always include read-only access
    to all public repositories on GitHub"
    (`content/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens.md`
    at the same docs commit, blob `eed00bf0b64880e2aa32f630eb3c0c01ab90cbf2`,
    "Creating a fine-grained personal access token"). Section 4, item
    29.
  - **The token:** the one held for the owner at the moment an
    opening-guide read starts (3.8, "Which token a load uses"), compared
    in lower case, with 3.8's headers, `credentials: "omit"` and
    `cache: "no-store"`; without one, the requests go anonymously. Every
    opening-guide request goes to `api.github.com`, with or without a
    token.
  - **Pages and the cap,** as 3.13: page 1, then the next page only
    while the page before held exactly 100 items (counted before any is
    skipped), up to page 3, one after another. Past the cap the opening
    guide's message says "vizi lists the first 300 repos GitHub gives
    for `<owner>`. Type the repo's name to open another."
  - **An answer read as a list** is a JSON array; an item that is an
    object with a `name` that matches 3.1's name rule gives one repo
    (and, for `/user/repos`, an `owner.login` equal to the owner); any
    other item is skipped, a repeat is listed once, and the names are
    sorted by their character codes. Nothing else of an item is kept:
    not whether it is private. An answer that is not an array: "GitHub's
    answer for the repo list was not understood."
- **What is kept: an owner's repo list, for one page visit, and nothing
  else** (the 07:41 decision).
  - **Kept:** an owner's repo list read in full, that is every page
    answered and the 300 cap not reached, an empty list included. It is
    held in page memory only, in a `Map` from the lower-cased owner to
    the names, until the page is
    reloaded or closed. Nothing is written to the browser's storage.
  - **Not kept:** a failed read; a partly read list (a later page
    failed, or the cap was reached); a repo's default branch; any branch
    list. Each of these is read again the next time it is needed.
  - **When an owner's list is read:** when the field's text becomes that
    owner alone with its `/` typed (`acme/`), when the field loses focus
    with that owner alone in it (`acme`), and on Open with that owner
    alone. No request is made then when the owner's list is kept, or
    while a read of it is running (the running read's answer serves).
    Typing on (`acme/w`, `acme/wi`, …) makes no request: the datalist is
    filtered by the browser. No request is made on any other keystroke
    (Clead's design).
  - **A token change** for the owner ("Add", "Forget", "Forget all
    tokens", a 401, or another tab's `storage` event, 3.8) drops that
    owner's kept list, and abandons every opening-guide read for that
    owner that is running: it makes no further request (no further
    page, and no branch list after request 1; the page's fetch refuses
    before the request is made, as 3.8 builds it for a replaced load),
    and its answer, when it comes, is neither kept nor shown. The same
    change empties the datalist and hides the select and
    `#guide-message` when they hold that owner's repos or the branches
    of one of that owner's repos (3.8, "Forget, per owner"). The field's
    text stays; the next `/`, blur or Open reads again, with the token
    now held.
  - **The anonymous rate limit:** "The primary rate limit for
    unauthenticated requests is 60 requests per hour", per IP address,
    and 5,000 per hour for a personal access token
    (`data/reusables/rest-api/primary-rate-limit-unauthenticated-users.md`
    at the same docs commit, blob
    `110917f527966078d4e1c56a48d2f1a705b0ceed`). An owner's list costs
    two to four requests (request 1 above and one to three pages), once
    per page visit when it is read in full. Each blur with an owner and
    a repo that starts a read (below) costs two to four more, or one
    when Open stops the read after its request 1, as on a click on
    "Open", which blurs the field first. A load then costs what 3.1
    says, and the picker's list what 3.13 says.
- **The list while typing: a native `<datalist>`** (Clead's call, native
  first, as 3.13's select). The field gets `list="repo-list"` and keeps
  `autocomplete="off"`, the privacy-safe choice: the browser is asked
  not to keep the repo names typed there in its form history, which may
  be synced to the user's account. Whether a browser shows a datalist's
  suggestions differently on a field with `autocomplete="off"` was not
  checked (section 4, item 30); `<datalist id="repo-list">`
  holds one `<option>` per repo, its value `<owner>/<repo>`, the owner
  as the user typed it and the repo as GitHub gives it, set with `value`
  and `textContent` (3.7). The browser shows it, filters it and lets the
  user choose from it with its own means; how each browser does so, and
  with which keys, iOS Safari included, was not checked (section 4, item
  30), and the opening guide does not depend on it. Choosing an option
  writes it into the field, which is then an owner and a repo. The
  datalist holds only the current owner's repos: when the field's owner
  changes, it is emptied at once, and filled when that owner's list is
  read or kept. A text that is not guided (such as
  `acme/widgets/tree/main`) has no owner for the opening guide, which
  counts as an owner change: the datalist is emptied (Clead, 2026-11-05,
  #85). No custom listbox or combobox is built; the field keeps
  its label "Repository" and its role.
- **Leaving the field** (`blur`), and Open, for guided text. Every blur
  of the field acts as below, wherever the focus goes, Tab to "Open" and
  a click on "Open" included; a read a click on "Open" starts is stopped
  by Open (below). One exception: a blur of the field whose focus moves
  into the select (the event's `relatedTarget`) while the select already
  shows the field's text (that owner's repos, or that owner and repo's
  branches) does nothing, so the select does not change under the user
  arriving on it. The owner's repo list shows the field's text only
  while the field holds that owner alone; with `acme/widgets` in the
  field the select shows its text only once it shows that repo's
  branches, so the field's blur into a select still showing `acme`'s
  repos starts a fresh branch read that replaces the select's own
  (newest wins) (Clead, 2026-11-05, #85). The opening guide shows its
  result in one native
  `<select id="guide-select">` with its `<label>`, placed in the address
  row between the field and "Open" (on desktop on the same row, the
  field shrinking, at most 260 px wide; on a phone, under the field and
  above "Open"), so the page's order and the tab order are field,
  select, Open. It is hidden while there is nothing to show. (Clead's
  design; the approved row of 3.12 has the field and "Open" only, and
  this item adds the select between them, within the 22:47 decision.)
  The opening guide never moves the focus to the select: when it appears
  after the focus has gone on to "Open" (Tab out of the field), the
  focus stays on "Open", `#guide-message` announces it (below), and
  Shift+Tab reaches it.
  - **An owner alone:** the select's label is "Repo of `<owner>`", and
    its options are the owner's repos, with a first option "Choose a
    repo" that has no value. Choosing a repo writes `<owner>/<repo>`
    into the field and makes no request (a closed select may change at
    each arrow key, as 3.13 sets out). When the select loses focus with
    a repo chosen, the opening guide goes on as for an owner and a repo,
    below. A blur of the field, and **Open with an owner alone**, which
    loads nothing, read the owner's list as "When an owner's list is
    read" says, and then, by the list's outcome:
    - a list with at least one repo, kept or partly read, now or when
      the read answers while the field still holds that owner alone:
      the select is shown, and `#guide-message` says "Choose one of
      `<owner>`'s repos, or type `<owner>/<repo>`." (after the
      incomplete or past-cap message, for a partly read list);
    - still reading: `#guide-message` says "Reading `<owner>`'s repos…",
      and no select is shown yet;
    - a failed read (404, not understood, 403, any other failure) or a
      list with no repo: no select, and `#guide-message` carries the
      outcome, as under "Edge cases".

    Apart from 3.8's 401 message ("Edge cases"), the opening guide
    writes nothing into `#message`, so a load still running keeps its
    own messages there.

    This replaces, for an owner alone only, the refusal message of "The
    Repository field": the field now takes `<owner>` (the decision). It
    is not a load: it does not count as a newer load (3.1, "Two loads at
    once"), so a load still running goes on and is shown when it
    answers, and no results are cleared.
  - **An owner and a repo:** each time the field loses focus with an
    owner and a repo in it, or the select loses focus with a repo
    chosen, the opening guide reads, fresh, with the token held for the
    owner at that moment: `GET /repos/<owner>/<repo>`, request 1 of 3.1,
    for `default_branch` (an answer without a non-empty
    `default_branch` string gives 3.1's "GitHub's answer for the repo
    had no default branch", in `#guide-message`, and no select); then
    the branch list with 3.13's request ("Which request lists the
    branches", the same `listBranches`, pages and cap). A new read
    replaces the one before it: the older read makes no further request
    (no branch list after its request 1, no further page) and its answer
    is dropped. The
    select's label becomes "Branch of `<owner>/<repo>`", its options are
    the branches as 3.13 orders them (the default first, " (default)"
    after it, then by character codes; `#` and `%` disabled), and the
    default branch is selected: for `fomo-t/fomo-f`, `master`. The
    select is the same element, so a focus on it stays.
  - **Open with an owner and a repo** (and Enter in the field, which
    does the same) starts the load of 3.1 for the reference `{owner,
    repo, branch}`, as a newer load (3.1). `branch` is the branch
    selected in a branch select shown for that same owner and repo
    (without regard to case for owner and repo), or `null` when the
    default is selected or no such select is shown, so 3.14 saves it as
    following the default. The load makes its own requests as "The
    Repository field" sets out (request 1 when `branch` is `null`), and
    the picker of 3.13 then reads its own list: nothing the opening
    guide read is reused. Open hides the select and `#guide-message`,
    and a branch read still running is stopped as a replaced one is: no
    further request, its answer dropped. Whether
    Enter, while the browser shows the datalist's suggestions, chooses a
    suggestion instead of submitting is the browser's own behaviour and
    was not checked (item 30); the opening guide handles an Enter that
    does submit as Open, and one that chooses a suggestion as any change
    of the field.
- **Typing on, and newest wins.** Every opening-guide answer is for the
  owner, or the owner and repo, it was asked for. An owner's list read
  in full is kept whenever it arrives (unless its read was abandoned on
  a token change, above), but an answer changes the datalist, the select
  or `#guide-message` only if, when it arrives, the field's text, read
  as above, still names that owner, alone or with a repo, as `acme/wi`
  does (for a repo list), or is still that owner and repo (for a branch
  list), and, for a branch list, only if its read is the
  latest one. A kept list is used, with no request, when the field comes
  back to its owner. The datalist follows the field while typing; the
  select is shown only after a blur of the field or of the select, or an
  Open with an owner alone, for the field's text at that moment, never
  while the user types. Any input by the user in the field (an `input`
  event) that changes the field's owner, or its repo, hides the select
  at once, and clears `#guide-message` with it (Clead, 2026-11-05, #85).
  The opening guide's own write (a repo chosen in its select,
  which sets the field's value and fires no `input` event) does not hide
  it; it updates the Owner prefill itself ("Where other parts set or
  read the field"). Every other load (an entry of 3.14, "Open in vizi"
  or a pick of 3.13) also hides the select and `#guide-message`, and
  stops a running branch read, as Open does.
- **The opening guide's message line** `#guide-message`
  (`role="status"`, 14 px, muted, under the row) takes one line's
  height, empty or not, from the `input` event at which the field's text
  becomes guided (an owner, `<owner>/` or `<owner>/<repo>`, as read
  above), and no space while the field is empty or holds text that is
  not guided. The space is added or removed only on `input` events and
  on the page's own writes of the field (a repo chosen in the opening
  guide's select, "Open in vizi", the startup write from the page's
  address of 3.16), by the same rule, never on a blur, a
  focus, a read starting or a read answering, so a blur that writes a
  one-line message, such as "Reading…" or "Choose one…", moves nothing
  below the address row; a longer outcome may move content when it
  arrives; no delay or timer (Clead, 2026-11-05, #85). It says "Reading
  `<owner>`'s repos…" or "Reading the branches…"
  while a read is running, and the opening guide's outcomes. Load
  messages stay in `#message`. Both are shown also before any blur: for
  `acme/` typed, "Reading `<owner>`'s repos…" while the read runs and
  the outcome's message when it answers; "Choose one…" and the select
  come only after a blur or Open (Clead, 2026-11-05, #85).
- **Edge cases** (Clead's design):
  - **404 on `/users/<owner>`:** "GitHub has no account named
    `<owner>`." in `#guide-message`. No list, no select.
  - **404 on `/repos/<owner>/<repo>`:** the 404 message of 3.1, or of
    3.8 with a token, which already says to add a token for the owner,
    in `#guide-message`; no select.
  - **401 with a token:** 3.8's rule: the token is forgotten if it is
    still the one held for the owner, the results loaded with it are
    hidden, the opening guide's kept list for that owner is dropped, and
    3.8's message is shown in `#message`.
  - **403 (rate limit or other), any other status, a network failure,
    an answer not understood:** for `/users/<owner>` or a page of the
    owner's repos, "The repo list could not be read: `<message>`"; for
    the opening guide's `/repos/<owner>/<repo>` or a page of its branch
    list, "The branch list could not be read: `<message>`". `<message>`
    is 3.1's or 3.8's (3.8's 403 text speaks of "this repo"; for a list
    it is shown as GitHub's refusal, as written, on purpose, so one
    message names one cause wherever it appears). These two lines are
    the frame for every message of their requests that "Which requests"
    and "An owner and a repo" give, so "GitHub's answer for `<owner>`
    was not understood." is shown as "The repo list could not be read:
    GitHub's answer for `<owner>` was not understood.", and a repo answer
    without a default branch as "The branch list could not be read:
    GitHub's answer for the repo had no default branch." (Clead,
    2026-11-05, #85).
  - **A partly read list:** when a page after the first fails, the
    names read are shown and the line says "The repo list is
    incomplete: `<message>`" (or "The branch list is incomplete: …"), as
    3.13; at the cap, the past-cap message above (for branches, 3.13's).
    Such an owner list is not kept, so the next `/`, blur or Open with
    that owner reads it again. The field still opens any text as "The
    Repository field" sets out.
  - **An owner with no repos vizi can see:** in `#guide-message`,
    "`<owner>` has no repos vizi can see." With a token held for the
    owner, the line adds "with its token. If the token belongs to
    another account, add one made by `<owner>`, or type
    `<owner>/<repo>`."; for an organisation that requires approval of
    fine-grained tokens, a pending token reads only public repos (the
    token page, as in 3.12). No select is shown: a select holding only
    "Choose a repo" is never shown.
  - **A repo with no branches,** or a branch list that cannot be read:
    no select; Open loads the repo's default branch as 3.1 does.
- **Accessibility.** The datalist is the platform's own: the field keeps
  its `<label>` and the browser exposes the suggestions. The select is
  native, with a `<label for="guide-select">` whose text changes with
  its use; changing a label does not move the focus. The opening guide
  never moves the focus, with one exception: when the select is hidden
  while it has the focus, for any reason (a token change, also from
  another tab; a branch read or an owner's list that ends with no
  select; a load), the focus moves to the Repository field (Clead,
  2026-11-05, #85). `#guide-message` is a
  `role="status"` line, so its outcomes are announced, the select's
  "Choose one" line included. Sizes, colours, the focus ring and
  contrast are 3.12's (the select 48 px high on desktop, as the field,
  and 44 px on a phone; `--control-border`).
- **Phone layout** (below 800 px, 3.12): the field, then the select at
  the full width when shown, then "Open" at the full width; the message
  line under them; no sideways scroll at 375 px with a 100-character
  repo name in the select.
- **The Content-Security-Policy (2.3) does not change:** every
  opening-guide request goes to `https://api.github.com`, which
  `connect-src` already allows.
- **What changes in `src/`** (no code here): `src/guide.ts` (new, pure):
  reading the field for the opening guide, the request kind for an
  owner, one page's parsing and the merging and cap, the messages, and
  which owner lists are kept; `src/github.ts`: `getOwnerKind` and
  `listRepos` through the existing request code, and `listBranches` of
  3.13 reused; `src/main.ts`: the datalist, the select, the message
  line, the kept owner lists, the hooks on input, blur and Open;
  `src/style.css`: the row with the select at both widths.
- **Tests** (test first; GitHub stubbed; synthetic owners and tokens
  `github_pat_TEST…`):
  - unit (`src/guide.test.ts`): `acme`, `acme/`, `https` and `http` are
    an owner alone; `acme/widgets`, `acme/widgets/` an owner and a repo;
    `github.com/acme/widgets`, `https://github.com/acme`,
    `acme/widgets/tree/main`, `ac me`, `.`, `..`, `./`, `../` and the
    empty text are not guided, and neither are `github.com`,
    `github.com/`, `GitHub.com/`, `www.github.com`, `www.github.com/`,
    `https:`, `https:/`, `https://` and `http://gi`; `/users/<owner>`
    answered with an array, with no `type` or with `"type": "Bot"` gives
    the "not understood" message; a repo answer without `default_branch`
    gives the no-default message; a blur or Open with an owner alone
    gives the select and the "Choose one" message in `#guide-message`
    only for a list with at least one repo, "Reading…" while running,
    and the edge case's message otherwise; the request kind:
    organisation, user with a token, user without; a read abandoned on a
    token change for its owner makes no further request and its answer
    is not kept; a read for another owner goes on; a page parsed (an
    item without a valid `name` skipped, a repeat once, `/user/repos`
    items of another owner dropped, the order by character codes); the
    cap by items (100, 100, 100 with one skipped: "more may exist"; 100
    and 37: not); the messages, with the repo-list wording for a failed
    `/users/<owner>` and the branch-list wording for a failed
    `/repos/<owner>/<repo>`; a list read in full is kept, an empty one
    included, and a failed, partly read or capped one is not; a kept
    list dropped on every kind of token change for its owner and kept on
    a change for another owner;
  - unit (`src/github.test.ts`): the URLs of `/users/<owner>`,
    `/orgs/<owner>/repos?type=all&sort=full_name&per_page=100&page=<n>`,
    `/user/repos?affiliation=owner&sort=full_name&per_page=100&page=<n>`
    and `/users/<owner>/repos?type=owner&sort=full_name&per_page=100&page=<n>`;
    with a token, the header, `credentials: "omit"` and
    `cache: "no-store"`, and no token in a URL; the 401, 403, 404 and
    network messages;
  - browser (light and dark, 375 px and 1280 px):
    - typing `acme/` makes the owner's requests once; typing on to
      `acme/widg` makes none; the field has `list="repo-list"`, and
      the datalist holds `acme/<repo>` for each repo, as `<option>`
      values; a second `acme/` later in the same page visit makes none;
      a reload makes them again. Whether the browser shows the
      suggestions is browser chrome, not the page's DOM, so no test
      asserts it (item 30);
    - `acme/`, then leaving the field and Open while the owner's read
      is still running: the owner's requests are made once;
    - leaving the field with `acme` by a click elsewhere on the page
      shows "Repo of acme" with the repos; choosing one with the arrow
      keys makes no request; leaving the select reads the repo and its
      branches; the select then shows
      "Branch of acme/widgets" with `master` selected and marked
      " (default)" when the stubbed repo's default is `master`;
    - Open then loads `acme/widgets` with its own request 1, and the
      picker of 3.13 makes its own branch request; choosing another
      branch in the opening guide's select and Open loads it by name,
      with no request 1;
    - leaving the field twice with `acme/widgets` in it, the first read
      answered, reads the repo and its branches twice (nothing of a repo
      is kept); with the first read's request 1 held back, the second
      blur replaces it, the first makes no branch request, and the
      select shows the second read's branches even when the first's
      request 1 answers last;
    - **Save after a guided open,** written in whichever of PBI-1.19 and
      PBI-1.12 is built second (their order is not fixed; both come
      after PBI-1.15): 3.14's "Save" stores `null` for a guided open of
      the default branch and the name for another branch. 3.14's tests
      gain this case if PBI-1.12 is built second;
    - Open with `acme/widgets` while the opening guide's read is
      running: when request 1 is still running, no branch request
      follows it; when page 1 of the branches (100 items) is answered,
      no page 2 is asked for; the load goes on, and no select is shown;
      the same with Enter, and with a second blur that replaces the
      read;
    - clicking "Open" with `acme/widgets` in the field, the stubbed
      answer to the opening guide's request 1 held back until after the
      click: the blur starts the opening guide's read, Open stops it
      after its request 1 (no branch request from the opening guide),
      and the load makes its own requests;
    - Tab out of the field with `acme`: the focus is on "Open", the
      select shows "Repo of acme" once the list is read,
      `#guide-message` says "Choose one of acme's repos, or type
      acme/<repo>.", and Shift+Tab reaches the select; Tab out with
      `acme/widgets`: the repo and its branches are read, and the
      select shows "Branch of acme/widgets" with the default selected,
      the focus staying on "Open";
    - choosing a repo in the owner's select and Tab on to "Open": the
      select's blur reads that repo's branches;
    - with the select showing `acme/widgets`'s branches, Shift+Tab to
      the field and Tab back into the select: the field's blur makes no
      request, and a branch chosen before stays chosen;
    - with a branch select shown, typing a change of the repo hides it;
      choosing a repo in the owner's select leaves the select shown; an
      entry of 3.14, "Open in vizi", and a pick of 3.13 each hide the
      select and `#guide-message`;
    - `acme/`, then typing on to `acme/wi` before the owner's list
      answers: the answer still fills the datalist;
    - a token for `acme` that belongs to another account: `/user/repos`
      lists nothing (the empty list is kept), no further request is
      made, and the line shows the "with its token" message; typing
      `acme/<repo>` and Open still loads it;
    - an owner list that fails on page 2, or reaches the cap: its names
      are shown with the "incomplete" or past-cap message, and the next
      `acme/`, blur or Open reads it again; a list that failed on page
      1 is read again on the next blur, once;
    - a repo whose branch list is empty: no select; Open loads the
      default branch as 3.1 does;
    - Open with `acme` alone loads nothing, shows the select and, in
      `#guide-message`, the "Choose one of acme's repos" message once
      the list is read, and clears no results; with a load of another
      repo still running, that load goes on and is shown when it
      answers, and its messages in `#message` are not overwritten; while
      `acme`'s list is still reading, only "Reading acme's repos…" is
      shown; with `acme` answered 404, and with an empty list, there is
      no select, `#message` is unchanged, and `#guide-message` carries
      the outcome;
    - typing makes no select appear: typing `acme/widgets` shows no
      select until the field loses focus;
    - typing `github.com/acme/widgets` character by character makes no
      opening-guide request, and leaving the field at `github.com` makes
      none;
    - `/users/acme` answered with `"type": "Bot"`, and a repo answered
      without `default_branch`, each show their message and no select;
    - a pasted `https://github.com/acme/widgets/tree/dev` and
      `github.com/acme/widgets` make no opening-guide request and load
      with Open as before;
    - with a token held for `acme`, an organisation's requests carry it;
      a user owner's list comes from `/user/repos` and keeps only
      `acme`'s repos; without a token, `/users/acme/repos`;
    - newest wins: `acme/` then `beta/` with `acme`'s answer last shows
      `beta`'s repos only, and `acme`'s list, kept, is used with no
      request when the field comes back to `acme/`;
    - 404 on the user, 404 on the repo, 401 (the token forgotten), a
      403 with `X-RateLimit-Remaining: 0` on `/users/acme` and on the
      opening guide's `/repos/acme/widgets`, and an owner with no repos,
      each with its message;
    - "Add" or "Forget" of `acme`'s token drops `acme`'s kept list: the
      next `acme/` reads again;
    - Forget of `acme`'s token while `acme`'s repo read is running (page
      1 answered with 100 items, page 2 held back): no page 2 request is
      made, the late answer is not shown in the datalist and not kept
      (the next `acme/` reads again); the same while a repo's request 1
      or branch list is running (no branch request after request 1, and
      no select);
    - Forget of `acme`'s token while the datalist holds `acme`'s repos
      and the select shows a branch list of an `acme` repo: the datalist
      is emptied and the select hidden; the field's text stays; with
      the focus on the select, a Forget from another tab moves it to
      the field;
    - the field keeps `autocomplete="off"`;
    - choosing a repo in the opening guide's select, and filling the
      field with a datalist option's value (Playwright's `fill`, which
      fires `input` as the browser's own choice does; the choice itself
      is item 30), each with nothing typed in the Owner field:
      `#owner-input` then holds that owner;
    - leaving the field with `.`, `..`, `./` or `../` makes no request;
    - accessibility: the field's `list`, the select's label as it
      changes, the focus kept on the select, the tab order field,
      select, Open; the message line's role;
    - phone: no sideways scroll; the select and "Open" full width, at
      least 44 px high;
    - the CSP test of `e2e/csp.e2e.ts` passes with the datalist and the
      select shown; every opening-guide request is within the guard of
      `e2e/guard.ts`.

### 3.2 Views

- **(approved) Board.** One column per marker found in the file, in this
  order where present: `NOW`, `NEXT`, `BLOCKED`, `LATER`, `IDEA`, then
  `DONE` and `SUPERSEDED` folded (collapsed until opened). Clead's
  design for the rest: `MOVED` comes after `SUPERSEDED` and is folded
  too, since its entries are tracked elsewhere; any other marker comes
  last, in the order first seen, and is not folded. A column shows its
  entry count.
- **(approved) List.** Entries grouped under the backlog's own headings,
  in file order, with a marker filter and a text search. Clead's design
  for the rest: entries before the first heading are shown under
  "(no heading)", and the search matches the ID, the notes, the title
  and the description, ignoring case.
- **Card or row.** Shows the marker, the ID, the notes and the title,
  split as `docs/BACKLOG-FORMAT.md` R3 and R4 define. Titles are first
  sentences and can be long, so a card shows at most two lines of the
  title, and the whole title when opened. Opening it shows the
  description, rendered as Markdown under the contract in 3.7.

**As built (PBI-1.2).**

- **A card or row** shows the marker, the ID, then the notes in one pair
  of parentheses, joined with `; `, then the title. The title is
  rendered as inline Markdown (3.7).
- **A description** is rendered when its entry is first opened, not at
  load.
- **The search** looks for the trimmed query as a substring of the ID,
  the notes, the title and the description as written in the file (not
  as rendered), ignoring case. An empty query matches every entry.
- **The marker filter** offers "All markers" and the board's columns,
  in board order.
- **The list** groups the entries that pass the filter and the search
  by heading, in file order: consecutive entries under the same heading
  and from the same file share a group, and a heading with no entries
  left is not shown. A group of an included file is headed
  "`<heading>` — `<path>`", or "(no heading) — `<path>`" for its entries
  above its first heading (3.15).
- **After a load** the search is empty, the filter is "All markers",
  and the Board tab is open.

### 3.3 Status

**(approved)** The four `STATUS.md` fields (Phase, Current focus, Next
step, Blockers) above the board, with blockers waiting on the product
owner highlighted.

Clead's design: "Last update" is shown with the fields. How the fields
and blockers are read, and which blockers count as waiting on the
product owner, is in `docs/BACKLOG-FORMAT.md`, section 4; the field
texts are rendered under 3.7. Without a `STATUS.md` the page says so
and shows the backlog only. What `src/status.ts` could not read (a
missing heading, a missing or malformed "Last update") is listed in the
report (3.5).

**As built (PBI-1.2).**

- Phase, Current focus and Next step are rendered as Markdown blocks
  (3.7); a blocker's text as inline Markdown.
- A missing field heading shows "not given"; a missing or malformed date
  shows "Last update: not given".
- Blockers, by what the section holds (`docs/BACKLOG-FORMAT.md`, S3 and
  S4):
  - no `## Blockers` heading: "not given";
  - a `None` item: "None", followed by ` — ` and its remark when it has
    one (the remarks of several `None` items are joined with a space);
  - neither a `None` item nor a blocker: "No blockers listed";
  - a `None` item and blockers: both "None" and the blockers.
- Without a `STATUS.md`: "No STATUS.md was found, so no status is
  shown."

### 3.4 Links to documentation

**(approved)** Documentation links: the README, `docs/`, and file paths
named in entries.

- A "Documentation" list of the project's `README.md` and the Markdown
  files (`*.md`) under `docs/`, subfolders included, sorted by path.
  The list comes from the file list (3.1, request 2), and each
  link opens the file's github.com page
  (`https://github.com/<owner>/<repo>/blob/<branch>/<path>`) in a new
  tab.
- Every code span in an entry (such as `docs/SPEC.md`) whose text,
  without a leading `./`, is the path of a file in the project becomes a
  link, the same way. Other code spans stay text.

**As built (PBI-1.2).**

- "Under `docs/`" means a path that starts with `docs/` and ends with
  `.md`, case-sensitive; `README.md` is only the root's. The list is
  sorted by the paths' character codes.
- A code span names a file only when its text, after dropping one
  leading `./`, is exactly a path in the file list (3.1). Inside a
  link's label a code span is never a link (3.7).
- **Documentation list:** its entries are links to github.com only: the
  page does not read documentation files, so it renders none.
- **Links:** a relative link in rendered text (3.7 item 4) goes to
  the file's github.com page whether or not the path is in the file
  list: the list can be truncated, and github.com shows its own "not
  found". A code-span link is made only for a path in the file list.

### 3.5 Report of what could not be read

**(approved)** A report tab of what could not be read, with line numbers.

Clead's design: the report lists, with line numbers, what the parsers
skipped or guessed, sorted into the three kinds of
`docs/BACKLOG-FORMAT.md` section 3 (not read, read with a warning,
info), plus what `src/status.ts` could not read and the input notes of
3.1 (more than one backlog file). From PBI-1.34 it also lists the
include items and each included file's items (3.15), in the order 3.15
sets out ("What the page shows", Report): within each kind, the input
notes, the backlog file's items, each included file's items in the order
of I9, `STATUS.md`'s, `PROJECTS.md`'s. It is the same parsers; the
report is not a second pass. The tab shows the number of items of each
kind.

**As built (PBI-1.2).** The tab's label is "Report (`<n>`)", the total
number of items. The kinds are listed in the order Not read, Read with
a warning, Info, each with its count. An item with a line reads
"`<file>` line `<n>`: `<message>`", where the file is the backlog file
read, `STATUS.md`, `PROJECTS.md` or an included file's path. An item
without a line shows its message only:
an input note (3.1: more than one backlog file, a truncated file list),
and a `STATUS.md` item without a line (a missing field heading, a
missing "Last update" line).

### 3.6 Build and tests

As in 2.2: `src/backlog.ts` and `src/status.ts` with Jest, test first,
on synthetic fixtures (PBI-1.1); `src/markdown.ts` with Jest and the
page with Playwright, with GitHub's answers stubbed (PBI-1.2). Every
rule of `docs/BACKLOG-FORMAT.md` and every point of 3.7 gets at least
one test, written before the code.

Publishing (2.2, PR #22):

- `src/pages-workflow.test.ts` (Jest) parses `pages.yml` and `ci.yml`
  with the `yaml` package and compares structures, so comments, blank
  lines, quoting and key order cannot hide a change. `yaml` is a
  devDependency used only by this test: version 2.9.1, pinned exactly
  in `package.json`, ISC licence; it is not part of the built page. The
  test checks:
  - the whole workflow, exactly: its name; the triggers (a push to
    `main` and `workflow_dispatch`, nothing else); the top-level
    permissions (`contents: read`); the concurrency group (`pages`,
    `cancel-in-progress: false`); and exactly two jobs, `site` and
    `deploy`, so none is named `build`;
  - `site`, exactly: its runner and timeout, no `permissions:` key, and
    its steps with every `with` (step names aside): `checkout@v7` with
    `persist-credentials: false`, `setup-node@v7` with Node.js 24 and
    the npm cache, `npm ci`, `npm run build`, and
    `upload-pages-artifact@v5` with the path `dist`;
  - `deploy`, exactly: `needs: site`, the `refs/heads/main` condition,
    its runner and timeout, `pages: write` and `id-token: write`, the
    `github-pages` environment and its URL, and one step,
    `deploy-pages@v5`;
  - that CI's `build` job has the same `setup-node` step, `npm ci` and
    `npm run test:e2e`, that the `test:e2e` script starts with
    `npm run build`, and that `build` is `vite build`;
  - that `site` uses the same `checkout` version as CI.
- `e2e/subpath.e2e.ts` (Playwright) reads the built `dist/index.html`
  and checks that it has no root-relative `src`, `href`, `action`,
  `poster`, `url()` or `import`, and no external script or stylesheet,
  so the page works under `/vizi/`.
- The deploy itself, and the live site, are not tested.

### 3.7 Rendering contract

All text vizi shows comes from a project it does not control: a backlog,
a `STATUS.md` or a `PROJECTS.md`, possibly from any public repo. It
is untrusted. The contract, which `src/markdown.ts` and the page keep and
the tests check:

1. **No raw HTML.** HTML in the source, block or inline, is never turned
   into elements: it is shown as text, escaped. HTML comments
   (`<!-- … -->`) are dropped. No script, style, event handler or
   element from the source ever reaches the page.
2. **Indent.** Before a description is rendered, the smallest indent
   of its non-blank lines below the head (not counting the rest of the
   head, which has none) is removed from those lines, so an entry's
   indented description lines are not turned into indented code
   (`docs/BACKLOG-FORMAT.md`, edge case 6).
3. **What Markdown becomes.** Headings, paragraphs, lists, emphasis and
   strong emphasis, code spans, fenced code, block quotes and links.
   Anything else (tables, footnotes, and so on) is shown as its plain
   text. The page builds elements from `src/markdown.ts`'s tree with DOM
   calls that set text (`textContent`), never by inserting source text
   as HTML.
4. **Links.** A link becomes a clickable link only when its target,
   after trimming spaces and ignoring case, is:
   - an absolute `https:` or `http:` URL;
   - a relative path, resolved against the file it appears in, to the
     file's github.com page;
   - a `#` anchor within the same document.

   Any other target (`javascript:`, `data:`, `vbscript:`, `file:`, any
   other scheme, or a target with control characters) is shown as the
   link's text with no link. Links to other sites open in a new tab with
   `rel="noopener noreferrer"`; opening one is the user's own action.
5. **No loads from content.** Images are never loaded: `![alt](url)` is
   shown as a link with the alt text, under item 4, or as the alt text.
   Nothing in the content makes the page request anything: no images,
   frames, styles, fonts or scripts. The one exception is an include
   line of the backlog file (3.15), which the product owner decided on
   2026-11-07 01:05: it names a file of the same repo and branch that
   the load reads. The page's only requests are those of 3.1, after the
   user enters a URL (2.3) or opens the page with one in its address
   (3.16), the included files among them (3.15, at
   most five a load), with the branch list of 3.13 and, from PBI-1.19,
   the opening guide's reads of 3.1 ("Guided opening") while the user
   types in, leaves or submits the Repository field, or opens the page
   with an owner alone in its address (3.16).

Tests for it include, at least: `<script>` and `<img src=x onerror=…>`
in a description (shown as text, nothing runs); a link to
`javascript:alert(1)` and to `JaVaScRiPt:…` (no link); a remote image
(not requested: the browser test's request list stays as in 2.3); a
relative link.

**As built (PBI-1.2).** `src/markdown.ts` is a small reader, not
CommonMark. What it reads, beyond items 1 to 5:

- **Blocks** (item 3):
  - A heading is an ATX heading (`#` to `######`) indented at most
    three spaces. The page keeps `h1` and `h2` for itself, so a
    project's heading is shown two levels down: `#` as `h3`, `##` as
    `h4`, `###` as `h5`, and `####` and deeper as `h6`.
  - A list item starts with `-`, `*` or `+`, or with one to nine digits
    and `.` or `)`, indented at most three spaces. `+` and `)` are read
    here, in descriptions, although the
    backlog parser's R0 does not read them. Bullets and ordered items do
    not share a list.
  - A block quote starts with `>`, indented at most three spaces.
  - A fence is three or more backticks or tildes, indented at most three
    spaces. It closes on a line of at least as many of the same
    character, indented at most three spaces; without one it runs to the
    end of the text.
  - There is no indented code block: a line indented four or more
    spaces, outside a fence, is read as paragraph text.
  - Blocks nested twelve or more levels deep are shown as plain text.
- **Inline** (item 3):
  - A backslash before an ASCII punctuation character shows that
    character as text.
  - A code span is a run of backticks closed by a run of the same
    length. One space is dropped from each end when both ends have one,
    the span is longer than two characters, and it is not only spaces.
    A run with no closing run is text.
  - `*` and `_`, single or double, are emphasis and strong emphasis; `_`
    does not open or close inside a word. Inline text nested twelve or
    more levels deep is not read further.
  - An HTML comment that closes in the same paragraph is dropped (item
    1).
  - Autolinks (`<https://…>`), reference links and link reference
    definitions are shown as text.
- **Links** (item 4):
  - Brackets are matched once per inline text (a paragraph, a heading,
    a title, a link's label), with a stack. A `[` or `]` after a
    backslash does not count, and code spans are not skipped, so a `]`
    inside a code span ends a label. A `[` that is not a link is text
    and does not stop a later `[` from being one.
  - A destination is `<…>` with no line break, or written bare, ending
    at a space or an unmatched `)`; either form holds at most 4096
    characters. A title in `"…"` or `'…'` may follow. A longer
    destination is not read: the text is not a link, and its brackets
    and parentheses are shown as text.
  - A target with a scheme is a link only as `https://` or `http://`
    with a host, normalised by the browser's URL parser. Every such link
    opens in a new tab with `rel="noopener noreferrer"`.
  - A target that starts with `//`, holds a `\`, or has a `:` in its
    first path segment is text. These checks, the scheme check above
    and the control-character check of item 4 run only on the target as
    written, before any decoding. So a control character or a backslash
    that comes from decoding survives: `[h](a%0Ab)` links to a path with
    a line break in it, and `%00` and `%5C` pass the same way. Checking
    again after decoding is PBI-1.6.
  - A relative target loses its `?…` or `#…` part, found in the text as
    written, and the rest is then fully percent-decoded
    (`decodeURIComponent`): `a%2Fb` names `a/b`, and `%23` or `%3F`
    become part of the path. Bad percent-encoding makes the target text.
    After decoding, a target that starts with `/` resolves from the
    project's root, `.` and `..` segments are resolved, and a target
    that leaves the project, also through decoded `%2E%2E%2F`, is
    text.
  - An anchor (`#…`) is percent-decoded (bad encoding is kept as
    written) and turned into a slug like a heading's. An anchor whose
    slug is empty is text.
  - A link inside a link's label is shown as its text, so a link is
    never inside a link.
- **Heading ids and anchors** (item 4): a heading gets the id
  `md-<n>-<slug>`, so a project's text cannot reach the page's own ids.
  `<n>` numbers each text the page renders (a title, a status field, a
  blocker, a description), counted from 1 since
  the page was opened, so the same description open in a board card and
  in a list row gets different ids. The slug is the heading's text in
  lower case, with every run of characters other than letters,
  combining marks and numbers, of any script, made one `-`, and `-`
  dropped at both ends: `Översikt` gives `översikt`, and `½ x` gives
  `½-x`. A heading gets no id only when its text has no letter, mark or
  number. Within one text, a slug that is already taken gets `-1`, then
  `-2` and so on, skipping any that is taken. An anchor link points at
  `#md-<n>-<slug>` of its own text, with its slug made the same way and
  no suffix, so it reaches the heading of that text whose id is that
  slug. That is the first heading with that slug, unless a suffixed id
  took it: with `# A`, `# A` and `# A 1`, the ids are `a`, `a-1` and
  `a-1-1`, so an anchor `#a-1` reaches the second `A`, not `A 1`. An
  anchor in a text with no headings (a title, a blocker) points at no
  heading.
- **Images** (item 5): `![alt](url)` is a link whose text is the alt
  text, not read as Markdown, when its target is allowed under item 4;
  otherwise it is the alt text alone.

### 3.8 Private repos with saved tokens (PBI-1.8, PBI-1.11)

**(approved)** The product owner's intent approval of 2026-11-04 (see
"What is decided", item 4): a fine-grained, read-only GitHub token,
limited to chosen repos and with an expiry he chooses, pasted into vizi
once per browser, saved in the browser's storage behind a "Remember the
token" box, removed with a "Forget the token" button, sent only to
GitHub.

**(approved)** His intent approval of 2026-11-04 (item 7): vizi holds
one token per owner (for example factoincognito and fomo-t), picked
automatically by the owner in the address opened, the umbrella view's
"Open in vizi" included; each token has its own "Remember" box and
"Forget", plus a "Forget all"; otherwise as PBI-1.8: read-only, sent
only to GitHub, never shown. (Clead's note: the proposal gave as its
reason that a fine-grained token belongs to one owner.)

Clead's design, within those two approvals.

**Built and to build.** PBI-1.8 built one token (PR #31; the policy of
2.3 in PR #30). PBI-1.11 builds one token per owner: the points below
that hold an owner are a spec ahead of their code. Until PBI-1.11 is
built, the page holds one token, which every load uses whatever the
owner; it is saved under the single key `vizi.githubToken`, with one
"Remember the token" box and one "Forget the token" button; and a 401
forgets the token held at that moment.

- **What token.** Only a fine-grained personal access token, the kind
  that GitHub limits to chosen repos of one owner and gives an expiry.
  It is expected to need the repository permission "Contents: read"
  (and "Metadata: read", which GitHub adds to every such token)
  (section 4, items 10 and 11). The page takes only text that, after
  trimming, matches `^github_pat_[A-Za-z0-9_]+$`, so the token is always
  a valid header value. Anything else, a classic `ghp_` token included,
  is refused, and nothing is kept.
- **Which owner a token is for: the user names it.** Next to the token
  field there is an "Owner" field. "Use" takes the token only with an
  owner that, after trimming, matches the owner part of an address
  (`[A-Za-z0-9._-]+`, not `.` or `..`, as 3.1 reads it); vizi keeps
  owners in lower case and compares them without regard to case. While
  the user has not typed in the Owner field, it is filled with the owner
  of the address in the address field, whenever that is an address vizi
  can read (from PBI-1.17, the Repository field's text in either of its
  forms, 3.1, "The Repository field"); once the user has typed in it,
  the page leaves it alone, and an emptied field is filled again. Why
  the user names it, and vizi does not ask GitHub: the page knows of no
  GitHub request that answers which owner a fine-grained token's repos
  belong to (not checked, section 4, item 17), asking would send the
  token before the user has used it for anything, and the owner the user
  means is the one in the addresses the user opens. A token named for
  the wrong owner is simply not used for the right one: loads of that
  owner's repos go without it, and GitHub's 404 says so.
- **Where it is entered.** Under the address field: an "Owner" field;
  a "GitHub token (for private repos)" field of type `password`, with
  `autocomplete="off"` and spellcheck off; a "Remember the token" box;
  and a "Use" button. The token field is outside any `<form>`, so a
  browser has no form to offer to save it from; whether a password
  manager still offers to save it is section 4, item 15. A token "Use"d
  for an owner that already has one replaces it.
  From PBI-1.16 the fields are in the "Private repos" panel, under "Add
  a token": "Owner", "Fine-grained token, read-only" (the token field,
  relabelled), "Remember in this browser" (the "Remember the token" box)
  and "Add" (the "Use" button), with the same behaviour; 3.12 sets out
  where every control of this section goes and what it is called.
- **Never shown back in full.** After "Use" the token field is cleared.
  The page then lists "Tokens in use", one line per owner:
  "`<owner>`: `github_pat_…` and the token's last four characters",
  followed by "saved in this browser" or "for this page only", with that
  owner's own "Remember" box and "Forget" button. Under the list, while
  any token is held, is a "Forget all" button. From PBI-1.16 each line
  is a row of the panel (3.12): the owner, the same masked token, a
  "Remember in this browser" box, ticked exactly when the token is
  saved (it says what "saved in this browser" and "for this page only"
  said), and "Forget"; "Forget all" is "Forget all tokens".
- **Where they are kept.**
  - Always in the page's memory, while the page is open: one token per
    owner.
  - The tokens whose "Remember" box is ticked are also saved in
    `localStorage`, under the one key `vizi.githubTokens`, as JSON:
    `{"tokens": {"<owner>": "<token>", …}, "forgot": ["<owner>", …]}`.
    An owner is a name inside the value; no token is ever part of a key
    name. `"forgot"` lists exactly the owners that write forgot (see
    "Other open vizi tabs"); it is not carried over to the next write,
    since each write raises its own `storage` event in every other tab,
    and a tab handles those events in order.
  - No token is kept anywhere else: from PBI-1.12 the saved repos list
    has its own key, `vizi.savedRepos`, which holds names only (3.14).
  - **Owners are own entries only.** In memory the tokens are a `Map`
    from owner to token. The stored JSON is read with its own entries
    only (`Object.entries` of the parsed `"tokens"`, never a lookup
    such as `tokens[owner]` on a plain object), so an owner named
    `constructor`, `toString`, `hasOwnProperty` or `__proto__`, which
    the owner rule allows, finds only a token saved for it, never
    something an object inherits. The value is written from the `Map`
    in the same way.
  - **Every write starts from what is stored.** Just before it writes,
    the page reads the stored value, cleans it as at startup, and
    changes only the owners the write is about: the owner saved, the
    owner unticked, or the owners forgotten. Every other owner's entry
    is written back as it was stored, never from this tab's memory, so
    a token another tab forgot or unticked is never put back. Two tabs
    writing in the very same moment can still race, since
    `localStorage` has no transaction; reading just before the write
    narrows that to the moment itself.
  - At startup the page reads the key. A value that is not JSON, or
    whose `"tokens"` is not an object or `"forgot"` not a list, is
    removed. An entry whose owner does not match the owner rule, or
    whose token is not a string matching the token rule, is dropped, as
    is a `"forgot"` item that is not an owner; the cleaned value is
    written back. `"forgot"` is ignored at startup.
  - Unticking an owner's "Remember" removes that owner's saved copy and
    keeps its token for this page only. A browser that refuses to save
    keeps the token for this page only and says so.
  - "Remember" is off until the user ticks it. That keeps a token out
    of storage, but it does not protect it from the shared origin.
  - **Migration from PBI-1.8.** A token saved under the old key
    `vizi.githubToken` has no owner. At startup, when that key holds a
    valid token, the page lists it as "A token saved by an earlier vizi:
    `github_pat_…` and its last four characters", with an "Owner" field
    and "Keep for this owner", and a "Forget" button; it is not used for
    any load until it has an owner. "Keep for this owner" moves it into
    `vizi.githubTokens` for that owner, with "Remember" ticked, since it
    was saved, and then removes the old key; "Forget" removes the old
    key.
    An old-key value that is not a valid token is removed. From
    PBI-1.16 the line is the panel's highlighted block, "A token saved
    by an earlier vizi (…) has no owner yet. Whose repos is it for?",
    with "Owner", "Keep" (this "Keep for this owner") and "Forget it"
    (this "Forget"), the same behaviour (3.12).
- **The shared origin.** The published page runs on the origin of every
  factoincognito Pages site (2.2), so every token, whether saved or held
  for this page only, is only as safe as every current and future Pages
  site of the account:
  - a script on any of them can read the saved tokens from
    `localStorage`, or write values of its own there, which vizi would
    then use;
  - a script on any of them can open `/vizi/` in a window or a frame
    and script into it, so it can read a token held only in memory;
  - the account's root site, a repo named `factoincognito.github.io`,
    could register a service worker for the whole origin. That worker
    would see every request vizi makes, the `Authorization` header
    included, and could serve a changed page without its
    Content-Security-Policy. A root site could take vizi over entirely.

  Today `https://factoincognito.github.io/` answers 404, so there is no
  root site (checked 2026-11-04). Which other repos of the account have
  a Pages site was not checked: this session cannot list them.

  The defence, decided by the product owner on 2026-11-04 ("What is
  decided", item 5): no repo named `factoincognito.github.io` is
  created, so there is no root site and no service worker for the whole
  origin; and GitHub Pages is switched on only for factoincognito repos
  he trusts, so every site on the origin is one he trusts. The risk
  above stays: the tokens are only as safe as those sites, and the rule
  holds only as long as it is kept. A domain of vizi's own, which gives
  vizi an origin of its own, stays the stronger option for later, if
  more sites go on factoincognito Pages. A read-only, chosen-repos,
  expiring token limits what a stolen token can do; it does not stop
  the theft. More owners' tokens on the page means more to steal. The
  page says, next to the token field, that other factoincognito Pages
  sites can reach the tokens (from PBI-1.16, in the saved-token note of
  3.12, "saved or not").
- **Which token a load uses.** At the start of a load by address (3.1),
  the page takes the owner from the address and uses the token held for
  that owner, if any; the umbrella view's "Open in vizi" is such a load
  (3.9). With no token for that owner, the load goes without one, as
  for a public repo (3.1); when GitHub then answers 404, the message is
  3.1's, which already says to add a token for the owner (before
  PBI-1.14 it added "No token is held for `<owner>`." when tokens were
  held for other owners; that sentence goes). "Show status" in the umbrella view uses the token held,
  at that moment, for the owner of the project on the page (3.9). A load
  keeps the token it started with for all its requests; a load that has
  been replaced by a newer one makes no further request with its token
  (built: the page's fetch refuses before the request is made).
- **Forget, per owner.** An owner's "Forget" removes that owner's token
  from memory and from `localStorage`, and removes its line. Results
  loaded with that owner's token are hidden, since they may hold private
  text: the project, when its load used that token, and the "Project
  status" panel of 3.9, when its status was read with it; from PBI-1.19
  also the opening guide's datalist, select and message for that owner
  (3.1, "Guided opening"), whose running reads are abandoned and whose
  kept repo list is dropped; the opening guide clears these on any token
  change for the owner, an Add included, whether they were read with a
  token or without, so its lists always follow the token now held.
  Other results loaded without it stay. It counts
  as a newer load (3.1, "Two loads at once"), so the answer of a load
  still running is dropped and cannot show private text again; the
  message is "The token for `<owner>` has been forgotten.". A token held
  for one page only is gone when the page is closed.
- **Forget all** does what "Forget" does for every owner at once: it
  removes every token from memory, removes the `vizi.githubTokens` key,
  hides every result loaded with any token, counts as a newer load, and
  says "All tokens have been forgotten.".
- **Other open vizi tabs** listen for the `storage` event of
  `vizi.githubTokens` and of the old key `vizi.githubToken`. An event
  whose `key` is null (all of storage cleared) counts as both keys
  removed, as PBI-1.8 built it.
  - **What an event is compared with.** For `vizi.githubTokens`, the tab
    compares the event's `oldValue` with its `newValue`, each cleaned as
    at startup; a value that is missing or that the clean-up would
    remove counts as no entries and no `"forgot"`. It never compares
    with what this tab holds in memory. An owner whose entry is the same
    in both, and who is not in the new value's `"forgot"`, is left
    alone, whatever token this tab holds for it, saved or for this page
    only. So a write about other owners, or another tab's startup
    clean-up, changes nothing for that owner here. An owner in the new
    value's `"forgot"` is forgotten even if the new value also holds an
    entry for it.
  - **Following an event never writes.** It changes only this tab's
    memory and page: "Forget" and "Forget all" below forget in memory
    and hide results, and do not touch storage, which the other tab has
    already written. So events do not echo between tabs, and a value
    another tab wrote after the event's write is never undone.
  - **An event still queued when this tab writes.** This tab's write
    reads what is stored, so it is right whatever this tab has not yet
    handled. Handling the queued event afterwards can only make this
    tab forget: a tab that saves a token for an owner just after
    another tab forgot that owner (or did "Forget all"), but before it
    has handled that event, then forgets its own new token in memory,
    while the stored token stays and the other tabs adopt it. Saving it
    again in that tab restores it. The failure is towards forgetting,
    never towards a forgotten token coming back.
  - the key removed (`newValue` null: another tab's "Forget all", or
    storage cleared): this tab does "Forget all", whatever tokens it
    held, and says "The tokens were removed in another tab, so they have
    been forgotten.";
  - an owner in the new value's `"forgot"`: this tab does "Forget" for
    that owner, whatever token it held for it;
  - an owner with an entry in the new value that the old value lacks or
    holds with another token (another tab saved it): this tab adopts it
    for its next loads, as saved, and updates its line; results already
    shown stay;
  - an owner with an entry in the old value that the new value lacks,
    and who is not in `"forgot"` (another tab unticked "Remember"): if
    this tab holds a token for that owner, it keeps it, now for this
    page only. This settles PBI-1.10's point that unticking "Remember"
    in one tab makes every other tab do a full Forget.
  - the old key `vizi.githubToken`: when its new value is a valid token
    (a tab still running PBI-1.8's page saved one), this tab shows the
    migration line for it, or updates it; when it is removed (another
    tab's "Keep for this owner" or "Forget", or storage cleared) or not
    a valid token, this tab hides the line and writes nothing. A token
    moved by "Keep for this owner" reaches this tab through the
    `vizi.githubTokens` event, which comes first, since the move writes
    the new key before it removes the old one. A tab still running
    PBI-1.8's page does what PBI-1.8 built when the old key is removed:
    it forgets its token.
- **Which requests carry a token.** Only requests to
  `https://api.github.com`, in an `Authorization: Bearer <token>`
  header, with `credentials: "omit"` (no cookies) and `cache:
  "no-store"` (private answers are not kept in the browser's cache).
  With a token, every request of a load goes to `api.github.com`,
  private and public repos alike, and `raw.githubusercontent.com` is
  not used. Requests 1 and 2 are as in 3.1. Request 3 becomes
  `GET https://api.github.com/repos/<owner>/<repo>/contents/<path>?ref=<branch>`
  with `Accept: application/vnd.github.raw+json`, which answers the
  file's text (checked 2026-11-04 without a token, on a public file).
  The branch and each segment of the path are percent-encoded. So a
  load with a token makes two to ten requests (with `PROJECTS.md`, 3.9,
  and the included files, 3.15; two to five without an include line),
  all to `api.github.com`. The branch list of 3.13, after a load,
  goes to `api.github.com` the same way, with the token that load used,
  and so do the opening guide's reads of 3.1 ("Guided opening"), with
  the token
  held for the owner when they start. A redirect within `api.github.com`,
  such as a 301 for a renamed or moved repo, is followed with the
  `Authorization` header kept, so the token still reaches only GitHub;
  what GitHub's redirects look like, and that a browser drops the
  header on a redirect to another origin (as the Fetch standard says),
  was not checked here.
- **Never in an address, a log or a message.** No token is ever put in
  a URL, written to the console, or part of a message, the report or
  the page's text; messages name the host, the URL, the HTTP status and
  the owner only, and no URL holds a token. When a request that carries
  a token fails before an answer (a network error, or an exception from
  `fetch`), the message names only the host: "The request to `<host>`
  failed."; the exception's own text is never shown, since a browser
  may quote a header value in it.
- **Answers** (with a token; without one, 3.1 is unchanged). The
  messages as built, with PBI-1.11's owner where it adds one:
  - **401:** "GitHub refused the token for `<owner>`: it may have
    expired. It has been forgotten; enter a new one." The page forgets
    the token GitHub refused, as that owner's "Forget" does: it is
    forgotten only if it is still the token held for that owner, so a
    new token the user entered for that owner while the request ran is
    kept. A dead token then does not break later loads of public repos.
    This holds for a load and for "Show status" alike, and settles, for
    this design, PBI-1.10's point that a 401 forgets the token that is
    current rather than the one GitHub refused.
  - **403** with `X-RateLimit-Remaining: 0`: "GitHub's rate limit is
    reached. It resets at `YYYY-MM-DD HH:MM:SS` UTC." (the time only
    when `X-RateLimit-Reset` is a whole number of seconds). The token is
    kept.
  - **403** otherwise: "GitHub says the token may not read this repo:
    it may lack the "Contents: read" permission, or an organisation's
    token policy may stop it." The token is kept.
  - **404** on request 1 or 2: "Not found, or the token does not give
    access to this repo." (Without a token held for the owner the
    message is 3.1's, which points to adding one.)
    GitHub is expected to answer 404 for a private repo the token cannot
    see (section 4, item 11). The token is kept.
  - Any other failure is shown as in 3.1.
  - The other messages as built: a refused text, "That is not a
    fine-grained GitHub token. It must start with github_pat_ and hold
    only letters, digits and underscores; classic tokens (ghp_) are not
    used."; storage refused, "The browser would not save the token; it
    is kept for this page only.".
- **Expiry.** The page does not try to know a token's expiry before
  GitHub refuses it. `api.github.com` exposes to a page only the
  headers in its `Access-Control-Expose-Headers` list, and no header
  about a token's expiry is in it (read 2026-11-04 on an answer without
  a token). An expired token is met by the 401 rule.
- **Rendering and links** are unchanged (3.7). Links still
  go to github.com, where a private file needs the user's own GitHub
  sign-in.
- **Tests,** all with GitHub stubbed and synthetic tokens of the form
  `github_pat_TEST…`:
  - built for PBI-1.8: unit tests of `src/token.ts` (the token rule,
    the masked form, save, startup, forget, the `storage` event) and of
    `src/github.ts` (every request with a token goes to `api.github.com`
    with the header, `credentials: "omit"` and `cache: "no-store"`;
    request 3 through the contents API; no URL holds the token; the 401,
    403 and 404 mapping; an exception's text that holds the token is not
    shown); browser tests in `e2e/token.e2e.ts` (the field, the masked
    line, Remember and a reload, the rule at startup, the requests,
    the token in no URL, console message or page text,
    401, 403 and 404, Forget and its effect on results and on a running
    load, and a second tab);
  - for PBI-1.11, unit: the owner rule and lower case; the
    `vizi.githubTokens` value written and read, a broken value removed,
    a bad entry dropped (an owner that breaks the rule, a token that is
    not a string or breaks the rule, a `"tokens"` that is a list), no
    token in any key name; owners named `constructor`, `__proto__`,
    `toString` and `hasOwnProperty`: with no token saved for them a
    lookup finds none, and a token saved for them is written, read back
    and found; two stores on one storage, interleaved: store A forgets
    owner X, store B, which still holds X in memory, then saves a token
    for owner Y, and the stored value holds Y and no X, and a third
    store that follows both events forgets X; the token picked by
    the address's owner without regard to case, and none for another
    owner; "Forget" for one owner and "Forget all"; the `storage` event
    per owner, compared between `oldValue` and `newValue`: the key
    removed, a `key` of null, an owner in `"forgot"`, a new token
    adopted, a saved copy removed without `"forgot"` kept for the page;
    an unrelated write leaves a page-only token alone: a store holds a
    token for owner X for this page only, different from the X token
    saved, and another store's save of owner Y, whose write carries the
    stored X entry unchanged, leaves this store's X token and its "for
    this page only" as they were; another store's startup clean-up
    changes nothing for an owner whose entry it kept; following any
    event writes nothing to storage; a store that saves owner X while
    another store's forget of X is still unhandled leaves the new X
    token stored and, on handling that event, forgets it in memory
    only; the 401
    forgetting the refused token only, not a newer one for the same
    owner; the migration of `vizi.githubToken`, and the old key's
    `storage` event: removed, or holding an invalid value, hides the
    migration line; a valid new value shows it;
  - for PBI-1.11, browser: the Owner field filled from the address until
    the user types in it, and left alone after; two owners' tokens, each
    used only for its own owner's address, the umbrella view's "Open in
    vizi" and "Show status" included; a load for an owner with no token
    carries none and its 404 names the owner; each line masked, with its
    own Remember and Forget; Forget for one owner hides only results
    loaded with that owner's token, and drops a running load; Forget
    all; a second tab, for each `storage` case above; the migration
    line, its "Keep for this owner" and "Forget", and a second tab's
    migration line hidden by either; a 401 while a new
    token for the same owner is entered keeps the new one.

### 3.9 The umbrella view (PBI-1.9)

**(approved)** The product owner's intent approval of 2026-11-04 (see
"What is decided", item 6): the Umbrella tab, the tree from
`PROJECTS.md`, and the links per project, as described there. Each
project's status in the tree itself is not included.

Clead's design, within that intent; built in PBI-1.9 (PR #35). The
format of `PROJECTS.md`, and what counts as a pointer, is
`docs/BACKLOG-FORMAT.md`, section 5 (P1 to P7).

- **When.** The page looks for `PROJECTS.md` at the root of the
  project it opens. It reads it with one more request 3
  (3.1), only if the file list has it, and, with a token for the
  project's owner, through the contents API as 3.8 sets out for every
  request 3. This adds one request to a load (counted in 3.1 and 3.8).
- **The tab.** When the file exists, an "Umbrella" tab is added after
  "Report". When the project has a `PROJECTS.md` but no backlog file,
  the page opens on the Umbrella tab; otherwise it opens on the Board,
  as before (3.2). Without the file there is no Umbrella tab.
- **The tree.** The file's headings as nested lists, in file order, as
  P3 nests them, with each heading's pointers under it, in file order.
  A heading's text is rendered as inline Markdown under 3.7; a pointer
  is shown as P4 reads it, as plain text (P4 allows only letters,
  digits, `_`, `.`, `-` and `/`).
- **A repo pointer** (`<owner>/<repo>`) has two links:
  - "Open in vizi" puts `https://github.com/<owner>/<repo>` into the
    address field (from PBI-1.17, `<owner>/<repo>`, the Repository
    field's own form; 3.1) and loads it in the same page, as a newer
    load (3.1, "Two loads at once"): an answer still due for the
    umbrella project, or for any older load, is dropped. The new
    project's results replace the umbrella's. The load uses the token
    held for that repo's owner, if any (3.8, "Which token a load uses");
    a private repo with no token for its owner, or one the token does
    not cover, gets 3.8's 404 message. The page keeps no history: to go
    back, the umbrella project is opened again, by its address.
  - "On GitHub" links to `https://github.com/<owner>/<repo>` in a new
    tab, with `rel="noopener noreferrer"`.
- **A folder pointer** (`projects/<name>/`) has one link, "Show status".
  It reads `projects/<name>/STATUS.md` of the same project, with one
  request 3 for that path (the contents API, with the token held for the
  project's owner), only if the file list has it. The status is shown in
  its own panel,
  "Project status", below the tree and outside it, headed with the
  folder pointer it belongs to, read and shown as the project's own
  status is (3.3; `docs/BACKLOG-FORMAT.md` S1 to S5, blockers that wait
  on the product owner highlighted). What it could not read is listed
  under it, as built, under the heading "What could not be read", one
  item per line: "line `<n>`: `<message>`", or the message only for an
  item without a line (a missing field heading, a missing "Last update"
  line), as in 3.5. A read that fails is shown
  in the panel with its message (3.1, 3.8). A read GitHub refuses the
  token for (401) forgets that token as 3.8 sets out and hides the
  results loaded with it, the panel included; no panel is left. There is
  one panel: the next "Show status", for any pointer, replaces it, and
  the newest "Show status" wins, so when two are used in quick
  succession, on the same pointer or on two, an older answer arriving
  later is dropped. An answer that arrives after a newer load has
  started, or after the page has opened another project, is dropped as
  well. Without the file the panel says "No STATUS.md in
  projects/<name>/", with no request. "Show status" reads the file again
  each time.
- **Drawn from the file each time.** The tree is built from
  `PROJECTS.md` at every load, and a folder pointer's status at every
  "Show status". Nothing about them is kept after the next load,
  nothing is written to the browser's storage, and nothing is copied
  anywhere. The page reads no project's status until "Show status" is
  used, and the tree itself never carries a status: a status is only
  ever shown in the panel outside it.
- **Report.** What `src/projects.ts` reports (P4, P5, P7) is listed in
  the Report tab, in its three kinds, as "`PROJECTS.md` line `<n>`:
  `<message>`" (3.5). The messages as built:
  - P4, a pointer naming `.` or `..`: "Not read: a pointer cannot name .
    or .." (error);
  - P5: "Not read: a pointer is `- owner/repo` or `- projects/<name>/`
    at column 0, with nothing after it." (error);
  - P7, a repeat: "The same pointer is on line `<n>`; it is shown
    again." (warning);
  - P7, no pointer: "The file holds no project pointer." (info).
- **The help text (PBI-1.18).** The product owner's decisions of
  2026-11-04 (22:21 and 22:24; "What is decided", item 15): a help text
  in the umbrella view that explains what an umbrella is, and what
  pre-projects are. The wording, the place and the form are Clead's.
  - **Where:** a short paragraph, `<p id="umbrella-help">`, the first
    thing in the Umbrella tab's panel `#panel-umbrella`, above the tree
    `#umbrella-tree`, always shown while the tab is open. Not folded
    (Clead's call): it is three sentences, and a fold would hide them
    behind a control that says less than they do.
  - **Its words,** exactly, with the parts in code shown as code:

    "An umbrella is a project that lists other projects in its
    `PROJECTS.md`, grouped under the file's headings where it has
    them. A project with a repo of its own is shown as `<owner>/<repo>`,
    which you can open in vizi or on GitHub. A pre-project is a project
    at an early stage, with no repo of its own yet, that lives in this
    umbrella's repo for now: it is shown as `projects/<name>/`, and
    "Show status" reads its `STATUS.md`."

    The words follow 3.9 and `docs/BACKLOG-FORMAT.md` section 5: the
    tree is the file's headings with the pointers under them (P3), and
    pointers above the first heading are listed under "(no heading)".
    That is rule P4 of `docs/BACKLOG-FORMAT.md` section 5, word for
    word: "It belongs to the nearest heading above it; the pointers
    above the first heading are at the top of the tree, under "(no
    heading)"." The page shows it so as built: `src/main.ts` writes "(no
    heading)" for the tree node of those pointers (the umbrella tree's
    rendering, at `main` `28f9c87`), and 3.9's unit tests cover
    "pointers above the first heading". So "where it has them" covers a
    file with few headings or none. A repo pointer is `<owner>/<repo>`,
    a GitHub repo, with "Open in vizi" and "On GitHub"; a folder pointer
    is `projects/<name>/`, a folder of the same project (P4), with "Show
    status", which reads its `STATUS.md`. A pre-project is the product
    owner's name for what a folder pointer points at (22:24). The form
    is written with angle brackets, as the Repository field's hint is
    ("What is decided", item 14, 21:01; 3.1, "The Repository field").
  - **Static text in the page.** The paragraph is data in `src/help.ts`
    (as `UMBRELLA_HELP`, a list of parts, each plain text or code, as
    the help view's paragraphs are, 3.10), built into the one inline
    script. It is the same for every umbrella: nothing in it comes from
    the project or its `PROJECTS.md`. Showing it makes no request, and
    the policy of 2.3 does not change (only the script's hash changes
    with the build).
  - **Rendering:** the page's `h()` helper and `textContent`, `<code>`
    for the code parts; no `innerHTML` (3.7, 3.10 "Rendering path").
  - **Look:** 14 px, `--muted`, line height 1.45, 12 px below it before
    the tree, at most 70 characters per line on desktop
    (`max-width: 70ch`). Light and dark follow `prefers-color-scheme`
    through the page's variables (3.12): `--muted` on `--bg` is 7.46:1
    light and 7.94:1 dark. Code parts use the page's code style. On a
    phone it wraps at the column's width, with no sideways scroll.
  - **Accessibility:** it is real text in the tab panel, before the
    tree, so a screen reader reads it first on entering the tab. The
    panel has no `aria-describedby` for it (Clead's call): its place
    already makes it read first, and naming it as the panel's
    description too would have some screen readers read it twice. It
    is not a heading and takes no focus. Its meaning is in words, not
    in colour.
  - **Not changed:** the tree, the links, "Show status", the report
    and the requests of 3.9.
  - **Tests** (test first):
    - unit (`src/help.test.ts`): `UMBRELLA_HELP`, joined, equals the
      three sentences above word for word; its code parts are exactly
      `PROJECTS.md`, `<owner>/<repo>`, `projects/<name>/` and
      `STATUS.md`; the folder form it names, `projects/<name>/`, read
      as a pointer line `- projects/notes/` by `src/projects.ts` is a
      folder pointer, and `- acme/widgets` a repo pointer, so the text
      and P4 agree;
    - browser (GitHub stubbed, light and dark, 375 px and 1280 px): with
      a `PROJECTS.md`, the Umbrella tab's panel starts with
      `#umbrella-help`, before `#umbrella-tree`, with the exact text
      and four `code` elements; the panel has no `aria-describedby`;
      opening the tab makes no request beyond those of 3.9; the
      paragraph's colour against its nearest opaque background is at
      least 4.5:1; no sideways scroll at 375 px; without a
      `PROJECTS.md` there is no Umbrella tab and no paragraph; the CSP
      test of `e2e/csp.e2e.ts` passes with the tab open.
  - **The help view, at the PBI-1.18 build.** 3.10 is not changed by
    this spec (PR #73 changes it now). At the build, step 4 of the help
    view (`PROJECTS.md` for an umbrella) gains one sentence after the
    one on pointers: "A `projects/<name>/` pointer is a pre-project: a
    project at an early stage, with no repo of its own yet, that lives
    in this repo for now." The text of 3.10's step 4, `src/help.ts`
    and `src/help.test.ts` change in the same PR; the example and its
    stated reading do not.
- **Tests,** all on synthetic `PROJECTS.md` fixtures written for the
  test; the product office's own file is never copied into this repo:
  - unit (a pure `src/projects.ts`): every rule P1 to P7 and the
    example of `docs/BACKLOG-FORMAT.md` section 5: nesting, skipped
    levels, pointers above the first heading, both pointer kinds and the
    trailing `/`, `.` and `..` refused, comments and fences, the
    reported bullet lines, ignored text and ordered items, repeats, a
    file with no pointer;
  - browser, with GitHub stubbed: no Umbrella tab without the file; the
    tab and the tree with it; the page opening on the
    tab when there is no backlog; "Open in vizi" sets the address and
    makes the requests of 3.1 for the new repo, and an older answer
    arriving after it is dropped; "On GitHub" has the right URL,
    target and `rel`; "Show status" shows the status in
    the panel outside the tree, and the tree holds no status; the
    missing-file message with no request; a second "Show status"
    replaces the panel, and of two in quick succession the newer answer
    wins; a late answer after a newer load is dropped; no status request
    before "Show status" is used; the report items; with a
    token held, "Open in vizi" and "Show status" use it and no request
    goes to `raw.githubusercontent.com`. Choosing the token by owner is
    tested with PBI-1.11 (3.8, "Tests").

### 3.10 The help view (PBI-1.13)

**(approved)** The product owner's intent approval of 2026-11-04 (12:43,
recorded in the PBI-1.13 entry of `docs/BACKLOG.md`; see "What is
decided", item 8): a help view, "How to make your project vizi
compatible", opened by a link on the start page, inside the page. It has
short steps with one example each: where the backlog file goes
(`BACKLOG.md`, `docs/BACKLOG.md`, `docs/PRODUCT_BACKLOG.md`); how an
entry is written and which markers are shown; the `STATUS.md` headings;
`PROJECTS.md` for an umbrella; opening a private repo with a token, or as
a folder (the folder is replaced by item 9, so step 5 keeps the token).
A link at the end to `docs/BACKLOG-FORMAT.md` on GitHub. The text ships
in the page. A test checks that its examples read as stated.

Clead's design, within that intent. Nothing is added to or removed from
the five steps and the closing link, except the paragraph of 3.16,
between them. The link is not a sixth step, and neither is that
paragraph.

- **Opening and closing.**
  - In the page's `<header>`, at the right of the `h1` "vizi backlog
    visualizer" (on a phone, under it), there is a control with the text
    "How to make your project vizi compatible" (from PBI-1.16, 3.12;
    before it, under the "Vizi - backlog visualizer" heading). It is a
    `<button type="button">` styled as a link: it acts inside the page
    and goes nowhere.
  - The page's start content (the inputs, the message line and the
    results) sits in one wrapper element. The `h1` and the control are
    in the page's `<header>`, outside the wrapper (3.12). Using the
    control sets `hidden` on the wrapper, on the control and on the
    page's `<footer>`, and shows the help view. Nothing is removed or
    cleared, and the `hidden` of `#results` stays with the load code,
    which sets it as today (a successful load shows the results, a
    failed or refused load, or a forgotten token, hides them). So the
    control is hidden while the view is open, and nothing else on the
    start page can be focused.
  - The view's `<section>` sits outside the wrapper, as its sibling in
    `<main>`, so hiding the wrapper never hides the view.
  - A load that is under way carries on and fills the wrapper's content
    unseen. Opening the view starts no load and cancels none, and a load
    never moves the focus.
  - The view closes with a "Back to vizi" button at its top and again at
    its end, or with the Escape key. Closing shows the wrapper again,
    with the current state, not the state from before the view opened: a
    project that loaded meanwhile is shown; the results a failed load
    cleared stay hidden, with that load's message shown. Closing removes
    `hidden` from the wrapper, the control and the footer. Then the focus
    moves to the control, which is shown again by then. Escape with the
    view closed does nothing.
  - **No address.** The view has no hash and no history entry. The page
    keeps no history (3.9) and reads its own address only for 3.16's
    `repo` parameter at startup, so the view would have nothing to
    restore from one. A reload, or opening the page again, shows the
    start page when the address has no `repo` value (with one, the start
    page opens that repository, 3.16); it never shows the view. The view
    cannot be linked to; the link at its end is to the format spec on
    GitHub.
  - The view is not a tab: the tabs belong to a loaded project.
- **Static text in the built page.** The text is in a module,
  `src/help.ts`, as data: the view's title, the read-only sentence,
  for each step a title, a few short paragraphs, and one example, and,
  from PBI-1.35, the paragraph of 3.16 on opening a repo from a link
  (`REPO_LINK_HELP`). A paragraph is a list of parts, each plain text or
  code. The module is built into the one inline script, so the text ships
  in `dist/index.html`. Nothing is loaded for it: no `fetch`, no file, no
  image. The page's requests stay as in 2.3, and the policy in 2.3 stays
  as it is; only the hash of the inline script changes with the build, as
  with any change to the script.
- **The read-only sentence.** Decided by the product owner (2026-11-04,
  16:13; item 10 of "What is decided"): the view says early that vizi is
  read-only. Clead's design within that: the sentence and its place.
  Right under the view's `h2` title, before step 1, one sentence of
  static text: "vizi is a read-only tool: it reads your project's files
  on GitHub and never changes anything there."
- **The steps,** five, in this order, each with its title as a heading, a
  few sentences, and one example in a code block. What each says, and what
  its example reads as, are given below; the examples are what the code
  accepts today (checked against `docs/BACKLOG-FORMAT.md` R0 to R9, S1 to
  S5 and P1 to P7 with the page's own readers, 2026-11-04).
  1. **Where the backlog file goes.** The three paths, tried in this
     order, the first found being read; when more than one exists the
     Report tab says which was read (3.1). The example is the three
     paths, as a list. Nothing is parsed; the test compares it with
     `BACKLOG_PATHS` (see Tests).
  2. **How an entry is written.** One list item at column 0, a bold
     marker, an ID, notes in parentheses, an em dash with a space on each
     side, the title as the first sentence, the description after it (R1
     to R4). An entry without an ID, or without the dash, is still read,
     with a warning in the Report tab (R2, R3, section 3). Which markers
     are shown: every marker is shown; `NOW`, `NEXT`, `BLOCKED`,
     `LATER`, `IDEA` get a column each, `DONE`, `SUPERSEDED` and `MOVED`
     get folded columns, any other marker gets
     a column of its own and a warning in the Report tab (3.2, 3.5).
     Headings group the entries in the list. A list item without a marker
     is not an entry (R1; Info in the report). The example:

     ```markdown
     ## Settings

     - **[NOW] ABC-12** (since 2026-11-01) — Read the settings file. Missing keys
       get defaults.

       Unknown keys are kept and reported.
     - **[NEXT] ABC-13** — Pick the colours.
     - **[DONE] ABC-11** — Add the settings page.
     ```

     Stated reading: three entries, all in the group "Settings", with the
     markers `NOW`, `NEXT`, `DONE`, the IDs `ABC-12`, `ABC-13`, `ABC-11`,
     the note "since 2026-11-01" on the first, the titles "Read the
     settings file.", "Pick the colours." and "Add the settings page.",
     the first one's description "Missing keys get defaults." followed by
     "Unknown keys are kept and reported.", and nothing in the report
     (checked 2026-11-04).
  3. **The `STATUS.md` headings.** `# Status`, a `Last update:
     YYYY-MM-DD` line, then `## Phase`, `## Current focus`, `## Next step`
     and `## Blockers`; a blocker is a list item; one that starts with
     `Product Owner:` is highlighted (S1 to S5). The example:

     ```markdown
     # Status

     Last update: 2026-11-04

     ## Phase
     Build.

     ## Current focus
     The settings page.

     ## Next step
     Read the settings file (ABC-12).

     ## Blockers
     - Product Owner: choose the default port.
     - The build server is down.
     ```

     Stated reading: Phase "Build.", Current focus "The settings page.",
     Next step "Read the settings file (ABC-12).", Last update
     2026-11-04, two blockers, the first highlighted and the second not,
     and nothing in the report (checked 2026-11-04).
  4. **`PROJECTS.md` for an umbrella.** At the project's root; headings
     become the tree; a line `- owner/repo` is a repo pointer and
     `- projects/<name>/` a folder pointer; the pointer is alone on its
     line at column 0 (P1 to P5). After the sentence on pointers, the
     step says (from PBI-1.18, 3.9 "The help text (PBI-1.18)"): "A
     `projects/<name>/` pointer is a pre-project: a project at an early
     stage, with no repo of its own yet, that lives in this repo for
     now." The example:

     ```markdown
     # Projects

     ## Tools

     - acme/widgets
     - projects/notes/
     ```

     Stated reading: the heading "Projects" with the child "Tools", which
     holds the repo pointer `acme/widgets` and the folder pointer
     `projects/notes/`, and nothing in the report (checked 2026-11-04).
  5. **A private repo: with a token.** Make a fine-grained token for
     the owner, limited to the chosen repos, with an expiry and the
     repository permission "Contents" with read access (the words of the
     token guide, 3.12). Open "Private repos", then, under "Add a token",
     type the owner in "Owner" and paste the token into "Fine-grained
     token, read-only"; tick "Remember in this browser" to keep it in
     this browser, then "Add" (the box before "Add", as the page has
     them; 3.8, 3.12). It is sent only to GitHub. The example shows the token's format and no
     token: `github_pat_<letters, digits and underscores>`. It is written
     with the angle-bracket placeholder, which the token rule of 3.8
     refuses, so it cannot be mistaken for one, and no text in the view
     holds `github_pat_` followed by ten or more letters, digits or
     underscores. The help text for the step ends: "vizi opens
     projects from GitHub, and a private one needs this token."
     The permission name and the level the step uses are checked against
     GitHub's documentation (3.12, "The guide, checked against GitHub's
     documentation"; section 4, item 19); what GitHub answers to such a
     token is still section 4, items 10 and 11.
- **The closing link.** After the ordered list of steps, outside it, with
  no heading and no example: a link "The full format, `docs/BACKLOG-FORMAT.md`,
  on GitHub" to
  `https://github.com/factoincognito/vizi/blob/main/docs/BACKLOG-FORMAT.md`,
  opened in a new tab with `rel="noopener noreferrer"`. It follows 3.7
  item 4; the page makes no request for it.
- **Accessibility.**
  - Headings: the page's `h1` stays. The view's title is an `h2`, each
    step's title an `h3`, and no level is skipped. The view is a
    `<section>` labelled by its `h2`. The five steps are an ordered list;
    the closing link is after it. (3.7 keeps `h1` and `h2` for the page.
    The hidden wrapper holds the page's own `h2` "Open a project from
    GitHub", the `h2` "Saved repos" (3.14), the "Private repos" panel's
    `h2` and its "Add a token" `h3` (3.12), the `h2` of the results, and
    a loaded project's headings from `h3`; none is read while the
    wrapper is hidden.)
  - Keyboard: the control, the Back buttons and the final link are native
    elements in the page's tab order, and work with Enter and Space. On
    opening, the focus moves to the view's `h2` (`tabindex="-1"`). Escape
    closes. While the view is open nothing else on the page can be
    focused, as the rest is hidden. Every example block, whatever the
    viewport, has `tabindex="0"`, `role="region"` and an `aria-label`
    naming its step: a `<pre>` has the generic role, which takes no
    label, and a block that may scroll must take the focus so a keyboard
    user can scroll it.
  - Themes: the view uses the page's existing classes and colours, so
    light and dark follow `prefers-color-scheme` as today (`src/style.css`).
    It adds no colour of its own. An example block uses the code-block
    style the rendered Markdown already has.
  - Text is real text, not images; meaning is not carried by colour.
- **Rendering path.** The view is built with the page's `h()` helper and
  DOM calls that set text (`textContent`), as the rest of the page is
  (3.7 item 3). No `innerHTML`, `insertAdjacentHTML` or `outerHTML`, for
  this text or any other. The text is the project's own, not untrusted,
  and it still takes the same path, so the rule has no exception. The
  view does not pass its text through `src/markdown.ts`: examples are
  shown as written, and the paragraphs' code parts are explicit. Nothing
  in the view reads from a project, a file or the address.
- **Tests,** test first, on the examples as data, with no network:
  - unit (`src/help.test.ts`, Jest), on the same exported constants the
    page renders, through the page's own readers (`src/backlog.ts`,
    `src/status.ts`, `src/projects.ts`, `src/token.ts`, `src/github.ts`):
    - the read-only sentence of 3.10 is the constant of `src/help.ts`
      the page renders, word for word;
    - step 1's paths equal `BACKLOG_PATHS`, in order;
    - step 2's example read by `parse` of `src/backlog.ts` gives exactly
      the stated reading above, with an empty report; the markers the
      step's text names as getting a column, as folded, or as extra
      are compared with what `boardColumns` of `src/board.ts` makes of
      each (its private constants are not exported), and with
      `RECOMMENDED_MARKERS`;
    - step 3's example read by `src/status.ts` gives the stated fields,
      date and two blockers, the first with `waitingOnProductOwner`, and
      an empty report;
    - step 4's example read by `src/projects.ts` gives the stated tree,
      a repo pointer and a folder pointer, and an empty report;
    - step 5's token example is refused by `parseToken`, and no part of
      the help text matches `github_pat_[A-Za-z0-9_]{10,}`;
    - step 5 says "read access" (3.12);
    - the closing link is an `https://github.com/factoincognito/vizi/`
      URL ending in `docs/BACKLOG-FORMAT.md`.

    Steps 2 to 4 are checked for an empty report by their readers above;
    steps 1 and 5 have the checks of their own.
  - source check (Jest, reading the source files): the whole of
    `src/help.ts` and of `src/main.ts` hold no `innerHTML`, `outerHTML`
    or `insertAdjacentHTML`.
  - browser (Playwright, GitHub stubbed, in light and dark, at phone and
    desktop width as the other page tests are):
    - the control is in the page's header and reachable with Tab; Enter
      opens the view; the inputs and results are hidden and the focus is
      on the `h2`;
    - the heading structure, over the `h1` and the view's `<section>`
      only (the hidden wrapper holds other headings): the `h1`, then the
      section's one `h2` and five `h3`, one per step, none deeper; the
      closing link is outside the ordered list and has no heading;
    - the read-only sentence is the first text after the `h2` and before
      the first step's `h3`, and is static text: it is in the built
      `dist/index.html`, and opening the view makes no request for it;
    - every example block has `tabindex="0"`, `role="region"` and an
      accessible name;
    - each code block's text equals the constant in `src/help.ts`; the
      step titles are in order; every control label the text names
      ("Private repos", "Owner", "Remember in this browser" and "Add")
      exists on the start page, inside the "Private repos" panel (3.12);
    - from PBI-1.35, the paragraph of 3.16 is after the ordered list of
      steps and before the closing link, outside the list, with its two
      code parts in `<code>`, and the built `dist/index.html` holds its
      text;
    - Escape and both Back buttons close it, the control is shown again,
      the focus returns to it, and a project loaded before is still
      there; Escape with the view closed does nothing;
    - a load that succeeds while the view is open stays unseen until the
      view closes, and then shows;
    - a load that fails while the view is open leaves the results hidden
      after closing, with its message shown;
    - with the view open at phone width (375 px) the page has no sideways
      scroll (the check of `e2e/smoke.e2e.ts`);
    - no request is made by opening the view, and the page's requests
      stay as in 2.3; the built `dist/index.html` holds the view's title
      and the example text, and, read after the build as
      `e2e/subpath.e2e.ts` reads it (the unit tests run before the page
      is built), no match of `github_pat_[A-Za-z0-9_]{10,}` or of
      `ghp_[A-Za-z0-9]{20,}`, the view's code included; the CSP test of `e2e/csp.e2e.ts` is repeated
      with the view open, with no violation and no console error, and a
      script added at run time is still blocked;
    - the final link has the right `href`, `target` and `rel`; it is not
      clicked;
    - in dark mode the view's text and background differ as on the start
      page (the check of `e2e/smoke.e2e.ts`).

### 3.11 No local folder (PBI-1.14)

**(approved)** The product owner's decision of 2026-11-04 (15:15, "apyr";
see "What is decided", item 9): vizi opens projects from GitHub only,
public ones by address, private ones with the saved token (3.8). It no
longer opens a local project folder.

Clead's design, within that decision. The sections above already read
this way: 3.1 (inputs), 3.4 (documentation links), 3.7 (links and
rendered texts), 3.8, 3.9, 3.10 and section 4. What the code change
(PBI-1.14) must remove, and nothing beyond it:

- the folder input (`<input type="file" webkitdirectory>`) and its label
  "Or a local project folder", and the code that starts a load from it;
- the folder-reading code, as far as it is used only for folders: reading
  a picked folder's files, the file list built from them, the in-page
  documentation view of a folder file, the `href="#"` links to folder
  files, and the cases of the other code that serve only a folder (for
  example the folder branch of `PROJECTS.md` and of "Show status");
- `folderFiles`, `isMarkdownPath` and `SKIPPED` of `src/docs.ts`
  (`isMarkdownPath` is used only by the in-page view of a folder file;
  `SKIPPED` only by `folderFiles`), and their unit tests in
  `src/docs.test.ts` (the `describe("folderFiles")` and
  `describe("isMarkdownPath")` blocks). The module comments of
  `src/docs.ts` and `src/docs.test.ts` stay, with their words about a
  folder or the folder input's file list taken out, as they also
  describe the documentation links;
- the sentence "Open the project as a local folder instead." at the end
  of both 404 messages in `src/github.ts`, and every assertion of it
  (`src/github.test.ts`, `e2e/token.e2e.ts`, including the title of the
  test that says the message "offers the folder"); the messages are
  those of 3.1 and 3.8, and the sentence "No token is held for
  `<owner>`." that `src/main.ts` adds goes too (3.8, "Which token a load
  uses"), with its assertion;
- the `"file"` kind of `LinkTarget` in `src/markdown.ts`, if no page
  code uses it once the folder's resolver in `src/main.ts` is gone; the
  tests of `src/markdown.test.ts` that use it as a neutral resolver
  switch to the kinds that remain;
- the tests and fixtures of folder-only behaviour: the browser tests of
  what only a folder has (the folder input, a folder file shown in the
  page, the page opened from disk by picking a folder), the fixture
  folders only they use, and single fixture files only they use (such
  as a file shown as code in the Documentation tab); the folder cases in
  3.7 and 3.9 that have no address counterpart; and the "folder mode"
  check in `e2e/token.e2e.ts`. A browser test that picks a folder only
  to open a project, and checks behaviour that addresses share (the
  umbrella tab, "On GitHub", "Show status", the report, and so on, as
  3.9 requires), is not removed: it is rewritten to open the same
  fixture by address with GitHub stubbed. A fixture such tests or other
  address tests read stays.

What stays: the address field, the newest-load-wins rule for addresses
(3.1, "Two loads at once"), every request of 3.1, the saved tokens (3.8),
the umbrella view's "folder pointer" `projects/<name>/` (a folder of the
project on GitHub, read by request 3, not a local folder; 3.9), and the
page opened from disk, which still opens addresses (section 4, items 2
and 13). Code that is also used for addresses stays. The code structure
beyond this list is not decided here.

Tests: the browser tests that remain still pass with the folder removed
and with GitHub stubbed, and a new one checks that the start page has no
`input[type=file]`, and that the text of the start page, of the help view
and of the 404 messages, with a token and without, holds none of
"local project folder", "local folder", "as a folder", "project's
folder" (the help view's "folder pointer" and "a folder of the same
project" are allowed); and that the help view's
step 5 has only the token way. `e2e/token.e2e.ts` is as before
apart from its folder check and its 404 texts.

### 3.12 The start page redesign (PBI-1.16)

**(approved)** The product owner's intent approval of 2026-11-04 (15:48,
"go with it", on Clead's mockup; see "What is decided", item 11): the
start page as shown in Clead's mockup (the Claude design canvas "vizi
start page redesign", version 1793803575-d7d4, three boards: the start
page with the panel folded, the panel opened with a token from an
earlier vizi, and a phone in dark mode). "Open a project from GitHub"
with the address and Open on one row, and the help link in the header;
the line "Public repos open without a token. Private repos need a token
for their owner. All access is read-only: vizi never changes anything on
GitHub."; a folded "Private repos" panel with one row per owner
(Remember and Forget each), a token saved by an earlier vizi as one
highlighted row asking for its owner, "Add a token" and "Forget all
tokens"; one font, Inter, everywhere, built into the page; light, dark
and phone. His decisions of 16:11 (a step-by-step guide to making the
read-only token, next to the token fields) and of 16:17 to 16:18 (a
saved token can be used by anyone with access to this browser; on a
shared computer, use the token for the page only, without saving it)
add to it.

**What is approved, and what is Clead's draft.** The approval (15:48)
is of the canvas version 1793803575-d7d4. What it shows is the approved
look and copy: the structure, spacing, colours and font, and the texts
of the header, the address section's line, the panel's toggle and
summary, the owner rows, the earlier-token block, "Add a token" and its
labels, and "Forget all tokens". Three parts came after it, so they are
not in the approved version:

- the token guide carries out the decision of 16:11, and the
  saved-token note carries out the decisions of 16:17 to 16:18. Their
  texts below are **Clead's drafts within those decisions**, not
  approved copy; the boards read for this spec (a later version of the
  canvas) show an earlier draft of both, by Clead too;
- the prefilled address on the boards carries out the decision of
  16:36, which the decision of 17:07 replaced (a "Repository" field for
  `owner/repo`, PBI-1.17), so it is no one's now; see "Not in this
  item".

The values are written out below, so this spec does not depend on the
canvas. Every difference from the boards is listed with its reason under
"Differences from the mockup".

Clead's design, within that intent. **This is a presentation change.**
The token behaviour of 3.8 does not change: per-owner tokens, the token
and owner rules, storage under `vizi.githubTokens`, every write starting
from what is stored, the `storage` events, the 401 rule, the migration
of `vizi.githubToken`, which requests carry a token, and the messages.
Each control below is mapped to the 3.8 behaviour it carries, and every
3.8 rule holds. Nothing new is written to the browser's storage: the
panels' folded or opened state is not kept.

**Not in this item.**

- The address field's input. PBI-1.17 (the product owner's decision of
  2026-11-04, 17:07, "Apyr", on Clead's recommendation, recorded in the
  product office's `DECISIONS.md`, #399) makes it one "Repository"
  field, where the user types `owner/repo`; a full GitHub address pasted
  into it, with or without `/tree/<branch>`, still works, and the token
  is still picked by the owner. It replaces the 16:36 decision to
  prefill `https://github.com/`. PBI-1.17 has its own spec change (3.1,
  "The Repository field") and is built before this item
  (`docs/BACKLOG.md`: after PBI-1.14, before PBI-1.16). The field's
  label text, value, placeholder and input behaviour are PBI-1.17's:
  this item leaves them as PBI-1.17 has built them, and does not test
  them. It sets only the row (the field and "Open") and its layout.
- "Open a project from GitHub" stays as approved copy: it is the
  section's heading (below). The "Repository" field's label, and how
  it sits under that heading, are PBI-1.17's, settled in 3.1, "The
  Repository field": the label "Repository" above the row, under the
  heading.
- A local folder: the page has none (PBI-1.14, 3.11), which is built
  before this item. The redesign has no folder input.
- The branch picker (PBI-1.15) and the saved repos list (PBI-1.12) come
  after this item, in the redesigned page; they are not specified here.

#### The page's structure

From top to bottom (Clead's design; the mockup's structure):

1. `<header>` (the banner): the `h1` and the help control.
2. `<main>`: the start wrapper of 3.10 (the "Open a project from GitHub"
   section, the message line `#message`, the "Private repos" panel, then
   the results `#results`), and the help view's `<section>` as the
   wrapper's sibling (3.10).
3. `<footer>`: the font notice (below, "The font").

`index.html` holds `<div id="app">` in place of today's
`<main id="app">`; the page builds the three parts inside it, so there
is one `main` landmark. The start column (the address section, the
message line and the panel) is centred, at most 760 px wide. The results
use the page's full width, inside the same side padding, since the board
needs it.

#### The header

- The `h1` holds "vizi" (24 px, weight 700, letter-spacing -0.01em)
  and, after a space, "backlog visualizer" in a `<span>` (15 px, weight
  400, muted), on one baseline, 12 px apart. Its accessible name is
  "vizi backlog visualizer". The document title stays
  "Vizi - backlog visualizer".
- The help control of 3.10, "How to make your project vizi compatible"
  (15 px), at the header's right. It stays a `<button type="button">`
  styled as a link, as 3.10 sets out (see "Differences from the
  mockup").
- Padding 20 px 48 px, a 1 px line below it.

#### "Open a project from GitHub"

- The section's heading, an `h2` that labels the section, word for
  word "Open a project from GitHub" (15 px, weight 600), approved copy.
  On the boards it is the field's label; from PBI-1.17 the
  "Repository" field has its own label, whose text, and how it sits
  under the heading, are PBI-1.17's.
- A `<form id="url-form">` (as today) with, on one row, the address
  field `#url-input` (48 px high, grows to fill the row, 16 px text,
  radius 8 px) and the button `#open-url`, "Open" (48 px high, padding
  0 24 px, 16 px, weight 600, the primary style), 8 px apart.
  Submitting it starts the load of 3.1, as today; Enter in the field
  submits.
- The field's label, attributes, value and placeholder are as PBI-1.17
  leaves them; this item changes only the field's size and style.
- Under the row, one line of static text (14 px, muted), word for word:
  "Public repos open without a token. Private repos need a token for
  their owner. All access is read-only: vizi never changes anything on
  GitHub."
- The section's parts are 10 px apart; the start column's sections are
  28 px apart, with 72 px above the first on desktop. While the opening
  guide is in use, its message line `#guide-message` sits between the
  address row and the access line, as its select sits in the row under
  the decision of 22:47 (3.1, "Guided opening"; Clead, 2026-11-05, #85).
- The message line `#message` (`role="status"`, as today) follows the
  section and takes no space while it is empty.

#### The "Private repos" panel

A `<section>` (border 1 px, radius 8 px, the card background), whose
first child is an `h2` holding one `<button type="button">`, the
panel's toggle:

- the toggle (at least 56 px high, the full width, padding 0 18 px, 15
  px) shows a chevron (an inline SVG, `aria-hidden="true"`, pointing
  right when folded and down when opened), "Private repos" (weight 600)
  and, at its right, the summary (muted);
- it has `aria-expanded` (`false` when folded) and `aria-controls`
  naming the panel's body, which has `hidden` while folded. Using the
  toggle (click, Enter or Space) folds or opens the panel and leaves the
  focus on it;
- the panel is folded whenever the page opens. Its state is not stored.

**The summary** is made by a pure function of the owners held and of
whether a token from an earlier vizi is waiting (3.8, "Migration"):

- folded: "No tokens", "1 token: `<owner>`", or "`<n>` tokens:
  `<owner>`, `<owner>`, …", the owners in the order of the rows;
- opened: "No tokens", "1 token" or "`<n>` tokens" (the rows show the
  owners);
- with a token from an earlier vizi waiting, either form is followed by
  "; a token saved by an earlier vizi needs its owner".

It is updated whenever the tokens change, here or through another tab's
`storage` event (3.8). It names owners only, never a token or a masked
token.

**The body** (padding 0 18 px 18 px) holds, in this order:

1. **One row per owner**, in a list (`ul#token-list`, labelled "Tokens"),
   one `li` per owner held (`data-testid="token-line"`,
   `data-owner="<owner>"`), each row at least 56 px high with a 1 px
   line above it. On desktop the row is a grid of four columns, 170 px,
   the rest, 190 px and 96 px, 12 px apart:
   - the owner (`data-testid="token-owner"`, weight 600);
   - the masked token of 3.8, "`github_pat_…`" and the token's last four
     characters (`data-testid="token-text"`, monospace, 14 px, muted).
     The token is never shown in full (3.8);
   - a checkbox "Remember in this browser"
     (`data-testid="token-remember-owner"`, 18 px box, 14 px label),
     ticked exactly when the owner's token is saved. Ticking or
     unticking it is 3.8's "Remember" for that owner: ticking saves it,
     unticking removes the saved copy and keeps the token for this page
     only; a browser that refuses to save leaves it unticked and the
     message line of the panel says 3.8's "The browser would not save
     the token; it is kept for this page only.";
   - a button "Forget" (`data-testid="token-forget"`, 40 px high, the
     secondary style, accessible name "Forget the token for
     `<owner>`", as today). It is 3.8's "Forget" for that owner, with
     its message and its effect on results and on a running load.

   The row replaces today's "Tokens in use" line and its heading. The
   words "saved in this browser" and "for this page only" are no longer
   written in the row: the ticked or unticked box says it (see
   "Differences from the mockup").
2. **A token saved by an earlier vizi**, while the old key holds one (3.8,
   "Migration"): one highlighted block (`#token-migrate`, padding 14 px,
   radius 8 px, 4 px above it, the alert colours), a group labelled by
   its sentence:
   - the sentence (`data-testid="migrate-line"`, 14 px): "**A token saved
     by an earlier vizi** (`github_pat_…` and its last four characters)
     has no owner yet. Whose repos is it for?";
   - on one row, 8 px apart: the label "Owner" for `#migrate-owner` (220
     px wide, 40 px high, placeholder "e.g. factoincognito"), the button
     `#migrate-keep` "Keep" (the primary style) and the button
     `#migrate-forget` "Forget it" (transparent, with the alert border).
   - "Keep" is 3.8's "Keep for this owner": it moves the token into
     `vizi.githubTokens` for that owner with "Remember" ticked, then
     removes the old key, and refuses an owner that breaks the owner
     rule with 3.8's message. "Forget it" is 3.8's migration "Forget":
     it removes the old key. The token is used for no load until it has
     an owner. This block replaces today's second form.
3. **"Add a token"**, a group labelled by its `h3` "Add a token" (15 px,
   weight 600), with 18 px above it, a 1 px line above that, and 14 px
   between the migration block and the line:
   - on desktop, one grid row of two columns, 170 px and the rest, 8 px
     apart, aligned at the bottom:
     - the label "Owner" (13 px, muted) over `#owner-input` (44 px high,
       placeholder "owner", `autocomplete="off"`, spellcheck off);
     - the label "Fine-grained token, read-only" (13 px, muted) over
       `#token-input` (44 px high, `type="password"`, placeholder
       "github_pat_…", `autocomplete="off"`, spellcheck off);
   - under it, one row: the checkbox `#token-remember`, "Remember in
     this browser", off until the user ticks it (3.8), at the left, and
     the button `#token-use`, "Add" (44 px high, at least 96 px wide,
     the primary style), at the right. The box comes before "Add" in
     the page and in the tab order, because "Add" reads the box when it
     is used (3.8; `src/main.ts`): a box ticked after "Add" saves
     nothing. The phone board has this order; the desktop board put
     "Add" in the fields' row (see "Differences from the mockup");
   - the panel's message line `#token-message` (`role="status"`, as
     today), which takes no space while empty;
   - the saved-token note `#token-note` (13 px, muted), Clead's draft
     within the decisions of 16:17 to 16:18 (its first two sentences)
     and 3.8, "The shared origin" (its last), word for word: "If you
     tick Remember, the token is saved in this browser: anyone who can
     use this browser on this device can open your private repos with
     it. On a shared computer, leave Remember unticked: the token then
     lasts only until you close or reload this page. Other
     factoincognito Pages sites share this page's storage and can reach
     the tokens, saved or not.";
   - the token guide (below), folded.

   "Add" is 3.8's "Use": it takes the token only with an owner that
   matches the owner rule and a text that matches the token rule, keeps
   it in memory for that owner, saves it when "Remember in this browser"
   is ticked, replaces a token already held for that owner, clears the
   token field, and shows 3.8's messages. The Owner field is filled from
   the address field's owner until the user types in it, as 3.8 sets
   out. None of these fields is inside a `<form>` (3.8). Enter in the
   token field does nothing, as today (PBI-1.10 lists it).
4. **"Forget all tokens"**: the button `#token-forget-all` (40 px high,
   the secondary style), at the right, 14 px below "Add a token",
   shown while any token is held. It is 3.8's "Forget all", with its
   message and effects; as today it leaves the old key and its block.

#### The token guide (the product owner's decision of 16:11)

Inside "Add a token", under the note: a box (padding 14 px 16 px,
border 1 px, radius 8 px, the page background) whose toggle is a
`<button type="button">` (at least 32 px high on desktop and 44 px on a
phone, 14 px, weight 600) with a chevron and the text "How do I make a
read-only token?", with `aria-expanded` (`false` at first) and
`aria-controls` naming the steps, which have `hidden` while folded. It
is folded whenever the page opens, and its state is not stored.

Opened, it shows an ordered list (14 px, line height 1.45, 6 px apart).
Its text is **Clead's draft within the decision of 16:11**, not approved
copy (the decision came after the approved version). The steps follow
GitHub's own documentation (see "The guide, checked against GitHub's
documentation"); the words in bold are GitHub's labels, written exactly
as GitHub's documentation writes them, and nothing else is bold:

1. On GitHub, click your profile picture in the upper-right corner, then
   **Settings**. In the left sidebar, click **Developer settings**, then,
   under **Personal access tokens**, **Fine-grained tokens**. Click
   **Generate new token**. (If GitHub asks, verify your email address
   first.)
2. Under **Token name**, enter a name, for example "vizi". Under
   **Expiration**, choose when the token expires.
3. Under **Resource owner**, choose the owner of the repos, for example
   fomo-t. A token reads only that owner's repos, so make one per owner.
4. Under **Repository access**, choose **Only select repositories**, then
   pick the repos vizi should read under **Selected repositories**.
5. Under **Permissions**, give the repository permission **Contents**
   read access, not write. Leave everything else as it is: GitHub adds
   **Metadata** read access by itself.
6. Click **Generate token**, copy the token, and paste it above, with its
   owner.

After the list, one paragraph: "If the owner is an organisation that
requires approval of fine-grained tokens, you can enter a justification
below **Resource owner**. The token is then pending, and reads only
public repos, until an organisation administrator approves it. A token
made by an owner of the organisation is approved at once."

The guide's text, like the access line and the note, is static data in
a module (`src/start.ts`), built into the one inline script, rendered
with the page's `h()` helper and `textContent` (3.7, 3.10, "Rendering
path"). Bold parts are explicit `<strong>` parts of the data, not
Markdown. No example in it holds a token: no part of the text matches
`github_pat_[A-Za-z0-9_]{10,}` (3.10).

#### The guide, checked against GitHub's documentation

Checked on 2026-11-04 against the source of GitHub's documentation, the
repo `github/docs` at commit `e44c283a7f901f63aead1ea13cf9062956706e24`
(its `main` that day), file
`content/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens.md`
(blob `eed00bf0b64880e2aa32f630eb3c0c01ab90cbf2`),
section "Creating a fine-grained personal access token", with the
reusables it includes (`data/reusables/user-settings/access_settings.md`,
`developer_settings.md`) and the variables of `data/variables/product.yml`
(`pat_generic_caps` is "Personal access token", `pat_v2` "fine-grained
personal access token"). It was read through git, not through a website:
this session's GitHub API refused the contents request for `github/docs`
(403, the repo not enabled for the session), so the same file was read
from a git fetch of that commit.

What the documentation says, step by step, and where the guide takes it:

| Guide | GitHub's documentation (at `e44c283`) |
|---|---|
| 1 | "In the upper-right corner of any page on GitHub, click your profile picture, then click **Settings**." "In the left sidebar, click **Developer settings**." "In the left sidebar, under **Personal access tokens**, click **Fine-grained tokens**." "Click **Generate new token**." The first step on GitHub.com: "Verify your email address, if it hasn't been verified yet." |
| 2 | "Under **Token name**, enter a name for the token." "Under **Expiration**, select an expiration for the token." |
| 3 | "Under **Resource owner**, select a resource owner. The token will only be able to access resources owned by the selected resource owner." |
| 4 | "Under **Repository access**, select which repositories you want the token to access." "If you selected **Only select repositories** in the previous step, under the **Selected repositories** dropdown, select the repositories that you want the token to access." |
| 5 | "Under **Permissions**, select which permissions to grant the token." The repository permissions table: display name "Contents", access levels `read`, `write`; display name "Metadata", access level `read`. On Metadata: the page's example URL sets only `contents=read`, and the page says it creates "a token with `contents:read` and `metadata:read`". |
| 6 | "Click **Generate token**." |
| Note | "Optionally, if the resource owner is an organization that requires approval for fine-grained personal access tokens, below the resource owner, in the box, enter a justification for the request." "… your token will be marked as `pending` until it is reviewed by an organization administrator. Your token will only be able to read public resources until it is approved. If you are an owner of the organization, your request is automatically approved." |

How the guide differs from the earlier draft on the boards (both
Clead's): every step is reworded to the documentation's labels and
order. Step 1 gains the profile picture, the left sidebar and the email
check; step 2 "Under **Token name**" and "Under **Expiration**"; step 3
a sentence on one token per owner; step 4 "**Selected repositories**";
step 5 the Metadata sentence and "read access, not write"; step 6 says
"copy the token" in place of "copy it: GitHub shows it only once"; and
the organisation paragraph is new. What the guide does not say, and
why:

- **"Read-only".** The earlier draft said to set Contents to
  "Read-only". The documentation names the access levels `read` and
  `write` and does not give the label GitHub's token page shows for
  them, so the guide says "read access, not write" instead of a label
  that was not checked.
- **"GitHub shows it only once".** The earlier draft's last step said
  so; the section read does not say it, so the guide does not.
- Description, single sign-on and the token limit: optional or not
  about this use; left out to keep the steps short.

Whether GitHub's live token page matches the documentation at that
commit was not checked (no GitHub sign-in in this session). This
settles section 4, item 19, for the labels the guide and the help view
use.

#### The font

**Source and licence, under the product office's third-party policy**
(`policies/third-party-ip.md` v1.0, Appendix A.1 and A.3 "Documentation,
images, fonts and icons", and the `third-party-code-policy` skill, read
2026-11-04 at product-office `31187c4`).

- One line, as the skill asks: Inter, rsms/inter @ v4.1 (`e3a3d4c`), SIL
  Open Font License 1.1, commercial product (the stricter reading for a
  public tool), so copy/adapt: bundle a subset, with attribution.
- **Source:** `https://github.com/rsms/inter`, tag `v4.1`, commit
  `e3a3d4c57d5ecc01453a575621882a384c1995a3` (2024-11-15), whose
  `version.txt` reads `4.1`. The release was found from the repo's tags
  through git: `v4.1` is the highest version tag (after `v4.0`). This
  session's GitHub API refused the releases request for `rsms/inter`
  (403, the repo not enabled for the session), so GitHub's own "latest
  release" flag was not read.
- **Files used:** `docs/font-files/Inter-Regular.woff2` (111268 bytes,
  SHA-256
  `e06f6b1bc553aaea4e4668023ed0ab0a147129c3107f511bc7d03d361b0ae085`),
  `docs/font-files/Inter-SemiBold.woff2` (114812 bytes,
  `5cb7103e4e605989afebc03d989c79201e54b21b5183db33981f70db9178a301`)
  and `docs/font-files/Inter-Bold.woff2` (114840 bytes,
  `fa888127b6da015b65569f0351f3b5c391ad928904951f1c20e9f8462a8d95ea`),
  from that commit's tree. Their name tables give "Copyright 2016 The
  Inter Project Authors", the family "Inter", version "4.001", and the
  licence "This Font Software is licensed under the SIL Open Font
  License, Version 1.1. …".
- **Licence, as read from `LICENSE.txt` at `v4.1`** (blob
  `9b2ca37b3ffc77391d8b2ebef4a974ef32bf46ea`): "Copyright (c) 2016
  The Inter Project Authors (https://github.com/rsms/inter)", then "This
  Font Software is licensed under the SIL Open Font License, Version
  1.1.", followed by the full OFL 1.1 text (26 February 2007). No
  Reserved Font Name is given after the copyright statement, so a
  modified version (a subset) may keep the name "Inter" (OFL condition
  3 names no reserved name to avoid).
- **Category and mode:** the policy's "Docs, images, fonts" row and A.3:
  "OFL fonts: bundle freely, but don't sell the font on its own". Mode:
  copy/adapt, a subset bundled in the page, with attribution. No
  escalation is needed.
- **Intended use:** the font of vizi's own page, which is published
  (GitHub Pages) and so counts as shipped. vizi does not sell the font,
  alone or otherwise (OFL condition 1). **Lawful access:** a public
  release on GitHub under the OFL.
- **What the OFL asks, and how vizi meets it:**
  - condition 2, the copyright notice and the licence with each copy:
    the subset files keep every name record (so the copyright, nameID 0,
    and the licence, nameIDs 13 and 14, stay in each file, checked on a
    trial subset); the repo holds the licence text in full; the page
    shows a notice that links to it (below);
  - condition 5, the font stays under the OFL: the files in
    `src/fonts/` are under the OFL 1.1, not under vizi's own licence,
    and `THIRD-PARTY-NOTICES.md` says so;
  - condition 4: the authors' names are used only to credit them.

**What is bundled** (Clead's design):

- Three static weights, 400, 600 and 700, the ones the mockup uses (its
  Google Fonts link asked for `wght@400;600;700`). No italic: the
  start page has none; the rendered Markdown's emphasis is drawn by the
  browser as an oblique of the regular face.
- Each is subset with fontTools 4.68.0 (MIT licence), run by hand once,
  not in the build and not in CI, with the Python Brotli module 1.2.1
  (MIT licence) for WOFF2; the output's bytes depend on both versions:

  ```
  pyftsubset Inter-<Weight>.woff2 \
    --unicodes="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+2192" \
    --layout-features='kern,liga,calt,ccmp,locl,mark,mkmk' \
    --name-IDs='*' --name-languages='*' --flavor=woff2 \
    --output-file=inter-latin-<weight>.woff2
  ```

  The range covers ASCII, Latin-1 (Swedish included), the dashes, curly
  quotes, the bullet, the ellipsis of the masked token and an arrow. A
  trial run on 2026-11-04, with those two versions, gave files of 14336,
  14712 and 14600 bytes (about 58 KB in the page as base64, against
  about 455 KB unsubset), with the SHA-256 (400)
  `09f7060b39c4ab7cf05a457d226c1c73bf2108eddce324a7c9239a7899932e46`,
  (600) `734665df975d0e5d308812a9cbade0df719eefe837f950815fff29a84a910b1e`
  and (700)
  `0fa8884cf33c85e2be6c8aef4e22a6d855ecaae049a267fcdc95cb47fc3ca6a9`;
  Crog's review of PR #57 got the same sizes and hashes. The builder's
  files are expected to match them.
- The three files are committed as `src/fonts/inter-latin-400.woff2`,
  `inter-latin-600.woff2` and `inter-latin-700.woff2`. The exact command,
  the fontTools and Brotli versions, and the SHA-256 of the three source
  files and
  of the three results are recorded in their `THIRD-PARTY-NOTICES.md`
  entry, so the subset can be made again.
- Characters outside the range fall back to the system stack: a
  project's text in, say, Greek or Japanese is shown in the system font.

**How it is built into the one page, within the policy of 2.3:**

- `src/style.css` has three `@font-face` rules, family "Inter", weights
  400, 600 and 700, `font-style: normal`, `font-display: swap`, the
  `unicode-range` above, and `src: url("./fonts/inter-latin-<weight>.woff2")
  format("woff2")`. The build inlines each file into the page's one
  `<style>` block as a `data:font/woff2;base64,…` URL, so the page still
  loads nothing but its own document. Whether `vite-plugin-singlefile`
  2.3.3 inlines files of this size with its default settings was not
  checked; if it does not, the build sets Vite's `assetsInlineLimit` so
  that it does. A test checks the result either way.
- The policy gains one directive, `font-src data:`. It allows fonts from
  `data:` URLs only, so the page's own inlined fonts load, and a font
  from any host is still refused. `'self'` is not used: the fonts are
  in the document, and a page opened from disk has no useful `'self'`.
  A font can reach the page in two ways, and both stay closed to
  anything but the build: an `@font-face` rule needs a style, and
  `style-src` allows only the build's own hashed style; the `FontFace`
  API needs a script, and `script-src` allows only the build's own
  hashed script. So `data:` admits only the build's fonts.
- `font-family` for the page: `Inter, system-ui, sans-serif`. Code, the
  masked token and the umbrella view's pointers use the monospace stack
  `ui-monospace, Menlo, Consolas, monospace`, as the mockup does for the
  masked token.
- The web pack's rule (2.3), "No CDN scripts, web fonts, images or other
  external requests", is read as the approved summary reads it: what
  the page loads. A font inside the document is not a request. The load
  check of `e2e/smoke.e2e.ts` stays as it is.

**The notice in the page.** The policy (rule 5) asks that required
notices reach the end user. The page's `<footer>` (13 px, muted, 24 px
above it, centred under the start column) reads: "Font: Inter,
copyright 2016 The Inter Project Authors, SIL Open Font License 1.1.
Third-party notices", where "Third-party notices" links to
`https://github.com/factoincognito/vizi/blob/main/THIRD-PARTY-NOTICES.md`
in a new tab with `rel="noopener noreferrer"` (3.7 item 4). The page
makes no request for it.

**`THIRD-PARTY-NOTICES.md`**, a new file at the repo's root (the policy's
rule 5; the repo has none yet). Its entry for Inter:

- Inter 4.1, `https://github.com/rsms/inter`, tag `v4.1`, commit
  `e3a3d4c57d5ecc01453a575621882a384c1995a3`;
- "Copyright (c) 2016 The Inter Project Authors
  (https://github.com/rsms/inter)";
- licence: SIL Open Font License 1.1, full text in
  `licenses/OFL-1.1-Inter.txt` (a new file holding `LICENSE.txt` at
  `v4.1`, word for word);
- what is used: a subset of three weights, in `src/fonts/`, built into
  `dist/index.html`; modified (subset) under the OFL, not sold on its
  own, and the files in `src/fonts/` are under the OFL 1.1, not under
  vizi's licence;
- how the subset was made: the source files and their SHA-256, the
  command, fontTools 4.68.0 (MIT) and Brotli 1.2.1 (MIT), and the
  SHA-256 of the results.

#### Light, dark and phone

**Colours** (the mockup's, as CSS variables in `src/style.css`; light,
then dark under `prefers-color-scheme: dark`):

| Variable | Light | Dark | Used for |
|---|---|---|---|
| `--bg` | `#ffffff` | `#111111` | page, guide box; every field in light, the panel's fields in dark |
| `--fg` | `#111111` | `#f2f2f2` | text |
| `--muted` | `#555555` | `#a8a8a8` | tagline, access line, summary, masked token, field labels, note |
| `--line` | `#dcdfe4` | `#3a3a3a` | header line, panel border, row lines |
| `--card` | `#f6f7f9` | `#1c1c1c` | panel background; the address field in dark |
| `--accent` | `#0b5cad` | `#7db7f5` | links, primary buttons, focus ring |
| `--accent-hover` | `#08427d` | `#a9d0fa` | link and primary button hover |
| `--on-accent` | `#ffffff` | `#0b1a2b` | text on primary buttons |
| `--control-border` | `#858c97` | `#7a7a7a` | field and secondary button borders |
| `--alert-bg` | `#fff4d1` | `#4a3a00` | the migration block, blockers waiting on the product owner |
| `--alert-fg` | `#4a3500` | `#ffe9a6` | text on it |
| `--alert-border` | `#8f7a30` | `#c9a93a` | the migration block's field and "Forget it" |

The rest of the page (board, list, status, report, umbrella, help view)
uses the same variables, so it takes the new values; its layout does not
change. Today's values change slightly (`--muted` `#5a5a5a` to
`#555555`, `--line` `#d0d0d0` to `#dcdfe4`, `--card` `#f6f6f6` to
`#f6f7f9`, `--alert-bg` `#fff1c2` to `#fff4d1`). The dark values of
`--alert-bg` and `--alert-fg` are today's (the mockup's dark board does
not show the migration block).

**Contrast** (WCAG 2.2 formula, computed 2026-11-04 for every pair the
page uses; the browser test checks them again, below). Text, at least
4.5:1: `--fg` on `--bg` 18.88 light, 16.87 dark; `--fg` on `--card`
17.62, 15.22; `--muted` on `--bg` 7.46, 7.94; `--muted` on `--card` 6.95,
7.17; `--accent` on `--bg` 6.67, 8.96; `--accent` on `--card` 6.22,
8.09; `--on-accent` on `--accent` 6.67, 8.32; `--on-accent` on
`--accent-hover` 10.07, 10.94; `--alert-fg` on `--alert-bg` 10.62, 9.21.
Placeholders (`::placeholder`, also text) use `--muted`: 7.46 light and
7.94 dark on `--bg` (the migration block's field included, whose
background is `--bg`), and 7.17 on the dark address field's `--card`.
Field borders and the focus ring, at least 3:1 (WCAG 1.4.11):
`--control-border` on `--card` 3.16 light, 3.97 dark, on `--bg` 3.39,
4.40; `--alert-border` on `--alert-bg` 3.83, 4.86; `--accent` as the
focus ring on `--alert-bg` 6.07, 5.25.

**Phone** (below 800 px wide, the width at which the board turns into
columns; the mockup's phone board, at 390 px; tested at 375 px):

- header: padding 18 px 20 px; "vizi" 22 px and "backlog visualizer" 14
  px on one line, 10 px apart; the help control (14 px) on its own line
  under it, 6 px between;
- the start column: padding 24 px 20 px, sections 22 px apart; the
  address section's parts 8 px apart;
- the address field above the "Open" button, which takes the full width
  (48 px high);
- the panel: toggle at least 52 px high, padding 0 14 px, summary 14 px;
  body padding 0 14 px 14 px;
- each owner's row in two lines, 8 px apart, padding 12 px 0: the owner
  and the masked token (13 px) at both ends of the first; "Remember in
  this browser" and "Forget" (44 px high) at both ends of the second;
- the migration block: the sentence, then the Owner field across the
  width, then "Keep" and "Forget it" on one line (44 px high);
- "Add a token": the labels and fields one under another (fields 44 px
  high, 15 px text); then "Remember in this browser" and "Add" (44 px
  high, padding 0 22 px) at both ends of one line; then the message
  line, the note and the guide's toggle (at least 44 px high);
- every control at least 44 px high, a checkbox counting by its label,
  which holds the box and is the target a tap hits; no sideways scroll
  at 375 px, long
  owner names wrapping (`overflow-wrap: anywhere`, as today).

#### Accessibility

- **Labels.** Every field has a visible `<label for>`: the address
  field's (its text is PBI-1.17's), the two "Owner" fields,
  "Fine-grained token, read-only".
  Every checkbox is inside its label. The two Owner fields are told
  apart by their groups: the migration block is a `role="group"`
  labelled by its sentence, "Add a token" a `role="group"` labelled by
  its `h3`. A row's checkbox has the accessible name "Remember in this
  browser, `<owner>`" (`aria-labelledby` naming its label and the row's
  owner), so the visible label stays in the name; a row's "Forget" has
  "Forget the token for `<owner>`", as today.
- **The folded panels are buttons.** The "Private repos" toggle and the
  guide's toggle are `<button type="button">` with `aria-expanded` and
  `aria-controls`; the body they control has `hidden` while folded, so
  nothing in it can be focused. Not `<details>`: a button with
  `aria-expanded` is what the approved mockup has, and it keeps the
  "Private repos" toggle inside the `h2`.
- **Headings.** The `h1` in the header; the `h2` "Open a project from
  GitHub"; the panel's `h2` holding its toggle; "Add a token" an `h3`.
  The results' `h2` (the project's name) and their `h3` are as today. No
  level is skipped on the start page. (3.10's heading test looks only at
  the `h1` and the help view's section, so it is not affected.)
- **Keyboard.** Every control is a native element in the page's tab
  order, in the order of the page: the help control, the address field,
  the opening guide's select when shown (from PBI-1.19, 3.1 "Guided
  opening"), "Open", each saved repo's open button and "×" when the
  list is shown (from PBI-1.12, 3.14), the panel's toggle, then, when
  opened, each row's checkbox and "Forget", the migration block's
  field, "Keep" and "Forget
  it", the Add fields, "Remember in this browser", "Add", the guide's
  toggle, "Forget all tokens", and the footer's link. Enter and Space
  work on buttons and checkboxes. No key is caught by the start page;
  Escape stays the help view's (3.10).
- **Focus.** `:focus-visible` shows a 2 px `--accent` outline, 2 px
  off the control, on every control. When the tokens change and the
  rows are drawn again, the focus stays on the same control of the same
  owner's row. When the focused control is gone (its row was forgotten,
  here or in another tab, the migration block went, or "Forget all
  tokens" was used and hid itself), the focus moves to the panel's
  toggle. A load never moves the focus (3.10), with one exception from
  PBI-1.15: a failed pick whose button had the focus (3.13,
  "Accessibility").
- **Messages** stay in the two `role="status"` lines, `#message` and
  `#token-message`, as today. A message is never carried by colour
  alone; the highlighted migration block also says what it is in words.
- **Contrast** as in the table above. Text is real text.

#### Differences from the mockup, and why

Against the boards read for this spec. Points 3 to 6 are about the note
and the guide, which are Clead's drafts within the decisions of 16:11
and 16:17 to 16:18 (see the start of this section): they list how the
drafts here differ from Clead's earlier drafts on the boards, not
changes to approved copy.

1. **The help link is a button**, styled as the mockup's link. The
   mockup has `<a href="#help">`; 3.10 settles that the view has no hash
   and no address, and that the control acts inside the page.
2. **Field and secondary button borders are darker**: `#858c97` (light)
   and `#7a7a7a` (dark) in place of the mockup's `#b9bec6` and
   `#5a5a5a`, and the migration block's `#8f7a30` and `#c9a93a` in place
   of `#b9a25a`. The mockup's borders are 1.74:1 to 2.74:1 against
   their backgrounds, under the 3:1 WCAG asks of a field's edge.
3. **One wording at every width.** The phone board says "Remember" and
   "this phone" / "a shared device", the desktop board "Remember in this
   browser" and "this computer" / "a shared computer". The page cannot
   tell a phone from a narrow window, and one label keeps one accessible
   name for the tests and for screen readers, so both widths use
   "Remember in this browser" (it fits at 375 px), and the note says
   "this device" and "a shared computer" (the product owner's words of
   16:18).
4. **The note keeps the shared-origin sentence on a phone**, which the
   phone board leaves out: 3.8 asks for it next to the token field.
5. **The note says the tokens are reachable "saved or not"**, where the
   board says "saved tokens too": 3.8, "The shared origin", sets out
   that another site on the same origin can also script into the page
   and read a token held only in memory, which is not in storage. The
   board's wording would say less than is true. The note keeps the
   board's plain words "share this page's storage".
6. **The guide is reworded to GitHub's documentation**: every step
   takes the documentation's labels and order, it says "read access,
   not write" in place of "**Read-only**", it drops "GitHub shows it
   only once" (neither is in the documentation as read), and it adds
   the email check and the organisation-approval paragraph, which the
   documentation has. The full list is under "The guide, checked
   against GitHub's documentation".
7. **The address field's label, value and placeholder are not set
   here**: they are PBI-1.17's, which is built before this item (the
   decision of 17:07, a "Repository" field for `owner/repo`; see "Not
   in this item"). The boards' prefilled `https://github.com/` carries
   out the 16:36 decision, which 17:07 replaced, so no one builds it.
   "Open a project from GitHub", the boards' label for the field, stays
   as the section's heading.
8. **A footer with the font notice**, which the mockup does not have:
   the third-party policy's rule 5.
9. **The rows no longer say "saved in this browser" or "for this page
   only"** (3.8, "Never shown back in full", as built): the mockup shows
   the ticked or unticked box only. The box carries the same fact.
10. **The summary is "`<n>` tokens: owners" when folded and "`<n>`
    tokens" when opened**, as the two boards show; the singular, the
    empty case and the earlier token's words are Clead's, as the
    mockup shows none of them.
11. **Monospace for code and the masked token**, as the mockup itself
    does for the masked token; Inter for all other text. "One font
    everywhere" is read as one text font.
12. **On desktop, "Add" is beside "Remember in this browser", under the
    fields**, where the desktop board puts it at the end of the fields'
    row and the box under that row. "Add" reads the box when it is
    used, so the box comes first in the page and in the tab order;
    putting it first only visually (CSS order) would make the tab order
    differ from what is seen. The phone board already has this order.

#### Changes to the help view at the PBI-1.16 build

3.10 is not changed by this spec: PR #45 is building it now. The build
of PBI-1.16 makes these changes to the help view, in `src/help.ts`, its
tests and the text of 3.10, in the same PR as the start page, so the
help always names controls the page has:

1. **Where the control is** (3.10, "Opening and closing", first
   bullet): no longer 'under the "Vizi - backlog visualizer" heading',
   but in the page's `<header>`, at the right of the `h1` "vizi backlog
   visualizer" (on a phone, under it).
2. **What opening hides** (3.10, second and third bullets): the `h1`
   and the control are in the `<header>`, and the wrapper and the view's
   `<section>` are siblings in `<main>`. The control is then outside the
   wrapper, so opening the view sets `hidden` on the control and on the
   footer as well as on the wrapper, and closing removes all three.
   Everything else in 3.10 holds.
3. **Step 5's controls**: the step says to open "Private repos", type
   the owner and paste the token under "Add a token", tick "Remember in
   this browser" to keep it in this browser, and then "Add" (the box
   before "Add", as the page has them).
4. **Step 5's permission**: "the repository permission "Contents" with
   read access", the words the token guide uses, in place of "set to
   read-only"; and the sentence that the permission name is not yet
   checked becomes: checked against GitHub's documentation (section 4,
   item 19).
5. **The heading note** (3.10, "Accessibility"): the hidden wrapper
   holds the "Private repos" panel's `h2` and its "Add a token" `h3`, in
   place of the `h3` of "Tokens in use".
6. **The tests** (3.10, "Tests"): the control labels the help text
   names are "Private repos", "Owner", "Remember in this browser" and
   "Add", and they exist on the start page, inside the panel; the unit
   test checks that step 5 says "read access".

#### What changes in `src/` and around it (no code here)

- `index.html`: `<div id="app">` in place of `<main id="app">`.
- `src/main.ts`: `mount()` builds the header, `main` and footer; the
  address section's heading and the row's layout (the field's label
  and input as PBI-1.17 leaves them) and the access line; the panel
  (toggle, summary, rows, migration block, "Add a token", the note, the
  guide, "Forget all tokens") in place of `mountToken()`'s fields and
  lists; `tokenLine()` builds the new row; `renderTokens()` also updates
  the summary and "Forget all tokens", and keeps the focus as set out
  above. The token store calls, the event handling and the messages are
  those of today: `src/token.ts` and `src/github.ts` do not change.
  The ids of today's controls stay (`#url-input`, `#open-url`,
  `#owner-input`, `#token-input`, `#token-remember`, `#token-use`,
  `#token-forget-all`, `#token-message`, `#token-note`,
  `#token-migrate`, `#migrate-owner`, `#migrate-keep`,
  `#migrate-forget`, `#message`, `#results`), and so do the
  `data-testid`s, with `token-owner` added; `#token-status` and its
  "Tokens in use" heading go.
- `src/start.ts` (new, a pure module): the static texts (the access
  line, the note, the guide's steps and paragraph as text and bold
  parts, the footer notice), the docs commit the guide was checked
  against, and the summary function.
- `src/help.ts` (PBI-1.13, in PR #45 today): as listed under "Changes
  to the help view at the PBI-1.16 build".
- `src/style.css`: the colour variables above, the three `@font-face`
  rules, the font stacks, the layout of the header, start column,
  address row, panel, rows, migration block, "Add a token", guide and
  footer, the 800 px breakpoint, and the focus ring.
- `src/fonts/`: the three subset files (new).
- `src/csp.ts`: `font-src data:` in the policy.
- `vite.config.mts`: only if the fonts are not inlined by default (see
  "The font").
- `THIRD-PARTY-NOTICES.md` and `licenses/OFL-1.1-Inter.txt` (new).

#### Tests

Test first, as everywhere (2.2). With GitHub stubbed, synthetic tokens
`github_pat_TEST…`, in light and dark, at phone (375 px) and desktop
(1280 px) width, as the other page tests run.

- **Unit (Jest):**
  - `src/start.test.ts`: the access line and the note, word for word;
    the summary for no token, one, three, folded and opened, with and
    without an earlier token, and that it holds no `github_pat_`; the
    guide: six steps in order; every bold part is one of GitHub's labels
    as the documentation writes them ("Settings", "Developer settings",
    "Personal access tokens", "Fine-grained tokens", "Generate new
    token", "Token name", "Expiration", "Resource owner", "Repository
    access", "Only select repositories", "Selected repositories",
    "Permissions", "Contents", "Metadata", "Generate token"), and each of
    them appears; the text does not hold "classic", and no bold part
    reads "Read-only"; no part matches `github_pat_[A-Za-z0-9_]{10,}`;
    the recorded docs commit is
    `e44c283a7f901f63aead1ea13cf9062956706e24`;
  - `src/fonts.test.ts`: each of the three files starts with the WOFF2
    signature `wOF2`, is under 20 KB, and, its table directory read and
    its data decompressed with Node's Brotli, holds a `name` table with
    "Copyright 2016 The Inter Project Authors" and "SIL Open Font
    License, Version 1.1"; its SHA-256 equals the one in
    `THIRD-PARTY-NOTICES.md`; `licenses/OFL-1.1-Inter.txt` holds the
    copyright line and "SIL OPEN FONT LICENSE Version 1.1";
  - `src/csp.test.ts`: the policy, exactly, now with `font-src data:`;
  - `src/help.test.ts`: as under "Changes to the help view at the
    PBI-1.16 build".
- **Browser (Playwright), a new `e2e/start.e2e.ts`:**
  - the header: the `h1` "vizi backlog visualizer", the help control in
    the header; the `h2` "Open a project from GitHub", word for word;
    the address field and "Open" on one row on desktop, and
    "Open" under the field on a phone; the access line word for word.
    The field's label, value, placeholder and input are PBI-1.17's and
    are not tested here;
  - the panel folded at start, `aria-expanded="false"`, its body hidden,
    the summary as stated; opening it with Enter and with Space, then
    folding it; the focus stays on the toggle; reloading folds it again
    and writes nothing to storage (the storage keys before and after are
    the same);
  - two owners' rows, each masked and with its own box and "Forget";
    the accessible names of the boxes and buttons; the summary in both
    states;
  - the migration block: shown with an old-key token, highlighted, with
    "Keep" and "Forget it" doing what 3.8's tests check, and the summary
    naming it;
  - "Forget all tokens" shown only while a token is held;
  - the guide folded at start, opened with the keyboard, its six steps
    and paragraph equal to `src/start.ts`'s data;
  - the focus: after a row's "Forget", after "Forget all tokens", after
    "Keep" and after a forget in another tab, the focus is on the
    panel's toggle when its control is gone, and on the same control
    when it is not;
  - tab order as listed under "Accessibility";
  - contrast: for every visible text element of the start page, with the
    panel and the guide opened and a migration block shown, the ratio of
    its computed colour to its background is at least 4.5:1, and so for
    every field's placeholder (its `::placeholder` colour) against the
    field; for every field, its border to the background around it at
    least 3:1. "Its background" is the nearest opaque background: the
    element's own computed background colour if it is opaque, otherwise
    that of the nearest ancestor whose background is opaque (most
    elements' own background is transparent);
  - **the font loaded:** after `document.fonts.ready`, the test calls
    `document.fonts.load` for Inter at 400, 600 and 700, then checks
    that `document.fonts` holds exactly three `FontFace`s with the
    family "Inter", one each with the weights 400, 600 and 700, each
    with the `status` "loaded". (`document.fonts.check` is not used: it
    returns true when no face in the set matches, and the computed
    `font-family` is the declaration, not the font in use, so neither
    shows that Inter loaded);
  - phone: no sideways scroll at 375 px with the panel and the guide
    opened, two rows and a migration block; the Open button under the
    field; every control at least 44 px high: every button, field and
    toggle, and every checkbox's label (the box's tap target).
- **Every 3.8 behaviour test still passes on the new controls.**
  `e2e/token.e2e.ts` keeps every test and every assertion's meaning. Its
  changes are only of how it reaches the controls and of texts the
  redesign changes: it opens the panel before using a control inside it;
  "Use" becomes "Add", "Keep for this owner" "Keep", the migration's
  "Forget" "Forget it", "Forget all" "Forget all tokens"; the line text
  "`<owner>`: `github_pat_…1234`, saved in this browser" (or "for this
  page only") becomes three checks, `token-owner` "`<owner>`",
  `token-text` "`github_pat_…1234`", and the row's box ticked (or not);
  the label "GitHub token (for private repos)" becomes "Fine-grained
  token, read-only"; the note's "factoincognito Pages sites" check stays.
  The unit tests of `src/token.ts` and `src/github.ts` do not change.
- **The policy still blocks everything else.** `e2e/csp.e2e.ts` runs as
  today, with no violation and no console error, with the panel and the
  guide opened, and adds: the page's fonts load with no violation, by
  the same check as `e2e/start.e2e.ts` (three "Inter" faces, 400, 600
  and 700, each with the `status` "loaded"); a
  font from another host (an `@font-face` added at run time through
  `document.fonts.add` with a remote URL, and a stylesheet added at run
  time) is blocked; a script added at run time, a style attribute, a
  request to another host, an image from another host and a form post
  are still blocked.
- **The built page.** `e2e/subpath.e2e.ts` also checks that every
  `url()` in `dist/index.html` is a `data:font/woff2;base64,` URL (three
  of them) and that no `github_pat_[A-Za-z0-9_]{10,}` is in it. The load
  check of `e2e/smoke.e2e.ts` stays: the page requests only its own
  document. Whether Playwright reports a `data:` font as a request was
  not checked; if it does, the smoke check and the guard of
  `e2e/guard.ts` accept exactly the three `data:font/woff2` URLs found in
  the built page, compared in full, and nothing else.
- `e2e/help.e2e.ts` (PBI-1.13): the control labels step 5 names exist on
  the start page, inside the panel.

### 3.13 The branch picker (PBI-1.15)

**(approved)** The product owner's intent approval of 2026-11-04 (15:15,
"apyr", on Clead's recommendation; see "What is decided", item 12):
after a repo loads, a list of its branches, and picking one opens that
branch. The `/tree/<branch>` address keeps working.

Clead's design, within that intent. It is built after PBI-1.16, in the
redesigned page of 3.12, and before PBI-1.12.

**Independent of the address field.** PBI-1.17 (the product owner's
decision of 17:07: one "Repository" field for `owner/repo`, where a full
GitHub address pasted, with or without `/tree/<branch>`, still works)
may be built before this item or after it. The picker does not depend on
which: it never reads, writes or parses the address field. It works on
the reference of the project that loaded (owner, repo, branch, as 3.1
and `loadRepo` hold it), and a pick starts a load from such a reference,
not from text. Its tests open a project with a full address
(`https://github.com/<owner>/<repo>`), which both forms of the field
accept.

#### Where it sits, and the current branch

- Inside `#results`, right under the project's heading `#project-name`
  (and, from PBI-1.12, its "Save", 3.14) and before the status, one row
  (`#branch-picker`): the label
  "Branch", a native `<select id="branch-select">` and a button
  `#branch-open`, "Open branch"; under the row, the picker's message
  line `#branch-message` (`role="status"`), which takes no space while
  empty. It is part of the results: it is shown, hidden and cleared
  with them (3.1, 3.8 "Forget").
- The project's heading already reads "`<owner>/<repo>` (`<branch>`)",
  the branch the load read; that stays. The select shows the same
  branch as its selected option.
- **The options.** One `<option>` per branch name, its text the name
  as GitHub gives it, set with `textContent` (3.7: a branch name is
  untrusted text), its value the same name. The order:
  - the default branch first, with " (default)" after its name, when
    the page knows it: from request 1 of 3.1, so when the project was
    opened by an address without `/tree/<branch>`, or by a pick that
    followed such a load of the same repo. A project opened with
    `/tree/<branch>` makes no request 1, and the picker makes none to
    learn the default: no option is then marked (Clead's choice, to add
    no request);
  - then every other name, sorted by the names' character codes, as the
    documentation list of 3.4 is.
- **The current branch is always an option.** When the loaded branch is
  not among the names read (past the cap below, deleted since, or the
  list could not be read), it is added first, selected.
- **Names the page cannot open.** A name holding `#` or `%` is listed
  but disabled, with " (cannot be opened in vizi)" after it: 3.1 uses
  the branch as written in the anonymous request 3 (the
  raw.githubusercontent.com URL) and in github.com links (`blobUrl`),
  where those characters would end or change the path, and an address
  cannot carry `#` at all (3.1, "As built"). Git refuses `?`, spaces
  and control characters in branch names (`git check-ref-format`), so
  `?` cannot reach the list; the page disables it too, as a defence.
  The browser's URL parser encodes the other characters git allows in
  a path, so the names left are safe as written. (Clead's design; the
  alternative, encoding the branch in those two URLs, is section 4,
  item 27.)
- **While the list loads**, the select holds the current branch only,
  `#branch-picker` has `aria-busy="true"`, "Open branch" is disabled,
  and the message line says "Reading the branches…". When the list has
  been read, or has failed, "Open branch" is enabled and `aria-busy`
  removed; so no pick can start while the list loads.

#### Which request lists the branches

- `GET https://api.github.com/repos/<owner>/<repo>/branches?per_page=100&page=<n>`,
  `<owner>` and `<repo>` as in 3.1 (they hold only letters, digits,
  `.`, `_` and `-`, so they go as written), `<n>` from 1.
- Checked on 2026-11-04 against the source of GitHub's documentation,
  `github/docs` at `e44c283a7f901f63aead1ea13cf9062956706e24` (its
  `main` that day), read through git (this session's GitHub API refuses
  `github/docs`, as for 3.12):
  - `src/rest/data/fpt-2022-11-28/branches.json` (blob
    `f998136e515c2576ed4d157974d7b1f4383a01f3`), the operation "List
    branches", `GET /repos/{owner}/{repo}/branches`: the query
    parameters `protected`, `per_page` ("The number of results per page
    (max 100)", default 30) and `page` (default 1); the status codes 200
    and 404; the answer an array of "Short Branch" objects, each with a
    `name` string, a `commit` and `protected`; and, for programmatic
    access, `"fineGrainedPat": true`, the permission `"Contents"
    repository permissions: "read"`, and `"allowsPublicRead": true`;
  - `src/github-apps/data/fpt-2022-11-28/fine-grained-pat-permissions.json`
    (blob `0ea0357fb33360c4d474f81e0a9a15b5eafffb38`): under
    `contents`, "list-branches", `GET /repos/{owner}/{repo}/branches`,
    `"access": "read"`, `"additional-permissions": false`;
  - `content/rest/using-the-rest-api/using-pagination-in-the-rest-api.md`
    (blob `01e66579e9e6a033340ff8b730c42fed45ed7ff9`): "For most
    endpoints, the maximum value of `per_page` is `100`", and the `link`
    header for further pages.
  - The `2022-11-28` data is the REST API version a request without an
    `X-GitHub-Api-Version` header gets; vizi sends none. That GitHub
    serves that version by default was not checked in this
    documentation. It does not matter here: the file for the other
    version in it, `src/rest/data/fpt-2026-03-10/branches.json`, is the
    same blob, `f998136e515c2576ed4d157974d7b1f4383a01f3`.
- **The token.** The request goes with the token that the load it
  follows used (3.8, "A load keeps the token it started with for all
  its requests"): with one, in the `Authorization` header with
  `credentials: "omit"` and `cache: "no-store"`, as every request with
  a token is; without one, anonymously, which the documentation allows
  for a public repo (`allowsPublicRead`). The permission it needs is
  "Contents" read, which the read-only token of 3.8 and of the guide of
  3.12 already has; it needs no other permission
  (`"additional-permissions": false`). Metadata read, which GitHub
  adds to such a token itself (3.12), is not what this request needs.
  So the token stays read-only and nothing changes in 3.8 or in the
  guide. Like every request, the
  token is in no URL and no message (3.8).
- **Pages and the cap** (Clead's design). The page asks for page 1,
  then the next page only while the page before held exactly 100
  items (the answer's array length, counted before any item is skipped
  or a repeat dropped), up to page 3: at most three requests and 300
  items. It does not read the `link` header: whether `api.github.com`
  exposes it to a page (its `Access-Control-Expose-Headers`) was not
  checked, and counting a page's items needs no header. The requests
  run one after another, never in parallel.
- **Past the cap.** When page 3 also held 100 items, the repo may have
  more. The page lists the names it read, adds the current branch if it
  is not among them, and the message line says: "vizi lists the first
  300 branches GitHub gives. To open another branch, paste its address,
  https://github.com/<owner>/<repo>/tree/<branch>, with the branch's
  name in place of <branch>." The page writes the loaded project's
  owner and repo in place of `<owner>` and `<repo>` (for example
  "https://github.com/fomo-t/fomo-f/tree/<branch>"), so only the branch
  is left to type; `<branch>` stays as written. That address keeps
  working (the
  approved intent; 3.1, and PBI-1.17's field accepts a pasted full
  address). In which order GitHub gives the branches, and so which 300
  are listed, was not checked.
- **An answer read as a list** is a JSON array; each item that is an
  object with a non-empty `name` string gives one name, and any other
  item is skipped. A name that is there twice is listed once. An answer
  that is not an array is a failure: "GitHub's answer for the branch
  list was not understood."
- **When.** The list is read once, after a load opened from an address,
  by the umbrella view's "Open in vizi" (3.9) or by an entry of the
  saved repos list (3.14) has succeeded and its
  results are shown. A load started by the picker for the same owner and
  repo does not read it again: the list the page holds stays (it is the
  same repo's), and the select's selected option follows the branch
  loaded. So picking costs the load's own requests only. From PBI-1.19
  the opening guide of 3.1 ("Guided opening") lists branches with this
  same request before a load; the picker does not take its answer and
  reads its own list as here.
- **Requests in all.** With the picker, opening a repo makes the two to
  ten requests of 3.1 (or of 3.8 with a token; two to five without an
  include line, 3.15), then one to three to `api.github.com` for the
  branches. A pick makes the requests of a load with a named branch: no
  request 1, so one to nine (one to four without an include line).

#### Picking a branch

- The user chooses an option and uses "Open branch" (Enter or Space on
  the button, or a click). The select itself starts nothing when its
  value changes. (Clead's design: with the keyboard, some browsers
  change a closed select's value, and fire its change event, at each
  arrow key, which would start a load per branch passed; and WCAG 3.2.2
  asks that changing a control's value does not by itself change the
  page. That a given browser fires it so was not checked here. The
  approved "picking one opens that branch" is carried out by the choice
  and the button.)
- "Open branch" with the loaded branch selected does nothing.
- Otherwise it starts a load of `{owner, repo, branch}` of the project
  on the page with the chosen name: the load of 3.1 with a named
  branch, through the same code as an address, so its requests, the
  token chosen by the owner at that moment (3.8), the messages and the
  report are all as for an address with `/tree/<branch>`. It counts as a
  newer load (3.1, "Two loads at once"): an answer of any older load is
  dropped, and a second pick before the first has answered makes the
  first one older, so the newest pick wins. A pick cannot happen while
  the branch list loads: "Open branch" is disabled until it has been
  read or has failed (see "While the list loads").
- While it runs, the select and "Open branch" stay usable; the message
  line `#message` says "Loading…", as for any load.
- On success the results are those of the new branch, the heading reads
  "`<owner>/<repo>` (`<branch>`)", and the select shows that branch. On
  failure the results are cleared and hidden as for any failed load
  (3.1), with the load's message; the picker goes with them.
- **The default branch, again.** Picking the default branch is a load
  with that branch named, like any other.

#### The address after picking

- vizi has no address of its own to change: the page does not write its
  own URL, and reads it only for 3.16's `repo` parameter at startup; it
  keeps no history (3.9, 3.10), and a pick adds no history entry and no
  hash.
- The address field is left as it is (it is PBI-1.17's, and the picker
  never touches it, see above). Using the field's "Open" again opens
  what the field says, which may be another branch than the picked one.
- What PBI-1.12 ("Saved repos") saves for a picked branch is 3.14's:
  the branch, from the loaded reference.

#### Errors

The branch list's requests go through the same request code as a load
(`src/github.ts`), so their failures read as 3.1 and 3.8 set out, with
these effects (Clead's design):

- **401 with a token:** 3.8's rule: the token is forgotten if it is
  still the one held for that owner, the results loaded with it are
  hidden (the picker with them), and the message is 3.8's "GitHub
  refused the token for `<owner>`…", in the page's message line
  `#message`, not in `#branch-message`, which is hidden with the
  picker.
- **403 with `X-RateLimit-Remaining: 0`, any other 403, a 404, any
  other status, a network failure or an answer not understood:** the
  project stays shown; the picker holds what it read before the failure
  (or the current branch only) and its message line says "The branch
  list could not be read: `<message>`", where `<message>` is the one
  3.1 or 3.8 gives (for a 404: "GitHub answered HTTP 404 for `<URL>`.",
  as a request that is not request 1 or 2). When at least one page was
  read, it says "The branch list is incomplete: `<message>`" instead.
  Nothing is retried; opening the repo again reads the list again.
- An answer that arrives after a newer load has started, after a
  Forget of the token it carried, or after the results were hidden, is
  dropped, whether it succeeded or failed.

#### Accessibility

- The label "Branch" is a `<label for="branch-select">`; the select is
  native, so its options are read and chosen with the platform's own
  keys. A disabled option is a native disabled option.
- "Open branch" is a native button; its accessible name is its text.
- The row is a `role="group"` labelled "Branch". `aria-busy` is set
  while the list loads, and the message line is a `role="status"`.
- Focus: after "Open branch" the focus stays on the button, which stays
  in the page while the load runs and after it succeeds. The picker
  moves the focus in one case only, the one exception to 3.12's "A load
  never moves the focus": when a load started by "Open branch" fails
  and hides the results, and the focus is on "Open branch" at that
  moment (so it would be left on a hidden element), it moves to the
  message line `#message` (`tabindex="-1"`), which holds the failure's
  message. While the help view (3.10) is open, the wrapper that holds
  `#message` is hidden and the focus is in the view, so the focus is
  left alone; nothing else moves it either.
- Sizes and colours are 3.12's: the select and the button 44 px high on
  a phone and 40 px on desktop, `--control-border` for the select's
  border, the secondary style for "Open branch", the 2 px focus ring;
  contrast as in 3.12.

#### Phone layout

Below 800 px (3.12): the label above, then the select at the full
width, then "Open branch" at the full width, 8 px apart, each at least
44 px high. A long branch name is cut by the select itself, not
wrapped; the page has no sideways scroll at 375 px with a branch name
of 200 characters. On desktop: the label, the select (at most 420 px
wide) and the button on one row, 8 px apart.

#### Policy and storage

- The Content-Security-Policy of 2.3 does not change: `connect-src`
  already allows `https://api.github.com`, and the picker requests
  nothing else.
- Nothing is written to the browser's storage: the list lives in the
  page's memory with the results, and goes with them.
- The help view (3.10) is not changed by this item.

#### What changes in `src/` (no code here)

- `src/github.ts`: a `listBranches(ref, fetcher, token)` that makes the
  requests above through the existing request code and returns the
  names read, whether more may exist, and any failure; `loadRepo`
  also returns whether it learned the default branch (from request 1).
- `src/branches.ts` (new, pure): the parsing of one page, the merging of
  pages, the cap, the order, the current branch added, and which names
  are disabled.
- `src/main.ts`: the picker row in `#results`, the list read after a
  load, the load started from a reference by "Open branch", and the
  dropping of late answers.
- `src/style.css`: the picker row at both widths.

#### Tests

Test first (2.2), with GitHub stubbed and synthetic data.

- **Unit (Jest)**
  - `src/branches.test.ts`: a page answer read into names, skipping
    items that are not objects or have no `name` string, and an empty
    name; a duplicate listed once; an answer that is not an array is a
    failure; pages merged in order; the cap (pages of 100, 100 and 100
    items: "more may exist", also when one item of a page is skipped or
    a repeat, so the page counts 100 items for 99 names; 100 and 37
    items: not);
    the order (the default first with " (default)", then by character
    codes, so `B` before `a`); no default mark when the default is not
    known; the current branch added first when it is not in the list;
    names with `#` or `%` disabled, and `?` too as a defence, and
    others not.
  - `src/github.test.ts`, `listBranches` with a stubbed fetcher: the
    URL of each page (`/branches?per_page=100&page=<n>`); page 2 asked
    only after a page of 100, and never a page 4; with a token, each
    request has the `Authorization` header, `credentials: "omit"` and
    `cache: "no-store"`, and no URL holds the token; without one, no
    header; the 401, 403 (rate limit and other), 404 and network
    messages; a failure on page 2 returns page 1's names and the
    failure.
- **Browser (Playwright)**, in light and dark, at 375 px and 1280 px, the
  project opened with a full address:
  - after a load, the picker is under the heading, the select's
    selected option is the loaded branch, the default is first and
    marked, the others in order;
  - one branches request after a load whose first page holds fewer than
    100, and none to `raw.githubusercontent.com`;
  - "Open branch" on another name loads it: request 2 for that branch,
    the files of that branch, no request 1, no new branches request; the
    heading and the select show it;
  - choosing an option starts no request until "Open branch" is used,
    also when the option is changed with the arrow keys;
  - "Open branch" with the loaded branch selected makes no request;
  - newest wins: two picks in a row, the first answered last, show the
    second; "Open branch" is disabled while the branch list is due; an
    address load while the list is due drops the list's answer;
  - an address with `/tree/<branch>`: no request 1, the select shows that
    branch, and no option is marked default;
  - the cap: three pages of 100 give 300 options, the message with the
    loaded project's owner and repo written in, and no fourth request;
    the current branch past the cap is added first;
  - a name holding `#` is shown disabled; a name like
    `<img src=x onerror=alert(1)>` is shown as text and nothing runs;
  - with a token for the owner, the branches requests go to
    `api.github.com` with the header; a 401 on the list forgets the token
    and hides the results; a 403 with `X-RateLimit-Remaining: 0` shows
    the message and keeps the project; a failure on page 2 keeps page
    1's names with the "incomplete" message;
  - Forget of the owner's token hides the picker with the results;
  - the address field's value is the same before and after a pick (the
    test reads it and compares; it does not depend on what the field
    holds);
  - accessibility: the label and the group's name; `aria-busy` while
    the list loads; the focus stays on "Open branch" after a pick, and
    is on `#message` after a pick that fails while the focus was on
    "Open branch"; a pick that fails while the focus is elsewhere, and
    one that fails while the help view is open (the view opened after
    the pick, its focus on the view's `h2`), leave the focus where it
    was;
  - phone: no sideways scroll with a 200-character branch name; the
    select and the button at least 44 px high;
  - the CSP test of `e2e/csp.e2e.ts` passes with the picker shown, with
    no violation and no console error, and the page's requests stay
    within the guard of `e2e/guard.ts` (which already allows
    `https://api.github.com/`).

### 3.14 The saved repos list (PBI-1.12)

**(approved)** The product owner's intent approval of 2026-11-04 (11:59,
"apyr", on Clead's recommendation; see "What is decided", item 13): a
"Saved repos" quick-access list on the start page. "Save" adds the open
address, clicking an entry loads it (with the right token if private),
and "×" removes it. It is kept in the browser, addresses only, never
tokens. Other factoincognito Pages sites (trusted, under the Pages rule
of item 5) could read the repo names, not their contents.

Clead's design, within that intent. It is built after PBI-1.15, in the
redesigned page of 3.12.

**Independent of the address field.** As the branch picker (3.13), the
list never reads, writes or parses the address field, whose form is
PBI-1.17's. "Save" saves the reference of the project that loaded
(owner, repo, and the branch when the load named one), and an entry
starts a load from such a reference, not from text. "The open address"
of the approval is read as that reference: it is the address the page
has open, whatever was typed to open it.

#### Where it sits

- **The list**, in the start column of 3.12, between the "Open a
  project from GitHub" section (with the message line `#message` under
  it) and the "Private repos" panel, 28 px from each, as the column's
  sections are. A `<section id="saved-repos">` labelled by its `h2`,
  "Saved repos" (15 px, weight 600, the same style as the address
  section's heading), over a list `ul#saved-list` (border 1 px
  `--line`, radius 8 px, the card background, as the panel is; rows
  separated by 1 px lines).
- **The section is shown only while the list holds an entry.** With no
  entry, the start page is the approved page of 3.12 as it is. (Clead's
  choice: an empty list would add a section that says nothing.)
- **An entry** is one `li` (`data-testid="saved-entry"`), at least 44 px
  high, padding 0 6 px 0 14 px, holding:
  - a button (`data-testid="saved-open"`), the row's width but the last
    40 px, its text "`<owner>/<repo>`", or
    "`<owner>/<repo>` (`<branch>`)" for an entry with a branch, as the
    project's heading reads (3.13), 16 px, `--fg`, left-aligned,
    styled as a row, not a link; the text set with `textContent`,
    wrapping (`overflow-wrap: anywhere`);
  - a button "×" (`data-testid="saved-remove"`), 40 × 40 px, the
    secondary style without its border, with the accessible name
    "Remove `<owner>/<repo>` from Saved repos" (with " (`<branch>`)"
    after the repo for an entry with a branch); the "×" itself is
    `aria-hidden`.
- **"Save"** is with the loaded project, where "the open address" is: a
  button `#save-repo` in `#results`, at the right of the heading
  `#project-name` on desktop, under it on a phone, before the branch
  picker's row (3.13). The secondary style, 40 px high (44 px on a
  phone). It is part of the results: shown, hidden and cleared with
  them.
  - Its text is "Save" while the loaded reference is not in the list.
    When it is (saved here, in another tab, or before), its text is
    "Saved" and it has `aria-disabled="true"`: it stays focusable (a
    `disabled` button would drop the focus) and using it does nothing.
    When the entry is removed, here or in another tab, it is "Save"
    again.
- **Phone** (below 800 px, 3.12): the section as wide as the column;
  each entry's open button at least 44 px high, the "×" 44 × 44 px; a
  long name wraps inside its row; no sideways scroll at 375 px with an
  entry of a 100-character owner, repo and branch. "Save" under the
  heading, at the full width.

#### What is stored

- One `localStorage` key, `vizi.savedRepos`, holding JSON:
  `{"repos": [{"owner": "<owner>", "repo": "<repo>", "branch": "<branch>" | null}, …]}`.
  Each entry has exactly those three keys. Nothing else is stored: no
  token, no masked token, no mark of whether a repo is private, no
  file, status or result, no time.
- **What "Save" stores:** the loaded reference. `owner` in lower case,
  as 3.8 keeps owners; `repo` as the load had it; `branch` the branch
  the load named (a pick, 3.13, or an address with `/tree/<branch>`),
  or `null` when the load used the default branch, so the entry then
  follows the repo's default branch when it is opened. A pick of the
  default branch is a load with that branch named (3.13), so it is
  saved by its name, not as `null`: that entry stays on the named
  branch even if the repo's default branch changes later.
- **The rules an entry must meet** (Clead's design):
  - `owner` and `repo` match 3.1's name rule (letters, digits, `.`, `_`
    and `-`, not `.` or `..`), each at most 100 characters;
  - `branch` is `null`, or a string of 1 to 255 characters that is a
    name git allows for a branch and the page can open:
    - none of what `git check-ref-format --branch` refuses: a control
      character (U+0000 to U+001F, U+007F), a space, `~`, `^`, `:`,
      `?`, `*`, `[` or `\`; `..` or `@{` anywhere; `//`; a `/` at the
      start or end; a `.` at the end; a `/`-separated part that starts
      with `.` or ends with `.lock`;
    - and no `#` or `%`, which the page cannot open (3.13, "Names the
      page cannot open"), so an entry never holds one a pick would
      disable.

    Checked with `git check-ref-format --branch` on 2026-11-04: it
    refuses a name with each of those, and accepts names with `<`,
    `>`, `=` and `/` inside, such as `<img/src=x/onerror=alert(1)>`.
    So a stored branch can still hold markup, which is why the list
    sets its text with `textContent` and a test plants such a name.

  A load whose reference breaks them (not expected, since loads use the
  same rules) is not saved, and "Save" says "This address cannot be
  saved." in `#message`.
- **At most 50 entries** (Clead's choice; at most about 25,000
  characters of JSON, about 49 KB as `localStorage` counts UTF-16, more
  with characters outside the BMP). "Save"
  with 50 entries saves nothing and says "Saved repos holds at most 50
  repos. Remove one to save another." in `#message`.
- **One entry per reference.** Two entries are the same when their
  owners and repos are the same without regard to case (GitHub's
  documentation calls both "not case sensitive" for "List branches",
  section 4, item 18) and their branches are the same exactly (git
  branch names are case-sensitive), `null` matching only `null`. The
  same repo with two branches is two entries.
- **Order:** the newest save first. Opening an entry does not move it:
  nothing is written on a load.

#### Reading and writing

As 3.8 does for tokens (Clead's design):

- **Reading.** `JSON.parse`, then only own properties are read: the
  top-level object's own `repos` (`Object.hasOwn`), and each entry's own
  `owner`, `repo` and `branch`. Nothing is looked up by name on a plain
  object, and the de-duplication uses a `Map` whose key is exactly: the
  lower-cased owner, `/`, the lower-cased repo, then `@` and the branch
  as written for an entry with a branch, or `!` for one with `null`
  (for example `acme/widgets@Main` and `acme/widgets!`). An owner or
  repo holds none of `/`, `@` and `!` (3.1's name rule), so each part
  is found without doubt: `null` is never taken for a branch named
  `null`, and the branch is never lower-cased. An owner or repo named
  `__proto__`, `constructor`, `toString` or `hasOwnProperty`, which the
  name rule allows, is read as text and finds nothing an object
  inherits. A top-level `"__proto__"` key in the stored JSON is an own
  property after `JSON.parse` and is ignored like any other unknown key.
- **Cleaning.** At startup, and whenever a value is read:
  - a value that is not JSON, not an object (an array included), or
    whose own `repos` is missing or not an array, counts as no entries;
    at startup it is removed;
  - an entry that is not an object, or breaks the rules above, is
    dropped; so is an entry that repeats an earlier one; entries past
    the 50th are dropped; keys other than the three are not kept;
  - at startup, when cleaning changed the value, the cleaned value is
    written back (or the key removed when no entry is left).
- **Every write starts from what is stored.** Just before "Save" or
  "×" writes, the page reads the stored value, cleans it, changes only
  the entry it is about (adds it first, or removes it), and writes the
  result. An entry another tab added or removed is never undone. With
  no entry left, the key is removed.
- **The list is drawn from storage.** The page keeps no list of its own:
  it draws the section from the stored value after its own writes and
  on every `storage` event, so every tab shows what is stored. When it
  draws the list again, the focus stays on the same control (the open
  button or "×") of the same entry, as 3.12 sets for the token rows; an
  entry is the same by the de-duplication key below. Only when that
  entry is gone does the focus rule of "Removing an entry" apply.
- **Storage refused.** When `localStorage` cannot be used (3.8,
  `browserStorage()` gives `null`) or a write throws, nothing is saved
  and "Save" says "The browser would not save the repo." in `#message`;
  the section shows what could be read, or is hidden. A read
  (`getItem`) is made inside the same `try`: some browsers throw on it
  when storage is blocked after the page opened. A read that throws
  counts as no entries, and nothing is written back.

#### Other open vizi tabs

- Each tab listens for the `storage` event of `vizi.savedRepos`. It
  draws the list again from the event's `newValue`, cleaned (a removed
  key, or a `key` of `null` when all of storage was cleared, counts as
  no entries), and updates "Save" for the project it shows. Following an
  event never writes, so events do not echo between tabs.
- Results shown stay: an entry removed in another tab does not touch a
  project that is open here.

#### Opening an entry

- Using an entry's open button starts a load of its reference: the
  load of 3.1 through the same code as an address, with the branch
  named when the entry has one (no request 1) and the default branch
  otherwise. The token is the one held, at that moment, for the entry's
  owner (3.8, "Which token a load uses"), so a private repo opens with
  the right token, and with none held it gets 3.1's 404 message, which
  says to add a token for its owner.
- It counts as a newer load (3.1, "Two loads at once"): any older
  load's answer, the branch list's of 3.13 included, is dropped, and of
  two entries used in quick succession the newer wins.
- Its results are those of any load: the heading, the status, the tabs,
  "Save" (now "Saved"), and the branch picker, which reads the branch
  list as after an address load (3.13, "When").
- The address field is not touched, and the page's own URL does not
  change (3.13, "The address after picking").
- A failed load clears and hides the results as any failed load does
  (3.1). The entry stays in the list: a repo that cannot be read now is
  removed only by "×".
- Drawing the list makes no request: nothing is fetched for an entry
  until it is used.

#### Removing an entry

- "×" removes that entry from storage as above, and nothing else: the
  results shown, the tokens and the other entries stay.
- **Focus** (Clead's design): after "×", the focus moves to the open
  button of the entry that took its place, or of the one before it when
  it was the last; when the list is now empty and the section hidden,
  it moves to the address section's heading `h2` "Open a project from
  GitHub" (`tabindex="-1"`), not to the field, which is PBI-1.17's. An
  entry removed in another tab moves the focus here only if the focus
  was on that entry's buttons, by the same rule. When the list is drawn
  again and the focused entry is still there, the focus stays on the
  same control of it ("Reading and writing"). Nothing else in the list
  moves the focus; opening an entry leaves it on the open button,
  which stays while the load runs. While the help view (3.10) is open
  the list is hidden in the wrapper, and the focus is left alone.

#### The shared origin, and tokens

- **Tokens are never stored here.** The value holds owners, repos and
  branches only. "Save" never reads the token store, and the token
  store never reads this key. A Forget or "Forget all tokens" (3.8)
  leaves the list as it is, and a 401 forgets the token only.
- **What other Pages sites can do** (2.2, 3.8 "The shared origin"):
  read the names of the saved repos, as the approval says, but not their
  contents, which are never stored; and write entries of their own into
  the key. A planted entry is only an address, cleaned by the rules
  above and shown as text. Using it does what typing its address does:
  a read-only load, with the token held for its owner, whose results
  only this page shows. It adds no way to read a token or a private file
  that the shared origin does not already give (3.8).
- The Content-Security-Policy of 2.3 does not change: the list itself
  makes no request, and an entry's load makes the requests of 3.1, 3.8
  and 3.13 only.
- The help view (3.10) and the token guide (3.12) are not changed.

#### Accessibility

- The section is labelled by its `h2`. The entries are a list, so a
  screen reader announces their number.
- Each open button's accessible name is its text; each "×" has its own
  name, so the many "×" buttons are told apart.
- "Save" in its "Saved" state has `aria-disabled="true"` and keeps its
  place in the tab order.
- Messages go to the page's `role="status"` line `#message`.
- Tab order: the address section (the field, the opening guide's select
  of 3.1 when shown, then "Open"), then each entry's open button and "×"
  in turn, then the "Private repos" panel.
- Sizes, colours, focus ring and contrast as in 3.12: the open buttons
  use `--fg` on `--card` (17.62:1 light, 15.22:1 dark); the "×" uses
  `--fg` too.

#### What changes in `src/` (no code here)

- `src/saved.ts` (new, pure): the entry rules, reading and cleaning a
  stored value, de-duplication, adding and removing, the cap, the
  display text, and writing the value; a store over a `Storage` given
  to it, as `src/token.ts` has.
- `src/main.ts`: the section, "Save" in the results, the `storage`
  listener, loading an entry by reference, the focus rule.
- `src/style.css`: the section and its rows at both widths, and "Save".

#### Tests

Test first (2.2), with GitHub stubbed and synthetic data.

- **Unit (Jest), `src/saved.test.ts`:**
  - the rules: owners and repos that pass and fail 3.1's rule and the
    100-character limit; branches `null`, valid, empty, 256 characters,
    with `#` or `%`, and each form git refuses (below);
  - reading: not JSON, an array, no `repos`, `repos` not an array, an
    entry that is not an object, an entry with a bad field, extra keys
    dropped on writing, entries past the 50th dropped; a top-level
    `"__proto__"` key ignored; owners and repos named `__proto__`,
    `constructor`, `toString` and `hasOwnProperty` read as names, saved,
    found and removed, and nothing found for them when not saved;
  - de-duplication: owner and repo without regard to case, branch
    exactly, `null` only with `null`, the first kept;
  - adding first, no change when already there, the cap's refusal;
    removing one entry; the key removed when the last goes;
  - the written value holds only `owner`, `repo` and `branch`, and no
    `github_pat_` even when a token store on the same storage holds
    tokens;
  - two stores on one storage, interleaved: store A adds X, store B
    (which drew its list before) adds Y, and the stored value holds
    both; store A removes X, store B then adds Z, and X stays removed;
  - storage that throws on writing: nothing saved, the refusal
    returned;
  - the display text and the "×" name, with and without a branch;
  - the de-duplication key: `Acme/Widgets` and `acme/widgets` with
    the same branch are one entry, the branches `Main` and `main` two,
    and `null` and a branch named `null` two;
  - the branch rule against `git check-ref-format --branch`: each
    refused form above is refused, and `<img/src=x/onerror=alert(1)>`,
    `a=b` and `feature/x` pass;
  - a storage whose `getItem` throws: no entries, and nothing written.
- **Browser (Playwright),** in light and dark, at 375 px and 1280 px,
  projects opened with a full address (which PBI-1.17's field accepts
  too):
  - with nothing stored, no section, and the start page as 3.12's
    tests expect;
  - "Save" after a load: the entry appears first, "Save" reads "Saved"
    with `aria-disabled="true"` and keeps the focus; a reload shows the
    entry; the stored value is the expected JSON;
  - a load of the default branch saves `"branch": null`; a pick (3.13)
    or a `/tree/<branch>` address saves the branch; the same repo twice
    with two branches makes two entries;
  - an entry's open button loads it: its requests (no request 1 for an
    entry with a branch), the heading, "Saved"; with a token held for
    the owner, the requests go to `api.github.com` with the header; with
    none, a private repo's 404 message; the address field's value is the
    same before and after;
  - newest wins: two entries used in quick succession, the first
    answered last, show the second; an entry used while a load from the
    address is due drops the older answer;
  - "×" removes the entry and leaves the results; the focus moves as
    set out, to the heading when the list empties; "Save" for the shown
    project is "Save" again;
  - the cap: 50 stored entries, "Save" refused with its message and no
    write;
  - startup: a planted malformed value is cleaned and written back; a
    planted entry whose repo holds markup is dropped by the name rule;
  - a planted entry whose **branch** is `<img/src=x/onerror=alert(1)>`
    (a name git allows, which passes the cleaning) is drawn: the open
    button's text and the "×" accessible name hold that string as text,
    no `img` element is created anywhere in the page, and nothing runs
    (`window.__pwned`-style check, and no console error);
  - the focus kept on a redraw: the focus on entry B's open button,
    another tab saves X, and the focus is still on B's open button; the
    same with the focus on B's "×";
  - a second tab: an entry saved, removed, and storage cleared in one
    tab are shown in the other, which writes nothing on the event;
  - drawing the list makes no request (the page's requests at startup
    stay as in 2.3, with entries stored);
  - no `localStorage` value under `vizi.savedRepos` holds `github_pat_`
    after saving a private repo opened with a token; a Forget, "Forget
    all tokens" and a 401 that forgets the token leave the list as it
    was;
  - storage refused: "Save" shows its message and the section stays
    hidden;
  - accessibility: the section's name, the entries as a list, the "×"
    names, the tab order; with the help view open, a removal in another
    tab moves no focus;
  - phone: no sideways scroll with a long entry; the buttons at least
    44 px high;
  - the CSP test of `e2e/csp.e2e.ts` passes with entries shown, with no
    violation and no console error;
  - "Save" after a guided open (3.1, "Guided opening"; PBI-1.12 is built
    after PBI-1.19): `null` for a guided open of the default branch, the
    name for another branch.

#### As built (PBI-1.12)

Clead's design, as the build reads the points above leave open:

- **The code.** `src/saved.ts` holds the entry rules (`isSavedName`,
  `isSavedBranch`), the de-duplication key (`savedKey`), reading and
  cleaning (`readSaved`), the texts (`displayText`, `removeLabel`) and
  the messages, and `createSavedStore(storage)`, whose `start`,
  `entries`, `has`, `add` and `remove` read the stored value on every
  call and keep nothing in memory. `src/main.ts` draws the section from
  `entries()` after its own writes, and from the event's `newValue` on a
  `storage` event of `vizi.savedRepos`, which the token code then does
  not handle (an event whose `key` is null, all of storage cleared,
  empties the list and goes on to the tokens, 3.8); each entry's `li`
  carries its de-duplication key as `data-key`, which the focus rule
  follows.
- **Cleaning.** Entries are read in order; one that breaks the rules or
  repeats an earlier one is dropped, and the first 50 that remain are
  kept. At startup the value is written back when the cleaned entries,
  written, differ from the stored text (so a value that only differs in
  layout is written once in the page's own form); an object whose
  `repos` leaves no entry is removed. Lengths are counted as JavaScript
  counts a string (UTF-16 code units).
- **Owners as stored.** "Save" writes the owner in lower case. An entry
  stored with another case (by another site of the origin, or by hand)
  is kept and shown as stored; it is the same entry as the lower-case
  one by the de-duplication key.
- **"Saved".** Using it (Enter, Space or a click) does nothing: the
  page checks its `aria-disabled` before saving. A successful "Save"
  writes nothing in `#message`; a refused one writes its message there
  and leaves the results as they are.
- **"×" refused by storage.** 3.14 gives a message for "Save" only. A
  removal whose write the browser refuses changes nothing and writes no
  message; the list, drawn from storage, still shows the entry, and the
  focus is put on that entry's "×".
- **The layout.** "Save" is the next sibling of `#project-name` in
  `#results`, before `#branch-picker`. On desktop the heading is an
  inline block with no vertical margin and "Save" sits after it on the
  same line, centred on it; on a phone both are blocks, the heading 8 px
  above "Save", which is at the full width, 44 px high. At both widths
  `#branch-picker` starts 12 px under the lower of the two. The `h2`
  "Open a project from GitHub" has `tabindex="-1"` for the focus rule
  of "Removing an entry".
- **The focus when an entry goes.** "×" gives the removed entry's key
  and its position in the list as drawn, so where the focus goes does
  not depend on whether the click focused the button (WebKit does not
  focus a button on a click). The entry that took its place is the one
  now at that position, or the last entry when that position is past the
  end. A removal in another tab moves the focus by the same rule, and
  only when the focus was on that entry's buttons.
- **Tests.** `src/saved.test.ts`, `e2e/saved.e2e.ts`, and one test in
  `e2e/csp.e2e.ts`. Two tests of earlier items change with the new
  elements: 3.13's order of `#results` (`e2e/branches.e2e.ts`) has
  `#save-repo` between the heading and the picker, and 3.10's heading
  test (`e2e/help.e2e.ts`) lists the hidden `h2` "Saved repos".

### 3.15 The include keyword (PO-105)

**Status: built (PBI-1.34, PR #98).** Intent approval: Adam,
2026-11-07 01:05, product-office DECISIONS.md (in chat, "Po-105 apyr";
PR #576 there; recorded as a comment on PR #93; "What is decided", item
17). The build (product-office PO-105 step 3) made the changes listed
below ("What changes in `docs/BACKLOG-FORMAT.md`", "What changes
elsewhere at the build") to 2.3, 3.1, 3.2, 3.5, 3.7, 3.8, 3.13, section
4 and `RULES.md` L § 5 (1); the rules I1 to I11 are now section 6 of
`docs/BACKLOG-FORMAT.md`. "As built (PBI-1.34)", at the end of this
section, records how the code reads the points the text below leaves
open.

**What the product owner asked for** (2026-11-06, 12:38, in chat;
recorded in the product office's `DECISIONS.md` and as its backlog item
PO-105): a file vizi reads can, by
a keyword, make an inline reference to another file, and vizi then loads
that file as well. First use: the product office's `BACKLOG.md` refers
to its `BACKLOG-DONE.md`, so the finished entries show in vizi's folded
`DONE` column again. Since the product office moved its `DONE` entries
to that file (product-office #520), vizi does not show them: it reads
only `BACKLOG.md`, `docs/BACKLOG.md` and `docs/PRODUCT_BACKLOG.md`
(`BACKLOG_PATHS` in `src/github.ts`, read at `main` `58b6e17`) and
follows no reference in a backlog file (3.1, 3.4). At 12:42 he put it
in the unattended batch (recorded in the same file), to be built there
once he had approved this spec, which he did at 01:05 on 2026-11-07.

**(approved)** Clead's proposals, shown to the product owner at 12:39,
and approved by him on 2026-11-07 (01:05, "Po-105 apyr"):

1. **The keyword** is an HTML comment, `<!-- vizi:include <path> -->`,
   on a line of its own. A comment is not shown where GitHub renders the
   file (not checked here; section 4, item 32), and vizi already drops
   comments before reading (`docs/BACKLOG-FORMAT.md`, R9), so the line
   changes nothing else in the file's reading.
2. **The path** is relative to the including file, in the same repo and
   on the same branch.
3. **Only backlog files include,** at first: the backlog file vizi reads
   (3.1), not `STATUS.md` or `PROJECTS.md`.
4. **One level only:** an include inside an included file is not
   followed, and is listed on the Report tab, as is a missing file.
5. **Included entries show on the board and in the list** like the
   file's own entries, each naming its file.

He approved them, and the answers to the six questions they left
open, each as Clead proposed it: seven points in all ("Decisions on
the open questions", at the end of this section). Everything else
below is Clead's design within those approved points (product-office
`RULES.md` § 6 (2) and (4)), and changes through a reviewed PR like
any spec change.

#### The rules (for `docs/BACKLOG-FORMAT.md`, new section 6)

Word for word as they go into `docs/BACKLOG-FORMAT.md` at the build
(below, "What changes in `docs/BACKLOG-FORMAT.md`"); they carry no
marker of who decided what, which that file gives in its own way.
"The backlog file" is the one file of the three paths that vizi reads
(section 1 there). Inside the rules, "section `<n>`" and the rule
numbers (R0 to R9, S1 to S5) are that file's own; a section of this
spec is written `docs/SPEC.md` 3.`<n>`, as that file writes it.

**I1. Include line.** A line of the backlog file, at column 0, outside
a fence (R7) and outside a comment that opened on an earlier line (R9),
whose text, without trailing spaces and tabs (U+0020 and U+0009 only:
other white space, such as a no-break space, is not trimmed, so a line
that ends in one has text after its `-->`, I2), is exactly `<!--`, one
or more spaces, `vizi:include`, one or more spaces, the path, one or
more spaces, `-->`, and nothing else: the pattern
`^<!-- +vizi:include +((?:(?!-->)[^ \t])+) +-->$`, where the path
holds no space, no tab and no `-->`
(R9 closes the comment at the first `-->`, so a path that holds one
leaves text after the comment: such a line looks like an include, I2).
The keyword is written in lower case, exactly. The include line is read
in the same first pass that finds fences and comments (R7, R9), and is
then dropped as any comment is, so the file's other lines are read as
if it were not there (a dropped comment leaves a blank line, which ends
no description, R4).

**I2. A line that looks like an include** but is not one by I1 is not
followed, and is reported (not read): a comment (R9) whose text, after
the `<!--` and any spaces or tabs, starts with `vizi:include` followed
by a space, a tab, `-->` or the end of the line, and that is not an
include line by I1: for example one that is indented, has text after
its `-->`, has no path or more than one word between the keyword and
the `-->`, has no space before the `-->`, has a tab where I1 has
spaces or a tab in the path, or does not close on its line. A comment
that starts in any other way (`<!-- vizi:Include x -->`,
`<!-- vizi x -->`) is an ordinary comment: dropped, and not reported.
Text that R9 does not read as a comment, such as a `<!--` after other
text on an entry's line, is never an include and is not reported.

**I3. The path.** One or more segments joined by single `/`s, each
segment made of letters A to Z and a to z, digits, `.`, `_` and `-`,
the last ending in `.md` (lower case, as `docs/SPEC.md` 3.4 reads `.md`). It is read
relative to the folder of the backlog file: from `BACKLOG.md`, the
project's root; from `docs/BACKLOG.md` or `docs/PRODUCT_BACKLOG.md`,
`docs/`. A `.` segment is dropped and a `..` segment removes the segment
before it, as `docs/SPEC.md` 3.7 item 4 resolves a relative link. The path is not
followed, and is reported (not read), when it:
- starts with `/` (an absolute path);
- holds any other character, such as `:` (so a URL, `https://…`, is
  refused), `\`, `%` or a letter outside A to Z and a to z (a
  space or a tab never reaches I3: I1's path holds neither, and a line
  with one in its path looks like an include, I2);
- has an empty segment (`a//b.md`) or ends with `/`;
- leaves the project's root once `.` and `..` are resolved
  (`../x.md` from `BACKLOG.md`, `../../x.md` from `docs/BACKLOG.md`);
- does not end in `.md`.

The checks are made in two steps (Clead's design). First the form, on
the path as written, in the order of the list above: a leading `/`, a
character outside the set, an empty segment or a trailing `/`, a last
segment not ending in `.md`. The first that fails gives I3's general
message, and the path is not resolved. Only a path of the right form is
then resolved, segment by segment from the backlog file's folder; it
leaves the project when a `..` has no segment before it to remove, at
any step, as `resolvePath` in `src/markdown.ts` returns `null` for a
relative link, and gets the "leaves the project" message. So
`../x.txt`, `/../x.md` and `a//../b.md` get the general message, and
`../x.md` from `BACKLOG.md` and `a/../../x.md` the "leaves" message.

**I4. The included file** is the path resolved by I3, in the same repo,
at the same branch as the backlog file. It is followed only when the
file list (`docs/SPEC.md` 3.1, request 2) holds it. A path the file list does not hold
is not followed and is reported (not read); no request is made for it.
The root's `STATUS.md` and `PROJECTS.md` are not followed either, and
are reported (not read): vizi reads them in their own way (`docs/SPEC.md` 3.3, 3.9),
and following them would read the same file twice in one load (Clead's
design).

**I5. Itself and twice.** An include whose resolved path is the backlog
file's own is not followed, and is read with a warning. An include
whose resolved path an earlier include line of the file named and
followed is not followed again, and is read with a warning: the file is
read once, at its first include line, whether that read succeeded or
failed (`docs/SPEC.md` 3.15, "A failed read of an included file"), so a failed file is not
asked for twice. The checks are made in the order
I2, I3, I5, I4, I7, and a line gets the first that applies, so a path
the file list lacks, or one past the cap, is reported by I4 or I7 each
time it is named.

**I6. One level.** In an included file, a comment that is an include
line by I1 or looks like one by I2 is not followed, and is reported
(not read), on the included file's line. Nothing an included file names
is read.

**I7. At most five.** At most five included files are read for one
backlog file. An include line after the fifth one
followed is not followed and is reported (not read). An include that
is followed counts towards the five whether its read succeeds or fails
(`docs/SPEC.md` 3.15, "A failed read of an included file"); lines refused by I2 to I5 do not
count.

**I8. Reading an included file.** An included file is read on its own
with every rule of sections 2 and 3, as a backlog file is: its own line
numbers (R8), its own headings and groups (R5, R6; an entry above its
first heading has no group, whatever heading of the backlog file stands
above the include line), its own fences and comments, and its own
report. Every entry it gives is an entry of the backlog, and knows the
file it came from.

**I9. Where its entries go.** In the backlog's order
of entries, which the board's columns and the list keep (`docs/SPEC.md` 3.2), an
included file's entries stand where its include line stands: after the
backlog file's entries above that line, and before those below it.

**I10. The same ID in two files.** An entry whose ID an entry of another
file of the same backlog has, earlier in the order of I9, is read with
a warning (both are read; the later one gets it), as an entry with the
same ID as an earlier entry of its own file is (section 3). It is a
separate warning, naming the other file and its line. An entry gets at
most one such warning, naming the first entry, in the order of I9, that
has the same ID and is in another file (Clead's design); an ID repeated
within one file keeps its own warning besides.

**I11. Other files.** An include line by I1 in `STATUS.md` (the
project's own, or a folder pointer's, `docs/SPEC.md` 3.9) or in `PROJECTS.md` is not
followed and is reported (info), so a writer sees why nothing came of
it. An include line in a fence is never an include, so
a format file can show one, as this one does.

Example (made up). This `BACKLOG.md`:

```markdown
## Open

- **[NOW] AB-3** — Draw the chart.
<!-- vizi:include BACKLOG-DONE.md -->
<!-- vizi:include ../OLD.md -->
- **[NEXT] AB-4** — Export the chart.
```

with this `BACKLOG-DONE.md` next to it:

```markdown
## Open

- **[DONE] AB-1** — Read the data. See [the notes](notes/data.md).
- **[DONE] AB-3** — Draw a first chart.
<!-- vizi:include MORE.md -->
```

is read as four entries, in this order: AB-3 (`BACKLOG.md` line 3),
AB-1 and AB-3 (`BACKLOG-DONE.md` lines 3 and 4), AB-4 (`BACKLOG.md`
line 6). AB-1 and the second AB-3 name `BACKLOG-DONE.md`; their group is
"Open" of `BACKLOG-DONE.md`, and the link in AB-1 goes to
`notes/data.md` beside `BACKLOG-DONE.md`. The report holds, in the
order the Report tab lists them: under Not read, `BACKLOG.md` line 5,
the path leaves the project (I3), and `BACKLOG-DONE.md` line 5, an
included file cannot include (I6); under Read with a warning,
`BACKLOG-DONE.md` line 4, the ID AB-3 is also used in `BACKLOG.md` line
3 (I10). `MORE.md` is not read, whether or not
it exists. The list (`docs/SPEC.md` 3.2; `docs/SPEC.md` 3.15, "What the page shows") shows the groups
"Open" (AB-3), "Open — `BACKLOG-DONE.md`" (AB-1, AB-3) and "Open"
again (AB-4).

#### Requests

- **Which, and in what order.** A load (3.1, 3.8) reads the backlog file
  with request 3, finds its include lines (I1 to I7), and then reads each
  included file with one more request 3, in the order of their include
  lines, one after another, before `STATUS.md` and `PROJECTS.md`, which
  follow as today. So the order of a load's requests 3 is: the backlog
  file, the included files, `STATUS.md`, `PROJECTS.md`, each only when
  the file list holds it.
- **How.** An included file's request is request 3 as 3.1 and 3.8 make
  it, with the load's branch and token: without a token,
  `GET https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>`,
  the path as resolved by I3, unencoded (I3 allows only characters that
  need no encoding, and its resolution drops every `.` and `..`
  segment, so `./DONE.md` and `old/../DONE.md` are sent as
  `DONE.md`);
  with a token, the contents API on `api.github.com`, each segment
  percent-encoded, with the token in the `Authorization` header,
  `credentials: "omit"` and `cache: "no-store"`. A load keeps the token it
  started with for all its requests, these included.
- **A replaced load** (Clead's design, within 3.8 as built). A load
  replaced by a newer one makes no further request with its token (3.8,
  "Which token a load uses"): the page's fetch refuses before the request
  is made. An anonymous replaced load is not stopped, as today: its
  remaining requests, included files among them, are still made, and
  their answers are dropped. The guard's refusal reaches `loadRepo` as a
  network failure ("The request to `<host>` failed."), so the included
  file it stops is a failed read under "A failed read of an included
  file", each later included file is refused the same way before it
  reaches the network, and a later `STATUS.md` or `PROJECTS.md` read
  fails the load. None of it is shown: the load the guard stopped is
  already replaced, so its result is dropped, whatever it is (3.1, "Two
  loads at once"; 3.8, newest wins).
- **How many.** Without an include line, a load makes the requests it
  makes today. With included files, one more request 3 for each file
  read, at most five (I7): a load makes two to ten requests, not two to
  five. A path the file list does not hold, and every include refused by
  I2 to I7, costs no request. The branch list of 3.13 and the opening
  guide of 3.1 do not change.
- **A failed read of an included file** (decided point 4: the load goes
  on, only a 401 fails it, and the page says what is missing; the detail
  below is Clead's design):
  - **401 with a token:** as 3.8, for any request of the load: the token
    is forgotten if it is still the one held for the owner, and the load
    fails with 3.8's 401 message.
  - **Any other failure** (a 404, a file deleted since request 2, a 403,
    the rate limit, any other status, a network failure): the load does
    not fail. The backlog file's entries and the other included files'
    entries are shown, and the include is reported (not read), on its
    include line: "Not read: `<path>` could not be read: `<message>`",
    `<message>` being 3.1's or 3.8's for that request. The later
    included files, `STATUS.md` and `PROJECTS.md` are still read.
- **A private repo.** Without a token held for the owner, requests 1 or
  2 already answer 404 and the load stops with 3.1's message, before any
  include is read. With one, the included files are read with that
  token, as the backlog file is; a token that can read the backlog file
  can read the repo's other files (3.8's "Contents: read" covers the
  repo), so 3.8 and the token guide of 3.12 do not change. "Forget",
  "Forget all" and a 401 hide the included entries with the rest of the
  results (3.8).
- **The Content-Security-Policy (2.3) does not change:** the requests go
  to `raw.githubusercontent.com` or `api.github.com`, as request 3 does.
- **The one exception to the external-requests rule** (decided point
  7). An included file's request is named by text in a fetched file,
  not by anything the user typed. Three texts in effect say otherwise
  until the build changes them:
  - 2.3: "every such request follows something the user typed", and
    its list of "the only requests the page ever makes" (Clead's design,
    in the paragraph after 2.3's **(approved)** reading, which is
    "fetching a backlog after an address is typed is allowed");
  - 3.7 item 5: "Nothing in the content makes the page request
    anything", and its list of the page's only requests;
  - this repo's `RULES.md` L § 5 (1), which rests on that approval:
    "Content the page shows never makes a request of its own".

  The product owner decided (2026-11-07 01:05) that include lines are
  the one exception to those three texts. Clead's reasoning for it, given
  with the proposal and not part of his decision: an include line is the
  project's instruction to vizi's reader, as the three backlog paths
  are; it is never shown (I1); its requests belong to the load the user
  started by typing an address, go only to the same repo and branch on
  the same two hosts, and are at most five (I7). The build changes the
  three texts as "What changes elsewhere at the build" sets out.

#### What the page shows

- **Board.** Included entries are in the columns of their markers with
  the backlog file's own (3.2), in the order of I9; the column counts
  count them. So an included file's `DONE` entries are in the folded
  `DONE` column, which is there whenever any file of the backlog has a
  `DONE` entry. The marker filter offers the columns of all of them.
- **A card or a row** of an included entry shows what one of the backlog
  file's own shows (3.2), and, on a line of its own under the title, the
  included file's path, such as `BACKLOG-DONE.md`, as text (Clead's
  design: `<span class="entry-file">`, 13 px, `--muted`, set with
  `textContent`, 3.7; not a link). The backlog file's own entries show no
  path, as today (decided point 2).
- **List.** Entries are grouped by heading as 3.2 sets out, with one
  change (Clead's design): consecutive entries share a group only when
  they have the same heading and come from the same file, so an included
  file's "Open" is never merged with the backlog file's "Open". A group
  of an included file is headed "`<heading>` — `<path>`" ("(no heading) —
  `<path>`" for its entries above its first heading), the path in its
  own `<span class="entry-file">`.
- **Search** matches as 3.2 says (ID, notes, title, description); it
  does not match the file's path (Clead's design).
- **Links in an included entry** resolve against the included file
  (3.7 item 4: "resolved against the file it appears in"), not the
  backlog file. Code-span links (3.4) are as today: a code span names a
  file only when its text is a path in the file list.
- **The documentation list** (3.4) does not change: an included file
  under `docs/` is listed already, and one at the root is not.
- **Report** (3.5). An include item is the backlog file's, on its include
  line: "`<backlog file>` line `<n>`: `<message>`". An included file's own
  items are listed as "`<path>` line `<n>`: `<message>`". Within each
  kind the items come in this order: the input notes (3.1), the backlog
  file's items, each included file's items in the order of I9,
  `STATUS.md`'s, `PROJECTS.md`'s. The tab's count counts them all. The
  messages, word for word (Clead's design):
  - I2: "Not followed: an include is `<!-- vizi:include <path> -->`
    alone on its line, at column 0." (not read);
  - I3: "Not followed: `<path>` is not a path vizi includes: it must be
    relative, made of the letters A to Z and a to z, digits, `.`, `_`,
    `-` and `/`, and end in `.md`." (not read);
  - I3, outside the project: "Not followed: `<path>` leaves the
    project." (not read);
  - I4: "Not followed: `<path>` is not in the repo on this branch." (not
    read). When the file list was truncated (3.1, "As built"), the
    message adds " GitHub's file list was truncated, so the file may
    exist.";
  - I4, the root's `STATUS.md` or `PROJECTS.md`: "Not followed:
    `<path>` is read by vizi in its own way and cannot be included."
    (not read);
  - I5, itself: "Not followed: the file includes itself." (warning);
  - I5, twice: "Not followed: `<path>` is already named on line `<n>`."
    (warning; "named", not "included", since that line's read may have
    failed);
  - I6: "Not followed: an included file cannot include another file."
    (not read; on the included file's line);
  - I7: "Not followed: vizi reads at most five included files." (not
    read);
  - a failed read: "Not read: `<path>` could not be read: `<message>`"
    (not read);
  - I8, an included file that gives no entry: "`<path>` holds no
    backlog entry." (info, no line; listed with that file's items);
  - I10: "The ID `<id>` is also used in `<file>` line `<n>`." (warning,
    on the later entry's file and line);
  - I11: "Not followed: only the backlog file can include another
    file." (info, on `STATUS.md`'s or `PROJECTS.md`'s line; for a folder
    pointer's `STATUS.md`, under "What could not be read" in its panel,
    3.9).

  `<path>` is the path as resolved by I3 where it resolves, otherwise as
  written; every path and message is set as text (3.7).
- **The message line** `#message`. That the page says what is missing
  is decided point 4; that `#message` and the report show it, and the
  wording, are Clead's design. After a
  successful load with a backlog file, `#message` is empty today, or
  holds the truncation note when the file list was truncated (3.1, "As
  built"). After a load in which an include was not followed or not read
  (any "not read" item of I2 to I7 or a failed read), it also holds the
  line "Not every included file could be read; the Report tab lists
  why.", after the truncation note when there is one. Warnings and info
  items put nothing there.
- **No include line:** the page is exactly as today, the requests, the
  board, the list, the cards and the report included.

#### Edge cases (Clead's design, within the approved points)

| Case | What happens |
|---|---|
| A missing file (not in the file list) | Not followed, no request; reported, not read (I4) |
| A missing file with a truncated file list | The same, and the message says the file may exist (I4) |
| A file deleted after request 2 (request 3 answers 404) | The load goes on; reported, not read, with the 404 message ("A failed read") |
| An include in an included file | Not followed; reported, not read, on the included file's line (I6) |
| The same file included twice | Read once, at its first include line; the later line read with a warning (I5) |
| Two paths that resolve to one file (`DONE.md`, `./DONE.md`) | As included twice (I5) |
| A file including itself | Not followed; read with a warning (I5) |
| A path outside the repo (`../x.md` from the root) | Not followed; reported, not read (I3) |
| `..` that stays inside (`../DONE.md` from `docs/BACKLOG.md`) | Followed, as `DONE.md` at the root (I3) |
| An absolute path (`/DONE.md`) | Not followed; reported, not read (I3) |
| A URL (`https://github.com/…/DONE.md`), or a path with `\`, `%` or a space | Not followed; reported, not read (I3, I2 for a space) |
| A path not ending in `.md` (`DONE.txt`, `DONE.MD`) | Not followed; reported, not read (I3) |
| An include in `STATUS.md` or `PROJECTS.md` | Not followed; reported, info (I11) |
| An included file that is not a backlog (`README.md`) | Read as a backlog file (I8): its marked entries, if any, are shown, and what it holds besides is reported as for a backlog file; an `.md` file with no entry gets the info item of I8 |
| A sixth include | Not followed; reported, not read (I7) |
| A public repo, no token | Included files read from `raw.githubusercontent.com` |
| A private repo, no token for its owner | The load stops at request 1 or 2 with 3.1's 404 message; nothing is included |
| A private repo, with a token | Included files read through the contents API with the load's token; a 401 fails the load as 3.8 says; a 403 or other failure is reported, and the load goes on |
| A pick of another branch (3.13) | A new load: the includes are read again on that branch, from its own file list |
| A load replaced while its includes are read, with a token | No further request with that token (3.8); the refused reads are network failures; the result is dropped (3.1, "Two loads at once") |
| A load replaced while its includes are read, without a token | Not stopped, as today: its remaining requests are made, and its answers are dropped (3.1, "Two loads at once") |
| An include of the root's `STATUS.md` or `PROJECTS.md` | Not followed; reported, not read (I4); each is still read as 3.3 and 3.9 say |
| An include of another of the three backlog paths (`BACKLOG.md` including `docs/BACKLOG.md`) | Followed and read as an included file (I8); the input note "more than one backlog file" (3.1) stays as it is |
| An include line at column 0 between an entry and the rest of its description | The dropped line is blank and ends no description (R4), so the entry's description goes on below it; the included entries come after that entry (I9) |
| An include line indented inside a description | Not followed; reported, not read (I2) |
| A line ending in a no-break space after `-->` | Not an include line; reported, not read (I1, I2) |

#### First use: the product office

The product office's `BACKLOG.md` is at its root, so the line
`<!-- vizi:include BACKLOG-DONE.md -->` there names its root
`BACKLOG-DONE.md`. Both files keep the same section headings, so the list
shows each heading once for `BACKLOG.md` and, for the finished entries,
once as "`<heading>` — `BACKLOG-DONE.md`"; the board's folded `DONE`
column holds the finished entries. Under I9 they follow the open entries
when the line stands at the end of `BACKLOG.md`. Adding the line there is
the first use, after the build, in the product office. The product
office's files are never copied into this repo, also not as test
fixtures (2.2); the tests use made-up files.

#### What changes in `docs/BACKLOG-FORMAT.md`

At the build, in the same PR as the code:

- a new section **6. Includes (`vizi:include`)**: the approved intent of
  "What is decided", item 17, marked **(approved)**, then the rules I1 to
  I11 and the example above, word for word;
- **"What is decided, and what is Clead's design":** the approval of
  2026-11-07 added to the decided points, naming all seven of them (the
  keyword of I1 among them), with the points of I7 (five),
  I9 (where entries go) and the one-level, backlog-only, relative-path
  and same-branch points of I3, I4, I6 and I11 marked **(approved)**;
  the rest of I1 to I11 added to Clead's design;
- **R9:** one sentence at its end: "A comment that is an include line
  (section 6, I1) is read before it is dropped.";
- **section 3**, the report kinds: under "Not read", the include not
  followed or not read (I2 to I4, I6, I7, a failed read); under "Read
  with a warning", an include of the file itself or of a file already
  included (I5) and an ID used in another file (I10); under "Info", an
  included file with no entry (I8) and an include outside a backlog file
  (I11);
- **section 1** gains one sentence: "The backlog file can include other
  files (section 6)."

`docs/BACKLOG-FORMAT.md` was not changed by this spec's PR (#93); the
build (#98) made the changes above.

#### What changes elsewhere at the build

At the build, in the same PR as the code, besides
`docs/BACKLOG-FORMAT.md`:

- **2.3:** the list of the page's requests gains the included files'
  requests 3, and "every such request follows something the user typed"
  gains: "or is named by an include line of the backlog file that load
  read (3.15)";
- **3.7 item 5:** "Nothing in the content makes the page request
  anything" gains the same exception, and its list of requests the
  included files;
- **3.1 and 3.8:** the counts of a load's requests ("two to five") gain
  the included files: two to ten; 3.1's "up to three to
  `raw.githubusercontent.com`" becomes up to eight;
- **3.1, "As built", "Encoding":** "Request 3's path is one of the three
  backlog paths or `STATUS.md`, used as written" gains `PROJECTS.md` and
  an included file's path as resolved by I3;
- **3.13, "Requests in all":** "the two to five requests of 3.1" becomes
  two to ten, and a pick's "one to four" becomes one to nine;
- **3.2, "As built":** "consecutive entries under the same heading share
  a group" gains "and from the same file", with the heading of an
  included file's group as 3.15 sets out;
- **3.5:** the report gains the included files' items and the include
  items, and the order 3.15 sets out; in "As built", "where the file is
  the backlog file read or `STATUS.md`" gains `PROJECTS.md` and an
  included file's path;
- **section 4, item 3:** the rate-limit item gains one request 3 per
  included file, at most five a load;
- **`RULES.md` L § 5 (1):** "Content the page shows never makes a
  request of its own" gains the same exception, with its "Adopted:" line
  naming his decision of 2026-11-07 01:05 (decided point 7). That is a
  change of a local rule, through a reviewed PR (product-office
  `RULES.md` § 3 (2)); the WHAT it carries is his decision, given in
  chat (§ 3 (3)), so its wording needs no further decision (§ 3 (4)).
  Because the build PR changes a local rule, it gets the review of a
  separate Crog agent on Opus, and a CI verdict on it is extra
  (`RULES.md` L § 4 (11)); it is not merged on a CI verdict alone.

#### What changes in `src/` (no code here)

- `src/scan.ts`: the first pass also returns, for each comment, its line
  and the text from its `<!--`, so that include lines are found in the
  same pass as fences and comments (I1, I2); the lines it returns are as
  today.
- `src/include.ts` (new, pure): reading an include line (I1, I2), the
  path and its resolution (I3), the checks against the file list, itself,
  twice and the cap (I4, I5, I7), the nested check (I6), the order of
  I9, the cross-file ID check (I10), and the report items and messages.
- `src/backlog.ts`: an entry knows its file (I8); its parse of one file
  does not change otherwise.
- `src/github.ts`: `loadRepo` reads the included files after the backlog
  file and before `STATUS.md`, through the same `file` request, and
  returns each one's path and text, or its failure; a 401 fails the load.
- `src/board.ts`: `listSections` groups by file and heading.
- `src/status.ts`, `src/projects.ts`: the info item of I11.
- `src/main.ts`: the file path on cards and rows and in list headings,
  the base path for links per entry, the report's order, the message
  line.
- `src/style.css`: `.entry-file`.

#### Acceptance criteria

The build is done when every point below holds, each checked by a test
that ran (test first, 2.2; GitHub stubbed; made-up files only):

- unit, `src/include.test.ts`:
  - I1: `<!-- vizi:include BACKLOG-DONE.md -->` at column 0 is an include
    of `BACKLOG-DONE.md`, also with two spaces where one stands and with
    trailing spaces; the same line inside a fence, and inside a comment
    opened on an earlier line, is not an include and is not reported;
  - I2, reported as not read: the line indented; with text after
    `-->`; `<!-- vizi:include -->`; `<!-- vizi:include a.md b.md -->`;
    `<!-- vizi:include a.md-->`; a tab in place of either space around
    `vizi:include`; a tab inside the path (`a<tab>b.md`);
    `<!--vizi:include a.md -->`, with no space after `<!--`;
    `<!-- vizi:include a-->b.md -->` and
    `<!-- vizi:include --> -->`, each reported by I2, not I3; and
    `<!-- vizi:include a.md` with the `-->` on a later line; read as an
    include: the line with a trailing tab after `-->`; not
    reported: `<!-- vizi:Include a.md -->`, `<!-- vizi a.md -->`, and
    `- **[NOW] AB-1** — Text <!-- vizi:include a.md -->`, which stays the
    entry's text;
  - I3, from `BACKLOG.md`: `DONE.md` → `DONE.md`; `./DONE.md` →
    `DONE.md`; `old/DONE.md` → `old/DONE.md`; `old/../DONE.md` →
    `DONE.md`; refused: `../DONE.md`, `/DONE.md`,
    `https://github.com/acme/widgets/blob/main/DONE.md`, `C:\DONE.md`,
    `a%20b.md`, `a//b.md`, `old/`, `DONE.txt`, `DONE.MD`, `ÄNDRAT.md`;
    from `docs/BACKLOG.md`: `DONE.md` → `docs/DONE.md`; `../DONE.md` →
    `DONE.md`; `../../DONE.md` refused; the order of the checks:
    `../x.txt`, `/../x.md` and `a//../b.md` give the general message,
    `../x.md` from `BACKLOG.md` and `a/../../x.md` the "leaves" message;
  - I4: a path not in the file list is reported with no request asked
    for, with and without the truncation sentence; `STATUS.md` and
    `PROJECTS.md` from `BACKLOG.md`, and `../STATUS.md` from
    `docs/BACKLOG.md`, reported with I4's own message, with no request;
    `docs/STATUS.md` from `BACKLOG.md` followed;
  - I5: the file itself, and the same file twice (also as `DONE.md` and
    `./DONE.md`), each a warning, the file read once; a file whose read
    failed, named again: the warning "already named", and no second
    request for it; a path the file
    list lacks, named twice, reported by I4 both times, and a path past
    the cap, named twice, by I7 both times;
  - I6: an include line, and a line that looks like one, in an included
    file: reported on that file's line, not followed;
  - I7: six include lines of six files in the file list: the first five
    read, the sixth reported; refused lines before them do not count;
  - I8: an included file's entries keep their own lines and groups, an
    entry above its first heading has no group, and a file with no entry
    gives the info item;
  - I9: the order of the example above;
  - I10: the warning on the later entry, naming the earlier file and
    line; an ID in two included files and the backlog file: the third
    entry gets one I10 warning, naming the first; IDs repeated within one
    file keep their own warning;
  - every message above, word for word;
  - a backlog file with no include line gives exactly what `parse`
    gives today, and no file to read;
- unit, `src/github.test.ts`:
  - the requests 3 of a load with two included files: the backlog file,
    the two in their order, `STATUS.md`, `PROJECTS.md`, one after
    another; without a token from `raw.githubusercontent.com` with the
    path as written, with one through the contents API with each segment
    encoded, the header, `credentials: "omit"` and `cache: "no-store"`,
    and no token in any URL;
  - an included file the file list does not hold: no request;
  - an included file answered 404, 403 (rate limit and other), 500 and a
    network failure: the load succeeds, the failure is returned for that
    file with 3.1's or 3.8's message, and `STATUS.md` and `PROJECTS.md`
    are still read;
  - 401 on an included file with a token: the load fails as
    `token-refused`;
  - a replaced load with a token, written as a `loadRepo` test with a
    fetcher that refuses (throws) from the first included file on, as
    `guardedFetch` does: the stopped file is a failed read with the
    network message, each later included file is refused without a
    request reaching the stub, and the load fails at `STATUS.md` when
    the file list holds it, and succeeds without it;
  - no include line: the same requests as today;
- unit, `src/board.test.ts`: two groups named "Open" from two files are
  two list sections; `boardColumns` holds both files' entries in the
  order of I9;
- unit, `src/status.test.ts` and `src/projects.test.ts`: an include line
  gives the info item of I11 and is not followed;
- browser (`e2e/`, light and dark, 375 px and 1280 px):
  - a backlog with `NOW` entries and an include of a file of `DONE`
    entries: the `DONE` column is folded, its count counts the included
    entries, and opening it shows them, each card naming the included
    file; the backlog file's own cards name no file;
  - the list shows the included file's groups as "`<heading>` —
    `<path>`", apart from the backlog file's groups of the same name;
  - a relative link in an included entry's description, the included
    file under `docs/`, goes to the github.com page of the file beside
    it;
  - the Report tab lists every item of the example above, word for
    word, with its file and line, and its count, in the order the
    example gives (by kind, as 3.5, then by file as "What the page
    shows", Report, sets out);
  - an include of a missing file: the load succeeds, `#message` adds its
    line, and the report says why; an include that is only a warning
    adds no line to `#message`;
  - with a token held for the owner, every request goes to
    `api.github.com` with the header and none to
    `raw.githubusercontent.com`; a 401 on the included file forgets the
    token and hides the results; "Forget" hides the included entries
    with the rest;
  - a private repo without a token: 3.1's 404 message and no request for
    an included file;
  - a pick of another branch (3.13) reads the includes of that branch;
  - with a token, a load replaced while its first included file is held
    back makes no request after it, and the newer project is shown;
    without a token, the replaced load's later requests may still be made,
    and nothing of it is shown;
  - an include line between an entry and the rest of its description:
    the description holds the lines below it, and the included entries
    come after the entry;
  - an include line in a folder pointer's `STATUS.md`: "Show status"
    (3.9) lists I11's info item, word for word with its line, under
    "What could not be read" in the "Project status" panel, and makes
    no request for the named file;
  - a backlog file of 1500 lines including one of 1500 lines loads and
    renders in under 8 seconds, as item 6 of section 4 does for one file;
  - the CSP test of `e2e/csp.e2e.ts` passes with included entries shown,
    with no violation and no console error, and an included description
    holding `<script>` and `<img src=x onerror=…>` shows them as text
    (3.7);
  - without an include line, the existing tests pass unchanged.

#### Decisions on the open questions

Each was a WHAT (product-office `RULES.md` § 7 (2)), put to the product
owner with Clead's proposal. He took every proposal: Adam, 2026-11-07
01:05, in chat, "Po-105 apyr" (product-office `DECISIONS.md`, #576).
Point 1 is the five proposals above, and points 2 to 7 are the six
questions on what they left open; "decided point `<n>`" elsewhere in
3.15 means point `<n>` of this list.

1. **The five proposals** (the keyword, the path, backlog files only,
   one level, entries shown like the file's own and naming their file):
   approved as written above.
2. **Which entries name their file:** only included entries, so a
   backlog without includes looks as today.
3. **Where included entries go:** where the include line stands (I9).
4. **A failed read of an included file:** the load goes on, and the
   page says what is missing; only a 401 fails it, as 3.8 does for every
   request. That `#message` and the report show what is missing is
   Clead's design.
5. **The cap:** at most five included files a load (I7), to keep a
   load's requests bounded (section 4, item 3).
6. **The help view:** unchanged (3.10); the include is documented in
   `docs/BACKLOG-FORMAT.md`, which the help view links to.
7. **Requests named by a file:** include lines are the one exception to
   2.3, 3.7 item 5 and `RULES.md` L § 5 (1), which gain it at the build
   ("What changes elsewhere at the build"). Why an exception is sound
   (an include line is the project's instruction to vizi's reader) is
   Clead's reasoning, not part of the decision.

#### As built (PBI-1.34)

Clead's design, as the build (#98) reads the points above leave open:

- **The code.** `src/include.ts` holds I1 to I10: `readIncludeComment`
  (I1, I2) on the comments `scan` now returns with their line, indent
  and text from the `<!--`; `resolveIncludePath` (I3); `planIncludes`
  (I2, I3, I5, I4, I7, in the order I5 gives) gives the files a load reads
  and the backlog file's include items; `readBacklog` puts the backlog
  file and the files read together in the order of I9, with I6, I8 and
  I10, and returns one report per file. `loadRepo` returns `included`,
  each file's text or its failure's message. `includesElsewhere` gives
  I11's item to `src/status.ts` and `src/projects.ts`.
- **The three build notes of PBI-1.34.** The root's `STATUS.md` and
  `PROJECTS.md` are checked before the file list, so they get I4's own
  message whether or not the file list holds them. 3.13 is named among
  the sections the build changes. The replaced-load unit test names both
  files: the load fails at `STATUS.md` when the file list holds it, and
  succeeds when it holds neither `STATUS.md` nor `PROJECTS.md`.
- **The messages.** Backticks around a placeholder (`` `<path>` ``,
  `` `<n>` ``) mark where the value goes, as elsewhere in this spec; the
  backticks around literal syntax are part of the message, as in 3.9's
  pointer message: I2's `` `<!-- vizi:include <path> -->` `` and I3's
  `` `.` ``, `` `_` ``, `` `-` ``, `` `/` `` and `` `.md` ``.
- **The message line.** I6 is among "the not read items of I2 to I7",
  so an include in an included file also adds the line to `#message`.
- **Order within a file.** Each file's items are by line; an item
  without a line (I8's) comes after them.

### 3.16 The repository in the page's address (PBI-1.35)

The product owner's intent approval of 2026-11-09 ("What is decided",
item 18). The points marked **(approved)** are his; the rest is Clead's
design within them.

#### The form

- **(approved)** The page's own address can name the repository to open:
  `https://factoincognito.github.io/vizi/?repo=<owner>/<repo>`, for
  example `?repo=sugose/snake-demo`. The value is read exactly as the
  Repository field reads typed text (3.1, "The Repository field" and
  "Guided opening"), so the field's other forms work too, for example
  `?repo=sugose/snake-demo/tree/dev` or a full
  `https://github.com/<owner>/<repo>` address.
- A path form (`/vizi/<owner>/<repo>`) is not used. GitHub Pages answers
  a path it has no file for with HTTP 404, and only a `404.html` that
  redirects could serve one.
- **In a link, a branch that holds `+`, `&` or `#` is percent-encoded**
  (`%2B`, `%26`, `%23`). Written raw, `+` becomes a space, `&` ends the
  value and `#` starts the address's fragment, so the page opens another
  branch than the one meant, or none; `%23` is then refused by the field,
  as a typed `#` is.

#### Reading the address

- At startup the page reads `location.search` once, with a pure function
  `repoFromSearch(search: string): string | null` in a module of its own
  (`src/address.ts`). `location.hash` is not read.
- **Which parameter.** The text after the leading `?` is split on `&`.
  The first part whose name, the text before its first `=`, is exactly
  `repo` is the parameter; a part `repo` without `=` is not one.
  **(approved)** Every other parameter is ignored, and so is every later
  `repo` part. The name is compared as written: `REPO` or `r%65po` is
  another parameter.
- **Decoding.** The value, the text after the part's first `=`, has each
  `+` replaced by a space and is then decoded once with
  `decodeURIComponent`. When that decoding fails (a malformed escape such
  as `%E0`, or a lone `%`), the value is used undecoded, with only the
  `+` replaced. So the field reads what the link's author wrote, and
  refuses it as it refuses the same text typed: `?repo=acme/w/tree/a%E0`
  gives the field `acme/w/tree/a%E0`, whose branch the field refuses with
  its branch message (3.1); `?repo=acme/w/tree/50%` gives
  `acme/w/tree/50%`, refused the same way. `URLSearchParams` is not used,
  because it turns an escape whose bytes are not valid UTF-8, such as
  `%E0`, into U+FFFD, which the field would accept as part of a branch
  nobody named. (A `%` that two hex digits do not follow, such as a lone
  `%`, it keeps as written, as this reading does; checked with the
  `URLSearchParams` of Node.js 22.23.4 on 2026-11-09, not in a browser.)
- **Two decodings.** A well-formed value is decoded here once, and the
  field then decodes a branch once more, as 3.1 sets out. So a branch
  `fix-å` opens from `?repo=acme/w/tree/fix-%C3%A5` (the field gets
  `fix-å`, as typed) and from `?repo=acme/w/tree/fix-%25C3%25A5` (the
  field gets `fix-%C3%A5`, as a copied GitHub address holds it).
- **No value.** A value that is empty, or holds only white space as the
  field's own trim reads it, counts as no `repo` parameter. Since only
  the first `repo` part counts, `?repo=&repo=acme/widgets` also gives no
  value.

#### What the page does with it

- **When.** Once per page load, after `mount()`, the token store's start
  (3.8) and the first render of the tokens, so a token saved for the
  owner is known before the open.
- **(approved)** Without a value, the page starts as before: the field
  is empty and nothing is read.
- **(approved)** With a value, the page writes it into the Repository
  field (`#url-input`) and then does what pressing "Open" does
  (`openFromField`).
- **The write is one of the page's own writes of the field** (3.1,
  "Where other parts set or read the field"), as "Open in vizi" (3.9)
  is. It fires no `input` event, so right after it the page updates the
  token Owner prefill by the rule for typed text (3.8), and the opening
  guide follows the field as after its other page writes: its last text
  is the field's text, the `#guide-message` line is reserved by 3.1's
  rule ("The opening guide's message line"), and the datalist is filled
  from a list already kept, with no request. The open then reads the
  field as it holds the value after the write (the browser strips line
  breaks from a text field's value), so what opens is what the field
  shows.
- **The requests** are those of "Open" with that text in the field,
  with no keystroke and no blur before it, so the opening guide makes no
  request of its own before the open:
  - an owner and a repo (`?repo=acme/widgets`): 3.1's request 1, request
    2 and the requests 3, then 3.13's branch list;
  - an owner and a repo with a branch, or a full GitHub address: the
    same, without request 1 when a branch is named;
  - **(approved)** an owner alone (`?repo=factoincognito`): the reads of
    that owner's repo list (3.1, "When an owner's list is read"), and the
    owner's repos in the guide's select, as "Open" with an owner alone
    gives them; no project is loaded until a repo is chosen;
  - a value the field refuses: no request, and the field's own message.
- **The focus** is not moved: the page does not focus the field or
  "Open" at startup.
- **(approved) The page writes no address.** It does not change its own
  URL, add a history entry or set a hash, before or after the open.
  Opening another repository in the page, picking a branch (3.13) or
  opening a saved repo (3.14) leaves the address bar as it is, so the
  address may name another repository than the one shown. A reload opens
  what the address names.

#### The rules on requests at startup

Item 2's approved reading is that the web pack's no-external-requests
rule covers what the page loads at startup, so that fetching a backlog
after an address is typed is allowed (2.3; `RULES.md` L § 5 (1)). Item
18 approves the open at startup from the page's address. Clead's reading,
carrying out item 18 (product-office `RULES.md` § 3 (4)): the `repo`
value is an address the user gives by opening the link, and the page
treats it as typed. Without a `repo` value the page still loads only its
own document at startup, which `e2e/smoke.e2e.ts` (it opens `/`) keeps
checking, and that test stays as it is (L § 5 (2)). The build changes
the texts that say "typed" or "enters", listed below. The change to
`RULES.md` L § 5 (1) is a rules change, so the build PR gets a separate
Crog agent's review besides the CI verdict (L § 4 (11)), as PBI-1.34's
did.

#### The help view

- **(approved)** The help view (3.10) gets one paragraph after its last
  step and before the closing link: "To open a repo straight from a
  link, add `?repo=<owner>/<repo>` to vizi's address, for example
  `https://factoincognito.github.io/vizi/?repo=factoincognito/vizi`."
  The two code parts are code; the rest is text. It is not a step.
- A test in `src/help.test.ts` reads the example's `repo` value with
  `repoFromSearch` and the field's reader and checks that it is an owner
  and a repo.

#### Security and policy

- **(approved)** A link can make the page open a private repository
  with a token saved in that browser for its owner (3.8). The content is
  shown only to that browser's user, the token is sent only to GitHub,
  and the page stays read-only. A link cannot carry a token: the address
  is never read for one.
- One thing is new: a repository named in a link, a private one
  included, sits in the page's address, so it is kept in the browser's
  history (and its sync), in bookmarks, and in GitHub Pages' request
  logs. A typed address is not (3.1 keeps the field's
  `autocomplete="off"` for that reason).
- **(approved)** No new kind of request: the open makes exactly the
  requests "Open" makes for the same text. The Content-Security-Policy
  (2.3) does not change; only the inline script's hash changes with the
  build.
- Each page load with a `repo` value spends that open's requests against
  GitHub's anonymous limit (section 4), as pressing "Open" does. Any page
  on the web can already spend that limit by calling `api.github.com`
  itself.
- The page sets no referrer policy, so the browser's default sends only
  the origin to GitHub, never the `?repo=` value.

#### What changes elsewhere at the build

- `RULES.md` L § 5 (1): "fetching a backlog after the user types a
  public GitHub repo's address is allowed" gains "or opens vizi with one
  in the page's address (`docs/SPEC.md` 3.16)".
- 2.3, Clead's paragraph: "after the user enters a URL" gains "or opens
  the page with one in its address (3.16)", and "every such request
  follows something the user typed" gains "or gave in the page's address
  (3.16)"; its last sentence, "what the page loads at startup is still
  only its own document", gains "without a `repo` value in its address
  (3.16)". 2.3's first paragraph: "a request made after the user enters a
  URL" gains "or opens the page with one in its address (3.16)". The
  approved sentence of item 2 is quoted as it was approved and does not
  change.
- 3.7, item 5: "after the user enters a URL (2.3)" gains "or opens the
  page with one in its address (3.16)".
- 3.1, "The field": "It starts empty, and the page never fills it at
  startup" gains "except from the page's address (3.16)"; and "Where
  other parts set or read the field" gains the startup write of 3.16, a
  page write that updates the Owner prefill and the opening guide as
  above.
- 3.10: "Nothing is added to or removed from the five steps and the
  closing link" gains "except the paragraph of 3.16, between them"; its
  "Static text in the built page" bullet and its list of browser tests
  name the paragraph; and "No address" changes: the page reads its
  address only for 3.16's `repo` parameter at startup, the view still
  has no hash and no history entry, and a reload shows the start page
  when the address has no `repo` value.
- 3.13, "The address after picking": "the page does not read or write
  its own URL" becomes "the page does not write its own URL, and reads
  it only for 3.16's `repo` parameter at startup"; "vizi has no address
  of its own to change" stays true.
- `docs/BACKLOG-FORMAT.md` does not change.

#### What changes in `src/` (no code here)

- `src/address.ts` (new): `repoFromSearch`, as "Reading the address"
  sets out, with no DOM.
- `src/main.ts`: one function, run once at startup after the tokens are
  rendered, that reads `repoFromSearch(location.search)` and, with a
  value, writes the field, updates the Owner prefill and the opening
  guide as the other page writes do, and calls `openFromField()`.
- `src/help.ts`: the paragraph, and its rendering in the help view.

#### Tests

Test first, as the web pack asks (`languages/web/code-standards.md`).

- Unit (`repoFromSearch`): no search (`""` and `"?"`); `?repo=acme/widgets`;
  a second `repo` ignored; `?repo=&repo=acme/widgets` gives no value;
  other parameters ignored (`?x=1&repo=acme/widgets` gives the value);
  `?repo` without `=` gives no value, and `?repo&repo=acme/widgets` gives
  `acme/widgets` (a part `repo` without `=` is not the parameter, so the
  next `repo` part is the first one); `REPO` is another parameter; an
  empty and a white-space value give no value; `+` and `%20` decode to a
  space; `%25` decodes to `%` once; a value with `/tree/<branch>`; a raw
  `&` ends the value (`?repo=acme/w/tree/a&b` gives `acme/w/tree/a`); a
  malformed escape (`?repo=acme/w/tree/a%E0`) and a lone `%`
  (`?repo=acme/w/tree/50%`) give the value undecoded.
- Browser (Playwright, GitHub's answers stubbed as elsewhere):
  - `?repo=acme/widgets` makes 3.1's request 1, request 2 and the
    requests 3, in that order, then 3.13's branch list, and no other
    request; the project loads and the field holds `acme/widgets`;
  - `?repo=acme` shows the owner's repo list in the guide's select and
    loads no project; the `#guide-message` line is reserved before the
    list answers; typing `/` after it (`acme/`) keeps the select, as after
    a typed `acme` and "Open";
  - `?repo=acme/w/tree/a%E0` shows the field's branch message and makes
    no request;
  - a refused value (`?repo=acme/widgets.git`) shows the field's message
    and makes no request;
  - no `repo` parameter: no request at startup, the field empty;
  - with a token saved for the owner, the open sends it with every
    request, and every request goes to `api.github.com` (with a token,
    3.8 reads request 3 through the contents API, and none goes to
    `raw.githubusercontent.com`); the Owner prefill holds the owner after
    the open;
  - the address is unchanged after the open and after opening another
    repo from the field (`location.href` and `history.length`);
  - the focus is on `document.body` after the startup open;
  - the help view shows the new paragraph after the last step and before
    the closing link.
- The load check in `e2e/smoke.e2e.ts` stays as it is (`RULES.md`
  L § 5 (2)).

---

## 4. Known unknowns

Each is settled in the backlog item that meets it. Items 1 to 6 were
PBI-1.2's; their outcome after it (PR #9):

1. **Removed (PBI-1.14).** It was about the browser's folder picker
   and a folder input on a page opened from disk. The page has no folder
   input from PBI-1.14 (item 9 of "What is decided"), so there is
   nothing to settle. The numbers of the items stay as they are.
2. **Open; PBI-1.4.** Whether requests to GitHub work from a page opened
   from disk in a real browser. With GitHub's answers stubbed, opening
   an address works on the built page opened from disk (browser test "works on a
   page opened from disk (file://)", headless Chromium); the stub stands
   in for GitHub's CORS answer, so real GitHub was not tried.
3. **Open; PBI-1.4.** GitHub's anonymous rate limit as a browser sees
   it. One load makes one or two `api.github.com` requests (3.1,
   requests 1 and 2) and up to three to `raw.githubusercontent.com`, with
   one request 3 more per included file, at most five a load (3.15, from
   PBI-1.34), and each "Show status" of the umbrella view one more (3.9);
   from PBI-1.19
   the opening guide's reads add two to four per owner, once per page
   visit when its list is read in full, and two to four on each blur
   with an owner and a repo (3.1, "Guided opening", which also quotes
   GitHub's documented limit of 60 anonymous requests per hour).
   The checks in 3.1 ran through a proxy that appears to add
   credentials, so they do not show the anonymous limit.
4. **Open; PBI-1.4.** What an anonymous request for a private repo gets
   back. The page shows its 404 message (3.1) for a 404 on request 1
   or 2, and any other status as that status (3.1).
5. **Settled (PBI-1.2, tests added in PBI-1.5).** What the page does
   with a truncated file list is in 3.1, "As built". Tested:
   - the message under the address names the truncation (browser test
     "tells that the file list was truncated");
   - the report holds one Info item for it, the documentation list
     holds only the files GitHub sent, and a relative link still goes to
     github.com (browser test "a truncated file list: the report says
     so, and the documentation list and code-span links hold only the
     files GitHub sent");
   - a complete file list adds no such item (browser test "a complete
     file list adds no truncation note to the report");
   - `loadRepo` passes GitHub's `truncated` flag through (unit test in
     `src/github.test.ts`).

   Not reliably tested: that a code-span link is made only for a file
   GitHub sent. The same browser test checks that there is no such link,
   but right after it opens the card, when the description may not have
   been rendered yet, so the check can pass without looking at it.
   A check after the description renders is PBI-1.6. When GitHub
   truncates a list was not checked.
6. **Settled (PBI-1.2).** A synthetic backlog of 1500 lines (the
   template's `docs/BACKLOG.md` has about as many) loads by address,
   with GitHub stubbed, and shows the board and over 400 list rows in
   under 8 seconds (browser test "a synthetic file of 1500 lines loads
   and renders in a few seconds", headless Chromium, at phone and
   desktop width, light and dark).
7. Settled 2026-11-04: HTML comments in a backlog file are dropped
   before reading (`docs/BACKLOG-FORMAT.md`, R9).
8. Not decided: whether the template's own wording of the "no external
   requests" rule changes as well (2.3). That is a template change,
   through the template's review flow.

Items 9 to 15 are PBI-1.8's (3.8); PBI-1.8 says to check first that
GitHub accepts such a token from the published page. None is checked
yet:

9. **Open; PBI-1.8.** CORS with an `Authorization` header: whether
   `api.github.com` answers the browser's preflight from
   `https://factoincognito.github.io`, and from a page opened from disk.
   A preflight sent from this session's proxy got 405 from
   `api.github.com` and 403 from `raw.githubusercontent.com`, which
   proves nothing about a browser: the proxy may cause both.
10. **Open; PBI-1.8.** Whether the contents API with the raw media type
    reads a private file with a fine-grained token, and up to what file
    size. It was checked only without a token, on one public file.
11. **Open; PBI-1.8.** Whether GitHub answers 401 for an expired or
    revoked fine-grained token, 404 for a repo outside its selection,
    and 403 for a missing permission, as 3.8 expects.
12. **Open; PBI-1.8.** Whether an organisation's policy, such as
    requiring approval of fine-grained tokens, stops a token from
    reading that organisation's private repos, and what GitHub answers
    then.
13. **Open; PBI-1.8.** Whether `localStorage` keeps the token on a page
    opened from disk (`file://`); browsers treat that origin
    differently.
14. **Settled for Chromium (PBI-1.8, PR #30); open for other
    browsers, PBI-1.4.** The build writes the hashes of the inlined
    script and style into the `<meta>` policy (2.3, as built), and the
    browser tests of `e2e/csp.e2e.ts` load the built page in headless
    Chromium with no violation and no console error, also when opened
    from disk, and see a script added at run time, a style attribute, a
    request to another host, an image from another host and a form post
    all blocked. Whether every other browser the page targets applies
    the policy the same way was not checked.
15. **Open; PBI-1.8.** Whether a browser's password manager offers to
    save the token from a password field outside any `<form>`, and so
    may keep it, perhaps synced to an account. Browsers often ignore
    `autocomplete="off"` on password fields.

Item 16 is PBI-1.9's (3.9):

16. **Checked by hand, not by a test.** The product office's own
    `PROJECTS.md` was read once, on 2026-11-04, against P1 to P7: it
    holds headings, pointers of both kinds and text, and no line that
    P5 would report. It cannot be a test fixture: that file is private
    and is never copied into this public repo.

Items 17 and 18 are PBI-1.11's (3.8):

17. **Open; PBI-1.11.** Whether GitHub has a request that tells which
    owner a fine-grained token's repos belong to. 3.8 does not rely on
    one: the user names the owner. Not checked.
18. **Open; PBI-1.11.** That GitHub treats owner names without regard
    to case, so that vizi may compare them in lower case. Not checked
    here.

Item 19 is PBI-1.13's (3.10):

19. **Settled for the documentation (PBI-1.16, 2026-11-04); the live
    page not checked.** The help view's token step names the permission
    "Contents" as read-only, as 3.8 expects it. Checked against the
    source of GitHub's documentation, `github/docs` at
    `e44c283a7f901f63aead1ea13cf9062956706e24`, "Managing your personal
    access tokens", section "Creating a fine-grained personal access
    token" (3.12, "The guide, checked against GitHub's documentation"):
    the repository permission's display name is "Contents", with the
    access levels `read` and `write`, and GitHub adds `metadata:read`
    to a token given `contents=read`; the menu path and the labels the
    token guide of 3.12 uses are the documentation's. Not checked: the
    label GitHub's token page shows for the read level (the
    documentation does not give it, so the guide does not use one), and
    whether the live page matches the documentation. Items 10 and 11
    still settle what GitHub answers to such a token, when the product
    owner first tries one against real GitHub; the help text and the
    guide are corrected if GitHub's page says otherwise.

Items 20 to 23 are PBI-1.16's (3.12):

20. **Settled (PBI-1.16, 2026-11-04).** `vite-plugin-singlefile` 2.3.3,
    with its default settings, inlines the three font files (14336,
    14712 and 14600 bytes) as `data:font/woff2;base64,` URLs, so
    `vite.config.mts` does not change. `e2e/subpath.e2e.ts` checks that
    the built page has exactly three such `url()`s and no other.
21. **Settled (PBI-1.16, 2026-11-04).** Playwright (1.63.0, Chromium)
    does not report the page's inlined `data:` fonts as requests: the
    load check of `e2e/smoke.e2e.ts` (the page requests only its own
    document) and the guard of `e2e/guard.ts` pass unchanged while the
    three faces load (`e2e/start.e2e.ts`, "the font loaded").
22. **Settled (PBI-1.16, 2026-11-04).** The built page holds Vite's own
    module-preload polyfill (the `relList` and `modulepreload` check
    with a `MutationObserver` on the document, at the start of the
    inline script). It is Vite 8.3.1's code (`node_modules/vite`,
    licence MIT, "Copyright (c) 2019-present, VoidZero Inc. and Vite
    contributors"), so `THIRD-PARTY-NOTICES.md`, which existed already
    (PR #68), has an entry for it with the copyright and the licence
    text, and the page's footer links to that file. Turning the
    polyfill off in `vite.config.mts` was not chosen: it would change
    the build for a notice the footer already carries.
23. **Open; PBI-1.16.** Whether `v4.1` is the release GitHub marks as
    rsms/inter's latest. It is the highest version tag (read through
    git on 2026-11-04); the releases API was refused to this session.
    The licence that counts is the one on the commit used (policy A.1),
    and it was read there, so this changes nothing unless a newer
    release is wanted.

Items 24 to 27 are PBI-1.15's (3.13):

24. **Open; PBI-1.15.** In which order GitHub's "List branches" gives
    the branches, so which 300 the cap keeps for a repo with more. The
    documentation read (3.13) does not say. Not checked.
25. **Open; PBI-1.15.** Whether `api.github.com` exposes the `link`
    header to a page. 3.13 does not rely on it: it counts the names on
    a page. Not checked.
26. **Open; PBI-1.15.** Whether a browser fires a closed select's
    change event at each arrow key. 3.13 opens a branch only with "Open
    branch", so the picker does not depend on it. Not checked.

27. **Open; PBI-1.15.** The alternative to disabling branch names that
    hold `#` or `%` (3.13, "Names the page cannot open"): encode each
    `/`-separated segment of the branch in the anonymous request 3 and
    in `blobUrl`, as request 2 and the contents API already encode it,
    so every name git allows can be opened. Whether
    raw.githubusercontent.com accepts encoded segments was not checked.
    Until it is, the names stay disabled.

Item 18 gains a point from 3.13: the documentation of "List branches"
(`github/docs` at `e44c283`) says of `owner` and `repo` "The name is not
case sensitive." That is GitHub's word for that one request, not a
check of the others.

Item 28 is PBI-1.12's (3.14):

28. **Open; PBI-1.12.** GitHub's own length limits for owner and repo
    names. 3.14 allows at most 100 characters for each and at most 255
    for a branch; those are Clead's limits, generous for the names seen,
    not GitHub's, which were not checked.

Items 29 to 31 are PBI-1.19's (3.1, "Guided opening"):

29. **Open; PBI-1.19.** Which repos GitHub lists for a fine-grained
    token: whether `/user/repos` gives the repos the token covers (or
    more, or fewer), and whether `/orgs/<org>/repos` with such a token
    shows the private repos it covers. The documentation read
    (`github/docs` at `58b7b56`) gives the permission (Metadata read)
    but not the set. Settled when the product owner first tries it
    against real GitHub.
30. **Open; PBI-1.19.** How each target browser shows a `<datalist>`
    on a text field, with which keys, iOS Safari included, and what
    Enter does while its suggestions are shown; and whether a browser
    shows a datalist's suggestions differently on a field with
    `autocomplete="off"`, which the field keeps (3.1, "Guided opening").
    Not checked; no browser behaviour is claimed here. Whether the
    suggestions are shown is browser chrome, outside the page's DOM, so
    the build's browser tests check only the `list` attribute and the
    `<option>` values (3.1); trying it in the browsers is PBI-1.4's.
    Also not checked: whether, on a phone, the select shown on the
    field's blur (at once for an owner whose list is kept) can move
    "Open" under a tap that is landing on it. The message line
    `#guide-message` does not move anything on a blur with a one-line
    message: it takes its one line's height on the `input`, or the
    page's own write of the field, that makes the field's text guided,
    and gives it back only on one that makes it not guided (3.1), so the
    idle start page keeps 3.12's spacing; a longer outcome may move
    content when it arrives. The build's browser tests
    check, on all four projects, that a click on a token's "Forget" and
    on the "Private repos" toggle, made with an owner typed in the field
    and no blur before it, registers, and that the element is where it
    was before the blur; and that the row-to-access-line gap is 3.12's
    with an empty field and with a full address (Clead, 2026-11-05,
    #85). The select's own appearance above
    "Open" on a phone stays as said above.
31. **Open; PBI-1.19.** Whether `api.github.com` answers
    `/users/<owner>` for an organisation with `"type": "Organization"`
    as the documentation's schema suggests; the documentation's example
    is a user. Not checked.

Item 32 is 3.15's:

32. **Open; 3.15.** That an include line,
    `<!-- vizi:include <path> -->`, is not shown where GitHub renders a
    Markdown file, as 3.15's point 1 says. Not checked: GitHub's
    Markdown API was refused to this session (2026-11-06, "sessions are
    bound to their configured repositories"). It is checked at the
    build, or by the product owner on any file that holds a comment,
    such as the template's `STATUS.md`, which starts with one
    (`docs/BACKLOG-FORMAT.md`, S1).
