# Changelog

All notable changes to Vizi - backlog visualizer are documented here.

## [Unreleased]

- Project description, status and first backlog: purpose and goals from the product owner's decisions, `STATUS.md`, Phase 1 backlog (PBI-1.1 parser, PBI-1.2 page, PBI-1.3 template link) (#2).
- Technical spec and backlog format spec: `docs/SPEC.md` and `docs/BACKLOG-FORMAT.md`, with the product owner's intent approval of 2026-11-04 and Clead's design within it; the web pack's external-requests rule read as covering what the page loads at startup (#3).
- Changelog for #2 and #3 (#5).
- Spec: HTML comments in a backlog file are dropped (rule R9) (#4).
- Backlog parser and report (`src/scan.ts`, `src/backlog.ts`) and `STATUS.md` reader (`src/status.ts`), tested with Jest on synthetic fixtures (PBI-1.1) (#6).
- Spec: edge cases settled from the PBI-1.1 review, and the description indent rule for rendering (#7).
- Backlog and changelog: PBI-1.1 done, PBI-1.2 started (#8).
- The page (PBI-1.2): folder and public GitHub URL input, board and list, status, documentation links, report tab, and the rendering contract for untrusted content (`src/markdown.ts`, `src/github.ts`, `src/docs.ts`, `src/board.ts`, `src/main.ts`); browser tests with GitHub stubbed (#9).
- Backlog and changelog: PBI-1.2 done; PBI-1.4 (open known unknowns) and PBI-1.5 (review follow-ups) added (#10).
- Spec: the readings the page implements, recorded as built; known unknowns updated (#11).
- Backlog: three more points for PBI-1.5 (#12).
- Backlog: PBI-1.4 covers the browser's own folder picker (#13).
- Changelog for #10 to #13 (#14).
- PBI-1.3 done; status after the first version (#15).
- Markdown and rendering (PBI-1.5 part 1): headings in any script get anchors, one 4096-character limit for link targets, faster on hostile lines, unique heading ids, relative link targets fully percent-decoded (#16).
- Page and load (PBI-1.5 part 2): the newest load wins, non-Markdown files open as code, a stricter stray-request guard in the browser tests, tests for a truncated file list (#17).
- PBI-1.5 done; PBI-1.6 (review follow-ups) added; changelog for #14 to #17 (#18).
- Spec: matches the code after PBI-1.5 (link decoding, heading ids, two loads at once, files shown as code) (#19).
- Changelog for #18 and #19 (#20).
- Backlog: PBI-1.7 GitHub Pages and PBI-1.8 saved token (#21).
- PBI-1.7: vizi is published on GitHub Pages by `.github/workflows/pages.yml`; structure tests of the workflow with the `yaml` devDependency; a sub-path check of the built page (#22).
- Spec: published on GitHub Pages (#23).
- Backlog: PBI-1.8 intent approved (#24).
- PBI-1.7 done: vizi is live on GitHub Pages; status and changelog (#25).
- Spec: private repos with a saved token, a Content-Security-Policy, and the shared-origin risk (PBI-1.8) (#26).
- PBI-1.8 waits on the defence choice; changelog (#27).
- PBI-1.8 unblocked: the Pages-origin rule chosen (#28).
- Spec: the chosen defence for the shared origin (#29).
- PBI-1.8 part 1: Content-Security-Policy in the built page, with build-time hashes (#30).
- PBI-1.8 part 2: private repos by address with a saved, read-only GitHub token (#31).
- Backlog: PBI-1.9 the umbrella view (#32).
- Spec: the umbrella view (PBI-1.9) (#33).
- PBI-1.8 done; PBI-1.9 now; PBI-1.10 from the reviews; changelog (#34).
- PBI-1.9: the umbrella view — the Umbrella tab with the tree from PROJECTS.md, Open in vizi, On GitHub and Show status (#35).
- Backlog: PBI-1.10 gains #35's follow-ups (#36).
- Backlog: PBI-1.11 tokens per owner, PBI-1.12 saved repos (#37).
- A flaky token browser test now waits for the new load's requests (#38).

## Project created

- Bootstrapped from the Clead + Crog project template
  v2.8.5, built from
  factoincognito/ai-project-template-v2@010b12ed07f51cd03036e9ff628723aa2f5dbe07.
- Language pack: web.
- Licence: polyform-noncommercial-1.0.0.
- Set up by bootstrap-project.sh.
