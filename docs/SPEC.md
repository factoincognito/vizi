# Vizi - backlog visualizer — Technical Specification

**Date:** 2026-11-04
**Status:** Intent approved by the product owner, 2026-11-04, in chat
(sections 2 and 3; recorded as a comment on PR #3). In Crog's review.
**Owner:** Clead (technical correctness) / Adam (intent)

The backlog file format the parser reads is in `docs/BACKLOG-FORMAT.md`.

What is decided, and by whom:

- Section 1 lists the product owner's decisions of 2026-11-03 (also in
  `memory/project.md`).
- Sections 2 and 3 were Clead's proposal. The product owner approved
  their intent on 2026-11-04, in chat: "I approve the intent of the vizi
  spec as summarised: inputs, board, list, status, documentation links,
  report tab, build and the web pack rule reading". They are decided.
- Anything marked "Clead's proposal, not decided" is not.

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

Not decided: shipping the format spec as rules and recommendations, read
by a tolerant parser, with a lint mode. That is Clead's suggestion, which
the product owner found worth considering. The rules in
`docs/BACKLOG-FORMAT.md` and the report in 3.5 are written so they fit it.

---

## 2. Architecture

Decided (intent approval, 2026-11-04).

### 2.1 Modules and data flow

```
 folder or URL ──> source (src/main.ts) ──> file texts
                                              │
                    ┌─────────────────────────┴───────────┐
                    v                                     v
      src/backlog.ts: parse(text)            src/status.ts: parse(text)
      -> entries, groups, report             -> fields, last update
                    └─────────────────────────┬───────────┘
                                              v
                    src/main.ts: board, list, status, documentation, report
```

- `src/backlog.ts`: a pure module. It takes a backlog file's text and
  returns the entries (marker, ID, notes, title, description, group,
  line), the groups in file order, and the report of what it could not
  read or read with a warning (3.5). The report is not a second pass: it
  is what the same parser skipped or guessed.
- `src/status.ts`: a pure module. It takes `STATUS.md`'s text and
  returns its fields (3.3).
- `src/main.ts`: reads the files (from the folder or from GitHub) and
  wires the results to the page. It holds no parsing logic.

### 2.2 Build

Built from the web pack as it is: TypeScript, one self-contained
`dist/index.html` (`npm run build`). The pure modules are tested with
Jest, test first; `src/main.ts` is covered by the Playwright tests
(`languages/web/code-standards.md`, "Web rules").

Test fixtures are synthetic, or taken from the public template's
`docs/BACKLOG.md` only. No fixture holds text from a private project's
backlog: this repo is public.

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

Decided: the load check stays as it is, and vizi reads the rule as
covering what the page needs to load. A request the user starts, by
entering a GitHub URL, is allowed. `languages/web/code-standards.md` in
this repo says so. The browser tests stub GitHub's answers with
Playwright routes, so no test reaches the network.

---

## 3. Component specs

Decided (intent approval, 2026-11-04).

### 3.1 Inputs

- **Local folder.** The user picks the project's folder. The page looks
  for the backlog file in this order: `BACKLOG.md`, `docs/BACKLOG.md`,
  `docs/PRODUCT_BACKLOG.md`. It reads the first one found; if more than
  one exists, the report says so. It reads `STATUS.md` at the folder's
  root. Nothing is sent anywhere.
- **GitHub URL.** `https://github.com/<owner>/<repo>`, optionally with a
  branch. The page asks GitHub for the default branch, then tries the
  same three paths, and reads `STATUS.md` at the root. No token is
  stored or asked for. If GitHub answers that the repo is not found, the
  page says "not found or not public" and offers the local folder
  instead.
- `api.github.com` (the contents endpoint) and
  `raw.githubusercontent.com` both answer with
  `Access-Control-Allow-Origin: *`, so a browser page can read them
  (checked with `curl` on 2026-11-03, and again on 2026-11-04 against
  the public template repo).

### 3.2 Views

- **Board.** One column per marker found in the file, in this order
  where present: `NOW`, `NEXT`, `BLOCKED`, `LATER`, `IDEA`, `DONE`,
  `SUPERSEDED`, then any other marker in the order first seen. `DONE`
  and `SUPERSEDED` are collapsed by default.
- **List.** Entries grouped under the file's own headings, in file
  order, with a marker filter and a text search.
- **Card or row.** Shows the marker, the ID, the notes and the title,
  split as `docs/BACKLOG-FORMAT.md` R3 and R4 define. Opening it shows
  the description, rendered as Markdown. Titles are first sentences and
  can be long, so the card shows at most two lines of the title, and the
  whole title when opened.

### 3.3 Status

The page shows `STATUS.md`'s four fields (Phase, Current focus, Next
step, Blockers) and "Last update" above the board. Blockers that start
with "Adam:" or "Product Owner:" are highlighted. Without a
`STATUS.md` the page says so and shows the backlog only. The format
read is in `docs/BACKLOG-FORMAT.md`, section 4.

### 3.4 Links to documentation

- A "Documentation" list of the project's `README.md` and the Markdown
  files in `docs/`, subfolders included. In URL mode the links go to
  github.com; in folder mode they open the file from the folder,
  rendered.
- Every backticked path in an entry (such as `docs/SPEC.md`) that names
  a file in the project becomes a link, in both modes.

### 3.5 Report of what could not be read

A "Report" tab lists, with line numbers, the entries that could not be
read and the entries that were read with a warning, in the categories of
`docs/BACKLOG-FORMAT.md` section 3. It is the same parser; the report
only shows what the parser skipped or guessed.

### 3.6 Build and tests

As in 2.2: `src/backlog.ts` and `src/status.ts` with Jest, test first;
`src/main.ts` with Playwright, with GitHub's answers stubbed (2.3).
Backlog items: PBI-1.1 (the two modules) and PBI-1.2 (the page).

---

## 4. Known unknowns

Not checked; each is settled in the backlog item that meets it.

1. Which browser feature picks the folder (a folder input or the File
   System Access API), and whether it works on a page opened from disk
   (`file://`). PBI-1.2.
2. Whether requests to GitHub work from a page opened from disk. The
   endpoints allow any origin (3.1), but a browser was not tried.
   PBI-1.2.
3. GitHub's anonymous rate limit as a browser sees it. The checks in 3.1
   ran through a proxy that appears to add credentials, so they do not
   show it. PBI-1.2.
4. What an anonymous request for a private repo gets back (the page's
   "not found or not public" message assumes a not-found answer).
   PBI-1.2.
5. How the page behaves on a long backlog, such as the template's
   `docs/BACKLOG.md` (about 1500 lines). PBI-1.2.
6. Clead's proposal, not decided: whether the template's own wording of
   the "no external requests" rule changes as well (2.3). That is a
   template change, through the template's review flow.
