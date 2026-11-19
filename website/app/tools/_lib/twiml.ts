/**
 * TwiML schema, serializer, parser and validator. No DOM and no network, so it runs in the browser
 * and under `node --test`. Attributes and allowed values come from Twilio's TwiML docs for
 * Say, Play, Pause, Gather, Dial, Number, Record, Hangup and Redirect, read November 2026.
 */

export type AttrKind = "enum" | "bool" | "int" | "url" | "text" | "digits";

export type AttrSpec = {
  name: string;
  kind: AttrKind;
  help: string;
  values?: readonly string[];
  min?: number;
  max?: number;
  placeholder?: string;
  /** Shown in the main part of a block rather than under "More options". */
  primary?: boolean;
  /** Twilio documents this as deprecated. */
  deprecated?: boolean;
};

export type VerbName = "Say" | "Play" | "Pause" | "Gather" | "Dial" | "Number" | "Record" | "Hangup" | "Redirect";

export type VerbSpec = {
  name: VerbName;
  summary: string;
  attrs: readonly AttrSpec[];
  /** What the element's text content means. */
  text?: { label: string; placeholder: string; required: boolean; kind: "plain" | "url" | "phone"; multiline?: boolean };
  children?: readonly VerbName[];
};

const METHOD = ["GET", "POST"] as const;
const BOOL = ["true", "false"] as const;
const SPEECH_MODELS = [
  "default",
  "numbers_and_commands",
  "phone_call",
  "experimental_conversations",
  "experimental_utterances",
  "googlev2_long",
  "googlev2_short",
  "googlev2_telephony",
  "googlev2_telephony_short",
  "googlev2_chirp_3",
  "deepgram_nova-2",
  "deepgram_nova-3",
] as const;
const RING_TONES = "at au bg br be ch cl cn cz de dk ee es fi fr gr hu il in it lt jp mx my nl no nz ph pl pt ru se sg th uk us us-old tw ve za".split(" ");

export const VOICE_SUGGESTIONS = [
  "man",
  "woman",
  "Polly.Joanna-Neural",
  "Polly.Matthew-Neural",
  "Polly.Joanna-Generative",
  "Polly.Amy-Neural",
  "Google.en-US-Chirp3-HD-Aoede",
] as const;

