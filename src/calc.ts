import {
  CONSTANTS, CONVERSIONS, evaluateTokens, factorize, type Angle, type Base, type NumFormat, type Result, engStart, VARS,
  asFraction, isClose, isOpen, isSep, isStruct, structGroup,
} from './engine';

export type Mode = 'COMP' | 'STAT' | 'TABLE' | 'BASE';
export type View = 'auto' | 'dec' | 'frac' | 'mixed' | 'eng' | 'dms' | 'fact' | 'per';
/** ins: einzelnes Token · tpl: Vorlage mit Cursorposition `at` (cont: nach Ergebnis mit Ans fortsetzen) · cmd: Befehl */
type Action = {ins: string} | {tpl: string[]; at: number; cont?: boolean; lin: string} | {cmd: string};
// lin: Token, das im SETUP „Linear“ statt der Vorlage eingefügt wird (wie am Gerät)
export interface MenuItem {label: string; act: (s: State) => State}
/** title: Kennung (wird nicht angezeigt) · heading: angezeigte Frage · contrast: Kontrast-Einstellbildschirm */
export interface Menu {title?: string; heading?: string; items: MenuItem[]; top: number; digitPrompt?: (s: State, d: number) => State | null; contrast?: boolean}
/** Einträge pro Menüseite (2 Spalten × 4 Zeilen wie am Gerät). */
export const MENU_PAGE = 8;
interface HistoryEntry {tokens: string[]; result: Result}
type TablePhase = 'f' | 'start' | 'end' | 'step' | 'list';

export interface State {
  on: boolean; mode: Mode; base: Base; angle: Angle; fmt: NumFormat; mixedOut: boolean;
  /** SETUP: Mth2D (Lehrbuch) oder Linear, Häufigkeit in STAT, periodische Dezimalzahlen, Abschaltautomatik (Minuten), Kontrast 0–10 */
  math2d: boolean; freq: boolean; perD: boolean; autoOff: 10 | 60; contrast: number;
  tokens: string[]; cursor: number; insert: boolean; prefill?: boolean;
  shift: boolean; alpha: boolean; hyp: boolean; pending: 'STO' | 'RCL' | null;
  shown: boolean; result: Result | null; view: View; engExp: number; error: string | null; info: string[] | null;
  ans: number; vars: Record<string, number>; history: HistoryEntry[]; histPos: number; stats: number[];
  menu: Menu | null;
  table: {phase: TablePhase; f: string[]; start: number; end: number; step: number; pos: number};
  rand?: () => number;
}

export const initialState = (): State => ({
  on: true, mode: 'COMP', base: 10, angle: 'DEG', fmt: {mode: 'NORM', digits: 1}, mixedOut: false,
  math2d: true, freq: false, perD: false, autoOff: 10, contrast: 5,
  tokens: [], cursor: 0, insert: true, shift: false, alpha: false, hyp: false, pending: null,
  shown: false, result: null, view: 'auto', engExp: 0, error: null, info: null,
  ans: 0, vars: Object.fromEntries(VARS.map(v => [v, 0])), history: [], histPos: -1, stats: [],
  menu: null, table: {phase: 'f', f: [], start: 1, end: 5, step: 1, pos: 0},
});

