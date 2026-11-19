"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { MarkedChars, OffenderList } from "../_components/sms-ui";
import { hashShareUrl, useHashValue, useQueryState } from "../_components/useQueryState";
import { CopyButton, Field, Notice, NumberInput, SmallButton, Toggle, money, parseAmount, textareaClass } from "../_components/ui";
import { TWILIO_MAX_BODY, analyzeSms, removeEmoji, replaceAccents, replaceSmartPunctuation } from "../_lib/sms";

const SAMPLE = "Hi Sam, it’s Dana from Riverside Dental. Your cleaning is on Tuesday at 3:15 PM. Reply C to confirm, or call us if you need to change it.";

const DEFAULTS: Record<string, string> = { price: "0.0083", fee: "0.0045", n: "1", tf: "" };

export function Calculator() {
  const shared = useHashValue("m");
  const [edited, setEdited] = useState<string | null>(null);
  const text = edited ?? shared ?? SAMPLE;
  const { values, set } = useQueryState(DEFAULTS);
  const tollFree = values.tf === "1";

  const deferred = useDeferredValue(text);
  const analysis = useMemo(() => analyzeSms(deferred, { tollFree }), [deferred, tollFree]);

  const smart = replaceSmartPunctuation(text);
  const noEmoji = removeEmoji(text);
  const noAccents = replaceAccents(text);
  const smartCount = useMemo(() => analyzeSms(smart, { tollFree }).segmentCount, [smart, tollFree]);
  const emojiCount = useMemo(() => analyzeSms(noEmoji, { tollFree }).segmentCount, [noEmoji, tollFree]);
  const accentCount = useMemo(() => analyzeSms(noAccents, { tollFree }).segmentCount, [noAccents, tollFree]);

  const pricePerSegment = parseAmount(values.price) + parseAmount(values.fee);
  const quantity = parseAmount(values.n);
  const cost = pricePerSegment * analysis.segmentCount * quantity;
  const isUnicode = analysis.encoding === "UCS-2";

  return (
    <div className="space-y-6">
      <Field label="Your message">
        <textarea
          rows={5}
          value={text}
          onChange={(event) => setEdited(event.target.value)}
          spellCheck={false}
          placeholder="Type or paste a text message"
          className={textareaClass}
        />
      </Field>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4" aria-live="polite">
        <Stat label="Segments" value={String(analysis.segmentCount)} big />
        <Stat label="Encoding" value={analysis.segmentCount === 0 ? "None yet" : analysis.encoding} warn={isUnicode} />
        <Stat label="Characters" value={analysis.characters.toLocaleString("en-US")} note={analysis.units !== analysis.characters ? `Counts as ${analysis.units.toLocaleString("en-US")}` : undefined} />
        <Stat label="Room left in this segment" value={String(analysis.remaining)} />
      </dl>

      {analysis.utf16Length > TWILIO_MAX_BODY ? (
        <Notice tone="warn">This is {analysis.utf16Length.toLocaleString("en-US")} characters. Twilio documents a limit of 1,600 for one message, so split it.</Notice>
      ) : null}

      {analysis.segmentCount > 0 ? (
        <section aria-label="How the message splits">
          <h2 className="display-3">How it splits</h2>
          <ol className="mt-3 grid gap-4 md:grid-cols-2">
            {analysis.segments.map((segment, index) => (
              <li key={index} className="min-w-0">
                <div className="rounded-[18px] rounded-bl-[4px] bg-mint-tint p-3.5">
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    <MarkedChars chars={segment.chars.map((c) => c.char)} />
                  </p>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[0.875rem] text-ink-soft">
                  <span className="flex-none font-semibold">Segment {index + 1}</span>
                  <span aria-hidden="true" className="h-1.5 min-w-4 flex-1 overflow-hidden rounded-full bg-sunken">
                    <span className="block h-full rounded-full bg-mint-strong" style={{ width: `${Math.min(100, (segment.units / segment.capacity) * 100)}%` }} />
                  </span>
                  <span className="flex-none tabular-nums">
                    {segment.units} of {segment.capacity}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {analysis.extensionCount > 0 && !isUnicode ? (
        <Notice>
          {analysis.extensionCount === 1 ? "One underlined character counts" : `${analysis.extensionCount} underlined characters each count`} as two, because {analysis.extensionCount === 1 ? "it comes" : "they come"} from the GSM-7 extension table.
        </Notice>
      ) : null}

      {isUnicode ? (
        <section aria-label="Characters that force UCS-2" className="space-y-3">
          <h2 className="display-3">What forces UCS-2 here</h2>
          <OffenderList offenders={analysis.offenders} />
          <div className="flex flex-wrap gap-2">
            {smart !== text ? (
              <SmallButton onClick={() => setEdited(smart)}>
                Replace smart punctuation ({smartCount} {smartCount === 1 ? "segment" : "segments"})
              </SmallButton>
            ) : null}
            {noEmoji !== text ? (
              <SmallButton onClick={() => setEdited(noEmoji)}>
                Remove emoji ({emojiCount} {emojiCount === 1 ? "segment" : "segments"})
              </SmallButton>
            ) : null}
            {noAccents !== text ? (
              <SmallButton onClick={() => setEdited(noAccents)}>
                Remove accents ({accentCount} {accentCount === 1 ? "segment" : "segments"})
              </SmallButton>
            ) : null}
          </div>
        </section>
      ) : null}

      <section aria-label="Sender and price" className="space-y-4 border-t border-line pt-6">
        <h2 className="display-3">What this message costs</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price per segment" hint="US list price, as of November 2026.">
            <NumberInput prefix="$" value={values.price ?? ""} onChange={(v) => set({ price: v })} />
          </Field>
          <Field label="Carrier fee per segment" hint="$0.0045 is T-Mobile's US fee. Set your own.">
            <NumberInput prefix="$" value={values.fee ?? ""} onChange={(v) => set({ fee: v })} />
          </Field>
          <Field label="Number of recipients">
            <NumberInput value={values.n ?? ""} onChange={(v) => set({ n: v })} />
          </Field>
        </div>
        <Toggle checked={tollFree} onChange={(next) => set({ tf: next ? "1" : "" })}>
          Sending from a toll-free number to the US or Canada. Twilio documents 152 GSM-7 or 66 UCS-2 characters per segment for these once a message splits.
        </Toggle>
        <p>
          <span className="font-display text-[2rem] font-bold tabular-nums">{money(cost)}</span>{" "}
          <span className="text-ink-soft">
            for {analysis.segmentCount} {analysis.segmentCount === 1 ? "segment" : "segments"} to {quantity.toLocaleString("en-US")} {quantity === 1 ? "recipient" : "recipients"}. An estimate, not a quote.
          </span>
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <CopyButton label="Copy message" getText={() => text} />
        <CopyButton label="Copy link with this message" copiedLabel="Link copied" getText={() => hashShareUrl("m", text)} />
        <SmallButton onClick={() => setEdited("")}>Clear</SmallButton>
      </div>
      <p className="text-[0.875rem] text-ink-soft">Your message stays in this browser tab. A copied link carries it after the # sign, a part of the URL that browsers don&apos;t send to servers.</p>
    </div>
  );
}

function Stat({ label, value, big, warn, note }: { label: string; value: string; big?: boolean; warn?: boolean; note?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.9375rem] leading-snug text-ink-soft">{label}</dt>
      <dd className={`font-display font-bold leading-tight tabular-nums ${big ? "text-[2.75rem] leading-none" : "text-[1.5rem]"} ${warn ? "text-warn" : ""}`}>{value}</dd>
      {note ? <dd className="text-[0.875rem] text-ink-soft">{note}</dd> : null}
    </div>
  );
}
