/**
 * The page: wires the pure modules to the DOM (docs/SPEC.md 2.1). It holds
 * no parsing logic. All text from a project is untrusted, so elements are
 * built with calls that set text; no source text is ever inserted as HTML
 * (docs/SPEC.md 3.7).
 */
import {
  type BacklogEntry,
  type BacklogResult,
  parse as parseBacklog,
  type ReportItem,
} from "./backlog";
import { boardColumns, descriptionForDisplay, listSections } from "./board";
import { documentationList, folderFiles, isMarkdownPath, projectFilePath } from "./docs";
import {
  BACKLOG_PATHS,
  blobUrl,
  type Fetcher,
  loadRepo,
  parseGithubUrl,
  readRepoFile,
} from "./github";
import {
  type Block,
  type Inline,
  type LinkTarget,
  type RenderOptions,
  render,
  renderInline,
} from "./markdown";
import {
  type Pointer,
  type ProjectNode,
  type ProjectsResult,
  parse as parseProjects,
} from "./projects";
import { parse as parseStatus, type StatusResult } from "./status";
import { createTokenStore, maskToken } from "./token";
import "./style.css";

/** The browser's local storage, or null where it cannot be used at all (docs/SPEC.md 3.8). */
function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const storage = browserStorage();
const tokens = createTokenStore(storage);
/** Whether the results on the page were loaded with a token: Forget hides them (3.8). */
let projectUsedToken = false;

interface Project {
  name: string;
  files: string[];
  backlogPath: string | null;
  backlog: BacklogResult | null;
  status: StatusResult | null;
  /** Notes about the input itself (docs/SPEC.md 3.5): more than one backlog file, a truncated file list. */
  inputNotes: ReportItem[];
  /** URL mode: links open the file on github.com. Folder mode: links open the file in the page. */
  link: (path: string) => LinkTarget | null;
  /** Folder mode only: reads a file of the folder. */
  readFile: ((path: string) => Promise<string>) | null;
  /** The root PROJECTS.md read as the umbrella view (3.9), or null without the file. */
  projects: ProjectsResult | null;
  /** 3.9, "Show status": reads `projects/<name>/STATUS.md` of this project, fresh each time. */
  readProjectStatus: (name: string, stale: () => boolean) => Promise<StatusRead>;
}

/** What reading a folder pointer's STATUS.md gave (3.9). */
type StatusRead =
  | { kind: "text"; text: string }
  | { kind: "missing" }
  | { kind: "failed"; message: string; tokenRefused: boolean };

// ----------------------------------------------------------------- DOM helpers

type Child = Node | string | null | undefined;

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const c of children) {
    if (c === null || c === undefined) continue;
    el.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

function must<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`The page is missing #${id}.`);
  return el as T;
}

// ------------------------------------------------------------ rendering contract

let project: Project | null = null;

function renderOptions(basePath: string): RenderOptions {
  return {
    basePath,
    resolveFile: (path) => project?.link(path) ?? null,
    codePathLink: (code) => {
      const path = project ? projectFilePath(code, project.files) : null;
      return path === null ? null : (project?.link(path) ?? null);
    },
  };
}

/**
 * Every rendered Markdown text gets its own id prefix, so heading ids stay
 * unique when one text is on the page twice (a description in a board card
 * and in a list row), and an anchor reaches the heading of its own text.
 */
let documents = 0;
let idPrefix = "md-0-";
function inDocument<T>(build: () => T): T {
  documents += 1;
  idPrefix = `md-${documents}-`;
  return build();
}

function linkElement(target: LinkTarget, children: Child[]): HTMLElement {
  if (target.kind === "external") {
    const a = h("a", { href: target.href }, ...children);
    if (target.newTab) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    return a;
  }
  if (target.kind === "anchor") return h("a", { href: `#${idPrefix}${target.id}` }, ...children);
  const a = h("a", { href: "#", "data-path": target.path }, ...children);
  a.addEventListener("click", (event) => {
    event.preventDefault();
    void showDoc(target.path);
  });
  return a;
}

