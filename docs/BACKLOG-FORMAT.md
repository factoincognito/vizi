# Backlog file format

The format of the backlog file that vizi reads, of the `STATUS.md` it
reads next to it, and of the `PROJECTS.md` of an umbrella project
(section 5). `docs/SPEC.md` is the spec of the page itself.

**Date:** 2026-11-04
**Status:** in effect with `docs/SPEC.md` (merged in PR #3); read by
`src/backlog.ts` and `src/status.ts`.

## What is decided, and what is Clead's design

- **Decided by the product owner** (2026-11-03): this format spec ships
  with vizi; the backlog file is looked for at the three paths of
  section 1; status is read from `STATUS.md`; the page reports what it
  could not read; there is no command-line lint for CI in the first
  version. His intent approval of 2026-11-04 (quoted in `docs/SPEC.md`,
  "What is decided") adds: a report tab of what could not be read, with
  line numbers, and blockers waiting on the product owner highlighted.
  His intent approval of the umbrella view, 2026-11-04 11:06, adds: a
  `PROJECTS.md` at the project's root, its headings shown as a tree with
  the projects under them. His intent approval of the include keyword,
  2026-11-07 01:05 (`docs/SPEC.md` 3.15 and "What is decided", item
  17), adds: a backlog file can include other files of the same repo and
  branch, by a path relative to it (I3, I4); only the backlog file
  includes, one level only (I6, I11); at most five included files a
  load (I7); included entries stand where the include line stands (I9).
  Those points are marked **(approved)** below; section 6 gives the
  include points in its **(approved)** paragraph, ahead of the rules,
  which are quoted as written.
- **Clead's design (the HOW), within the approved intent:** everything
  else in this file: the order the paths are tried in, the rules R0 to
  R9, the three kinds of report item, how `STATUS.md` is read (S1 to
  S5), how `PROJECTS.md` is read (P1 to P7), and the rest of the
  include rules I1 to I11 (section 6). It is Clead's call,
  not a question for the product owner, and it does not block building.
  It changes through a reviewed PR.
- **Not decided:** a lint mode beyond the page's report.

The examples are made up for this file.

---

## 1. Where the file is

**(approved)** vizi looks for the backlog file at `BACKLOG.md` (the
project's root), `docs/BACKLOG.md` and `docs/PRODUCT_BACKLOG.md`.

Clead's design: they are tried in that order, and the first one found is
read. When more than one exists, the report says so and names the one
read. When none exists, the page says that no backlog file was found.
The backlog file can include other files (section 6).

---

## 2. Rules (what the parser reads)

Clead's design. "At column 0" means the line has no indent. Fences (R7)
and HTML comments (R9) are found first, in one pass from the top of the
file, so that nothing inside a fence or a comment is read by any other
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
When it does (`- **[NOW] ABC-12 urgent** — Fix it.`), the entry is read
with no ID and gets a warning. No ID is looked for after the bold, but
notes and the dash still are (R3). The entry's text is the text inside
the bold after the marker, a space, then the text R3 finds after the
bold: here `ABC-12 urgent Fix it.` An entry without an ID is still
read.

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

**R9. HTML comments.** A comment opens only on a line whose text,
after any indent, starts with `<!--`, and only outside a fence (R7) and
outside another comment. It closes at the first `-->` after that, on the
same line or a later one. Fences and comments are found in one pass from
the top: a line inside an open comment never opens a fence, and a line
inside an open fence never opens a comment. Everything from the `<!--`
to the `-->` is dropped before the other rules are applied; text after
the `-->` on its line is kept as that line's text. A dropped comment
leaves its line breaks in place, so line numbers (R8) stay true. What is
inside a comment is never an entry, a heading or a report item: a
commented-out entry is not shown. A `<!--` anywhere else on a line (after
other text, or inside backticks) is text, not a comment. A comment that
never closes runs to the end of the file and is reported as Info
(section 3). A comment that is an include line (section 6, I1) is read
before it is dropped. For example:

```markdown
<!-- - **[NOW] AB-9** — Hidden. -->
- **[NEXT] AB-10** — Drop `<!--` markers.
<!--
- **[NOW] AB-11** — Also hidden.
-->
```

Line 1 is a comment on one line and is dropped; AB-9 is not shown.
Line 2 is entry AB-10 with the title "Drop `<!--` markers.": its `<!--`
is not at the start of the line. Lines 3 to 5 are a comment across
lines; AB-11 is not shown.

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

### Edge cases (settled 2026-11-04)

Clead's design. The parser of PBI-1.1 read these cases this way, its
code review accepted each reading, and they are the rule from now on.

1. **Text after `-->`** keeps the indent of the line the `-->` stands
   on, whether the comment opened on that line or on an earlier one, and
   is read by every rule except R7 and R9: it never opens a fence or a
   comment. So `<!-- x --> - **[NOW] AB-1** — a.` is an indented marked
   item, Not read (section 3); so is the last line of `<!--`,
   `  hidden`, `  -->- **[NOW] AB-1** — a.`, which keeps that line's two
   spaces. `<!-- a --><!-- b --> - **[NOW] AB-1** — a.` leaves the text
   `<!-- b --> - **[NOW] AB-1** — a.`, which is not a list item: AB-1 is
   not shown and not reported.
2. **Other text inside the bold** (R2) gives one warning for it, and
   no ID is read from the bold. The dash check (R3) applies as usual:
   `- **[NOW] ABC-12 urgent** — Fix it.` has its separator right after
   the bold and gets only this warning, while
   `- **[NOW] urgent** AB-9 — Fix it.` has `AB-9` between the bold and
   the dash, so it also has no separator.
3. **A bold marker that never closes** (`**[NOW]` with no closing `**`
   on the head) is Not read (section 3): the line is not bold.
4. **An indented fence line directly under the entry line** ends the
   head (R3, R7).
5. **A dash at the very end of the head** (` —` with nothing after it)
   is not a separator: the separator needs a space on both sides (R3).
6. **Description lines keep their indent** as read (R4). When a
   description is shown, the smallest indent of its non-blank lines below
   the head (not counting the rest of the head, which has none) is
   removed from those lines first, so lines indented four or more spaces
   under an entry are not shown as code (`docs/SPEC.md` 3.7, item 2).
7. **Notes that never close** give only that warning (section 3), not a
   missing-separator warning as well.

In `STATUS.md`:

8. **A field heading that appears twice:** the first one is read, the
   second is ignored.
9. **A fence inside a blocker's list item** (S3): a line at column 0
   inside that fence ends the blocker, as any column-0 line does; the
   fence lines after it belong to no blocker and are dropped.

---

## 3. Report kinds (what the report shows)

**(approved)** A report tab of what could not be read, with line
numbers. Clead's design: it sorts what it finds into three kinds. Lines
inside a fence (R7) are never report items.

- **Not read (error):** a list item (R0), at any indent, whose text
  starts with a marker in brackets, with or without the bold `**` before
  it (`[NOW]`, `**[NOW]`), but which is not an entry by R1: indented, or
  not bold. An indented marked item inside an entry is shown as part of
  that entry's description and also reported here. Also an include not
  followed or not read (section 6: I2 to I4, I6, I7, a failed read).
- **Read with a warning:** an entry with
  - no ID;
  - its ID outside the bold;
  - other text inside the bold besides the marker and one ID (R2);
  - no ` — ` separator (R3);
  - a marker outside the recommended set;
  - the same ID as an earlier entry (both are read; the later one gets
    the warning);
  - notes whose parentheses never close in the head (R3);
  - an include of the file itself or of a file already included (I5);
  - an ID used by an entry of another file of the backlog (I10).

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
  - an HTML comment that never closes (R9);
  - what `STATUS.md` could not give (S2);
  - an included file with no entry (I8);
  - an include line outside a backlog file (I11).

Further recommendations, which the report does not check: a comment
that hides an entry written on its own line (edge case 1); a legend of
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
are found and dropped by the same rule as in a backlog file (R9) before
reading; the template's file starts with one. A dropped comment leaves
its line breaks in place, so line numbers (R8) stay true.

**S2. Fields.** A field's text is every line after its heading up to the
next heading (R5) or the end of the file, without blank lines at its
start and end. "Last
update" is the date on the first line that starts with `Last update: `;
it must be a date in the form `YYYY-MM-DD`. A missing field heading, a
missing "Last update" line, or a date not in that form is listed in the
report (info), and the page shows that field as "not given".

**S3. One blocker.** If the Blockers text holds list items (R0) at
column 0, each one, with the indented lines under it, is one blocker,
and lines outside list items are ignored. Otherwise each paragraph
(lines separated by blank lines) is one blocker. A blocker's text is
read after its list marker and any spaces.

**S4. None.** A blocker whose text is `None` on its own, or starts with
`None.`, is not a blocker: the page shows "None", followed by ` — ` and
the rest of its text, if any, as a remark, not highlighted (the remarks
of several such items are joined with a space). Any other text that
starts with `None`, such as `None of the CI runners start.`, is a
blocker. Other blockers in the same section are still read, and shown
after the "None". A `## Blockers` section with neither a `None` item
nor a blocker shows "No blockers listed"; a missing `## Blockers`
heading shows "not given" (S2).

**S5. Waiting on the product owner.** A blocker waits on the product
owner, and is highlighted, when its text starts with one of the prefixes
in the named constant `PRODUCT_OWNER_PREFIXES` in `src/status.ts`. Its
default is one prefix, `Product Owner:` (the template's rule). The
comparison is exact and case-sensitive, at the start of the blocker's
text (S3). A blocker that starts any other way, such as `CI:` or
`Crog:`, is shown but not highlighted.

The page cannot learn a project's product owner's name. To recognise
another prefix, such as a project that writes its product owner's name
followed by a colon, add it to `PRODUCT_OWNER_PREFIXES` through a PR,
with a test that it is highlighted.

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
- Crog: waits for CI on #12.
- The build server is down.
```

is read as: Phase "Build.", Current focus "The settings page.", Next
step "Crog reads the settings file (PBI-2.4).", Last update 2026-11-04,
and three blockers: the first highlighted (S5), the other two not.

More Blockers sections, and how they are read:

| Blockers text | Read as |
|---|---|
| `None.` | no blockers; the page shows "None" |
| (nothing under the heading) | no blockers; the page shows "No blockers listed" |
| `None. The release waits until the next test run passes.` | no blockers; the remark "The release waits until the next test run passes." (S4) |
| `None of the CI runners start.` | one blocker, not highlighted (S4) |
| `CI: red on main.` | one blocker, not highlighted (S5) |
| two paragraphs: `Product Owner: approve the spec.` and `CI is red on main.` | two blockers, the first highlighted (S3, S5) |

---

## 5. `PROJECTS.md` (the umbrella view)

**(approved)** When the project vizi opens has a `PROJECTS.md` at its
root, its headings are shown as a tree with the projects under them
(`docs/SPEC.md` 3.9).

Clead's design, for `src/projects.ts`. It shares two tests with the
product office's own reader of the file (`read_status.py`): the pointer
pattern of P4 and the bullet test of P5. The two still differ, because
that reader tests every line of the file as it stands and reads no
headings:
- it does not drop comments or skip fences (P2), so a pointer inside a
  comment or a fence is a pointer there and not here;
- it does not refuse `.` and `..` (P4), so `- ../x` is a pointer there
  and an error here;
- it does not see text left after a `-->` (R9), so
  `<!-- x -->- acme/a` is ignored there and is a pointer here.

Changing the product office's reader is a separate decision, outside
vizi.

**P1. Where.** Only `PROJECTS.md` at the project's root.

**P2. Comments and fences first.** HTML comments are dropped (R9), and
fences are found (R7), as in a backlog file. A line inside a comment or
a fence is never a heading, a pointer or a report item.

**P3. Headings and the tree.** A heading is as in R5: a line at column
0 that starts with one to six `#` and a space. Its parent in the tree is
the nearest heading above it with fewer `#`; a heading with no such
heading above it is at the top of the tree. Levels may be skipped: a
`###` under a `#` is that heading's child. Every heading is shown, also
one with nothing under it.

**P4. Pointer.** A line that matches exactly
`^- ([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/?)\s*$`: a `- ` at column 0, then
two names joined by one `/`, an optional trailing `/`, and nothing else
but trailing spaces. It belongs to the nearest heading above it; the
pointers above the first heading are at the top of the tree, under
"(no heading)". There are two kinds:
- a **folder pointer** starts with `projects/`: `projects/<name>/`
  names the folder `projects/<name>/` of the same project;
- any other pointer is a **repo pointer**, `<owner>/<repo>`, a GitHub
  repo. A trailing `/` is dropped.

So a GitHub account named `projects` cannot be pointed at, as in the
product office's reader. A pointer whose owner, repo or folder name is
`.` or `..` is not read (error, section 3).

**P5. Other bullet lines are reported.** Any other line whose text,
after any indent, starts with `-`, `*` or `+` and a whitespace
character (`\s`, as in the product office's reader) is not a pointer
and is not read (error): an indented pointer, a `*` or `+`
bullet, or a pointer with text after it, such as
`- acme/widgets — the main one`.

**P6. Everything else is ignored:** blank lines, text paragraphs,
ordered list items, tables and the like. They are not shown and not
reported.

**P7. Report.** Besides the errors of P4 and P5: a pointer that
appeared earlier in the file (the same pointer, its trailing `/` aside)
is shown again and gets a warning; a file with no pointer at all gets
an Info item. Line numbers are as in R8.

### Example

This `PROJECTS.md` (made up):

````markdown
# Projects

Our work, grouped by area.

## Tools

- acme/widgets
- projects/notes/

### Experiments

- acme/lab-1/
* acme/old
  - acme/nested

## Hardware
<!-- - acme/hidden -->
1. Not a pointer, not reported.
- acme/widgets — the main one
- acme/widgets
```
- acme/in-fence
```
````

is read as this tree:

- Projects
  - Tools: `acme/widgets` (repo, line 7), `projects/notes/` (folder,
    line 8)
    - Experiments: `acme/lab-1` (repo, line 12; the trailing `/` is
      dropped)
  - Hardware: `acme/widgets` (repo, line 20)

and this report (line numbers count from the example's first line):

| Line | Kind | Why |
|---|---|---|
| 13 | not read (error) | a `*` bullet (P5) |
| 14 | not read (error) | an indented bullet (P5) |
| 19 | not read (error) | text after the pointer (P5) |
| 20 | read with a warning | the same pointer as line 7 (P7) |

Line 3 is text and line 18 an ordered item: both are ignored (P6). Line
17 is a comment and is dropped, and line 22 is inside a fence, so
neither is a pointer (P2).

---

## 6. Includes (`vizi:include`)

**(approved)** The product owner's intent approval of 2026-11-07 (01:05,
in chat, "Po-105 apyr", on Clead's proposals; recorded in the product
office's `DECISIONS.md`, PR #576, and as a comment on PR #93) of the
include keyword (product-office PO-105): a backlog file can name another
file of the same repo and branch with `<!-- vizi:include <path> -->`, a
path relative to it, and vizi reads that file too, one level only, only
from the backlog file; included entries show on the board and in the
list like the file's own, and only they name their file; they stand
where the include line stands; a failed read of an included file lets
the load go on (only a 401 fails it), and the page says what is missing;
at most five included files a load; the help view does not change; and
an include line is the one exception to "content never makes a request
of its own" (2.3, 3.7 item 5, `RULES.md` L § 5 (1)). How vizi does it is
`docs/SPEC.md` 3.15.

Clead's design, within that approval: the rules below, except the
points "What is decided" marks **(approved)**. "The backlog file" is the
one file of the three paths that vizi reads (section 1).

**I1. Include line.** A line of the backlog file, at column 0, outside
a fence (R7) and outside a comment that opened on an earlier line (R9),
whose text, without trailing spaces and tabs (U+0020 and U+0009 only:
other white space, such as a no-break space, is not trimmed, so a line
that ends in one has text after its `-->`, I2), is exactly `<!--`, one
or more spaces, `vizi:include`, one or more spaces, the path, one or
more spaces, `-->`, and nothing else: the pattern
`^<!-- +vizi:include +((?:(?!-->)[^ \t])+) +-->$`, where the path
holds no space, no tab and no `-->`
(R9 closes the comment at the first `-->`, so a path that holds one
leaves text after the comment: such a line looks like an include, I2).
The keyword is written in lower case, exactly. The include line is read
in the same first pass that finds fences and comments (R7, R9), and is
then dropped as any comment is, so the file's other lines are read as
if it were not there (a dropped comment leaves a blank line, which ends
no description, R4).

**I2. A line that looks like an include** but is not one by I1 is not
followed, and is reported (not read): a comment (R9) whose text, after
the `<!--` and any spaces or tabs, starts with `vizi:include` followed
by a space, a tab, `-->` or the end of the line, and that is not an
include line by I1: for example one that is indented, has text after
its `-->`, has no path or more than one word between the keyword and
the `-->`, has no space before the `-->`, has a tab where I1 has
spaces or a tab in the path, or does not close on its line. A comment
that starts in any other way (`<!-- vizi:Include x -->`,
`<!-- vizi x -->`) is an ordinary comment: dropped, and not reported.
Text that R9 does not read as a comment, such as a `<!--` after other
text on an entry's line, is never an include and is not reported.

**I3. The path.** One or more segments joined by single `/`s, each
segment made of letters A to Z and a to z, digits, `.`, `_` and `-`,
the last ending in `.md` (lower case, as 3.4 reads `.md`). It is read
relative to the folder of the backlog file: from `BACKLOG.md`, the
project's root; from `docs/BACKLOG.md` or `docs/PRODUCT_BACKLOG.md`,
`docs/`. A `.` segment is dropped and a `..` segment removes the segment
before it, as 3.7 item 4 resolves a relative link. The path is not
followed, and is reported (not read), when it:
- starts with `/` (an absolute path);
- holds any other character, such as `:` (so a URL, `https://…`, is
  refused), `\`, `%` or a letter outside A to Z and a to z (a
  space or a tab never reaches I3: I1's path holds neither, and a line
  with one in its path looks like an include, I2);
- has an empty segment (`a//b.md`) or ends with `/`;
- leaves the project's root once `.` and `..` are resolved
  (`../x.md` from `BACKLOG.md`, `../../x.md` from `docs/BACKLOG.md`);
- does not end in `.md`.

The checks are made in two steps (Clead's design). First the form, on
the path as written, in the order of the list above: a leading `/`, a
character outside the set, an empty segment or a trailing `/`, a last
segment not ending in `.md`. The first that fails gives I3's general
message, and the path is not resolved. Only a path of the right form is
then resolved, segment by segment from the backlog file's folder; it
leaves the project when a `..` has no segment before it to remove, at
any step, as `resolvePath` in `src/markdown.ts` returns `null` for a
relative link, and gets the "leaves the project" message. So
`../x.txt`, `/../x.md` and `a//../b.md` get the general message, and
`../x.md` from `BACKLOG.md` and `a/../../x.md` the "leaves" message.

**I4. The included file** is the path resolved by I3, in the same repo,
at the same branch as the backlog file. It is followed only when the
file list (3.1, request 2) holds it. A path the file list does not hold
is not followed and is reported (not read); no request is made for it.
The root's `STATUS.md` and `PROJECTS.md` are not followed either, and
are reported (not read): vizi reads them in their own way (3.3, 3.9),
and following them would read the same file twice in one load (Clead's
design).

**I5. Itself and twice.** An include whose resolved path is the backlog
file's own is not followed, and is read with a warning. An include
whose resolved path an earlier include line of the file named and
followed is not followed again, and is read with a warning: the file is
read once, at its first include line, whether that read succeeded or
failed ("A failed read of an included file"), so a failed file is not
asked for twice. The checks are made in the order
I2, I3, I5, I4, I7, and a line gets the first that applies, so a path
the file list lacks, or one past the cap, is reported by I4 or I7 each
time it is named.

**I6. One level.** In an included file, a comment that is an include
line by I1 or looks like one by I2 is not followed, and is reported
(not read), on the included file's line. Nothing an included file names
is read.

**I7. At most five.** At most five included files are read for one
backlog file. An include line after the fifth one
followed is not followed and is reported (not read). An include that
is followed counts towards the five whether its read succeeds or fails
("A failed read of an included file"); lines refused by I2 to I5 do not
count.

**I8. Reading an included file.** An included file is read on its own
with every rule of sections 2 and 3, as a backlog file is: its own line
numbers (R8), its own headings and groups (R5, R6; an entry above its
first heading has no group, whatever heading of the backlog file stands
above the include line), its own fences and comments, and its own
report. Every entry it gives is an entry of the backlog, and knows the
file it came from.

**I9. Where its entries go.** In the backlog's order
of entries, which the board's columns and the list keep (3.2), an
included file's entries stand where its include line stands: after the
backlog file's entries above that line, and before those below it.

**I10. The same ID in two files.** An entry whose ID an entry of another
file of the same backlog has, earlier in the order of I9, is read with
a warning (both are read; the later one gets it), as an entry with the
same ID as an earlier entry of its own file is (section 3). It is a
separate warning, naming the other file and its line. An entry gets at
most one such warning, naming the first entry, in the order of I9, that
has the same ID and is in another file (Clead's design); an ID repeated
within one file keeps its own warning besides.

**I11. Other files.** An include line by I1 in `STATUS.md` (the
project's own, or a folder pointer's, 3.9) or in `PROJECTS.md` is not
followed and is reported (info), so a writer sees why nothing came of
it. An include line in a fence is never an include, so
a format file can show one, as this one does.

Example (made up). This `BACKLOG.md`:

```markdown
## Open

- **[NOW] AB-3** — Draw the chart.
<!-- vizi:include BACKLOG-DONE.md -->
<!-- vizi:include ../OLD.md -->
- **[NEXT] AB-4** — Export the chart.
```

with this `BACKLOG-DONE.md` next to it:

```markdown
## Open

- **[DONE] AB-1** — Read the data. See [the notes](notes/data.md).
- **[DONE] AB-3** — Draw a first chart.
<!-- vizi:include MORE.md -->
```

is read as four entries, in this order: AB-3 (`BACKLOG.md` line 3),
AB-1 and AB-3 (`BACKLOG-DONE.md` lines 3 and 4), AB-4 (`BACKLOG.md`
line 6). AB-1 and the second AB-3 name `BACKLOG-DONE.md`; their group is
"Open" of `BACKLOG-DONE.md`, and the link in AB-1 goes to
`notes/data.md` beside `BACKLOG-DONE.md`. The report holds, in the
order the Report tab lists them: under Not read, `BACKLOG.md` line 5,
the path leaves the project (I3), and `BACKLOG-DONE.md` line 5, an
included file cannot include (I6); under Read with a warning,
`BACKLOG-DONE.md` line 4, the ID AB-3 is also used in `BACKLOG.md` line
3 (I10). `MORE.md` is not read, whether or not
it exists. The list (3.2, "What the page shows" below) shows the groups
"Open" (AB-3), "Open — `BACKLOG-DONE.md`" (AB-1, AB-3) and "Open"
again (AB-4).
