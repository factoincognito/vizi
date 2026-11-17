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
- Added on 2026-11-11: a note in the "Private repos" panel that there is
  one token per owner and that a new one replaces the old (3.12; PBI-1.38).

Not decided: a lint mode beyond the page's report (Clead's suggestion,
which the product owner found worth considering). The parser is
tolerant by design: it reads what it can and reports the rest (3.5).

---