function inlineNode(n: Inline): Node {
  if (n.t === "text") return document.createTextNode(n.text);
  if (n.t === "code") return h("code", {}, n.text);
  if (n.t === "em") return h("em", {}, ...inlineNodes(n.children));
  if (n.t === "strong") return h("strong", {}, ...inlineNodes(n.children));
  return linkElement(n.target, inlineNodes(n.children));
}

function inlineNodes(nodes: Inline[]): Node[] {
  return nodes.map(inlineNode);
}

function blockNode(b: Block): Node {
  if (b.t === "heading") {
    const level = Math.min(Math.max(b.level + 2, 3), 6);
    return h(
      `h${level}` as "h3",
      b.slug ? { id: `${idPrefix}${b.slug}` } : {},
      ...inlineNodes(b.children),
    );
  }
  if (b.t === "paragraph") return h("p", {}, ...inlineNodes(b.children));
  if (b.t === "list")
    return h(
      b.ordered ? "ol" : "ul",
      {},
      ...b.items.map((item) => h("li", {}, ...blockNodes(item))),
    );
  if (b.t === "quote") return h("blockquote", {}, ...blockNodes(b.children));
  return h("pre", {}, h("code", {}, b.text));
}

function blockNodes(blocks: Block[]): Node[] {
  return blocks.map(blockNode);
}

function markdownEl(text: string, basePath: string): HTMLElement {
  return inDocument(() =>
    h("div", { class: "md" }, ...blockNodes(render(text, renderOptions(basePath)))),
  );
}

function inlineEl(text: string, basePath: string): Node[] {
  return inDocument(() => inlineNodes(renderInline(text, renderOptions(basePath))));
}

// ------------------------------------------------------------------- status

/** The test ids of a status view: the project's own, and the "Project status" panel's (3.9). */
interface StatusIds {
  phase: string;
  focus: string;
  next: string;
  updated: string;
  blocker: string;
  none: string;
  missing: string;
  empty: string;
}
const OWN_IDS: StatusIds = {
  phase: "status-phase",
  focus: "status-focus",
  next: "status-next",
  updated: "status-updated",
  blocker: "blocker",
  none: "blockers-none",
  missing: "blockers-missing",
  empty: "blockers-empty",
};
const PANEL_IDS: StatusIds = {
  phase: "pstatus-phase",
  focus: "pstatus-focus",
  next: "pstatus-next",
  updated: "pstatus-updated",
  blocker: "pblocker",
  none: "pblockers-none",
  missing: "pblockers-missing",
  empty: "pblockers-empty",
};

/** The fields and blockers of a STATUS.md (3.3), read under S1 to S5; `basePath` is the file's own path. */
function statusNodes(s: StatusResult, ids: StatusIds, basePath: string): Node[] {
  const field = (testid: string, label: string, text: string | null) =>
    h(
      "div",
      { class: "field" },
      h("h3", {}, label),
      text === null
        ? h("p", { "data-testid": testid, class: "muted" }, "not given")
        : h("div", { "data-testid": testid }, markdownEl(text, basePath)),
    );
  const nodes: Node[] = [
    field(ids.phase, "Phase", s.phase),
    field(ids.focus, "Current focus", s.currentFocus),
    field(ids.next, "Next step", s.nextStep),
    h(
      "p",
      { "data-testid": ids.updated, class: "muted" },
      `Last update: ${s.lastUpdate ?? "not given"}`,
    ),
  ];
  const blockers = h("div", { class: "field" }, h("h3", {}, "Blockers"));
  if (s.blockers === null) {
    blockers.append(h("p", { class: "muted", "data-testid": ids.missing }, "not given"));
  } else {
    if (s.none) {
      blockers.append(
        h("p", { "data-testid": ids.none }, "None", s.remark ? ` — ${s.remark}` : ""),
      );
    } else if (s.blockers.length === 0) {
      blockers.append(h("p", { "data-testid": ids.empty }, "No blockers listed"));
    }
    if (s.blockers.length > 0) {
      blockers.append(
        h(
          "ul",
          { class: "blockers" },
          ...s.blockers.map((b) =>
            h(
              "li",
              {
                "data-testid": ids.blocker,
                "data-waiting": String(b.waitingOnProductOwner),
                class: b.waitingOnProductOwner ? "waiting" : "",
              },
              ...inlineEl(b.text, basePath),
            ),
          ),
        ),
      );
    }
  }
  nodes.push(blockers);
  return nodes;
}

