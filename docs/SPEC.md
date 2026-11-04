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
    PBI-1.8).
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

**Browser storage.** Every Pages site of the factoincognito account is
served from one origin, `https://factoincognito.github.io`, so they all
share that origin's browser storage (local storage, IndexedDB and the
like). Until PBI-1.8, vizi stores nothing in the browser: `src/` uses
no storage API. From PBI-1.8 it saves one thing, the token, when the
user asks it to (3.8), and every other factoincognito Pages site can
read it. A custom domain would give vizi an origin of its own.

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

- Until PBI-1.8 the page sets none, neither as a header nor as a
  `<meta>` tag. GitHub Pages cannot send custom response headers, and
  the single-file build inlines the page's script and style.
  Untrusted content is handled by the rendering contract (3.7): no
  source text is inserted as HTML, and content loads nothing.
- PBI-1.8 adds one, because the page then holds a secret, the token
  (3.8). It is a `<meta http-equiv="Content-Security-Policy">` tag,
  the first element in `<head>`:

  ```
  default-src 'none'; script-src 'sha256-<script>';
  style-src 'sha256-<style>'; connect-src https://api.github.com
  https://raw.githubusercontent.com; img-src data:; base-uri 'none';
  form-action 'none'
  ```

  `<script>` and `<style>` are the SHA-256 hashes of the page's one
  inline script and one inline style block, computed by the build after
  the single-file plugin has inlined them, and written into the tag.
  `'unsafe-inline'` is not used. The built page has exactly one inline
  module script, one `<style>` block, no `style=` attribute and no
  `on…=` attribute (checked 2026-11-04 on a build of `main`), so hashes
  cover everything it runs. `img-src data:` is for the inline favicon.
- What it adds: even if a defect let content run script, that script
  could not send the token to any host other than GitHub's, through
  `fetch` or the like, and no script other than the build's own runs.
- What it does not do: a `<meta>` policy cannot set `frame-ancestors`
  or reporting; it does not stop a script from navigating away with
  data in the address; and it does not protect storage from other
  factoincognito Pages sites (2.2). 3.7 stays the first protection.

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
  a token, 3.8 changes them):
  1. `GET https://api.github.com/repos/<owner>/<repo>`, for the default
     branch (skipped when the URL names a branch);
  2. `GET https://api.github.com/repos/<owner>/<repo>/git/trees/<branch>?recursive=1`,
     the file list: it tells which of the three backlog paths exist, and
     feeds the documentation list and the path links (3.4);
  3. `GET https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>`,
     once for the backlog file and once for `STATUS.md`, each only if
     the file list has it; documentation files are not fetched (3.4).

  So one load makes one or two requests to `api.github.com` (requests 1
  and 2) and up to two to `raw.githubusercontent.com` (request 3): two
  to four in all when the backlog file is found. If request 1 or 2 answers
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

### 3.8 Private repos with a saved token (PBI-1.8)

**(approved)** The product owner's intent approval of 2026-11-04 (see
"What is decided", item 4): a fine-grained, read-only GitHub token,
limited to chosen repos and with an expiry he chooses, pasted into vizi
once per browser, saved in the browser's storage behind a "Remember the
token" box, removed with a "Forget the token" button, sent only to
GitHub.

Clead's design, within that intent. This is a spec ahead of its code:
PBI-1.8 builds it.

- **What token.** Only a fine-grained personal access token, the kind
  that GitHub limits to chosen repos and gives an expiry. It is
  expected to need the repository permission "Contents: read" (and
  "Metadata: read", which GitHub adds to every such token); PBI-1.8
  confirms it (section 4, items 10 and 11). The page takes only text
  that starts with `github_pat_` after trimming; anything else, a
  classic `ghp_` token included, is refused with a message saying so,
  and is not kept.
- **Where it is entered.** A field "GitHub token (for private repos)"
  under the address field, of type `password`, with `autocomplete="off"`
  and spellcheck off, a "Remember the token" box (not ticked unless a
  token is already saved) and a "Use" button. Folder mode never uses
  the token.
- **Never shown back in full.** After "Use" the field is cleared. The
  page then shows only "Token in use: `github_pat_…` and its last four
  characters", followed by "saved in this browser" or "for this page
  only", and the "Forget the token" button.
