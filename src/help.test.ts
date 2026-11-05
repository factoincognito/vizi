/**
 * Tests for src/help.ts, the help view's text (docs/SPEC.md 3.10). The
 * examples the view shows are read here by the page's own readers, so the
 * help says only what the code accepts. No network, no browser.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseBacklog, RECOMMENDED_MARKERS } from "./backlog";
import { boardColumns } from "./board";
import { BACKLOG_PATHS } from "./github";
import {
  CLOSING_LINK,
  COLUMN_MARKERS,
  ENTRY_EXAMPLE,
  FOLDED_MARKERS,
  HELP_STEPS,
  HELP_TITLE,
  PATHS_EXAMPLE,
  type Paragraph,
  PROJECTS_EXAMPLE,
  plainText,
  READ_ONLY_SENTENCE,
  STATUS_EXAMPLE,
  TOKEN_EXAMPLE,
  UMBRELLA_HELP,
} from "./help";
import { type ProjectNode, parse as parseProjects } from "./projects";
import { parse as parseStatus } from "./status";
import { parseToken } from "./token";

/** Every piece of text the view shows, as data. */
function allText(): string[] {
  const out = [HELP_TITLE, READ_ONLY_SENTENCE, plainText(CLOSING_LINK.label), CLOSING_LINK.href];
  for (const step of HELP_STEPS) {
    out.push(plainText(step.title), step.example, ...step.paragraphs.map(plainText));
  }
  return out;
}

const codeParts = (paragraphs: readonly Paragraph[]) =>
  paragraphs.flatMap((p) => p.filter((part) => part.kind === "code").map((part) => part.text));

/** A real-looking fine-grained token: the prefix and ten or more word characters (3.10, step 5). */
const REAL_LOOKING_TOKEN = /github_pat_[A-Za-z0-9_]{10,}/;

describe("the help view's text (3.10)", () => {
  test("has the approved title, five steps in order, and each step one example", () => {
    expect(HELP_TITLE).toBe("How to make your project vizi compatible");
    expect(HELP_STEPS.map((s) => plainText(s.title))).toEqual([
      "Where the backlog file goes",
      "How an entry is written",
      "The STATUS.md headings",
      "PROJECTS.md for an umbrella",
      "A private repo: with a token",
    ]);
    expect(HELP_STEPS.map((s) => s.example)).toEqual([
      PATHS_EXAMPLE,
      ENTRY_EXAMPLE,
      STATUS_EXAMPLE,
      PROJECTS_EXAMPLE,
      TOKEN_EXAMPLE,
    ]);
    for (const step of HELP_STEPS) {
      expect(step.paragraphs.length).toBeGreaterThan(0);
      expect(step.example.trim()).not.toBe("");
    }
  });

  test("the read-only sentence is the one of 3.10, word for word", () => {
    expect(READ_ONLY_SENTENCE).toBe(
      "vizi is a read-only tool: it reads your project's files on GitHub and never changes anything there.",
    );
  });

  test("a paragraph is a list of parts, each plain text or code, and none is empty", () => {
    for (const p of [
      ...HELP_STEPS.flatMap((s) => [s.title, ...s.paragraphs]),
      CLOSING_LINK.label,
    ]) {
      expect(p.length).toBeGreaterThan(0);
      for (const part of p) {
        expect(["text", "code"]).toContain(part.kind);
        expect(part.text).not.toBe("");
      }
    }
  });

  test("plainText joins a paragraph's parts as written", () => {
    expect(
      plainText([
        { kind: "text", text: "The " },
        { kind: "code", text: "STATUS.md" },
        { kind: "text", text: " headings" },
      ]),
    ).toBe("The STATUS.md headings");
    expect(plainText([])).toBe("");
  });

  test("no code part starts or ends with a space, so none is hard to see", () => {
    for (const p of [
      ...HELP_STEPS.flatMap((s) => [s.title, ...s.paragraphs]),
      CLOSING_LINK.label,
    ]) {
      for (const part of p.filter((x) => x.kind === "code")) {
        expect(part.text).toBe(part.text.trim());
      }
    }
  });

  test("step 2 shows the em dash as code on its own, and says it has a space on each side", () => {
    const step = HELP_STEPS[1];
    expect(step).toBeDefined();
    if (!step) return;
    expect(codeParts(step.paragraphs)).toContain("—");
    expect(step.paragraphs.map(plainText).join(" ")).toContain("with a space on each side");
  });

  test("the step titles name STATUS.md and PROJECTS.md as code", () => {
    expect(HELP_STEPS[2]?.title).toContainEqual({ kind: "code", text: "STATUS.md" });
    expect(HELP_STEPS[3]?.title).toContainEqual({ kind: "code", text: "PROJECTS.md" });
  });
});

