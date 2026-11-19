import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { COUNTRIES, csvCell, formatBatch, formatNumber, getCountry, splitCallingCode, splitInput, toCsv } from "./e164.ts";

const e = (value, iso) => formatNumber(value, iso).e164;

describe("country data", () => {
  test("has about 240 countries and territories", () => {
    assert.ok(COUNTRIES.length >= 235, `got ${COUNTRIES.length}`);
    assert.ok(COUNTRIES.length <= 250, `got ${COUNTRIES.length}`);
  });
  test("known rows are right", () => {
    assert.equal(getCountry("US")?.code, "1");
    assert.equal(getCountry("IN")?.code, "91");
    assert.equal(getCountry("GB")?.nationalPrefix, "0");
    assert.equal(getCountry("IT")?.nationalPrefix, "");
    assert.equal(getCountry("IN")?.name, "India");
    assert.deepEqual(getCountry("IN")?.typical, [10]);
    assert.deepEqual(getCountry("US")?.typical, [10]);
  });
  test("no non-geographic rows in the picker, but their codes still resolve", () => {
    assert.equal(COUNTRIES.some((c) => c.iso === "001"), false);
    assert.equal(formatNumber("+80012345678", "US").status, "ok");
  });
  test("calling code lookup", () => {
    assert.equal(splitCallingCode("14155552671")?.code, "1");
    assert.equal(splitCallingCode("442071838750")?.code, "44");
    assert.equal(splitCallingCode("971501234567")?.code, "971");
    assert.equal(splitCallingCode("99912345"), null);
  });
});

describe("national numbers", () => {
  test("US formats", () => {
    for (const v of ["(415) 555-2671", "415.555.2671", "415 555 2671", "4155552671", "1 415 555 2671", "1-415-555-2671"]) {
      assert.equal(e(v, "US"), "+14155552671", v);
    }
  });
  test("a leading 0 is dropped where it's the national prefix", () => {
    assert.equal(e("020 7183 8750", "GB"), "+442071838750");
    assert.equal(e("09876543210", "IN"), "+919876543210");
    assert.equal(e("0412 345 678", "AU"), "+61412345678");
    assert.equal(e("030 123456", "DE"), "+4930123456");
    assert.match(formatNumber("020 7183 8750", "GB").note, /national prefix 0/);
  });
  test("a leading 0 stays in Italy, where it's part of the number", () => {
    assert.equal(e("06 6982 1234", "IT"), "+390669821234");
  });
  test("Russia uses 8 as its national prefix", () => {
    assert.equal(e("8 912 345 67 89", "RU"), "+79123456789");
  });
  test("a country code typed without a plus sign is recognized", () => {
    assert.equal(e("919876543210", "IN"), "+919876543210");
    assert.equal(e("442071838750", "GB"), "+442071838750");
    assert.match(formatNumber("919876543210", "IN").note, /country code/);
  });
});

describe("international prefixes", () => {
  test("00 from a country that dials 00", () => {
    assert.equal(e("00 44 20 7183 8750", "DE"), "+442071838750");
    assert.equal(e("0091 98765 43210", "GB"), "+919876543210");
    assert.match(formatNumber("00 44 20 7183 8750", "DE").note, /international prefix 00/);
  });
  test("011 from the US and Canada", () => {
    assert.equal(e("011 44 20 7183 8750", "US"), "+442071838750");
    assert.equal(e("011 91 98765 43210", "CA"), "+919876543210");
  });
  test("00 from the US and 011 from Europe are still understood", () => {
    assert.equal(e("00 44 20 7183 8750", "US"), "+442071838750");
    assert.equal(e("011 44 20 7183 8750", "DE"), "+442071838750");
  });
  test("Australia's 0011", () => {
    assert.equal(e("0011 1 415 555 2671", "AU"), "+14155552671");
  });
  test("011 is a real area code in Japan, so it stays national there", () => {
    assert.equal(e("011-123-4567", "JP"), "+81111234567");
  });
});

