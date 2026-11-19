#!/usr/bin/env node
/**
 * Waits until an uploaded build has finished processing on App Store Connect.
 *
 *   node Tools/wait_build.mjs 202611041124 [timeout-minutes]
 *
 * Exits 0 when it is VALID, 1 if it fails processing or the wait times out.
 */
import { asc } from './asc.mjs';

const version = process.argv[2];
if (!version) { console.error('usage: wait_build.mjs <build-number> [timeout-minutes]'); process.exit(1); }
const deadline = Date.now() + Number(process.argv[3] ?? 45) * 60_000;
const app = (await asc('GET', '/v1/apps?filter[bundleId]=com.dialbubble.app')).data[0];

while (Date.now() < deadline) {
  try {
    const builds = await asc('GET', `/v1/builds?filter[app]=${app.id}&filter[version]=${version}&limit=1`);
    const state = builds.data[0]?.attributes.processingState;
    if (state === 'VALID') { console.log(`build ${version} VALID`); process.exit(0); }
    if (state === 'FAILED' || state === 'INVALID') { console.error(`build ${version} ${state}`); process.exit(1); }
  } catch (err) {
    console.error(`retrying after: ${err.message.slice(0, 160)}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 45_000));
}
console.error(`build ${version} still not processed`);
process.exit(1);