export const VERBS: Record<VerbName, VerbSpec> = {
  Say: {
    name: "Say",
    summary: "Reads text aloud",
    text: { label: "Text to speak", placeholder: "Thanks for calling.", required: true, kind: "plain", multiline: true },
    attrs: [
      { name: "voice", kind: "text", primary: true, help: "man, woman, or a Polly or Google voice name. Default is man.", placeholder: "Polly.Joanna-Neural" },
      { name: "language", kind: "text", help: "Language code such as en-GB. Default is en-US.", placeholder: "en-US" },
      { name: "loop", kind: "int", min: 0, help: "How many times to repeat. 0 repeats until the call ends or 1,000 times. Default is 1." },
    ],
  },
  Play: {
    name: "Play",
    summary: "Plays an audio file or sends tones",
    text: { label: "Audio URL", placeholder: "https://example.com/hello.mp3", required: false, kind: "url" },
    attrs: [
      { name: "loop", kind: "int", min: 0, help: "How many times to repeat. 0 repeats until the call ends or 1,000 times. Default is 1." },
      { name: "digits", kind: "digits", help: "Tones to play instead of audio: 0-9, A-D, #, *. w waits 0.5 s and W waits 1 s.", placeholder: "wwww1928" },
    ],
  },
  Pause: {
    name: "Pause",
    summary: "Waits in silence",
    attrs: [{ name: "length", kind: "int", min: 1, primary: true, help: "Seconds of silence. Default is 1.", placeholder: "1" }],
  },
  Gather: {
    name: "Gather",
    summary: "Collects key presses or speech",
    children: ["Say", "Play", "Pause"],
    attrs: [
      { name: "action", kind: "url", primary: true, help: "Where Twilio sends the input. Default is the current document URL.", placeholder: "https://example.com/menu" },
      { name: "method", kind: "enum", values: METHOD, primary: true, help: "How to request the action URL. Default is POST." },
      { name: "numDigits", kind: "int", min: 1, primary: true, help: "Stop after this many digits. Default is no limit." },
      { name: "timeout", kind: "text", primary: true, help: "Seconds to wait for input, or auto. Default is 5.", placeholder: "5" },
      { name: "input", kind: "enum", values: ["dtmf", "speech", "dtmf speech"], help: "What to listen for. Default is dtmf." },
      { name: "finishOnKey", kind: "text", help: "Key that ends input: 0-9, # or *. Default is #.", placeholder: "#" },
      { name: "actionOnEmptyResult", kind: "bool", values: BOOL, help: "Call the action URL even with no input. Default is false." },
      { name: "hints", kind: "text", help: "Comma-separated words or phrases to expect, up to 500 entries." },
      { name: "language", kind: "text", help: "Speech recognition language. Default is en-US.", placeholder: "en-US" },
      { name: "speechModel", kind: "enum", values: SPEECH_MODELS, help: "Speech recognition model. Default is default." },
      { name: "speechTimeout", kind: "text", help: "Seconds of silence that end speech input, or auto. Default is the timeout value.", placeholder: "auto" },
      { name: "profanityFilter", kind: "bool", values: BOOL, help: "Mask profanity in speech results. Default is true." },
      { name: "partialResultCallback", kind: "url", help: "URL that receives interim speech results." },
      { name: "partialResultCallbackMethod", kind: "enum", values: METHOD, help: "Method for partial results. Default is POST." },
      { name: "enhanced", kind: "bool", values: BOOL, deprecated: true, help: "Deprecated by Twilio." },
    ],
  },
  Dial: {
    name: "Dial",
    summary: "Connects the call to another number",
    children: ["Number"],
    text: { label: "Number to dial (or add Number blocks)", placeholder: "+14155550100", required: false, kind: "phone" },
    attrs: [
      { name: "callerId", kind: "text", primary: true, help: "The number the other person sees. Must be a number you can use on Twilio.", placeholder: "+14155550101" },
      { name: "timeout", kind: "int", min: 5, max: 600, primary: true, help: "Seconds to let it ring, from 5 to 600. Default is 30." },
      { name: "answerOnBridge", kind: "bool", values: BOOL, primary: true, help: "Keep the caller hearing ringing until the other person answers. Default is false." },
      { name: "record", kind: "enum", values: ["do-not-record", "record-from-answer", "record-from-ringing", "record-from-answer-dual", "record-from-ringing-dual", "true", "false"], primary: true, help: "Whether to record the call. Default is do-not-record." },
      { name: "action", kind: "url", help: "URL to request when the dial ends. Without one, the call continues with the next verb." },
      { name: "method", kind: "enum", values: METHOD, help: "Method for the action URL. Default is POST." },
      { name: "hangupOnStar", kind: "bool", values: BOOL, help: "Let the caller end the other leg by pressing *. Default is false." },
      { name: "timeLimit", kind: "int", min: 1, help: "Maximum call length in seconds. Default is 14400 (4 hours)." },
      { name: "ringTone", kind: "enum", values: RING_TONES, help: "Ringback tone country. Default is the carrier's." },
      { name: "trim", kind: "enum", values: ["trim-silence", "do-not-trim"], help: "Trim silence from recordings." },
      { name: "recordingStatusCallback", kind: "url", help: "URL told about recording status." },
      { name: "recordingStatusCallbackMethod", kind: "enum", values: METHOD, help: "Default is POST." },
      { name: "recordingStatusCallbackEvent", kind: "text", help: "in-progress, completed or absent, separated by spaces. Default is completed.", placeholder: "completed" },
      { name: "recordingTrack", kind: "enum", values: ["inbound", "outbound", "both"], help: "Which audio to record. Default is both." },
      { name: "callReason", kind: "text", max: 50, help: "Reason shown to the callee, up to 50 characters." },
      { name: "referUrl", kind: "url", help: "URL Twilio requests on a SIP REFER." },
      { name: "referMethod", kind: "enum", values: METHOD, help: "Default is POST." },
      { name: "sequential", kind: "bool", values: BOOL, help: "Whether nested numbers are dialed in order. See Twilio's Dial docs." },
      { name: "recordingConfigurationId", kind: "text", help: "Recording configuration ID." },
    ],
  },
  Number: {
    name: "Number",
    summary: "A phone number inside Dial",
    text: { label: "Phone number", placeholder: "+14155550100", required: true, kind: "phone" },
    attrs: [
      { name: "sendDigits", kind: "digits", primary: true, help: "Keys to press after the call connects, for extensions: 0-9, A-D, #, *. w waits 0.5 s.", placeholder: "wwww1928" },
      { name: "url", kind: "url", help: "TwiML the called party hears before being connected." },
      { name: "method", kind: "enum", values: METHOD, help: "Method for url. Default is POST." },
      { name: "byoc", kind: "text", help: "BYOC trunk SID." },
      { name: "statusCallback", kind: "url", help: "URL told about this leg's status." },
      { name: "statusCallbackEvent", kind: "text", help: "initiated, ringing, answered or completed, separated by spaces. Default is completed.", placeholder: "completed" },
      { name: "statusCallbackMethod", kind: "enum", values: METHOD, help: "Default is POST." },
      { name: "machineDetection", kind: "enum", values: ["Enable", "DetectMessageEnd"], help: "Answering machine detection. Billed separately." },
      { name: "machineDetectionTimeout", kind: "int", min: 3, max: 60, help: "3 to 60 seconds. Default is 30." },
      { name: "machineDetectionSpeechThreshold", kind: "int", min: 1000, max: 6000, help: "1000 to 6000 ms. Default is 2400." },
      { name: "machineDetectionSpeechEndThreshold", kind: "int", min: 500, max: 5000, help: "500 to 5000 ms. Default is 1200." },
      { name: "machineDetectionSilenceTimeout", kind: "int", min: 2000, max: 10000, help: "2000 to 10000 ms. Default is 5000." },
      { name: "amdStatusCallback", kind: "url", help: "URL told the detection result." },
      { name: "amdStatusCallbackMethod", kind: "enum", values: METHOD, help: "Default is POST." },
    ],
  },
  Record: {
    name: "Record",
    summary: "Records the caller",
    attrs: [
      { name: "action", kind: "url", primary: true, help: "URL requested when recording ends. Default is the current document URL.", placeholder: "https://example.com/after-record" },
      { name: "maxLength", kind: "int", min: 2, max: 86400, primary: true, help: "Maximum seconds. Default is 3600." },
      { name: "playBeep", kind: "bool", values: BOOL, primary: true, help: "Beep before recording. Default is true." },
      { name: "timeout", kind: "int", min: 1, help: "Seconds of silence that end the recording. Default is 5." },
      { name: "finishOnKey", kind: "text", help: "Keys that end recording. Default is 1234567890*#.", placeholder: "#" },
      { name: "method", kind: "enum", values: METHOD, help: "Method for the action URL. Default is POST." },
      { name: "trim", kind: "enum", values: ["trim-silence", "do-not-trim"], help: "Default is trim-silence." },
      { name: "transcribe", kind: "bool", values: BOOL, help: "Transcribe the recording. Billed separately. Default is false." },
      { name: "transcribeCallback", kind: "url", help: "URL that receives the transcription." },
      { name: "recordingStatusCallback", kind: "url", help: "URL told about recording status." },
      { name: "recordingStatusCallbackMethod", kind: "enum", values: METHOD, help: "Default is POST." },
      { name: "recordingStatusCallbackEvent", kind: "text", help: "in-progress, completed or absent, separated by spaces. Default is completed.", placeholder: "completed" },
      { name: "recordingConfigurationId", kind: "text", help: "Recording configuration ID." },
    ],
  },
  Hangup: { name: "Hangup", summary: "Ends the call", attrs: [] },
  Redirect: {
    name: "Redirect",
    summary: "Moves the call to other TwiML",
    text: { label: "TwiML URL", placeholder: "https://example.com/next", required: true, kind: "url" },
    attrs: [{ name: "method", kind: "enum", values: METHOD, primary: true, help: "Default is POST." }],
  },
};

