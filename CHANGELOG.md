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
- PBI-1.9 done; PBI-1.11 now; changelog for #34 to #38 (#39).
- Spec: one saved token per owner (PBI-1.11) (#40).
- Backlog: PBI-1.13 the help view (#41).
- PBI-1.11: one saved GitHub token per owner, picked by the owner in the address, with Remember and Forget per owner, Forget all, and the move of an earlier saved token (#42).
- PBI-1.11 done; PBI-1.13 now; changelog for #39 to #42 (#43).
- Spec: the help view (PBI-1.13) (#44).
- PBI-1.13: the help view, "How to make your project vizi compatible", opened from the start page, with the read-only sentence and five steps (#45).
- Backlog: PBI-1.14 drop local folders, PBI-1.15 branch picker (#46).
- Spec: vizi opens projects from GitHub only (PBI-1.14) (#47).
- Backlog: read-only kept for now; folder lines updated (#48).
- Backlog: PBI-1.16 start page redesign (#49).
- Backlog: PBI-1.10 gains #45's follow-ups (#50).
- Spec: the help view says vizi is read-only (PBI-1.13) (#51).
- Backlog: token guide in PBI-1.16; read-only line in PBI-1.13 (#52).
- Backlog: PBI-1.16 says who can use a saved token (#53).
- Backlog: PBI-1.16 advises not saving tokens on a shared computer (#54).
- The flaky second-tab and CSP browser tests made reliable (#55).
- Backlog: PBI-1.17 prefilled GitHub address (#56).
- Spec: the start page redesign (PBI-1.16), with Inter 4.1 under the OFL and the token guide from GitHub's docs (#57).
- Backlog: PBI-1.17 becomes the Repository field (#58).
- Spec: the branch picker (PBI-1.15) (#59).
- Backlog: PBI-1.10 gains the markdown timing test (#60).
- Spec: the saved repos list (PBI-1.12) (#61).
- PBI-1.13 done; PBI-1.14 now; changelog for #43 to #61 (#62).
- PBI-1.14: vizi opens projects from GitHub only; the local folder input, its code and tests, and the help view's folder step removed (#63).
- Backlog: PBI-1.17, PBI-1.10 and PBI-1.6 join the unattended run (#64).
- Spec: the Repository field (PBI-1.17) (#65).
- Backlog: PBI-1.10 drops what #55 fixed (#66).
- PBI-1.17: the Repository field, which takes `owner/repo` or a full GitHub address (#67).
- PO-68 pilot, part A: Crog's pull request review runs in CI as a script on the Claude Agent SDK (`.github/workflows/crog-review.yml`, `.github/reviewer/`), with `THIRD-PARTY-NOTICES.md` (#68).
- Spec: the Repository hint reads `<owner>/<repo>` (PBI-1.17) (#69).
- PO-68 pilot, part B: the CI reviewer is Crog for this repo's PRs during the pilot (`CLAUDE.md` rule 7, `memory/standards.md` section 7) (#70).
- Changelog: the PO-68 pilot (#68, #70) (#71).
- Backlog: PBI-1.10 gains spec points from #63 and #67 (#72).
- PBI-1.16: the start page redesign, with "Open a project from GitHub", the help link in the header, the folded "Private repos" panel with one row per owner and the token guide, and Inter built into the page (#73).
- Backlog: PBI-1.18 umbrella help text (#74).
- Backlog: PBI-1.18 also explains pre-projects (#75).
- Backlog: PBI-1.19 idea, guided opening (#76).
- Backlog: PBI-1.19 decided; PBI-1.14 and PBI-1.17 done; PBI-1.16 now (#77).
- CI review: review-free PRs are skipped, and the prompt cache lasts 1 hour (`.github/reviewer/review.mjs`) (#78).
- `CLAUDE.md`: review-free files and skipped heads (PO-68) (#79).
- Spec: the umbrella help text (PBI-1.18) (#80).
- PBI-1.15: the branch picker, a list of the loaded repo's branches under the project's heading, and "Open branch" to load the one picked (#81).
- Spec: guided opening from the Repository field (PBI-1.19) (#82).
- NEXT_SESSION: the PBI-1.19 spec parked for the product owner (#83).
- PBI-1.18: the umbrella help text, which explains umbrellas and pre-projects in the umbrella view (#84).
- Backlog: the remaining review follow-ups under PBI-1.10 (#87).
- Cutover to the product office's Rules and Processes (PO-72): `RULES.md` with the sign-off and vizi's local rules; `CLAUDE.md` a short entry point; `docs/CROG_ONBOARDING.md` and `memory/roles.md` removed; restated rules stripped from the docs (#88).
- CI review: the reviewer reads `RULES.md` as a fourth review document (`.github/reviewer/review.mjs`) (#89).
- NEXT_SESSION: entry 2 (a) wording, and a note on #85's base after #89 (#90).
- PBI-1.19: the guided opening, which reads an owner's repos and a repo's branches as the Repository field is typed or left, and offers them in a select (#85).
- Backlog: the findings of the product office's audit of 2026-11-06 filed as PBI-1.20 to PBI-1.33 (#91).
- Audit fixes (PBI-1.21 to PBI-1.27, PBI-1.29, PBI-1.30): restated global rules cut to pointers to the product office's Rules; the CI reviewer's instructions gain the review checks it can no longer read in `memory/standards.md`; changelog lines for #87 to #90 (#92).
- Records: changelog lines for #85, #91 and #92, and the #85 review follow-ups under PBI-1.10 (#94).
- Spec: the include keyword (PO-105), `docs/SPEC.md` 3.15, with the product owner's intent approval of 2026-11-07 (#93).
- Rules: L § 4 (1) cites the override of § 34 (2) (PBI-1.28) (#95).
- Backlog: PBI-1.34, the include keyword build (#96), put first in the order (#97).
- The include keyword (PBI-1.34): a backlog file includes other files of the same repo and branch with `<!-- vizi:include <path> -->` (`src/include.ts`); included entries on the board and in the list naming their file, the report by file, the message line; `docs/BACKLOG-FORMAT.md` section 6; `docs/SPEC.md` 3.15 built, with 2.3, 3.1, 3.2, 3.5, 3.7, 3.8, 3.13 and section 4 updated; `RULES.md` L § 5 (1) gains the one exception for include lines (#98).

## Project created

- Bootstrapped from the Clead + Crog project template
  v2.8.5, built from
  factoincognito/ai-project-template-v2@010b12ed07f51cd03036e9ff628723aa2f5dbe07.
- Language pack: web.
- Licence: polyform-noncommercial-1.0.0.
- Set up by bootstrap-project.sh.
