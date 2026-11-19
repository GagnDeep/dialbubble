/**
 * Representative Twilio pay-as-you-go rates and the monthly estimate. Rates were read in November 2026
 * from Twilio's pricing pages and from the CSVs those pages link to. Twilio dates the pages August and
 * October 2026. Every rate can be edited in the calculator.
 */

export const RATES_AS_OF = "November 2026";

export type DestinationId = "US" | "CA" | "GB" | "IN" | "AU" | "DE";
export type LineType = "mobile" | "landline";

export type Destination = {
  id: DestinationId;
  name: string;
  voice: Record<LineType, number>;
  /** Outbound SMS price per segment, before carrier fees. */
  sms: number;
  voiceSource: string;
  smsSource: string;
  voiceNote?: string;
};

/** Origination prefixes Twilio lists for the German "From EEA" mobile rate cover these number countries. */
const EEA_ORIGIN: readonly DestinationId[] = ["DE", "GB"];
export const DE_MOBILE_FROM_EEA = 0.042;

export const DESTINATIONS: readonly Destination[] = [
  {
    id: "US",
    name: "United States",
    voice: { mobile: 0.014, landline: 0.014 },
    sms: 0.0083,
    voiceSource: "https://www.twilio.com/en-us/voice/pricing/us",
    smsSource: "https://www.twilio.com/en-us/sms/pricing/us",
    voiceNote: "Alaska is listed at $0.0945 a minute.",
  },
  {
    id: "CA",
    name: "Canada",
    voice: { mobile: 0.014, landline: 0.014 },
    sms: 0.0083,
    voiceSource: "https://www.twilio.com/en-us/voice/pricing/ca",
    smsSource: "https://www.twilio.com/en-us/sms/pricing/ca",
    voiceNote: "Twilio's price list has a higher rate for Yukon, at $0.1525 a minute.",
  },
  {
    id: "GB",
    name: "United Kingdom",
    voice: { mobile: 0.0305, landline: 0.0158 },
    sms: 0.056,
    voiceSource: "https://www.twilio.com/en-us/voice/pricing/gb",
    smsSource: "https://www.twilio.com/en-us/sms/pricing/gb",
    voiceNote: "A few UK mobile ranges are listed at $0.32 a minute, and special-service numbers cost more.",
  },
  {
    id: "IN",
    name: "India",
    voice: { mobile: 0.0496, landline: 0.0699 },
    sms: 0.0832,
    voiceSource: "https://www.twilio.com/en-us/voice/pricing/in",
    smsSource: "https://www.twilio.com/en-us/sms/pricing/in",
    voiceNote: "Twilio's price list doesn't include India numbers, so pick a number from another country.",
  },
  {
    id: "AU",
    name: "Australia",
    voice: { mobile: 0.075, landline: 0.0252 },
    sms: 0.0515,
    voiceSource: "https://www.twilio.com/en-us/voice/pricing/au",
    smsSource: "https://www.twilio.com/en-us/sms/pricing/au",
  },
  {
    id: "DE",
    name: "Germany",
    voice: { mobile: 0.3763, landline: 0.0283 },
    sms: 0.112,
    voiceSource: "https://www.twilio.com/en-us/voice/pricing/de",
    smsSource: "https://www.twilio.com/en-us/sms/pricing/de",
    voiceNote: "German mobiles cost $0.3763 a minute, or $0.042 when the caller ID is from the EEA list on Twilio's price sheet (which includes UK +44).",
  },
];

export type NumberOption = {
  id: string;
  country: DestinationId;
  label: string;
  monthly: number;
  inboundVoice: number;
  /** Null when Twilio's list shows this number type can't receive SMS. */
  inboundSms: number | null;
};

/** From Twilio's NumbersPricing.csv. Twilio's list has no numbers for India. */
export const NUMBER_OPTIONS: readonly NumberOption[] = [
  { id: "US-local", country: "US", label: "US local", monthly: 1.15, inboundVoice: 0.0085, inboundSms: 0.0083 },
  { id: "US-tollfree", country: "US", label: "US toll-free", monthly: 2.15, inboundVoice: 0.022, inboundSms: 0.0083 },
  { id: "CA-local", country: "CA", label: "Canada local", monthly: 1.15, inboundVoice: 0.0085, inboundSms: 0.0083 },
  { id: "CA-tollfree", country: "CA", label: "Canada toll-free", monthly: 2.15, inboundVoice: 0.022, inboundSms: 0.0083 },
  { id: "GB-local", country: "GB", label: "UK local", monthly: 1.15, inboundVoice: 0.01, inboundSms: 0.0075 },
  { id: "GB-mobile", country: "GB", label: "UK mobile", monthly: 2.5, inboundVoice: 0.01, inboundSms: 0.0075 },
  { id: "GB-tollfree", country: "GB", label: "UK toll-free", monthly: 2.7, inboundVoice: 0.0798, inboundSms: null },
  { id: "AU-local", country: "AU", label: "Australia local", monthly: 3, inboundVoice: 0.01, inboundSms: null },
  { id: "AU-mobile", country: "AU", label: "Australia mobile", monthly: 8.25, inboundVoice: 0.01, inboundSms: 0.0075 },
  { id: "AU-tollfree", country: "AU", label: "Australia toll-free", monthly: 20, inboundVoice: 0.05, inboundSms: null },
  { id: "DE-local", country: "DE", label: "Germany local", monthly: 1.35, inboundVoice: 0.01, inboundSms: null },
  { id: "DE-mobile", country: "DE", label: "Germany mobile", monthly: 30, inboundVoice: 0.01, inboundSms: 0.0075 },
];