export const TOP_LEVEL_VERBS: readonly VerbName[] = ["Say", "Play", "Pause", "Gather", "Dial", "Record", "Redirect", "Hangup"];

/** Verbs in Twilio's voice docs that this builder doesn't edit. The validator accepts them without checking attributes. */
const OTHER_VOICE_VERBS = new Set(["Enqueue", "Leave", "Refer", "Reject", "Connect", "Start", "Stop", "Pay", "Prompt"]);
const OTHER_DIAL_NOUNS = new Set(["Client", "Conference", "Sip", "Application", "WhatsApp", "Queue"]);
const SSML_TAGS = new Set(["break", "emphasis", "lang", "p", "phoneme", "prosody", "s", "say-as", "sub", "w", "amazon:effect", "amazon:domain"]);

export const INLINE_LIMIT = 4000;

/** Twilio's documented per-<Say> character limits by voice family. */
export function sayLimit(voice: string | undefined): { limit: number; family: string } {
  if (voice?.startsWith("Polly.")) return { limit: 3000, family: "Amazon Polly" };
  if (voice?.startsWith("Google.")) return { limit: 5000, family: "Google" };
  if (voice?.startsWith("ElevenLabs.")) return { limit: 5000, family: "ElevenLabs" };
  return { limit: 4000, family: "basic" };
}

// ----- Builder model -----

export type TwimlNode = {
  id: number;
  verb: VerbName;
  attrs: Record<string, string>;
  text: string;
  children: TwimlNode[];
};

let nextId = 1;

export function makeNode(verb: VerbName, attrs: Record<string, string> = {}, text = "", children: TwimlNode[] = []): TwimlNode {
  return { id: nextId++, verb, attrs, text, children };
}

export function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

function nodeOpen(node: TwimlNode): string {
  const attrs = Object.entries(node.attrs).map(([key, value]) => ` ${key}="${escapeAttr(value)}"`).join("");
  return `<${node.verb}${attrs}`;
}

function serializeNode(node: TwimlNode, indent: string, pretty: boolean): string {
  const nl = pretty ? "\n" : "";
  const pad = pretty ? indent : "";
  const open = nodeOpen(node);
  const text = node.text;
  if (node.children.length === 0 && text === "") return `${pad}${open}/>`;
  if (node.children.length === 0) return `${pad}${open}>${escapeText(text)}</${node.verb}>`;
  const inner = node.children.map((c) => serializeNode(c, `${indent}  `, pretty)).join(nl);
  const textLine = text ? `${pretty ? `${indent}  ` : ""}${escapeText(text)}${nl}` : "";
  return `${pad}${open}>${nl}${textLine}${inner}${nl}${pad}</${node.verb}>`;
}

/** Readable TwiML with an XML declaration, for a TwiML Bin or a webhook response. */
export function toPrettyXml(nodes: TwimlNode[]): string {
  const body = nodes.map((n) => serializeNode(n, "  ", true)).join("\n");
  const inner = body ? `<Response>\n${body}\n</Response>` : "<Response/>";
  return `<?xml version="1.0" encoding="UTF-8"?>\n${inner}`;
}

