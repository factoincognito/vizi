# Project

**Name:** Vizi - backlog visualizer
**Repo:** factoincognito/vizi
**Description:** Visualizes the progression of your projects

**Goal (the product owner's purpose):** a graphical representation of a
project's status, its work items, their state and description, with
links to the project's documentation.

**Goals:** the product owner's decisions of 2026-11-03. How the first
version works is in `docs/SPEC.md`, whose intent the product owner
approved on 2026-11-04.
- Shows a project's backlog file as a backlog list and as a kanban
  board, with one column per marker (`NOW`, `NEXT`, `LATER` and so on).
- Read-only: the backlog file stays the only source of truth.
- Works for any project whose backlog is close enough to the template's
  format. Finds the backlog at `BACKLOG.md` (repo root),
  `docs/BACKLOG.md` and `docs/PRODUCT_BACKLOG.md`.
- Local mode opens a project folder, not a single file, so documentation
  links work for private projects.
- URL mode reads public GitHub repos only, with no token. Private repos
  are not read by URL.
- Shows the project's status, read from its `STATUS.md`.
- A generated web page, built with the template's web pack. The first
  version is opened locally, not deployed (2026-11-03). Replaced on
  2026-11-04: it is published on GitHub Pages,
  https://factoincognito.github.io/vizi/ (PBI-1.7); a local build still
  works.
- The page reports what it could not read. No command-line lint for CI
  in the first version.
- A backlog format spec ships with it.

**Definition of done for this phase:**
[Product Owner decides] (Clead's proposal is parked as a question in
`docs/NEXT_SESSION.md`, entry 1.)

## Migration source
N/A — new project.
