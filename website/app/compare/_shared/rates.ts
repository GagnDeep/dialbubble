/**
 * Published list prices used across the solutions and compare pages.
 * Each was read from the provider's own page on 4 November 2026. Update here and every page follows.
 */
export const CHECKED = "November 2026";

export const URLS = {
  twilioVoice: "https://www.twilio.com/en-us/voice/pricing/us",
  twilioSms: "https://www.twilio.com/en-us/sms/pricing/us",
  twilioA2p: "https://support.twilio.com/hc/en-us/articles/1260803965530-What-pricing-and-fees-are-associated-with-the-A2P-10DLC-service",
  twilioSupportPlans: "https://www.twilio.com/en-us/support-plans",
  twilioNoApp: "https://support.twilio.com/hc/en-us/articles/50307312528667-Mobile-Application-Availability-for-Voice-Calls-and-Recommended-Alternatives",
  flexApp: "https://apps.apple.com/us/app/twilio-flex/id6451207884",
  iosSdk: "https://www.twilio.com/docs/voice/sdks/ios/get-started",
  sipQuickstart: "https://www.twilio.com/docs/voice/sip/quickstart",
  sipCompat: "https://support.twilio.com/hc/en-us/articles/223132987-Soft-phone-compatibility-with-Twilio-SIP-Domains",
  twilioBilling: "https://www.twilio.com/docs/usage/billing",
  twilioRoles: "https://help.twilio.com/articles/223136227-What-s-the-Difference-Between-User-Roles-Owner-Administrator-Developer-Billing-Manager-and-Support-",
  twilioProducts: "https://www.twilio.com/en-us/products",
  quoPricing: "https://www.quo.com/pricing",
  quoHome: "https://www.quo.com/",
  dialpadPricing: "https://www.dialpad.com/pricing/",
  dialpadInfo: "https://www.dialpad.com/llm-info/",
  dialpadVoip: "https://www.dialpad.com/blog/voip-cost/",
  grasshopperInfo: "https://grasshopper.com/ai-information",
  gvPlans: "https://workspace.google.com/products/voice/",
  gvStandalone: "https://support.google.com/voice/answer/16515632?hl=en",
  gvCalls: "https://support.google.com/voice/answer/115061",
  gvEligibility: "https://support.google.com/voice/community-guide/241024325/why-can-t-i-get-a-google-voice-number?hl=en",
  appleDualSim: "https://support.apple.com/en-us/109317",
  telnyxVoice: "https://telnyx.com/pricing/elastic-sip",
  telnyxSms: "https://telnyx.com/pricing/messaging",
  telnyxVsTwilio: "https://telnyx.com/resources/telnyx-vs-twilio-which-voice-api-is-better",
  telnyxTexml: "https://developers.telnyx.com/docs/voice/programmable-voice/twiml-compatibility",
  vonagePricing: "https://www.vonage.com/communications-apis/pricing/",
  plivoVoice: "https://www.plivo.com/voice/pricing/us/",
  plivoSms: "https://www.plivo.com/sms/pricing/us/",
  sinchSms: "https://sinch.com/pricing/sms/",
  sinchVoice: "https://sinch.com/pricing/voice/",
  bandwidthPricing: "https://www.bandwidth.com/pricing/",
  signalwirePricing: "https://signalwire.com/pricing",
  signalwireCompat: "https://signalwire.com/docs/compatibility-api",
  nethram: "https://www.nethram.com/twilioid_app",
  twiphone: "https://apps.apple.com/us/app/twiphone-pilot/id1557718306",
  dialmagics: "https://apps.apple.com/us/app/dialmagics-twilio-dialer/id6760746516",
} as const;

export const TWILIO = {
  callOut: 0.014,
  callIn: 0.0085,
  client: 0.004,
  recording: 0.0025,
  localNumber: 1.15,
  tollFreeNumber: 2.15,
  sms: 0.0083,
  mmsOut: 0.022,
  /** Top of the common per-segment carrier fees on Twilio's US table, so estimates lean high. */
  carrierHigh: 0.005,
  carrierLow: 0.0035,
  /** Sole Proprietor brand ($4.50) plus campaign vetting ($15), paid once. */
  a2pOneTime: 19.5,
  /** Sole Proprietor campaign fee. */
  a2pMonthly: 2,
} as const;

/** Twilio bills both legs of a Talk call at the outbound local rate. */
export const TALK_PER_MIN = TWILIO.callOut * 2;
/** A real softphone: one client leg plus one outbound leg. */
export const SOFTPHONE_PER_MIN = TWILIO.client + TWILIO.callOut;

/** One Twilio number, Talk minutes and sent texts, with carrier fees and a Sole Proprietor campaign. */
export function monthlyOnTwilio(talkMinutes: number, textsSent: number): number {
  return TWILIO.localNumber + talkMinutes * TALK_PER_MIN + textsSent * (TWILIO.sms + TWILIO.carrierHigh) + TWILIO.a2pMonthly;
}

export function usd(value: number): string {
  return `$${value.toFixed(2)}`;
}

/** Per-unit rates, for example $0.014. */
export function rate(value: number): string {
  return `$${String(Number(value.toFixed(4)))}`;
}

export const SCENARIOS = [
  { name: "Light", minutes: 100, texts: 100 },
  { name: "Regular", minutes: 500, texts: 300 },
  { name: "Heavy", minutes: 1500, texts: 500 },
] as const;