describe("step 1: where the backlog file goes", () => {
  test("its example is the three paths the page tries, in BACKLOG_PATHS order, one per line", () => {
    expect(PATHS_EXAMPLE.split("\n")).toEqual([...BACKLOG_PATHS]);
  });

  test("its text names the three paths as code and says the Report tab tells which was read", () => {
    const step = HELP_STEPS[0];
    expect(step).toBeDefined();
    if (!step) return;
    expect(codeParts(step.paragraphs)).toEqual(expect.arrayContaining([...BACKLOG_PATHS]));
    const text = step.paragraphs.map(plainText).join(" ");
    expect(text).toContain("Report tab");
    expect(text).toContain("first");
  });
});

describe("step 2: how an entry is written", () => {
  test("its example reads as stated: three entries in Settings, their markers, IDs, note, titles and description, and an empty report", () => {
    const read = parseBacklog(ENTRY_EXAMPLE);
    expect(read.report).toEqual([]);
    expect(
      read.entries.map((e) => ({
        marker: e.marker,
        id: e.id,
        notes: e.notes,
        title: e.title,
        group: e.group,
      })),
    ).toEqual([
      {
        marker: "NOW",
        id: "ABC-12",
        notes: ["since 2026-11-01"],
        title: "Read the settings file.",
        group: "Settings",
      },
      { marker: "NEXT", id: "ABC-13", notes: [], title: "Pick the colours.", group: "Settings" },
      {
        marker: "DONE",
        id: "ABC-11",
        notes: [],
        title: "Add the settings page.",
        group: "Settings",
      },
    ]);
    const [first, second, third] = read.entries;
    // The first description: "Missing keys get defaults." followed by "Unknown keys are kept and reported."
    expect(
      (first?.description ?? "").split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()),
    ).toEqual(["Missing keys get defaults.", "Unknown keys are kept and reported."]);
    expect(second?.description).toBe("");
    expect(third?.description).toBe("");
  });

  test("the markers it names as getting a column, and as folded, are what the board makes of each, in board order", () => {
    const extra = "WAITING";
    const all = [...COLUMN_MARKERS, ...FOLDED_MARKERS, extra];
    const backlog = all.map((m, i) => `- **[${m}] AB-${i + 1}** — Item ${i + 1}.`).join("\n");
    const read = parseBacklog(backlog);
    const columns = boardColumns(read.entries);
    expect(columns.map((c) => c.marker)).toEqual(all);
    for (const c of columns) {
      expect([c.marker, c.folded]).toEqual([c.marker, FOLDED_MARKERS.includes(c.marker)]);
    }
    // Any other marker: a column of its own (last, not folded) and a warning in the report.
    expect(read.report).toEqual([
      expect.objectContaining({ kind: "warning", code: "unknown-marker", line: all.length }),
    ]);
  });

  test("the markers it names are exactly the recommended set", () => {
    expect(new Set([...COLUMN_MARKERS, ...FOLDED_MARKERS])).toEqual(new Set(RECOMMENDED_MARKERS));
    expect(COLUMN_MARKERS).toHaveLength(5);
    expect(FOLDED_MARKERS).toHaveLength(3);
  });

  test("its text names every one of those markers as code", () => {
    const step = HELP_STEPS[1];
    expect(step).toBeDefined();
    if (!step) return;
    const code = codeParts(step.paragraphs);
    for (const m of [...COLUMN_MARKERS, ...FOLDED_MARKERS]) expect(code).toContain(m);
  });

  test("its text says that an entry without an ID or without the dash is still read with a warning, and that an unmarked item is not an entry", () => {
    const text = (HELP_STEPS[1]?.paragraphs ?? []).map(plainText).join(" ");
    expect(text).toContain("without an ID");
    expect(text).toContain("still read");
    expect(text).toContain("warning");
    expect(text).toContain("without a marker is not an entry");
  });

  test("the two cases the text says are read with a warning are read with a warning", () => {
    const noId = parseBacklog("- **[NOW]** — Read the file.");
    const noDash = parseBacklog("- **[NOW] AB-1** Read the file.");
    for (const read of [noId, noDash]) {
      expect(read.entries).toHaveLength(1);
      expect(read.report.map((r) => r.kind)).toContain("warning");
    }
    const unmarked = parseBacklog("- Read the file.");
    expect(unmarked.entries).toEqual([]);
    expect(unmarked.report.map((r) => r.kind)).toEqual(["info"]);
  });
});

