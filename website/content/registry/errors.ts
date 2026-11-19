import { errorPath, errorTitle, twilioErrors } from "@/app/twilio-errors/_data";
import type { RegistryEntry } from "@/lib/registry-types";

export const errorsPages: RegistryEntry[] = [
  {
    path: "/twilio-errors",
    title: "Twilio error codes: meanings and fixes",
    label: "All error codes",
    description: "Search 40 common Twilio error codes for calls, SMS and sign-in. Each page explains the cause in plain English, with step-by-step fixes and billing notes.",
    section: "errors",
    keywords: ["twilio error codes", "twilio error", "twilio api error codes"],
    related: ["/guides/how-does-twilio-sms-work", "/guides/fix-twilio-error-30007", "/guides/fix-twilio-error-21610", "/guides/a2p-10dlc-registration-guide"],
  },
  ...twilioErrors.map(
    (error): RegistryEntry => ({
      path: errorPath(error.code),
      title: errorTitle(error),
      label: `Error ${error.code}`,
      description: error.description,
      section: "errors",
      keywords: error.keywords ?? [`twilio error ${error.code}`],
      related: [...error.related.map(errorPath), ...error.links],
      published: "2026-11-04",
    }),
  ),
];