function renderStatus(p: Project): void {
  const box = must("status");
  box.replaceChildren();
  const s = p.status;
  if (!s) {
    box.append(h("p", {}, "No STATUS.md was found, so no status is shown."));
    return;
  }
  box.append(...statusNodes(s, OWN_IDS, "STATUS.md"));
}

// ----------------------------------------------------------------- entries

function entryElement(e: BacklogEntry, testid: string, basePath: string): HTMLElement {
  const details = h("details", { class: "entry", "data-testid": testid, "data-id": e.id ?? "" });
  const summary = h(
    "summary",
    {},
    h("span", { class: `marker m-${e.marker.toLowerCase()}` }, e.marker),
    " ",
    h("span", { class: "id" }, e.id ?? ""),
    e.notes.length > 0 ? h("span", { class: "notes" }, ` (${e.notes.join("; ")})`) : null,
    " ",
    h("span", { class: "title" }, ...inlineEl(e.title, basePath)),
  );
  details.append(summary);
  // The description is rendered when the entry is first opened.
  details.addEventListener("toggle", () => {
    if (details.open && !details.querySelector("[data-testid=description]")) {
      const body = markdownEl(descriptionForDisplay(e), basePath);
      body.setAttribute("data-testid", "description");
      details.append(body);
    }
  });
  return details;
}

function renderBoard(p: Project): void {
  const board = must("board");
  board.replaceChildren();
  if (!p.backlog) return;
  const base = p.backlogPath ?? "";
  const lanes = boardColumns(p.backlog.entries).map((c) => {
    const cards = h(
      "div",
      { class: "cards" },
      ...c.entries.map((e) => entryElement(e, "card", base)),
    );
    const label = h(
      "h3",
      {},
      `${c.marker} `,
      h("span", { class: "count" }, String(c.entries.length)),
    );
    if (c.folded) {
      return h(
        "details",
        { class: "column", "data-testid": "column", "data-marker": c.marker },
        h("summary", {}, label),
        cards,
      );
    }
    return h(
      "section",
      { class: "column", "data-testid": "column", "data-marker": c.marker },
      label,
      cards,
    );
  });
  board.append(...lanes);
}

function renderList(): void {
  const p = project;
  const list = must("list-body");
  list.replaceChildren();
  if (!p?.backlog) return;
  const marker = must<HTMLSelectElement>("marker-filter").value;
  const query = must<HTMLInputElement>("search").value;
  const base = p.backlogPath ?? "";
  for (const s of listSections(p.backlog.entries, {
    marker: marker === "" ? null : marker,
    query,
  })) {
    list.append(
      h(
        "section",
        { class: "group" },
        h("h3", { "data-testid": "list-group" }, s.heading),
        h("ul", {}, ...s.entries.map((e) => h("li", {}, entryElement(e, "list-row", base)))),
      ),
    );
  }
}

function fillMarkerFilter(p: Project): void {
  const select = must<HTMLSelectElement>("marker-filter");
  select.replaceChildren(h("option", { value: "" }, "All markers"));
  for (const c of p.backlog ? boardColumns(p.backlog.entries) : [])
    select.append(h("option", { value: c.marker }, c.marker));
}

// ------------------------------------------------------------ documentation

function renderDocs(p: Project): void {
  const ul = must("doc-list");
  ul.replaceChildren();
  must("doc-view").replaceChildren();
  for (const path of documentationList(p.files)) {
    const target = p.link(path);
    if (!target) continue;
    const a = linkElement(target, [path]);
    a.setAttribute("data-testid", "doc-link");
    ul.append(h("li", {}, a));
  }
}

