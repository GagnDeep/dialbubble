"use client";

import { useRef, useState, type ReactNode } from "react";

export const inputClass =
  "block w-full min-h-11 rounded-sm border border-line bg-canvas px-3 py-2 text-[1rem] text-ink placeholder:text-ink-soft/80";

export const textareaClass = `${inputClass} leading-relaxed`;

export function Field({ label, hint, className = "", children }: { label: ReactNode; hint?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1 block text-[0.9375rem] font-semibold leading-snug">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[0.875rem] leading-snug text-ink-soft">{hint}</span> : null}
    </label>
  );
}

export function NumberInput({
  value,
  onChange,
  prefix,
  ariaLabel,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  ariaLabel?: string;
  className?: string;
}) {
  // While someone edits, show their text even when it's empty, so a field doesn't snap back to its list rate.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <span className={`relative block ${className}`}>
      {prefix ? <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-ink-soft">{prefix}</span> : null}
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={ariaLabel}
        value={draft ?? value}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d.]/g, "");
          setDraft(next);
          onChange(next);
        }}
        onBlur={() => setDraft(null)}
        className={`${inputClass} tabular-nums ${prefix ? "pl-6" : ""}`}
      />
    </span>
  );
}

export function parseAmount(value: string | undefined): number {
  const n = parseFloat(value ?? "");
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdFine = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 });

/** Whole cents, except amounts under a cent, which would otherwise read as $0.00. */
export function money(n: number): string {
  if (n > 0 && n < 0.01) return usdFine.format(n);
  return usd.format(n);
}

export function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 size-6 flex-none cursor-pointer accent-[var(--color-mint-strong)]" />
      <span className="min-w-0 leading-snug">{children}</span>
    </label>
  );
}

export function Segmented<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-[0.9375rem] font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex min-h-11 cursor-pointer items-center rounded-sm border px-3 text-[0.9375rem] font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint-text ${
              value === option.value ? "border-mint-text bg-mint-tint text-ink" : "border-line text-ink-soft hover:bg-sunken"
            }`}
          >
            <input type="radio" className="sr-only" checked={value === option.value} onChange={() => onChange(option.value)} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type CopyState = "idle" | "copied" | "failed";

/** A copy button for light surfaces. Its label flips to confirm, and tone="dark" suits the code panes. */
export function CopyButton({
  getText,
  label = "Copy",
  copiedLabel = "Copied",
  tone = "light",
  disabled = false,
}: {
  getText: () => string;
  label?: string;
  copiedLabel?: string;
  tone?: "light" | "dark";
  disabled?: boolean;
}) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(getText());
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  const text = state === "copied" ? copiedLabel : state === "failed" ? "Select and copy instead" : label;
  const style =
    tone === "dark"
      ? "min-h-11 cursor-pointer rounded-sm px-3 text-[0.9375rem] font-semibold text-[#3edbc4] hover:bg-white/10"
      : "btn btn-ghost btn-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <button type="button" onClick={copy} disabled={disabled} className={style}>
      <span aria-live="polite">{text}</span>
    </button>
  );
}

export function SmallButton({
  onClick,
  children,
  active = false,
  disabled = false,
  ariaLabel,
  ariaPressed,
}: {
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`btn btn-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${active ? "btn-mint" : "btn-ghost"}`}
    >
      {children}
    </button>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "ok"; children: ReactNode }) {
  const styles = {
    info: "bg-sunken",
    warn: "bg-warn-tint",
    error: "bg-warn-tint shadow-[inset_3px_0_0_var(--error)]",
    ok: "bg-mint-tint",
  } as const;
  return <div className={`rounded-sm px-3 py-2.5 text-[0.9375rem] leading-snug ${styles[tone]}`}>{children}</div>;
}
