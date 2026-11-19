import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { computeA2p, defaultBrandFee, volumeWarning } from "./a2p.ts";
import { DEFAULT_NUMBER, DESTINATIONS, NUMBER_OPTIONS, estimate, getNumberOption, voiceRate } from "./pricing.ts";

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);

const base = {
  outMinutes: 100,
  inMinutes: 50,
  textsOut: 200,
  textsIn: 100,
  segmentsPerText: 2,
  numbers: 2,
  recordingMinutes: 10,
  otherMonthly: 0,
  talk: false,
  rates: { out: 0.014, leg1: 0.02, in: 0.0085, smsOut: 0.0083, carrierOut: 0.0045, smsIn: 0.0083, carrierIn: 0.0025, number: 1.15, recording: 0.0025, storage: 0.0005 },
};

describe("pricing data", () => {
  test("covers the six required countries", () => {
    assert.deepEqual(DESTINATIONS.map((d) => d.id).sort(), ["AU", "CA", "DE", "GB", "IN", "US"]);
  });
  test("every default number exists", () => {
    for (const id of Object.values(DEFAULT_NUMBER)) assert.ok(NUMBER_OPTIONS.some((n) => n.id === id), id);
  });
  test("Twilio's list has no India number", () => {
    assert.equal(NUMBER_OPTIONS.some((n) => n.country === "IN"), false);
    assert.equal(getNumberOption(DEFAULT_NUMBER.IN).country, "US");
  });
  test("German mobile rate depends on the caller's number", () => {
    assert.equal(voiceRate("DE", "mobile", "US"), 0.3763);
    assert.equal(voiceRate("DE", "mobile", "DE"), 0.042);
    assert.equal(voiceRate("DE", "mobile", "GB"), 0.042);
    assert.equal(voiceRate("DE", "landline", "US"), 0.0283);
    assert.equal(voiceRate("US", "mobile", "DE"), 0.014);
  });
});

describe("estimate", () => {
  test("direct calls use one outbound line", () => {
    const e = estimate(base);
    assert.equal(e.lines.some((l) => l.id === "leg1"), false);
    close(e.lines.find((l) => l.id === "out").total, 1.4);
    assert.equal(e.talkExtra, 0);
  });
  test("segments multiply outbound texts and their carrier fees", () => {
    const e = estimate(base);
    close(e.lines.find((l) => l.id === "smsOut").total, 400 * 0.0083);
    close(e.lines.find((l) => l.id === "carrierOut").total, 400 * 0.0045);
  });
  test("total is the sum of lines", () => {
    const e = estimate(base);
    const expected = 1.4 + 50 * 0.0085 + 400 * 0.0083 + 400 * 0.0045 + 100 * 0.0083 + 100 * 0.0025 + 2.3 + 0.025 + 0.005;
    close(e.total, expected);
  });
  test("Talk bills two legs for the same minutes", () => {
    const direct = estimate(base);
    const talk = estimate({ ...base, talk: true });
    close(talk.lines.find((l) => l.id === "leg1").total, 2);
    close(talk.lines.find((l) => l.id === "leg2").total, 1.4);
    close(talk.talkExtra, 2);
    close(talk.total - direct.total, 2);
  });
  test("other fees appear only when set", () => {
    assert.equal(estimate(base).lines.some((l) => l.id === "other"), false);
    close(estimate({ ...base, otherMonthly: 5 }).lines.find((l) => l.id === "other").total, 5);
  });
});

describe("A2P", () => {
  const input = {
    brandFee: 4.5,
    campaigns: 2,
    vettingFee: 15,
    monthlyCampaignFee: 1.5,
    segmentsPerMonth: 10000,
    baseRate: 0.0083,
    includeBaseRate: false,
    carriers: [
      { fee: 0.004, share: 50 },
      { fee: 0.006, share: 50 },
    ],
  };
  test("brand fees", () => {
    assert.equal(defaultBrandFee("sole"), 4.5);
    assert.equal(defaultBrandFee("lvs"), 4.5);
    assert.equal(defaultBrandFee("standard"), 46);
  });
  test("totals", () => {
    const r = computeA2p(input);
    close(r.oneTime, 34.5);
    close(r.campaignMonthly, 3);
    close(r.carrierMonthly, 50);
    close(r.monthly, 53);
    close(r.firstMonth, 87.5);
    close(r.firstYear, 34.5 + 53 * 12);
  });
  test("shares normalize", () => {
    const r = computeA2p({ ...input, carriers: [{ fee: 0.004, share: 1 }, { fee: 0.006, share: 1 }] });
    close(r.blendedCarrierFee, 0.005);
    assert.equal(computeA2p({ ...input, carriers: [] }).blendedCarrierFee, 0);
  });
  test("base rate is optional", () => {
    close(computeA2p({ ...input, includeBaseRate: true }).baseMonthly, 83);
  });
  test("volume warning", () => {
    assert.equal(volumeWarning("sole", 30000, 100), null);
    assert.match(volumeWarning("sole", 31000, 100), /1,033 segments/);
    assert.equal(volumeWarning("standard", 9e9, 100), null);
    assert.equal(volumeWarning("lvs", 60000, 100), null);
    assert.match(volumeWarning("lvs", 90000, 100), /Low-Volume Standard/);
  });
});
