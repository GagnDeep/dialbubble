import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  GSM_BASIC,
  GSM_EXTENSION,
  analyzeSms,
  detectEncoding,
  findOffenders,
  isGsm,
  removeEmoji,
  replaceAccents,
  replaceSmartPunctuation,
} from "./sms.ts";

describe("tables", () => {
  test("default alphabet has 128 positions with ESC at 0x1B", () => {
    assert.equal(GSM_BASIC.length, 128);
    assert.equal(GSM_BASIC[0x1b], "\u001b");
    assert.equal(GSM_BASIC[0x00], "@");
    assert.equal(GSM_BASIC[0x0a], "\n");
    assert.equal(GSM_BASIC[0x24], "¤");
    assert.equal(GSM_BASIC[0x41], "A");
    assert.equal(GSM_BASIC[0x61], "a");
    assert.equal(GSM_BASIC[0x7f], "à");
  });
  test("extension table has the ten defined characters", () => {
    assert.equal(GSM_EXTENSION.map((e) => e.char).join(""), "\f^{}\\[~]|€");
    assert.equal(GSM_EXTENSION.find((e) => e.char === "€")?.code, 0x65);
  });
  test("a raw ESC, a backtick and a lowercase c-cedilla are not GSM-7", () => {
    assert.equal(isGsm("\u001b"), false);
    assert.equal(isGsm("`"), false);
    assert.equal(isGsm("ç"), false);
    assert.equal(isGsm("Ç"), true);
  });
});

describe("GSM-7 limits", () => {
  test("empty message has no segments", () => {
    const r = analyzeSms("");
    assert.equal(r.segmentCount, 0);
    assert.equal(r.encoding, "GSM-7");
    assert.equal(r.remaining, 160);
  });
  test("160 characters is one segment, 161 is two", () => {
    assert.equal(analyzeSms("a".repeat(160)).segmentCount, 1);
    const two = analyzeSms("a".repeat(161));
    assert.equal(two.segmentCount, 2);
    assert.equal(two.segments[0].units, 153);
    assert.equal(two.segments[1].units, 8);
    assert.equal(two.remaining, 145);
  });
  test("306 is two segments, 307 is three", () => {
    assert.equal(analyzeSms("a".repeat(306)).segmentCount, 2);
    assert.equal(analyzeSms("a".repeat(307)).segmentCount, 3);
  });
  test("extension characters count as two septets", () => {
    const r = analyzeSms("€".repeat(80));
    assert.equal(r.encoding, "GSM-7");
    assert.equal(r.units, 160);
    assert.equal(r.segmentCount, 1);
    assert.equal(r.extensionCount, 80);
    assert.equal(analyzeSms("€".repeat(80) + "a").segmentCount, 2);
  });
  test("an escape sequence never straddles a segment boundary", () => {
    const r = analyzeSms("a".repeat(152) + "€" + "a".repeat(20));
    assert.equal(r.units, 174);
    assert.equal(r.segments[0].units, 152);
    assert.equal(r.segments[0].capacity, 153);
    assert.equal(r.segments[1].text[0], "€");
    assert.equal(r.segments[1].units, 22);
  });
  test("a boundary push can add a segment that plain arithmetic would miss", () => {
    // 306 septets would be exactly two segments, but the euro can't split, so it takes three.
    const r = analyzeSms("a".repeat(152) + "€" + "a".repeat(152));
    assert.equal(r.units, 306);
    assert.equal(r.segmentCount, 3);
  });
  test("newlines are one septet", () => {
    assert.equal(analyzeSms("a\nb").units, 3);
  });
});

describe("UCS-2 limits", () => {
  test("70 is one segment, 71 is two", () => {
    assert.equal(analyzeSms("你".repeat(70)).segmentCount, 1);
    const two = analyzeSms("你".repeat(71));
    assert.equal(two.encoding, "UCS-2");
    assert.equal(two.segmentCount, 2);
    assert.equal(two.segments[0].units, 67);
    assert.equal(two.segments[1].units, 4);
  });
  test("one curly quote forces the whole message to UCS-2", () => {
    const r = analyzeSms("It’s" + " ok".repeat(30));
    assert.equal(r.encoding, "UCS-2");
    assert.equal(r.offenders.length, 1);
    assert.equal(r.offenders[0].codePoint, "U+2019");
    assert.equal(r.offenders[0].replacement, "'");
  });
  test("extension characters count as one unit in UCS-2", () => {
    assert.equal(analyzeSms("€你").units, 2);
  });
});

