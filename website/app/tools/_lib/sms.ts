/**
 * SMS encoding and segment logic. Pure functions with no dependencies, so the same code runs
 * in the browser and under `node --test`.
 *
 * Tables: GSM 03.38 (3GPP TS 23.038) default alphabet and its extension table.
 * Limits: 160/153 for GSM-7 and 70/67 for UCS-2. Twilio's glossary documents 152/66 per segment
 * for multi-segment toll-free messages sent to the US or Canada.
 */

const ESC = "\u001b";

/** The 128 positions of the default alphabet, in order. Position 0x1B is the escape to the extension table. */
export const GSM_BASIC: readonly string[] = Array.from(
  "@£$¥èéùìòÇ\nØø\rÅå" +
    `Δ_ΦΓΛΩΠΨΣΘΞ${ESC}ÆæßÉ` +
    " !\"#¤%&'()*+,-./" +
    "0123456789:;<=>?" +
    "¡ABCDEFGHIJKLMNO" +
    "PQRSTUVWXYZÄÖÑÜ§" +
    "¿abcdefghijklmno" +
    "pqrstuvwxyzäöñüà",
);

/** Extension table entries that are defined, with their code position. Each costs two septets. */
export const GSM_EXTENSION: readonly { char: string; code: number }[] = [
  { char: "\f", code: 0x0a },
  { char: "^", code: 0x14 },
  { char: "{", code: 0x28 },
  { char: "}", code: 0x29 },
  { char: "\\", code: 0x2f },
  { char: "[", code: 0x3c },
  { char: "~", code: 0x3d },
  { char: "]", code: 0x3e },
  { char: "|", code: 0x40 },
  { char: "€", code: 0x65 },
];

const basicSet = new Set(GSM_BASIC.filter((c) => c !== ESC));
const extensionSet = new Set(GSM_EXTENSION.map((e) => e.char));

export function isGsmBasic(char: string): boolean {
  return basicSet.has(char);
}
export function isGsmExtension(char: string): boolean {
  return extensionSet.has(char);
}
export function isGsm(char: string): boolean {
  return basicSet.has(char) || extensionSet.has(char);
}

export type Encoding = "GSM-7" | "UCS-2";
export type CharKind = "basic" | "extension" | "unicode";

export type SegmentChar = { char: string; cost: number; kind: CharKind };
export type Segment = { text: string; units: number; capacity: number; chars: SegmentChar[] };
export type Offender = {
  char: string;
  count: number;
  codePoint: string;
  name: string;
  replacement: string | null;
  isEmoji: boolean;
};

export type SmsAnalysis = {
  encoding: Encoding;
  /** Code points the user typed. */
  characters: number;
  /** UTF-16 code units. */
  utf16Length: number;
  /** Septets for GSM-7, UTF-16 code units for UCS-2. */
  units: number;
  segments: Segment[];
  segmentCount: number;
  /** Units still free in the last segment before another segment is needed. */
  remaining: number;
  singleLimit: number;
  multiLimit: number;
  extensionCount: number;
  offenders: Offender[];
};

export type SmsOptions = {
  /** Toll-free sender to a US or Canada number: 152 and 66 per segment once the message is split. */
  tollFree?: boolean;
};

export const LIMITS = {
  "GSM-7": { single: 160, multi: 153, tollFreeMulti: 152 },
  "UCS-2": { single: 70, multi: 67, tollFreeMulti: 66 },
} as const;

/** Twilio's documented maximum message body length. */
export const TWILIO_MAX_BODY = 1600;

export function detectEncoding(text: string): Encoding {
  for (const char of text) {
    if (!isGsm(char)) return "UCS-2";
  }
  return "GSM-7";
}

function costOf(char: string, encoding: Encoding): number {
  if (encoding === "UCS-2") return char.length; // 2 for a surrogate pair
  return isGsmExtension(char) ? 2 : 1;
}

function kindOf(char: string): CharKind {
  if (isGsmBasic(char)) return "basic";
  if (isGsmExtension(char)) return "extension";
  return "unicode";
}

export function analyzeSms(text: string, options: SmsOptions = {}): SmsAnalysis {
  const encoding = detectEncoding(text);
  const limits = LIMITS[encoding];
  const multi = options.tollFree ? limits.tollFreeMulti : limits.multi;
  const single = limits.single;
  const chars = Array.from(text);

  let units = 0;
  for (const char of chars) units += costOf(char, encoding);

  const capacity = units <= single ? single : multi;
  const segments: Segment[] = [];
  let current: Segment | null = null;
  // Walking whole code points keeps a surrogate pair or an escape sequence in one segment.
  // The previous segment is then left one unit short.
  for (const char of chars) {
    const cost = costOf(char, encoding);
    if (!current || current.units + cost > capacity) {
      current = { text: "", units: 0, capacity, chars: [] };
      segments.push(current);
    }
    current.text += char;
    current.units += cost;
    current.chars.push({ char, cost, kind: kindOf(char) });
  }

  const last = segments[segments.length - 1];
  const remaining = last ? last.capacity - last.units : single;

  return {
    encoding,
    characters: chars.length,
    utf16Length: text.length,
    units,
    segments,
    segmentCount: segments.length,
    remaining,
    singleLimit: single,
    multiLimit: multi,
    extensionCount: chars.filter((c) => isGsmExtension(c)).length,
    offenders: findOffenders(text),
  };
}

