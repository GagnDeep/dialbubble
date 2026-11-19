#!/usr/bin/env node
/**
 * Pushes the Dialbubble App Store listing through the official API. Safe to re-run.
 *
 *   node Tools/push_listing.mjs                  # listing, review details, price, screenshots
 *   node Tools/push_listing.mjs --skip-screenshots
 *   node Tools/push_listing.mjs --attach-build   # also selects the newest processed build
 *
 * Sources: AppStore/store.json, AppStore/review-notes.txt, AppStore/screenshots/iphone-{6.9,duo}/*.png.
 * It never submits for review. App Privacy is not available to API keys, so it stays on the website.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asc } from './asc.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const STORE = path.join(ROOT, 'AppStore');
const SKIP_SHOTS = process.argv.includes('--skip-screenshots');
const ATTACH_BUILD = process.argv.includes('--attach-build');
const cfg = JSON.parse(fs.readFileSync(path.join(STORE, 'store.json'), 'utf8'));
const step = (msg) => console.log('• ' + msg);

const appFor = async (bundleId) => (await asc('GET', `/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}`)).data[0] ?? null;

async function main() {
  const app = await appFor(cfg.bundleId);
  if (!app) throw new Error(`No App Store Connect app for ${cfg.bundleId}`);
  const APP_ID = app.id;
  const versions = await asc('GET', `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&limit=10`);
  const version = versions.data.find((d) => ['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY'].includes(d.attributes.appStoreState));
  if (!version) throw new Error('No editable App Store version.');
  const infos = await asc('GET', `/v1/apps/${APP_ID}/appInfos`);
  const appInfo = infos.data.find((d) => !['READY_FOR_DISTRIBUTION', 'READY_FOR_SALE'].includes(d.attributes.state ?? d.attributes.appStoreState)) ?? infos.data[0];
  step(`app ${APP_ID}, version ${version.attributes.versionString} (${version.attributes.appStoreState})`);

  await asc('PATCH', `/v1/apps/${APP_ID}`, { data: { type: 'apps', id: APP_ID, attributes: { contentRightsDeclaration: cfg.contentRightsDeclaration } } });
  step(`content rights: ${cfg.contentRightsDeclaration}`);

  await asc('PATCH', `/v1/appInfos/${appInfo.id}`, {
    data: { type: 'appInfos', id: appInfo.id, relationships: {
      primaryCategory: { data: { type: 'appCategories', id: cfg.categories[0] } },
      secondaryCategory: { data: { type: 'appCategories', id: cfg.categories[1] } },
    } },
  });
  step(`categories: ${cfg.categories.join(' / ')}`);

  const declaration = (await asc('GET', `/v1/appInfos/${appInfo.id}/ageRatingDeclaration`)).data;
  await asc('PATCH', `/v1/ageRatingDeclarations/${declaration.id}`, { data: { type: 'ageRatingDeclarations', id: declaration.id, attributes: cfg.ageRating } });
  step('age rating declaration');

  const infoLocs = await asc('GET', `/v1/appInfos/${appInfo.id}/appInfoLocalizations`);
  const infoLoc = infoLocs.data.find((l) => l.attributes.locale === 'en-US') ?? infoLocs.data[0];
  await asc('PATCH', `/v1/appInfoLocalizations/${infoLoc.id}`, {
    data: { type: 'appInfoLocalizations', id: infoLoc.id, attributes: { name: cfg.name, subtitle: cfg.subtitle, privacyPolicyUrl: cfg.privacyPolicyUrl } },
  });
  step(`name "${cfg.name}", subtitle "${cfg.subtitle}"`);

  await asc('PATCH', `/v1/appStoreVersions/${version.id}`, {
    data: { type: 'appStoreVersions', id: version.id, attributes: { versionString: cfg.version, copyright: cfg.copyright, releaseType: cfg.releaseType } },
  });
  step(`version ${cfg.version}, © ${cfg.copyright}, release ${cfg.releaseType}`);

  const vLocs = await asc('GET', `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`);
  const vLoc = vLocs.data.find((l) => l.attributes.locale === 'en-US') ?? vLocs.data[0];
  const keywords = cfg.keywords.join(',');
  if (keywords.length > 100) throw new Error(`keywords are ${keywords.length} chars`);
  await asc('PATCH', `/v1/appStoreVersionLocalizations/${vLoc.id}`, {
    data: { type: 'appStoreVersionLocalizations', id: vLoc.id, attributes: {
      description: cfg.description, keywords, promotionalText: cfg.promotionalText, supportUrl: cfg.supportUrl, marketingUrl: cfg.marketingUrl,
    } },
  });
  step(`description (${cfg.description.length}), keywords (${keywords.length}), promo, URLs`);

  const notes = fs.readFileSync(path.join(STORE, 'review-notes.txt'), 'utf8').trim();
  if (notes.length > 4000) throw new Error(`review notes are ${notes.length} chars`);
  const reviewAttrs = { ...(await reviewContact(cfg.reviewContactFromApp)), demoAccountRequired: false, notes };
  let detail = null;
  try { detail = (await asc('GET', `/v1/appStoreVersions/${version.id}/appStoreReviewDetail`)).data; } catch (err) { if (err.status !== 404) throw err; }
  if (detail) {
    await asc('PATCH', `/v1/appStoreReviewDetails/${detail.id}`, { data: { type: 'appStoreReviewDetails', id: detail.id, attributes: reviewAttrs } });
  } else {
    await asc('POST', '/v1/appStoreReviewDetails', { data: { type: 'appStoreReviewDetails', attributes: reviewAttrs, relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } } } });
  }
  step(`review details: contact copied from ${cfg.reviewContactFromApp}, notes ${notes.length} chars`);

  await setFreePrice(APP_ID);
  await setAvailability(APP_ID);

  if (!SKIP_SHOTS) {
    await uploadSet(vLoc.id, 'APP_IPHONE_67', path.join(STORE, 'screenshots/iphone-6.9'));
    if (fs.existsSync(path.join(STORE, 'screenshots/iphone-duo'))) await uploadSet(vLoc.id, 'APP_IPHONE_DUO', path.join(STORE, 'screenshots/iphone-duo'));
  }

  if (ATTACH_BUILD) {
    const builds = await asc('GET', `/v1/builds?filter[app]=${APP_ID}&filter[processingState]=VALID&sort=-uploadedDate&limit=1`);
    const build = builds.data[0];
    if (!build) console.warn('  ! no processed build yet: re-run later');
    else {
      await asc('PATCH', `/v1/appStoreVersions/${version.id}/relationships/build`, { data: { type: 'builds', id: build.id } });
      if (build.attributes.usesNonExemptEncryption == null) {
        await asc('PATCH', `/v1/builds/${build.id}`, { data: { type: 'builds', id: build.id, attributes: { usesNonExemptEncryption: false } } });
      }
      step(`build ${build.attributes.version} attached`);
    }
  }
  console.log('\nDone. Nothing was submitted for review.');
}

async function setFreePrice(APP_ID) {
  try {
    const points = await asc('GET', `/v1/apps/${APP_ID}/appPricePoints?filter[territory]=USA&limit=200`);
    const free = points.data.find((p) => Number(p.attributes.customerPrice) === 0);
    await asc('POST', '/v1/appPriceSchedules', {
      data: { type: 'appPriceSchedules', relationships: {
        app: { data: { type: 'apps', id: APP_ID } },
        baseTerritory: { data: { type: 'territories', id: 'USA' } },
        manualPrices: { data: [{ type: 'appPrices', id: '${free}' }] },
      } },
      included: [{ type: 'appPrices', id: '${free}', attributes: { startDate: null }, relationships: { appPricePoint: { data: { type: 'appPricePoints', id: free.id } } } }],
    });
    step('price: Free');
  } catch (err) { console.warn(`  ! pricing: ${err.message.slice(0, 300)}`); }
}

async function setAvailability(APP_ID) {
  try {
    await asc('GET', `/v1/apps/${APP_ID}/appAvailabilityV2`);
    step('availability already set');
  } catch (err) {
    if (err.status !== 404) throw err;
    const territories = (await asc('GET', '/v1/territories?limit=200')).data.map((t) => t.id);
    await asc('POST', '/v2/appAvailabilities', {
      data: { type: 'appAvailabilities', attributes: { availableInNewTerritories: true }, relationships: {
        app: { data: { type: 'apps', id: APP_ID } },
        territoryAvailabilities: { data: territories.map((t) => ({ type: 'territoryAvailabilities', id: `\${${t}}` })) },
      } },
      included: territories.map((t) => ({ type: 'territoryAvailabilities', id: `\${${t}}`, attributes: { available: true }, relationships: { territory: { data: { type: 'territories', id: t } } } })),
    });
    step(`availability: all ${territories.length} territories`);
  }
}

/** Copies the review contact from another of the account's apps, so no phone number lives in this repo. */
async function reviewContact(bundleId) {
  const other = await appFor(bundleId);
  if (!other) throw new Error(`reviewContactFromApp: no app ${bundleId}`);
  const versions = await asc('GET', `/v1/apps/${other.id}/appStoreVersions?limit=5`);
  for (const v of versions.data) {
    try {
      const d = (await asc('GET', `/v1/appStoreVersions/${v.id}/appStoreReviewDetail`)).data.attributes;
      if (d.contactEmail) return { contactFirstName: d.contactFirstName, contactLastName: d.contactLastName, contactEmail: d.contactEmail, contactPhone: d.contactPhone };
    } catch (err) { if (err.status !== 404) throw err; }
  }
  throw new Error(`no review contact on ${bundleId}`);
}

