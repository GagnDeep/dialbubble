import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { TEMPLATES, echoTwimletUrl, escapeAttr, makeNode, parseXml, toInlineXml, toNodes, toPrettyXml, tokenizeXml, validateTwiml } from "./twiml.ts";

const errors = (xml) => validateTwiml(xml).filter((i) => i.severity === "error");
const messages = (xml) => validateTwiml(xml).map((i) => i.message).join("\n");

describe("serializer", () => {
  test("escapes text and attributes", () => {
    const xml = toInlineXml([makeNode("Say", { voice: 'a"b' }, "Tom & Jerry <3")]);
    assert.equal(xml, '<Response><Say voice="a&quot;b">Tom &amp; Jerry &lt;3</Say></Response>');
    assert.equal(escapeAttr("a&b"), "a&amp;b");
  });
  test("empty verbs self-close", () => {
    assert.equal(toInlineXml([makeNode("Hangup")]), "<Response><Hangup/></Response>");
    assert.equal(toInlineXml([]), "<Response/>");
  });
  test("pretty output has a declaration and indents nested verbs", () => {
    const xml = toPrettyXml([makeNode("Gather", { numDigits: "1" }, "", [makeNode("Say", {}, "Hi")])]);
    assert.equal(xml, '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Gather numDigits="1">\n    <Say>Hi</Say>\n  </Gather>\n</Response>');
  });
  test("round-trips through the parser and validator", () => {
    const nodes = [makeNode("Say", {}, "A & B"), makeNode("Dial", { callerId: "+14155550101" }, "", [makeNode("Number", { sendDigits: "ww1" }, "+14155550100")])];
    const pretty = toPrettyXml(nodes);
    assert.deepEqual(errors(pretty), []);
    const back = toNodes(pretty);
    assert.equal(back.nodes[0].text, "A & B");
    assert.equal(back.nodes[1].children[0].attrs.sendDigits, "ww1");
    assert.equal(toInlineXml(back.nodes), toInlineXml(nodes));
  });
});

describe("Echo Twimlet", () => {
  test("encodes everything reserved", () => {
    const url = echoTwimletUrl("<Response><Say>Hi (you)!</Say></Response>");
    assert.ok(url.startsWith("https://twimlets.com/echo?Twiml=%3CResponse%3E"));
    assert.ok(!/[<>()! ]/.test(url));
    assert.equal(decodeURIComponent(url.split("Twiml=")[1]), "<Response><Say>Hi (you)!</Say></Response>");
  });
});

describe("templates", () => {
  for (const template of TEMPLATES) {
    test(`${template.label} has no errors and fits inline`, () => {
      const nodes = template.build();
      assert.deepEqual(errors(toPrettyXml(nodes)), []);
      assert.ok(toInlineXml(nodes).length <= 4000);
    });
  }
  test("the bridge template hides the Dial inside the Gather action", () => {
    const nodes = TEMPLATES.find((t) => t.id === "bridge").build();
    const gather = nodes[0];
    assert.equal(gather.verb, "Gather");
    assert.equal(gather.attrs.method, "GET");
    assert.ok(gather.attrs.action.startsWith("https://twimlets.com/echo?Twiml="));
    const inner = decodeURIComponent(gather.attrs.action.split("Twiml=")[1]);
    assert.ok(inner.includes("<Dial"));
    assert.deepEqual(errors(inner), []);
    assert.ok(!toInlineXml(nodes).includes("<Dial"));
  });
});