export const DEFAULT_NUMBER: Record<DestinationId, string> = {
  US: "US-local",
  CA: "CA-local",
  GB: "GB-mobile",
  IN: "US-local",
  AU: "AU-mobile",
  DE: "DE-mobile",
};

export type CarrierFee = { id: string; label: string; out: number; in: number };

/** Long code and toll-free SMS carrier fees from Twilio's US and Canada SMS pages. A blank inbound cell is stored as 0. */
export const CARRIER_FEES: Partial<Record<DestinationId, readonly CarrierFee[]>> = {
  US: [
    { id: "att", label: "AT&T", out: 0.0035, in: 0.0035 },
    { id: "tmobile", label: "T-Mobile", out: 0.0045, in: 0.0025 },
    { id: "verizon", label: "Verizon", out: 0.005, in: 0 },
    { id: "uscellular", label: "US Cellular", out: 0.005, in: 0.0025 },
    { id: "other", label: "All other carriers", out: 0.0042, in: 0 },
  ],
  CA: [
    { id: "bell", label: "Bell & Virgin", out: 0.0087, in: 0 },
    { id: "freedom", label: "Freedom Mobile", out: 0.0067, in: 0 },
    { id: "rogers", label: "Rogers & Fido", out: 0.0084, in: 0 },
    { id: "telus", label: "Telus", out: 0.0073, in: 0 },
    { id: "videotron", label: "Videotron", out: 0.0067, in: 0 },
    { id: "other", label: "All other carriers", out: 0.0064, in: 0 },
  ],
};

export const RECORDING_RATE = 0.0025;
export const STORAGE_RATE = 0.0005;

export function getDestination(id: string): Destination {
  return DESTINATIONS.find((d) => d.id === id) ?? (DESTINATIONS[0] as Destination);
}

export function getNumberOption(id: string): NumberOption {
  return NUMBER_OPTIONS.find((n) => n.id === id) ?? (NUMBER_OPTIONS[0] as NumberOption);
}

export function getCarrier(country: DestinationId, id: string): CarrierFee | null {
  const list = CARRIER_FEES[country];
  if (!list) return null;
  return list.find((c) => c.id === id) ?? list[0] ?? null;
}

/** The list rate for a call to `to`, placed from a Twilio number in `from`. Only Germany's mobile rate depends on `from`. */
export function voiceRate(to: DestinationId, line: LineType, from: DestinationId): number {
  if (to === "DE" && line === "mobile" && EEA_ORIGIN.includes(from)) return DE_MOBILE_FROM_EEA;
  return getDestination(to).voice[line];
}

export type EstimateInput = {
  outMinutes: number;
  inMinutes: number;
  textsOut: number;
  textsIn: number;
  segmentsPerText: number;
  numbers: number;
  recordingMinutes: number;
  otherMonthly: number;
  talk: boolean;
  rates: {
    /** Per minute to the other person. */
    out: number;
    /** Per minute to your own phone, used for the first leg of a Talk call. */
    leg1: number;
    in: number;
    smsOut: number;
    carrierOut: number;
    smsIn: number;
    carrierIn: number;
    number: number;
    recording: number;
    storage: number;
  };
};

export type EstimateLine = { id: string; label: string; detail: string; total: number };
export type Estimate = {
  lines: EstimateLine[];
  total: number;
  /** What the first leg of Talk calls adds compared with one direct outbound leg. */
  talkExtra: number;
};

const plain = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const rate = (n: number) => `$${n.toFixed(4).replace(/(\.\d{2}\d*?)0+$/, "$1")}`;

export function estimate(input: EstimateInput): Estimate {
  const { rates: r } = input;
  const segmentsOut = input.textsOut * input.segmentsPerText;
  const lines: EstimateLine[] = [];
  const add = (id: string, label: string, qty: number, unit: string, price: number) => {
    lines.push({ id, label, detail: `${plain(qty)} ${unit} at ${rate(price)}`, total: qty * price });
  };

  if (input.talk) {
    add("leg1", "Talk calls, leg 1 to your phone", input.outMinutes, "min", r.leg1);
    add("leg2", "Talk calls, leg 2 to the other person", input.outMinutes, "min", r.out);
  } else {
    add("out", "Outbound calls", input.outMinutes, "min", r.out);
  }
  add("in", "Inbound calls", input.inMinutes, "min", r.in);
  add("smsOut", "Texts sent", segmentsOut, "segments", r.smsOut);
  add("carrierOut", "Carrier fees on texts sent", segmentsOut, "segments", r.carrierOut);
  add("smsIn", "Texts received", input.textsIn, "segments", r.smsIn);
  add("carrierIn", "Carrier fees on texts received", input.textsIn, "segments", r.carrierIn);
  add("number", "Phone numbers", input.numbers, input.numbers === 1 ? "number" : "numbers", r.number);
  add("recording", "Call recording", input.recordingMinutes, "min", r.recording);
  add("storage", "Recording storage, one month", input.recordingMinutes, "min", r.storage);
  if (input.otherMonthly > 0) {
    lines.push({ id: "other", label: "Other monthly fees", detail: "Entered by you", total: input.otherMonthly });
  }

  const total = lines.reduce((sum, line) => sum + line.total, 0);
  return { lines, total, talkExtra: input.talk ? input.outMinutes * r.leg1 : 0 };
}
