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
import { BACKLOG_PATHS, blobUrl, loadRepo, parseGithubUrl } from "./github";
import {
  type Block,
  type Inline,
  type LinkTarget,
  type RenderOptions,
  render,
  renderInline,
} from "./markdown";
import { parse as parseStatus, type StatusResult } from "./status";
import "./style.css";

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
}

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

function linkElement(target: LinkTarget, children: Child[]): HTMLElement {
  if (target.kind === "external") {
    const a = h("a", { href: target.href }, ...children);
    if (target.newTab) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    return a;
  }
  if (target.kind === "anchor") return h("a", { href: `#md-${target.id}` }, ...children);
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
    return h(`h${level}` as "h3", b.slug ? { id: `md-${b.slug}` } : {}, ...inlineNodes(b.children));
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
  return h("div", { class: "md" }, ...blockNodes(render(text, renderOptions(basePath))));
}

function inlineEl(text: string, basePath: string): Node[] {
  return inlineNodes(renderInline(text, renderOptions(basePath)));
}

// ------------------------------------------------------------------- status

function renderStatus(p: Project): void {
  const box = must("status");
  box.replaceChildren();
  const s = p.status;
  if (!s) {
    box.append(h("p", {}, "No STATUS.md was found, so no status is shown."));
    return;
  }
  const field = (testid: string, label: string, text: string | null) =>
    h(
      "div",
      { class: "field" },
      h("h3", {}, label),
      text === null
        ? h("p", { "data-testid": testid, class: "muted" }, "not given")
        : h("div", { "data-testid": testid }, markdownEl(text, "STATUS.md")),
    );
  box.append(
    field("status-phase", "Phase", s.phase),
    field("status-focus", "Current focus", s.currentFocus),
    field("status-next", "Next step", s.nextStep),
    h(
      "p",
      { "data-testid": "status-updated", class: "muted" },
      `Last update: ${s.lastUpdate ?? "not given"}`,
    ),
  );
  const blockers = h("div", { class: "field" }, h("h3", {}, "Blockers"));
  if (s.blockers === null) {
    blockers.append(h("p", { class: "muted", "data-testid": "blockers-missing" }, "not given"));
  } else {
    if (s.none) {
      blockers.append(
        h("p", { "data-testid": "blockers-none" }, "None", s.remark ? ` — ${s.remark}` : ""),
      );
    } else if (s.blockers.length === 0) {
      blockers.append(h("p", { "data-testid": "blockers-empty" }, "No blockers listed"));
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
                "data-testid": "blocker",
                "data-waiting": String(b.waitingOnProductOwner),
                class: b.waitingOnProductOwner ? "waiting" : "",
              },
              ...inlineEl(b.text, "STATUS.md"),
            ),
          ),
        ),
      );
    }
  }
  box.append(blockers);
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

// -------------------------------------------------------------------- tabs

const TABS = ["board", "list", "docs", "report"] as const;
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
  selectTab("board");
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
  };
}

/** After a failed load the previous project's results are not left under the error message. */
function hideResults(): void {
  project = null;
  must("results").hidden = true;
  for (const id of ["status", "board", "list-body", "doc-list", "doc-view", "report-body"]) {
    must(id).replaceChildren();
  }
}

/**
 * Counts the loads started (an address submitted, a folder picked). An
 * answer that arrives after a newer load started is dropped, so the
 * newest request always wins (docs/SPEC.md 3.1).
 */
let latestLoad = 0;

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
  const result = await loadRepo(ref, (url) => fetch(url));
  if (load !== latestLoad) return;
  if (!result.ok) {
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
  );
  show(p);
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
  );
  show(p);
  say(
    p.backlog
      ? ""
      : "No backlog file was found (looked for BACKLOG.md, docs/BACKLOG.md and docs/PRODUCT_BACKLOG.md).",
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
    ),
  );
}

mount();
