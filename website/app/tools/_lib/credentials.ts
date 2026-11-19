/** Format-only checks for Twilio credentials. Nothing here can tell whether a credential works. */

const article = (label: string) => (/^[aeiou]/i.test(label) ? "An" : "A");

export type CredentialKind = "accountSid" | "authToken" | "apiKeySid" | "apiKeySecret";
export type CredentialCheck = {
  state: "empty" | "ok" | "warning" | "bad";
  message: string;
};

const LABELS: Record<CredentialKind, string> = {
  accountSid: "Account SID",
  authToken: "Auth Token",
  apiKeySid: "API key SID",
  apiKeySecret: "API key secret",
};

/** Two-letter prefixes from Twilio's docs for resources people often paste by mistake. */
const OTHER_PREFIXES: Record<string, string> = {
  AC: "an Account SID",
  SK: "an API key SID",
  CA: "a Call SID",
  SM: "a Message SID",
  MM: "a Message SID",
  MG: "a Messaging Service SID",
  PN: "a Phone Number SID",
};

const SID_SHAPE = /^[A-Z]{2}[0-9a-fA-F]{32}$/;
const HEX32 = /^[0-9a-fA-F]{32}$/;

function pasteProblem(value: string, label: string): string | null {
  if (value !== value.trim()) return `Remove the space or line break at the start or end. A pasted ${label} often picks one up.`;
  if (/^["'].*["']$/.test(value)) return "Remove the quote marks. They aren't part of the value.";
  if (/\s/.test(value)) return "There's a space inside it. Copy the value again.";
  if (/^(ACX+|SKX+|your[_-]|<|\$\{?)/i.test(value)) return "This looks like a placeholder from sample code, not a real value.";
  return null;
}

function firstNonHex(value: string): string | null {
  const match = /[^0-9a-fA-F]/.exec(value);
  return match ? match[0] : null;
}

function checkSid(value: string, kind: "accountSid" | "apiKeySid"): CredentialCheck {
  const label = LABELS[kind];
  const expected = kind === "accountSid" ? "AC" : "SK";
  const problem = pasteProblem(value, label);
  if (problem) return { state: "bad", message: problem };

  if (HEX32.test(value)) {
    return {
      state: "bad",
      message: `This is 32 hex characters with no ${expected} at the start, which is the shape of an Auth Token or API key secret. A ${label} starts with ${expected}.`,
    };
  }
  const prefix = value.slice(0, 2);
  if (prefix !== expected) {
    if (prefix.toUpperCase() === expected) {
      return { state: "bad", message: `The prefix must be uppercase ${expected}.` };
    }
    const other = OTHER_PREFIXES[prefix];
    return {
      state: "bad",
      message: other
        ? `The ${prefix} prefix means this is ${other}. A ${label} starts with ${expected}.`
        : `${article(label)} ${label} starts with ${expected}, and this starts with ${prefix || "nothing"}.`,
    };
  }
  if (value.length !== 34) {
    return { state: "bad", message: `${article(label)} ${label} is 34 characters: ${expected} plus 32 hex characters. This has ${value.length}.` };
  }
  if (!SID_SHAPE.test(value)) {
    return { state: "bad", message: `After ${expected}, only 0-9 and a-f are allowed. "${firstNonHex(value.slice(2))}" isn't hex.` };
  }
  return { state: "ok", message: `The format is right: ${expected} plus 32 hex characters. That says nothing about whether it works.` };
}

function checkSecret(value: string, kind: "authToken" | "apiKeySecret"): CredentialCheck {
  const label = LABELS[kind];
  const problem = pasteProblem(value, label);
  if (problem) return { state: "bad", message: problem };
  const prefix = value.slice(0, 2);
  if (SID_SHAPE.test(value)) {
    return { state: "bad", message: `This is ${OTHER_PREFIXES[prefix] ?? `a SID starting with ${prefix}`}, not a ${label}. You may have swapped the two fields.` };
  }
  if (value.length !== 32) {
    return { state: "bad", message: `${article(label)} ${label} is 32 characters. This has ${value.length}.` };
  }
  if (!HEX32.test(value)) {
    return { state: "warning", message: `It has 32 characters, but "${firstNonHex(value)}" isn't hex, and these values are normally 32 hex characters. Copy it again to be sure.` };
  }
  return { state: "ok", message: "The format is right: 32 hex characters. That says nothing about whether it works." };
}

export function checkCredential(kind: CredentialKind, value: string): CredentialCheck {
  if (value === "") return { state: "empty", message: "" };
  return kind === "accountSid" || kind === "apiKeySid" ? checkSid(value, kind) : checkSecret(value, kind);
}