describe("surrogate pairs", () => {
  test("an emoji counts as two units", () => {
    const r = analyzeSms("😀");
    assert.equal(r.encoding, "UCS-2");
    assert.equal(r.characters, 1);
    assert.equal(r.utf16Length, 2);
    assert.equal(r.units, 2);
  });
  test("35 emoji fit one segment, 36 do not", () => {
    assert.equal(analyzeSms("😀".repeat(35)).segmentCount, 1);
    assert.equal(analyzeSms("😀".repeat(36)).segmentCount, 2);
  });
  test("a pair at the boundary moves whole into the next segment", () => {
    const r = analyzeSms("x".repeat(66) + "😀" + "你".repeat(10));
    assert.equal(r.units, 78);
    assert.equal(r.segments[0].units, 66);
    assert.equal(r.segments[0].text, "x".repeat(66));
    assert.equal(r.segments[1].text.startsWith("😀"), true);
    assert.equal(r.segments[1].units, 12);
  });
  test("no segment ever starts or ends on half a pair", () => {
    for (let pad = 0; pad < 4; pad++) {
      const r = analyzeSms("y".repeat(pad) + "😀".repeat(200));
      for (const s of r.segments) {
        assert.ok(s.units <= 67);
        assert.equal(s.text.isWellFormed(), true);
      }
      assert.equal(r.segments.map((s) => s.text).join(""), "y".repeat(pad) + "😀".repeat(200));
    }
  });
  test("a boundary push can add a segment in UCS-2 too", () => {
    // 134 units would be two segments, but with the pair on the boundary it takes three.
    const r = analyzeSms("x".repeat(66) + "😀" + "你".repeat(66));
    assert.equal(r.units, 134);
    assert.equal(r.segmentCount, 3);
  });
  test("flags and joined emoji count every code unit", () => {
    assert.equal(analyzeSms("🇺🇸").units, 4);
    assert.equal(analyzeSms("👨‍👩‍👧").units, 8);
  });
});

describe("toll-free limits", () => {
  test("multi-segment limits drop to 152 and 66, single-segment stay", () => {
    assert.equal(analyzeSms("a".repeat(160), { tollFree: true }).segmentCount, 1);
    assert.equal(analyzeSms("a".repeat(161), { tollFree: true }).segments[0].units, 152);
    assert.equal(analyzeSms("a".repeat(305), { tollFree: true }).segmentCount, 3);
    assert.equal(analyzeSms("你".repeat(71), { tollFree: true }).segments[0].units, 66);
  });
});

describe("fixes", () => {
  test("smart punctuation becomes GSM-7", () => {
    const fixed = replaceSmartPunctuation("“It’s” – ok… done");
    assert.equal(fixed, "\"It's\" - ok... done");
    assert.equal(detectEncoding(fixed), "GSM-7");
  });
  test("zero-width characters are removed and emoji left alone", () => {
    assert.equal(replaceSmartPunctuation("a​b😀"), "ab😀");
  });
  test("removeEmoji takes joiners and selectors with it", () => {
    assert.equal(removeEmoji("ok 👨‍👩‍👧 ❤️ 🇺🇸!"), "ok   !");
  });
  test("accents are replaced only when the result is GSM-7", () => {
    assert.equal(replaceAccents("á ç é 你"), "a c é 你");
  });
  test("findOffenders counts repeats once with a count", () => {
    const o = findOffenders("😀a😀");
    assert.equal(o.length, 1);
    assert.equal(o[0].count, 2);
    assert.equal(o[0].isEmoji, true);
    assert.equal(o[0].codePoint, "U+1F600");
  });
});
