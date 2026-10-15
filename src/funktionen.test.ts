/**
 * Funktionskatalog: ein Testfall für jede Tastenbelegung (primär, SHIFT, ALPHA, STO/RCL-Variable, BASE-N),
 * jede Vorlage im Linear-Modus, jeden Menüeintrag und die hyp-Kombinationen.
 *
 * Der Block „Vollständigkeit“ prüft gegen KEYMAP, die Menüs und die Token-Tabelle des Rechenkerns, dass
 * nichts fehlt. Aus dem Katalog entsteht docs/TESTABDECKUNG.md (aktualisieren mit `npm test -- -u`).
 * Fälle mit `issue` dokumentieren bekannte Fehler: Sie laufen als `it.fails`, bis der Fehler behoben ist.
 */
import {describe, expect, it} from 'vitest';
import {initialState, KEYMAP, press, tableRows, type State} from './calc';
import {STRUCT, STRUCT_CLOSE, STRUCT_SEP, TOKENS} from './engine';

const run = (keys: string, s: State = initialState()) => keys.split(' ').filter(Boolean).reduce(press, s);

type Check = number | {text: string; check: (s: State) => void};
interface Case {id: string; fn: string; keys: string; check: Check; start?: () => State; issue?: number}

const LAYERS = {p: '–', s: 'SHIFT', a: 'ALPHA', v: 'STO/RCL', b: 'BASE-N'} as const;
type Layer = keyof typeof LAYERS;

const KEY_LABEL: Record<string, string> = {
  shift: 'SHIFT', alpha: 'ALPHA', mode: 'MODE', on: 'ON', up: '▲', down: '▼', left: '◀', right: '▶',
  abs: 'Abs', cube: 'x³', inv: 'x⁻¹', logab: 'log▫▫', frac: '▭/▭', sqrt: '√▫', sq: 'x²', pow: 'x^▫', log: 'log', ln: 'ln',
  neg: '(−)', dms: '°′″', hyp: 'hyp', sin: 'sin', cos: 'cos', tan: 'tan',
  rcl: 'RCL', eng: 'ENG', lpar: '(', rpar: ')', sd: 'S⇔D', mplus: 'M+',
  del: 'DEL', ac: 'AC', mul: '×', div: '÷', add: '+', sub: '−', comma: ',', exp: '×10ˣ', ans: 'Ans', eq: '=',
  ...Object.fromEntries([...'0123456789'].map(d => ['k' + d, d])),
};
/** Tastenfolge lesbar: Ziffern und Komma, die als Zahl eingegeben werden (nicht als Menüwahl oder nach SHIFT), werden zusammengezogen. */
function showKeys(keys: string, s: State = initialState()): string {
  let out = '', prevNum = false;
  for (const k of keys.split(' ').filter(Boolean)) {
    const num = /^(k\d|comma)$/.test(k) && !s.menu && !s.shift && !s.alpha && !s.pending;
    out += (out && !(num && prevNum) ? ' ' : '') + (KEY_LABEL[k] ?? k);
    prevNum = num; s = press(s, k);
  }
  return out;
}
const de = (v: number) => String(Number(v.toPrecision(10))).replace('.', ',').replace(/e\+?(-?\d+)$/, '×10^$1');

const near = (actual: number | undefined, expected: number) => {
  expect(actual).toBeTypeOf('number');
  expect(Math.abs(actual! - expected)).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(expected)));
};
const has = (text: string, check: (s: State) => void): Check => ({text, check});
const pair = (l1: string, v1: number, l2: string, v2: number): Check => has(`${l1}=${de(v1)}, ${l2}=${de(v2)}`, s => {
  expect(s.error).toBeNull(); expect(s.result?.kind).toBe('pair');
  if (s.result?.kind === 'pair') { expect(s.result.labels).toEqual([l1, l2]); near(s.result.values[0], v1); near(s.result.values[1], v2); }
});
const err = (e: string): Check => has(e, s => expect(s.error).toBe(e));
const named = (text: string, v: number): Check => has(text, s => { expect(s.error).toBeNull(); near(s.result?.value, v); });
const c = (id: string, fn: string, keys: string, check: Check, extra: Partial<Case> = {}): Case => ({id, fn, keys, check, ...extra});
const withRand = (r: number) => () => ({...initialState(), rand: () => r});

