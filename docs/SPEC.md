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
   `memory/project.md`), as changed by item 3.
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
   folder or by address (a private one with the saved token), that has a
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

**Decided by the product owner (2026-11-03; two points replaced on
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

Not decided: a lint mode beyond the page's report (Clead's suggestion,
which the product owner found worth considering). The parser is
tolerant by design: it reads what it can and reports the rest (3.5).

---

## 2. Architecture

Clead's design, within the approved intent.

### 2.1 Modules and data flow

```
 folder or URL ──> source (src/main.ts) ──> file texts
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
- `src/main.ts`: reads the files (from the folder or from GitHub) and
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
nothing secret and stored nothing in the browser.

### 2.3 The web pack's "no external requests" rule

The pack's standards say: "No CDN scripts, web fonts, images or other
external requests." Reading a GitHub URL is an external request. The
pack's browser test (`e2e/smoke.e2e.ts`) checks only what the page
requests while it loads, so a request made after the user enters a URL
passes it.

**(approved)** vizi reads the rule as covering what the page loads at
startup: fetching a backlog after an address is typed is allowed.
`languages/web/code-standards.md` in this repo says so.

Clead's design: the load check stays as it is. The only requests the
page ever makes are the GitHub requests of 3.1, after the user enters a
URL. Content the page shows never makes a request of its own (3.7). The
browser tests stub GitHub's answers with Playwright routes, so no test
reaches the network. Publishing on GitHub Pages (2.2) does not change
this reading: what the page loads at startup is still only its own
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
  https://raw.githubusercontent.com; img-src data:; base-uri 'none';
  form-action 'none'
  ```

  `<script>` and `<style>` are the SHA-256 hashes of the page's one
  inline script and one inline style block. `'unsafe-inline'` is not
  used, and `img-src data:` is for the inline favicon. As built: the
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
  GitHub's two hosts.
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

- **(approved)** A local project folder, or a public GitHub repo
  address. The backlog file is looked for as `BACKLOG.md`,
  `docs/BACKLOG.md` and `docs/PRODUCT_BACKLOG.md`; `STATUS.md` is read.
- **Order.** The three paths are tried in that order, and the first one
  found is read. When more than one exists, the report says so and names
  the one read. When none exists, the page says that no backlog file was
  found, and shows the status if there is one.
- **Local folder.** The user picks the project's folder. `STATUS.md` is
  read at the folder's root. Nothing is sent anywhere.
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
     once each for the backlog file, `STATUS.md` and `PROJECTS.md`
     (3.9), each only if the file list has it; documentation files are
     not fetched (3.4).

  So one load makes one or two requests to `api.github.com` (requests 1
  and 2) and up to three to `raw.githubusercontent.com` (request 3): two
  to five in all when the backlog file is found. If request 1 or 2 answers
  404, the page says "not found or not public" and offers the local
  folder instead. Any other failed request is shown with its HTTP status
  and is not retried.
- `api.github.com` and `raw.githubusercontent.com` both answer with
  `Access-Control-Allow-Origin: *`, so a browser page can read them
  (checked with `curl` on 2026-11-03, and again on 2026-11-04 against
  the public template repo).

**As built (PBI-1.2).**

- **The address.** The input is trimmed. Only
  `https://github.com/<owner>/<repo>` is read (`https`, the host
  `github.com` exactly), optionally followed by `/tree/<branch>` and a
  trailing `/`, with no `?` or `#`. Owner and repo are letters, digits,
  `.`, `_` and `-`, and neither is `.` or `..`. Any other address makes
  no request: the page says what an address looks like.
- **Encoding.** The branch is percent-encoded in request 2 (so a `/` in
  it becomes `%2F`) and used as written in request 3 and in github.com
  links. Request 3's path is one of the three backlog paths or
  `STATUS.md`, used as written. In a github.com link (3.4) each segment
  of the file's path is percent-encoded.
- **Failures.** A failed request 3 (the backlog file or `STATUS.md`)
  fails the whole load and is shown with its HTTP status; a 404 there is
  shown as a status, not as "not found or not public". A request that
  cannot be made says so with the host and the reason. An answer to
  request 1 without a default branch is shown as "GitHub's answer for
  the repo had no default branch", and an answer to request 2 without a
  file list as "GitHub's answer for the file list was not understood".
  After any failed load, and after a refused address, the previous
  project's results are cleared and hidden.
- **Two loads at once.** The newest load is shown. Every submitted
  address and every picked folder starts a load, and a refused address
  counts as one. A load's answer that arrives after a newer load has
  started is dropped, whether it succeeded or failed, so an older error
  never replaces a newer project. A folder picker closed without a
  folder starts no load.
