"use client";

import { useMemo, type ReactNode } from "react";
import { useQueryState } from "../_components/useQueryState";
import { CopyButton, Field, Notice, NumberInput, Segmented, Toggle, inputClass, money, parseAmount } from "../_components/ui";
import {
  CARRIER_FEES,
  DEFAULT_NUMBER,
  DESTINATIONS,
  NUMBER_OPTIONS,
  RATES_AS_OF,
  RECORDING_RATE,
  STORAGE_RATE,
  estimate,
  getCarrier,
  getDestination,
  getNumberOption,
  voiceRate,
  type DestinationId,
  type LineType,
} from "../_lib/pricing";

const RATE_KEYS = ["rOut", "rLeg1", "rIn", "rSms", "rCarOut", "rSmsIn", "rCarIn", "rNum", "rRec", "rStore"] as const;
type RateKey = (typeof RATE_KEYS)[number];

const CLEAR_RATES: Record<string, string> = Object.fromEntries(RATE_KEYS.map((key) => [key, ""]));

const DEFAULTS: Record<string, string> = {
  c: "US",
  line: "mobile",
  num: "",
  ph: "",
  talk: "",
  carrier: "",
  out: "300",
  in: "100",
  tx: "500",
  rx: "200",
  seg: "1",
  nums: "1",
  rec: "0",
  other: "0",
  ...CLEAR_RATES,
};

const LINE_OPTIONS = [
  { value: "mobile", label: "Mobile" },
  { value: "landline", label: "Landline" },
] as const;

const short = (n: number) => String(Number(n.toFixed(4)));