async function showDoc(path: string): Promise<void> {
  const p = project;
  if (!p?.readFile) return;
  selectTab("docs");
  const view = must("doc-view");
  try {
    const text = await p.readFile(path);
    // Only Markdown is rendered as Markdown; any other file is shown as it is written.
    view.replaceChildren(
      h("h2", {}, path),
      isMarkdownPath(path) ? markdownEl(text, path) : h("pre", {}, h("code", {}, text)),
    );
  } catch {
    view.replaceChildren(h("p", {}, `${path} could not be read.`));
  }
  view.scrollIntoView?.();
}

// ------------------------------------------------------------------- report

function renderReport(p: Project): number {
  const items: { kind: ReportItem["kind"]; text: string }[] = [];
  const add = (file: string | null, list: ReportItem[]) => {
    for (const r of list) {
      const where = r.line === null ? "" : `${file ? `${file} ` : ""}line ${r.line}: `;
      items.push({ kind: r.kind, text: `${where}${r.message}` });
    }
  };
  add(null, p.inputNotes);
  add(p.backlogPath, p.backlog?.report ?? []);
  add("STATUS.md", p.status?.report ?? []);
  add("PROJECTS.md", p.projects?.report ?? []);
  const box = must("report-body");
  box.replaceChildren();
  const titles = { error: "Not read", warning: "Read with a warning", info: "Info" } as const;
  for (const kind of ["error", "warning", "info"] as const) {
    const mine = items.filter((i) => i.kind === kind);
    box.append(
      h(
        "section",
        { class: `report ${kind}` },
        h(
          "h3",
          {},
          `${titles[kind]} `,
          h("span", { class: "count", "data-testid": `report-count-${kind}` }, String(mine.length)),
        ),
        h(
          "ul",
          {},
          ...mine.map((i) => h("li", { "data-testid": "report-item", "data-kind": kind }, i.text)),
        ),
      ),
    );
  }
  return items.length;
}

// ----------------------------------------------------------------- umbrella

/** Loads a repo by its address in the same page, as a newer load (3.9, "Open in vizi"). */
function openInVizi(address: string): void {
  must<HTMLInputElement>("url-input").value = address;
  void openUrl(address);
}

function link(text: string, onClick: () => void): HTMLElement {
  const a = h("a", { href: "#" }, text);
  a.addEventListener("click", (event) => {
    event.preventDefault();
    onClick();
  });
  return a;
}

function pointerElement(pointer: Pointer): HTMLElement {
  const li = h(
    "li",
    { "data-testid": "pointer", "data-kind": pointer.kind, "data-pointer": pointer.text },
    h("span", { class: "pointer-text" }, pointer.text),
  );
  if (pointer.kind === "repo") {
    const address = `https://github.com/${pointer.owner}/${pointer.repo}`;
    const onGithub = h(
      "a",
      { href: address, target: "_blank", rel: "noopener noreferrer" },
      "On GitHub",
    );
    li.append(
      " ",
      link("Open in vizi", () => openInVizi(address)),
      " ",
      onGithub,
    );
  } else {
    li.append(
      " ",
      link("Show status", () => void showProjectStatus(pointer)),
    );
  }
  return li;
}

function nodeElement(node: ProjectNode): HTMLElement {
  const li = h(
    "li",
    { "data-testid": "umbrella-node" },
    h(
      "div",
      { class: "umbrella-heading" },
      ...(node.heading === null ? ["(no heading)"] : inlineEl(node.heading, "PROJECTS.md")),
    ),
  );
  if (node.pointers.length > 0)
    li.append(h("ul", { class: "pointers" }, ...node.pointers.map(pointerElement)));
  if (node.children.length > 0)
    li.append(h("ul", { class: "children" }, ...node.children.map(nodeElement)));
  return li;
}