- **The file list in URL mode** holds every file (blob) of request 2's
  answer; none is left out.
- **The folder.** It is picked with a folder input
  (`<input type="file" webkitdirectory>`), not the File System Access
  API. The picked folder's own name is dropped from each path and shown
  as the project's name. Files under a folder named `.git` or
  `node_modules`, at any depth, are left out of the file list, so they
  are neither documentation nor link targets. Every other file,
  dot-folders such as `.github/` included, is in the list.
- **A truncated file list.** When GitHub marks request 2's answer as
  truncated, the page reads the files it got, says so under the address,
  and adds an Info item to the report: the documentation list and the
  code-span links may be incomplete.

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
  share a group, and a heading with no entries left is not shown.
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
  files (`*.md`) under `docs/`, subfolders included, sorted by path. In
  URL mode the list comes from the file list (3.1, request 2), and each
  link opens the file's github.com page
  (`https://github.com/<owner>/<repo>/blob/<branch>/<path>`) in a new
  tab. In folder mode a link opens the file from the folder, rendered in
  the page under 3.7.
- Every code span in an entry (such as `docs/SPEC.md`) whose text,
  without a leading `./`, is the path of a file in the project becomes a
  link, in both modes, the same way. Other code spans stay text.

**As built (PBI-1.2).**

- "Under `docs/`" means a path that starts with `docs/` and ends with
  `.md`, case-sensitive; `README.md` is only the root's. The list is
  sorted by the paths' character codes.
- A code span names a file only when its text, after dropping one
  leading `./`, is exactly a path in the file list (3.1). Inside a
  link's label a code span is never a link (3.7).
- **URL mode:** a relative link in rendered text (3.7 item 4) goes to
  the file's github.com page whether or not the path is in the file
  list: the list can be truncated, and github.com shows its own "not
  found". A code-span link is made only for a path in the file list.
- **Folder mode:** a link to any file in the folder, from the
  documentation list, a relative link or a code span, opens that file in
  the Documentation tab under its path. The file is read as text. A
  file whose name ends in `.md` (case-sensitive, as for the
  documentation list) is rendered as Markdown under 3.7, and relative
  links in it resolve against its own path. Any other file is shown as
  code, as written: no Markdown, no links. A file that cannot be read
  shows "`<path>` could not be read."

### 3.5 Report of what could not be read

**(approved)** A report tab of what could not be read, with line numbers.

Clead's design: the report lists, with line numbers, what the parsers
skipped or guessed, sorted into the three kinds of
`docs/BACKLOG-FORMAT.md` section 3 (not read, read with a warning,
info), plus what `src/status.ts` could not read and the input notes of
3.1 (more than one backlog file). It is the same parsers; the report is
not a second pass. The tab shows the number of items of each kind.

**As built (PBI-1.2).** The tab's label is "Report (`<n>`)", the total
number of items. The kinds are listed in the order Not read, Read with
a warning, Info, each with its count. An item with a line reads
"`<file>` line `<n>`: `<message>`", where the file is the backlog file
read or `STATUS.md`. An item without a line shows its message only:
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
a `STATUS.md` or a documentation file, possibly from any public repo. It
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
   - a relative path, resolved against the file it appears in: in URL
     mode to the file's github.com page, in folder mode to the file in
     the folder (when it exists; otherwise it stays text);
   - a `#` anchor within the same document.

   Any other target (`javascript:`, `data:`, `vbscript:`, `file:`, any
   other scheme, or a target with control characters) is shown as the
   link's text with no link. Links to other sites open in a new tab with
   `rel="noopener noreferrer"`; opening one is the user's own action.
5. **No loads from content.** Images are never loaded: `![alt](url)` is
   shown as a link with the alt text, under item 4, or as the alt text.
   Nothing in the content makes the page request anything: no images,
   frames, styles, fonts or scripts. The page's only requests are those
   of 3.1, after the user enters a URL (2.3).