- **Where it is kept.**
  - Always in the page's memory, while the page is open.
  - With "Remember the token" ticked, also in `localStorage` under the
    key `vizi.githubToken`, so it survives a reload: entered once per
    browser. Unticking the box later removes the saved copy and keeps
    the token for this page only. At startup the page reads the key; a
    value that does not start with `github_pat_` is removed.
  - **The risk:** the published page's storage belongs to the origin
    `https://factoincognito.github.io`, which every Pages site of the
    factoincognito account shares (2.2). Any script on any of those
    sites, now or later, can read the saved token. That is why only a
    read-only token, limited to chosen repos and with an expiry, is
    taken; why "Remember the token" is off until the user ticks it; and
    why the page says, next to the box, that other factoincognito Pages
    sites can read a saved token. A custom domain would remove the
    sharing.
- **Forget the token.** It removes the token from memory, removes the
  `localStorage` key, clears the field and the "Token in use" line, and
  hides any results that were loaded with the token, since they may
  hold private text. Another open vizi tab drops its copy too: the page
  listens for the `storage` event of that key. A token held for one
  page only is gone when the page is closed.
- **Which requests carry it.** Only requests to `https://api.github.com`,
  in an `Authorization: Bearer <token>` header, with `credentials:
  "omit"` (no cookies) and `cache: "no-store"` (private answers are not
  kept in the browser's cache). With a token held, every request of a
  load goes to `api.github.com`, private and public repos alike, and
  `raw.githubusercontent.com` is not used. Requests 1 and 2 are as in
  3.1. Request 3 becomes
  `GET https://api.github.com/repos/<owner>/<repo>/contents/<path>?ref=<branch>`
  with `Accept: application/vnd.github.raw+json`, which answers the
  file's text (checked 2026-11-04 without a token, on a public file:
  the text came back as `application/vnd.github.raw+json` with
  `Access-Control-Allow-Origin: *`). The branch and each segment of the
  path are percent-encoded. So a load with a token makes two to four
  requests, all to `api.github.com`.
- **Never in an address, a log or a message.** The token is never put
  in a URL, never written to the console, and never part of an error
  message, the report or the page's text; messages name the host, the
  URL and the HTTP status only, and no URL holds the token.
- **Answers** (with a token; without one, 3.1 is unchanged):
  - **401:** GitHub did not accept the token: it has expired, has been
    revoked, or is wrong. The page says so ("GitHub refused the token:
    it may have expired. It has been forgotten; enter a new one."), and
    forgets it as "Forget the token" does, so a dead token does not
    break later loads of public repos.
  - **403:** when `X-RateLimit-Remaining` is `0`, the page says the
    rate limit is reached and when it resets (`X-RateLimit-Reset`).
    Otherwise it says the token may not read this repo (a missing
    "Contents: read" permission, or an organisation's token policy).
    The token is kept.
  - **404 on request 1 or 2:** "Not found, or the token does not give
    access to this repo", offering the local folder. GitHub is expected
    to answer 404 for a private repo the token cannot see (section 4,
    item 11). The token is kept.
  - Any other failure is shown as in 3.1.
- **Expiry.** The page does not try to know a token's expiry before
  GitHub refuses it. `api.github.com` exposes to a page only the
  headers in its `Access-Control-Expose-Headers` list, and no header
  about a token's expiry is in it (read 2026-11-04 on an answer without
  a token). An expired token is met by the 401 rule.
- **Rendering and links** are unchanged (3.7). In URL mode, links still
  go to github.com, where a private file needs the user's own GitHub
  sign-in.
- **Tests,** all with GitHub stubbed and synthetic tokens:
  - unit (a pure `src/token.ts`, storage passed in): the `github_pat_`
    check, the masked form, save, read at startup, forget, the
    `storage` event;
  - unit (`src/github.ts`): with a token, every request goes to
    `api.github.com` with the header, request 3 uses the contents API
    and the raw media type, no URL holds the token; the 401, 403 and
    404 mapping;
  - browser: the field is a password field and is cleared; the masked
    line; "Remember" writes `localStorage` and a reload finds it;
    "Forget" clears memory, storage, the line and token-loaded results;
    no request to `raw.githubusercontent.com` while a token is held;
    the token appears in no request URL, console message or page text;
    a 401 forgets the token;
  - the CSP of 2.3: the tag is present and first in `<head>`, its
    hashes match the built page's inline blocks, the page loads with no
    policy violation, and a request to another host is blocked.

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
   requests 1 and 2) and up to two to `raw.githubusercontent.com`. The
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

Items 9 to 14 are PBI-1.8's (3.8); PBI-1.8 says to check first that
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
14. **Open; PBI-1.8.** Whether build-time hashes of the inline script
    and style can be written into the `<meta>` policy with the
    single-file plugin, and whether every browser the page targets
    applies the policy with no violation.
