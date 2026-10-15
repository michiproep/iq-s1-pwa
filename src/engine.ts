import {all, create} from 'mathjs';

export type Angle = 'DEG' | 'RAD' | 'GRA';
export type Base = 2 | 8 | 10 | 16;
export interface NumFormat {mode: 'NORM' | 'FIX' | 'SCI'; digits: number}

/** Ein Eingabe-Token: was auf dem Display steht und was ausgewertet wird. */
interface TokenDef {disp: string; code: string}

const fn = (disp: string, code: string): TokenDef => ({disp, code});

/** Alle Tokens, die nicht einfach Ziffern sind. Schlüssel = Token-ID. */
export const TOKENS: Record<string, TokenDef> = {
  ',': fn(',', '.'), ';': fn(';', ','), '(': fn('(', '('), ')': fn(')', ')'),
  '+': fn('+', '+'), '−': fn('−', '-'), '×': fn('×', '*'), '÷': fn('÷', '/'), 'neg': fn('-', '-'),
  '²': fn('²', '^2'), '³': fn('³', '^3'), '⁻¹': fn('⁻¹', '^(-1)'), '^(': fn('^(', '^('), '!': fn('!', '!'), '%': fn('%', '/100'),
  '√(': fn('√(', 'sqrt('), '³√(': fn('³√(', 'cbrt('), 'ˣ√(': fn('ˣ√(', '_xrt('),
  'log(': fn('log(', 'log10('), 'logab(': fn('logₐ(', '_logab('), 'ln(': fn('ln(', 'log('),
  '10^(': fn('10^(', '(10)^('), 'e^(': fn('ℯ^(', '(e)^('),
  'sin(': fn('sin(', '_sin('), 'cos(': fn('cos(', '_cos('), 'tan(': fn('tan(', '_tan('),
  'asin(': fn('sin⁻¹(', '_asin('), 'acos(': fn('cos⁻¹(', '_acos('), 'atan(': fn('tan⁻¹(', '_atan('),
  'sinh(': fn('sinh(', 'sinh('), 'cosh(': fn('cosh(', 'cosh('), 'tanh(': fn('tanh(', 'tanh('),
  'asinh(': fn('sinh⁻¹(', 'asinh('), 'acosh(': fn('cosh⁻¹(', 'acosh('), 'atanh(': fn('tanh⁻¹(', 'atanh('),
  'Abs(': fn('Abs(', 'abs('), 'π': fn('π', '(pi)'), 'ℯ': fn('ℯ', '(e)'), 'E': fn('ᴇ', 'ᴇ'),
  'Ans': fn('Ans', '(ans)'), 'Ran#': fn('Ran#', '_ran()'), 'RanInt(': fn('RanInt(', '_ranint('), 'Rnd(': fn('Rnd(', '_rnd('),
  'ggT(': fn('ggT(', '_gcd('), 'kgV(': fn('kgV(', '_lcm('), 'Pol(': fn('Pol(', '_pol('), 'Rec(': fn('Rec(', '_rec('),
  'Int(': fn('Int(', '_int('), 'Intg(': fn('Intg(', 'floor('), 'P': fn('𝐏', '#P#'), 'C': fn('𝐂', '#C#'),
  'frac': fn('⌟', '⌟'), '°': fn('°', '°'), 'ʳ': fn('ʳ', 'ʳ'), 'ᵍ': fn('ᵍ', 'ᵍ'), ':': fn(':', ':'), '÷R': fn('÷R', '÷R'),
  'x̄': fn('x̄', '(_st_mean)'), 'σx': fn('σx', '(_st_sd)'), 'sx': fn('sx', '(_st_s)'), 'n': fn('n', '(_st_n)'),
  'Σx': fn('Σx', '(_st_sum)'), 'Σx²': fn('Σx²', '(_st_sum2)'), 'minX': fn('minX', '(_st_min)'), 'maxX': fn('maxX', '(_st_max)'),
};
/**
 * Strukturelemente der Lehrbuch-Darstellung. Jede Vorlage besteht aus einem Öffnungs-Token,
 * optionalen Trennern zwischen den Eingabefeldern und einem Schluss-Token.
 */