/** Speichert 7 per STO in die Variable der Taste und ruft sie über ALPHA wieder ab. */
const alphaVar = (key: string, v: string) => c(`${key}.a`, `Variable ${v}`, `k7 shift rcl ${key} ac alpha ${key} eq`, 7);
const stoRcl = (key: string, v: string) => c(`${key}.v`, `${v} bei STO/RCL`, `k3 shift rcl ${key} ac rcl ${key}`,
  has(`${v} = 3`, s => { expect(s.vars[v]).toBe(3); expect(s.result?.value).toBe(3); }));
const hexDigit = (key: string, d: string) => c(`${key}.b`, `Hex-Ziffer ${d}`, `shift k3 pow ${key} eq`, has(`${parseInt(d, 16)} (${d}₁₆)`, s => {
  expect(s.base).toBe(16); expect(s.result?.value).toBe(parseInt(d, 16));
}));

export const KEY_CASES: Case[] = [
  c('shift.p', 'SHIFT (grüne Funktionen)', 'shift', has('SHIFT aktiv', s => expect(s.shift).toBe(true))),
  c('alpha.p', 'ALPHA (orange Funktionen)', 'alpha', has('ALPHA aktiv', s => expect(s.alpha).toBe(true))),
  c('mode.p', 'MODE-Menü', 'mode', has('Menü MODE', s => expect(s.menu?.title).toBe('MODE'))),
  c('mode.s', 'SETUP-Menü', 'shift mode', has('Menü SETUP', s => expect(s.menu?.title).toBe('SETUP'))),
  c('on.p', 'Einschalten', 'shift ac on', has('eingeschaltet', s => expect(s.on).toBe(true))),
  c('up.p', 'REPLAY zurück', 'k1 add k1 eq k2 add k2 eq up', has('1+1 wieder im Display', s => expect(s.tokens).toEqual(['1', '+', '1']))),
  c('down.p', 'REPLAY vor', 'k1 eq k2 eq up up down', has('2 wieder im Display', s => expect(s.tokens).toEqual(['2']))),
  c('left.p', 'Cursor nach links', 'k1 k2 left k3', has('132', s => expect(s.tokens).toEqual(['1', '3', '2']))),
  c('right.p', 'Cursor nach rechts', 'k1 k2 left left right k3', has('132', s => expect(s.tokens).toEqual(['1', '3', '2']))),

  c('abs.p', 'Betrag', 'abs neg k5 eq', 5),
  c('abs.s', 'Division mit Rest ÷R', 'k1 k7 shift abs k5 eq', pair('Q', 3, 'R', 2)),
  c('cube.p', 'x³', 'k2 cube eq', 8),
  c('cube.a', 'Mehrfachanweisung :', 'k2 add k3 alpha cube ans mul k2 eq', 10),
  c('inv.p', 'Kehrwert x⁻¹', 'k4 inv eq', 0.25),
  c('inv.s', 'Fakultät x!', 'k5 shift inv eq', 120),
  c('logab.p', 'Logarithmus zur Basis a', 'logab k2 right k8 eq', 3),
  c('frac.p', 'Bruch', 'k1 frac k4 eq', 0.25),
  c('frac.s', 'Gemischter Bruch', 'shift frac k2 right k1 right k2 eq', 2.5),
  c('sqrt.p', 'Quadratwurzel', 'sqrt k1 k6 eq', 4),
  c('sqrt.s', 'Kubikwurzel', 'shift sqrt k2 k7 eq', 3),
  c('sq.p', 'x²', 'k3 sq eq', 9),
  c('sq.b', 'BASE-N: DEC', 'shift k3 pow tan tan eq sq', has('255 dezimal', s => { expect(s.base).toBe(10); expect(s.result?.value).toBe(255); })),
  c('pow.p', 'Potenz xʸ', 'k2 pow k1 k0 eq', 1024),
  c('pow.s', 'n-te Wurzel', 'shift pow k3 right k2 k7 eq', 3),
  c('pow.b', 'BASE-N: HEX', 'shift k3 pow tan tan eq', has('FF₁₆ = 255', s => { expect(s.base).toBe(16); expect(s.result?.value).toBe(255); })),
  c('log.p', 'Zehnerlogarithmus', 'log k1 k0 k0 eq', 2),
  c('log.s', '10ˣ', 'shift log k3 eq', 1000),
  c('log.b', 'BASE-N: BIN', 'shift k3 log k1 k0 k1 eq', has('101₂ = 5', s => { expect(s.base).toBe(2); expect(s.result?.value).toBe(5); })),
  c('ln.p', 'Natürlicher Logarithmus', 'ln alpha exp eq', 1),
  c('ln.s', 'eˣ', 'shift ln k1 eq', named('e', Math.E)),
  c('ln.b', 'BASE-N: OCT', 'shift k3 ln k1 k7 eq', has('17₈ = 15', s => { expect(s.base).toBe(8); expect(s.result?.value).toBe(15); })),

  c('neg.p', 'Vorzeichen', 'neg k3 mul k2 eq', -6),
  alphaVar('neg', 'A'), stoRcl('neg', 'A'), hexDigit('neg', 'A'),
  c('dms.p', 'Grad-Minuten-Sekunden', 'k3 k0 dms k3 k0 dms eq', 30.5),
  c('dms.s', 'Primfaktorzerlegung FACT', 'k3 k6 k0 eq shift dms', has('Anzeige 2³×3²×5', s => expect(s.view).toBe('fact'))),
  alphaVar('dms', 'B'), stoRcl('dms', 'B'), hexDigit('dms', 'B'),
  c('hyp.p', 'hyp: sinh', 'hyp sin k1 eq', named('sinh 1', Math.sinh(1))),
  alphaVar('hyp', 'C'), stoRcl('hyp', 'C'), hexDigit('hyp', 'C'),
  c('sin.p', 'Sinus (DEG)', 'sin k3 k0 eq', 0.5),
  c('sin.s', 'Arkussinus', 'shift sin k0 comma k5 eq', 30),
  alphaVar('sin', 'D'), stoRcl('sin', 'D'), hexDigit('sin', 'D'),
  c('cos.p', 'Kosinus (DEG)', 'cos k6 k0 eq', 0.5),
  c('cos.s', 'Arkuskosinus', 'shift cos k0 comma k5 eq', 60),
  alphaVar('cos', 'E'), stoRcl('cos', 'E'), hexDigit('cos', 'E'),
  c('tan.p', 'Tangens (DEG)', 'tan k4 k5 eq', 1),
  c('tan.s', 'Arkustangens', 'shift tan k1 eq', 45),
  alphaVar('tan', 'F'), stoRcl('tan', 'F'), hexDigit('tan', 'F'),

  c('rcl.p', 'RCL', 'k9 shift rcl rpar ac rcl rpar', has('X = 9', s => expect(s.result?.value).toBe(9))),
  c('rcl.s', 'STO', 'k9 shift rcl rpar', has('X = 9 gespeichert', s => expect(s.vars.X).toBe(9))),
  c('eng.p', 'ENG-Notation', 'k1 k2 k3 k4 eq eng eng', has('1234×10⁰', s => { expect(s.view).toBe('eng'); expect(s.engExp).toBe(0); })),
  c('eng.s', 'ENG← (Exponent +3)', 'k1 k2 k3 k4 eq shift eng shift eng', has('0,001234×10⁶', s => { expect(s.view).toBe('eng'); expect(s.engExp).toBe(6); })),
  c('lpar.p', 'Klammer auf', 'k2 lpar k3 add k4 eq', 14),
  c('lpar.s', 'Prozent', 'k2 k0 k0 mul k1 k5 shift lpar eq', 30),
  c('rpar.p', 'Klammer zu', 'lpar k2 add k3 rpar mul k4 eq', 20),
  c('rpar.s', 'Argumenttrenner ;', 'alpha mul k1 k2 shift rpar k1 k8 eq', 6),
  alphaVar('rpar', 'X'), stoRcl('rpar', 'X'),
  c('sd.p', 'S⇔D', 'k1 div k3 eq sd', has('0,3333333333', s => expect(s.view).toBe('dec'))),
  c('sd.s', 'ab/c ⇔ d/c', 'k7 div k3 eq shift sd', has('2⌟1⌟3', s => expect(s.view).toBe('mixed'))),
  alphaVar('sd', 'Y'), stoRcl('sd', 'Y'),
  c('mplus.p', 'M+', 'k5 mplus k2 mplus', has('M = 7', s => expect(s.vars.M).toBe(7))),
  c('mplus.s', 'M−', 'k5 mplus k2 shift mplus', has('M = 3', s => expect(s.vars.M).toBe(3))),
  alphaVar('mplus', 'M'), stoRcl('mplus', 'M'),

  c('k7.p', 'Ziffer 7', 'k7 eq', 7),
  c('k7.s', 'CONST-Menü', 'shift k7', has('Menü CONST', s => expect(s.menu?.title).toBe('CONST'))),
  c('k8.p', 'Ziffer 8', 'k8 eq', 8),
  c('k8.s', 'CONV-Menü', 'shift k8', has('Menü CONV', s => expect(s.menu?.title).toBe('CONV'))),
  c('k8.a', 'Conv-Menü', 'alpha k8', has('Menü CONV', s => expect(s.menu?.title).toBe('CONV'))),
  c('k9.p', 'Ziffer 9', 'k9 eq', 9),
  c('k9.s', 'CLR-Menü', 'shift k9', has('Menü CLR', s => expect(s.menu?.title).toBe('CLR'))),
  c('del.p', 'Löschen', 'k1 k2 k3 del', has('12', s => expect(s.tokens).toEqual(['1', '2']))),
  c('del.s', 'INS (Überschreiben)', 'k1 k2 k3 left left shift del k9', has('193', s => expect(s.tokens).toEqual(['1', '9', '3']))),
  c('ac.p', 'Eingabe löschen', 'k1 k2 ac', has('leeres Display', s => expect(s.tokens).toEqual([]))),
  c('ac.s', 'Ausschalten OFF', 'shift ac', has('ausgeschaltet', s => expect(s.on).toBe(false))),
  c('k4.p', 'Ziffer 4', 'k4 eq', 4),
  c('k5.p', 'Ziffer 5', 'k5 eq', 5),
  c('k6.p', 'Ziffer 6', 'k6 eq', 6),
  c('k6.s', 'VERIFY', 'shift k6', has('Hinweis „nicht nachgebildet“', s => expect(s.info).toEqual(['VERIFY', 'nicht nachgebildet']))),
  c('mul.p', 'Multiplikation', 'k6 mul k7 eq', 42),
  c('mul.s', 'Permutationen nPr', 'k5 shift mul k2 eq', 20),
  c('mul.a', 'ggT', 'alpha mul k1 k2 shift rpar k1 k8 eq', 6),
  c('div.p', 'Division', 'k1 k0 div k4 eq', 2.5),
  c('div.s', 'Kombinationen nCr', 'k5 shift div k2 eq', 10),
  c('div.a', 'kgV', 'alpha div k4 shift rpar k6 eq', 12),
  c('k1.p', 'Ziffer 1', 'k1 eq', 1),
  c('k1.s', 'STAT/DIST: wechselt in STAT', 'shift k1', has('Modus STAT', s => expect(s.mode).toBe('STAT'))),
  c('k2.p', 'Ziffer 2', 'k2 eq', 2),
  c('k3.p', 'Ziffer 3', 'k3 eq', 3),
  c('k3.s', 'BASE-N ein/aus', 'shift k3', has('Modus BASE-N, zweiter Druck zurück zu COMP', s => {
    expect(s.mode).toBe('BASE'); expect(run('shift k3', s).mode).toBe('COMP');
  })),
  c('add.p', 'Addition', 'k2 add k3 eq', 5),
  c('add.s', 'Polarkoordinaten Pol', 'shift add k1 shift rpar k1 eq', pair('r', Math.SQRT2, 'θ', 45)),
  c('add.a', 'Int (ganzzahliger Teil)', 'alpha add neg k2 comma k5 eq', -2),
  c('sub.p', 'Subtraktion', 'k5 sub k7 eq', -2),
  c('sub.s', 'Rechtwinklige Koordinaten Rec', 'shift sub k2 shift rpar k9 k0 eq', pair('x', 0, 'y', 2)),
  c('sub.a', 'Intg (größte ganze Zahl ≤ x)', 'alpha sub neg k2 comma k5 eq', -3),
  c('k0.p', 'Ziffer 0', 'k0 eq', 0),
  c('k0.s', 'Rnd (auf Anzeige runden, Fix 2)', 'shift mode k6 k2 shift k0 k2 div k3 eq', 0.67),
  c('comma.p', 'Dezimalkomma', 'k1 comma k5 mul k2 eq', 3),
  c('comma.s', 'Zufallszahl Ran#', 'shift comma eq', named('0,123 (Zufall 0,12345)', 0.123), {start: withRand(0.12345)}),
  c('comma.a', 'Zufalls-Ganzzahl RanInt', 'alpha comma k1 shift rpar k6 eq', named('6 (Zufall 0,999)', 6), {start: withRand(0.999)}),
  c('exp.p', '×10ˣ', 'k1 exp k3 eq', 1000),
  c('exp.s', 'π', 'shift exp eq', named('π', Math.PI)),
  c('exp.a', 'Eulersche Zahl e', 'alpha exp eq', named('e', Math.E)),
  c('ans.p', 'Ans', 'k5 eq ac ans mul k2 eq', 10),
  c('ans.s', 'DRG▸-Menü', 'shift ans', has('Menü DRG▸', s => expect(s.menu?.title).toBe('DRG▸'))),
  c('eq.p', 'Ergebnis', 'k1 add k2 eq', 3),
  c('eq.s', '≈ Dezimalergebnis', 'k1 div k4 shift eq', has('0,25 als Dezimalzahl', s => { expect(s.view).toBe('dec'); expect(s.result?.value).toBe(0.25); })),
];

