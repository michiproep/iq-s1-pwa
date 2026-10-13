// End-to-End-Test: klickt Tasten im echten Browser und prüft die Anzeige. npm run test:e2e
import {chromium} from 'playwright-core';
import fs from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5173/';
const executablePath = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(p => p && fs.existsSync(p));

const browser = await chromium.launch({executablePath});
const page = await browser.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, hasTouch: true});
await page.goto(url);
await page.evaluate(() => document.fonts.ready);

const keys = async (...labels) => { for (const l of labels) await page.getByRole('button', {name: l, exact: true}).first().dispatchEvent('pointerdown'); };
const text = sel => page.locator(sel).innerText();
let failed = 0;
async function check(name, seq, expected, sel = '.result') {
  await keys('AC', ...seq);
  const got = (await text(sel)).replace(/\s+/g, ' ').trim();
  const ok = expected instanceof RegExp ? expected.test(got) : got === expected;
  console.log(`${ok ? '✓' : '✗'} ${name}: "${got}"${ok ? '' : ` (erwartet ${expected})`}`);
  if (!ok) failed++;
}

await check('Punkt vor Strich', ['1', 'plus', '2', 'mal', '3', 'gleich'], '7');
await check('Bruch als Ergebnis', ['1', 'geteilt', '3', 'gleich'], '1 3');
await check('S⇔D', ['1', 'geteilt', '3', 'gleich', 'S D'], '0,3333333333');
await check('Wurzel', ['Wurzel', '2', 'Klammer zu', 'gleich'], '1,414213562');
await check('sin 30', ['sin', '3', '0', 'Klammer zu', 'gleich'], '1 2');
await check('SHIFT sin', ['SHIFT', 'sin', '1', 'Klammer zu', 'gleich'], '90');
await check('Großer Wert', ['9', 'mal zehn hoch', '1', '2', 'mal', '2', 'gleich'], '1,8×1013');
await check('Fehler', ['1', 'geteilt', '0', 'gleich'], /Math ERROR/, '.lcd');
await check('Eingabezeile', ['2', 'Komma', '5', 'x Quadrat'], '2,5²', '.input');
await check('MODE-Menü', ['MODE'], /1:COMP.*2:STAT.*3:TABLE/s, '.lcd');
await check('Ans fortsetzen', ['4', 'gleich', 'plus', '1', 'gleich'], '5');
await check('REPLAY', ['7', 'gleich', 'AC', 'Nach oben'], '7', '.input');
await check('MODE zeigt BASE-N', ['MODE'], /4:BASE-N/, '.lcd');
await check('Tastatur', [], '', '.input');
await page.keyboard.type('12*3'); await page.keyboard.press('Enter');
console.log((await text('.result')) === '36' ? '✓ Tastatureingabe 12*3=36' : (failed++, '✗ Tastatureingabe'));
await keys('AC');
await page.screenshot({path: 'test-results/e2e-phone.png'});
await browser.close();
if (failed) { console.error(`${failed} Prüfung(en) fehlgeschlagen`); process.exit(1); }
console.log('Alle E2E-Prüfungen bestanden');
