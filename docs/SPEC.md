# Vizi - backlog visualizer — Technical Specification

**Date:** 2026-11-04
**Status:** Intent approved by the product owner, 2026-11-04 (the summary
quoted below; recorded on PR #3). In Crog's review.
**Owner:** Clead (technical correctness) / Adam (intent)

The backlog file format the parser reads is in `docs/BACKLOG-FORMAT.md`.

## What is decided, and what is Clead's design

**Decided by the product owner.** Two sets of decisions, and nothing else:

1. His decisions of 2026-11-03, listed in section 1 (also in
   `memory/project.md`).
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

**Clead's design (the HOW), within the approved intent.** Everything else
in sections 2 and 3, and the rules in `docs/BACKLOG-FORMAT.md`. It is
Clead's call, not a question for the product owner, and it does not
block building. It changes through a reviewed PR like any spec change.
Points that come from the approved summary are marked **(approved)**.

**Not decided.** Marked "not decided" where they appear: a lint mode
beyond the page's report (section 1), and a change to the template's own
wording of the external-requests rule (section 4, item 7).

---

## 1. System overview

**Purpose (product owner):** a graphical representation of a project's
status, its work items, their state and description, with links to the
project's documentation.

**Decided by the product owner (2026-11-03):**

- vizi shows a project's backlog file as a backlog list and as a kanban
  board, with columns by marker (`NOW`, `NEXT`, `LATER` and so on). It
  only reads; the backlog file stays the only source of truth.
- It works for any project whose backlog is close enough to the
  template's format. It finds the backlog at `BACKLOG.md` (the project's
  root), `docs/BACKLOG.md` and `docs/PRODUCT_BACKLOG.md`.
- It reads a public GitHub repo by its URL, with no token (private repos
  are not read by URL), and local files. Local mode opens a project
  folder, not a single file, so documentation links work for private
  projects.
- A project's status is read from its `STATUS.md`.
- It is a generated web page, built with the template's web pack
  (`languages/web/`). The first version is opened locally, not
  deployed; deployment comes later.
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

The first version is opened locally, not deployed. The pack's
`deploy.yml` is in `languages/web/` and not in `.github/workflows/`, so
it does not run in this repo (checked at `0191768`). Deployment, when it
comes, is its own backlog item.

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
reaches the network.

---

## 3. Component specs

Clead's design, within the approved intent. Points from the approved
summary are marked **(approved)**.

### 3.1 Inputs

- **(approved)** A local project folder, or a public GitHub repo
  address. The backlog file is looked for as `BACKLOG.md`,
  `docs/BACKLOG.md` and `docs/PRODUCT_BACKLOG.md`; `STATUS.md` is read.
- **Order.** The three paths are tried in that order, and the first one
  found is read. When more than one exists, the report says so and names
  the one read.
- **Local folder.** The user picks the project's folder. `STATUS.md` is
  read at the folder's root. Nothing is sent anywhere.
- **GitHub URL.** `https://github.com/<owner>/<repo>`, optionally
  followed by `/tree/<branch>`. No token is stored or asked for. The
  page makes these anonymous requests, in this order:
  1. `GET https://api.github.com/repos/<owner>/<repo>`, for the default
     branch (skipped when the URL names a branch);
  2. `GET https://api.github.com/repos/<owner>/<repo>/git/trees/<branch>?recursive=1`,
     the file list: it tells which of the three backlog paths exist, and
     feeds the documentation list and the path links (3.4);
  3. `GET https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>`,
     once for the backlog file and once for `STATUS.md` if the file list
     has it; documentation files are not fetched (3.4).

  So one load makes three or four requests. If request 1 or 2 answers
  404, the page says "not found or not public" and offers the local
  folder instead. Any other failed request is shown with its HTTP status
  and is not retried.
- `api.github.com` and `raw.githubusercontent.com` both answer with
  `Access-Control-Allow-Origin: *`, so a browser page can read them
  (checked with `curl` on 2026-11-03, and again on 2026-11-04 against
  the public template repo).

### 3.2 Views

- **(approved) Board.** One column per marker found in the file, in this
  order where present: `NOW`, `NEXT`, `BLOCKED`, `LATER`, `IDEA`, then
  `DONE` and `SUPERSEDED` folded (collapsed until opened). Clead's
  design for the rest: `MOVED` comes after `SUPERSEDED` and is folded
  too, since its entries are tracked elsewhere; any other marker comes
  last, in the order first seen, and is not folded. A column shows its
  entry count.