export const COMBO_CASES: Case[] = [
  c('hyp cos', 'cosh', 'hyp cos k1 eq', named('cosh 1', Math.cosh(1))),
  c('hyp tan', 'tanh', 'hyp tan k1 eq', named('tanh 1', Math.tanh(1))),
  c('hyp SHIFT sin', 'sinh⁻¹', 'hyp shift sin k1 eq', named('arsinh 1', Math.asinh(1))),
  c('hyp SHIFT cos', 'cosh⁻¹', 'hyp shift cos k2 eq', named('arcosh 2', Math.acosh(2))),
  c('hyp SHIFT tan', 'tanh⁻¹', 'hyp shift tan k0 comma k5 eq', named('artanh 0,5', Math.atanh(0.5))),
  c('°′″ nach Ergebnis', 'Anzeige in Grad-Minuten-Sekunden', 'k3 k0 comma k5 eq dms', has('30°30′0″', s => expect(s.view).toBe('dms'))),
  c('√ negativ', 'Wurzel aus negativer Zahl', 'sqrt neg k4 eq', err('Math ERROR')),
  c('ln negativ', 'Logarithmus einer negativen Zahl', 'ln neg k1 eq', err('Math ERROR')),
  c('log₁', 'Logarithmus zur Basis 1', 'logab k1 right k8 eq', err('Math ERROR')),
  c('0÷0', 'Division 0 durch 0', 'k0 div k0 eq', err('Math ERROR')),
  c('cosh⁻¹ < 1', 'Definitionsbereich arcosh', 'hyp shift cos k0 eq', err('Math ERROR')),
  c('x! ganzzahlig', 'x! nur für ganze Zahlen', 'k2 comma k5 shift inv eq', err('Math ERROR')),
];

