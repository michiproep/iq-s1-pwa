import {describe, expect, it} from 'vitest';
import {evaluateTokens, exactForm, factorize, recurring, formatParts, fractionText, toBase, toDMS, type Ctx} from './engine';

const ctx = (o: Partial<Ctx> = {}): Ctx => ({angle: 'DEG', ans: 0, vars: {}, ...o});
/** Kurzschreibweise: ein Zeichen = ein Token, Mehrzeichen-Tokens in {} */
const tk = (s: string) => s.match(/\{[^}]+\}|./gu)!.map(t => t.startsWith('{') ? t.slice(1, -1) : t);
const ev = (s: string, o?: Partial<Ctx>) => evaluateTokens(tk(s), ctx(o)).value;

describe('Grundrechenarten', () => {
  it('Punkt vor Strich', () => expect(ev('2+3×4')).toBe(14));
  it('Dezimalkomma', () => expect(ev('1,5×2')).toBe(3));
  it('Division und Subtraktion', () => expect(ev('10÷4−1')).toBe(1.5));
  it('Vorzeichen', () => expect(ev('{neg}3×{neg}2')).toBe(6));
  it('Klammern & implizite Multiplikation', () => expect(ev('2(3+4)')).toBe(14));
  it('Prozent', () => expect(ev('200×15%')).toBe(30));
  it('Potenzen', () => {
    expect(ev('3{²}')).toBe(9); expect(ev('2{³}')).toBe(8); expect(ev('4{⁻¹}')).toBe(0.25); expect(ev('2{^(}10)')).toBe(1024);
  });
  it('Fakultät', () => expect(ev('5!')).toBe(120));
  it('Exponentialschreibweise', () => {
    expect(ev('1{E}3')).toBe(1000); expect(ev('1÷2{E}3')).toBe(0.0005); expect(ev('5{E}{neg}2')).toBeCloseTo(0.05);
  });
  it('Syntaxfehler', () => expect(() => ev('2×')).toThrow('Syntax ERROR'));
  it('Division durch 0', () => expect(() => ev('1÷0')).toThrow('Math ERROR'));
});

describe('Funktionen', () => {
  it('Wurzeln', () => {
    expect(ev('{√(}16)')).toBe(4); expect(ev('{³√(}27)')).toBeCloseTo(3); expect(ev('{ˣ√(}3;{neg}8)')).toBeCloseTo(-2);
  });
  it('Logarithmen', () => {
    expect(ev('{log(}1000)')).toBeCloseTo(3); expect(ev('{ln(}{ℯ})')).toBeCloseTo(1);
    expect(ev('{logab(}2;8)')).toBeCloseTo(3); expect(ev('{10^(}2)')).toBeCloseTo(100); expect(ev('{e^(}0)')).toBe(1);
  });
  it('Trigonometrie DEG', () => {
    expect(ev('{sin(}30)')).toBeCloseTo(0.5); expect(ev('{cos(}60)')).toBeCloseTo(0.5); expect(ev('{tan(}45)')).toBeCloseTo(1);
    expect(ev('{sin(}180)')).toBe(0); expect(ev('{asin(}0,5)')).toBeCloseTo(30);
  });
  it('tan(90) ist Math ERROR', () => expect(() => ev('{tan(}90)')).toThrow('Math ERROR'));
  it('Trigonometrie RAD/GRA', () => {
    expect(ev('{sin(}{π}÷2)', {angle: 'RAD'})).toBeCloseTo(1); expect(ev('{sin(}100)', {angle: 'GRA'})).toBeCloseTo(1);
  });
  it('Winkeleinheiten ° ʳ ᵍ', () => {
    expect(ev('{sin(}90°)', {angle: 'RAD'})).toBeCloseTo(1);
    expect(ev('{π}{ʳ}', {angle: 'DEG'})).toBeCloseTo(180);
  });
  it('Hyperbolisch', () => { expect(ev('{sinh(}0)')).toBe(0); expect(ev('{cosh(}0)')).toBe(1); });
  it('Abs, Int, Intg', () => {
    expect(ev('{Abs(}{neg}7)')).toBe(7); expect(ev('{Int(}{neg}2,5)')).toBe(-2); expect(ev('{Intg(}{neg}2,5)')).toBe(-3);
  });
  it('nPr, nCr', () => { expect(ev('5{P}2')).toBe(20); expect(ev('5{C}2')).toBe(10); });
  it('ggT, kgV', () => { expect(ev('{ggT(}12;18)')).toBe(6); expect(ev('{kgV(}4;6)')).toBe(12); });
  it('Brüche', () => { expect(ev('1{frac}3+1{frac}6')).toBeCloseTo(0.5); expect(ev('2{frac}1{frac}2')).toBe(2.5); });
  it('Grad-Minuten-Sekunden', () => expect(ev('30°30°0°')).toBeCloseTo(30.5));
  it('Ans und Variablen', () => {
    expect(ev('{Ans}×2', {ans: 21})).toBe(42); expect(ev('{varA}+{varX}', {vars: {A: 2, X: 3}})).toBe(5); expect(ev('2{varA}', {vars: {A: 4}})).toBe(8);
  });
  it('Mehrfachanweisung', () => expect(ev('2+3:{Ans}×2')).toBe(10));
  it('Ran# und RanInt', () => {
    expect(ev('{Ran#}', {rand: () => 0.12345})).toBe(0.123); expect(ev('{RanInt(}1;6)', {rand: () => 0.999})).toBe(6);
  });
  it('Statistik-Werte', () => {
    const stats = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(ev('{x̄}', {stats})).toBe(5); expect(ev('{σx}', {stats})).toBe(2); expect(ev('{n}', {stats})).toBe(8);
    expect(() => ev('{x̄}')).toThrow('Math ERROR');
  });
});

