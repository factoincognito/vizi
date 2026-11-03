# Backlog file format

The format of the backlog file that vizi reads, and of the `STATUS.md`
it reads next to it. `docs/SPEC.md` is the spec of the page itself.

**Date:** 2026-11-04
**Status:** in review with `docs/SPEC.md` (PR #3).

What is decided, and by whom:

- Decided by the product owner (2026-11-03): this format spec ships with
  vizi; the three places the backlog file is looked for (section 1); the
  page reports what it could not read; there is no command-line lint for
  CI in the first version; status is read from `STATUS.md` (section 4).
- Decided with the spec's intent approval (2026-11-04, `docs/SPEC.md`
  3.1 and 3.5): the order the three places are tried in, and a report
  tab sorted into the three kinds of section 3.
- Clead's proposal, not decided: the rules in section 2 and the exact
  contents of each kind in section 3. They describe what template-style
  backlogs hold today, so that the parser reads what is there.
- Not decided: shipping this spec as rules and recommendations, read by
  a tolerant parser, with a lint mode beyond the page's report (Clead's
  suggestion, which the product owner found worth considering).

The examples are made up for this file.

---

## 1. Where the file is

vizi looks for the backlog file at these three paths in the project,
tried in this order: `BACKLOG.md` (the root), `docs/BACKLOG.md`,
`docs/PRODUCT_BACKLOG.md`. The first one found is read; when more than
one exists, the report says so.

---

## 2. Rules (what the parser reads)

Clead's proposal, not decided.

**R0. List item.** A line whose text, after any indent, starts with
`- `, `* ` or a number and a full stop followed by a space (`1. `).
Bullets and ordered items are both list items, at any indent. "At
column 0" means no indent.

**R1. Entry.** A list item at column 0 whose text starts with a bold
marker: `**[MARKER]`. A marker is upper-case letters only. A bracket
with anything else (`[x]`, `[ ]`, `[Done]`) is not a marker.

**R2. ID.** Inside the bold, `- **[NOW] ABC-12**`, or just after it,
`- **[DONE]** ABC-11`. Nothing else stands inside the bold. An ID is two
or more upper-case letters, a hyphen, then letters, digits and dots,
starting with an upper-case letter or a digit and ending with a letter
or a digit: `ABC-12`, `PBI-2.4b`, `PBI-X.3`. A trailing dot or comma is
not part of the ID. An entry without an ID is still read.

**R3. Head.** The entry line, plus the indented lines right under it
that are not blank and not list items (R0, so an indented `1. ` line
ends the head), joined with spaces. A blank line ends the head. In the
head, after the ID, come any number of notes, each in parentheses.
Parentheses nest: a note ends where the count of `(` and `)` since its
opening `(` returns to zero. Then come ` — ` (an em dash with a space on
each side) and the text; without the dash, the text starts right after
the ID or the notes.

**R4. Title and description.** The title is the first sentence of the
text, its closing full stop included: up to the first full stop that is
followed by a space or ends the head, and is not inside backticks or
parentheses; without such a full stop, the whole text. The description
is the rest of the head, then every line after the head up to the next
line that starts at column 0 and is not blank (a list item, a heading or
any other text). A fenced code block belongs to the description it is
in, up to its closing fence.

**R5. Group.** The nearest heading above the entry.

**R6. Open markers; code blocks.** Markers are open: any marker is read
and gets its own board column. Lines inside fenced code blocks are never
entries.

### Example

This backlog (made up):

```markdown
## Phase 2 — Settings

- **[NOW] PBI-2.4** (spec: `docs/SPEC.md` 3.2) (since 2026-11-01) — Read
  the settings file (e.g. `settings.json`). Missing keys get defaults.

  Unknown keys are kept and reported.
- **[DONE]** PBI-2.3 — Add the settings page.
- **[LATER]** Import settings from a file
- **[IDEA] PBI-2.5** (from a user (by mail)) — Dark theme. Low priority.
  - **[NEXT] PBI-2.6** — Pick the colours.
- [x] Ask about the default port.
1. Release once PBI-2.4 is done.
```

is read as (line numbers count from the example's first line):

| Line | Kind | Marker | ID | Notes | Title | Description |
|---|---|---|---|---|---|---|
| 3 | entry | `NOW` | `PBI-2.4` | spec: `docs/SPEC.md` 3.2; since 2026-11-01 | Read the settings file (e.g. `settings.json`). | Missing keys get defaults. / Unknown keys are kept and reported. |
| 7 | entry, warning: ID outside the bold | `DONE` | `PBI-2.3` | | Add the settings page. | |
| 8 | entry, warnings: no ID, no dash | `LATER` | | | Import settings from a file | |
| 9 | entry | `IDEA` | `PBI-2.5` | `from a user (by mail)` | Dark theme. | Low priority. / the line `- **[NEXT] PBI-2.6** — Pick the colours.` |
| 10 | not read (error): indented marked item | | | | | |
| 11 | info: unmarked list item | | | | | |
| 12 | info: unmarked list item | | | | | |

All four entries are in the group "Phase 2 — Settings" (R5). Line 3's
head runs onto line 4 (R3); line 5 is blank, so it ends the head, and
line 6 is description (R4). In line 3's title, the full stop of "e.g."
is followed by a space but stands inside parentheses, so the title runs
on to the next full stop (R4). Line 9's note holds a nested parenthesis (R3). Line
10 is shown as part of PBI-2.5's description and also reported (section
3). `[x]` on line 11 is not a marker (R1).

---

## 3. Recommendations (what the report shows)

The report sorts what it finds into three kinds. The kinds are decided
(`docs/SPEC.md` 3.5); what goes into each is Clead's proposal, not
decided.

- **Not read (error):** a list item (R0), at any indent, whose text
  starts with a marker in brackets (R1's kind) but which breaks R1, such
  as an indented or non-bold marked item. An indented marked item inside
  an entry is shown as part of that entry's description and also
  reported here.
- **Read with a warning:** no ID; ID outside the bold; no ` — ` before
  the text; a marker outside the recommended set; the same ID twice;
  notes whose parentheses never close in the head. The recommended set
  is the markers of the template's legend (`docs/BACKLOG.md` in
  `factoincognito/ai-project-template-v2`): `NOW`, `NEXT`, `LATER`,
  `IDEA`, `BLOCKED`, `DONE`, `SUPERSEDED` and `MOVED` (read 2026-11-04
  at `09a198a`).
- **Info:** list items (R0) at column 0 without a marker, bullets and
  ordered items alike. They are not entries and are not shown on the
  board; the report counts them, so a reader can see what the board
  leaves out.

Further recommendations, which the report does not check: a legend of
the file's markers near the top, as the template has; one entry per
item, not nested; a short first sentence after the dash, since it is
the card's title.

---

## 4. `STATUS.md`

Decided: a project's status is read from its `STATUS.md`, at the
project's root (product owner, 2026-11-03).

The format is the template's: a `# Status` heading, a
`Last update: YYYY-MM-DD` line, and the headings `## Phase`,
`## Current focus`, `## Next step` and `## Blockers`, each followed by
its text. The file may start with an HTML comment, as the template's
does; the comment is not shown. A blocker that waits on the product
owner starts with "Product Owner:" (the template's rule) or with the
product owner's name and a colon, such as "Adam:"; the page highlights
both (`docs/SPEC.md` 3.3).

Example (made up):

```markdown
# Status

Last update: 2026-11-04

## Phase
Build.

## Current focus
The settings page.

## Next step
Crog reads the settings file (PBI-2.4).

## Blockers
Product Owner: choose the default port.
```
