// Visueller Vergleich mit dem Referenzfoto: npm run test:visual (Dev-Server muss laufen oder URL als Argument)
import {chromium} from 'playwright-core';
import {PNG} from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'node:fs';
import path from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5173/';
const outDir = process.argv[3] ?? 'test-results';
const REF = 'doc/images/fa1baf658f2e03a563050fc49235c4866037454d189e0366a039a9835fbcdd61.png';
const executablePath = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(p => p && fs.existsSync(p));

if (!fs.existsSync(REF)) {
  console.log(`Referenzfoto ${REF} fehlt (nicht im Repository enthalten) – Pixelvergleich übersprungen.`);
  process.exit(0);
}
const ref = PNG.sync.read(fs.readFileSync(REF));
const {width, height} = ref;
const browser = await chromium.launch({executablePath});
const page = await browser.newPage({viewport: {width, height}, deviceScaleFactor: 1});
await page.goto(url);
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({content: '.lcd{visibility:hidden}'}); // Displayinhalt ausblenden (Foto zeigt leeres Display)
await page.waitForTimeout(300);
fs.mkdirSync(outDir, {recursive: true});
const shot = PNG.sync.read(await page.screenshot());
await browser.close();

const diff = new PNG({width, height});
const changed = pixelmatch(ref.data, shot.data, diff.data, width, height, {threshold: 0.15, includeAA: false});
// Seite an Seite + Überblendung (50 %)
const side = new PNG({width: width * 3, height});
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const i = (y * width + x) * 4;
  for (let c = 0; c < 4; c++) {
    side.data[(y * width * 3 + x) * 4 + c] = ref.data[i + c];
    side.data[(y * width * 3 + x + width) * 4 + c] = shot.data[i + c];
    side.data[(y * width * 3 + x + 2 * width) * 4 + c] = c === 3 ? 255 : (ref.data[i + c] + shot.data[i + c]) >> 1;
  }
}
fs.writeFileSync(path.join(outDir, 'screenshot.png'), PNG.sync.write(shot));
fs.writeFileSync(path.join(outDir, 'diff.png'), PNG.sync.write(diff));
fs.writeFileSync(path.join(outDir, 'side-by-side.png'), PNG.sync.write(side));
const pct = (100 * changed / (width * height)).toFixed(2);
console.log(`Abweichende Pixel: ${changed} von ${width * height} (${pct} %)`);
const limit = Number(process.env.VISUAL_LIMIT ?? 6);
if (Number(pct) > limit) { console.error(`Über Grenzwert ${limit} %`); process.exit(1); }