/** Tastenbelegung: primär / SHIFT (grün) / ALPHA (orange) / Variable bei STO/RCL / BASE-N-Funktion. */
export const KEYMAP: Record<string, {p: Action; s?: Action; a?: Action; v?: string; b?: Action}> = {
  shift: {p: {cmd: 'SHIFT'}}, alpha: {p: {cmd: 'ALPHA'}}, mode: {p: {cmd: 'MODE'}, s: {cmd: 'SETUP'}}, on: {p: {cmd: 'ON'}},
  up: {p: {cmd: 'UP'}}, down: {p: {cmd: 'DOWN'}}, left: {p: {cmd: 'LEFT'}}, right: {p: {cmd: 'RIGHT'}},
  abs: {p: {tpl: ['A(', 'A)'], at: 1, lin: 'Abs('}, s: {ins: '÷R'}}, cube: {p: {tpl: ['P(', '3', 'P)'], at: 3, cont: true, lin: '³'}, a: {ins: ':'}},
  inv: {p: {tpl: ['P(', 'neg', '1', 'P)'], at: 4, cont: true, lin: '⁻¹'}, s: {ins: '!'}}, logab: {p: {tpl: ['L(', 'L|', 'L)'], at: 1, lin: 'logab('}},
  frac: {p: {cmd: 'FRAC'}, s: {tpl: ['M(', 'M|1', 'M|2', 'M)'], at: 1, lin: 'frac'}}, sqrt: {p: {tpl: ['R(', 'R)'], at: 1, lin: '√('}, s: {tpl: ['R3(', 'R)'], at: 1, lin: '³√('}},
  sq: {p: {tpl: ['P(', '2', 'P)'], at: 3, cont: true, lin: '²'}, b: {cmd: 'DEC'}}, pow: {p: {tpl: ['P(', 'P)'], at: 1, cont: true, lin: '^('}, s: {tpl: ['N(', 'N|', 'N)'], at: 1, lin: 'ˣ√('}, b: {cmd: 'HEX'}},
  log: {p: {ins: 'log('}, s: {tpl: ['1', '0', 'P(', 'P)'], at: 3, lin: '10^('}, b: {cmd: 'BIN'}}, ln: {p: {ins: 'ln('}, s: {tpl: ['ℯ', 'P(', 'P)'], at: 2, lin: 'e^('}, b: {cmd: 'OCT'}},
  neg: {p: {ins: 'neg'}, a: {ins: 'varA'}, v: 'A', b: {ins: 'hexA'}},
  dms: {p: {ins: '°'}, s: {cmd: 'FACT'}, a: {ins: 'varB'}, v: 'B', b: {ins: 'hexB'}},
  hyp: {p: {cmd: 'HYP'}, a: {ins: 'varC'}, v: 'C', b: {ins: 'hexC'}},
  sin: {p: {cmd: 'sin'}, s: {cmd: 'asin'}, a: {ins: 'varD'}, v: 'D', b: {ins: 'hexD'}},
  cos: {p: {cmd: 'cos'}, s: {cmd: 'acos'}, a: {ins: 'varE'}, v: 'E', b: {ins: 'hexE'}},
  tan: {p: {cmd: 'tan'}, s: {cmd: 'atan'}, a: {ins: 'varF'}, v: 'F', b: {ins: 'hexF'}},
  rcl: {p: {cmd: 'RCL'}, s: {cmd: 'STO'}}, eng: {p: {cmd: 'ENG'}, s: {cmd: 'ENGL'}},
  lpar: {p: {ins: '('}, s: {ins: '%'}}, rpar: {p: {ins: ')'}, s: {ins: ';'}, a: {ins: 'varX'}, v: 'X'},
  sd: {p: {cmd: 'SD'}, s: {cmd: 'MIXED'}, a: {ins: 'varY'}, v: 'Y'},
  mplus: {p: {cmd: 'M+'}, s: {cmd: 'M-'}, a: {ins: 'varM'}, v: 'M'},
  k7: {p: {ins: '7'}, s: {cmd: 'CONST'}}, k8: {p: {ins: '8'}, s: {cmd: 'CONV'}, a: {cmd: 'CONV'}}, k9: {p: {ins: '9'}, s: {cmd: 'CLR'}},
  del: {p: {cmd: 'DEL'}, s: {cmd: 'INS'}}, ac: {p: {cmd: 'AC'}, s: {cmd: 'OFF'}},
  k4: {p: {ins: '4'}}, k5: {p: {ins: '5'}}, k6: {p: {ins: '6'}, s: {cmd: 'VERIFY'}},
  mul: {p: {ins: '×'}, s: {ins: 'P'}, a: {ins: 'ggT('}}, div: {p: {ins: '÷'}, s: {ins: 'C'}, a: {ins: 'kgV('}},
  k1: {p: {ins: '1'}, s: {cmd: 'STATDIST'}}, k2: {p: {ins: '2'}}, k3: {p: {ins: '3'}, s: {cmd: 'BASE'}},
  add: {p: {ins: '+'}, s: {ins: 'Pol('}, a: {ins: 'Int('}}, sub: {p: {ins: '−'}, s: {ins: 'Rec('}, a: {ins: 'Intg('}},
  k0: {p: {ins: '0'}, s: {ins: 'Rnd('}}, comma: {p: {ins: ','}, s: {ins: 'Ran#'}, a: {ins: 'RanInt('}},
  exp: {p: {ins: 'E'}, s: {ins: 'π'}, a: {ins: 'ℯ'}}, ans: {p: {ins: 'Ans'}, s: {cmd: 'DRG'}}, eq: {p: {cmd: '='}, s: {cmd: '≈'}},
};