/** Vorlagen fügen im SETUP „Linear“ ein lineares Token ein. */
const LIN = 'shift mode k2 ';
export const LINEAR_CASES: Case[] = [
  c('abs.p.lin', 'Abs(', LIN + 'abs neg k5 rpar eq', 5),
  c('cube.p.lin', '³', LIN + 'k3 cube eq', 27),
  c('inv.p.lin', '⁻¹', LIN + 'k4 inv eq', 0.25),
  c('logab.p.lin', 'logₐ(', LIN + 'logab k2 shift rpar k8 rpar eq', 3),
  c('frac.s.lin', 'a⌟b⌟c', LIN + 'k2 shift frac k1 shift frac k2 eq', 2.5),
  c('sqrt.p.lin', '√(', LIN + 'sqrt k1 k6 rpar eq', 4),
  c('sqrt.s.lin', '³√(', LIN + 'shift sqrt k2 k7 rpar eq', 3),
  c('sq.p.lin', '²', LIN + 'k3 sq eq', 9),
  c('pow.p.lin', '^(', LIN + 'k2 pow k1 k0 rpar eq', 1024),
  c('pow.s.lin', 'ˣ√(', LIN + 'shift pow k3 shift rpar k8 rpar eq', 2),
  c('log.s.lin', '10^(', LIN + 'shift log k2 rpar eq', 100),
  c('ln.s.lin', 'ℯ^(', LIN + 'shift ln k0 rpar eq', 1),
  c('frac.p.lin', '⌟', LIN + 'k1 frac k4 eq', 0.25),
];

