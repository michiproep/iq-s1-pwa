// End-to-End-Test: klickt Tasten im echten Browser und prüft die Anzeige. npm run test:e2e
import {chromium, webkit} from 'playwright-core';
import fs from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5173/';
const executablePath = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(p => p && fs.existsSync(p));

// BROWSER=webkit testet mit der Safari-Engine (WebKit), Pfad über WEBKIT_PATH oder ext/webkit-win64
const useWebkit = process.env.BROWSER === 'webkit';
const webkitPath = [process.env.WEBKIT_PATH, 'ext/webkit-win64/Playwright.exe'].find(p => p && fs.existsSync(p));
const browser = useWebkit ? await webkit.launch({executablePath: webkitPath}) : await chromium.launch({executablePath});
console.log(`Browser: ${useWebkit ? 'WebKit' : 'Chromium'} ${browser.version()}`);
const page = await browser.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, hasTouch: true, isMobile: true});
await page.goto(url);
await page.evaluate(() => document.fonts.ready);

// Echte Touch-Taps (wie am iPhone), keine künstlich ausgelösten Ereignisse
const keys = async (...labels) => { for (const l of labels) await page.getByRole('button', {name: l, exact: true}).first().tap(); };
const text = sel => page.locator(sel).innerText();
let failed = 0;
async function check(name, seq, expected, sel = '.result') {
  await keys('AC', ...seq);
  const got = (await text(sel)).replace(/\s+/g, '');  // Layout-Leerzeichen ignorieren
  const ok = expected instanceof RegExp ? expected.test(got) : got === expected;
  console.log(`${ok ? '✓' : '✗'} ${name}: "${got}"${ok ? '' : ` (erwartet ${expected})`}`);
  if (!ok) failed++;
}
async function has(name, selector) {
  const ok = await page.locator(selector).count() > 0;
  console.log(`${ok ? '✓' : '✗'} ${name}`);
  if (!ok) failed++;
}

