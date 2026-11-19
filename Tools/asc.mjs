// Minimal App Store Connect API client. Reads the fastlane-format key file of the asc profile named in
// appstore.json (~/.appstoreconnect/profiles/<profile>.json: key_id, issuer_id, key). Override with ASC_PROFILE.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const profile = process.env.ASC_PROFILE ?? JSON.parse(fs.readFileSync(path.join(root, 'appstore.json'), 'utf8')).profile;
const creds = JSON.parse(fs.readFileSync(path.join(os.homedir(), `.appstoreconnect/profiles/${profile}.json`), 'utf8'));

function token() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const data = b64({ alg: 'ES256', kid: creds.key_id, typ: 'JWT' }) + '.' +
    b64({ iss: creds.issuer_id, iat: now, exp: now + 1100, aud: 'appstoreconnect-v1' });
  const sig = crypto.sign('sha256', Buffer.from(data), { key: creds.key, dsaEncoding: 'ieee-p1363' });
  return data + '.' + sig.toString('base64url');
}

export async function asc(method, p, body) {
  const url = p.startsWith('http') ? p : 'https://api.appstoreconnect.apple.com' + p;
  const res = await fetch(url, {
    method,
    headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = new Error(`${method} ${p} → ${res.status} ${JSON.stringify(json.errors ?? json).slice(0, 1200)}`);
    err.status = res.status;
    throw err;
  }
  return json;
}