const STAT_DATA = 'mode k2 ' + [2, 4, 4, 4, 5, 5, 7, 9].map(d => `k${d} mplus`).join(' ') + ' ';
const page = (menuKeys: string, i: number) => `${menuKeys} ${i < 8 ? '' : 'down '}k${i % 8 + 1}`;
const CONST_VALUES: [string, number][] = [
  ['c Lichtgeschw.', 299792458], ['h Planck', 6.62607015e-34], ['k Boltzmann', 1.380649e-23],
  ['Nᴀ Avogadro', 6.02214076e23], ['G Gravitation', 6.6743e-11], ['g Fallbeschl.', 9.80665],
  ['e Elementarladung', 1.602176634e-19], ['mₑ Elektronenmasse', 9.1093837015e-31], ['R Gaskonstante', 8.314462618],
];
const CONV_VALUES: [string, string, number][] = [
  ['cm▸in', 'k2 comma k5 k4', 1], ['in▸cm', 'k1', 2.54], ['km▸mile', 'k1 comma k6 k0 k9 k3 k4 k4', 1], ['mile▸km', 'k1', 1.609344],
  ['kg▸lb', 'k0 comma k4 k5 k3 k5 k9 k2 k3 k7', 1], ['lb▸kg', 'k1', 0.45359237], ['°C▸°F', 'k1 k0 k0', 212], ['°F▸°C', 'k2 k1 k2', 100],
  ['km/h▸m/s', 'k3 k6', 10],
];
const setting = <K extends keyof State>(text: string, key: K, v: State[K]): Check =>
  has(text, s => expect(s[key]).toEqual(v));