/** The tree is built from the file at every load and never carries a status (3.9). */
function renderUmbrella(p: Project): void {
  const tree = must("umbrella-tree");
  tree.replaceChildren();
  clearProjectStatus();
  if (p.projects && p.projects.tree.length > 0)
    tree.append(h("ul", { class: "children" }, ...p.projects.tree.map(nodeElement)));
}

function clearProjectStatus(): void {
  const box = must("project-status");
  box.replaceChildren();
  box.hidden = true;
}

/** Counts the "Show status" uses: the newest wins (3.9). */
let latestStatus = 0;

async function showProjectStatus(pointer: Extract<Pointer, { kind: "folder" }>): Promise<void> {
  const p = project;
  if (!p) return;
  const id = ++latestStatus;
  const load = latestLoad;
  // An answer is dropped when a newer "Show status" or a newer load has started, or another project is open.
  const stale = () => id !== latestStatus || load !== latestLoad || project !== p;
  const read = await p.readProjectStatus(pointer.name, stale);
  if (stale()) return;
  const box = must("project-status");
  const statusPath = `${pointer.text}STATUS.md`;
  box.hidden = false;
  box.replaceChildren(
    h("h3", {}, "Project status"),
    h("p", { class: "muted pointer-text" }, pointer.text),
  );
  if (read.kind === "missing") {
    box.append(h("p", {}, `No STATUS.md in ${pointer.text}`));
  } else if (read.kind === "failed") {
    if (read.tokenRefused) {
      // GitHub refused the token: forget it, as 3.8 sets out.
      dropToken();
      forgetEverything(read.message);
      return;
    }
    box.append(h("p", {}, read.message));
  } else {
    const status = parseStatus(read.text);
    box.append(...statusNodes(status, PANEL_IDS, statusPath));
    if (status.report.length > 0) {
      box.append(
        h("h4", {}, "What could not be read"),
        h(
          "ul",
          { class: "panel-report" },
          ...status.report.map((r) =>
            h(
              "li",
              { "data-testid": "panel-report-item", "data-kind": r.kind },
              `${r.line === null ? "" : `line ${r.line}: `}${r.message}`,
            ),
          ),
        ),
      );
    }
  }
}

// -------------------------------------------------------------------- tabs

const TABS = ["board", "list", "docs", "report", "umbrella"] as const;
type Tab = (typeof TABS)[number];

function selectTab(tab: Tab): void {
  for (const t of TABS) {
    const button = must(`tab-${t}`);
    button.setAttribute("aria-selected", String(t === tab));
    must(`panel-${t}`).hidden = t !== tab;
  }
  if (tab === "list") renderList();
}

// ------------------------------------------------------------------ loading

function say(text: string, notes: string[] = []): void {
  must("message").replaceChildren(
    ...[text, ...notes].filter((t) => t !== "").map((t) => h("p", {}, t)),
  );
}

function show(p: Project): void {
  project = p;
  must("results").hidden = false;
  must("project-name").textContent = p.name;
  renderStatus(p);
  renderBoard(p);
  fillMarkerFilter(p);
  must<HTMLInputElement>("search").value = "";
  renderDocs(p);
  const count = renderReport(p);
  must("tab-report").textContent = `Report (${count})`;
  must("tab-umbrella").hidden = p.projects === null;
  renderUmbrella(p);
  // A project with a PROJECTS.md and no backlog file opens on the Umbrella tab (3.9).
  selectTab(p.projects !== null && p.backlog === null ? "umbrella" : "board");
}

function inputNotes(backlogPaths: string[], truncated: boolean): ReportItem[] {
  const notes: ReportItem[] = [];
  if (backlogPaths.length > 1) {
    notes.push({
      kind: "info",
      code: "several-backlogs",
      line: null,
      message: `Found more than one backlog file (${backlogPaths.join(", ")}); read ${backlogPaths[0]}.`,
    });
  }
  if (truncated) {
    notes.push({
      kind: "info",
      code: "truncated-file-list",
      line: null,
      message:
        "GitHub's file list was truncated: the documentation list and file links may be incomplete.",
    });
  }
  return notes;
}