export function Calculator() {
  const { values, set, reset, shareUrl } = useQueryState(DEFAULTS);

  const destination = getDestination(values.c ?? "US");
  const country = destination.id;
  const line = (values.line === "landline" ? "landline" : "mobile") as LineType;
  const number = getNumberOption(values.num || DEFAULT_NUMBER[country]);
  const phoneCountry = (DESTINATIONS.find((d) => d.id === values.ph)?.id ?? country) as DestinationId;
  const talk = values.talk === "1";
  const carriers = CARRIER_FEES[country];
  const carrier = getCarrier(country, values.carrier ?? "");

  const presets: Record<RateKey, number> = {
    rOut: voiceRate(country, line, number.country),
    rLeg1: voiceRate(phoneCountry, "mobile", number.country),
    rIn: number.inboundVoice,
    rSms: destination.sms,
    rCarOut: carrier?.out ?? 0,
    rSmsIn: number.inboundSms ?? 0,
    rCarIn: carrier?.in ?? 0,
    rNum: number.monthly,
    rRec: RECORDING_RATE,
    rStore: STORAGE_RATE,
  };

  const rateValue = (key: RateKey) => values[key] || short(presets[key]);
  const rate = (key: RateKey) => (values[key] ? parseAmount(values[key]) : presets[key]);
  const edited = RATE_KEYS.some((key) => values[key]);

  const result = useMemo(
    () =>
      estimate({
        outMinutes: parseAmount(values.out),
        inMinutes: parseAmount(values.in),
        textsOut: parseAmount(values.tx),
        textsIn: parseAmount(values.rx),
        segmentsPerText: parseAmount(values.seg) || 1,
        numbers: parseAmount(values.nums),
        recordingMinutes: parseAmount(values.rec),
        otherMonthly: parseAmount(values.other),
        talk,
        rates: {
          out: rate("rOut"),
          leg1: rate("rLeg1"),
          in: rate("rIn"),
          smsOut: rate("rSms"),
          carrierOut: rate("rCarOut"),
          smsIn: rate("rSmsIn"),
          carrierIn: rate("rCarIn"),
          number: rate("rNum"),
          recording: rate("rRec"),
          storage: rate("rStore"),
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- every input comes from values and the presets derived from it
    [values, talk, country, line, number.id, phoneCountry, carrier?.id],
  );

  const total = (id: string) => result.lines.find((l) => l.id === id)?.total ?? 0;
  const smsOutMissing = parseAmount(values.rx) > 0 && number.inboundSms === null;

  function summary() {
    const lines = result.lines.filter((l) => l.total > 0).map((l) => `${l.label}: ${money(l.total)} (${l.detail})`);
    return [
      `Twilio monthly estimate, ${destination.name}: ${money(result.total)}`,
      ...lines,
      `This is an estimate, not a quote. Rates checked ${RATES_AS_OF}. Check twilio.com/pricing.`,
      shareUrl(),
    ].join("\n");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
      <div className="min-w-0 space-y-8">
        <section aria-label="Countries and number" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country you call and text">
              <select className={inputClass} value={country} onChange={(event) => set({ c: event.target.value, num: "", ph: "", carrier: "", ...CLEAR_RATES })}>
                {DESTINATIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Your Twilio number">
              <select className={inputClass} value={number.id} onChange={(event) => set({ num: event.target.value, ...CLEAR_RATES })}>
                {NUMBER_OPTIONS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} (${n.monthly.toFixed(2)}/mo)
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Segmented legend="They answer on a" options={LINE_OPTIONS} value={line} onChange={(next) => set({ line: next, rOut: "" })} />
          {destination.voiceNote ? <Notice>{destination.voiceNote}</Notice> : null}
        </section>

        <section aria-label="Calls" className="space-y-3">
          <h2 className="display-3">Calls</h2>
          <Notice tone={talk ? "ok" : "info"}>
            <Toggle checked={talk} onChange={(next) => set({ talk: next ? "1" : "" })}>
              <strong>These are Dialbubble Talk calls.</strong> Twilio rings your phone first, you press a key, then it dials the other person. That&apos;s two call legs, and Twilio bills both.
            </Toggle>
            {talk ? (
              <Field label="Where your own phone is" className="mt-2">
                <select className={inputClass} value={phoneCountry} onChange={(event) => set({ ph: event.target.value, rLeg1: "" })}>
                  {DESTINATIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}, mobile
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
          </Notice>
          <div className="divide-y divide-line">
            {talk ? (
              <Row
                label="Leg 1: Twilio calls your phone"
                qty={<NumberInput ariaLabel="Outbound minutes" value={values.out ?? ""} onChange={(v) => set({ out: v })} />}
                qtyLabel="Minutes"
                rate={<NumberInput prefix="$" ariaLabel="Leg 1 rate per minute" value={rateValue("rLeg1")} onChange={(v) => set({ rLeg1: v })} />}
                rateLabel="Per minute"
                total={total("leg1")}
              />
            ) : null}
            <Row
              label={talk ? "Leg 2: Twilio calls the other person" : "Outbound calls"}
              qty={talk ? <Static>{parseAmount(values.out).toLocaleString("en-US")}</Static> : <NumberInput ariaLabel="Outbound minutes" value={values.out ?? ""} onChange={(v) => set({ out: v })} />}
              qtyLabel="Minutes"
              rate={<NumberInput prefix="$" ariaLabel="Outbound rate per minute" value={rateValue("rOut")} onChange={(v) => set({ rOut: v })} />}
              rateLabel="Per minute"
              total={talk ? total("leg2") : total("out")}
            />
            <Row
              label="Inbound calls"
              qty={<NumberInput ariaLabel="Inbound minutes" value={values.in ?? ""} onChange={(v) => set({ in: v })} />}
              qtyLabel="Minutes"
              rate={<NumberInput prefix="$" ariaLabel="Inbound rate per minute" value={rateValue("rIn")} onChange={(v) => set({ rIn: v })} />}
              rateLabel="Per minute"
              total={total("in")}
            />
            <Row
              label="Call recording"
              qty={<NumberInput ariaLabel="Recording minutes" value={values.rec ?? ""} onChange={(v) => set({ rec: v })} />}
              qtyLabel="Minutes"
              rate={<NumberInput prefix="$" ariaLabel="Recording rate per minute" value={rateValue("rRec")} onChange={(v) => set({ rRec: v })} />}
              rateLabel="Per minute"
              total={total("recording")}
            />
            <Row
              label="Recording storage for a month"
              qty={<Static>{parseAmount(values.rec).toLocaleString("en-US")}</Static>}
              qtyLabel="Minutes"
              rate={<NumberInput prefix="$" ariaLabel="Storage rate per minute per month" value={rateValue("rStore")} onChange={(v) => set({ rStore: v })} />}
              rateLabel="Per min, monthly"
              total={total("storage")}
            />
          </div>
        </section>

        <section aria-label="Texts" className="space-y-3">
          <h2 className="display-3">Texts</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Segments per text" hint="A long text or an emoji uses more. Work it out with the segment calculator.">
              <NumberInput value={values.seg ?? ""} onChange={(v) => set({ seg: v })} />
            </Field>
            {carriers ? (
              <Field label="Carrier fees for" hint="Fees differ by carrier. Pick your most common one, or type your own below.">
                <select className={inputClass} value={carrier?.id} onChange={(event) => set({ carrier: event.target.value, rCarOut: "", rCarIn: "" })}>
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Notice>Twilio says carrier fees may apply in {destination.name} but lists no amount on its page, so these start at $0. Add one if you see it on your bill.</Notice>
            )}
          </div>
          <div className="divide-y divide-line">
            <Row
              label="Texts sent"
              qty={<NumberInput ariaLabel="Texts sent" value={values.tx ?? ""} onChange={(v) => set({ tx: v })} />}
              qtyLabel="Texts"
              rate={<NumberInput prefix="$" ariaLabel="Price per segment sent" value={rateValue("rSms")} onChange={(v) => set({ rSms: v })} />}
              rateLabel="Per segment"
              total={total("smsOut")}
            />
            <Row
              label="Carrier fee on texts sent"
              qty={<Static>{(parseAmount(values.tx) * (parseAmount(values.seg) || 1)).toLocaleString("en-US")}</Static>}
              qtyLabel="Segments"
              rate={<NumberInput prefix="$" ariaLabel="Carrier fee per segment sent" value={rateValue("rCarOut")} onChange={(v) => set({ rCarOut: v })} />}
              rateLabel="Per segment"
              total={total("carrierOut")}
            />
            <Row
              label="Texts received"
              qty={<NumberInput ariaLabel="Texts received" value={values.rx ?? ""} onChange={(v) => set({ rx: v })} />}
              qtyLabel="Segments"
              rate={<NumberInput prefix="$" ariaLabel="Price per segment received" value={rateValue("rSmsIn")} onChange={(v) => set({ rSmsIn: v })} />}
              rateLabel="Per segment"
              total={total("smsIn")}
            />
            <Row
              label="Carrier fee on texts received"
              qty={<Static>{parseAmount(values.rx).toLocaleString("en-US")}</Static>}
              qtyLabel="Segments"
              rate={<NumberInput prefix="$" ariaLabel="Carrier fee per segment received" value={rateValue("rCarIn")} onChange={(v) => set({ rCarIn: v })} />}
              rateLabel="Per segment"
              total={total("carrierIn")}
            />
          </div>
          {smsOutMissing ? <Notice tone="warn">Twilio&apos;s list shows no SMS on a {number.label} number. Pick a mobile or local number that supports texts.</Notice> : null}
        </section>

        <section aria-label="Numbers and other fees" className="space-y-3">
          <h2 className="display-3">Numbers and other fees</h2>
          <div className="divide-y divide-line">
            <Row
              label="Phone numbers"
              qty={<NumberInput ariaLabel="How many phone numbers" value={values.nums ?? ""} onChange={(v) => set({ nums: v })} />}
              qtyLabel="Numbers"
              rate={<NumberInput prefix="$" ariaLabel="Monthly price per number" value={rateValue("rNum")} onChange={(v) => set({ rNum: v })} />}
              rateLabel="Per month"
              total={total("number")}
            />
          </div>
          <Field label="Other monthly fees" hint="For example, an A2P 10DLC campaign fee. The A2P calculator works this out." className="max-w-[16rem]">
            <NumberInput prefix="$" value={values.other ?? ""} onChange={(v) => set({ other: v })} />
          </Field>
        </section>
      </div>

      <aside aria-label="Your estimate" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-md bg-sunken p-5">
          <p className="font-semibold">Estimated monthly total</p>
          <output className="mt-1 block font-display text-[2.75rem] font-bold leading-none tracking-tight tabular-nums" aria-live="polite">
            {money(result.total)}
          </output>
          <p className="mt-2 text-[0.9375rem] leading-snug text-ink-soft">An estimate in US dollars, not a quote. Twilio&apos;s bill decides.</p>

          <dl className="mt-5 space-y-2 text-[0.9375rem]">
            {result.lines
              .filter((l) => l.total > 0)
              .map((l) => (
                <div key={l.id}>
                  <div className="flex items-baseline gap-2">
                    <dt className="min-w-0 font-semibold leading-snug">{l.label}</dt>
                    <span aria-hidden="true" className="min-w-3 flex-1 border-b-2 border-dotted border-line" />
                    <dd className="flex-none tabular-nums">{money(l.total)}</dd>
                  </div>
                  <p className="text-[0.875rem] leading-snug text-ink-soft">{l.detail}</p>
                </div>
              ))}
          </dl>

          {talk ? (
            <p className="mt-4 rounded-sm bg-surface p-3 text-[0.9375rem] leading-snug">
              The call to your own phone adds <strong className="tabular-nums">{money(result.talkExtra)}</strong> compared with a single outbound leg.
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <CopyButton label="Copy link to this estimate" copiedLabel="Link copied" getText={shareUrl} />
            <CopyButton label="Copy as text" getText={summary} />
            <button type="button" onClick={reset} className="btn btn-ghost btn-sm cursor-pointer">
              Start over
            </button>
          </div>
          {edited ? <p className="mt-3 text-[0.875rem] text-ink-soft">You&apos;ve edited at least one rate. Changing the country or number puts the list rates back.</p> : null}
        </div>

        <div className="mt-4 text-[0.875rem] leading-snug text-ink-soft">
          <p>
            Rates from Twilio&apos;s published pay-as-you-go pricing, as of {RATES_AS_OF}, and they can change. Sources for {destination.name}:{" "}
            <a className="link" href={destination.voiceSource} rel="noopener">
              voice pricing
            </a>
            ,{" "}
            <a className="link" href={destination.smsSource} rel="noopener">
              SMS pricing
            </a>
            ,{" "}
            <a className="link" href="https://assets.cdn.prod.twilio.com/pricing-csv/NumbersPricing.csv" rel="noopener">
              number price list
            </a>
            .
          </p>
        </div>
      </aside>
    </div>
  );
}

function Static({ children }: { children: ReactNode }) {
  return <span className="flex min-h-11 items-center px-1 tabular-nums text-ink-soft">{children}</span>;
}

function Row({ label, qty, qtyLabel, rate, rateLabel, total }: { label: string; qty: ReactNode; qtyLabel: string; rate: ReactNode; rateLabel: string; total: number }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,0.85fr)] items-end gap-x-2 gap-y-1 py-3 sm:grid-cols-[minmax(0,1.7fr)_5.5rem_6.5rem_5rem] sm:gap-x-3">
      <p className="col-span-3 font-semibold leading-snug sm:col-span-1 sm:self-center">{label}</p>
      <div className="min-w-0">
        <p className="mb-0.5 text-[0.8125rem] text-ink-soft">{qtyLabel}</p>
        {qty}
      </div>
      <div className="min-w-0">
        <p className="mb-0.5 text-[0.8125rem] text-ink-soft">{rateLabel}</p>
        {rate}
      </div>
      <div className="min-w-0 text-right">
        <p className="mb-0.5 text-[0.8125rem] text-ink-soft">Cost</p>
        <p className="flex min-h-11 items-center justify-end font-semibold tabular-nums">{money(total)}</p>
      </div>
    </div>
  );
}