export const MENU_CASES: Case[] = [
  c('MODE › COMP', 'Normalrechnen', 'mode k2 mode k1', setting('Modus COMP', 'mode', 'COMP')),
  c('MODE › STAT', 'Statistik', 'mode k2', setting('Modus STAT', 'mode', 'STAT')),
  c('MODE › TABLE', 'Wertetabelle f(X) = X², 1…3', 'mode k3 alpha rpar sq eq k1 eq k3 eq k1 eq', has('(1|1) (2|4) (3|9)', s => {
    expect(s.mode).toBe('TABLE'); expect(tableRows(s)).toEqual([[1, 1], [2, 4], [3, 9]]);
  })),
  c('MODE › BASE-N', 'Zahlensysteme', 'mode k4', setting('Modus BASE-N', 'mode', 'BASE')),

  c('SETUP › Mth2D', 'Lehrbuch-Ein-/Ausgabe', 'shift mode k2 shift mode k1', setting('Mth2D', 'math2d', true)),
  c('SETUP › Linear', 'Lineare Ein-/Ausgabe', 'shift mode k2', setting('Linear', 'math2d', false)),
  c('SETUP › Deg', 'Altgrad', 'shift mode k4 shift mode k3', setting('DEG', 'angle', 'DEG')),
  c('SETUP › Rad', 'Bogenmaß', 'shift mode k4 sin shift exp div k2 eq', has('RAD, sin(π/2) = 1', s => { expect(s.angle).toBe('RAD'); near(s.result?.value, 1); })),
  c('SETUP › Gra', 'Neugrad', 'shift mode k5 sin k1 k0 k0 eq', has('GRA, sin 100 = 1', s => { expect(s.angle).toBe('GRA'); near(s.result?.value, 1); })),
  c('SETUP › Fix', 'Feste Nachkommastellen', 'shift mode k6 k2', setting('Fix 2', 'fmt', {mode: 'FIX', digits: 2})),
  c('SETUP › Sci', 'Wissenschaftliche Notation', 'shift mode k7 k3', setting('Sci 3', 'fmt', {mode: 'SCI', digits: 3})),
  c('SETUP › Norm', 'Normaldarstellung', 'shift mode k6 k2 shift mode k8 k2', setting('Norm 2', 'fmt', {mode: 'NORM', digits: 2})),
  c('SETUP › ab/c', 'Ausgabe gemischter Bruch', 'shift mode down k1', setting('ab/c', 'mixedOut', true)),
  c('SETUP › d/c', 'Ausgabe unechter Bruch', 'shift mode down k1 shift mode down k2', setting('d/c', 'mixedOut', false)),
  c('SETUP › STAT', 'Häufigkeitsspalte', 'shift mode down k3 k1', setting('Häufigkeit EIN', 'freq', true)),
  c('SETUP › PerD', 'Periodische Dezimalzahlen', 'shift mode down k4 k1', setting('PerD EIN', 'perD', true)),
  c('SETUP › AbAut', 'Abschaltautomatik', 'shift mode down k5 k2', setting('60 Minuten', 'autoOff', 60)),
  c('SETUP › ◀KNTR▶', 'Kontrast', 'shift mode down k6 right right left eq', setting('Kontrast 6', 'contrast', 6)),
  c('SETUP › Vibr', 'Vibration (nur PWA)', 'shift mode down k7 k2', setting('Vibration AUS', 'vibrate', false)),

  c('CLR › Setup', 'Einstellungen zurücksetzen', 'shift mode k4 shift k9 k1 eq', setting('wieder DEG', 'angle', 'DEG')),
  c('CLR › Speicher', 'Variablen löschen', 'k5 shift rcl neg shift k9 k2 eq', has('A = 0', s => expect(s.vars.A).toBe(0))),
  c('CLR › Alle', 'Alles zurücksetzen', 'k5 shift rcl neg shift mode k4 shift k9 k3 eq', has('A = 0 und DEG', s => {
    expect(s.vars.A).toBe(0); expect(s.angle).toBe('DEG');
  })),

  ...CONST_VALUES.map(([label, v], i) => c(`CONST › ${label}`, 'Konstante', page('shift k7', i) + ' eq', named(de(v), v))),
  ...CONV_VALUES.map(([label, input, v], i) => c(`CONV › ${label}`, 'Umrechnung', page(`${input} shift k8`, i), v)),

  c('DRG▸ › °', 'Eingabe in Grad', 'shift mode k4 sin k9 k0 shift ans k1 eq', named('RAD: sin 90° = 1', 1)),
  c('DRG▸ › ʳ', 'Eingabe im Bogenmaß', 'shift exp shift ans k2 eq', named('DEG: πʳ = 180', 180)),
  c('DRG▸ › ᵍ', 'Eingabe in Neugrad', 'k1 k0 k0 shift ans k3 eq', named('DEG: 100ᵍ = 90', 90)),

  ...([['n', 8], ['x̄', 5], ['σx', 2], ['sx', Math.sqrt(32 / 7)], ['Σx', 40], ['Σx²', 232], ['minX', 2], ['maxX', 9]] as const)
    .map(([label, v], i) => c(`STAT › ${label}`, 'Daten 2, 4, 4, 4, 5, 5, 7, 9', STAT_DATA + `shift k1 k${i + 1} eq`, v)),
  c('STAT › Daten löschen', 'Statistikdaten löschen', STAT_DATA + 'shift k1 down k1', setting('keine Daten', 'stats', [])),
];

