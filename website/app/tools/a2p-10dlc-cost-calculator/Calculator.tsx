"use client";

import { useMemo } from "react";
import { useQueryState } from "../_components/useQueryState";
import { CopyButton, Field, Notice, NumberInput, Segmented, Toggle, inputClass, money, parseAmount } from "../_components/ui";
import {
  BASE_SMS_RATE,
  BRAND_INFO,
  CAMPAIGN_VETTING_FEE,
  CARRIERS,
  USE_CASES,
  computeA2p,
  defaultBrandFee,
  volumeWarning,
  type BrandType,
} from "../_lib/a2p";

const DEFAULTS: Record<string, string> = {
  brand: "lvs",
  uc: "",
  camps: "1",
  segs: "5000",
  base: "1",
  brandFee: "",
  vet: "",
  mon: "",
  rate: "",
  ...Object.fromEntries(CARRIERS.flatMap((c) => [[`f_${c.id}`, ""], [`s_${c.id}`, ""]])),
};

const BRAND_OPTIONS: readonly { value: BrandType; label: string }[] = [
  { value: "sole", label: "Sole Proprietor" },
  { value: "lvs", label: "Low-Volume Standard" },
  { value: "standard", label: "Standard" },
];

const BRAND_EXPLAINER: Record<BrandType, string> = {
  sole: "For a person with no tax ID, such as a hobbyist or student, in the US or Canada. One campaign, one number and up to 1,000 segments a day to T-Mobile.",
  lvs: "For a business with a tax ID, such as a US EIN, that sends small volumes. Up to 2,000 segments a day to T-Mobile, about 6,000 across US carriers.",
  standard: "For a business with a tax ID that needs more volume. Adds a one-time vetting fee, and the daily limit depends on your Trust Score.",
};