await check('Punkt vor Strich', ['1', 'plus', '2', 'mal', '3', 'gleich'], '7');
await check('Bruch als Ergebnis', ['1', 'geteilt', '3', 'gleich'], '13');
await has('… gestapelt dargestellt', '.result .nf');
await check('S⇔D', ['1', 'geteilt', '3', 'gleich', 'S D'], '0,3333333333');
await check('Wurzel exakt: √8 = 2√2', ['Wurzel', '8', 'gleich'], '22');
await has('… mit Wurzelzeichen', '.result .nr');
await check('Wurzel dezimal', ['Wurzel', '8', 'gleich', 'S D'], '2,828427125');
await check('Bruch-Vorlage 1/3 + 1/6', ['1', 'Bruch', '3', 'Nach rechts', 'plus', '1', 'Bruch', '6', 'gleich'], '12');
await check('Lehrbuch-Beispiel 4√2/3 + 1/(6√2)', ['4', 'Wurzel', '2', 'Nach rechts', 'Bruch', '3', 'Nach rechts', 'plus', '1', 'Bruch', '6', 'Wurzel', '2', 'gleich'], '17212');
await has('… Eingabe als gestapelter Bruch mit Wurzel', '.input .nf .nr');
await check('Bruch mit ▼ in den Nenner', ['Bruch', '3', 'Nach unten', '4', 'gleich'], '34');
await check('Bruch mit ▲ zurück in den Zähler', ['1', 'Bruch', '4', 'Nach oben', '2', 'gleich'], '3');
await check('sin 30', ['sin', '3', '0', 'gleich'], '12');
await check('SHIFT sin', ['SHIFT', 'sin', '1', 'Klammer zu', 'gleich'], '90');
await check('Großer Wert', ['9', 'mal zehn hoch', '1', '2', 'mal', '2', 'gleich'], '1,8×1013');
await check('Fehler', ['1', 'geteilt', '0', 'gleich'], /MathERROR/, '.lcd');
await check('Eingabezeile mit Exponent', ['2', 'Komma', '5', 'x Quadrat'], '2,52', '.input');
await has('… Exponent hochgestellt', '.input .np');
await check('MODE-Menü', ['MODE'], /1:COMP2:STAT3:TABLE4:BASE-N/, '.lcd');
await check('SETUP Seite 1 wie am Gerät', ['SHIFT', 'MODE'], '1:Mth2D2:Linear3:Deg4:Rad5:Gra6:Fix7:Sci8:Norm▼', '.lcd');
await check('SETUP Seite 2 mit ▼', ['SHIFT', 'MODE', 'Nach unten'], '1:ab/c2:d/c3:STAT4:PerD5:AbAut6:◀KNTR▶7:Vibr▲', '.lcd');
await check('PerD: 1/6 periodisch', ['SHIFT', 'MODE', 'Nach unten', '4', '1', '1', 'Bruch', '6', 'gleich', 'S D'], '0,16');
await has('… mit Überstrich über der Periode', '.result .ovl');
await keys('AC', 'SHIFT', 'MODE', 'Nach unten', '4', '2');
await check('Linear: ⌟ als Rechenzeichen', ['SHIFT', 'MODE', '2', '1', 'Bruch', '3', 'plus', '1', 'Bruch', '6', 'gleich'], '0,5');
await keys('AC', 'SHIFT', 'MODE', '1');
await check('Exakte Summe 1+√2', ['1', 'plus', 'Wurzel', '2', 'gleich'], '1+2');
await has('… mit Wurzelzeichen', '.result .nr');
await check('sin 75° = (√6+√2)/4', ['sin', '7', '5', 'gleich'], '6+24');
await check('1/2 + √3/2', ['1', 'Bruch', '2', 'Nach rechts', 'plus', 'Wurzel', '3', 'Nach rechts', 'Bruch', '2', 'gleich'], '1+32');
await check('Summe per S⇔D dezimal', ['1', 'plus', 'Wurzel', '2', 'gleich', 'S D'], '2,414213562');
// Hohe Eingabe wie am Gerät: Eingabe nutzt die ganze Höhe, Ergebnis steht unten rechts, nichts wird abgeschnitten
const tall = ['Wurzel', '4', 'Bruch', '2', 'Nach rechts', 'plus', 'Bruch', '1', 'Bruch', '2', 'Nach rechts', 'Nach rechts', '2'];
for (const [name, extra, expected] of [['√(4/2 + (1/2)/2)', [], '32'], ['… + 3333333', ['Nach rechts', 'Nach rechts', 'plus', ...'3333333'], '3333334,5']]) {
  await check(`Hohe Eingabe ${name}`, [...tall, ...extra, 'gleich'], expected);
  const fits = await page.evaluate(() => {
    const lcd = document.querySelector('.lcd').getBoundingClientRect(), inp = document.querySelector('.input'), r = document.createRange();
    r.selectNodeContents(document.querySelector('.result'));
    const res = r.getBoundingClientRect();  // Inhalt des Ergebnisses, auch wenn es nur Text ist
    return inp.scrollHeight <= inp.clientHeight + 1 && inp.scrollWidth <= inp.clientWidth + 1 && res.bottom <= lcd.bottom + 0.5 && res.top >= lcd.top;
  });
  console.log(`${fits ? '✓' : '✗'} … Eingabe und Ergebnis vollständig sichtbar`); if (!fits) failed++;
}
await check('Ans fortsetzen', ['4', 'gleich', 'plus', '1', 'gleich'], '5');
await check('REPLAY', ['7', 'gleich', 'AC', 'Nach oben'], '7', '.input');
await keys('AC');
await page.keyboard.type('12*3'); await page.keyboard.press('Enter');
console.log((await text('.result')) === '36' ? '✓ Tastatureingabe 12*3=36' : (failed++, '✗ Tastatureingabe'));
await keys('AC');

// Menü oben links: darf den Rechner nicht verschieben, Links öffnen in neuem Fenster bzw. im Browser
const stageBox = () => page.locator('.stage').boundingBox().then(b => JSON.stringify(b));
const before = await stageBox();
await page.getByRole('button', {name: 'Menü'}).tap();
const links = await page.locator('.appMenu a').evaluateAll(as => as.map(a => `${a.textContent}|${a.target}|${a.rel}|${new URL(a.href).host}`));
const linksOk = links.length === 3 && links.every(l => /\|_blank\|noopener noreferrer\|github\.com$/.test(l));
console.log(`${linksOk ? '✓' : '✗'} Menü: ${links.map(l => l.split('|')[0]).join(', ')} (target=_blank, GitHub)`); if (!linksOk) failed++;
const layoutOk = before === await stageBox();
console.log(`${layoutOk ? '✓' : '✗'} Menü verschiebt den Rechner nicht`); if (!layoutOk) failed++;
await page.screenshot({path: 'test-results/e2e-menu.png'});
await page.locator('.lcd').tap();
const closed = await page.locator('.appMenu a').count() === 0;
console.log(`${closed ? '✓' : '✗'} Menü schließt bei Tipp daneben`); if (!closed) failed++;
await page.screenshot({path: 'test-results/e2e-phone.png'});
await browser.close();
if (failed) { console.error(`${failed} Prüfung(en) fehlgeschlagen`); process.exit(1); }
console.log('Alle E2E-Prüfungen bestanden');