Tests for it include, at least: `<script>` and `<img src=x onerror=…>`
in a description (shown as text, nothing runs); a link to
`javascript:alert(1)` and to `JaVaScRiPt:…` (no link); a remote image
(not requested: the browser test's request list stays as in 2.3); a
relative link in both modes.

**As built (PBI-1.2).** `src/markdown.ts` is a small reader, not
CommonMark. What it reads, beyond items 1 to 5:

- **Blocks** (item 3):
  - A heading is an ATX heading (`#` to `######`) indented at most
    three spaces. The page keeps `h1` and `h2` for itself, so a
    project's heading is shown two levels down: `#` as `h3`, `##` as
    `h4`, `###` as `h5`, and `####` and deeper as `h6`.
  - A list item starts with `-`, `*` or `+`, or with one to nine digits
    and `.` or `)`, indented at most three spaces. `+` and `)` are read
    here, in descriptions and documentation files, although the
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
  - A link to a file in folder mode is `href="#"` with the file's path,
    opened in the page (3.4).
- **Heading ids and anchors** (item 4): a heading gets the id
  `md-<n>-<slug>`, so a project's text cannot reach the page's own ids.
  `<n>` numbers each text the page renders (a title, a status field, a
  blocker, a description, a documentation file), counted from 1 since
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
  can read; once the user has typed in it, the page leaves it alone, and
  an emptied field is filled again. Why the user names
  it, and vizi does not ask GitHub: the page knows of no GitHub request
  that answers which owner a fine-grained token's repos belong to (not
  checked, section 4, item 17), asking would send the token before the
  user has used it for anything, and the owner the user means is the
  one in the addresses the user opens. A token named for the wrong owner
  is simply not used for the right one: loads of that owner's repos go
  without it, and GitHub's 404 says so.
- **Where it is entered.** Under the address field: an "Owner" field;
  a "GitHub token (for private repos)" field of type `password`, with
  `autocomplete="off"` and spellcheck off; a "Remember the token" box;
  and a "Use" button. The token field is outside any `<form>`, so a
  browser has no form to offer to save it from; whether a password
  manager still offers to save it is section 4, item 15. A token "Use"d
  for an owner that already has one replaces it. Folder mode never uses
  a token.
- **Never shown back in full.** After "Use" the token field is cleared.
  The page then lists "Tokens in use", one line per owner:
  "`<owner>`: `github_pat_…` and the token's last four characters",
  followed by "saved in this browser" or "for this page only", with that
  owner's own "Remember" box and "Forget" button. Under the list, while
  any token is held, is a "Forget all" button.
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
    was saved, and removes the old key; "Forget" removes the old key.
    An old-key value that is not a valid token is removed.
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
  sites can reach the tokens.
