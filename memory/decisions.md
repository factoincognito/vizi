# Key Architectural Decisions

Key decisions, newest at the bottom of the table. Decisions that need
more than a table row get an ADR in `docs/decisions/`; the workflow's
founding decisions are in `docs/decisions/0001-rebuild-workflow.md`.

| Date | Decision | Rationale |
|---|---|---|
| 2026-11-11 | Definition of done for Phase 1: the four conditions in `memory/project.md`. | Product owner, in chat, 2026-11-11 08:56, "apyr" to Clead's proposal; it replaced the parked proposal, which assumed a page opened locally. Recorded by the Clead session https://claude.ai/code/session_01RZ8pEGYFteiDpCWrzofMDX (session ID f2783b8a-dff1-479c-8aa1-4d37b98d20a0) in this PR. |
| 2026-11-11 | Condition 2 of that definition covers items 9 to 12 and 15 of `docs/SPEC.md` section 4; items 13 and 14 stay with PBI-1.4. | Product owner, in chat, 2026-11-11 09:47, "apyr" to Clead's recommendation, after his own try of a token in Edge. Recorded by the Clead session https://claude.ai/code/session_01RZ8pEGD3jmzSyfRh2UWYiL (session ID 79ff3bd5-300f-48bd-a632-f50f969fb210) in this PR. |
| 2026-11-11 | The "Private repos" panel says that vizi keeps one token per owner and that adding a token for an owner that already has one replaces it (PBI-1.38). | Product owner, in chat, 2026-11-11 12:20, with his wording as the content; Clead put it in the panel's words and chose the place (under the "Add a token" heading) and left the help view alone. Recorded by the Clead session https://claude.ai/code/session_01RZ8pEGD3jmzSyfRh2UWYiL (session ID 79ff3bd5-300f-48bd-a632-f50f969fb210) in this PR. |
| 2026-11-18 | PBI-1.10 points 7, 14 and 40 are accepted as they are, no change: `addCsp` catching only the plain spelling of a second policy (7), the pointer `- .../x` (14), and decoded branch names that git refuses (40). | Product owner, in chat, 2026-11-18 23:33 ("K 7, 14, 40 (accept, record)"). Recorded by the Clead session https://claude.ai/code/session_01RZ8pEJgvqvAzpnMWUSvirC (session ID f83a5ac7-1652-5573-9a2c-293ca479fe0d) in this PR. |
| 2026-11-18 | PBI-1.10 points 30, 31, 32 and 71 are done as changes, each with a failing test first: "Forget all" also removes the old key (30), "Forget all" with nothing saved reaches other tabs (31), a failed "Keep for this owner" keeps the owner's earlier token (32), the tagline gap is set without the font's space (71). | Product owner, in chat, 2026-11-18 23:33 ("30, 31, 32, 71 (each with a failing test first)"); which way each goes is Clead's reading of the changing option in `docs/PBI-1.10-inventory.md`, and the spec text of each PR waits for his intent approval (PRs #133, #132, #131, #134). Recorded by the Clead session https://claude.ai/code/session_01RZ8pEJgvqvAzpnMWUSvirC (session ID f83a5ac7-1652-5573-9a2c-293ca479fe0d) in this PR. |

## Open questions

(none yet — number each open question, and strike it through with the
date and outcome when it is resolved)
