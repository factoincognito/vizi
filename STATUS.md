<!--
How to keep this file: product-office Process P-9 § 6.
-->

# Status

Last update: 2026-11-28

## Phase
Build: the first version is built and published at https://factoincognito.github.io/vizi/ (PBI-1.1 to PBI-1.3, PBI-1.5, PBI-1.7 to PBI-1.9, PBI-1.11, PBI-1.13, PBI-1.14 and PBI-1.17 merged 2026-11-04, PBI-1.16 and PBI-1.15 on 2026-11-05, PBI-1.19 on 2026-11-06 in #85, PBI-1.34 on 2026-11-07 in #98, [PBI-1.35](https://github.com/factoincognito/vizi/blob/main/docs/BACKLOG.md?plain=1) on 2026-11-09 in [#100](https://github.com/factoincognito/vizi/pull/100), [PBI-1.12](https://github.com/factoincognito/vizi/blob/main/docs/BACKLOG.md?plain=1) on 2026-11-09 in [#101](https://github.com/factoincognito/vizi/pull/101)).

## Current focus
PBI-1.10's PRs that change no behaviour (groups D to I of the inventory, #114 to #119 and #121), its spec PRs A and B (#122, #123), group J (point 46, #126) and point 48 (#127) are merged (2026-11-18). On 2026-11-19: the rate-limit messages C are merged in #135 (Adam's "apyr", 2026-11-18 23:38), and the K decisions are carried out: points 6, 7, 14, 37, 39, 40, 53, 54 and 73 are accepted as built (reasons in the backlog detail), and 30, 31, 32 and 71 are merged in #133, #132, #131 and #134. Points 26 and 52 are merged in [#136](https://github.com/factoincognito/vizi/pull/136) (wording approved by Adam, 2026-11-19 03:43). What is left of PBI-1.10 is the spec lines and tests listed in the backlog detail. Of the audit findings of 2026-11-06, PBI-1.31 to PBI-1.33 are re-checked at the next audit.

## Next step
[PBI-1.10](https://github.com/factoincognito/vizi/blob/main/docs/BACKLOG.md?plain=1), in the backlog's order, then PBI-1.4 (PBI-1.6 is done, #141 and #143, 2026-11-26). The rest of PBI-1.10 (the loose ends listed in its backlog detail) follows; its points are in [`docs/PBI-1.10-inventory.md`](https://github.com/factoincognito/vizi/blob/main/docs/PBI-1.10-inventory.md), checked on 2026-11-11 and to be re-checked. For condition 2 of the Phase 1 definition of done, items 9 to 12 of `docs/SPEC.md` section 4 are settled or partly settled by Adam's try of 2026-11-11, and item 15 was tried in Edge and is not settled. PBI-1.40 (a version history): what a version of vizi is was decided on 2026-11-28 (which settles PBI-1.37); its spec is section 3.17, in [#145](https://github.com/factoincognito/vizi/pull/145), which the product owner approved on 2026-11-28 12:49; the code is built in [#146](https://github.com/factoincognito/vizi/pull/146) (2026-11-28) and waits for the approval of its two entry texts.

## Blockers
- Adam: item 15 of `docs/SPEC.md` section 4, two facts from your try in Edge: did a masked row like `github_pat_…cdef` appear after "Add", and did Edge offer to save the token later (for example on reload)? Or say "leave it", and it stays with PBI-1.4.
- Adam: approve the texts of the two history entries (0.1.0 and 0.2.0) in the code PR for section 3.17, when it is ready.