const ALL = [KEY_CASES, COMBO_CASES, LINEAR_CASES, MENU_CASES].flat();
const endState = (k: Case) => run(k.keys, k.start?.() ?? initialState());

const check = (k: Case) => () => {
  const s = endState(k);
  if (typeof k.check === 'number') { expect(s.error).toBeNull(); near(s.result?.value, k.check); } else k.check.check(s);
};
const suite = (name: string, cases: Case[]) => describe(name, () => {
  for (const k of cases) (k.issue ? it.fails : it)(`${k.id}: ${k.fn}${k.issue ? ` (bekannter Fehler #${k.issue})` : ''}`, check(k));
});
suite('Tasten', KEY_CASES);
suite('Kombinationen und Fehlerfälle', COMBO_CASES);
suite('Vorlagen im Linear-Modus', LINEAR_CASES);
suite('Menüs', MENU_CASES);

describe('Vollständigkeit', () => {
  const ids = new Set(ALL.map(k => k.id));
  it('keine doppelten Fall-IDs', () => expect(ids.size).toBe(ALL.length));
  it('jede Tastenbelegung hat einen Testfall', () => {
    const missing = Object.entries(KEYMAP).flatMap(([key, def]) =>
      (Object.keys(LAYERS) as Layer[]).filter(l => def[l]).map(l => `${key}.${l}`)).filter(id => !ids.has(id));
    expect(missing).toEqual([]);
  });
  it('jede Vorlage hat einen Testfall im Linear-Modus', () => {
    const missing = Object.entries(KEYMAP).flatMap(([key, def]) =>
      (Object.keys(LAYERS) as Layer[]).filter(l => { const a = def[l]; return typeof a === 'object' && 'tpl' in a; }).map(l => `${key}.${l}.lin`)).filter(id => !ids.has(id));
    expect(missing).toEqual([]);
  });
  it('jeder Menüeintrag hat einen Testfall', () => {
    const menus = ['mode', 'shift mode', 'shift k9', 'shift k7', 'shift k8', 'shift ans', 'mode k2 shift k1'];
    const missing = menus.flatMap(keys => {
      const m = run(keys).menu!;
      return m.items.map(i => `${m.title} › ${i.label}`);
    }).filter(id => !ids.has(id));
    expect(missing).toEqual([]);
  });
  it('jedes Token des Rechenkerns wird in einem Testfall eingegeben', () => {
    const used = new Set(ALL.flatMap(k => { const s = endState(k); return [...s.tokens, ...s.history.flatMap(h => h.tokens), ...s.table.f]; }));
    const all = [...Object.keys(TOKENS), ...Object.keys(STRUCT), ...Object.keys(STRUCT_SEP), ...Object.keys(STRUCT_CLOSE)];
    expect(all.filter(t => !used.has(t))).toEqual([]);
  });
  it('docs/TESTABDECKUNG.md ist aktuell', async () => {
    await expect(markdown()).toMatchFileSnapshot('../docs/TESTABDECKUNG.md');
  });
});

function markdown(): string {
  const shown = (k: Case) => k.keys.startsWith(STAT_DATA) && k.id.startsWith('STAT ›')
    ? '… ' + showKeys(k.keys.slice(STAT_DATA.length), run(STAT_DATA)) : showKeys(k.keys, k.start?.());
  const expectText = (k: Case) => typeof k.check === 'number' ? de(k.check) : k.check.text;
  const status = (k: Case) => k.issue ? `❌ [#${k.issue}](https://github.com/michiproep/iq-s1-pwa/issues/${k.issue})` : '✅';
  const row = (cells: string[]) => `| ${cells.map(x => x.replace(/\|/g, '\\|')).join(' | ')} |`;
  const table = (head: string[], rows: string[][]) => [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n');
  const generic = (cases: Case[]) => table(['Fall', 'Funktion', 'Tastenfolge', 'Erwartet', ''],
    cases.map(k => [k.id, k.fn, `\`${shown(k)}\``, expectText(k), status(k)]));
  const keyRows = KEY_CASES.map(k => {
    const [key, layer] = k.id.split('.') as [string, Layer];
    return [KEY_LABEL[key] ?? key, LAYERS[layer], k.fn, `\`${shown(k)}\``, expectText(k), status(k)];
  });
  const bugs = ALL.filter(k => k.issue);
  return `# Testabdeckung der Rechenfunktionen

> Diese Datei wird aus [\`src/funktionen.test.ts\`](../src/funktionen.test.ts) erzeugt. Nicht von Hand ändern,
> sondern \`npm test -- -u\` ausführen. \`npm test\` schlägt fehl, wenn sie nicht zum Testkatalog passt.

## So wird Vollständigkeit geprüft

Der Funktionskatalog enthält **${ALL.length} Testfälle**. Jeder Fall tippt eine Tastenfolge wie am Gerät ein und prüft das Ergebnis.
Zusätzlich prüfen automatische Tests, dass nichts fehlt:

1. **Jede Tastenbelegung** in \`KEYMAP\` (\`src/calc.ts\`) hat einen Fall: primär, SHIFT, ALPHA, Variable bei STO/RCL und BASE-N.
2. **Jede Vorlage** (Bruch, Wurzel, Potenz …) hat zusätzlich einen Fall im SETUP „Linear“.
3. **Jeder Menüeintrag** von MODE, SETUP, CLR, CONST, CONV, DRG▸ und STAT hat einen Fall. Die Einträge werden aus den Menüs selbst gelesen.
4. **Jedes Token des Rechenkerns** (\`TOKENS\` und Vorlagen-Strukturen in \`src/engine.ts\`) wird in mindestens einem Fall eingegeben.

Kommt eine Taste, ein Menüeintrag oder eine Funktion hinzu, schlägt \`npm test\` fehl, bis ein Testfall dafür existiert.

Bekannte Fehler: ${bugs.length ? bugs.map(k => `[#${k.issue}](https://github.com/michiproep/iq-s1-pwa/issues/${k.issue}) (${k.id})`).join(', ') : 'keine'}.
Sie laufen als \`it.fails\` und werden rot, sobald der Fehler behoben ist. Dann die Markierung entfernen.

Die Ergebnisse sind nicht mit dem Originalgerät abgeglichen. Die erwarteten Werte stammen aus der Mathematik bzw. aus CODATA.
Tests für Randfälle (Fehlermeldungen, Anzeigeformate, exakte Formen, Brüche navigieren …) stehen in
[\`src/engine.test.ts\`](../src/engine.test.ts) und [\`src/calc.test.ts\`](../src/calc.test.ts).

## Tasten (${KEY_CASES.length})

Ebene: – = ohne Umschaltung, SHIFT = grün, ALPHA = orange, STO/RCL = Variable nach STO oder RCL, BASE-N = Belegung im BASE-N-Modus.
Winkeleinheit ist DEG, wenn nicht anders angegeben.

${table(['Taste', 'Ebene', 'Funktion', 'Tastenfolge', 'Erwartet', ''], keyRows)}

## Kombinationen und Fehlerfälle (${COMBO_CASES.length})

${generic(COMBO_CASES)}

## Vorlagen im Linear-Modus (${LINEAR_CASES.length})

Alle Folgen beginnen mit \`SHIFT MODE 2\` (SETUP → Linear).

${generic(LINEAR_CASES)}

## Menüs (${MENU_CASES.length})

STAT-Fälle verwenden die Daten 2, 4, 4, 4, 5, 5, 7, 9 (eingegeben mit \`MODE 2\` und je Wert \`M+\`). In der Tabelle ist das als „…“ abgekürzt.

${generic(MENU_CASES)}
`;
}