const DIGIT_KEY: Record<string, number> = {k0: 0, k1: 1, k2: 2, k3: 3, k4: 4, k5: 5, k6: 6, k7: 7, k8: 8, k9: 9};
/** Tokens, die nach einem Ergebnis automatisch „Ans“ voranstellen. */
const CONTINUES = new Set(['+', '−', '×', '÷', '²', '³', '⁻¹', '^(', '!', '%', '÷R', 'P', 'C', 'E', 'frac', '°']);

const ctxOf = (s: State, ans = s.ans) => ({angle: s.angle, ans, vars: s.vars, stats: s.stats, fmt: s.fmt, base: s.mode === 'BASE' ? s.base : 10 as Base, rand: s.rand});
const clearFlags = (s: State): State => ({...s, shift: false, alpha: false});
const msg = (s: State, ...lines: string[]): State => ({...s, info: lines});

function menu(items: [string, (s: State) => State][], title?: string): Menu {
  return {title, top: 0, items: items.map(([label, act]) => ({label, act}))};
}
function digitPrompt(heading: string, f: (s: State, d: number) => State | null): Menu {
  return {heading, items: [], top: 0, digitPrompt: f};
}
/** Auswahl mit angezeigter Frage, z. B. „Häufigkeit?“ 1:EIN 2:AUS. */
function choice(heading: string, items: [string, (s: State) => State][]): Menu {
  return {...menu(items), heading};
}

const insert = (s: State, tok: string): State => insertSeq(s, [tok], 1, CONTINUES.has(tok));

/** Fügt eine Tokenfolge am Cursor ein; der Cursor steht danach an Position `at` innerhalb der Folge. */
function insertSeq(s: State, seq: string[], at: number, cont: boolean): State {
  if (s.shown || s.error) {
    const fresh = {...s, shown: false, error: null, view: 'auto' as View, result: null};
    const toks = cont ? ['Ans', ...seq] : seq;
    return {...fresh, tokens: toks, cursor: at + (cont ? 1 : 0)};
  }
  if (s.prefill) return {...s, prefill: false, tokens: seq, cursor: at};
  if (s.tokens.length + seq.length > 99) return s;
  const tokens = [...s.tokens];
  const overwrite = !s.insert && seq.length === 1 && s.cursor < tokens.length && !isStruct(tokens[s.cursor]);
  tokens.splice(s.cursor, overwrite ? 1 : 0, ...seq);
  return {...s, tokens, cursor: s.cursor + at};
}

/**
 * ▲/▼ innerhalb von Brüchen: wechselt zwischen Zähler und Nenner des innersten passenden Bruchs.
 * Liefert die neue Cursorposition (Ende des Zielfelds), die alte Position, wenn der Cursor in einem Bruch
 * steht, aber kein Wechsel möglich ist, oder null außerhalb von Brüchen (dann gilt REPLAY).
 */
export function fracVertical(tokens: string[], cursor: number, up: boolean): number | null {
  const stack: {open: number; slot: number}[] = [];
  for (let i = 0; i < cursor; i++) {
    const t = tokens[i];
    if (isOpen(t)) stack.push({open: i, slot: 0});
    else if (isSep(t) && stack.length) stack[stack.length - 1].slot++;
    else if (isClose(t)) stack.pop();
  }
  let inFraction = false;
  for (let k = stack.length - 1; k >= 0; k--) {
    const {open, slot} = stack[k], type = tokens[open];
    if (type !== 'F(' && type !== 'M(') continue;
    inFraction = true;
    // Feldnummern: Bruch 0 = Zähler, 1 = Nenner; gemischter Bruch 1 = Zähler, 2 = Nenner
    const num = type === 'F(' ? 0 : 1, den = num + 1;
    const target = up ? (slot === den ? num : -1) : (slot === num ? den : -1);
    if (target < 0) continue;
    return structGroup(tokens, open)[target + 1];  // Position vor dem Trenner/Schluss-Token = Feldende
  }
  return inFraction ? cursor : null;
}

