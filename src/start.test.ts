/**
 * Tests for src/start.ts: the start page's static texts and the "Private
 * repos" summary (docs/SPEC.md 3.12).
 */
import {
  ACCESS_LINE,
  FONT_NOTICE,
  GUIDE_AFTER,
  GUIDE_DOCS_COMMIT,
  GUIDE_STEPS,
  GUIDE_TITLE,
  type GuidePart,
  migrateSentence,
  NOTICES_LINK,
  partsText,
  TOKEN_NOTE,
  TOKEN_REPLACE_NOTE,
  tokenSummary,
} from "./start";

/** A real-looking fine-grained token: the prefix and ten or more word characters (3.10, 3.12). */
const REAL_LOOKING_TOKEN = /github_pat_[A-Za-z0-9_]{10,}/;

const allParts: GuidePart[] = [...GUIDE_STEPS.flat(), ...GUIDE_AFTER];

describe("the static texts (3.12)", () => {
  test("the access line, word for word", () => {
    expect(ACCESS_LINE).toBe(
      "Public repos open without a token. Private repos need a token for their owner. All access is read-only: vizi never changes anything on GitHub.",
    );
  });

  test("the saved-token note, word for word", () => {
    expect(TOKEN_NOTE).toBe(
      "If you tick Remember, the token is saved in this browser: anyone who can use this browser on this device can open your private repos with it. On a shared computer, leave Remember unticked: the token then lasts only until you close or reload this page. Other factoincognito Pages sites share this page's storage and can reach the tokens, saved or not.",
    );
  });

  test("the one-token-per-owner note, word for word, and no token in it", () => {
    expect(TOKEN_REPLACE_NOTE).toBe(
      "vizi keeps one token per owner. If you add a token for an owner that already has one, the new token replaces the old one.",
    );
    expect(TOKEN_REPLACE_NOTE).not.toMatch(REAL_LOOKING_TOKEN);
  });

  test("the footer's font notice and its link", () => {
    expect(FONT_NOTICE).toBe(
      "Font: Inter, copyright 2016 The Inter Project Authors, SIL Open Font License 1.1.",
    );
    expect(NOTICES_LINK).toEqual({
      label: "Third-party notices",
      href: "https://github.com/factoincognito/vizi/blob/main/THIRD-PARTY-NOTICES.md",
    });
  });

  test("the migration sentence: its bold part, then the masked token in brackets", () => {
    const parts = migrateSentence("github_pat_…1234");
    expect(parts).toEqual([
      { kind: "strong", text: "A token saved by an earlier vizi" },
      { kind: "text", text: " (github_pat_…1234) has no owner yet. Whose repos is it for?" },
    ]);
    expect(partsText(parts)).toBe(
      "A token saved by an earlier vizi (github_pat_…1234) has no owner yet. Whose repos is it for?",
    );
  });
});

describe("tokenSummary (3.12, the summary)", () => {
  const cases: [string[], boolean, boolean, string][] = [
    [[], false, false, "No tokens"],
    [[], true, false, "No tokens"],
    [["acme"], false, false, "1 token: acme"],
    [["acme"], true, false, "1 token"],
    [["acme", "fomo-t", "other"], false, false, "3 tokens: acme, fomo-t, other"],
    [["acme", "fomo-t", "other"], true, false, "3 tokens"],
    [[], false, true, "No tokens; a token saved by an earlier vizi needs its owner"],
    [[], true, true, "No tokens; a token saved by an earlier vizi needs its owner"],
    [["acme"], false, true, "1 token: acme; a token saved by an earlier vizi needs its owner"],
    [["acme"], true, true, "1 token; a token saved by an earlier vizi needs its owner"],
    [
      ["acme", "fomo-t", "other"],
      false,
      true,
      "3 tokens: acme, fomo-t, other; a token saved by an earlier vizi needs its owner",
    ],
    [
      ["acme", "fomo-t", "other"],
      true,
      true,
      "3 tokens; a token saved by an earlier vizi needs its owner",
    ],
  ];
  test.each(cases)("owners %j, opened %j, earlier token %j: %j", (owners, opened, waiting, out) => {
    expect(tokenSummary(owners, opened, waiting)).toBe(out);
  });

  test("keeps the owners in the order of the rows", () => {
    expect(tokenSummary(["zed", "acme"], false, false)).toBe("2 tokens: zed, acme");
  });

  test("names owners only, never a token", () => {
    for (const [owners, opened, waiting] of cases) {
      expect(tokenSummary(owners, opened, waiting)).not.toContain("github_pat_");
    }
  });
});

describe("the token guide (3.12)", () => {
  test("is folded behind its toggle text", () => {
    expect(GUIDE_TITLE).toBe("How do I make a read-only token?");
  });

  test("has six steps, in order, word for word", () => {
    expect(GUIDE_STEPS.map(partsText)).toEqual([
      "On GitHub, click your profile picture in the upper-right corner, then Settings. In the left sidebar, click Developer settings, then, under Personal access tokens, Fine-grained tokens. Click Generate new token. (If GitHub asks, verify your email address first.)",
      'Under Token name, enter a name, for example "vizi". Under Expiration, choose when the token expires.',
      "Under Resource owner, choose the owner of the repos, for example fomo-t. A token reads only that owner's repos, so make one per owner.",
      "Under Repository access, choose Only select repositories, then pick the repos vizi should read under Selected repositories.",
      "Under Permissions, give the repository permission Contents read access, not write. Leave everything else as it is: GitHub adds Metadata read access by itself.",
      "Click Generate token, copy the token, and paste it above, with its owner.",
    ]);
  });

  test("the paragraph after the list, word for word", () => {
    expect(partsText(GUIDE_AFTER)).toBe(
      "If the owner is an organisation that requires approval of fine-grained tokens, you can enter a justification below Resource owner. The token is then pending, and reads only public repos, until an organisation administrator approves it. A token made by an owner of the organisation is approved at once.",
    );
  });

  const LABELS = [
    "Settings",
    "Developer settings",
    "Personal access tokens",
    "Fine-grained tokens",
    "Generate new token",
    "Token name",
    "Expiration",
    "Resource owner",
    "Repository access",
    "Only select repositories",
    "Selected repositories",
    "Permissions",
    "Contents",
    "Metadata",
    "Generate token",
  ];

  test("every bold part is one of GitHub's labels, and each label is bold somewhere", () => {
    const bold = allParts.filter((p) => p.kind === "strong").map((p) => p.text);
    for (const b of bold) expect(LABELS).toContain(b);
    for (const label of LABELS) expect(bold).toContain(label);
  });

  test("says nothing of classic tokens, and no bold part reads Read-only", () => {
    const text = allParts.map((p) => p.text).join("");
    expect(text.toLowerCase()).not.toContain("classic");
    for (const p of allParts) {
      if (p.kind === "strong") expect(p.text.toLowerCase()).not.toBe("read-only");
    }
  });

  test("no part holds a real-looking token", () => {
    for (const text of [
      ACCESS_LINE,
      TOKEN_NOTE,
      GUIDE_TITLE,
      FONT_NOTICE,
      ...allParts.map((p) => p.text),
    ]) {
      expect(text).not.toMatch(REAL_LOOKING_TOKEN);
    }
  });

  test("records the github/docs commit it was checked against", () => {
    expect(GUIDE_DOCS_COMMIT).toBe("e44c283a7f901f63aead1ea13cf9062956706e24");
  });
});