export const STRUCT: Record<string, {code: string; seps?: string[]}> = {
  'F(': {code: '((', seps: ['F|']},            // Bruch: Zähler | Nenner
  'M(': {code: '((', seps: ['M|1', 'M|2']},    // gemischter Bruch: Ganzes | Zähler | Nenner
  'R(': {code: 'sqrt('}, 'R3(': {code: 'cbrt('}, // Quadrat- und Kubikwurzel
  'N(': {code: '_xrt((', seps: ['N|']},        // n-te Wurzel: Index | Radikand
  'P(': {code: '^('},                          // Exponent
  'L(': {code: '_logab((', seps: ['L|']},      // log_a(b)
  'A(': {code: 'abs('},                        // Betrag
};
export const STRUCT_SEP: Record<string, string> = {'F|': ')/(', 'M|1': ')+((', 'M|2': ')/(', 'N|': '),(', 'L|': '),('};
export const STRUCT_CLOSE: Record<string, string> = {'F)': '))', 'M)': ')))', 'R)': ')', 'N)': '))', 'P)': ')', 'L)': '))', 'A)': ')'};
export const isOpen = (t: string) => t in STRUCT;
export const isSep = (t: string) => t in STRUCT_SEP;
export const isClose = (t: string) => t in STRUCT_CLOSE;
export const isStruct = (t: string) => isOpen(t) || isSep(t) || isClose(t);

/** Indizes aller Marker (Öffnung, Trenner, Schluss) der Vorlage, zu der der Marker an Position i gehört. */
export function structGroup(tokens: string[], i: number): number[] {
  let start = i;
  if (!isOpen(tokens[i])) {
    for (let depth = 0, j = i - 1; j >= 0; j--) {
      if (isClose(tokens[j])) depth++;
      else if (isOpen(tokens[j])) { if (depth === 0) { start = j; break; } depth--; }
    }
  }
  const idx = [start];
  for (let depth = 0, j = start + 1; j < tokens.length; j++) {
    if (isOpen(tokens[j])) depth++;
    else if (isClose(tokens[j])) { if (depth === 0) { idx.push(j); break; } depth--; }
    else if (isSep(tokens[j]) && depth === 0) idx.push(j);
  }
  return idx;
}

export const VARS = ['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'] as const;
for (const v of VARS) TOKENS['var' + v] = fn(v, `(${v}_v)`);
for (const h of 'ABCDEF') TOKENS['hex' + h] = fn(h, h);

export const tokenDisplay = (t: string) => TOKENS[t]?.disp ?? t;
export const showTokens = (ts: string[]) => ts.map(tokenDisplay).join('');

export interface Ctx {
  angle: Angle; ans: number; vars: Record<string, number>;
  stats?: number[]; fmt?: NumFormat; base?: Base; rand?: () => number;
}

/** Ergebnis einer Auswertung: Zahl oder Wertepaar (Pol, Rec, ÷R). */
export type Result = {kind: 'num'; value: number} | {kind: 'pair'; value: number; labels: [string, string]; values: [number, number]};

function gcd(a: number, b: number) {
  a = Math.abs(a); b = Math.abs(b);
  if (!Number.isInteger(a) || !Number.isInteger(b)) throw Error('Math ERROR');
  while (b) [a, b] = [b, a % b];
  return a;
}
function fact(n: number) {
  if (!Number.isInteger(n) || n < 0 || n > 69) throw Error('Math ERROR');
  let x = 1; for (let i = 2; i <= n; i++) x *= i; return x;
}

/** Eigene mathjs-Instanz: x! wie am Gerät nur für ganze Zahlen 0–69 (mathjs rechnet sonst mit der Gammafunktion). */
const math = create(all);
math.import({factorial: fact}, {override: true});
const {evaluate, fraction} = math;

const OPERAND = String.raw`(\d*\.?\d+(?:e-?\d+)?|\([^()]*\))`;