/** One line with no declaration, which is the shortest form for the Twiml parameter of the Calls API. */
export function toInlineXml(nodes: TwimlNode[]): string {
  const body = nodes.map((n) => serializeNode(n, "", false)).join("");
  return body ? `<Response>${body}</Response>` : "<Response/>";
}

/** The Echo Twimlet URL that serves the given TwiML, with every reserved character encoded. */
export function echoTwimletUrl(twiml: string): string {
  const encoded = encodeURIComponent(twiml).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `https://twimlets.com/echo?Twiml=${encoded}`;
}

// ----- Templates -----

export type Template = { id: string; label: string; description: string; build: () => TwimlNode[] };

const SAMPLE_CALLER_ID = "+14155550101";
const SAMPLE_OTHER = "+14155550100";
const VOICE = { voice: "Polly.Joanna-Neural" };

export const TEMPLATES: readonly Template[] = [
  {
    id: "bridge",
    label: "Press a key to connect",
    description: "Rings you first, then dials the other person once you press a key. Needs no server, thanks to the Echo Twimlet.",
    build: () => {
      const next = [
        makeNode("Say", { ...VOICE }, "Connecting."),
        makeNode("Dial", { callerId: SAMPLE_CALLER_ID, answerOnBridge: "true", timeout: "30" }, "", [makeNode("Number", {}, SAMPLE_OTHER)]),
      ];
      return [
        makeNode("Gather", { numDigits: "1", timeout: "8", method: "GET", action: echoTwimletUrl(toInlineXml(next)) }, "", [
          makeNode("Say", { ...VOICE, loop: "2" }, "Press any key to connect."),
        ]),
        makeNode("Say", { ...VOICE }, "No key pressed, so the call was cancelled. Goodbye."),
        makeNode("Hangup"),
      ];
    },
  },
  {
    id: "message",
    label: "Voice message",
    description: "Reads a message twice, then ends the call.",
    build: () => [makeNode("Say", { ...VOICE, loop: "2" }, "Hello. Your appointment is tomorrow at 10 AM."), makeNode("Hangup")],
  },
  {
    id: "audio",
    label: "Play audio",
    description: "Plays an audio file from a public URL.",
    build: () => [makeNode("Play", {}, "https://example.com/message.mp3")],
  },
  {
    id: "forward",
    label: "Forward a call",
    description: "Sends an incoming call to another number, and speaks if nobody answers.",
    build: () => [
      makeNode("Dial", { timeout: "20", answerOnBridge: "true" }, "", [makeNode("Number", {}, SAMPLE_OTHER)]),
      makeNode("Say", { ...VOICE }, "Sorry, nobody could take your call."),
    ],
  },
  {
    id: "menu",
    label: "Phone menu",
    description: "Asks the caller to press a key and sends the digit to your URL.",
    build: () => [
      makeNode("Gather", { action: "https://example.com/menu", numDigits: "1", timeout: "6" }, "", [
        makeNode("Say", { ...VOICE }, "For sales, press 1. For support, press 2."),
      ]),
      makeNode("Say", { ...VOICE }, "We didn't get a key press. Goodbye."),
    ],
  },
  {
    id: "voicemail",
    label: "Voicemail",
    description: "Asks for a message and records up to two minutes.",
    build: () => [
      makeNode("Say", { ...VOICE }, "Please leave a message after the beep."),
      makeNode("Record", { maxLength: "120", playBeep: "true", action: "https://example.com/after-record" }),
      makeNode("Say", { ...VOICE }, "We didn't get a recording. Goodbye."),
    ],
  },
];

// ----- XML parser -----

export type Severity = "error" | "warning" | "info";
export type Issue = { severity: Severity; message: string; line?: number; column?: number };

export type XmlAttr = { name: string; value: string; line: number; column: number };
export type XmlElement = {
  type: "element";
  name: string;
  attrs: XmlAttr[];
  children: (XmlElement | XmlText)[];
  line: number;
  column: number;
};
export type XmlText = { type: "text"; value: string; line: number; column: number };

const NAME = /[A-Za-z_][\w.:-]*/y;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