/** Bruchvorlage. Eine unmittelbar vor dem Cursor stehende Zahl wird zum Zähler. */
function fracTemplate(s: State): State {
  if (s.shown || s.error) return insertSeq(s, ['F(', 'Ans', 'F|', 'F)'], 3, false);
  const simple = (t: string) => /^\d$/.test(t) || t === ',' || t === 'Ans' || t === 'π' || t === 'ℯ' || /^(var|K)/.test(t);
  let j = s.cursor;
  while (!s.prefill && j > 0) {
    const t = s.tokens[j - 1];
    if (simple(t)) j--;
    else if (isClose(t)) j = structGroup(s.tokens, j - 1)[0];  // ganze Vorlage (z. B. √2, x²) übernehmen
    else break;
  }
  if (j === s.cursor) return insertSeq(s, ['F(', 'F|', 'F)'], 1, false);
  const run = s.tokens.slice(j, s.cursor);
  const tokens = [...s.tokens.slice(0, j), 'F(', ...run, 'F|', 'F)', ...s.tokens.slice(s.cursor)];
  return {...s, tokens, cursor: j + run.length + 2};
}

function evaluate(s: State): State {
  if (s.mode === 'TABLE') return tableEnter(s);
  if (!s.tokens.length) return s;
  try {
    const result = evaluateTokens(s.tokens, ctxOf(s));
    const history = [...s.history, {tokens: s.tokens, result}].slice(-30);
    return {...s, result, ans: result.value, shown: true, view: 'auto', error: null, history, histPos: history.length - 1};
  } catch (e) {
    return {...s, error: e instanceof Error ? e.message : 'Math ERROR'};
  }
}

function tableEnter(s: State): State {
  const t = s.table;
  const num = (toks: string[]) => evaluateTokens(toks, ctxOf(s)).value;
  try {
    if (t.phase === 'f') {
      if (!s.tokens.length) return s;
      return {...s, table: {...t, phase: 'start', f: s.tokens}, tokens: tokOf(t.start), cursor: tokOf(t.start).length, prefill: true};
    }
    if (t.phase === 'start') { const v = num(s.tokens); return {...s, table: {...t, phase: 'end', start: v}, tokens: tokOf(t.end), cursor: tokOf(t.end).length, prefill: true}; }
    if (t.phase === 'end') { const v = num(s.tokens); return {...s, table: {...t, phase: 'step', end: v}, tokens: tokOf(t.step), cursor: tokOf(t.step).length, prefill: true}; }
    if (t.phase === 'step') {
      const step = num(s.tokens);
      const count = Math.floor((t.end - t.start) / step + 1e-9) + 1;
      if (!(step > 0) || t.end < t.start || count > 30) throw Error('Range ERROR');
      return {...s, table: {...t, phase: 'list', step, pos: 0}, tokens: [], cursor: 0};
    }
  } catch (e) {
    return {...s, error: e instanceof Error ? e.message : 'Math ERROR'};
  }
  return s;
}
function tokOf(n: number): string[] {
  const str = String(n).replace('.', ',');
  return str.startsWith('-') ? ['neg', ...str.slice(1)] : [...str];
}

export function tableRows(s: State): [number, number | null][] {
  const t = s.table;
  const count = Math.floor((t.end - t.start) / t.step + 1e-9) + 1;
  return Array.from({length: Math.max(0, Math.min(30, count))}, (_, i) => {
    const x = Number((t.start + i * t.step).toPrecision(12));
    try { return [x, evaluateTokens(t.f, {...ctxOf(s), vars: {...s.vars, X: x}}).value]; } catch { return [x, null]; }
  });
}

function trig(s: State, name: 'sin' | 'cos' | 'tan', inverse: boolean): State {
  const id = (inverse ? 'a' : '') + name + (s.hyp ? 'h' : '') + '(';
  return insert({...s, hyp: false}, id);
}