/** Übersetzt Tokens in einen mathjs-Ausdruck. */
export function translate(tokens: string[], base: Base = 10): string {
  let out = '';
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (base !== 10 && (/^\d$/.test(t) || t.startsWith('hex'))) {
      let lit = '';
      while (i < tokens.length && (/^\d$/.test(tokens[i]) || tokens[i].startsWith('hex'))) lit += tokens[i++].replace('hex', '');
      i--;
      const n = parseInt(lit, base);
      if (Number.isNaN(n) || [...lit].some(c => parseInt(c, 16) >= base)) throw Error('Syntax ERROR');
      out += `(${n})`;
      continue;
    }
    if (t.startsWith('hex')) throw Error('Syntax ERROR');
    out += STRUCT[t]?.code ?? STRUCT_SEP[t] ?? STRUCT_CLOSE[t] ?? TOKENS[t]?.code ?? t;
  }
  // Fehlende schließende Klammern ergänzen (wie am Gerät erlaubt)
  const open = (out.match(/\(/g) ?? []).length - (out.match(/\)/g) ?? []).length;
  if (open > 0) out += ')'.repeat(open);
  // Zahl ᴇ Exponent
  out = out.replace(/(\d*\.?\d+)ᴇ(-?\d+)/g, '($1e$2)').replace(/ᴇ/g, '*10^');
  // Grad-Minuten-Sekunden
  out = out.replace(/(\d*\.?\d+)°(\d*\.?\d+)°(?:(\d*\.?\d+)°)?/g, (_, a, b, c) => `(${a}+${b}/60+${c ?? 0}/3600)°`);
  // Brüche a⌟b⌟c und a⌟b
  out = out.replace(/(\d+)⌟(\d+)⌟(\d+)/g, '($1+$2/$3)');
  out = out.replace(new RegExp(`${OPERAND}⌟${OPERAND}`, 'g'), '(($1)/($2))').replace(/⌟/g, '/');
  // nPr / nCr (Infix)
  out = out.replace(new RegExp(`${OPERAND}#P#${OPERAND}`, 'g'), '_npr($1,$2)').replace(new RegExp(`${OPERAND}#C#${OPERAND}`, 'g'), '_ncr($1,$2)');
  if (out.includes('#')) throw Error('Syntax ERROR');
  return out.replace(/°/g, '*_deg').replace(/ʳ/g, '*_radu').replace(/ᵍ/g, '*_grau');
}

function splitTop(tokens: string[], sep: string): string[][] {
  const parts: string[][] = [[]];
  for (const t of tokens) t === sep ? parts.push([]) : parts[parts.length - 1].push(t);
  return parts;
}

export function evaluateTokens(tokens: string[], ctx: Ctx): Result {
  if (!tokens.length) throw Error('Syntax ERROR');
  const statements = splitTop(tokens, ':');
  let res: Result = {kind: 'num', value: ctx.ans};
  for (const st of statements) res = evalOne(st, {...ctx, ans: res.value});
  return res;
}

function evalOne(tokens: string[], ctx: Ctx): Result {
  const last = tokens[tokens.length - 1];
  if (last?.startsWith('conv')) {
    const conv = CONVERSIONS[Number(last.slice(4))];
    return {kind: 'num', value: conv[1](evalNum(tokens.slice(0, -1), ctx))};
  }
  const divR = splitTop(tokens, '÷R');
  if (divR.length === 2) {
    const a = evalNum(divR[0], ctx), b = evalNum(divR[1], ctx);
    if (!Number.isInteger(a) || !Number.isInteger(b) || b === 0) throw Error('Math ERROR');
    const q = Math.trunc(a / b), r = a - q * b;
    return {kind: 'pair', value: q, labels: ['Q', 'R'], values: [q, r]};
  }
  if (divR.length > 2) throw Error('Syntax ERROR');
  const holder: {pair?: Result} = {};
  const value = evalNum(tokens, ctx, holder);
  return holder.pair ?? {kind: 'num', value};
}

