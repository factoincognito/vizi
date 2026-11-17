## What is decided, and what is Clead's design

**Decided by the product owner.** These decisions, and nothing else:

1. His decisions of 2026-11-03, listed in section 1 (also in
   `memory/project.md`), as changed by items 3, 4 and 9.
2. His intent approval of 2026-11-04, given in chat and recorded as a
   comment on PR #3: "I approve the intent of the vizi spec as
   summarised: inputs, board, list, status, documentation links, report
   tab, build and the web pack rule reading". The summary he approved:

   > inputs (a local project folder, or a public GitHub repo address;
   > the backlog file looked for as `BACKLOG.md`, `docs/BACKLOG.md`,
   > `docs/PRODUCT_BACKLOG.md`; `STATUS.md` read); a board with one
   > column per marker (NOW, NEXT, BLOCKED, LATER, IDEA, then DONE and
   > SUPERSEDED folded); a list under the backlog's own headings with a
   > marker filter and search; the four `STATUS.md` fields above the
   > board, blockers waiting on the product owner highlighted;
   > documentation links (README, `docs/`, file paths named in
   > entries); a report tab of what could not be read, with line
   > numbers; one self-contained page from the web pack, tests with
   > synthetic data and no network; the web pack's no-external-requests
   > rule read as covering what the page loads at startup, so fetching a
   > backlog after an address is typed is allowed.
3. His decision of 2026-11-04 (08:56, "apyr", on Clead's
   recommendation): vizi is published on GitHub Pages at
   `https://factoincognito.github.io/vizi/`, built and deployed by a
   workflow on every merge to `main` (PBI-1.7). It replaces "the first
   version is opened locally, not deployed" of 2026-11-03 (section 1).
   His intent approval of this spec change is recorded as a comment on
   PR #23.