export function parseXml(source: string): { root: XmlElement | null; issues: Issue[] } {
  const issues: Issue[] = [];
  const lineStarts = [0];
  for (let i = 0; i < source.length; i++) if (source[i] === "\n") lineStarts.push(i + 1);

  const position = (index: number) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if ((lineStarts[mid] ?? 0) <= index) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, column: index - (lineStarts[lo] ?? 0) + 1 };
  };
  const error = (message: string, index: number) => issues.push({ severity: "error", message, ...position(index) });

  const decode = (raw: string, offset: number): string =>
    raw.replace(/&([^;&\s]{0,12});?/g, (match, name: string, at: number) => {
      if (!match.endsWith(";")) {
        error(`An & has to be written as &amp;. Found "${match.slice(0, 12)}".`, offset + at);
        return match;
      }
      if (name.startsWith("#")) {
        const code = name[1] === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
        if (Number.isNaN(code) || code > 0x10ffff) {
          error(`"${match}" isn't a valid character reference.`, offset + at);
          return match;
        }
        return String.fromCodePoint(code);
      }
      const known = ENTITIES[name];
      if (known === undefined) {
        error(`"${match}" isn't a known XML entity. Write & as &amp;.`, offset + at);
        return match;
      }
      return known;
    });

  let i = 0;
  let root: XmlElement | null = null;
  const stack: XmlElement[] = [];

  const skipSpace = () => {
    while (i < source.length && /\s/.test(source[i] ?? "")) i++;
  };
  const readName = (): string | null => {
    NAME.lastIndex = i;
    const match = NAME.exec(source);
    if (!match) return null;
    i += match[0].length;
    return match[0];
  };

  if (source.charCodeAt(0) === 0xfeff) i = 1;

  while (i < source.length) {
    const current = stack[stack.length - 1];

    if (source[i] !== "<") {
      const start = i;
      const next = source.indexOf("<", i);
      i = next === -1 ? source.length : next;
      const raw = source.slice(start, i);
      if (raw.trim() === "") continue;
      const first = start + (raw.length - raw.trimStart().length);
      if (!current) {
        error(root ? "There's text after the closing </Response>." : "There's text before <Response>. The document has to start with <Response>.", first);
        continue;
      }
      current.children.push({ type: "text", value: decode(raw, start), ...position(first) });
      continue;
    }

    if (source.startsWith("<?", i)) {
      const end = source.indexOf("?>", i);
      if (i !== 0 && source.slice(0, i).trim() !== "" && source.slice(0, i).replace(/^﻿/, "").trim() !== "") {
        error("The XML declaration has to come first.", i);
      }
      if (end === -1) {
        error("The <? isn't closed with ?>.", i);
        break;
      }
      i = end + 2;
      continue;
    }
    if (source.startsWith("<!--", i)) {
      const end = source.indexOf("-->", i);
      if (end === -1) {
        error("This comment isn't closed with -->.", i);
        break;
      }
      i = end + 3;
      continue;
    }
    if (source.startsWith("<![CDATA[", i)) {
      const end = source.indexOf("]]>", i);
      if (end === -1) {
        error("This CDATA section isn't closed with ]]>.", i);
        break;
      }
      if (current) current.children.push({ type: "text", value: source.slice(i + 9, end), ...position(i) });
      else error("CDATA has to be inside <Response>.", i);
      i = end + 3;
      continue;
    }
    if (source.startsWith("<!", i)) {
      error("DOCTYPE and other declarations don't belong in TwiML.", i);
      const end = source.indexOf(">", i);
      if (end === -1) break;
      i = end + 1;
      continue;
    }

    if (source.startsWith("</", i)) {
      const tagStart = i;
      i += 2;
      const name = readName();
      skipSpace();
      if (!name || source[i] !== ">") {
        error("This closing tag is malformed.", tagStart);
        const end = source.indexOf(">", i);
        if (end === -1) break;
        i = end + 1;
        continue;
      }
      i++;
      if (!current) {
        error(`</${name}> has no matching opening tag.`, tagStart);
        continue;
      }
      if (current.name !== name) {
        const open = stack.some((el) => el.name === name);
        error(`</${name}> doesn't match <${current.name}>, opened on line ${current.line}. ${open ? `Close <${current.name}> first.` : `Remove it or fix the spelling.`}`, tagStart);
        if (!open) continue;
        while (stack.length > 0 && stack[stack.length - 1]?.name !== name) stack.pop();
      }
      stack.pop();
      continue;
    }

    // Opening tag
    const tagStart = i;
    i++;
    const name = readName();
    if (!name) {
      error('A raw "<" has to be written as &lt;.', tagStart);
      continue;
    }
    const element: XmlElement = { type: "element", name, attrs: [], children: [], ...position(tagStart) };
    let selfClosed = false;
    let closed = false;
    while (i < source.length) {
      skipSpace();
      const c = source[i];
      if (c === ">") {
        i++;
        closed = true;
        break;
      }
      if (c === "/" && source[i + 1] === ">") {
        i += 2;
        selfClosed = true;
        closed = true;
        break;
      }
      const attrStart = i;
      const attrName = readName();
      if (!attrName) {
        error(`Unexpected "${c}" in the <${name}> tag.`, i);
        i++;
        continue;
      }
      skipSpace();
      if (source[i] !== "=") {
        error(`The ${attrName} attribute on <${name}> needs a value, like ${attrName}="...".`, attrStart);
        continue;
      }
      i++;
      skipSpace();
      const quote = source[i];
      if (quote !== '"' && quote !== "'") {
        error(`The value of ${attrName} on <${name}> has to be in quotes.`, attrStart);
        while (i < source.length && !/[\s/>]/.test(source[i] ?? "")) i++;
        continue;
      }
      const valueStart = i + 1;
      const end = source.indexOf(quote, valueStart);
      if (end === -1) {
        error(`The value of ${attrName} on <${name}> never closes its quote.`, attrStart);
        i = source.length;
        break;
      }
      const rawValue = source.slice(valueStart, end);
      if (rawValue.includes("<")) error(`A "<" inside ${attrName} has to be written as &lt;.`, valueStart + rawValue.indexOf("<"));
      if (element.attrs.some((a) => a.name === attrName)) error(`<${name}> has ${attrName} twice.`, attrStart);
      element.attrs.push({ name: attrName, value: decode(rawValue, valueStart), ...position(attrStart) });
      i = end + 1;
    }
    if (!closed) {
      error(`The <${name}> tag is never closed with >.`, tagStart);
      break;
    }

    if (current) current.children.push(element);
    else if (root) error(`Only one root element is allowed, but <${name}> comes after </${root.name}>.`, tagStart);
    else root = element;
    if (!selfClosed && (current || root === element)) stack.push(element);
  }

  for (const el of stack) {
    issues.push({ severity: "error", message: `<${el.name}> is never closed.`, line: el.line, column: el.column });
  }
  if (!root && issues.length === 0) issues.push({ severity: "error", message: "There's nothing to check. Paste a <Response> document." });

  return { root, issues };
}