function evalNum(tokens: string[], ctx: Ctx, holder: {pair?: Result} = {}): number {
  const base = ctx.base ?? 10;
  const code = translate(tokens, base);
  const toRad = (x: number) => ctx.angle === 'DEG' ? x * Math.PI / 180 : ctx.angle === 'GRA' ? x * Math.PI / 200 : x;
  const fromRad = (x: number) => ctx.angle === 'DEG' ? x * 180 / Math.PI : ctx.angle === 'GRA' ? x * 200 / Math.PI : x;
  const clean = (x: number) => Math.abs(x) < 1e-15 ? 0 : x;
  const unit = (rad: number) => fromRad(rad);
  const st = ctx.stats ?? [];
  const mean = st.length ? st.reduce((a, b) => a + b, 0) / st.length : NaN;
  const ss = st.reduce((a, b) => a + (b - mean) ** 2, 0);
  const statVal = (v: number) => { if (!st.length || !Number.isFinite(v)) throw Error('Math ERROR'); return v; };
  const rand = ctx.rand ?? Math.random;
  const fmt = ctx.fmt ?? {mode: 'NORM', digits: 10};
  const scope: Record<string, unknown> = {
    ans: ctx.ans,
    _sin: (x: number) => clean(Math.sin(toRad(x))), _cos: (x: number) => clean(Math.cos(toRad(x))),
    _tan: (x: number) => {
      const r = toRad(x);
      if (Math.abs(Math.cos(r)) < 1e-15) throw Error('Math ERROR');
      return clean(Math.tan(r));
    },
    _asin: (x: number) => { if (Math.abs(x) > 1) throw Error('Math ERROR'); return fromRad(Math.asin(x)); },
    _acos: (x: number) => { if (Math.abs(x) > 1) throw Error('Math ERROR'); return fromRad(Math.acos(x)); },
    _atan: (x: number) => fromRad(Math.atan(x)),
    _xrt: (n: number, x: number) => {
      if (n === 0) throw Error('Math ERROR');
      if (x < 0) { if (Number.isInteger(n) && Math.abs(n) % 2 === 1) return -Math.pow(-x, 1 / n); throw Error('Math ERROR'); }
      return Math.pow(x, 1 / n);
    },
    _logab: (a: number, b: number) => { if (a <= 0 || a === 1 || b <= 0) throw Error('Math ERROR'); return Math.log(b) / Math.log(a); },
    _ran: () => Math.round(rand() * 1000) / 1000,
    _ranint: (a: number, b: number) => {
      if (!Number.isInteger(a) || !Number.isInteger(b) || a > b) throw Error('Math ERROR');
      return Math.floor(rand() * (b - a + 1)) + a;
    },
    _rnd: (x: number) => Number(formatNumber(x, fmt, true)),
    _gcd: gcd, _lcm: (a: number, b: number) => a === 0 || b === 0 ? 0 : Math.abs(a * b) / gcd(a, b),
    _npr: (n: number, r: number) => { if (r > n || r < 0) throw Error('Math ERROR'); return fact(n) / fact(n - r); },
    _ncr: (n: number, r: number) => { if (r > n || r < 0) throw Error('Math ERROR'); return Math.round(fact(n) / (fact(r) * fact(n - r))); },
    _pol: (x: number, y: number) => {
      const r = Math.hypot(x, y), th = unit(Math.atan2(y, x));
      holder.pair = {kind: 'pair', value: r, labels: ['r', 'θ'], values: [r, th]}; return r;
    },
    _rec: (r: number, th: number) => {
      const x = clean(r * Math.cos(toRad(th))), y = clean(r * Math.sin(toRad(th)));
      holder.pair = {kind: 'pair', value: x, labels: ['x', 'y'], values: [x, y]}; return x;
    },
    _int: Math.trunc,
    _deg: ctx.angle === 'DEG' ? 1 : ctx.angle === 'RAD' ? Math.PI / 180 : 200 / 180,
    _radu: unit(1), _grau: ctx.angle === 'GRA' ? 1 : ctx.angle === 'DEG' ? 180 / 200 : Math.PI / 200,
    _st_n: st.length, _st_sum: st.reduce((a, b) => a + b, 0), _st_sum2: st.reduce((a, b) => a + b * b, 0),
    get _st_mean() { return statVal(mean); },
    get _st_sd() { return statVal(Math.sqrt(ss / st.length)); },
    get _st_s() { if (st.length < 2) throw Error('Math ERROR'); return Math.sqrt(ss / (st.length - 1)); },
    get _st_min() { return statVal(Math.min(...st)); }, get _st_max() { return statVal(Math.max(...st)); },
  };
  for (const v of VARS) scope[`${v}_v`] = ctx.vars[v] ?? 0;
  let value: unknown;
  try {
    value = evaluate(code, scope);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    throw Error(msg === 'Math ERROR' ? msg : /Unexpected|Parenthesis|end of expression|Value expected|Undefined/i.test(msg) ? 'Syntax ERROR' : 'Math ERROR');
  }
  const n = typeof value === 'number' ? value : Number((value as {valueOf(): unknown})?.valueOf?.());
  if (!Number.isFinite(n) || Math.abs(n) >= 1e100) throw Error('Math ERROR');
  return base !== 10 ? Math.trunc(n) : n;
}

