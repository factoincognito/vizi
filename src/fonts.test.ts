/// <reference types="node" />
/**
 * Tests for the bundled Inter subset (docs/SPEC.md 3.12, "The font"): each
 * file is a WOFF2 under 20 KB whose `name` table keeps the copyright and the
 * licence, its SHA-256 is the one recorded in THIRD-PARTY-NOTICES.md, and
 * the licence text is in the repo. The WOFF2 is read by hand here (table
 * directory, then the Brotli stream with Node's own zlib), so no font
 * library is needed.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { brotliDecompressSync } from "node:zlib";

const ROOT = join(__dirname, "..");
const FILES = ["inter-latin-400.woff2", "inter-latin-600.woff2", "inter-latin-700.woff2"];
const read = (name: string) => readFileSync(join(ROOT, "src", "fonts", name));

/** The WOFF2 known table tags, by their index in the table directory's flags (W3C WOFF2, 5.2). */
// biome-ignore format: twelve tags a line keeps the index easy to count
const KNOWN_TAGS = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca",
  "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea",
  "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL",
  "SVG ", "sbix", "acnt", "avar", "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar",
  "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat",
  "Gloc", "Feat", "Sill",
];

interface Table {
  tag: string;
  /** Bytes of the table in the decompressed stream (transformed or not). */
  length: number;
}

/** Reads a UIntBase128 (W3C WOFF2, 4.1) at `at`; returns the value and the next offset. */
function base128(bytes: Buffer, at: number): [number, number] {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const b = bytes[at + i];
    if (b === undefined) throw new Error("UIntBase128 runs past the end");
    value = value * 128 + (b & 0x7f);
    if ((b & 0x80) === 0) return [value, at + i + 1];
  }
  throw new Error("UIntBase128 longer than 5 bytes");
}

/** The table directory and the decompressed table data of a WOFF2 file. */
function readWoff2(bytes: Buffer): { tables: Table[]; data: Buffer } {
  const numTables = bytes.readUInt16BE(12);
  const totalCompressedSize = bytes.readUInt32BE(20);
  let at = 48;
  const tables: Table[] = [];
  for (let i = 0; i < numTables; i++) {
    const flags = bytes.readUInt8(at);
    at += 1;
    let tag: string;
    if ((flags & 0x3f) === 0x3f) {
      tag = bytes.toString("latin1", at, at + 4);
      at += 4;
    } else {
      tag = KNOWN_TAGS[flags & 0x3f] ?? "?";
    }
    const [origLength, next] = base128(bytes, at);
    at = next;
    const transform = (flags >> 6) & 3;
    // glyf and loca are transformed at version 0; every other table at any version but 0.
    const transformed = tag === "glyf" || tag === "loca" ? transform === 0 : transform !== 0;
    let length = origLength;
    if (transformed) {
      const [transformLength, after] = base128(bytes, at);
      length = transformLength;
      at = after;
    }
    tables.push({ tag, length });
  }
  const data = brotliDecompressSync(bytes.subarray(at, at + totalCompressedSize));
  return { tables, data };
}

/** Every string of a `name` table, decoded (UTF-16BE for Windows and Unicode, Latin-1 for Mac). */
function nameStrings(name: Buffer): string[] {
  const count = name.readUInt16BE(2);
  const stringOffset = name.readUInt16BE(4);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const rec = 6 + i * 12;
    const platform = name.readUInt16BE(rec);
    const length = name.readUInt16BE(rec + 8);
    const offset = name.readUInt16BE(rec + 10);
    const raw = name.subarray(stringOffset + offset, stringOffset + offset + length);
    if (platform === 1) out.push(raw.toString("latin1"));
    else out.push(Buffer.from(raw).swap16().toString("utf16le"));
  }
  return out;
}

describe.each(FILES)("%s (3.12, the font)", (file) => {
  const bytes = read(file);

  test("starts with the WOFF2 signature and is under 20 KB", () => {
    expect(bytes.toString("latin1", 0, 4)).toBe("wOF2");
    expect(bytes.length).toBeLessThan(20 * 1024);
  });

  test("its table directory accounts for the whole decompressed stream, and it has a name table", () => {
    const { tables, data } = readWoff2(bytes);
    expect(tables.reduce((n, t) => n + t.length, 0)).toBe(data.length);
    expect(tables.map((t) => t.tag)).toContain("name");
  });

  test("its name table keeps the copyright and the licence", () => {
    const { tables, data } = readWoff2(bytes);
    let offset = 0;
    let name: Buffer | null = null;
    for (const t of tables) {
      if (t.tag === "name") name = data.subarray(offset, offset + t.length);
      offset += t.length;
    }
    const strings = nameStrings(name ?? Buffer.alloc(0)).join("\n");
    expect(strings).toContain("Copyright 2016 The Inter Project Authors");
    expect(strings).toContain("SIL Open Font License, Version 1.1");
  });

  test("its SHA-256 is the one recorded in THIRD-PARTY-NOTICES.md", () => {
    const notices = readFileSync(join(ROOT, "THIRD-PARTY-NOTICES.md"), "utf8");
    const line = notices.split("\n").find((l) => l.includes(`src/fonts/${file}`)) ?? "";
    const recorded = /\b([0-9a-f]{64})\b/.exec(line)?.[1];
    expect(recorded).toBeDefined();
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(recorded);
  });
});

describe("the licence in the repo (3.12)", () => {
  test("licenses/OFL-1.1-Inter.txt holds the copyright line and the OFL 1.1", () => {
    const text = readFileSync(join(ROOT, "licenses", "OFL-1.1-Inter.txt"), "utf8");
    expect(text).toContain(
      "Copyright (c) 2016 The Inter Project Authors (https://github.com/rsms/inter)",
    );
    expect(text).toContain("SIL OPEN FONT LICENSE Version 1.1");
  });
});