function build(
  name: string,
  files: string[],
  backlogPaths: string[],
  backlogText: string | null,
  statusText: string | null,
  truncated: boolean,
  link: Project["link"],
  readFile: Project["readFile"],
  projectsText: string | null,
  readProjectStatus: Project["readProjectStatus"],
): Project {
  return {
    name,
    files,
    backlogPath: backlogPaths[0] ?? null,
    backlog: backlogText === null ? null : parseBacklog(backlogText),
    status: statusText === null ? null : parseStatus(statusText),
    inputNotes: inputNotes(backlogPaths, truncated),
    link,
    readFile,
    projects: projectsText === null ? null : parseProjects(projectsText),
    readProjectStatus,
  };
}

/** After a failed load the previous project's results are not left under the error message. */
function hideResults(): void {
  project = null;
  projectUsedToken = false;
  must("results").hidden = true;
  for (const id of [
    "status",
    "board",
    "list-body",
    "doc-list",
    "doc-view",
    "report-body",
    "umbrella-tree",
  ]) {
    must(id).replaceChildren();
  }
  clearProjectStatus();
}

/**
 * Counts the loads started (an address submitted, a folder picked). An
 * answer that arrives after a newer load started is dropped, so the
 * newest request always wins (docs/SPEC.md 3.1).
 */
let latestLoad = 0;

/** The page's fetch. A request that carries the token is not made once its load has been replaced (3.8). */
function guardedFetch(token: string | null, replaced: () => boolean): Fetcher {
  return (url, init) => {
    if (token !== null && replaced()) throw new Error("replaced by a newer load");
    return fetch(url, init);
  };
}

async function openUrl(address: string): Promise<void> {
  const load = ++latestLoad;
  const ref = parseGithubUrl(address);
  if (!ref) {
    say(
      "Enter a public repo address like https://github.com/<owner>/<repo>, optionally followed by /tree/<branch>.",
    );
    hideResults();
    return;
  }
  say("Loading…");
  const token = tokens.current();
  const result = await loadRepo(
    ref,
    guardedFetch(token, () => load !== latestLoad),
    token,
  );
  if (load !== latestLoad) return;
  if (!result.ok) {
    // GitHub refused the token: it is dead, so it is forgotten and cannot break later public loads.
    if (result.kind === "token-refused") dropToken();
    say(result.message);
    hideResults();
    return;
  }
  const withBranch = { owner: ref.owner, repo: ref.repo, branch: result.branch };
  const p = build(
    `${ref.owner}/${ref.repo} (${result.branch})`,
    result.files,
    result.backlogPaths,
    result.backlogText,
    result.statusText,
    result.truncated,
    (path) => ({ kind: "external", href: blobUrl(withBranch, path), newTab: true }),
    null,
    result.projectsText,
    async (name, stale) => {
      const path = `projects/${name}/STATUS.md`;
      // Without the file in the file list there is nothing to ask for.
      if (!result.files.includes(path)) return { kind: "missing" };
      const current = tokens.current();
      const answer = await readRepoFile(withBranch, path, guardedFetch(current, stale), current);
      if (answer.ok) return { kind: "text", text: answer.text };
      return {
        kind: "failed",
        message: answer.message,
        tokenRefused: answer.kind === "token-refused",
      };
    },
  );
  show(p);
  projectUsedToken = token !== null;
  say(
    p.backlog
      ? ""
      : "No backlog file was found (looked for BACKLOG.md, docs/BACKLOG.md and docs/PRODUCT_BACKLOG.md).",
    result.truncated
      ? [
          "The file list from GitHub was truncated, so the documentation list and file links may be incomplete.",
        ]
      : [],
  );
}