/** Zahl in Anzeigeform (mit Dezimalkomma). Gibt Mantisse und optionalen Zehnerexponenten zurück. */
export function formatParts(v: number, fmt: NumFormat): {mant: string; exp: number | null} {
  if (v === 0) return {mant: fmt.mode === 'FIX' ? (0).toFixed(fmt.digits).replace('.', ',') : '0', exp: null};
  const abs = Math.abs(v);
  const sci = (digits: number, trim: boolean) => {
    let [m, e] = v.toExponential(digits - 1).split('e');
    if (trim && m.includes('.')) m = m.replace(/\.?0+$/, '');
    return {mant: m.replace('.', ','), exp: Number(e)};
  };
  if (fmt.mode === 'SCI') return sci(fmt.digits || 10, false);
  if (fmt.mode === 'FIX') {
    if (abs >= 1e10) return sci(10, true);
    const s = v.toFixed(fmt.digits);
    if (Number(s) === 0 && fmt.digits < 10 && abs < 1e-9) return sci(10, true);
    return {mant: s.replace('.', ','), exp: null};
  }
  const norm1 = fmt.digits === 1;
  if (abs >= 1e10 || abs < (norm1 ? 0.01 : 1e-9)) return sci(10, true);
  const p = Number(v.toPrecision(10));
  let s = String(p);
  if (s.includes('e')) s = p.toFixed(12).replace(/\.?0+$/, '');
  return {mant: s.replace('.', ','), exp: null};
}

export function formatNumber(v: number, fmt: NumFormat, plain = false): string {
  const {mant, exp} = formatParts(v, fmt);
  if (plain) return exp === null ? mant.replace(',', '.') : `${mant.replace(',', '.')}e${exp}`;
  return exp === null ? mant : `${mant}×10^${exp}`;
}

/** Exakter Bruch (Nenner ≤ 9999) oder null. */
export function asFraction(v: number): {s: number; n: number; d: number} | null {
  if (!Number.isFinite(v) || Number.isInteger(v) || Math.abs(v) >= 1e10) return null;
  try {
    const f = fraction(v);
    const n = Number(f.n), d = Number(f.d), s = Number(f.s);
    if (d > 9999 || d === 1) return null;
    if (Math.abs(s * n / d - v) > Math.abs(v) * 1e-12) return null;
    return {s, n, d};
  } catch { return null; }
}

/**
 * Exakte Darstellung: Bruch, Wurzelterm s·n√r/d, π-Vielfaches s·nπ/d oder
 * Summe (a + b₁√r₁ + b₂√r₂)/d mit höchstens zwei Wurzeltermen (a darf 0 sein).
 */
export type Exact = {kind: 'frac'; s: number; n: number; d: number} | {kind: 'surd'; s: number; n: number; r: number; d: number}
  | {kind: 'pi'; s: number; n: number; d: number} | {kind: 'sum'; a: number; terms: {b: number; r: number}[]; d: number};

function ratApprox(v: number, maxDen: number, tol: number): {n: number; d: number} | null {
  for (let d = 1; d <= maxDen; d++) {
    const n = Math.round(v * d);
    if (Math.abs(n / d - v) <= tol * Math.max(1, Math.abs(v))) return {n, d};
  }
  return null;
}

