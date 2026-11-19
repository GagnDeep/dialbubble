/**
 * A2P 10DLC fee model. Fees checked November 2026 against Twilio's docs and help center:
 * brand and vetting fees from the A2P 10DLC Brand Registration doc (last modified 2026-09-25),
 * campaign fees from Twilio's 10DLC page and its "Pricing and Fees for A2P 10DLC Service" article,
 * per-message carrier fees from the US SMS pricing page (long code column).
 */

export type BrandType = "sole" | "lvs" | "standard";

export const BRAND_FEE = 4.5;
export const STANDARD_VETTING_FEE = 41.5;
export const CAMPAIGN_VETTING_FEE = 15;
export const BRAND_APPEAL_FEE = 11;
export const AUTH_PLUS_FEE = 12.5;
export const BASE_SMS_RATE = 0.0083;

export type UseCase = { id: string; label: string; monthly: number };

export const USE_CASES: Record<BrandType, readonly UseCase[]> = {
  sole: [{ id: "sole", label: "Sole Proprietor campaign", monthly: 2 }],
  lvs: [
    { id: "lvm", label: "Low-Volume Mixed", monthly: 1.5 },
    { id: "standard", label: "Standard use case", monthly: 10 },
    { id: "charity", label: "Charity or 501(c)(3) nonprofit", monthly: 3 },
    { id: "emergency", label: "Emergency services", monthly: 5 },
  ],
  standard: [
    { id: "standard", label: "Standard use case", monthly: 10 },
    { id: "lvm", label: "Low-Volume Mixed", monthly: 1.5 },
    { id: "charity", label: "Charity or 501(c)(3) nonprofit", monthly: 3 },
    { id: "emergency", label: "Emergency services", monthly: 5 },
  ],
};

export const BRAND_INFO: Record<BrandType, { label: string; maxCampaigns: number; tmobileDaily: number | null; roughDaily: number | null }> = {
  sole: { label: "Sole Proprietor", maxCampaigns: 1, tmobileDaily: 1000, roughDaily: 3000 },
  lvs: { label: "Low-Volume Standard", maxCampaigns: 5, tmobileDaily: 2000, roughDaily: 6000 },
  standard: { label: "Standard", maxCampaigns: 5, tmobileDaily: null, roughDaily: null },
};

export type CarrierShare = { id: string; label: string; fee: number; share: number };

/** Fees from Twilio's page. The even split is a starting point for the reader to replace, not market data. */
export const CARRIERS: readonly CarrierShare[] = [
  { id: "att", label: "AT&T", fee: 0.0035, share: 25 },
  { id: "tmobile", label: "T-Mobile", fee: 0.0045, share: 25 },
  { id: "verizon", label: "Verizon", fee: 0.005, share: 25 },
  { id: "uscellular", label: "US Cellular", fee: 0.005, share: 0 },
  { id: "other", label: "All other carriers", fee: 0.0042, share: 25 },
];

export function defaultBrandFee(type: BrandType): number {
  return type === "standard" ? BRAND_FEE + STANDARD_VETTING_FEE : BRAND_FEE;
}

export type A2pInput = {
  brandFee: number;
  campaigns: number;
  vettingFee: number;
  monthlyCampaignFee: number;
  segmentsPerMonth: number;
  baseRate: number;
  includeBaseRate: boolean;
  carriers: { fee: number; share: number }[];
};

export type A2pResult = {
  oneTime: number;
  brand: number;
  vetting: number;
  campaignMonthly: number;
  carrierMonthly: number;
  blendedCarrierFee: number;
  baseMonthly: number;
  monthly: number;
  firstMonth: number;
  firstYear: number;
  shareTotal: number;
};

export function computeA2p(input: A2pInput): A2pResult {
  const shareTotal = input.carriers.reduce((sum, c) => sum + c.share, 0);
  // Shares are normalized, so a mix that doesn't add up to 100 still gives a sensible blended fee.
  const blendedCarrierFee = shareTotal > 0 ? input.carriers.reduce((sum, c) => sum + c.fee * (c.share / shareTotal), 0) : 0;
  const brand = input.brandFee;
  const vetting = input.vettingFee * input.campaigns;
  const oneTime = brand + vetting;
  const campaignMonthly = input.monthlyCampaignFee * input.campaigns;
  const carrierMonthly = blendedCarrierFee * input.segmentsPerMonth;
  const baseMonthly = input.includeBaseRate ? input.baseRate * input.segmentsPerMonth : 0;
  const monthly = campaignMonthly + carrierMonthly + baseMonthly;
  return {
    oneTime,
    brand,
    vetting,
    campaignMonthly,
    carrierMonthly,
    blendedCarrierFee,
    baseMonthly,
    monthly,
    firstMonth: oneTime + monthly,
    firstYear: oneTime + monthly * 12,
    shareTotal,
  };
}

/** Rough segments a day to T-Mobile, compared with the brand's documented cap. */
export function volumeWarning(type: BrandType, segmentsPerMonth: number, tmobileSharePercent: number): string | null {
  const info = BRAND_INFO[type];
  if (info.tmobileDaily === null) return null;
  const perDay = (segmentsPerMonth / 30) * (tmobileSharePercent / 100);
  if (perDay <= info.tmobileDaily) return null;
  return `That's about ${Math.round(perDay).toLocaleString("en-US")} segments a day to T-Mobile, over the ${info.tmobileDaily.toLocaleString("en-US")} a day that Twilio documents for ${info.label} brands.`;
}
