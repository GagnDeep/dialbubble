// Renders App Store screenshots from marketing/raw into AppStore/screenshots at Apple's exact sizes.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(HERE, '../raw');
const OUT = path.join(HERE, '../../AppStore/screenshots');
const font = fs.readFileSync(path.join(HERE, 'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2')).toString('base64');
const shot = (n) => 'data:image/png;base64,' + fs.readFileSync(path.join(RAW, n + '.png')).toString('base64');

const SLIDES = [
  { file: '01-home', screen: 'home-dark', theme: 'dark', kicker: 'Free. No subscription.', title: 'Your business line, on your iPhone', layout: 'bleed' },
  { file: '02-keypad', screen: 'keypad-dark', theme: 'mint', kicker: 'Any number you own', title: 'Call from the right number, every time', layout: 'bleed' },
  { file: '03-call', screen: 'active-call-dark', theme: 'dark', kicker: 'Rings you first. Press a key to connect.', title: 'They see your business number', layout: 'bleed' },
  { file: '04-inbox', screen: 'messages-light', theme: 'light', kicker: 'SMS and MMS', title: 'Every text, in one inbox', layout: 'bleed' },
  { file: '05-thread', screen: 'conversation-dark', theme: 'dark', kicker: 'Reply from the right line', title: 'Real conversations, not API logs', layout: 'bleed' },
  { file: '06-voice', screen: 'voice-message-dark', theme: 'mint', kicker: 'Voice message calls', title: 'Type it. The call says it.', layout: 'bleed' },
  { file: '07-history', screen: 'call-detail-light', theme: 'light', kicker: 'Call history', title: 'See every call, cost and detail', layout: 'bleed' },
  { file: '08-privacy', screen: 'settings-dark', theme: 'dark', kicker: 'Private by design', title: 'Your keys stay on this iPhone', layout: 'bleed', chips: ['No servers', 'No tracking', 'No markup'] },
  { file: '09-demo', screen: 'onboarding-dark', theme: 'mint', kicker: 'No account needed', title: 'Try every screen in Demo Mode', layout: 'bleed' },
];

const THEMES = {
  dark: { bg: 'radial-gradient(120% 60% at 20% 0%, #0d4a42 0%, #071413 45%, #050708 100%)', title: '#fff', kicker: '#3EDBC4', chipBg: 'rgba(62,219,196,.14)', chipFg: '#b9f5ea', edge: '#3a4246' },
  mint: { bg: 'linear-gradient(165deg, #2CCFB6 0%, #10A896 48%, #0B7D71 100%)', title: '#04211d', kicker: '#04372f', chipBg: 'rgba(4,33,29,.14)', chipFg: '#04211d', edge: '#1b2326' },
  light: { bg: 'radial-gradient(120% 60% at 80% 0%, #c9f3ea 0%, #eef6f4 50%, #f3f5f5 100%)', title: '#07191a', kicker: '#0B7D71', chipBg: 'rgba(11,125,113,.12)', chipFg: '#0B7D71', edge: '#c4cccc' },
};

function html(s, W, H) {
  const t = THEMES[s.theme];
  const k = W / 1320;
  const phoneW = 1090 * k, phoneH = phoneW * (2868 / 1320), bez = 26 * k, r = 150 * k;
  return `<!doctype html><html><head><style>
  @font-face{font-family:B;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:200 800}
  *{box-sizing:border-box;margin:0}
  body{width:${W}px;height:${H}px;background:${t.bg};overflow:hidden;font-family:B,sans-serif;position:relative}
  .head{position:absolute;left:${90 * k}px;right:${90 * k}px;top:${130 * k}px;text-align:center}
  .kicker{font-size:${50 * k}px;font-weight:650;color:${t.kicker};letter-spacing:-.005em;margin-bottom:${26 * k}px}
  h1{font-size:${132 * k}px;line-height:1.02;font-weight:760;color:${t.title};letter-spacing:-.03em;text-wrap:balance}
  .chips{display:flex;gap:${18 * k}px;justify-content:center;margin-top:${36 * k}px;flex-wrap:wrap}
  .chip{font-size:${40 * k}px;font-weight:620;padding:${16 * k}px ${32 * k}px;border-radius:999px;background:${t.chipBg};color:${t.chipFg}}
  .phone{position:absolute;left:${(W - phoneW - 2 * bez) / 2}px;top:${(s.chips ? 790 : 690) * k}px;width:${phoneW + 2 * bez}px;height:${phoneH + 2 * bez}px;
    border-radius:${r + bez}px;background:linear-gradient(145deg,#54585c,#17191b 40%,#2e3134);padding:${bez}px;
    box-shadow:0 ${60 * k}px ${160 * k}px rgba(0,0,0,.45),0 0 0 ${3 * k}px ${t.edge}}
  .phone img{width:100%;height:100%;display:block;border-radius:${r}px}
  .island{position:absolute;left:50%;transform:translateX(-50%);top:${bez + 30 * k}px;width:${300 * k}px;height:${88 * k}px;border-radius:999px;background:#000}
  </style></head><body>
  <div class="head"><div class="kicker">${s.kicker}</div><h1>${s.title}</h1>
  ${s.chips ? `<div class="chips">${s.chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>` : ''}</div>
  <div class="phone"><img src="${shot(s.screen)}"/><div class="island"></div></div>
  </body></html>`;
}

const SIZES = [['iphone-6.9', 1320, 2868], ['iphone-6.5', 1284, 2778]];
const browser = await chromium.launch();
for (const [dir, W, H] of SIZES) {
  const out = path.join(OUT, dir);
  fs.mkdirSync(out, { recursive: true });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const s of SLIDES) {
    await page.setContent(html(s, W, H), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, s.file + '.png'), omitBackground: false, type: 'png' });
  }
  await page.close();
}
await browser.close();
console.log('rendered', SLIDES.length * SIZES.length);