// ----- Validator -----

function suggestName(name: string, options: Iterable<string>): string | null {
  const lower = name.toLowerCase();
  for (const option of options) if (option.toLowerCase() === lower) return option;
  return null;
}

const E164 = /^\+[1-9]\d{1,14}$/;

function textOf(el: XmlElement): string {
  return el.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim();
}

function childElements(el: XmlElement): XmlElement[] {
  return el.children.filter((c): c is XmlElement => c.type === "element");
}

function checkAttrs(el: XmlElement, spec: VerbSpec, issues: Issue[]) {
  const known = new Map(spec.attrs.map((a) => [a.name, a]));
  for (const attr of el.attrs) {
    const at = { line: attr.line, column: attr.column };
    const attrSpec = known.get(attr.name);
    if (!attrSpec) {
      const close = suggestName(attr.name, known.keys());
      issues.push({
        severity: "error",
        message: close ? `Attribute names are case-sensitive: use ${close} rather than ${attr.name}.` : `<${spec.name}> has no ${attr.name} attribute.`,
        ...at,
      });
      continue;
    }
    const value = attr.value;
    if (attrSpec.deprecated) issues.push({ severity: "warning", message: `${attr.name} on <${spec.name}> is deprecated.`, ...at });
    switch (attrSpec.kind) {
      case "enum":
      case "bool":
        if (!attrSpec.values?.includes(value)) {
          issues.push({ severity: "error", message: `${attr.name}="${value}" isn't allowed. Use ${(attrSpec.values ?? []).slice(0, 8).join(", ")}${(attrSpec.values?.length ?? 0) > 8 ? " or another documented value" : ""}.`, ...at });
        }
        break;
      case "int": {
        if (!/^\d+$/.test(value)) {
          issues.push({ severity: "error", message: `${attr.name} has to be a whole number, and "${value}" isn't.`, ...at });
          break;
        }
        const n = Number(value);
        if (attrSpec.min !== undefined && n < attrSpec.min) issues.push({ severity: "error", message: `${attr.name} is ${n}, and the minimum is ${attrSpec.min}.`, ...at });
        if (attrSpec.max !== undefined && n > attrSpec.max) issues.push({ severity: "error", message: `${attr.name} is ${n}, and the maximum is ${attrSpec.max}.`, ...at });
        break;
      }
      case "digits":
        if (!/^[0-9A-DWw#*]*$/.test(value)) issues.push({ severity: "error", message: `${attr.name} can only use 0-9, A-D, #, *, w and W.`, ...at });
        break;
      case "url":
        if (/\s/.test(value)) issues.push({ severity: "error", message: `${attr.name} has a space in it. Percent-encode it.`, ...at });
        else if (value === "") issues.push({ severity: "warning", message: `${attr.name} is empty.`, ...at });
        break;
      case "text":
        if (attrSpec.max !== undefined && value.length > attrSpec.max) {
          issues.push({ severity: "error", message: `${attr.name} is limited to ${attrSpec.max} characters, and this has ${value.length}.`, ...at });
        }
        break;
    }
  }
}

function checkPhone(value: string, where: string, el: XmlElement, issues: Issue[]) {
  if (!value || E164.test(value)) return;
  issues.push({ severity: "warning", message: `${where} "${value}" isn't in E.164 format, such as +14155550100.`, line: el.line, column: el.column });
}

function checkElement(el: XmlElement, parent: VerbSpec | null, issues: Issue[], inGather: boolean) {
  const at = { line: el.line, column: el.column };
  const allowed = parent ? (parent.children ?? []) : TOP_LEVEL_VERBS;
  const spec = VERBS[el.name as VerbName] as VerbSpec | undefined;

  if (!parent && OTHER_VOICE_VERBS.has(el.name)) {
    issues.push({ severity: "info", message: `<${el.name}> is a Twilio verb that this tool doesn't check in detail.`, ...at });
    return;
  }
  if (parent?.name === "Dial" && OTHER_DIAL_NOUNS.has(el.name)) {
    issues.push({ severity: "info", message: `<${el.name}> is a valid noun inside <Dial> that this tool doesn't check in detail.`, ...at });
    return;
  }
  if (!parent && el.name === "Number") {
    issues.push({ severity: "error", message: "<Number> only works inside <Dial>.", ...at });
    return;
  }
  if (!parent && (el.name === "Message" || el.name === "Sms")) {
    issues.push({ severity: "error", message: `<${el.name}> belongs to messaging TwiML, not voice calls.`, ...at });
    return;
  }
  if (!spec) {
    const close = suggestName(el.name, [...Object.keys(VERBS), ...OTHER_VOICE_VERBS, ...OTHER_DIAL_NOUNS]);
    issues.push({
      severity: "error",
      message: close ? `TwiML names are case-sensitive: use <${close}> rather than <${el.name}>.` : `<${el.name}> isn't a TwiML verb Twilio documents for voice.`,
      ...at,
    });
    return;
  }
  if (!allowed.includes(spec.name)) {
    const where = parent ? `inside <${parent.name}>` : "at the top level";
    const options = parent ? ` It accepts ${(parent.children ?? []).map((c) => `<${c}>`).join(", ")}.` : "";
    issues.push({ severity: "error", message: `<${spec.name}> can't go ${where}.${options}`, ...at });
    return;
  }

  checkAttrs(el, spec, issues);

  const text = textOf(el);
  const kids = childElements(el);

  if (spec.name === "Say") {
    for (const kid of kids) {
      if (!SSML_TAGS.has(kid.name)) issues.push({ severity: "error", message: `<${kid.name}> can't go inside <Say>. Only SSML tags can.`, line: kid.line, column: kid.column });
    }
    const hasContent = text !== "" || kids.length > 0;
    if (!hasContent) issues.push({ severity: "error", message: "<Say> needs text to speak.", ...at });
    const voice = el.attrs.find((a) => a.name === "voice")?.value;
    const { limit, family } = sayLimit(voice);
    if (text.length > limit) issues.push({ severity: "error", message: `This <Say> has ${text.length} characters, and ${family} voices take ${limit} at most.`, ...at });
    return;
  }

  if (!spec.children) {
    for (const kid of kids) {
      issues.push({ severity: "error", message: `<${kid.name}> can't go inside <${spec.name}>.`, line: kid.line, column: kid.column });
    }
  }

  switch (spec.name) {
    case "Play": {
      const digits = el.attrs.find((a) => a.name === "digits")?.value;
      if (!text && !digits) issues.push({ severity: "error", message: "<Play> needs an audio URL or a digits attribute.", ...at });
      if (text && digits) issues.push({ severity: "warning", message: "<Play> has both a URL and digits. Use one or the other.", ...at });
      if (digits && inGather) issues.push({ severity: "error", message: "Twilio doesn't allow digits on <Play> inside <Gather>.", ...at });
      if (text && /\s/.test(text)) issues.push({ severity: "error", message: "The audio URL has a space in it. Percent-encode it.", ...at });
      break;
    }
    case "Pause":
    case "Hangup":
    case "Record":
    case "Gather":
      if (text) issues.push({ severity: "error", message: `<${spec.name}> can't contain text. Put spoken words in a nested <Say>.`, ...at });
      break;
    case "Redirect":
      if (!text) issues.push({ severity: "error", message: "<Redirect> needs a URL between its tags.", ...at });
      else if (/\s/.test(text)) issues.push({ severity: "error", message: "The URL has a space in it. Percent-encode it.", ...at });
      break;
    case "Dial": {
      if (!text && kids.length === 0) issues.push({ severity: "error", message: "<Dial> needs a number or a nested noun such as <Number>.", ...at });
      if (text && kids.length > 0) issues.push({ severity: "warning", message: "<Dial> has both text and nested elements. Put every number in a <Number>.", ...at });
      checkPhone(text, "The number", el, issues);
      checkPhone(el.attrs.find((a) => a.name === "callerId")?.value ?? "", "callerId", el, issues);
      if (kids.filter((k) => k.name === "Number").length > 10) issues.push({ severity: "warning", message: "Twilio dials up to 10 <Number> nouns at once.", ...at });
      break;
    }
    case "Number":
      if (!text) issues.push({ severity: "error", message: "<Number> needs a phone number between its tags.", ...at });
      checkPhone(text, "The number", el, issues);
      break;
  }

  for (const kid of kids) {
    if (spec.children) checkElement(kid, spec, issues, spec.name === "Gather");
  }
}

/** Parses and checks TwiML. Errors stop a call from working as written, warnings are worth a look. */
export function validateTwiml(source: string): Issue[] {
  const { root, issues } = parseXml(source);
  if (!root) return issues;

  if (root.name !== "Response") {
    const hint = root.name.toLowerCase() === "response" ? ` Names are case-sensitive, so write <Response>.` : "";
    issues.push({ severity: "error", message: `The root element has to be <Response>, and this is <${root.name}>.${hint}`, line: root.line, column: root.column });
    return issues;
  }
  if (root.attrs.length > 0) {
    issues.push({ severity: "warning", message: "<Response> doesn't take attributes.", line: root.line, column: root.column });
  }
  for (const child of root.children) {
    if (child.type === "text") {
      issues.push({ severity: "error", message: `Text directly inside <Response> isn't allowed: "${child.value.trim().slice(0, 40)}". Put it in a <Say>.`, line: child.line, column: child.column });
    }
  }

  const verbs = childElements(root);
  verbs.forEach((verb, index) => {
    checkElement(verb, null, issues, false);
    const isEnd = verb.name === "Hangup" || verb.name === "Redirect" || verb.name === "Reject";
    const dialWithAction = verb.name === "Dial" && verb.attrs.some((a) => a.name === "action");
    const after = verbs[index + 1];
    if ((isEnd || dialWithAction) && after) {
      const why = dialWithAction ? "a <Dial> with an action hands the call to that URL" : `<${verb.name}> ends this document`;
      issues.push({ severity: "warning", message: `<${after.name}> will never run, because ${why}.`, line: after.line, column: after.column });
    }
  });

  if (verbs.length === 0 && issues.every((issue) => issue.severity !== "error")) {
    issues.push({ severity: "warning", message: "<Response> is empty, so Twilio hangs up straight away.", line: root.line, column: root.column });
  }

  const gathers = verbs.filter((v) => v.name === "Gather" && !v.attrs.some((a) => a.name === "action"));
  for (const gather of gathers) {
    issues.push({ severity: "info", message: "This <Gather> has no action, so Twilio returns to the document URL. If you send this TwiML inline, there's no document to return to, so set an action.", line: gather.line, column: gather.column });
  }

  const length = source.trim().length;
  if (length > INLINE_LIMIT) {
    issues.push({ severity: "warning", message: `This is ${length.toLocaleString("en-US")} characters. The Calls API takes 4,000 at most in its Twiml parameter, so host it at a URL instead.` });
  }

  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity] || (a.line ?? 0) - (b.line ?? 0));
}