describe('Paare', () => {
  it('÷R', () => expect(evaluateTokens(tk('17{÷R}5'), ctx())).toMatchObject({kind: 'pair', values: [3, 2]}));
  it('Pol', () => {
    const r = evaluateTokens(tk('{Pol(}1;1)'), ctx());
    expect(r.kind).toBe('pair'); if (r.kind === 'pair') { expect(r.values[0]).toBeCloseTo(Math.SQRT2); expect(r.values[1]).toBeCloseTo(45); }
  });
  it('Rec', () => {
    const r = evaluateTokens(tk('{Rec(}2;90)'), ctx());
    if (r.kind === 'pair') { expect(r.values[0]).toBe(0); expect(r.values[1]).toBeCloseTo(2); } else throw Error();
  });
});

describe('BASE-N', () => {
  it('Hex-Eingabe', () => expect(ev('{hexF}{hexF}+1', {base: 16})).toBe(256));
  it('Binär', () => expect(ev('101+1', {base: 2})).toBe(6));
  it('Ungültige Ziffer', () => expect(() => ev('2', {base: 2})).toThrow('Syntax ERROR'));
  it('Ausgabe', () => { expect(toBase(255, 16)).toBe('FF'); expect(toBase(5, 2)).toBe('101'); expect(toBase(-1, 16)).toBe('FFFFFFFF'); });
});

describe('Anzeige', () => {
  const N = {mode: 'NORM', digits: 2} as const;
  it('Normal', () => {
    expect(formatParts(0.1 + 0.2, N)).toEqual({mant: '0,3', exp: null});
    expect(formatParts(1 / 3, N)).toEqual({mant: '0,3333333333', exp: null});
    expect(formatParts(1e12, N)).toEqual({mant: '1', exp: 12});
    expect(formatParts(-123456.789, N)).toEqual({mant: '-123456,789', exp: null});
  });
  it('FIX / SCI', () => {
    expect(formatParts(2 / 3, {mode: 'FIX', digits: 3}).mant).toBe('0,667');
    expect(formatParts(12345, {mode: 'SCI', digits: 3})).toEqual({mant: '1,23', exp: 4});
  });
  it('Brüche', () => {
    expect(fractionText(0.5, false)).toBe('1⌟2'); expect(fractionText(7 / 3, true)).toBe('2⌟1⌟3'); expect(fractionText(Math.PI, false)).toBeNull();
  });
  it('Primfaktoren', () => expect(factorize(360)).toBe('2^3×3^2×5'));
  it('DMS', () => expect(toDMS(30.5)).toBe('30°30°0°'));
});

describe('Exakte Formen', () => {
  it('Bruch', () => expect(exactForm(1 / 3)).toEqual({kind: 'frac', s: 1, n: 1, d: 3}));
  it('Wurzelterm 17√2/12', () => expect(exactForm(17 * Math.SQRT2 / 12)).toEqual({kind: 'surd', s: 1, n: 17, r: 2, d: 12}));
  it('√2/2 aus sin 45°', () => expect(exactForm(Math.sin(Math.PI / 4))).toEqual({kind: 'surd', s: 1, n: 1, r: 2, d: 2}));
  it('negativer Wurzelterm', () => expect(exactForm(-2 * Math.sqrt(3))).toEqual({kind: 'surd', s: -1, n: 2, r: 3, d: 1}));
  it('π-Vielfaches', () => expect(exactForm(3 * Math.PI / 4)).toEqual({kind: 'pi', s: 1, n: 3, d: 4}));
  it('keine Form für ln 2', () => expect(exactForm(Math.LN2)).toBeNull());
  it('keine Form für Ganzzahl', () => expect(exactForm(5)).toBeNull());
  it('Strukturtoken werden übersetzt', () => {
    expect(evaluateTokens(['F(', '1', 'F|', 'R(', '4', 'R)', 'F)'], {angle: 'DEG', ans: 0, vars: {}}).value).toBe(0.5);
  });
});

describe('Periodische Dezimalzahlen', () => {
  it('1/3 = 0,(3)', () => expect(recurring(1, 3)).toEqual({int: 0, pre: '', rep: '3'}));
  it('1/6 = 0,1(6)', () => expect(recurring(1, 6)).toEqual({int: 0, pre: '1', rep: '6'}));
  it('22/7 = 3,(142857)', () => expect(recurring(22, 7)).toEqual({int: 3, pre: '', rep: '142857'}));
  it('3/4 endlich', () => expect(recurring(3, 4)).toEqual({int: 0, pre: '75', rep: ''}));
  it('zu lange Periode', () => expect(recurring(1, 97)).toBeNull());
});