- **Which token a load uses.** At the start of a load by address (3.1),
  the page takes the owner from the address and uses the token held for
  that owner, if any; the umbrella view's "Open in vizi" is such a load
  (3.9). With no token for that owner, the load goes without one, as
  for a public repo (3.1); when GitHub then answers 404 and tokens are
  held for other owners, the message adds "No token is held for
  `<owner>`.". "Show status" in the umbrella view uses the token held,
  at that moment, for the owner of the project on the page (3.9). A load
  keeps the token it started with for all its requests; a load that has
  been replaced by a newer one makes no further request with its token
  (built: the page's fetch refuses before the request is made).
- **Forget, per owner.** An owner's "Forget" removes that owner's token
  from memory and from `localStorage`, and removes its line. Results
  loaded with that owner's token are hidden, since they may hold private
  text: the project, when its load used that token, and the "Project
  status" panel of 3.9, when its status was read with it. Results loaded
  without it stay. It counts as a newer load (3.1, "Two loads at
  once"), so the answer of a load still running is dropped and cannot
  show private text again; the message is "The token for `<owner>` has
  been forgotten.". A token held for one page only is gone when the page
  is closed.
- **Forget all** does what "Forget" does for every owner at once: it
  removes every token from memory, removes the `vizi.githubTokens` key,
  hides every result loaded with any token, counts as a newer load, and
  says "All tokens have been forgotten.".
- **Other open vizi tabs** listen for the `storage` event of
  `vizi.githubTokens`:
  - the key removed (another tab's "Forget all", or storage cleared):
    this tab does "Forget all", whatever tokens it held, and says
    "The tokens were removed in another tab, so they have been
    forgotten.";
  - an owner in the new value's `"forgot"`: this tab does "Forget" for
    that owner, whatever token it held for it;
  - an owner whose saved token is new or changed: this tab adopts it
    for its next loads, as saved, if owner and token match the rules,
    and updates its line; results already shown stay;
  - an owner whose saved copy is gone but who is not in `"forgot"`
    (another tab unticked "Remember"): this tab keeps the token, now for
    this page only. This settles PBI-1.10's point that unticking
    "Remember" in one tab makes every other tab do a full Forget.
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
  load with a token makes two to five requests (with `PROJECTS.md`,
  3.9), all to `api.github.com`. A redirect within `api.github.com`,
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
    access to this repo. Open the project as a local folder instead."
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
- **Rendering and links** are unchanged (3.7). In URL mode, links still
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
    folder mode, the token in no URL, console message or page text,
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
    per owner: the key removed, an owner in `"forgot"`, a new token
    adopted, a saved copy removed without `"forgot"` kept for the page;
    the 401 forgetting the refused token only, not a newer one for the
    same owner; the migration of `vizi.githubToken`;
  - for PBI-1.11, browser: the Owner field filled from the address until
    the user types in it, and left alone after; two owners' tokens, each
    used only for its own owner's address, the umbrella view's "Open in
    vizi" and "Show status" included; a load for an owner with no token
    carries none and its 404 names the owner; each line masked, with its
    own Remember and Forget; Forget for one owner hides only results
    loaded with that owner's token, and drops a running load; Forget
    all; a second tab, for each `storage` case above; the migration
    line, its "Keep for this owner" and "Forget"; a 401 while a new
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
  project it opens, in both modes. In folder mode it reads the file
  from the folder. In URL mode it reads it with one more request 3
  (3.1), only if the file list has it, and, with a token for the
  project's owner, through the contents API as 3.8 sets out for every
  request 3. In URL mode
  this adds one request to a load (counted in 3.1 and 3.8).
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
    address field and loads it in the same page, as a newer load (3.1,
    "Two loads at once"): an answer still due for the umbrella project,
    or for any older load, is dropped. The new project's results replace
    the umbrella's. The load uses the token held for that repo's owner,
    if any (3.8, "Which token a load uses"); a private repo with no
    token for its owner, or one the token does not cover, gets 3.8's 404
    message. The page keeps
    no history: to go back, the umbrella project is opened again, by its
    address or by picking its folder.
  - "On GitHub" links to `https://github.com/<owner>/<repo>` in a new
    tab, with `rel="noopener noreferrer"`.
- **A folder pointer** (`projects/<name>/`) has one link, "Show status".
  It reads `projects/<name>/STATUS.md` of the same project: from the
  folder in folder mode, or in URL mode with one request 3 for that path
  (the contents API, with the token held for the project's owner), only
  if the file list has it. The status is shown in its own panel,
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
- **Tests,** all on synthetic `PROJECTS.md` fixtures written for the
  test; the product office's own file is never copied into this repo:
  - unit (a pure `src/projects.ts`): every rule P1 to P7 and the
    example of `docs/BACKLOG-FORMAT.md` section 5: nesting, skipped
    levels, pointers above the first heading, both pointer kinds and the
    trailing `/`, `.` and `..` refused, comments and fences, the
    reported bullet lines, ignored text and ordered items, repeats, a
    file with no pointer;
  - browser, with GitHub stubbed: no Umbrella tab without the file; the
    tab and the tree with it, in both modes; the page opening on the
    tab when there is no backlog; "Open in vizi" sets the address and
    makes the requests of 3.1 for the new repo, and an older answer
    arriving after it is dropped; "On GitHub" has the right URL,
    target and `rel`; "Show status" in both modes shows the status in
    the panel outside the tree, and the tree holds no status; the
    missing-file message with no request; a second "Show status"
    replaces the panel, and of two in quick succession the newer answer
    wins; a late answer after a newer load is dropped; no status request
    before "Show status" is used; the report items; with a
    token held, "Open in vizi" and "Show status" use it and no request
    goes to `raw.githubusercontent.com`. Choosing the token by owner is
    tested with PBI-1.11 (3.8, "Tests").

---

## 4. Known unknowns

Each is settled in the backlog item that meets it. Items 1 to 6 were
PBI-1.2's; their outcome after it (PR #9):

1. **Open for browsers other than Chromium; PBI-1.4.** Which browser
   feature picks the folder, and whether it works on a page opened from
   disk (`file://`). Settled for Chromium: the page uses a folder input
   (3.1, "As built"), and the folder input reads a folder's files on the
   built page opened from disk (browser test "picks a folder on a page
   opened from disk (file://)", headless Chromium). The test sets the
   files with Playwright's `setInputFiles`, so it does not show the
   browser's own folder picker; that is part of PBI-1.4.
2. **Open; PBI-1.4.** Whether requests to GitHub work from a page opened
   from disk in a real browser. With GitHub's answers stubbed, URL mode
   works on the built page opened from disk (browser test "works on a
   page opened from disk (file://)", headless Chromium); the stub stands
   in for GitHub's CORS answer, so real GitHub was not tried.
3. **Open; PBI-1.4.** GitHub's anonymous rate limit as a browser sees
   it. One load makes one or two `api.github.com` requests (3.1,
   requests 1 and 2) and up to three to `raw.githubusercontent.com`,
   and each "Show status" of the umbrella view one more (3.9). The
   checks in 3.1 ran through a proxy that appears to add credentials, so
   they do not show the anonymous limit.
4. **Open; PBI-1.4.** What an anonymous request for a private repo gets
   back. The page shows "not found or not public" for a 404 on request 1
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
   template's `docs/BACKLOG.md` has about as many) loads in URL mode,
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