describe("step 3: the STATUS.md headings", () => {
  test("its example reads as stated: the fields, the date, two blockers with the first waiting on the product owner, and an empty report", () => {
    const read = parseStatus(STATUS_EXAMPLE);
    expect(read.report).toEqual([]);
    expect(read.phase).toBe("Build.");
    expect(read.currentFocus).toBe("The settings page.");
    expect(read.nextStep).toBe("Read the settings file (ABC-12).");
    expect(read.lastUpdate).toBe("2026-11-04");
    expect(read.none).toBe(false);
    expect(read.blockers?.map((b) => [b.text, b.waitingOnProductOwner])).toEqual([
      ["Product Owner: choose the default port.", true],
      ["The build server is down.", false],
    ]);
  });

  test("its text names the headings, the Last update line and the Product Owner: prefix as code", () => {
    const code = codeParts(HELP_STEPS[2]?.paragraphs ?? []);
    for (const c of [
      "# Status",
      "Last update: YYYY-MM-DD",
      "## Phase",
      "## Current focus",
      "## Next step",
      "## Blockers",
      "Product Owner:",
    ]) {
      expect(code).toContain(c);
    }
  });
});

describe("step 4: PROJECTS.md for an umbrella", () => {
  type Outline = { h: string | null; p: string[]; c: Outline[] };
  const outline = (nodes: ProjectNode[]): Outline[] =>
    nodes.map((n) => ({ h: n.heading, p: n.pointers.map((x) => x.text), c: outline(n.children) }));

  test("its example reads as stated: Projects with the child Tools, a repo pointer and a folder pointer, and an empty report", () => {
    const read = parseProjects(PROJECTS_EXAMPLE);
    expect(read.report).toEqual([]);
    expect(outline(read.tree)).toEqual([
      { h: "Projects", p: [], c: [{ h: "Tools", p: ["acme/widgets", "projects/notes/"], c: [] }] },
    ]);
    const pointers = read.tree[0]?.children[0]?.pointers ?? [];
    expect(pointers.map((p) => p.kind)).toEqual(["repo", "folder"]);
  });

  test("its text names both pointer forms as code", () => {
    const code = codeParts(HELP_STEPS[3]?.paragraphs ?? []);
    expect(code).toContain("- owner/repo");
    expect(code).toContain("- projects/<name>/");
  });

  test("its text holds the pre-project sentence of 3.9, word for word, after the sentence on pointers (PBI-1.18)", () => {
    const pre =
      "A projects/<name>/ pointer is a pre-project: a project at an early stage, with no repo of its own yet, that lives in this repo for now.";
    const text = (HELP_STEPS[3]?.paragraphs ?? []).map(plainText).join(" ");
    expect(text).toContain(pre);
    expect(text.indexOf(pre)).toBeGreaterThan(text.indexOf("to a folder of the same project."));
    // The form is code, as in the rest of the step.
    expect(codeParts(HELP_STEPS[3]?.paragraphs ?? [])).toContain("projects/<name>/");
  });
});

describe("the umbrella help text (3.9, PBI-1.18)", () => {
  test("UMBRELLA_HELP, joined, is the three sentences of 3.9 word for word", () => {
    expect(plainText(UMBRELLA_HELP)).toBe(
      "An umbrella is a project that lists other projects in its PROJECTS.md, grouped under the file's headings where it has them. A project with a repo of its own is shown as <owner>/<repo>, which you can open in vizi or on GitHub. A pre-project is a project at an early stage, with no repo of its own yet, that lives in this umbrella's repo for now: it is shown as projects/<name>/, and \"Show status\" reads its STATUS.md.",
    );
  });

  test("its code parts are exactly PROJECTS.md, <owner>/<repo>, projects/<name>/ and STATUS.md", () => {
    expect(UMBRELLA_HELP.filter((p) => p.kind === "code").map((p) => p.text)).toEqual([
      "PROJECTS.md",
      "<owner>/<repo>",
      "projects/<name>/",
      "STATUS.md",
    ]);
  });

  test("the forms it names agree with P4: a projects/<name>/ line is a folder pointer, an owner/repo line a repo pointer", () => {
    const read = parseProjects(["# Hub", "", "- projects/notes/", "- acme/widgets"].join("\n"));
    expect(read.report).toEqual([]);
    expect(read.tree[0]?.pointers.map((p) => [p.text, p.kind])).toEqual([
      ["projects/notes/", "folder"],
      ["acme/widgets", "repo"],
    ]);
  });
});