4. His intent approval of 2026-11-04 (09:27, in chat, "saved token
   apyr") of PBI-1.8: private repos by address, with a fine-grained,
   read-only GitHub token, limited to chosen repos and with an expiry
   the product owner chooses, pasted into vizi once per browser, saved
   in the browser's storage behind a "Remember the token" box, removed
   with a "Forget the token" button, and sent only to GitHub. It
   replaces "no token; private repos are not read by address" of
   2026-11-03 (section 1). It is recorded as a comment on PR #26. How
   vizi does it is 3.8.
5. His decision of 2026-11-04 (10:22, in chat, "apyr", on Clead's
   recommendation; recorded in the product office's decision record,
   merge `b43c811`) on the defence for the shared origin (3.8, "The
   shared origin"): no repo named `factoincognito.github.io` is
   created, and GitHub Pages is switched on only for factoincognito
   repos he trusts. A domain of vizi's own stays the stronger option for
   later, if more sites go on factoincognito Pages.
6. His intent approval of 2026-11-04 (11:06, in chat) of PBI-1.9, the
   umbrella view: "I approve the intent of the vizi umbrella view as
   described: the Umbrella tab, the tree from PROJECTS.md, and the links
   per project". What was described: when vizi opens a project, from a
   folder or by address (a private one with the saved token; the folder
   is replaced by item 9), that has a
   `PROJECTS.md` at its root, an "Umbrella" tab shows the file's headings
   as a tree with the projects under them. A repo pointer
   (`owner/repo`) opens in vizi by its address (a private one needs the
   token to cover that repo) and also links to the repo on GitHub. A
   `projects/<name>/` pointer shows that folder's `STATUS.md` in vizi.
   The tree is drawn from the file each time; nothing is stored or
   copied. Each project's status in the tree itself is not included.
   The approval is recorded as a comment on PR #33. How vizi does it is
   3.9.
7. His intent approval of 2026-11-04 (11:57, in chat, "apyr") of
   PBI-1.11: vizi holds one token per owner (for example factoincognito
   and fomo-t), picked automatically by the owner in the address
   opened, the umbrella view's "Open in vizi" included; each token has
   its own "Remember" box and "Forget", plus a "Forget all"; otherwise
   as PBI-1.8 was approved (item 4): read-only, sent only to GitHub,
   never shown. His approval was "apyr", on Clead's proposal, whose
   reason (Clead's note, not the product owner's words) was that a
   fine-grained token belongs to one owner. It changes item 4's one
   token to one per owner. The approval is
   recorded as a comment on PR #40. How vizi does it is 3.8.
8. His intent approval of 2026-11-04 (12:43, in chat, "apyr", on Clead's
   proposal) of PBI-1.13, the help view (recorded as a comment on PR #44,
   and in the PBI-1.13 entry of `docs/BACKLOG.md`): a help view,
   "How to make your project vizi compatible", opened by a link on the
   start page inside the page; short steps with one example each for the
   backlog file's place, how an entry is written and which markers are
   shown, the `STATUS.md` headings, `PROJECTS.md` for an umbrella, and
   opening a private repo with a token or as a folder (the folder is
   replaced by item 9); a link at the end
   to `docs/BACKLOG-FORMAT.md` on GitHub; the text shipped in the page;
   a test that its examples read as stated. How vizi does it is 3.10;
   item 10 adds to it.
9. His decision of 2026-11-04 (15:15, in chat, "apyr"; recorded in the
   product office's `DECISIONS.md`, PR #390, and as PBI-1.14 in
   `docs/BACKLOG.md`): vizi no longer opens a local project folder. It
   opens projects from GitHub only: public ones by address, private ones
   with the saved token (3.8). It replaces point (4) of the decisions of
   2026-11-03 (section 1), "local files; local mode opens a project
   folder", and with it the folder in the inputs of item 2, in the
   umbrella view of item 6 and in the help view of item 8. What the
   code change must remove is in 3.11.
10. His decision of 2026-11-04 (16:13, in chat; recorded in the product
    office's `DECISIONS.md`, PR #393): the help view says early in its
    text that vizi is a read-only tool. It adds to item 8. How vizi does
    it is 3.10.
11. His intent approval of 2026-11-04 (15:48, in chat, "mockups are much
    better" and "go with it", on Clead's recommendation; recorded in the
    product office's `DECISIONS.md`) of PBI-1.16, the start page
    redesign, as shown in Clead's mockup (the Claude design canvas "vizi
    start page redesign", version 1793803575-d7d4): "Open a project from
    GitHub" with the address and Open on one row and the help link in
    the header; the line "Public repos open without a token. Private
    repos need a token for their owner. All access is read-only: vizi
    never changes anything on GitHub."; a folded "Private repos" panel
    with one row per owner (Remember and Forget each), a token saved by
    an earlier vizi as one highlighted row asking for its owner, "Add a
    token" and "Forget all tokens"; one font (Inter) everywhere, built
    into the page; light, dark and phone. With it, his decisions of the
    same day, recorded in the same file: next to the token fields, a
    step-by-step guide on how to make the read-only GitHub token (16:11);
    and, next to adding a token, that a saved token can be used in vizi
    by everyone with access to this browser, and that on a shared
    computer the token is better used only for the page, without saving
    it (16:17 to 16:18). PBI-1.17 is not part of it: his decision of
    17:07 (recorded in the same file, #399), one "Repository" field for
    `owner/repo`, which replaces his prefill decision of 16:36. How vizi
    does it is 3.12; the token behaviour of 3.8 does not change.
12. His intent approval of 2026-11-04 (15:15, in chat, "apyr", on
    Clead's recommendation, after his 15:14 "possibily broaden the
    possibility to load branches from repo"; recorded in the product
    office's `DECISIONS.md`, PR #390, and in the PBI-1.15 entry of
    `docs/BACKLOG.md`) of PBI-1.15, a branch picker: after a repo loads,
    a list of its branches, and picking one opens that branch; the
    `/tree/<branch>` address keeps working. How vizi does it is 3.13.
13. His intent approval of 2026-11-04 (11:59, in chat, "apyr", on
    Clead's recommendation, after his 11:58 request; recorded in the
    product office's `DECISIONS.md`, PR #386, and in the PBI-1.12 entry
    of `docs/BACKLOG.md`) of PBI-1.12, a "Saved repos" quick-access list
    on the start page: a "Save" button adds the open address, clicking
    an entry loads it (with the right token if private), an "×" removes
    it; kept in the browser, addresses only, never tokens; other
    factoincognito Pages sites (trusted, under the Pages rule) could
    read the repo names, not their contents. How vizi does it is 3.14.
14. His decision of 2026-11-04 (17:07, in chat, "Apyr", on Clead's
    recommendation, after his 17:04 "wouldn't it be better to just have
    a GitHub repo name field where the user puts <owner>/<reponame>";
    recorded in the product office's `DECISIONS.md`, PR #399, and as
    PBI-1.17 in `docs/BACKLOG.md`): the address field becomes one
    "Repository" field where the user types `owner/repo` (for example
    `fomo-t/fomo-f`); a full GitHub address pasted into it, with or
    without `/tree/<branch>`, still works, and the token is still picked
    by the owner. It replaces his decision of 16:36 to prefill
    `https://github.com/`. He put it in the unattended run of that night
    at 19:18 ("All"; recorded in the product office's `DECISIONS.md`,
    and in this repo's backlog and `docs/NEXT_SESSION.md` by PR #64),
    built after PBI-1.14 and before PBI-1.16. How vizi does it is 3.1,
    "The Repository field". His decision of 21:01 the same day
    (recorded in the product office's `DECISIONS.md`) adds to it: the
    field's hint reads `<owner>/<repo>`, not `owner/repo`, so it shows
    two parts to fill in, and so do the field's messages that show the
    form.
15. His decisions of 2026-11-04 (22:21, in chat, "add help text in the
    umbrella view to expalin what an umbrella is"; and 22:24, "also
    explain \"pre-projects\", i.e those projects that are in an early
    stage and therefore does not have a repo of their own but lives in
    the umbrella repo for now"; recorded in the product office's
    `DECISIONS.md`, PRs #430 and #432, and as PBI-1.18 in
    `docs/BACKLOG.md`): the umbrella view gets a help text that explains
    what an umbrella is, and what pre-projects are: projects at an early
    stage with no repo of their own yet, living in the umbrella repo for
    now (the `projects/<name>/` pointers). The wording is Clead's. How
    vizi does it is 3.9, "The help text (PBI-1.18)".
16. His decision of 2026-11-04 (22:47, in chat, "apyr. under the
    condition you don't flip out if i want to change it 5 minutes
    later", on Clead's recommendation, after his ideas of 22:28 to
    22:44; recorded in the product office's `DECISIONS.md`, PR #435,
    and as PBI-1.19 in `docs/BACKLOG.md`): guided opening from the
    Repository field, in that night's unattended run after PBI-1.15.
    One field takes `<owner>` or `<owner>/<repo>`; while typing after
    `<owner>/`, a list of that owner's repos (private ones the owner's
    token can see); when the field loses focus, an owner alone shows the
    repo list and a repo shows its branches with the repo's own default
    branch preselected; a pasted full address still opens directly. The
    picker of PBI-1.15 on a loaded project stays and its branch request
    is reused. Open to change after he tries it. Simplified by his
    decision of 2026-11-05 (07:41, in chat, "apyr" to Clead's
    recommendation of 07:35; recorded in the product office's
    `DECISIONS.md`, PR #444, and in PBI-1.19 in `docs/BACKLOG.md`): no
    caching of repo or branch lists beyond the owner's repo list for one
    page visit. How vizi does it is 3.1, "Guided opening".
17. His intent approval of 2026-11-07 (01:05, in chat, "Po-105 apyr",
    on Clead's proposals; recorded in the product office's
    `DECISIONS.md`, PR #576, and as a comment on PR #93) of the include
    keyword (product-office PO-105): a backlog file can name another file
    of the same repo and branch with `<!-- vizi:include <path> -->`, a
    path relative to it, and vizi reads that file too, one level only,
    only from the backlog file; included entries show on the board and in
    the list like the file's own, and only they name their file; they
    stand where the include line stands; a failed read of an included
    file lets the load go on (only a 401 fails it), and the page says
    what is missing; at most five included
    files a load; the help view does not change; and an include line is
    the one exception to "content never makes a request of its own" (2.3,
    3.7 item 5, `RULES.md` L § 5 (1)). How vizi does it is 3.15.
18. His intent approval of 2026-11-09 (15:41, in chat, "I approve the
    intent of the vizi ?repo= link spec as written, points 1 to 5", on
    Clead's proposal of 15:36 after his request of 15:34, the form left
    to Clead; recorded in the product office's `DECISIONS.md`, PR #696,
    and as PBI-1.35 in `docs/BACKLOG.md`): the repository to open can be
    given in the page's address as `?repo=<owner>/<repo>`, read exactly
    as the Repository field reads typed text; at startup the page puts
    the value in the field and opens it as if "Open" was pressed, an
    owner alone showing that owner's repo list; without it nothing
    changes; the page still writes no address of its own; other
    parameters are ignored, and of several `repo` parameters the first is
    used; the help view gets one line with the link form; a link can open
    a private repo with a token saved in that browser, with no new kind of
    request and no change to the Content-Security-Policy. How vizi does it
    is 3.16.

19. His request of 2026-11-11 (12:20, in chat, "Add text clarifying that
    only one token per owner is allowed. When uploading a token for an
    owner who already has a token the new one will overwrite the old
    one", on the condition that his text is correct, which 3.8 and his
    try of the same day confirm; recorded in `memory/decisions.md` and
    as PBI-1.38 in `docs/BACKLOG.md`): the page says that vizi keeps one
    token per owner and that a token added for an owner that already has
    one replaces the old one. The wording and the place (under the "Add
    a token" heading) are Clead's; see 3.12, "The 'Private repos'
    panel".

**Clead's design (the HOW), within the approved intent.** Everything else
in sections 2 and 3, and the rules in `docs/BACKLOG-FORMAT.md`. It is
Clead's call, not a question for the product owner, and it does not
block building. It changes through a reviewed PR like any spec change.
Points that come from the approved summary are marked **(approved)**.

**Not decided.** Marked "not decided" where they appear: a lint mode
beyond the page's report (section 1), and a change to the template's own
wording of the external-requests rule (section 4, item 8).

---

