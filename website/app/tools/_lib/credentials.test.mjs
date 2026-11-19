import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { checkCredential } from "./credentials.ts";

const hex = "0123456789abcdef0123456789abcdef";

describe("Account SID", () => {
  test("accepts AC plus 32 hex", () => {
    assert.equal(checkCredential("accountSid", `AC${hex}`).state, "ok");
    assert.equal(checkCredential("accountSid", `AC${hex.toUpperCase()}`).state, "ok");
  });
  test("names the type of a wrong SID", () => {
    assert.match(checkCredential("accountSid", `SK${hex}`).message, /API key SID/);
    assert.match(checkCredential("accountSid", `MG${hex}`).message, /Messaging Service/);
  });
  test("spots a token pasted in the wrong field", () => {
    assert.match(checkCredential("accountSid", hex).message, /Auth Token/);
  });
  test("length, hex and case", () => {
    assert.match(checkCredential("accountSid", `AC${hex.slice(1)}`).message, /This has 33/);
    assert.match(checkCredential("accountSid", `AC${hex.slice(1)}z`).message, /"z" isn't hex/);
    assert.match(checkCredential("accountSid", `ac${hex}`).message, /uppercase/);
  });
  test("paste problems", () => {
    assert.match(checkCredential("accountSid", ` AC${hex}`).message, /space or line break/);
    assert.match(checkCredential("accountSid", `AC${hex}\n`).message, /space or line break/);
    assert.match(checkCredential("accountSid", `"AC${hex}"`).message, /quote marks/);
    assert.match(checkCredential("accountSid", `ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`).message, /placeholder/);
    assert.match(checkCredential("accountSid", "${TWILIO_ACCOUNT_SID}").message, /placeholder/);
  });
  test("empty is its own state", () => {
    assert.equal(checkCredential("accountSid", "").state, "empty");
  });
});

describe("API key SID", () => {
  test("accepts SK plus 32 hex", () => {
    assert.equal(checkCredential("apiKeySid", `SK${hex}`).state, "ok");
  });
  test("rejects an Account SID", () => {
    assert.match(checkCredential("apiKeySid", `AC${hex}`).message, /Account SID/);
  });
});

describe("secrets", () => {
  test("accepts 32 hex", () => {
    assert.equal(checkCredential("authToken", hex).state, "ok");
    assert.equal(checkCredential("apiKeySecret", hex).state, "ok");
  });
  test("32 non-hex characters only warn", () => {
    assert.equal(checkCredential("apiKeySecret", `${hex.slice(0, 31)}Z`).state, "warning");
  });
  test("wrong length", () => {
    assert.match(checkCredential("authToken", hex.slice(2)).message, /This has 30/);
  });
  test("spots a swapped SID", () => {
    assert.match(checkCredential("authToken", `AC${hex}`).message, /swapped/);
  });
});
