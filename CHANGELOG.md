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

## Project created

- Bootstrapped from the Clead + Crog project template
  v2.8.5, built from
  factoincognito/ai-project-template-v2@010b12ed07f51cd03036e9ff628723aa2f5dbe07.
- Language pack: web.
- Licence: polyform-noncommercial-1.0.0.
- Set up by bootstrap-project.sh.
