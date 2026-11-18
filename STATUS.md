<!--
How to keep this file: product-office Process P-9 § 6.
-->

# Status

Last update: 2026-11-18

## Phase
Build: the first version is built and published at https://factoincognito.github.io/vizi/ (PBI-1.1 to PBI-1.3, PBI-1.5, PBI-1.7 to PBI-1.9, PBI-1.11, PBI-1.13, PBI-1.14 and PBI-1.17 merged 2026-11-04, PBI-1.16 and PBI-1.15 on 2026-11-05, PBI-1.19 on 2026-11-06 in #85, PBI-1.34 on 2026-11-07 in #98, [PBI-1.35](https://github.com/factoincognito/vizi/blob/main/docs/BACKLOG.md?plain=1) on 2026-11-09 in [#100](https://github.com/factoincognito/vizi/pull/100), [PBI-1.12](https://github.com/factoincognito/vizi/blob/main/docs/BACKLOG.md?plain=1) on 2026-11-09 in [#101](https://github.com/factoincognito/vizi/pull/101)).

## Current focus
None in progress. PBI-1.10's PRs that change no behaviour (groups D to I of the inventory, #114 to #119 and #121) and its spec PRs A and B (#122, #123) are merged (2026-11-18), and so is group J (point 46, #126); point 48 is in #127, a spec change that waits for Adam's intent approval; the rest of PBI-1.10 is the decisions and the behaviour-changing PRs C and K. Of the audit findings of 2026-11-06, PBI-1.31 to PBI-1.33 are re-checked at the next audit.

## Next step
[PBI-1.10](https://github.com/factoincognito/vizi/blob/main/docs/BACKLOG.md?plain=1) and PBI-1.6, in the backlog's order, then PBI-1.4. The rest of PBI-1.10 (the rate-limit messages C, the decisions K, and point 48 in #127) and the loose ends listed in its backlog detail follow; its points are in [`docs/PBI-1.10-inventory.md`](https://github.com/factoincognito/vizi/blob/main/docs/PBI-1.10-inventory.md), checked on 2026-11-11 and to be re-checked. For condition 2 of the Phase 1 definition of done, items 9 to 12 of `docs/SPEC.md` section 4 are settled or partly settled by Adam's try of 2026-11-11, and item 15 was tried in Edge and is not settled. PBI-1.40 (a version history) starts with a spec PR and a decision on what a version of vizi is, which also settles PBI-1.37.

## Blockers
- Adam: item 15 of `docs/SPEC.md` section 4, two facts from your try in Edge: did a masked row like `github_pat_…cdef` appear after "Add", and did Edge offer to save the token later (for example on reload)? Or say "leave it", and it stays with PBI-1.4.
