# Vizi - backlog visualizer — Technical Specification

**Date:** 2026-11-04
**Status:** Intent approved by the product owner, 2026-11-04 (the summary
quoted below; recorded on PR #3). The paragraphs headed "As built
(PBI-1.2)" record what the page does, so spec and code agree.
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
wording of the external-requests rule (section 4, item 8).

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
  `/tree/`, a trailing `/` dropped (branch names can hold `/`). No token
  is stored or asked for. The page makes these anonymous requests, in
  this order:
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
  request 1 without a default branch, or to request 2 without a file
  list, is reported as not understood. After any failed load, and after
  a refused address, the previous project's results are cleared and
  hidden.
- **Two loads at once.** When a second address is submitted before the
  first load has ended, both run, and the one that ends last is shown.
  Ignoring the older answer is PBI-1.5.
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
  the Documentation tab under its path. The file is read as text and
  rendered as Markdown under 3.7, whatever its type; relative links in it
  resolve against its own path. A file that cannot be read shows
  "`<path>` could not be read." Showing non-`.md` files as code is
  PBI-1.5.

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
read or `STATUS.md`; an input note (3.1: more than one backlog file, a
truncated file list) has no line and shows its message only.

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
    `h4`, and `####` and deeper as `h6`.
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
  - A destination is `<…>` with no line break, at most 4095 characters,
    or written bare, at most 4096 characters, ending at a space or an
    unmatched `)`. A title in `"…"` or `'…'` may follow. A longer
    destination is not read: the text is not a link, and its brackets
    and parentheses are shown as text. One limit for both forms is
    PBI-1.5.
  - A target with a scheme is a link only as `https://` or `http://`
    with a host, normalised by the browser's URL parser. Every such link
    opens in a new tab with `rel="noopener noreferrer"`.
  - A target that starts with `//`, holds a `\`, or has a `:` in its
    first path segment is text.
  - A relative target loses its `?…` or `#…` part and is
    percent-decoded; bad percent-encoding makes it text. A target that
    starts with `/` resolves from the project's root. `.` and `..`
    segments are resolved, and a target that leaves the project is
    text.
  - An anchor (`#…`) is percent-decoded (bad encoding is kept as
    written) and turned into a slug like a heading's. An anchor whose
    slug is empty is text.
  - A link inside a link's label is shown as its text, so a link is
    never inside a link.
  - A link to a file in folder mode is `href="#"` with the file's path,
    opened in the page (3.4).
- **Heading ids and anchors** (item 4): a heading gets the id
  `md-<slug>` and an anchor link points at `#md-<slug>`, so a project's
  text cannot reach the page's own ids. The slug is the heading's text in
  lower case, with every run of characters other than `a` to `z` and
  `0` to `9` made one `-`, and `-` dropped at both ends. Only ASCII
  letters and digits are kept: `Översikt` gives `versikt`, and a heading
  with no ASCII letter or digit gets no id (Unicode slugs are PBI-1.5).
  Ids are not made unique: the same description open in a board card and
  in a list row, or the same heading twice, gives the same id twice
  (PBI-1.5).
- **Images** (item 5): `![alt](url)` is a link whose text is the alt
  text, not read as Markdown, when its target is allowed under item 4;
  otherwise it is the alt text alone.

---

## 4. Known unknowns

Each is settled in the backlog item that meets it. Items 1 to 6 were
PBI-1.2's; their outcome after it (PR #9):

1. **Open for browsers other than Chromium; PBI-1.4.** Which browser
   feature picks the folder, and whether it works on a page opened from
   disk (`file://`). Settled for Chromium: the page uses a folder input
   (3.1, "As built"), and picking a folder works on the built page
   opened from disk (browser test "picks a folder on a page opened from
   disk (file://)", headless Chromium).
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
5. **Settled (PBI-1.2).** What the page does with a truncated file list:
   it reads the files it got and says so under the address and in the
   report (3.1, "As built"; browser test "tells that the file list was
   truncated"). When GitHub truncates a list was not checked; the page
   reads GitHub's `truncated` flag.
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