export function exactForm(v: number): Exact | null {
  if (!Number.isFinite(v) || v === 0 || Math.abs(v) >= 1e6) return null;
  const f = asFraction(v);
  if (f) return {kind: 'frac', ...f};
  if (Number.isInteger(v)) return null;
  const s = Math.sign(v), a = Math.abs(v);
  // Wurzelterm: a² ist ein Bruch p/q → a = √(p·q)/q = n√r/d
  const sq = ratApprox(a * a, 999, 1e-11);
  if (sq && sq.n * sq.d < 1e7) {
    let r = sq.n * sq.d, k = 1;
    for (let i = 2; i * i <= r; i++) while (r % (i * i) === 0) { r /= i * i; k *= i; }
    if (r > 1 && r <= 9999) {
      const g = gcdInt(k, sq.d);
      const n = k / g, d = sq.d / g;
      if (n <= 9999 && d <= 9999 && Math.abs(n * Math.sqrt(r) / d - a) <= 1e-10 * a) return {kind: 'surd', s, n, r, d};
    }
  }
  // π-Vielfaches
  const pi = ratApprox(a / Math.PI, 100, 1e-12);
  if (pi && pi.n > 0 && pi.n <= 999) return {kind: 'pi', s, n: pi.n, d: pi.d};
  return sumForm(v);
}
const gcdInt = (a: number, b: number): number => b ? gcdInt(b, a % b) : a;

/** Quadratfreie Zahlen 2…99 (mögliche Radikanden). */
const SQUAREFREE = Array.from({length: 98}, (_, i) => i + 2).filter(n => {
  for (let k = 2; k * k <= n; k++) if (n % (k * k) === 0) return false;
  return true;
});
const sumCache = new Map<number, Exact | null>();

/**
 * Sucht v = (a + b√r)/d bzw. v = (b₁√r₁ + b₂√r₂)/d mit kleinen ganzen Zahlen (kleinster Nenner zuerst).
 * Die Toleranz ist so eng gewählt, dass zufällige Treffer praktisch ausgeschlossen sind.
 */
function sumForm(v: number): Exact | null {
  if (sumCache.has(v)) return sumCache.get(v)!;
  const result = findSum(v);
  if (sumCache.size > 200) sumCache.clear();
  sumCache.set(v, result);
  return result;
}
function findSum(v: number): Exact | null {
  const close = (x: number, y: number) => Math.abs(x - y) <= 1e-11 * Math.max(1, Math.abs(y));
  const norm = (a: number, terms: {b: number; r: number}[], d: number): Exact => {
    const g = [a, d, ...terms.map(t => t.b)].reduce((x, y) => gcdInt(Math.abs(x), Math.abs(y)));
    return {kind: 'sum', a: a / g, d: d / g, terms: terms.map(t => ({b: t.b / g, r: t.r}))};
  };
  // Rationalteil + ein Wurzelterm: v·d = a + b√r
  for (let d = 1; d <= 60; d++) {
    const vd = v * d;
    for (const r of SQUAREFREE) {
      const sr = Math.sqrt(r);
      for (let b = -60; b <= 60; b++) {
        if (b === 0) continue;
        const a = Math.round(vd - b * sr);
        if (a !== 0 && Math.abs(a) <= 9999 && close(a + b * sr, vd)) return norm(a, [{b, r}], d);
      }
    }
  }
  // Zwei Wurzelterme: v·d = b₁√r₁ + b₂√r₂ (z. B. sin 75° = (√6+√2)/4)
  const radicands = SQUAREFREE.filter(r => r <= 50);
  for (let d = 1; d <= 24; d++) {
    const vd = v * d;
    for (let i = 0; i < radicands.length; i++) {
      const s1 = Math.sqrt(radicands[i]);
      for (let j = i + 1; j < radicands.length; j++) {
        const s2 = Math.sqrt(radicands[j]);
        for (let b1 = -24; b1 <= 24; b1++) {
          if (b1 === 0) continue;
          const b2 = Math.round((vd - b1 * s1) / s2);
          if (b2 !== 0 && Math.abs(b2) <= 99 && close(b1 * s1 + b2 * s2, vd)) return norm(0, [{b: b1, r: radicands[i]}, {b: b2, r: radicands[j]}], d);
        }
      }
    }
  }
  return null;
}

