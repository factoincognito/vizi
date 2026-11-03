# Backlog file format

The format of the backlog file that vizi reads, and of the `STATUS.md`
it reads next to it. `docs/SPEC.md` is the spec of the page itself.

**Date:** 2026-11-04
**Status:** in review with `docs/SPEC.md` (PR #3).

## What is decided, and what is Clead's design

- **Decided by the product owner** (2026-11-03): this format spec ships
  with vizi; the backlog file is looked for at the three paths of
  section 1; status is read from `STATUS.md`; the page reports what it
  could not read; there is no command-line lint for CI in the first
  version. His intent approval of 2026-11-04 (quoted in `docs/SPEC.md`,
  "What is decided") adds: a report tab of what could not be read, with
  line numbers, and blockers waiting on the product owner highlighted.
  Those points are marked **(approved)** below.
- **Clead's design (the HOW), within the approved intent:** everything
  else in this file: the order the paths are tried in, the rules R0 to
  R8, the three kinds of report item, and how `STATUS.md` is read (S1 to
  S5). It is Clead's call, not a question for the product owner, and it
  does not block building. It changes through a reviewed PR.
- **Not decided:** a lint mode beyond the page's report.

The examples are made up for this file.

---

## 1. Where the file is

**(approved)** vizi looks for the backlog file at `BACKLOG.md` (the
project's root), `docs/BACKLOG.md` and `docs/PRODUCT_BACKLOG.md`.

Clead's design: they are tried in that order, and the first one found is
read. When more than one exists, the report says so and names the one
read.

---

## 2. Rules (what the parser reads)

Clead's design. "At column 0" means the line has no indent. Fences (R7)
are found first, so that nothing inside a fence is read by any other
rule.

**R0. List item.** A line whose text, after any indent, starts with
`- `, `* ` or a number and a full stop followed by a space (`1. `).
Bullets and ordered items are both list items, at any indent. `+ ` is
not a list item, though CommonMark allows it.

**R1. Entry.** A list item at column 0 whose text starts with a bold
marker: `**[MARKER]`. A marker is upper-case letters A to Z only. A
bracket with anything else (`[x]`, `[ ]`, `[Done]`) is not a marker.

**R2. ID.** An ID is two or more upper-case letters, a hyphen, then
letters, digits and dots, starting with an upper-case letter or a digit
and ending with a letter or a digit: `ABC-12`, `PBI-2.4b`, `PBI-X.3`. A
trailing dot or comma is not part of the ID. It stands in one of two
places:
- inside the bold, after the marker and a space: `- **[NOW] ABC-12**`;
- right after the bold, after a space: `- **[DONE]** ABC-11` (read with
  a warning, section 3).

Inside the bold, nothing else stands besides the marker and one ID.
When it does (`- **[NOW] ABC-12 urgent**`), the entry is read with no
ID, the whole text inside the bold after the marker becomes the start of
the entry's text, no ID is looked for after the bold, and the entry gets
a warning. An entry without an ID is still read.

**R3. Head, notes and the dash.** The head is the entry line, plus the
indented lines right under it that are not blank and not list items (R0,
so an indented `1. ` line ends the head), joined with single spaces. A
blank line ends the head.

The head is read left to right:
1. the bold marker, and the ID if there is one (R2);
2. notes: after any spaces, a `(` starts a note. Parentheses nest: the
   note ends where the count of `(` and `)` since its opening `(`
   returns to zero. After any spaces, another `(` starts another note,
   and so on. A note whose parentheses never close in the head runs to
   the end of the head; the entry's text, and so its title, is then
   empty, and the entry gets a warning;
3. the dash: if what comes next is ` — ` (an em dash with at least one
   space on each side), it is the separator, and the text starts after
   it. The dash counts only in this place: directly after the ID or the
   notes, or directly after the bold marker when there are neither;
4. the text: the rest of the head. Without the dash, the text starts at
   that same place, after any spaces, and the entry gets a warning. A
   ` — ` later in the text is part of the text.

So `- **[LATER]** Export — as CSV` has no separator, and its text and
title are `Export — as CSV`.

**R4. Title and description.** The title is the first sentence of the
text, its closing full stop included: up to the first full stop that is
followed by a space or ends the head, and is not inside backticks or
parentheses; without such a full stop, the whole text. The description
is the rest of the head, then every line after the head up to the next
line that starts at column 0, is not blank and is not inside a fence
that opened in the description (R7).

**R5. Heading.** A line at column 0, not inside a fence, that starts
with one to six `#` followed by a space. Its text is the rest of the
line, trimmed, without a closing run of `#`. An indented line that
starts with `#` is not a heading; inside a description it is part of the
description.

**R6. Group and markers.** An entry's group is the nearest heading
(R5) above it, of any level; an entry with no heading above it has no
group. Markers are open: any marker is read and gets its own board
column.

**R7. Fence.** A fence opens on a line whose text, after any indent,
starts with three or more backticks or three or more tildes (anything
may follow, such as a language name). It closes on the next line whose
text, after any indent, is a run of at least as many of the same
character and nothing else but spaces. A fence that never closes runs
to the end of the file, and the report notes it (info). Lines inside a
fence, its opening and closing lines included, are never entries, never
headings and never report items. A fence that opens on an indented line
in a description belongs to that description, up to its closing line,
whatever the indent of the lines inside. A fence that opens at column 0
ends the description before it (R4) and belongs to no entry.

**R8. Line numbers.** Lines are counted from 1, the file's first line.
An entry's line is the line it starts on. The report gives the line of
each item it lists.

### Example

This backlog (made up):

````markdown
## Phase 2 — Settings

- **[NOW] PBI-2.4** (spec: `docs/SPEC.md` 3.2) (since 2026-11-01) — Read
  the settings file (e.g. `settings.json`). Missing keys get defaults.

  Unknown keys are kept and reported.
- **[DONE]** PBI-2.3 — Add the settings page.
- **[LATER]** Import settings from a file
- **[LATER]** Export — as CSV or JSON.
- **[IDEA] PBI-2.5** (from a user (by mail)) — Dark theme. Low priority.
  - **[NEXT] PBI-2.6** — Pick the colours.
  ## Not a heading
  ```
## Inside a fence
- **[NOW]** Inside a fence too
  ```
- [x] Ask about the default port.
1. Release once PBI-2.4 is done.
````

is read as follows (line numbers count from the example's first line):

| Line | Kind | Marker | ID | Notes | Title | Description |
|---|---|---|---|---|---|---|
| 3 | entry | NOW | PBI-2.4 | spec: `docs/SPEC.md` 3.2; since 2026-11-01 | Read the settings file (e.g. `settings.json`). | Missing keys get defaults. / Unknown keys are kept and reported. |
| 7 | entry, warning: ID outside the bold | DONE | PBI-2.3 | | Add the settings page. | |
| 8 | entry, warnings: no ID, no dash | LATER | | | Import settings from a file | |
| 9 | entry, warnings: no ID, no dash | LATER | | | Export — as CSV or JSON. | |
| 10 | entry | IDEA | PBI-2.5 | from a user (by mail) | Dark theme. | Low priority. / lines 11 to 16 |
| 11 | not read (error): indented marked item | | | | | |
| 17 | info: unmarked list item | | | | | |
| 18 | info: unmarked list item | | | | | |

How each line comes out:

- All five entries are in the group "Phase 2 — Settings" (R5, R6).
- Line 3's head runs onto line 4 (R3). Line 5 is blank, so it ends the
  head, and line 6 is description (R4). In the title, the full stop of
  "e.g." is followed by a space but stands inside parentheses, so the
  title runs on to the next full stop (R4).
- Line 9: after the bold marker comes `Export`, not ` — `, so there is
  no separator; the later ` — ` is part of the text (R3).
- Line 10's note holds a nested parenthesis (R3). Line 11 is a list
  item, so it ends line 10's head (R3).
- Line 11 is shown as part of PBI-2.5's description and also reported
  (section 3).
- Line 12 is indented, so it is not a heading (R5); it is description.
- Lines 13 to 16 are a fence that opened in the description (R7). Lines
  14 and 15 start at column 0, but they do not end the description and
  count as no heading, entry or report item.
- `[x]` on line 17 is not a marker (R1).

---

## 3. Report kinds (what the report shows)

**(approved)** A report tab of what could not be read, with line
numbers. Clead's design: it sorts what it finds into three kinds. Lines
inside a fence (R7) are never report items.

- **Not read (error):** a list item (R0), at any indent, whose text
  starts with a marker in brackets, with or without the bold `**` before
  it (`[NOW]`, `**[NOW]`), but which is not an entry by R1: indented, or
  not bold. An indented marked item inside an entry is shown as part of
  that entry's description and also reported here.
- **Read with a warning:** an entry with
  - no ID;
  - its ID outside the bold;
  - other text inside the bold besides the marker and one ID (R2);
  - no ` — ` separator (R3);
  - a marker outside the recommended set;
  - the same ID as an earlier entry (both are read; the later one gets
    the warning);
  - notes whose parentheses never close in the head (R3).

  The recommended set is the markers of the template's legend
  (`docs/BACKLOG.md` in `factoincognito/ai-project-template-v2`):
  `NOW`, `NEXT`, `LATER`, `IDEA`, `BLOCKED`, `DONE`, `SUPERSEDED` and
  `MOVED` (read 2026-11-04 at `09a198a`).
- **Info:**
  - list items (R0) at column 0 without a marker, bullets and ordered
    items alike. They are not entries and are not shown on the board;
    the report counts them, so a reader can see what the board leaves
    out;
  - more than one backlog file found (section 1);
  - a fence that never closes (R7);
  - what `STATUS.md` could not give (S2).

Further recommendations, which the report does not check: a legend of
the file's markers near the top, as the template has; one entry per
item, not nested; a short first sentence after the dash, since it is
the card's title.

---

## 4. `STATUS.md`

**(approved)** A project's status is read from its `STATUS.md`, at the
project's root; the page shows its four fields, with blockers waiting on
the product owner highlighted.

Clead's design, for `src/status.ts`:

**S1. Layout.** The template's: a `# Status` heading, a
`Last update: YYYY-MM-DD` line, and the headings `## Phase`,
`## Current focus`, `## Next step` and `## Blockers`. HTML comments
(`<!-- … -->`, also across lines) are dropped before reading; the
template's file starts with one.

**S2. Fields.** A field's text is every line after its heading up to the
next heading (R5), without blank lines at its start and end. "Last
update" is the date on the first line that starts with `Last update: `;
it must be a date in the form `YYYY-MM-DD`. A missing field heading, a
missing "Last update" line, or a date not in that form is listed in the
report (info), and the page shows that field as "not given".

**S3. One blocker.** If the Blockers text holds list items (R0) at
column 0, each one, with the indented lines under it, is one blocker,
and lines outside list items are ignored. Otherwise each paragraph
(lines separated by blank lines) is one blocker. A blocker's text is
read after its list marker and any spaces.

**S4. None.** A blocker whose text is `None`, or starts with `None.` or
`None `, is not a blocker: the page shows "None", and the rest of its
text, if any, as a remark under it, not highlighted. Other blockers in
the same section are still read.

**S5. Waiting on the product owner.** A blocker waits on the product
owner, and is highlighted, when its text starts with:
- `Product Owner:` (the template's rule), or
- one name followed by a colon: one word of letters that starts with an
  upper-case letter, such as `Adam:`, unless that word is in the named
  constant `AGENT_ROLE_NAMES` (`Clead`, `Crog`): the workflow's agent
  roles, which are not the product owner.

The page cannot learn a project's product owner's name, so any single
capitalised name counts. A blocker that starts with an agent role, or
any other way, is shown but not highlighted.

Example (made up):

```markdown
<!-- How to keep this file. -->

# Status

Last update: 2026-11-04

## Phase
Build.

## Current focus
The settings page.

## Next step
Crog reads the settings file (PBI-2.4).

## Blockers
- Product Owner: choose the default port.
- Maria: send the test account.
- Crog: waits for CI on #12.
- The build server is down.
```

is read as: Phase "Build.", Current focus "The settings page.", Next
step "Crog reads the settings file (PBI-2.4).", Last update 2026-11-04,
and four blockers: the first two highlighted (S5), the third not (an
agent role), the fourth not (no name and colon).

More Blockers sections, and how they are read:

| Blockers text | Read as |
|---|---|
| `None.` | no blockers |
| `None. The release waits until the next test run passes.` | no blockers; the remark "The release waits until the next test run passes." (S4) |
| two paragraphs: `Adam: approve the spec.` and `CI is red on main.` | two blockers, the first highlighted (S3, S5) |
