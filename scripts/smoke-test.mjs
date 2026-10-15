// Smoke-Test gegen das Live-System (GitHub Pages). npm run test:smoke [-- URL]
// Mit EXPECT_INDEX_SHA256 wartet er zuerst, bis die Seite genau diesen Build ausliefert (Pages-CDN braucht etwas).
import {chromium} from 'playwright-core';
import crypto from 'node:crypto';
import fs from 'node:fs';

const url = process.argv[2] ?? 'https://michiproep.github.io/iq-s1-pwa/';
const executablePath = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(p => p && fs.existsSync(p));

let failed = 0;
const ok = (cond, name, detail = '') => { console.log(`${cond ? '✓' : '✗'} ${name}${detail ? `: ${detail}` : ''}`); if (!cond) failed++; };
const fetchText = async u => { const r = await fetch(u, {cache: 'no-store'}); return {status: r.status, text: await r.text()}; };

// 1. Richtige Version live?
const expected = process.env.EXPECT_INDEX_SHA256;
if (expected) {
  const until = Date.now() + 5 * 60_000;
  let hash = '';
  while (Date.now() < until) {
    const {text} = await fetchText(`${url}?nocache=${Date.now()}`);
    hash = crypto.createHash('sha256').update(text).digest('hex');
    if (hash === expected) break;
    await new Promise(r => setTimeout(r, 10_000));
  }
  ok(hash === expected, 'Live-Seite liefert den neuen Build', hash === expected ? '' : `index.html ${hash.slice(0, 12)} statt ${expected.slice(0, 12)}`);
  if (hash !== expected) process.exit(1);
}

// 2. Seite im Browser: lädt ohne Fehler, Rechner rechnet, PWA-Teile vorhanden
const browser = await chromium.launch({executablePath});
const page = await browser.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, hasTouch: true, isMobile: true});
const problems = [];
page.on('pageerror', e => problems.push(`JS-Fehler: ${e.message}`));
page.on('console', m => m.type() === 'error' && problems.push(`Konsole: ${m.text()}`));
page.on('response', r => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url()}`));
page.on('requestfailed', r => problems.push(`Abbruch: ${r.url()} (${r.failure()?.errorText})`));

const res = await page.goto(url, {waitUntil: 'networkidle'});
ok(res?.status() === 200, 'Seite lädt', `HTTP ${res?.status()}`);
ok(await page.title() === 'IQ-S1 Rechner', 'Titel', await page.title());
await page.evaluate(() => document.fonts.ready);
const keyCount = await page.locator('.key').count();
ok(keyCount === 46, 'Alle 46 Tasten vorhanden', `${keyCount} Tasten`);

const keys = async (...labels) => { for (const l of labels) await page.getByRole('button', {name: l, exact: true}).first().tap(); };
const result = async () => (await page.locator('.result').innerText()).replace(/\s+/g, '');
await keys('AC', '1', 'plus', '2', 'mal', '3', 'gleich');
ok(await result() === '7', 'Rechnen: 1 + 2 × 3 = 7', await result());
await keys('AC', 'Wurzel', '8', 'gleich');
ok(await result() === '22' && await page.locator('.result .nr').count() > 0, 'Lehrbuch-Ausgabe: √8 = 2√2', await result());

const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
const manifest = manifestHref ? await fetchText(new URL(manifestHref, url).href) : {status: 0, text: ''};
let name = '';
try { name = JSON.parse(manifest.text).short_name; } catch { /* kein JSON */ }
ok(manifest.status === 200 && name === 'IQ-S1', 'Web-App-Manifest', `HTTP ${manifest.status}, short_name ${name || '–'}`);
const sw = await page.evaluate(() => Promise.race([
  navigator.serviceWorker.ready.then(({active: w}) => w.state === 'activated' ? w.state
    : new Promise(r => w.addEventListener('statechange', () => w.state === 'activated' && r(w.state)))),
  new Promise(r => setTimeout(() => r('Timeout'), 15_000)),
]));
ok(sw === 'activated', 'Service Worker aktiv (offlinefähig)', sw);

await page.getByRole('button', {name: 'Menü'}).tap();
const links = await page.locator('.appMenu a').evaluateAll(as => as.map(a => [a.textContent, a.href]));
for (const [text, href] of links) {
  const status = (await fetch(href, {method: 'HEAD', redirect: 'follow'}).catch(() => ({status: 0}))).status;
  ok(status === 200, `Menü-Link „${text}“ erreichbar`, `HTTP ${status}`);
}
ok(links.length === 3, 'Menü hat 3 Links', String(links.length));

ok(problems.length === 0, 'Keine Fehler in Konsole und Netzwerk', problems.join(' | '));
await browser.close();
if (failed) { console.error(`${failed} Smoke-Prüfung(en) fehlgeschlagen (${url})`); process.exit(1); }
console.log(`Smoke-Test bestanden: ${url}`);