/**
 * Periodische Dezimaldarstellung von n/d (n, d > 0): ganzzahliger Teil, Vorperiode, Periode.
 * null, wenn mehr als `maxDigits` Nachkommastellen nötig wären.
 */
export function recurring(n: number, d: number, maxDigits = 10): {int: number; pre: string; rep: string} | null {
  const int = Math.floor(n / d);
  let r = n % d, digits = '';
  const seen = new Map<number, number>();
  while (r !== 0 && !seen.has(r)) {
    if (digits.length >= maxDigits) return null;
    seen.set(r, digits.length);
    r *= 10; digits += Math.floor(r / d); r %= d;
  }
  if (r === 0) return {int, pre: digits, rep: ''};
  const k = seen.get(r)!;
  return {int, pre: digits.slice(0, k), rep: digits.slice(k)};
}

export function fractionText(v: number, mixed: boolean): string | null {
  const f = asFraction(v);
  if (!f) return null;
  const sign = f.s < 0 ? '-' : '';
  if (mixed && f.n > f.d) return `${sign}${Math.floor(f.n / f.d)}⌟${f.n % f.d}⌟${f.d}`;
  return `${sign}${f.n}⌟${f.d}`;
}

export function factorize(v: number): string {
  if (!Number.isInteger(v) || v < 2 || v > 9999999999) throw Error('Math ERROR');
  const parts: string[] = [];
  let n = v;
  for (let p = 2; p * p <= n; p++) {
    let k = 0; while (n % p === 0) { n /= p; k++; }
    if (k) parts.push(k > 1 ? `${p}^${k}` : `${p}`);
  }
  if (n > 1) parts.push(`${n}`);
  return parts.join('×');
}

export function toDMS(v: number): string {
  const sign = v < 0 ? '-' : '';
  let a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = ((a - d) * 60 - m) * 60;
  s = Math.round(s * 100) / 100;
  if (s >= 60) { s -= 60; m++; }
  if (m >= 60) { m -= 60; d++; }
  return `${sign}${d}°${m}°${String(s).replace('.', ',')}°`;
}

export function toBase(v: number, base: Base): string {
  const n = Math.trunc(v);
  if (base === 10) return String(n);
  const u = n < 0 ? (n >>> 0) : n;
  if (u > 0xffffffff) throw Error('Math ERROR');
  return u.toString(base).toUpperCase();
}

/** Technische Notation mit vorgegebenem Exponenten. */
export function engParts(v: number, exp: number): {mant: string; exp: number} {
  const m = v / 10 ** exp;
  return {mant: String(Number(m.toPrecision(10))).replace('.', ','), exp};
}
export const engStart = (v: number) => v === 0 ? 0 : Math.floor(Math.log10(Math.abs(v)) / 3) * 3;

export const CONSTANTS: [string, string, number][] = [
  ['c', 'Lichtgeschw.', 299792458], ['h', 'Planck', 6.62607015e-34], ['k', 'Boltzmann', 1.380649e-23],
  ['Nᴀ', 'Avogadro', 6.02214076e23], ['G', 'Gravitation', 6.6743e-11], ['g', 'Fallbeschl.', 9.80665],
  ['e', 'Elementarladung', 1.602176634e-19], ['mₑ', 'Elektronenmasse', 9.1093837015e-31], ['R', 'Gaskonstante', 8.314462618],
];
export const CONVERSIONS: [string, (x: number) => number][] = [
  ['cm▸in', x => x / 2.54], ['in▸cm', x => x * 2.54], ['km▸mile', x => x / 1.609344], ['mile▸km', x => x * 1.609344],
  ['kg▸lb', x => x / 0.45359237], ['lb▸kg', x => x * 0.45359237], ['°C▸°F', x => x * 9 / 5 + 32], ['°F▸°C', x => (x - 32) * 5 / 9],
  ['km/h▸m/s', x => x / 3.6],
];

CONSTANTS.forEach(([sym, , v], i) => { TOKENS['K' + i] = fn(sym, `(${v})`); });
CONVERSIONS.forEach(([name], i) => { TOKENS['conv' + i] = fn(name, '#'); });