const SMART_REPLACEMENTS: Record<string, string> = {
  "‘": "'",
  "’": "'",
  "‚": "'",
  "‛": "'",
  "′": "'",
  "ʼ": "'",
  "´": "'",
  "`": "'",
  "‹": "'",
  "›": "'",
  "“": '"',
  "”": '"',
  "„": '"',
  "‟": '"',
  "″": '"',
  "«": '"',
  "»": '"',
  "‐": "-",
  "‑": "-",
  "‒": "-",
  "–": "-",
  "—": "-",
  "―": "-",
  "−": "-",
  "…": "...",
  " ": " ",
  " ": " ",
  " ": " ",
  " ": " ",
  " ": " ",
  " ": " ",
  "　": " ",
  "\t": " ",
  "​": "",
  "⁠": "",
  "﻿": "",
  "­": "",
  "•": "-",
  "·": "-",
  "⁄": "/",
  "×": "x",
  "÷": "/",
  "™": "TM",
  "©": "(c)",
  "®": "(r)",
  "ﬁ": "fi",
  "ﬂ": "fl",
};

const CHAR_NAMES: Record<string, string> = {
  "‘": "Left curly single quote",
  "’": "Curly apostrophe",
  "‚": "Low curly single quote",
  "‛": "Reversed curly single quote",
  "′": "Prime",
  "ʼ": "Modifier apostrophe",
  "´": "Acute accent",
  "`": "Backtick",
  "‹": "Single angle quote",
  "›": "Single angle quote",
  "“": "Left curly double quote",
  "”": "Right curly double quote",
  "„": "Low curly double quote",
  "‟": "Reversed curly double quote",
  "″": "Double prime",
  "«": "Left angle quote",
  "»": "Right angle quote",
  "‐": "Hyphen",
  "‑": "Non-breaking hyphen",
  "‒": "Figure dash",
  "–": "En dash",
  "—": "Em dash",
  "―": "Horizontal bar",
  "−": "Minus sign",
  "…": "Ellipsis",
  " ": "Non-breaking space",
  " ": "En space",
  " ": "Em space",
  " ": "Thin space",
  " ": "Hair space",
  " ": "Narrow non-breaking space",
  "　": "Ideographic space",
  "\t": "Tab",
  "​": "Zero-width space",
  "‍": "Zero-width joiner",
  "⁠": "Word joiner",
  "﻿": "Byte order mark",
  "­": "Soft hyphen",
  "•": "Bullet",
  "·": "Middle dot",
  "⁄": "Fraction slash",
  "×": "Multiplication sign",
  "÷": "Division sign",
  "™": "Trademark sign",
  "©": "Copyright sign",
  "®": "Registered sign",
  "ﬁ": "fi ligature",
  "ﬂ": "fl ligature",
  "️": "Emoji style selector",
};

const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}/u;

export function isEmojiChar(char: string): boolean {
  return EMOJI.test(char);
}

/** "U+2019" for a character, or "U+1F600" for an astral one. */
export function codePointOf(char: string): string {
  const cp = char.codePointAt(0) ?? 0;
  return `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
}

/** The base letter when removing an accent gives a GSM-7 character, otherwise null. */
export function accentFree(char: string): string | null {
  const stripped = char.normalize("NFD").replace(/\p{Mark}/gu, "");
  if (stripped === char || stripped.length === 0) return null;
  return Array.from(stripped).every(isGsm) ? stripped : null;
}

export function charName(char: string): string {
  const named = CHAR_NAMES[char];
  if (named) return named;
  if (isEmojiChar(char)) return "Emoji";
  if (accentFree(char) !== null) return "Accented letter";
  return "Character outside GSM-7";
}

export function findOffenders(text: string): Offender[] {
  const counts = new Map<string, number>();
  for (const char of text) {
    if (!isGsm(char)) counts.set(char, (counts.get(char) ?? 0) + 1);
  }
  return Array.from(counts, ([char, count]) => ({
    char,
    count,
    codePoint: codePointOf(char),
    name: charName(char),
    replacement: SMART_REPLACEMENTS[char] ?? null,
    isEmoji: isEmojiChar(char) || char === "️" || char === "‍",
  }));
}

/** Swaps smart punctuation, odd spaces and invisible characters for GSM-7 equivalents. Letters and emoji stay. */
export function replaceSmartPunctuation(text: string): string {
  let out = "";
  for (const char of text) out += SMART_REPLACEMENTS[char] ?? char;
  return out;
}

/** Removes emoji along with the joiners and style selectors that build them. */
export function removeEmoji(text: string): string {
  return text.replace(/\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|️|‍|⃣/gu, "");
}

/** Replaces accented letters with base letters when that gives a GSM-7 character. This changes spelling. */
export function replaceAccents(text: string): string {
  let out = "";
  for (const char of text) out += isGsm(char) ? char : (accentFree(char) ?? char);
  return out;
}

/** A printable label for characters that have no glyph of their own. */
export function displayChar(char: string): string {
  switch (char) {
    case "\n":
      return "LF";
    case "\r":
      return "CR";
    case "\f":
      return "FF";
    case " ":
      return "SP";
    case ESC:
      return "ESC";
    default:
      return char;
  }
}