describe("numbers with a plus", () => {
  test("default country is ignored", () => {
    assert.equal(e("+44 20 7183 8750", "US"), "+442071838750");
    assert.equal(e("+1 (415) 555-2671", "IN"), "+14155552671");
  });
  test("a bracketed national zero is removed", () => {
    assert.equal(e("+44 (0)20 7183 8750", "US"), "+442071838750");
  });
  test("full-width plus and digits normalize", () => {
    assert.equal(e("＋１ ４１５ ５５５ ２６７１", "US"), "+14155552671");
  });
  test("country label prefers the default for shared codes", () => {
    assert.equal(formatNumber("+14155552671", "CA").country, "Canada");
    assert.equal(formatNumber("+14155552671", "IN").country, "US, Canada or another +1 country");
  });
});

describe("hints", () => {
  test("too short and too long", () => {
    const short = formatNumber("+1415555", "US");
    assert.equal(short.status, "invalid");
    assert.equal(short.e164, null);
    assert.match(short.note, /Too short/);
    assert.match(formatNumber("+141555526711", "US").note, /Too long/);
  });
  test("over 15 digits", () => {
    assert.match(formatNumber("+4412345678901234567", "US").note, /15 digits/);
  });
  test("NANP area code and exchange rules", () => {
    assert.equal(formatNumber("+10155552671", "US").status, "invalid");
    assert.equal(formatNumber("+14151552671", "US").status, "invalid");
  });
  test("special-number lengths are flagged rather than passed", () => {
    // 1800 123 456 is a 10-digit Australian toll-free number, 13 11 11 style numbers are shorter still.
    const r = formatNumber("+61 180 012", "US");
    assert.equal(r.status, "check");
    assert.match(r.note, /special numbers/);
  });
  test("unknown calling code", () => {
    assert.equal(formatNumber("+999123456", "US").status, "invalid");
  });
  test("a plus followed by 0 is invalid", () => {
    assert.match(formatNumber("+0123456789", "US").note, /No country code starts with 0/);
  });
  test("letters and empty values", () => {
    assert.match(formatNumber("1-800-FLOWERS", "US").note, /letters/);
    assert.match(formatNumber("   ", "US").note, /Empty/);
    assert.match(formatNumber("---", "US").note, /No digits/);
  });
  test("extensions are removed and mentioned", () => {
    for (const v of ["(415) 555-2671 x23", "415-555-2671 ext. 23", "+1 415 555 2671;ext=23"]) {
      const r = formatNumber(v, "US");
      assert.equal(r.e164, "+14155552671", v);
      assert.match(r.note, /Extension removed/, v);
    }
  });
});

describe("batch and CSV", () => {
  test("splits on lines, commas, semicolons and tabs", () => {
    assert.deepEqual(splitInput('a\nb,c;d\te\r\n"f"\n\n'), ["a", "b", "c", "d", "e", "f"]);
  });
  test("keeps an extension attached", () => {
    assert.deepEqual(splitInput("+14155552671;ext=2\n4155552672, ext 9"), ["+14155552671;ext=2", "4155552672, ext 9"]);
  });
  test("counts statuses and duplicates", () => {
    const r = formatBatch("415 555 2671\n+14155552671\n123", "US");
    assert.equal(r.ok, 2);
    assert.equal(r.invalid, 1);
    assert.equal(r.duplicates, 1);
    assert.equal(r.rows[1].duplicate, true);
  });
  test("csv quotes and guards formulas", () => {
    assert.equal(csvCell('a"b,c'), '"a""b,c"');
    assert.equal(csvCell("=SUM(A1)"), "'=SUM(A1)");
    assert.equal(csvCell("+1415", false), "+1415");
  });
  test("csv keeps the plus in the e164 column", () => {
    const csv = toCsv([formatNumber("(415) 555-2671", "US")]);
    assert.ok(csv.startsWith("input,e164,check,country,note\r\n"));
    assert.ok(csv.includes(",+14155552671,Length fits,United States,"));
  });
});