- **(approved) List.** Entries grouped under the backlog's own headings,
  in file order, with a marker filter and a text search. Entries before
  the first heading are shown under "(no heading)". The search matches
  the ID, the notes, the title and the description, ignoring case.
- **Card or row.** Shows the marker, the ID, the notes and the title,
  split as `docs/BACKLOG-FORMAT.md` R3 and R4 define. Titles are first
  sentences and can be long, so a card shows at most two lines of the
  title, and the whole title when opened. Opening it shows the
  description, rendered as Markdown under the contract in 3.7.

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

### 3.5 Report of what could not be read

**(approved)** A report tab of what could not be read, with line numbers.

Clead's design: the report lists, with line numbers, what the parsers
skipped or guessed, sorted into the three kinds of
`docs/BACKLOG-FORMAT.md` section 3 (not read, read with a warning,
info), plus what `src/status.ts` could not read and the input notes of
3.1 (more than one backlog file). It is the same parsers; the report is
not a second pass. The tab shows the number of items of each kind.

### 3.6 Build and tests

As in 2.2: `src/backlog.ts` and `src/status.ts` with Jest, test first,
on synthetic fixtures (PBI-1.1); `src/markdown.ts` with Jest and the
page with Playwright, with GitHub's answers stubbed (PBI-1.2). Every
rule of `docs/BACKLOG-FORMAT.md` and every point of 3.7 gets at least
one test, written before the code.

### 3.7 Rendering contract

All text vizi shows comes from a project it does not control: a backlog,
a `STATUS.md` or a documentation file, possibly from any public repo. It
is untrusted. The contract, which `src/markdown.ts` and the page keep and
the tests check:

1. **No raw HTML.** HTML in the source, block or inline, is never turned
   into elements: it is shown as text, escaped. HTML comments
   (`<!-- … -->`) are dropped. No script, style, event handler or
   element from the source ever reaches the page.
2. **What Markdown becomes.** Headings, paragraphs, lists, emphasis and
   strong emphasis, code spans, fenced code, block quotes and links.
   Anything else (tables, footnotes, and so on) is shown as its plain
   text. The page builds elements from `src/markdown.ts`'s tree with DOM
   calls that set text (`textContent`), never by inserting source text
   as HTML.
3. **Links.** A link becomes a clickable link only when its target,
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
4. **No loads from content.** Images are never loaded: `![alt](url)` is
   shown as a link with the alt text, under rule 3, or as the alt text.
   Nothing in the content makes the page request anything: no images,
   frames, styles, fonts or scripts. The page's only requests are those
   of 3.1, after the user enters a URL (2.3).

Tests for it include, at least: `<script>` and `<img src=x onerror=…>`
in a description (shown as text, nothing runs); a link to
`javascript:alert(1)` and to `JaVaScRiPt:…` (no link); a remote image
(not requested: the browser test's request list stays as in 2.3); a
relative link in both modes.

---

## 4. Known unknowns

Not checked; each is settled in the backlog item that meets it.

1. Which browser feature picks the folder (a folder input or the File
   System Access API), and whether it works on a page opened from disk
   (`file://`). PBI-1.2.
2. Whether requests to GitHub work from a page opened from disk. The
   endpoints allow any origin (3.1), but a browser was not tried.
   PBI-1.2.
3. GitHub's anonymous rate limit as a browser sees it. One load makes
   two or three `api.github.com` requests (3.1, requests 1 and 2) and one
   or two to `raw.githubusercontent.com`. The checks in 3.1 ran through a
   proxy that appears to add credentials, so they do not show the
   anonymous limit. PBI-1.2.
4. What an anonymous request for a private repo gets back (the page's
   "not found or not public" message assumes a 404). PBI-1.2.
5. Whether the file list (3.1, request 2) can come back truncated for a
   large repo, and what the page does then. PBI-1.2.
6. How the page behaves on a long backlog, about 1500 lines (the length
   of the template's `docs/BACKLOG.md`), tested with a synthetic file of
   that size. PBI-1.2.
7. Not decided: whether the template's own wording of the "no external
   requests" rule changes as well (2.3). That is a template change,
   through the template's review flow.
