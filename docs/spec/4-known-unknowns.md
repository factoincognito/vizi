## 4. Known unknowns

Each is settled in the backlog item that meets it. Items 1 to 6 were
PBI-1.2's; their outcome after it (PR #9):

1. **Removed (PBI-1.14).** It was about the browser's folder picker
   and a folder input on a page opened from disk. The page has no folder
   input from PBI-1.14 (item 9 of "What is decided"), so there is
   nothing to settle. The numbers of the items stay as they are.
2. **Open; PBI-1.4.** Whether requests to GitHub work from a page opened
   from disk in a real browser. With GitHub's answers stubbed, opening
   an address works on the built page opened from disk (browser test "works on a
   page opened from disk (file://)", headless Chromium); the stub stands
   in for GitHub's CORS answer, so real GitHub was not tried.
3. **Open; PBI-1.4.** GitHub's anonymous rate limit as a browser sees
   it. One load makes one or two `api.github.com` requests (3.1,
   requests 1 and 2) and up to three to `raw.githubusercontent.com`, with
   one request 3 more per included file, at most five a load (3.15, from
   PBI-1.34), and each "Show status" of the umbrella view one more (3.9);
   from PBI-1.19
   the opening guide's reads add two to four per owner, once per page
   visit when its list is read in full, and two to four on each blur
   with an owner and a repo (3.1, "Guided opening", which also quotes
   GitHub's documented limit of 60 anonymous requests per hour).
   The checks in 3.1 ran through a proxy that appears to add
   credentials, so they do not show the anonymous limit.
4. **Open; PBI-1.4.** What an anonymous request for a private repo gets
   back. The page shows its 404 message (3.1) for a 404 on request 1
   or 2, and any other status as that status (3.1).
5. **Settled (PBI-1.2, tests added in PBI-1.5).** What the page does
   with a truncated file list is in 3.1, "As built". Tested:
   - the message under the address names the truncation (browser test
     "tells that the file list was truncated");
   - the report holds one Info item for it, the documentation list
     holds only the files GitHub sent, and a relative link still goes to
     github.com (browser test "a truncated file list: the report says
     so, and the documentation list and code-span links hold only the
     files GitHub sent");
   - a complete file list adds no such item (browser test "a complete
     file list adds no truncation note to the report");
   - `loadRepo` passes GitHub's `truncated` flag through (unit test in
     `src/github.test.ts`).

   That a code-span link is made only for a file GitHub sent is tested
   by the same browser test, which waits for the rendered relative link
   before it checks that there is no such link (PBI-1.6, #141). When
   GitHub truncates a list was not checked.
6. **Settled (PBI-1.2).** A synthetic backlog of 1500 lines (the
   template's `docs/BACKLOG.md` has about as many) loads by address,
   with GitHub stubbed, and shows the board and over 400 list rows in
   under 8 seconds (browser test "a synthetic file of 1500 lines loads
   and renders in a few seconds", headless Chromium, at phone and
   desktop width, light and dark).
7. Settled 2026-11-04: HTML comments in a backlog file are dropped
   before reading (`docs/BACKLOG-FORMAT.md`, R9).
8. Not decided: whether the template's own wording of the "no external
   requests" rule changes as well (2.3). That is a template change,
   through the template's review flow.

Items 9 to 15 are PBI-1.8's (3.8). The product owner tried a
fine-grained token against real GitHub on 2026-11-11, in Edge (not
Chrome), on the published page, with the private repo
`factoincognito/product-office`; items 9 to 12 record what that try
showed. Item 15 was tried on 2026-11-16, also in Edge. Items 13 and 14
were not part of either try.

9. **Settled for the published page in Edge (PBI-1.8, 2026-11-11); open
   for a page opened from disk and for other browsers, PBI-1.4.** CORS
   with an `Authorization` header: with a token saved for the owner
   `factoincognito`, the published page,
   `https://factoincognito.github.io/vizi/`, opened the private repo
   `factoincognito/product-office` (the board and the list were shown), so
   GitHub answered the requests that carry the header. The preflight
   itself was not looked at in the browser's network tab. A preflight sent
   from this session's proxy got 405 from `api.github.com` and 403 from
   `raw.githubusercontent.com`, which proved nothing about a browser.
10. **Settled for a private backlog (PBI-1.8, 2026-11-11); the file-size
    limit is open, PBI-1.4.** Whether the contents API with the raw media
    type reads a private file with a fine-grained token: it did, for the
    backlog of `factoincognito/product-office`, which the page showed
    (the board and the list). Up to what file size it works was not
    tried.
11. **The 401 likely, not shown (PBI-1.8, 2026-11-11); 404 and 403
    open, PBI-1.4.** Whether GitHub answers 401 for an expired or
    revoked fine-grained token, 404 for a repo outside its selection,
    and 403 for a missing permission, as 3.8 expects. The product owner
    deleted the token in GitHub while vizi still held it and then opened
    the repo: the page said that the token was forgotten (his report;
    the exact text was not recorded). In the code, an answer to a
    request makes the page forget the token only through a 401
    (`src/github.ts`, the `token-refused` failure). 3.8 also has the
    page forget a token on "Forget", on "Forget all" and on another vizi
    tab's `storage` event; his report names none of these, but the
    message text, which would tell the 401 message ("GitHub refused the
    token for …") from them, was not recorded. So a 401 for a deleted
    token is likely, not shown. An expired token was not tried, nor a
    repo outside the token's selection, nor a missing permission.
12. **Partly settled (PBI-1.8, 2026-11-11); the case of a policy that
    requires approval is open, PBI-1.4.** Whether an organisation's
    policy, such as requiring approval of fine-grained tokens, stops a
    token from reading that organisation's private repos, and what
    GitHub answers then. For the token made for the `factoincognito`
    organisation's repo, GitHub asked for no approval and the token read
    the private repo at once. That does not show that the organisation
    has no such policy: GitHub's documentation, quoted in 3.12, says a
    token made by an owner of the organisation is approved at once, and
    whether the product owner is one was not recorded. What GitHub
    answers under a policy that requires approval was not seen.
13. **Open; PBI-1.4.** Whether `localStorage` keeps the token on a page
    opened from disk (`file://`); browsers treat that origin
    differently.
14. **Settled for Chromium (PBI-1.8, PR #30); open for other
    browsers, PBI-1.4.** The build writes the hashes of the inlined
    script and style into the `<meta>` policy (2.3, as built), and the
    browser tests of `e2e/csp.e2e.ts` load the built page in headless
    Chromium with no violation and no console error, also when opened
    from disk, and see a script added at run time, a style attribute, a
    request to another host, an image from another host and a form post
    all blocked. Whether every other browser the page targets applies
    the policy the same way was not checked.
15. **Tried in Edge (PBI-1.8, 2026-11-16), not settled; PBI-1.4.**
    Whether a browser's password manager offers to save the
    token from a password field outside any `<form>`, and so may keep
    it, perhaps synced to an account. Browsers often ignore
    `autocomplete="off"` on password fields. On 2026-11-16 the product
    owner pressed "Add" with a value in the token field, in Edge on the
    published page, and Edge showed no "Save password" popup. His
    screenshot of Edge's password settings shows "Ask to save passwords
    and passkeys" on, and "Declined sites and apps" holds one site, not
    `factoincognito.github.io`. Whether the value was a real token or a
    made-up one was not recorded in his report. Two gaps keep it from
    being settled: whether "Add" accepted the value (it matches the
    token rule of 3.8, the field is cleared and a masked row appears) was
    not recorded, and a value that breaks the rule is refused with the
    field keeping its text, which is not the path on which a password
    manager offers to save; and whether Edge offered later, for example
    on a reload or on leaving the page, was not recorded. The try of
    2026-11-11 did not record whether Edge made such an offer. No other
    browser was tried.

Also seen in the try of 2026-11-11 (not items of this section): the token was made
in GitHub without trouble; opening the private repo without a token
failed; pasting a second token for the same owner replaced the first
one (3.8: one token per owner); and the product owner can change an
existing fine-grained token's **Repository access** (the **Selected
repositories**) in GitHub, so a new private repo of the same owner does
not need a new token. GitHub's page "Managing your personal access
tokens", read on 2026-11-11, does not say whether this can be done, so
the last point rests on his report.

Item 16 is PBI-1.9's (3.9):

16. **Checked by hand, not by a test.** The product office's own
    `PROJECTS.md` was read once, on 2026-11-04, against P1 to P7: it
    holds headings, pointers of both kinds and text, and no line that
    P5 would report. It cannot be a test fixture: that file is private
    and is never copied into this public repo.

Items 17 and 18 are PBI-1.11's (3.8):

17. **Open; PBI-1.11.** Whether GitHub has a request that tells which
    owner a fine-grained token's repos belong to. 3.8 does not rely on
    one: the user names the owner. Not checked.
18. **Open; PBI-1.11.** That GitHub treats owner names without regard
    to case, so that vizi may compare them in lower case. Not checked
    here.

Item 19 is PBI-1.13's (3.10):

19. **Settled for the documentation (PBI-1.16, 2026-11-04); the live
    page not checked.** The help view's token step names the permission
    "Contents" as read-only, as 3.8 expects it. Checked against the
    source of GitHub's documentation, `github/docs` at
    `e44c283a7f901f63aead1ea13cf9062956706e24`, "Managing your personal
    access tokens", section "Creating a fine-grained personal access
    token" (3.12, "The guide, checked against GitHub's documentation"):
    the repository permission's display name is "Contents", with the
    access levels `read` and `write`, and GitHub adds `metadata:read`
    to a token given `contents=read`; the menu path and the labels the
    token guide of 3.12 uses are the documentation's. Not checked: the
    label GitHub's token page shows for the read level (the
    documentation does not give it, so the guide does not use one), and
    whether the live page matches the documentation. Items 10 and 11
    record what the product owner's first try against real GitHub, on
    2026-11-11, showed of what GitHub answers to such a token. The help text and the guide are corrected if GitHub's
    page says otherwise.

Items 20 to 23 are PBI-1.16's (3.12):

20. **Settled (PBI-1.16, 2026-11-04).** `vite-plugin-singlefile` 2.3.3,
    with its default settings, inlines the three font files (14336,
    14712 and 14600 bytes) as `data:font/woff2;base64,` URLs, so
    `vite.config.mts` does not change. `e2e/subpath.e2e.ts` checks that
    the built page has exactly three such `url()`s and no other.
21. **Settled (PBI-1.16, 2026-11-04).** Playwright (1.63.0, Chromium)
    does not report the page's inlined `data:` fonts as requests: the
    load check of `e2e/smoke.e2e.ts` (the page requests only its own
    document) and the guard of `e2e/guard.ts` pass unchanged while the
    three faces load (`e2e/start.e2e.ts`, "the font loaded").
22. **Settled (PBI-1.16, 2026-11-04).** The built page holds Vite's own
    module-preload polyfill (the `relList` and `modulepreload` check
    with a `MutationObserver` on the document, at the start of the
    inline script). It is Vite 8.3.1's code (`node_modules/vite`,
    licence MIT, "Copyright (c) 2019-present, VoidZero Inc. and Vite
    contributors"), so `THIRD-PARTY-NOTICES.md`, which existed already
    (PR #68), has an entry for it with the copyright and the licence
    text, and the page's footer links to that file. Turning the
    polyfill off in `vite.config.mts` was not chosen: it would change
    the build for a notice the footer already carries.
23. **Open; PBI-1.16.** Whether `v4.1` is the release GitHub marks as
    rsms/inter's latest. It is the highest version tag (read through
    git on 2026-11-04); the releases API was refused to this session.
    The licence that counts is the one on the commit used (policy A.1),
    and it was read there, so this changes nothing unless a newer
    release is wanted.

Items 24 to 27 are PBI-1.15's (3.13):

24. **Open; PBI-1.15.** In which order GitHub's "List branches" gives
    the branches, so which 300 the cap keeps for a repo with more. The
    documentation read (3.13) does not say. Not checked.
25. **Open; PBI-1.15.** Whether `api.github.com` exposes the `link`
    header to a page. 3.13 does not rely on it: it counts the names on
    a page. Not checked.
26. **Open; PBI-1.15.** Whether a browser fires a closed select's
    change event at each arrow key. 3.13 opens a branch only with "Open
    branch", so the picker does not depend on it. Not checked.

27. **Open; PBI-1.15.** The alternative to disabling branch names that
    hold `#` or `%` (3.13, "Names the page cannot open"): encode each
    `/`-separated segment of the branch in the anonymous request 3 and
    in `blobUrl`, as request 2 and the contents API already encode it,
    so every name git allows can be opened. Whether
    raw.githubusercontent.com accepts encoded segments was not checked.
    Until it is, the names stay disabled.

Item 18 gains a point from 3.13: the documentation of "List branches"
(`github/docs` at `e44c283`) says of `owner` and `repo` "The name is not
case sensitive." That is GitHub's word for that one request, not a
check of the others.

Item 28 is PBI-1.12's (3.14):

28. **Open; PBI-1.12.** GitHub's own length limits for owner and repo
    names. 3.14 allows at most 100 characters for each and at most 255
    for a branch; those are Clead's limits, generous for the names seen,
    not GitHub's, which were not checked.

Items 29 to 31 are PBI-1.19's (3.1, "Guided opening"):

29. **Open; PBI-1.19.** Which repos GitHub lists for a fine-grained
    token: whether `/user/repos` gives the repos the token covers (or
    more, or fewer), and whether `/orgs/<org>/repos` with such a token
    shows the private repos it covers. The documentation read
    (`github/docs` at `58b7b56`) gives the permission (Metadata read)
    but not the set. Settled when the product owner first tries it
    against real GitHub.
30. **Open; PBI-1.19.** How each target browser shows a `<datalist>`
    on a text field, with which keys, iOS Safari included, and what
    Enter does while its suggestions are shown; and whether a browser
    shows a datalist's suggestions differently on a field with
    `autocomplete="off"`, which the field keeps (3.1, "Guided opening").
    Not checked; no browser behaviour is claimed here. Whether the
    suggestions are shown is browser chrome, outside the page's DOM, so
    the build's browser tests check only the `list` attribute and the
    `<option>` values (3.1); trying it in the browsers is PBI-1.4's.
    Also not checked: whether, on a phone, the select shown on the
    field's blur (at once for an owner whose list is kept) can move
    "Open" under a tap that is landing on it. The message line
    `#guide-message` does not move anything on a blur with a one-line
    message: it takes its one line's height on the `input`, or the
    page's own write of the field, that makes the field's text guided,
    and gives it back only on one that makes it not guided (3.1), so the
    idle start page keeps 3.12's spacing; a longer outcome may move
    content when it arrives. The build's browser tests
    check, on all four projects, that a click on a token's "Forget" and
    on the "Private repos" toggle, made with an owner typed in the field
    and no blur before it, registers, and that the element is where it
    was before the blur; and that the row-to-access-line gap is 3.12's
    with an empty field and with a full address (Clead, 2026-11-05,
    #85). The select's own appearance above
    "Open" on a phone stays as said above.
31. **Open; PBI-1.19.** Whether `api.github.com` answers
    `/users/<owner>` for an organisation with `"type": "Organization"`
    as the documentation's schema suggests; the documentation's example
    is a user. Not checked.

Item 32 is 3.15's:

32. **Open; 3.15.** That an include line,
    `<!-- vizi:include <path> -->`, is not shown where GitHub renders a
    Markdown file, as 3.15's point 1 says. Not checked: GitHub's
    Markdown API was refused to this session (2026-11-06, "sessions are
    bound to their configured repositories"). It is checked at the
    build, or by the product owner on any file that holds a comment,
    such as the template's `STATUS.md`, which starts with one
    (`docs/BACKLOG-FORMAT.md`, S1).