function reset(s: State, what: 'setup' | 'memory' | 'all'): State {
  const fresh = initialState();
  if (what === 'setup') return {
    ...s, angle: fresh.angle, fmt: fresh.fmt, mixedOut: false, math2d: true, freq: false, perD: false, autoOff: 10, contrast: 5,
    menu: null, info: ['Setup gelöscht'],
  };
  if (what === 'memory') return {...s, vars: fresh.vars, ans: 0, stats: [], menu: null, info: ['Speicher gelöscht']};
  return {...fresh, rand: s.rand, info: ['Alles zurückgesetzt']};
}
const confirm = (what: 'setup' | 'memory' | 'all'): Menu => ({...menu([['= : Ja', s => reset(s, what)]], 'Zurücksetzen?'), heading: 'Zurücksetzen?'});

function modeMenu(): Menu {
  const to = (mode: Mode) => (s: State): State => ({
    ...s, mode, menu: null, tokens: [], cursor: 0, shown: false, result: null, error: null, base: mode === 'BASE' ? s.base : 10,
    table: mode === 'TABLE' ? {...s.table, phase: 'f'} : s.table,
  });
  return menu([['COMP', to('COMP')], ['STAT', to('STAT')], ['TABLE', to('TABLE')], ['BASE-N', to('BASE')]], 'MODE');
}
function setupMenu(): Menu {
  const ang = (angle: Angle) => (s: State): State => ({...s, angle, menu: null});
  return menu([
    ['Mth2D', s => ({...s, math2d: true, menu: null})], ['Linear', s => ({...s, math2d: false, menu: null})],
    ['Deg', ang('DEG')], ['Rad', ang('RAD')], ['Gra', ang('GRA')],
    ['Fix', s => ({...s, menu: digitPrompt('Fix 0~9?', (st, d) => ({...st, fmt: {mode: 'FIX', digits: d}, menu: null, shown: st.shown}))})],
    ['Sci', s => ({...s, menu: digitPrompt('Sci 0~9?', (st, d) => ({...st, fmt: {mode: 'SCI', digits: d === 0 ? 10 : d}, menu: null}))})],
    ['Norm', s => ({...s, menu: digitPrompt('Norm 1~2?', (st, d) => d === 1 || d === 2 ? {...st, fmt: {mode: 'NORM', digits: d}, menu: null} : null)})],
    // Seite 2
    ['ab/c', s => ({...s, mixedOut: true, menu: null})], ['d/c', s => ({...s, mixedOut: false, menu: null})],
    ['STAT', s => ({...s, menu: choice('Häufigkeit?', [['EIN', st => ({...st, freq: true, menu: null})], ['AUS', st => ({...st, freq: false, menu: null})]])})],
    ['PerD', s => ({...s, menu: choice('Periodische Dez.?', [['EIN', st => ({...st, perD: true, menu: null})], ['AUS', st => ({...st, perD: false, menu: null})]])})],
    ['AbAut', s => ({...s, menu: choice('Abschaltautomatik', [['10 Min.', st => ({...st, autoOff: 10, menu: null})], ['60 Min.', st => ({...st, autoOff: 60, menu: null})]])})],
    ['◀KNTR▶', s => ({...s, menu: {heading: 'KONTRAST', items: [], top: 0, contrast: true}})],
  ], 'SETUP');
}

const STAT_ITEMS: [string, string][] = [['n', 'n'], ['x̄', 'x̄'], ['σx', 'σx'], ['sx', 'sx'], ['Σx', 'Σx'], ['Σx²', 'Σx²'], ['minX', 'minX'], ['maxX', 'maxX']];