export function Calculator() {
  const { values, set, reset, shareUrl } = useQueryState(DEFAULTS);
  const brand = (BRAND_OPTIONS.find((o) => o.value === values.brand)?.value ?? "lvs") as BrandType;
  const useCases = USE_CASES[brand];
  const useCase = useCases.find((u) => u.id === values.uc) ?? useCases[0];
  const info = BRAND_INFO[brand];

  const campaigns = Math.max(1, Math.round(parseAmount(values.camps)) || 1);
  const brandFee = values.brandFee ? parseAmount(values.brandFee) : defaultBrandFee(brand);
  const vetting = values.vet ? parseAmount(values.vet) : CAMPAIGN_VETTING_FEE;
  const monthlyFee = values.mon ? parseAmount(values.mon) : (useCase?.monthly ?? 0);
  const baseRate = values.rate ? parseAmount(values.rate) : BASE_SMS_RATE;
  const includeBase = values.base === "1";
  const segments = parseAmount(values.segs);

  const carriers = CARRIERS.map((c) => ({
    ...c,
    fee: values[`f_${c.id}`] ? parseAmount(values[`f_${c.id}`]) : c.fee,
    share: values[`s_${c.id}`] !== "" && values[`s_${c.id}`] !== undefined ? parseAmount(values[`s_${c.id}`]) : c.share,
  }));

  const result = useMemo(
    () =>
      computeA2p({
        brandFee,
        campaigns,
        vettingFee: vetting,
        monthlyCampaignFee: monthlyFee,
        segmentsPerMonth: segments,
        baseRate,
        includeBaseRate: includeBase,
        carriers,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carriers is rebuilt from values on each render
    [brandFee, campaigns, vetting, monthlyFee, segments, baseRate, includeBase, values],
  );

  const tmobile = carriers.find((c) => c.id === "tmobile");
  const tmobileShare = result.shareTotal > 0 ? ((tmobile?.share ?? 0) / result.shareTotal) * 100 : 0;
  const warning = volumeWarning(brand, segments, tmobileShare);
  const overCampaigns = campaigns > info.maxCampaigns;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
      <div className="min-w-0 space-y-7">
        <div className="space-y-2">
          <Segmented legend="Brand type" options={BRAND_OPTIONS} value={brand} onChange={(next) => set({ brand: next, uc: "", brandFee: "", mon: "" })} />
          <p className="text-[0.9375rem] leading-snug text-ink-soft">{BRAND_EXPLAINER[brand]}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Campaign use case">
            <select className={inputClass} value={useCase?.id} onChange={(event) => set({ uc: event.target.value, mon: "" })}>
              {useCases.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label} (${u.monthly.toFixed(2)}/mo)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Campaigns">
            <NumberInput value={values.camps ?? ""} onChange={(v) => set({ camps: v })} />
          </Field>
          <Field label="Brand registration" hint={brand === "standard" ? "$4.50 registration plus $41.50 vetting." : "One time."}>
            <NumberInput prefix="$" value={values.brandFee || brandFee.toFixed(2)} onChange={(v) => set({ brandFee: v })} />
          </Field>
          <Field label="Campaign vetting, each" hint="One time, and not refunded if a campaign fails.">
            <NumberInput prefix="$" value={values.vet || vetting.toFixed(2)} onChange={(v) => set({ vet: v })} />
          </Field>
          <Field label="Campaign fee, each" hint="Per month, from approval until you delete it.">
            <NumberInput prefix="$" value={values.mon || monthlyFee.toFixed(2)} onChange={(v) => set({ mon: v })} />
          </Field>
          <Field label="SMS segments per month" hint="Count segments, not messages.">
            <NumberInput value={values.segs ?? ""} onChange={(v) => set({ segs: v })} />
          </Field>
        </div>

        {overCampaigns ? <Notice tone="warn">{info.label} brands are limited to {info.maxCampaigns === 1 ? "one campaign" : `${info.maxCampaigns} campaigns unless you have a valid business reason`}.</Notice> : null}
        {warning ? <Notice tone="warn">{warning} Consider a higher brand type.</Notice> : null}

        <fieldset className="min-w-0">
          <legend className="display-3">Carrier fees per segment</legend>
          <p className="mt-1 text-[0.9375rem] leading-snug text-ink-soft">From Twilio&apos;s US SMS pricing. The even split is a starting point, not market data, so use your own mix if you know it.</p>
          <div className="mt-2 divide-y divide-line">
            {carriers.map((carrier) => (
              <div key={carrier.id} className="grid grid-cols-[minmax(0,1fr)_6.5rem_5rem] items-center gap-2 py-2">
                <span className="font-semibold leading-snug">{carrier.label}</span>
                <NumberInput prefix="$" ariaLabel={`${carrier.label} fee per segment`} value={values[`f_${carrier.id}`] || String(carrier.fee)} onChange={(v) => set({ [`f_${carrier.id}`]: v })} />
                <span className="relative block">
                  <NumberInput ariaLabel={`${carrier.label} share of your messages, in percent`} value={values[`s_${carrier.id}`] || String(carrier.share)} onChange={(v) => set({ [`s_${carrier.id}`]: v })} className="" />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-ink-soft">
                    %
                  </span>
                </span>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Toggle checked={includeBase} onChange={(next) => set({ base: next ? "1" : "0" })}>
            Include Twilio&apos;s own SMS price, so the total covers the full cost of sending.
          </Toggle>
          {includeBase ? (
            <Field label="Twilio price per segment" className="max-w-[12rem]">
              <NumberInput prefix="$" value={values.rate || String(baseRate)} onChange={(v) => set({ rate: v })} />
            </Field>
          ) : null}
        </div>
      </div>

      <aside aria-label="Your A2P estimate" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-md bg-sunken p-5">
          <p className="font-semibold">First year</p>
          <output aria-live="polite" className="mt-1 block font-display text-[2.75rem] font-bold leading-none tracking-tight tabular-nums">
            {money(result.firstYear)}
          </output>
          <p className="mt-2 text-[0.9375rem] leading-snug text-ink-soft">An estimate in US dollars, not a quote. Fees as of November 2026.</p>

          <h3 className="display-3 mt-5">Paid once</h3>
          <Lines
            rows={[
              ["Brand registration", result.brand],
              [`Campaign vetting x ${campaigns}`, result.vetting],
            ]}
          />
          <h3 className="display-3 mt-5">Paid every month</h3>
          <Lines
            rows={[
              [`Campaign fee x ${campaigns}`, result.campaignMonthly],
              [`Carrier fees at ${money(result.blendedCarrierFee)} a segment`, result.carrierMonthly],
              ...(includeBase ? ([["Twilio SMS price", result.baseMonthly]] as [string, number][]) : []),
            ]}
          />
          <dl className="mt-4 space-y-1 border-t border-line pt-3">
            <div className="flex justify-between gap-3 font-semibold">
              <dt>First month</dt>
              <dd className="tabular-nums">{money(result.firstMonth)}</dd>
            </div>
            <div className="flex justify-between gap-3 font-semibold">
              <dt>Each month after</dt>
              <dd className="tabular-nums">{money(result.monthly)}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <CopyButton label="Copy link to this estimate" copiedLabel="Link copied" getText={shareUrl} />
            <button type="button" onClick={reset} className="btn btn-ghost btn-sm cursor-pointer">
              Start over
            </button>
          </div>
        </div>
        <p className="mt-4 text-[0.875rem] leading-snug text-ink-soft">
          Sources:{" "}
          <a className="link" href="https://www.twilio.com/docs/trust-hub/registrations/a2p-10dlc-brand" rel="noopener">
            Twilio brand registration docs
          </a>
          ,{" "}
          <a className="link" href="https://support.twilio.com/hc/en-us/articles/1260803965530-Pricing-and-Fees-for-A2P-10DLC-Service" rel="noopener">
            A2P pricing and fees
          </a>
          ,{" "}
          <a className="link" href="https://www.twilio.com/en-us/sms/pricing/us" rel="noopener">
            US SMS pricing
          </a>
          .
        </p>
      </aside>
    </div>
  );
}

function Lines({ rows }: { rows: [string, number][] }) {
  return (
    <dl className="mt-1.5 space-y-1 text-[0.9375rem]">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline gap-2">
          <dt className="min-w-0 leading-snug">{label}</dt>
          <span aria-hidden="true" className="min-w-3 flex-1 border-b-2 border-dotted border-line" />
          <dd className="flex-none tabular-nums">{money(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
