import type { Screen } from "@/components/PhoneFrame";

export type FeatureGroup = {
  id: string;
  title: string;
  summary: string;
  screen: Screen;
  items: { name: string; text: string }[];
};

export const featureGroups: FeatureGroup[] = [
  {
    id: "calling",
    title: "Calling",
    summary: "Four ways to place a call from your Twilio number. The other person sees that number, not your personal one.",
    screen: "active-call",
    items: [
      { name: "Talk", text: "A two-way call on your regular phone. Twilio rings you first, you press any key, and only then is the other person dialed." },
      { name: "Voice Message", text: "Type your message and Twilio reads it aloud when they answer, using text-to-speech. You can loop it." },
      { name: "Play Audio", text: "Call someone and play an MP3 or WAV from a public link." },
      { name: "Custom TwiML", text: "Write any TwiML and run it on a call, with no webhook server to host." },
      { name: "Call recording", text: "Turn on recording for a call, then play it back or share it from the app." },
      { name: "Call history", text: "Recents with filters, call details and your recordings in one place." },
    ],
  },
  {
    id: "texting",
    title: "Texting",
    summary: "A proper inbox for your Twilio numbers, with threaded conversations for each number.",
    screen: "conversation",
    items: [
      { name: "SMS and MMS conversations", text: "Threads per number, with delivery status, a segment counter and picture viewing. MMS you send needs a public https link to the media." },
      { name: "Broadcast", text: "Send one message to many recipients, with throttled sending, progress and a result for each person." },
      { name: "Templates", text: "Save the messages you send often and drop them in with a tap." },
      { name: "Scheduled texts", text: "Pick a send time through a Twilio Messaging Service, and cancel it later if plans change." },
      { name: "Pins, drafts and codes", text: "Pin your top conversations, keep a draft in every thread, and copy sign-in codes with one tap." },
    ],
  },
  {
    id: "accounts",
    title: "Accounts and numbers",
    summary: "Everything you own at Twilio shows up on its own after you connect.",
    screen: "home",
    items: [
      { name: "Multiple accounts", text: "Add more than one Twilio account, give each its own color, and switch from Home." },
      { name: "Multiple numbers", text: "Nicknames and colors, default numbers for calling and texting, and a sync with Twilio." },
      { name: "Per-number caller ID", text: "Choose the number each call goes out from, including verified caller IDs." },
      { name: "Balance and usage", text: "Your balance, account status, a 7-day activity chart and monthly cost by category." },
      { name: "Number lookup", text: "Check a number with Twilio Lookup, plus the paid line-type and caller-name add-ons." },
      { name: "Global search", text: "Find anything across your messages, calls and numbers." },
    ],
  },
  {
    id: "everyday",
    title: "Help and everyday comforts",
    summary: "Twilio has a lot of moving parts. Dialbubble explains them as you go.",
    screen: "settings",
    items: [
      { name: "Guided onboarding", text: "A step-by-step setup that shows you exactly what to copy from the Twilio Console, and resumes if you leave partway." },
      { name: "Plain-English error guide", text: "Every Twilio error is translated into what went wrong and how to fix it." },
      { name: "Demo Mode", text: "Try every feature on simulated data. No Twilio account needed, nothing sent, nothing charged." },
      { name: "Face ID app lock", text: "Lock the app behind Face ID, with a privacy screen in the app switcher." },
      { name: "Siri and Shortcuts", text: "Send a text, call with a voice message or open the dialer by voice or from a Shortcut." },
      { name: "Contact names", text: "Optional: see names instead of numbers everywhere. Contacts are read on your iPhone and never uploaded." },
      { name: "Works offline", text: "Your latest calls and texts are saved on the iPhone, so the app opens instantly and still shows your history without a connection." },
      { name: "Badge and alerts", text: "Opt in to an icon badge for unread texts and missed calls, plus best-effort alerts while the app is closed." },
      { name: "CSV export", text: "Export every call and text as a spreadsheet-ready CSV file from Settings." },
    ],
  },
];

export const honestLimits = [
  { name: "No in-app calling", text: "Dialbubble doesn't do VoIP. A Talk call rings your regular phone through a bridge, so it bills two Twilio legs." },
  { name: "No instant push", text: "The app checks for new texts every 20 seconds while it's open. Alerts while it's closed are optional and best effort, because iOS decides when background checks run." },
  { name: "iPhone only", text: "Dialbubble needs iOS 26 or later. There's no Android or iPad version." },
  { name: "A Twilio account for real use", text: "Demo Mode works without one. Real calls and texts run on your own Twilio account." },
];