async function openFolder(input: HTMLInputElement): Promise<void> {
  const picked = Array.from(input.files ?? []);
  if (picked.length === 0) return;
  const load = ++latestLoad;
  const byPath = new Map<string, File>();
  for (const f of picked) {
    const [inner] = folderFiles([f.webkitRelativePath || f.name]);
    if (inner !== undefined) byPath.set(inner, f);
  }
  const files = [...byPath.keys()];
  const backlogPaths = BACKLOG_PATHS.filter((b) => byPath.has(b));
  const read = async (path: string): Promise<string> => {
    const file = byPath.get(path);
    if (!file) throw new Error(`${path} is not in the folder.`);
    return file.text();
  };
  const first = backlogPaths[0];
  const backlogText = first === undefined ? null : await read(first);
  const statusText = byPath.has("STATUS.md") ? await read("STATUS.md") : null;
  const projectsText = byPath.has("PROJECTS.md") ? await read("PROJECTS.md") : null;
  if (load !== latestLoad) return;
  const name = (picked[0]?.webkitRelativePath ?? "").split("/")[0] || "folder";
  const p = build(
    name,
    files,
    backlogPaths,
    backlogText,
    statusText,
    false,
    (path) => (byPath.has(path) ? { kind: "file", path } : null),
    read,
    projectsText,
    async (name) => {
      const path = `projects/${name}/STATUS.md`;
      if (!byPath.has(path)) return { kind: "missing" };
      try {
        return { kind: "text", text: await read(path) };
      } catch {
        return { kind: "failed", message: `${path} could not be read.`, tokenRefused: false };
      }
    },
  );
  show(p);
  projectUsedToken = false;
  say(
    p.backlog
      ? ""
      : "No backlog file was found (looked for BACKLOG.md, docs/BACKLOG.md and docs/PRODUCT_BACKLOG.md).",
  );
}

// -------------------------------------------------------------------- token

/** Shows or hides the "Token in use" line; the token itself is shown only in its masked form. */
function renderToken(): void {
  const token = tokens.current();
  must("token-status").hidden = token === null;
  must("token-line").textContent =
    token === null
      ? ""
      : `Token in use: ${maskToken(token)}, ${tokens.isSaved() ? "saved in this browser" : "for this page only"}.`;
  if (token !== null) must<HTMLInputElement>("token-remember").checked = tokens.isSaved();
}

/** Drops the token from memory and storage (3.8). Whether results or loads go with it is the caller's call. */
function dropToken(): void {
  tokens.forget();
  must<HTMLInputElement>("token-remember").checked = false;
  must<HTMLInputElement>("token-input").value = "";
  renderToken();
}

/**
 * What "Forget the token" does, here and when another tab removed the key:
 * the token goes, the results loaded with it are hidden, and it counts as a
 * newer load, so the answer of a load still running is dropped (3.1, 3.8).
 */
function forgetEverything(message: string): void {
  latestLoad += 1;
  if (projectUsedToken) hideResults();
  must("token-message").textContent = "";
  say(message);
}

function useToken(): void {
  const input = must<HTMLInputElement>("token-input");
  const remember = must<HTMLInputElement>("token-remember").checked;
  const result = tokens.use(input.value, remember);
  input.value = "";
  const message = must("token-message");
  if (!result.ok) message.textContent = result.message;
  else if (remember && !result.saved)
    message.textContent = "The browser would not save the token; it is kept for this page only.";
  else message.textContent = "";
  renderToken();
}

function mountToken(): HTMLElement {
  const input = h("input", {
    id: "token-input",
    type: "password",
    autocomplete: "off",
    spellcheck: "false",
  });
  const remember = h("input", { id: "token-remember", type: "checkbox" });
  const use = h("button", { id: "token-use", type: "button" }, "Use");
  use.addEventListener("click", useToken);
  remember.addEventListener("change", () => {
    tokens.setRemember(remember.checked);
    renderToken();
  });
  const forget = h("button", { id: "token-forget", type: "button" }, "Forget the token");
  forget.addEventListener("click", () => {
    dropToken();
    forgetEverything("The token has been forgotten.");
  });
  // Not a <form>: a browser has no form to offer to save the field from (3.8).
  return h(
    "div",
    { id: "token-box" },
    h("label", { for: "token-input" }, "GitHub token (for private repos)"),
    h("div", { class: "token-row" }, input, use),
    h("label", { class: "check" }, remember, " Remember the token"),
    h(
      "p",
      { id: "token-note", class: "muted", "data-testid": "token-note" },
      "Use a read-only token limited to the repos you need, with an expiry. Other factoincognito Pages sites share this page's storage and can reach the token.",
    ),
    h("p", { id: "token-message", role: "status", "data-testid": "token-message" }),
    h(
      "div",
      { id: "token-status", hidden: "" },
      h("p", { id: "token-line", "data-testid": "token-line" }),
      forget,
    ),
  );
}

