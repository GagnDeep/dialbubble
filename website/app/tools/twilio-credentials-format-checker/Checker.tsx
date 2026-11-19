"use client";

import { useState } from "react";
import { Field, Notice, SmallButton, Toggle, inputClass } from "../_components/ui";
import { checkCredential, type CredentialKind } from "../_lib/credentials";

const FIELDS: { kind: CredentialKind; label: string; hint: string; secret: boolean; example: string }[] = [
  { kind: "accountSid", label: "Account SID", hint: "AC followed by 32 hex characters.", secret: false, example: "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  { kind: "apiKeySid", label: "API key SID", hint: "SK followed by 32 hex characters.", secret: false, example: "SKaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  { kind: "authToken", label: "Auth Token", hint: "32 characters. Safer: type a made-up value of the same shape.", secret: true, example: "" },
  { kind: "apiKeySecret", label: "API key secret", hint: "32 characters. Shown once, when the key is created.", secret: true, example: "" },
];

const EMPTY: Record<CredentialKind, string> = { accountSid: "", apiKeySid: "", authToken: "", apiKeySecret: "" };

export function Checker() {
  const [values, setValues] = useState(EMPTY);
  const [reveal, setReveal] = useState(false);

  return (
    <div className="space-y-5">
      <Notice tone="warn">
        <strong>Don&apos;t paste a live Auth Token here, or anywhere you don&apos;t fully trust.</strong> This page only checks the shape of what you type, in your browser. It sends nothing, saves nothing and never tells you whether a credential works. If you&apos;ve pasted a token somewhere you shouldn&apos;t have, rotate it in the Twilio Console.
      </Notice>

      <div className="grid gap-5 md:grid-cols-2">
        {FIELDS.map((field) => {
          const check = checkCredential(field.kind, values[field.kind]);
          return (
            <div key={field.kind} className="min-w-0">
              <Field label={field.label} hint={field.hint}>
                <input
                  type={field.secret && !reveal ? "password" : "text"}
                  value={values[field.kind]}
                  onChange={(event) => setValues({ ...values, [field.kind]: event.target.value })}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                  placeholder={field.example || undefined}
                  className={`${inputClass} font-mono text-[0.9375rem]`}
                />
              </Field>
              <div aria-live="polite" className="mt-2">
                {check.state === "ok" ? <Notice tone="ok">{check.message}</Notice> : null}
                {check.state === "warning" ? <Notice tone="warn">{check.message}</Notice> : null}
                {check.state === "bad" ? <Notice tone="error">{check.message}</Notice> : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Toggle checked={reveal} onChange={setReveal}>
          Show what I type in the secret fields
        </Toggle>
        <SmallButton onClick={() => setValues(EMPTY)}>Clear everything</SmallButton>
      </div>
      <p className="text-[0.875rem] leading-snug text-ink-soft">A correct format doesn&apos;t mean a credential is valid, active or yours. Only a request to Twilio can show that, and this page never makes one.</p>
    </div>
  );
}