/** Converts parsed TwiML into builder blocks. Anything the builder can't edit is listed in `skipped`. */
export function toNodes(source: string): { nodes: TwimlNode[]; skipped: string[] } | null {
  const { root } = parseXml(source);
  if (!root || root.name !== "Response") return null;
  const skipped: string[] = [];

  const convert = (el: XmlElement, parent: VerbSpec | null): TwimlNode | null => {
    const spec = VERBS[el.name as VerbName] as VerbSpec | undefined;
    const allowed = parent ? (parent.children ?? []) : TOP_LEVEL_VERBS;
    if (!spec || !allowed.includes(spec.name)) {
      skipped.push(el.name);
      return null;
    }
    const attrs: Record<string, string> = {};
    for (const attr of el.attrs) attrs[attr.name] = attr.value;
    const children = childElements(el)
      .map((kid) => convert(kid, spec))
      .filter((node): node is TwimlNode => node !== null);
    if (spec.name === "Say" && childElements(el).length > 0) skipped.pop();
    return makeNode(spec.name, attrs, textOf(el), children);
  };

  const nodes = childElements(root)
    .map((el) => convert(el, null))
    .filter((node): node is TwimlNode => node !== null);
  return { nodes, skipped };
}

// ----- Syntax highlighting -----

export type TokenKind = "punct" | "tag" | "attr" | "value" | "text" | "comment";
export type Token = { kind: TokenKind; value: string };

