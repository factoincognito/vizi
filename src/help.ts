/**
 * The help view's text, "How to make your project vizi compatible"
 * (docs/SPEC.md 3.10), as data. The page builds the view from it with
 * calls that set text; nothing here is HTML, and nothing is loaded for
 * it. The examples are read by the page's own readers in
 * src/help.test.ts, so the help says only what the code accepts.
 *
 * Step 5's example shows a token's form with a placeholder, never a
 * token: no text here holds the token prefix followed by ten or more
 * word characters.
 */

/** A piece of a paragraph: plain text, or code (shown in `<code>`). */
export interface Part {
  kind: "text" | "code";
  text: string;
}

/** A paragraph, or a title: a list of parts. */
export type Paragraph = readonly Part[];

export interface HelpStep {
  title: Paragraph;
  paragraphs: readonly Paragraph[];
  /** Shown as written, in a code block. */
  example: string;
}

const t = (text: string): Part => ({ kind: "text", text });
const c = (text: string): Part => ({ kind: "code", text });

/** A paragraph's text with its parts joined as written. */
export function plainText(paragraph: Paragraph): string {
  return paragraph.map((part) => part.text).join("");
}

/** Code parts for a list of names, joined with commas and a final "and". */
function names(list: readonly string[]): Part[] {
  const parts: Part[] = [];
  list.forEach((name, i) => {
    if (i > 0) parts.push(t(i === list.length - 1 ? " and " : ", "));
    parts.push(c(name));
  });
  return parts;
}

export const HELP_TITLE = "How to make your project vizi compatible";

/** Shown right under the title, before step 1 (docs/SPEC.md 3.10, "The read-only sentence"). */
export const READ_ONLY_SENTENCE =
  "vizi is a read-only tool: it reads your project's files on GitHub and never changes anything there.";

/** Step 2: the markers that get a column each, in board order (docs/SPEC.md 3.2). */
export const COLUMN_MARKERS: readonly string[] = ["NOW", "NEXT", "BLOCKED", "LATER", "IDEA"];

/** Step 2: the markers whose columns are folded until opened (docs/SPEC.md 3.2). */
export const FOLDED_MARKERS: readonly string[] = ["DONE", "SUPERSEDED", "MOVED"];

/** Step 1: the three paths, in the order they are tried (docs/SPEC.md 3.1). */
const PATHS = ["BACKLOG.md", "docs/BACKLOG.md", "docs/PRODUCT_BACKLOG.md"];

export const PATHS_EXAMPLE = PATHS.join("\n");

export const ENTRY_EXAMPLE = [
  "## Settings",
  "",
  "- **[NOW] ABC-12** (since 2026-11-01) — Read the settings file. Missing keys",
  "  get defaults.",
  "",
  "  Unknown keys are kept and reported.",
  "- **[NEXT] ABC-13** — Pick the colours.",
  "- **[DONE] ABC-11** — Add the settings page.",
].join("\n");

export const STATUS_EXAMPLE = [
  "# Status",
  "",
  "Last update: 2026-11-04",
  "",
  "## Phase",
  "Build.",
  "",
  "## Current focus",
  "The settings page.",
  "",
  "## Next step",
  "Read the settings file (ABC-12).",
  "",
  "## Blockers",
  "- Product Owner: choose the default port.",
  "- The build server is down.",
].join("\n");

export const PROJECTS_EXAMPLE = [
  "# Projects",
  "",
  "## Tools",
  "",
  "- acme/widgets",
  "- projects/notes/",
].join("\n");

/** A token's form, not a token: the token rule refuses the angle brackets. */
export const TOKEN_EXAMPLE = "github_pat_<letters, digits and underscores>";