async function uploadSet(locId, displayType, dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
  const sets = await asc('GET', `/v1/appStoreVersionLocalizations/${locId}/appScreenshotSets`);
  let set = sets.data.find((s) => s.attributes.screenshotDisplayType === displayType);
  if (set) {
    const existing = await asc('GET', `/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`);
    for (const s of existing.data) await asc('DELETE', `/v1/appScreenshots/${s.id}`);
  } else {
    set = (await asc('POST', '/v1/appScreenshotSets', { data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: displayType }, relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: locId } } } } })).data;
  }
  const ids = [];
  for (const f of files) {
    const buf = fs.readFileSync(path.join(dir, f));
    const shot = (await asc('POST', '/v1/appScreenshots', { data: { type: 'appScreenshots', attributes: { fileName: f, fileSize: buf.length }, relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: set.id } } } } })).data;
    for (const op of shot.attributes.uploadOperations) {
      const headers = Object.fromEntries(op.requestHeaders.map((h) => [h.name, h.value]));
      const res = await fetch(op.url, { method: op.method, headers, body: buf.subarray(op.offset, op.offset + op.length) });
      if (!res.ok) throw new Error(`upload ${f} part → ${res.status}`);
    }
    await asc('PATCH', `/v1/appScreenshots/${shot.id}`, { data: { type: 'appScreenshots', id: shot.id, attributes: { uploaded: true, sourceFileChecksum: crypto.createHash('md5').update(buf).digest('hex') } } });
    ids.push(shot.id);
  }
  await asc('PATCH', `/v1/appScreenshotSets/${set.id}/relationships/appScreenshots`, { data: ids.map((id) => ({ type: 'appScreenshots', id })) });
  step(`${displayType}: ${ids.length} screenshots`);
}

main().catch((err) => { console.error('\n✗ ' + err.message); process.exit(1); });