function command(s: State, cmd: string): State {
  switch (cmd) {
    case 'SHIFT': return {...s, shift: !s.shift, alpha: false};
    case 'ALPHA': return {...s, alpha: !s.alpha, shift: false};
    case 'HYP': return {...s, hyp: !s.hyp};
    case 'sin': case 'cos': case 'tan': return trig(s, cmd, false);
    case 'asin': case 'acos': case 'atan': return trig(s, cmd.slice(1) as 'sin', true);
    case 'MODE': return {...s, menu: modeMenu()};
    case 'SETUP': return {...s, menu: setupMenu()};
    case 'CLR': return {...s, menu: menu([['Setup', st => ({...st, menu: confirm('setup')})], ['Speicher', st => ({...st, menu: confirm('memory')})], ['Alle', st => ({...st, menu: confirm('all')})]], 'CLR')};
    case 'CONST': return {...s, menu: menu(CONSTANTS.map(([sym, name], i) => [`${sym} ${name}`, st => insert({...st, menu: null}, 'K' + i)]), 'CONST')};
    case 'CONV': return {...s, menu: menu(CONVERSIONS.map(([name], i) => [name, st => {
      const base = st.shown || !st.tokens.length ? {...st, shown: false, tokens: ['Ans'], cursor: 1} : st;
      const withConv = {...base, menu: null, tokens: [...base.tokens.filter(t => !t.startsWith('conv')), 'conv' + i]};
      return evaluate({...withConv, cursor: withConv.tokens.length});
    }]), 'CONV')};
    case 'DRG': return {...s, menu: menu([['°', st => insert({...st, menu: null}, '°')], ['ʳ', st => insert({...st, menu: null}, 'ʳ')], ['ᵍ', st => insert({...st, menu: null}, 'ᵍ')]], 'DRG▸')};
    case 'STATDIST':
      if (s.mode !== 'STAT') return {...s, mode: 'STAT', tokens: [], cursor: 0, shown: false, result: null, info: ['STAT-Modus:', 'Wert eingeben, M+ = Daten']};
      return {...s, menu: menu([...STAT_ITEMS.map(([l, t]): [string, (st: State) => State] => [l, st => insert({...st, menu: null}, t)]), ['Daten löschen', st => ({...st, stats: [], menu: null, info: ['Statistikdaten gelöscht']})]], 'STAT')};
    case 'BASE':
      return s.mode === 'BASE' ? {...s, mode: 'COMP', base: 10, tokens: [], cursor: 0, shown: false, result: null}
        : {...s, mode: 'BASE', base: 10, tokens: [], cursor: 0, shown: false, result: null};
    case 'DEC': case 'HEX': case 'BIN': case 'OCT':
      return {...s, base: ({DEC: 10, HEX: 16, BIN: 2, OCT: 8} as const)[cmd], tokens: s.shown ? s.tokens : [], cursor: 0};
    case 'VERIFY': return msg(s, 'VERIFY', 'nicht nachgebildet');
    case 'STO': case 'RCL': return {...s, pending: cmd};
    case 'ON': return {...s, on: true, shift: false, alpha: false, tokens: [], cursor: 0, shown: false, result: null, error: null, menu: null, info: null, pending: null, hyp: false};
    case 'OFF': return {...s, on: false, menu: null, info: null, tokens: [], cursor: 0, shown: false, result: null, error: null};
    case 'AC':
      if (s.mode === 'TABLE' && s.table.phase !== 'f') return {...s, table: {...s.table, phase: 'f'}, tokens: s.table.f, cursor: s.table.f.length, error: null, shown: false};
      return {...s, tokens: [], cursor: 0, shown: false, result: null, error: null, menu: null, info: null, pending: null, hyp: false};
    case 'DEL':
      if (s.shown) return {...s, shown: false, cursor: s.tokens.length};
      if (!s.insert && s.cursor < s.tokens.length && !isStruct(s.tokens[s.cursor])) return {...s, tokens: s.tokens.filter((_, i) => i !== s.cursor)};
      if (s.cursor === 0) return s;
      if (isStruct(s.tokens[s.cursor - 1])) {
        // Vorlage auflösen, Inhalt der Eingabefelder bleibt erhalten
        const k = s.cursor - 1, group = structGroup(s.tokens, k);
        return {...s, tokens: s.tokens.filter((_, i) => !group.includes(i)), cursor: k - group.filter(i => i < k).length};
      }
      return {...s, tokens: s.tokens.filter((_, i) => i !== s.cursor - 1), cursor: s.cursor - 1};
    case 'INS': return {...s, insert: !s.insert};
    case 'FRAC': return s.math2d ? fracTemplate(s) : insert(s, 'frac');
    case 'LEFT':
      if (s.mode === 'TABLE' && s.table.phase === 'list') return s;
      if (s.shown) return {...s, shown: false, cursor: s.tokens.length};
      return {...s, cursor: s.cursor > 0 ? s.cursor - 1 : s.tokens.length};
    case 'RIGHT':
      if (s.mode === 'TABLE' && s.table.phase === 'list') return s;
      if (s.shown) return {...s, shown: false, cursor: 0};
      return {...s, cursor: s.cursor < s.tokens.length ? s.cursor + 1 : 0};
    case 'UP': case 'DOWN': {
      if (s.mode === 'TABLE' && s.table.phase === 'list') {
        const n = tableRows(s).length;
        return {...s, table: {...s.table, pos: Math.max(0, Math.min(n - 1, s.table.pos + (cmd === 'UP' ? -1 : 1)))}};
      }
      if (!s.shown && !s.error) {
        const moved = fracVertical(s.tokens, s.cursor, cmd === 'UP');
        if (moved !== null) return moved === s.cursor ? s : {...s, cursor: moved};
      }
      if (!s.history.length) return s;
      const cur = s.shown ? s.histPos : s.history.length;
      const pos = Math.max(0, Math.min(s.history.length - 1, cur + (cmd === 'UP' ? -1 : 1)));
      if (cmd === 'DOWN' && cur >= s.history.length - 1 && !s.shown) return s;
      const h = s.history[pos];
      return {...s, histPos: pos, tokens: h.tokens, cursor: h.tokens.length, result: h.result, shown: true, view: 'auto', error: null};
    }
    case '=': return evaluate(s);
    case '≈': { const r = evaluate(s); return r.shown ? {...r, view: 'dec'} : r; }
    case 'SD': {
      const r = s.shown ? s : evaluate(s);
      if (!r.shown || !r.result) return r;
      return {...r, view: nextSD(r, s.shown)};
    }
    case 'MIXED': return s.shown ? {...s, view: s.view === 'mixed' ? 'frac' : 'mixed'} : s;
    case 'ENG': case 'ENGL': {
      const base = s.shown ? s : evaluate(s);
      if (!base.shown || !base.result) return base;
      const start = base.view === 'eng' ? base.engExp : engStart(base.result.value) + (cmd === 'ENG' ? 3 : -3);
      return {...base, view: 'eng', engExp: start + (cmd === 'ENG' ? -3 : 3)};
    }
    case 'FACT':
      if (!s.shown || !s.result) return s;
      try { factorize(s.result.value); return {...s, view: 'fact'}; } catch { return {...s, error: 'Math ERROR'}; }
    case 'M+': case 'M-': {
      if (s.mode === 'STAT' && cmd === 'M+' && !s.shown) {
        // Datenpunkt erfassen; mit Häufigkeit (SETUP STAT EIN) als „Wert;Häufigkeit“
        const sep = s.freq ? s.tokens.indexOf(';') : -1;
        let val: number, count = 1;
        try {
          if (sep > 0) {
            val = evaluateTokens(s.tokens.slice(0, sep), ctxOf(s)).value;
            count = evaluateTokens(s.tokens.slice(sep + 1), ctxOf(s)).value;
          } else val = s.tokens.length ? evaluateTokens(s.tokens, ctxOf(s)).value : s.ans;
        } catch (e) { return {...s, error: e instanceof Error ? e.message : 'Math ERROR'}; }
        if (!Number.isInteger(count) || count < 1 || count > 999) return {...s, error: 'Math ERROR'};
        const stats = [...s.stats, ...Array<number>(count).fill(val)];
        return {...s, stats, tokens: [], cursor: 0, shown: false, result: null, info: [`n=${stats.length}`, 'Datenpunkt gespeichert']};
      }
      const base = s.tokens.length && !s.shown ? evaluate(s) : s.tokens.length ? s : {...s, result: {kind: 'num', value: s.ans} as Result, shown: true};
      if (base.error || !base.result) return base;
      const v = base.result.value;
      return {...base, vars: {...base.vars, M: base.vars.M + (cmd === 'M+' ? v : -v)}, view: 'auto'};
    }
  }
  return s;
}