export const HELP_STEPS: readonly HelpStep[] = [
  {
    title: [t("Where the backlog file goes")],
    paragraphs: [
      [
        t("Put the backlog file at one of these paths: "),
        ...names(PATHS),
        t(". vizi tries them in this order and reads the first one it finds."),
      ],
      [t("When more than one exists, the Report tab says which one was read.")],
    ],
    example: PATHS_EXAMPLE,
  },
  {
    title: [t("How an entry is written")],
    paragraphs: [
      [
        t(
          "An entry is one list item at column 0: a bold marker and an ID, notes in parentheses, an em dash (",
        ),
        c("—"),
        t(
          ") with a space on each side, then the title, which is the first sentence. The description follows the title.",
        ),
      ],
      [
        t(
          "An entry without an ID, or without the dash, is still read, with a warning in the Report tab. A list item without a marker is not an entry; the Report tab counts it under Info.",
        ),
      ],
      [
        t("Every marker is shown. "),
        ...names(COLUMN_MARKERS),
        t(" get a column each; "),
        ...names(FOLDED_MARKERS),
        t(
          " get folded columns. Any other marker gets a column of its own and a warning in the Report tab.",
        ),
      ],
      [t("Headings group the entries in the List tab.")],
    ],
    example: ENTRY_EXAMPLE,
  },
  {
    title: [t("The "), c("STATUS.md"), t(" headings")],
    paragraphs: [
      [
        t("At the project's root, "),
        c("STATUS.md"),
        t(" holds a "),
        c("# Status"),
        t(" heading, a "),
        c("Last update: YYYY-MM-DD"),
        t(" line, then the headings "),
        ...names(["## Phase", "## Current focus", "## Next step", "## Blockers"]),
        t("."),
      ],
      [
        t("Each blocker is a list item. A blocker that starts with "),
        c("Product Owner:"),
        t(" is highlighted."),
      ],
    ],
    example: STATUS_EXAMPLE,
  },
  {
    title: [c("PROJECTS.md"), t(" for an umbrella")],
    paragraphs: [
      [
        t("A project that groups other projects puts a "),
        c("PROJECTS.md"),
        t(" at its root. Its headings become the tree in the Umbrella tab."),
      ],
      [
        t("A line "),
        c("- owner/repo"),
        t(" points to a repo on GitHub, and "),
        c("- projects/<name>/"),
        t(" to a folder of the same project. "),
        // The pre-project sentence of 3.9, "The help text (PBI-1.18)", after the sentence on pointers.
        t("A "),
        c("projects/<name>/"),
        t(
          " pointer is a pre-project: a project at an early stage, with no repo of its own yet, that lives in this repo for now.",
        ),
        t(" Each pointer is alone on its line, at column 0."),
      ],
    ],
    example: PROJECTS_EXAMPLE,
  },
  {
    title: [t("A private repo: with a token")],
    paragraphs: [
      [
        t(
          'On GitHub, make a fine-grained token for the repos\' owner, limited to the repos you choose, with an expiry, and with the repository permission "Contents" with read access.',
        ),
      ],
      [
        t(
          'Under the address, open "Private repos". Under "Add a token", type the owner in "Owner" and paste the token into "Fine-grained token, read-only". To keep the token in this browser, tick "Remember in this browser", then press "Add". The token is sent only to GitHub.',
        ),
      ],
      [
        t(
          "The example shows the form of a token, not a token: the part in angle brackets stands for the rest.",
        ),
      ],
      [t("vizi opens projects from GitHub, and a private one needs this token.")],
    ],
    example: TOKEN_EXAMPLE,
  },
];

/**
 * The paragraph at the top of the Umbrella tab (docs/SPEC.md 3.9, "The help
 * text (PBI-1.18)"), word for word. The same for every umbrella: nothing in
 * it comes from the project.
 */
export const UMBRELLA_HELP: Paragraph = [
  t("An umbrella is a project that lists other projects in its "),
  c("PROJECTS.md"),
  t(
    ", grouped under the file's headings where it has them. A project with a repo of its own is shown as ",
  ),
  c("<owner>/<repo>"),
  t(
    ", which you can open in vizi or on GitHub. A pre-project is a project at an early stage, with no repo of its own yet, that lives in this umbrella's repo for now: it is shown as ",
  ),
  c("projects/<name>/"),
  t(', and "Show status" reads its '),
  c("STATUS.md"),
  t("."),
];

/** The example link of the paragraph below: vizi's address with a `repo` parameter (docs/SPEC.md 3.16). */
export const REPO_LINK_EXAMPLE = "https://factoincognito.github.io/vizi/?repo=factoincognito/vizi";

/**
 * After the last step and before the closing link, not a step: how to open a
 * repo straight from a link (docs/SPEC.md 3.16, "The help view"), word for word.
 */
export const REPO_LINK_HELP: Paragraph = [
  t("To open a repo straight from a link, add "),
  c("?repo=<owner>/<repo>"),
  t(" to vizi's address, for example "),
  c(REPO_LINK_EXAMPLE),
  t("."),
];

/** After the steps, outside them: the format spec on GitHub (docs/SPEC.md 3.10). */
export const CLOSING_LINK: { href: string; label: Paragraph } = {
  href: "https://github.com/factoincognito/vizi/blob/main/docs/BACKLOG-FORMAT.md",
  label: [t("The full format, "), c("docs/BACKLOG-FORMAT.md"), t(", on GitHub")],
};