describe("parser errors", () => {
  test("mismatched tags name the opening line", () => {
    const { issues } = parseXml("<Response>\n<Gather>\n<Say>Hi</Gather>\n</Response>");
    assert.ok(issues.some((i) => /<\/Gather> doesn't match <Say>, opened on line 3/.test(i.message) && i.line === 3));
  });
  test("unclosed tag", () => {
    assert.match(messages("<Response><Say>Hi</Say>"), /<Response> is never closed/);
  });
  test("raw ampersand", () => {
    const xml = "<Response>\n<Say>Tom & Jerry</Say>\n</Response>";
    assert.match(messages(xml), /&amp;/);
    assert.equal(errors(xml)[0].line, 2);
  });
  test("known and unknown entities", () => {
    assert.deepEqual(errors("<Response><Say>A &amp; B &lt; &#65; &#x41;</Say></Response>"), []);
    assert.match(messages("<Response><Say>&nbsp;</Say></Response>"), /known XML entity/);
  });
  test("unquoted, unterminated and duplicate attributes", () => {
    assert.match(messages("<Response><Pause length=5/></Response>"), /in quotes/);
    assert.match(messages('<Response><Pause length="5/></Response>'), /never closes its quote/);
    assert.match(messages('<Response><Pause length="5" length="6"/></Response>'), /length twice/);
  });
  test("text outside the root and a second root", () => {
    assert.match(messages("hello<Response/>"), /text before <Response>/);
    assert.match(messages("<Response/>bye"), /text after/);
    assert.match(messages("<Response/><Response/>"), /Only one root/);
  });
  test("a declaration and comments are fine", () => {
    assert.deepEqual(errors('<?xml version="1.0"?>\n<!-- hi -->\n<Response><Hangup/></Response>'), []);
  });
  test("a stray < is called out", () => {
    assert.match(messages("<Response><Say>1 < 2</Say></Response>"), /&lt;/);
  });
  test("empty input", () => {
    assert.match(messages(""), /nothing to check/);
  });
  test("reports line and column", () => {
    const issue = errors('<Response>\n  <Bogus/>\n</Response>')[0];
    assert.equal(issue.line, 2);
    assert.equal(issue.column, 3);
  });
});

describe("validator", () => {
  test("root has to be Response, case-sensitively", () => {
    assert.match(messages("<Say>Hi</Say>"), /root element has to be <Response>/);
    assert.match(messages("<response/>"), /case-sensitive/);
  });
  test("verb case and unknown verbs", () => {
    assert.match(messages("<Response><say>Hi</say></Response>"), /use <Say> rather than <say>/);
    assert.match(messages("<Response><Speak>Hi</Speak></Response>"), /isn't a TwiML verb/);
  });
  test("nesting rules", () => {
    assert.match(messages("<Response><Number>+14155550100</Number></Response>"), /only works inside <Dial>/);
    assert.match(messages("<Response><Gather><Dial>+14155550100</Dial></Gather></Response>"), /can't go inside <Gather>/);
    assert.match(messages("<Response><Dial><Say>Hi</Say></Dial></Response>"), /can't go inside <Dial>/);
    assert.deepEqual(errors('<Response><Gather action="/a"><Say>a</Say><Play>https://x.co/a.mp3</Play><Pause/></Gather></Response>'), []);
  });
  test("attribute names, values and ranges", () => {
    assert.match(messages('<Response><Gather numdigits="1" action="/a"><Say>a</Say></Gather></Response>'), /use numDigits rather than numdigits/);
    assert.match(messages('<Response><Say foo="1">a</Say></Response>'), /no foo attribute/);
    assert.match(messages('<Response><Redirect method="PUT">/a</Redirect></Response>'), /method="PUT" isn't allowed/);
    assert.match(messages('<Response><Pause length="abc"/></Response>'), /whole number/);
    assert.match(messages('<Response><Pause length="0"/></Response>'), /minimum is 1/);
    assert.match(messages('<Response><Dial timeout="3">+14155550100</Dial></Response>'), /minimum is 5/);
    assert.match(messages('<Response><Dial timeout="601">+14155550100</Dial></Response>'), /maximum is 600/);
    assert.match(messages('<Response><Play digits="12x">a</Play></Response>'), /0-9, A-D/);
  });
  test("required content", () => {
    assert.match(messages("<Response><Say/></Response>"), /needs text/);
    assert.match(messages("<Response><Play/></Response>"), /audio URL or a digits/);
    assert.match(messages("<Response><Redirect/></Response>"), /needs a URL/);
    assert.match(messages("<Response><Dial/></Response>"), /needs a number/);
    assert.match(messages("<Response>hello</Response>"), /Put it in a <Say>/);
  });
  test("Play digits are refused inside Gather", () => {
    assert.match(messages('<Response><Gather action="/a"><Play digits="1"/></Gather></Response>'), /digits on <Play> inside <Gather>/);
  });
  test("SSML inside Say is fine, other tags aren't", () => {
    assert.deepEqual(errors('<Response><Say>Hi <break strength="x-weak"/> you</Say></Response>'), []);
    assert.match(messages("<Response><Say><Play>a</Play></Say></Response>"), /Only SSML/);
  });
  test("Say limits follow the voice", () => {
    assert.match(messages(`<Response><Say voice="Polly.Joanna-Neural">${"a".repeat(3001)}</Say></Response>`), /3000 at most/);
    assert.deepEqual(errors(`<Response><Say voice="Google.en-US-Chirp3-HD-Aoede">${"a".repeat(3001)}</Say></Response>`), []);
  });
  test("phone numbers warn when they aren't E.164", () => {
    const issues = validateTwiml("<Response><Dial>415-555-0100</Dial></Response>");
    assert.equal(issues[0].severity, "warning");
    assert.match(issues[0].message, /E.164/);
  });
  test("unreachable verbs", () => {
    assert.match(messages("<Response><Hangup/><Say>a</Say></Response>"), /<Say> will never run/);
    assert.match(messages("<Response><Redirect>/a</Redirect><Say>a</Say></Response>"), /<Say> will never run/);
    assert.match(messages('<Response><Dial action="/a">+14155550100</Dial><Say>a</Say></Response>'), /action hands the call/);
    assert.doesNotMatch(messages("<Response><Dial>+14155550100</Dial><Say>a</Say></Response>"), /never run/);
  });
  test("other documented verbs pass with a note", () => {
    const issues = validateTwiml("<Response><Reject/></Response>");
    assert.equal(issues.length, 1);
    assert.equal(issues[0].severity, "info");
    assert.deepEqual(errors("<Response><Dial><Conference>a</Conference></Dial></Response>"), []);
  });
  test("4,000-character warning", () => {
    assert.doesNotMatch(messages(`<Response><Say>${"a".repeat(3900)}</Say></Response>`), /4,000 at most/);
    assert.match(messages(`<Response><Say>${"a".repeat(3990)}</Say></Response>`), /4,000 at most/);
  });
  test("errors sort first", () => {
    const issues = validateTwiml('<Response><Dial>415</Dial><Say foo="1">a</Say></Response>');
    assert.equal(issues[0].severity, "error");
  });
});

describe("import", () => {
  test("keeps known verbs and lists the rest", () => {
    const result = toNodes("<Response><Say>Hi</Say><Reject/></Response>");
    assert.equal(result.nodes.length, 1);
    assert.deepEqual(result.skipped, ["Reject"]);
  });
  test("returns null when the root isn't Response", () => {
    assert.equal(toNodes("<Say/>"), null);
    assert.equal(toNodes("not xml"), null);
  });
});

describe("tokenizer", () => {
  test("rebuilds the input exactly", () => {
    const xml = '<?xml version="1.0"?>\n<Response>\n  <Say voice="man">A &amp; B</Say>\n  <Hangup/>\n</Response>';
    assert.equal(tokenizeXml(xml).map((t) => t.value).join(""), xml);
  });
  test("labels tags, attributes and values", () => {
    const tokens = tokenizeXml('<Say voice="man">Hi</Say>');
    assert.deepEqual(tokens.slice(0, 5).map((t) => t.kind), ["punct", "tag", "text", "attr", "punct"]);
    assert.equal(tokens.find((t) => t.kind === "value").value, '"man"');
  });
});
