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
- Local mode opened a project folder, not a single file, so documentation
  links worked for private projects (2026-11-03). Replaced on 2026-11-04
  (15:15, "apyr"; `docs/SPEC.md` "What is decided", item 9; PBI-1.14):
  vizi opens projects from GitHub only, public by address, private with
  the saved token. It no longer opens a local folder.
- URL mode reads public GitHub repos only, with no token. Private repos
  are not read by URL (2026-11-03). Replaced on 2026-11-04: private repos
  by address with a saved, read-only GitHub token (PBI-1.8).
- Shows the project's status, read from its `STATUS.md`.
- A generated web page, built with the template's web pack. The first
  version is opened locally, not deployed (2026-11-03). Replaced on
  2026-11-04: it is published on GitHub Pages,
  https://factoincognito.github.io/vizi/ (PBI-1.7); a local build still
  works.
- The page reports what it could not read. No command-line lint for CI
  in the first version.
- A backlog format spec ships with it.

**Definition of done for this phase** (product owner, 2026-11-11,
"apyr" to Clead's proposal): Phase 1 is done when all of these hold.
1. The published page, https://factoincognito.github.io/vizi/, opens a
   public repo by `owner/repo` or by `?repo=`, and for the public
   template's backlog (`factoincognito/ai-project-template-v2`) shows the list, the board, the status, the
   documentation links and the report of what could not be read.
2. The product owner's first try of tokens against real GitHub is done
   and its result recorded in the spec (`docs/SPEC.md` section 4,
   items 9 to 12 and 15; items 13 and 14 stay with PBI-1.4).
3. CI `build` is green on `main` and the latest Pages deploy succeeded.
4. Every Phase 1 item that changes what the product does is `DONE`,
   except the items named under "Not part of it" below.

Not part of it: the optional review points (PBI-1.10, PBI-1.6), the
remaining unknowns of section 4 (PBI-1.4), the `LATER` items, and the
re-checks of the audit findings (PBI-1.31 to PBI-1.33).

## Migration source
N/A — new project.
