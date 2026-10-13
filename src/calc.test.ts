import {describe, expect, it} from 'vitest';
import {initialState, press, tableRows, type State} from './calc';

const run = (keys: string, s: State = initialState()) => keys.split(' ').filter(Boolean).reduce(press, s);
const value = (s: State) => s.result?.value;

describe('Tastenfolgen', () => {
  it('1 + 2 × 3 =', () => expect(value(run('k1 add k2 mul k3 eq'))).toBe(7));
  it('Ergebnis + Operator setzt Ans fort', () => {
    const s = run('k5 eq add k2 eq');
    expect(s.tokens).toEqual(['Ans', '+', '2']); expect(value(s)).toBe(7);
  });
  it('Neue Ziffer nach Ergebnis startet neu', () => expect(run('k5 eq k3').tokens).toEqual(['3']));
  it('SHIFT sin = arcsin', () => expect(value(run('shift sin k0 comma k5 rpar eq'))).toBeCloseTo(30));
  it('hyp sin', () => expect(run('hyp sin').tokens).toEqual(['sinh(']));
  it('ALPHA-Variablen über STO', () => {
    const s = run('k7 shift rcl neg ac alpha neg mul k2 eq');
    expect(s.vars.A).toBe(7); expect(value(s)).toBe(14);
  });
  it('RCL', () => expect(value(run('k9 shift rcl rpar ac rcl rpar'))).toBe(9));
  it('M+ und M−', () => {
    const s = run('k5 mplus k2 shift mplus');
    expect(s.vars.M).toBe(3);
  });
  it('DEL und Cursor', () => {
    const s = run('k1 k2 k3 left del k9');
    expect(s.tokens).toEqual(['1', '9', '3']);
  });
  it('INS-Überschreibmodus', () => expect(run('k1 k2 k3 left left shift del k9').tokens).toEqual(['1', '9', '3']));
  it('S⇔D wechselt Bruch/Dezimal', () => {
    const s = run('k1 div k3 eq');
    expect(s.view).toBe('auto'); expect(run('sd', s).view).toBe('dec');
  });
  it('SHIFT = liefert Dezimalwert', () => expect(run('k1 div k4 shift eq').view).toBe('dec'));
  it('ENG', () => {
    const s = run('k1 k2 k3 k4 eq eng');
    expect(s.view).toBe('eng'); expect(s.engExp).toBe(3);
    expect(run('eng', s).engExp).toBe(0); expect(run('shift eng', s).engExp).toBe(6);
  });
  it('Syntax ERROR und AC', () => {
    const s = run('k1 add eq');
    expect(s.error).toBe('Syntax ERROR');
    expect(run('ac', s).error).toBeNull();
  });
  it('REPLAY holt Verlauf', () => {
    const s = run('k1 add k1 eq k2 add k2 eq up');
    expect(s.tokens).toEqual(['1', '+', '1']);
  });
  it('SETUP Rad', () => expect(run('shift mode k2').angle).toBe('RAD'));
  it('SETUP Fix 2', () => expect(run('shift mode k4 k2').fmt).toEqual({mode: 'FIX', digits: 2}));
  it('CLR Alle mit Bestätigung', () => {
    const s = run('k5 shift rcl neg shift k9 k3 eq');
    expect(s.vars.A).toBe(0);
  });
  it('OFF / ON', () => {
    const s = run('shift ac');
    expect(s.on).toBe(false); expect(run('k1', s).tokens).toEqual([]); expect(run('on', s).on).toBe(true);
  });
  it('Konstante einfügen', () => expect(run('shift k7 k1').tokens).toEqual(['K0']));
  it('Umrechnung cm▸in', () => expect(value(run('k2 comma k5 k4 shift k8 k1'))).toBeCloseTo(1));
  it('nCr / ggT', () => {
    expect(value(run('k5 shift div k2 eq'))).toBe(10); expect(value(run('alpha mul k1 k2 shift rpar k8 rpar eq'))).toBe(4);
  });
  it('Pol', () => expect(run('shift add k1 shift rpar k1 rpar eq').result?.kind).toBe('pair'));
});

describe('Modi', () => {
  it('STAT: Daten mit M+ und Mittelwert', () => {
    let s = run('mode k2 k2 mplus k4 mplus k6 mplus');
    expect(s.stats).toEqual([2, 4, 6]);
    s = run('shift k1 k2 eq', s);
    expect(value(s)).toBe(4);
  });
  it('TABLE', () => {
    const s = run('mode k3 alpha rpar sq eq k1 eq k3 eq k1 eq');
    expect(s.table.phase).toBe('list');
    expect(tableRows(s)).toEqual([[1, 1], [2, 4], [3, 9]]);
  });
  it('BASE-N HEX', () => {
    const s = run('shift k3 pow tan tan add k1 eq');
    expect(s.base).toBe(16); expect(value(s)).toBe(256);
  });
});