// --------------------------------------------------------------------- page

function mount(): void {
  const app = must("app");
  const tab = (id: Tab, label: string) => {
    const b = h(
      "button",
      { id: `tab-${id}`, role: "tab", type: "button", "aria-selected": "false" },
      label,
    );
    b.addEventListener("click", () => selectTab(id));
    // The Umbrella tab exists only for a project with a PROJECTS.md (3.9).
    if (id === "umbrella") b.hidden = true;
    return b;
  };
  const urlInput = h("input", {
    id: "url-input",
    type: "text",
    placeholder: "https://github.com/owner/repo",
    autocomplete: "off",
  });
  const folderInput = h("input", { id: "folder-input", type: "file", multiple: "" });
  folderInput.setAttribute("webkitdirectory", "");
  const form = h(
    "form",
    { id: "url-form" },
    h("label", { for: "url-input" }, "Public GitHub repo"),
    urlInput,
    h("button", { id: "open-url", type: "submit" }, "Open"),
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void openUrl(urlInput.value);
  });
  folderInput.addEventListener("change", () => void openFolder(folderInput));

  const search = h("input", { id: "search", type: "search", placeholder: "Search" });
  search.addEventListener("input", renderList);
  const filter = h("select", { id: "marker-filter", "aria-label": "Marker" });
  filter.addEventListener("change", renderList);

  app.append(
    h("h1", {}, "Vizi - backlog visualizer"),
    h(
      "div",
      { class: "inputs" },
      form,
      mountToken(),
      h("div", {}, h("label", { for: "folder-input" }, "Or a local project folder"), folderInput),
    ),
    h("div", { id: "message", role: "status" }),
    h(
      "div",
      { id: "results", hidden: "" },
      h("h2", { id: "project-name" }),
      h("section", { id: "status", "aria-label": "Status" }),
      h(
        "div",
        { role: "tablist", class: "tabs" },
        tab("board", "Board"),
        tab("list", "List"),
        tab("docs", "Documentation"),
        tab("report", "Report"),
        tab("umbrella", "Umbrella"),
      ),
      h("div", { id: "panel-board", role: "tabpanel" }, h("div", { id: "board", class: "board" })),
      h(
        "div",
        { id: "panel-list", role: "tabpanel", hidden: "" },
        h("div", { class: "filters" }, search, filter),
        h("div", { id: "list-body" }),
      ),
      h(
        "div",
        { id: "panel-docs", role: "tabpanel", hidden: "" },
        h("ul", { id: "doc-list" }),
        h("div", { id: "doc-view" }),
      ),
      h(
        "div",
        { id: "panel-report", role: "tabpanel", hidden: "" },
        h("div", { id: "report-body" }),
      ),
      h(
        "div",
        { id: "panel-umbrella", role: "tabpanel", hidden: "" },
        h("div", { id: "umbrella-tree" }),
        h("section", {
          id: "project-status",
          "data-testid": "project-status",
          "aria-label": "Project status",
          hidden: "",
        }),
      ),
    ),
  );
}

mount();
tokens.start();
renderToken();
// Another open tab saved, changed or removed the token (3.8).
window.addEventListener("storage", (event) => {
  if (storage === null || (event.storageArea !== null && event.storageArea !== storage)) return;
  const outcome = tokens.onStorage(event.key, event.newValue);
  if (outcome === "forgotten") {
    dropToken();
    forgetEverything("The token was removed in another tab, so it has been forgotten.");
  } else if (outcome === "adopted") {
    renderToken();
  }
});
