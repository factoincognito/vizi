/**
 * The start page's static texts and the "Private repos" summary
 * (docs/SPEC.md 3.12), as data and one pure function. The page builds the
 * start page from them with calls that set text; nothing here is HTML or
 * Markdown, and bold parts are explicit `strong` parts. No text here holds
 * a token: the masked form is passed in by the page.
 */

/** A piece of text: plain, or bold (shown in `<strong>`). */
export interface GuidePart {
  kind: "text" | "strong";
  text: string;
}

const t = (text: string): GuidePart => ({ kind: "text", text });
const b = (text: string): GuidePart => ({ kind: "strong", text });

/** A list of parts as one string, as it reads. */
export function partsText(parts: readonly GuidePart[]): string {
  return parts.map((p) => p.text).join("");
}

/** Under the address row (approved copy, 3.12). */
export const ACCESS_LINE =
  "Public repos open without a token. Private repos need a token for their owner. All access is read-only: vizi never changes anything on GitHub.";

/** The saved-token note under "Add a token" (Clead's draft within the decisions of 16:17 to 16:18, and 3.8, "The shared origin"). */
export const TOKEN_NOTE =
  "If you tick Remember, the token is saved in this browser: anyone who can use this browser on this device can open your private repos with it. On a shared computer, leave Remember unticked: the token then lasts only until you close or reload this page. Other factoincognito Pages sites share this page's storage and can reach the tokens, saved or not.";

/** The note under the "Add a token" heading: one token per owner, a new one replaces the old (the product owner, 2026-11-11 12:20; 3.8, 3.12). */
export const TOKEN_REPLACE_NOTE =
  "Vizi keeps one token per owner. If you add a token for an owner that already has one, the new token replaces the old one.";

/** The token guide's toggle. */
export const GUIDE_TITLE = "How do I make a read-only token?";

/**
 * The token guide's six steps (Clead's draft within the decision of 16:11).
 * The bold parts are GitHub's labels, as its documentation writes them at
 * GUIDE_DOCS_COMMIT.
 */
export const GUIDE_STEPS: readonly (readonly GuidePart[])[] = [
  [
    t("On GitHub, click your profile picture in the upper-right corner, then "),
    b("Settings"),
    t(". In the left sidebar, click "),
    b("Developer settings"),
    t(", then, under "),
    b("Personal access tokens"),
    t(", "),
    b("Fine-grained tokens"),
    t(". Click "),
    b("Generate new token"),
    t(". (If GitHub asks, verify your email address first.)"),
  ],
  [
    t("Under "),
    b("Token name"),
    t(', enter a name, for example "vizi". Under '),
    b("Expiration"),
    t(", choose when the token expires."),
  ],
  [
    t("Under "),
    b("Resource owner"),
    t(
      ", choose the owner of the repos, for example fomo-t. A token reads only that owner's repos, so make one per owner.",
    ),
  ],
  [
    t("Under "),
    b("Repository access"),
    t(", choose "),
    b("Only select repositories"),
    t(", then pick the repos vizi should read under "),
    b("Selected repositories"),
    t("."),
  ],
  [
    t("Under "),
    b("Permissions"),
    t(", give the repository permission "),
    b("Contents"),
    t(" read access, not write. Leave everything else as it is: GitHub adds "),
    b("Metadata"),
    t(" read access by itself."),
  ],
  [t("Click "), b("Generate token"), t(", copy the token, and paste it above, with its owner.")],
];

/** The paragraph after the guide's list. */
export const GUIDE_AFTER: readonly GuidePart[] = [
  t(
    "If the owner is an organisation that requires approval of fine-grained tokens, you can enter a justification below ",
  ),
  b("Resource owner"),
  t(
    ". The token is then pending, and reads only public repos, until an organisation administrator approves it. A token made by an owner of the organisation is approved at once.",
  ),
];

/** The github/docs commit the guide was checked against (3.12, "The guide, checked against GitHub's documentation"). */
export const GUIDE_DOCS_COMMIT = "e44c283a7f901f63aead1ea13cf9062956706e24";

/** The footer's font notice, before its link (3.12, "The notice in the page"). */
export const FONT_NOTICE =
  "Font: Inter, copyright 2016 The Inter Project Authors, SIL Open Font License 1.1.";

/** The footer's link to the notices, opened in a new tab. */
export const NOTICES_LINK = {
  label: "Third-party notices",
  href: "https://github.com/factoincognito/vizi/blob/main/THIRD-PARTY-NOTICES.md",
} as const;

/** The sentence of the block for a token saved by an earlier vizi; `masked` is the token's masked form (3.8). */
export function migrateSentence(masked: string): GuidePart[] {
  return [
    b("A token saved by an earlier vizi"),
    t(` (${masked}) has no owner yet. Whose repos is it for?`),
  ];
}

/**
 * The summary on the "Private repos" toggle (3.12, "The summary"): owners
 * only, never a token. Folded it names the owners, in the rows' order;
 * opened it counts them, as the rows show the owners.
 */
export function tokenSummary(
  owners: readonly string[],
  opened: boolean,
  migrationWaiting: boolean,
): string {
  const n = owners.length;
  let text = n === 0 ? "No tokens" : `${n} ${n === 1 ? "token" : "tokens"}`;
  if (n > 0 && !opened) text += `: ${owners.join(", ")}`;
  if (migrationWaiting) text += "; a token saved by an earlier vizi needs its owner";
  return text;
}
