#!/usr/bin/env node
/**
 * Whole-site QA against a running production server.
 *
 *   node scripts/qa.mjs http://127.0.0.1:47395/dialbubble [--render]   (serve out/ under /dialbubble)
 *
 * Without --render: every sitemap URL returns 200, has one <h1>, a sane title and description, a canonical on
 * gagndeep.github.io/dialbubble and valid JSON-LD, and every internal link and fragment resolves.
 * With --render: also loads each page in Chromium at 320, 390 and 1280 wide, in light and dark, and reports
 * horizontal overflow, console errors and CSP violations. Playwright comes from marketing/store.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] ?? 'http://127.0.0.1:47391';
const RENDER = process.argv.includes('--render');
const SITE = 'https://gagndeep.github.io/dialbubble';
const issues = [];
const report = (page, msg) => issues.push(`${page}: ${msg}`);
const local = (url) => url.replace(SITE, BASE);
const BASE_PATH = new URL(SITE).pathname.replace(/\/$/, ''); // '/dialbubble'

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`${urls.length} URLs in the sitemap`);

const pages = new Map();
const titles = new Map();
const descriptions = new Map();

async function load(url) {
  const res = await fetch(local(url), { redirect: 'manual' });
  return { status: res.status, html: res.status === 200 ? await res.text() : '' };
}

for (const url of urls) {
  const page = url.replace(SITE, '').replace(/^\/$/, '') || '/';
  const { status, html } = await load(url);
  if (status !== 200) { report(page, `HTTP ${status}`); continue; }
  pages.set(page, html);

  const main = html.replace(/<script[\s\S]*?<\/script>/g, '');
  const h1s = (main.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) report(page, `${h1s} <h1> tags`);

  const title = decode(html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1] ?? '');
  if (!title) report(page, 'no title');
  else if (title.length > 65) report(page, `title is ${title.length} chars: ${title}`);
  if (titles.has(title)) report(page, `duplicate title with ${titles.get(title)}`);
  titles.set(title, page);

  const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  if (!description) report(page, 'no description');
  else if (description.length < 70 || description.length > 170) report(page, `description is ${description.length} chars`);
  if (description && descriptions.has(description)) report(page, `duplicate description with ${descriptions.get(description)}`);
  descriptions.set(description, page);

  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  if (canonical !== url) report(page, `canonical is ${canonical}`);
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) report(page, 'noindex but in the sitemap');
  if (!/property="og:image"/.test(html)) report(page, 'no og:image');

  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { report(page, 'invalid JSON-LD'); }
  }
}

// Internal links and their fragments, followed from every page.
const statusCache = new Map();
const linkedFrom = new Map();
for (const [page, html] of pages) {
  const linksHere = new Set();
  for (const m of html.matchAll(/<a\b[^>]*>/g)) {
    const href = attr(m[0], 'href');
    if (!href) { report(page, 'an <a> without href'); continue; }
    const value = decode(href);
    if (/^(https?:|mailto:|tel:)/.test(value) && !value.startsWith(SITE)) continue;
    const absolute = new URL(value.replace(SITE, BASE_PATH), `${BASE}${page}`);
    const target = absolute.pathname.replace(BASE_PATH, '').replace(/\/$/, '') || '/';
    linksHere.add(target);
    if (!statusCache.has(target)) {
      const res = await fetch(`${BASE}${target}`, { redirect: 'manual' });
      statusCache.set(target, { status: res.status, html: res.status === 200 ? await res.text() : '' });
    }
    const hit = statusCache.get(target);
    if (hit.status !== 200) report(page, `link to ${value} returns ${hit.status}`);
    else if (absolute.hash && !hit.html.includes(`id="${absolute.hash.slice(1)}"`)) report(page, `link to ${value}: no such fragment`);
  }
  for (const target of linksHere) {
    if (target === page) continue;
    linkedFrom.set(target, (linkedFrom.get(target) ?? 0) + 1);
  }
}
for (const page of pages.keys()) {
  const inbound = linkedFrom.get(page) ?? 0;
  if (page !== '/' && inbound === 0) report(page, 'orphan: no internal links point here');
}
const weakest = [...pages.keys()].map((p) => [p, linkedFrom.get(p) ?? 0]).sort((a, b) => a[1] - b[1]).slice(0, 8);
console.log('fewest inbound links:', weakest.map(([p, n]) => `${p} (${n})`).join(', '));

for (const file of ['/robots.txt', '/feed.xml', '/llms.txt', '/manifest.webmanifest', '/og.png', '/sitemap.xml']) {
  const res = await fetch(`${BASE}${file}`);
  if (!res.ok) report(file, `HTTP ${res.status}`);
}
const missing = await fetch(`${BASE}/definitely-not-a-page`);
if (missing.status !== 404) report('/definitely-not-a-page', `expected 404, got ${missing.status}`);

if (RENDER) {
  const require = createRequire(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../marketing/store/package.json'));
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  for (const colorScheme of ['light', 'dark']) {
    for (const width of [320, 390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 800 }, colorScheme, serviceWorkers: 'block' });
      let current = '';
      const page = await context.newPage();
      page.on('console', (msg) => { if (msg.type() === 'error') report(current, `[${width} ${colorScheme}] console: ${msg.text().slice(0, 200)}`); });
      page.on('pageerror', (err) => report(current, `[${width} ${colorScheme}] exception: ${err.message.slice(0, 200)}`));
      for (const p of pages.keys()) {
        current = p;
        await page.goto(`${BASE}${p}`, { waitUntil: 'load' });
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          if (doc.scrollWidth <= doc.clientWidth) return null;
          const wide = [...document.body.querySelectorAll('*')].find((el) => {
            const r = el.getBoundingClientRect();
            if (r.right <= doc.clientWidth + 1 || r.width === 0) return false;
            for (let a = el.parentElement; a; a = a.parentElement) {
              if (getComputedStyle(a).overflowX !== 'visible') return false;
            }
            return true;
          });
          return `${doc.scrollWidth}px wide, from <${wide?.tagName.toLowerCase()} class="${String(wide?.className).slice(0, 60)}">`;
        });
        if (overflow) report(p, `[${width} ${colorScheme}] overflow: ${overflow}`);
      }
      await context.close();
      console.log(`rendered ${pages.size} pages at ${width} ${colorScheme}`);
    }
  }
  await browser.close();
}

console.log(`\n${issues.length} issues`);
for (const issue of issues) console.log('  ' + issue);
process.exit(issues.length ? 1 : 0);