describe("step 5: a private repo, with a token", () => {
  test("its example is the token's format with a placeholder, which the token rule refuses", () => {
    expect(TOKEN_EXAMPLE).toBe("github_pat_<letters, digits and underscores>");
    expect(parseToken(TOKEN_EXAMPLE)).toBeNull();
  });

  test("no part of the help text holds a real-looking token", () => {
    for (const text of allText()) expect(text).not.toMatch(REAL_LOOKING_TOKEN);
    expect(allText().join("\n")).not.toMatch(REAL_LOOKING_TOKEN);
  });

  test("nor does the module's source, comments included", () => {
    const source = readFileSync(join(__dirname, "help.ts"), "utf8");
    expect(source).not.toMatch(REAL_LOOKING_TOKEN);
    expect(source).not.toMatch(/ghp_[A-Za-z0-9]{20,}/);
  });

  test("its text names the controls of the start page by their labels, the permission, and that the token goes only to GitHub", () => {
    const text = (HELP_STEPS[4]?.paragraphs ?? []).map(plainText).join(" ");
    // The controls of the redesigned start page (3.12, "Changes to the help view", items 3 and 6).
    for (const label of ["Private repos", "Owner", "Remember in this browser", "Add"]) {
      expect(text).toContain(`"${label}"`);
    }
    for (const gone of ["GitHub token (for private repos)", "Use", "Remember the token"]) {
      expect(text).not.toContain(`"${gone}"`);
    }
    // The box comes before "Add", as on the page.
    expect(text.indexOf('"Remember in this browser"')).toBeLessThan(text.indexOf('"Add"'));
    // The permission in the token guide's words (item 4).
    expect(text).toContain('the repository permission "Contents" with read access');
    expect(text).not.toContain("set to read-only");
    expect(text).toContain("fine-grained");
    expect(text).toContain("only to GitHub");
  });

  test("it has only the token way: no word of a folder, and its text ends with the sentence of 3.10", () => {
    const paragraphs = (HELP_STEPS[4]?.paragraphs ?? []).map(plainText);
    expect([plainText(HELP_STEPS[4]?.title ?? []), ...paragraphs].join(" ")).not.toMatch(/folder/i);
    expect(paragraphs[paragraphs.length - 1]).toBe(
      "vizi opens projects from GitHub, and a private one needs this token.",
    );
  });
});

describe("no local folder in the help (3.11)", () => {
  // The strings 3.11 lists; the help's "folder pointer" and "a folder of the same project" are allowed.
  const FOLDER_WORDS = ["local project folder", "local folder", "as a folder", "project's folder"];

  test("no part of the help text holds any of 3.11's folder strings, in any case", () => {
    const text = allText().join("\n").toLowerCase();
    for (const words of FOLDER_WORDS) expect(text).not.toContain(words);
  });

  test("nor does the module's source", () => {
    const source = readFileSync(join(__dirname, "help.ts"), "utf8").toLowerCase();
    for (const words of FOLDER_WORDS) expect(source).not.toContain(words);
  });
});

describe("the closing link", () => {
  test("goes to docs/BACKLOG-FORMAT.md of factoincognito/vizi on GitHub, with the approved label", () => {
    expect(CLOSING_LINK.href.startsWith("https://github.com/factoincognito/vizi/")).toBe(true);
    expect(CLOSING_LINK.href.endsWith("docs/BACKLOG-FORMAT.md")).toBe(true);
    expect(CLOSING_LINK.href).toBe(
      "https://github.com/factoincognito/vizi/blob/main/docs/BACKLOG-FORMAT.md",
    );
    expect(plainText(CLOSING_LINK.label)).toBe(
      "The full format, docs/BACKLOG-FORMAT.md, on GitHub",
    );
    expect(CLOSING_LINK.label).toContainEqual({ kind: "code", text: "docs/BACKLOG-FORMAT.md" });
  });
});

describe("the rendering path (3.10, 3.7 item 3)", () => {
  for (const file of ["help.ts", "main.ts"]) {
    test(`src/${file} holds no innerHTML, outerHTML or insertAdjacentHTML`, () => {
      const source = readFileSync(join(__dirname, file), "utf8");
      expect(source).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML/);
    });
  }

  test("src/help.ts loads nothing: no import, no fetch", () => {
    const source = readFileSync(join(__dirname, "help.ts"), "utf8");
    expect(source).not.toMatch(/^\s*import\b/m);
    expect(source).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|import\s*\(/);
  });
});