/** Splits XML into tokens for coloring. It's tolerant, because it also runs on half-typed input. */
export function tokenizeXml(xml: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<\/?[^<>]*>?/g;
  let last = 0;
  for (const match of xml.matchAll(pattern)) {
    const index = match.index;
    if (index > last) tokens.push({ kind: "text", value: xml.slice(last, index) });
    const piece = match[0];
    if (piece.startsWith("<!--") || piece.startsWith("<?")) {
      tokens.push({ kind: "comment", value: piece });
    } else {
      const inner = /^(<\/?)([^\s/>]*)([\s\S]*?)(\/?>)?$/.exec(piece);
      if (inner) {
        tokens.push({ kind: "punct", value: inner[1] ?? "" });
        if (inner[2]) tokens.push({ kind: "tag", value: inner[2] });
        const rest = inner[3] ?? "";
        let restLast = 0;
        for (const attr of rest.matchAll(/([^\s=]+)(=)("[^"]*"?|'[^']*'?)/g)) {
          if (attr.index > restLast) tokens.push({ kind: "text", value: rest.slice(restLast, attr.index) });
          tokens.push({ kind: "attr", value: attr[1] ?? "" });
          tokens.push({ kind: "punct", value: attr[2] ?? "" });
          tokens.push({ kind: "value", value: attr[3] ?? "" });
          restLast = attr.index + attr[0].length;
        }
        if (restLast < rest.length) tokens.push({ kind: "text", value: rest.slice(restLast) });
        if (inner[4]) tokens.push({ kind: "punct", value: inner[4] });
      } else {
        tokens.push({ kind: "text", value: piece });
      }
    }
    last = index + piece.length;
  }
  if (last < xml.length) tokens.push({ kind: "text", value: xml.slice(last) });
  return tokens;
}