/**
 * S⇔D: Mth2D wechselt exakt ↔ Dezimal (mit PerD: Bruch ↔ periodische Dezimalzahl),
 * Linear wechselt Dezimal ↔ linearer Bruch. wasShown = false: erster Druck direkt nach der Eingabe.
 */
function nextSD(s: State, wasShown: boolean): View {
  const cur: View = wasShown ? s.view : 'auto';
  if (!s.math2d) return cur === 'frac' ? 'auto' : 'frac';
  if (s.perD && s.result?.kind === 'num' && asFraction(s.result.value)) return cur === 'per' ? 'auto' : 'per';
  return cur === 'dec' || cur === 'per' ? 'auto' : 'dec';
}

/** Verarbeitet einen Tastendruck und liefert den neuen Zustand. */
export function press(state: State, key: string): State {
  const def = KEYMAP[key];
  if (!def) return state;
  let s = state;
  if (!s.on) return key === 'on' ? command(s, 'ON') : s;
  if (key === 'on') return command(s, 'ON');
  if (s.info) { s = {...s, info: null}; if (key === 'ac') return clearFlags(s); }

  if (s.menu) {
    const m = s.menu;
    if (key === 'ac') return clearFlags({...s, menu: null});
    if (key === 'shift' || key === 'alpha') return command(s, key.toUpperCase());
    if (m.digitPrompt) {
      const d = DIGIT_KEY[key];
      if (d === undefined) return s;
      return m.digitPrompt(clearFlags(s), d) ?? s;
    }
    if (m.contrast) {
      if (key === 'left' || key === 'right') return {...s, contrast: Math.max(0, Math.min(10, s.contrast + (key === 'left' ? -1 : 1)))};
      if (key === 'eq') return clearFlags({...s, menu: null});
      return s;
    }
    // Seitenweise blättern; die Nummerierung beginnt auf jeder Seite bei 1
    if (key === 'up') return {...s, menu: {...m, top: Math.max(0, m.top - MENU_PAGE)}};
    if (key === 'down') return {...s, menu: {...m, top: m.top + MENU_PAGE < m.items.length ? m.top + MENU_PAGE : m.top}};
    if (m.title === 'Zurücksetzen?') return key === 'eq' ? m.items[0].act(clearFlags(s)) : s;
    const d = DIGIT_KEY[key];
    const item = d && d <= MENU_PAGE ? m.items[m.top + d - 1] : undefined;
    if (item) return item.act(clearFlags(s));
    if (key === 'mode') return command(clearFlags(s), s.shift ? 'SETUP' : 'MODE');
    return s;
  }

  if (s.error) {
    if (key === 'ac') return command({...s, error: null}, 'AC');
    if (key === 'left' || key === 'right' || key === 'del') return {...s, error: null, shown: false, cursor: s.tokens.length};
    return s;
  }

  if (s.pending) {
    if (key === 'ac') return {...s, pending: null, shift: false, alpha: false};
    if (key === 'shift' || key === 'alpha') return s;
    const v = def.v;
    if (!v) return {...s, pending: null};
    if (s.pending === 'STO') {
      const base = s.tokens.length && !s.shown ? evaluate({...s, pending: null}) : {...s, pending: null, shown: true, result: s.result ?? {kind: 'num', value: s.ans} as Result};
      if (base.error || !base.result) return clearFlags(base);
      return clearFlags({...base, vars: {...base.vars, [v]: base.result.value}, info: [`${v}=`, String(base.result.value).replace('.', ',')]});
    }
    return clearFlags({...s, pending: null, shown: true, tokens: ['var' + v], cursor: 1, result: {kind: 'num', value: s.vars[v]}, view: 'auto', ans: s.vars[v]});
  }

  if (s.mode === 'TABLE' && s.table.phase === 'list' && !['shift', 'alpha', 'up', 'down', 'ac', 'mode'].includes(key)) return s;

  let act: Action | undefined;
  if (key === 'shift' || key === 'alpha') act = def.p;
  else if (s.mode === 'BASE' && def.b && !s.shift && !s.alpha) act = def.b;
  else if (s.shift) act = def.s;
  else if (s.alpha) act = def.a;
  else act = def.p;
  if (key !== 'shift' && key !== 'alpha') s = clearFlags(s);
  if (!act) return s;
  if (s.mode === 'BASE' && (('ins' in act && [',', 'E', '°'].includes(act.ins)) || 'tpl' in act || ('cmd' in act && act.cmd === 'FRAC'))) return s;
  if (s.shown && s.result?.kind === 'num' && 'ins' in act && act.ins === '°') return {...s, view: s.view === 'dms' ? 'auto' : 'dms'};
  if ('ins' in act) return insert(s, act.ins);
  if ('tpl' in act) return s.math2d ? insertSeq(s, act.tpl, act.at, !!act.cont) : insert(s, act.lin);
  return command(act.cmd === '=' || act.cmd === 'FRAC' ? s : {...s, prefill: false}, act.cmd);
}
