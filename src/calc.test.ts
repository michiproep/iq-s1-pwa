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
  it('SETUP Rad', () => expect(run('shift mode k4').angle).toBe('RAD'));
  it('SETUP Fix 2', () => expect(run('shift mode k6 k2').fmt).toEqual({mode: 'FIX', digits: 2}));
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

describe('Lehrbuch-Eingabe (Vorlagen)', () => {
  it('Zahl vor ▭/▭ wird Zähler, Cursor im Nenner', () => {
    const s = run('k1 frac');
    expect(s.tokens).toEqual(['F(', '1', 'F|', 'F)']); expect(s.cursor).toBe(3);
  });
  it('1/3 + 1/6 = 1/2', () => expect(value(run('k1 frac k3 right add k1 frac k6 eq'))).toBeCloseTo(0.5));
  it('Bruch mit ◀▶ navigieren', () => {
    const s = run('frac k3 right k4 eq');
    expect(value(s)).toBe(0.75);
  });
  it('Wurzel ohne schließende Klammer', () => expect(value(run('sqrt k1 k6 eq'))).toBe(4));
  it('Wurzel im Bruch: 4√2/3', () => expect(value(run('k4 sqrt k2 right frac k3 eq'))).toBeCloseTo(4 * Math.SQRT2 / 3));
  it('Potenz-Vorlage', () => expect(value(run('k2 pow k1 k0 right add k1 eq'))).toBe(1025));
  it('x² als Exponent', () => expect(run('k3 sq').tokens).toEqual(['3', 'P(', '2', 'P)']));
  it('n-te Wurzel', () => expect(value(run('shift pow k3 right k2 k7 eq'))).toBeCloseTo(3));
  it('log_a(b)', () => expect(value(run('logab k2 right k8 eq'))).toBeCloseTo(3));
  it('Betrag', () => expect(value(run('abs neg k5 eq'))).toBe(5));
  it('gemischter Bruch', () => expect(value(run('shift frac k2 right k1 right k2 eq'))).toBe(2.5));
  it('10^x und e^x', () => { expect(value(run('shift log k3 eq'))).toBeCloseTo(1000); expect(value(run('shift ln k0 eq'))).toBe(1); });
  it('DEL löst Vorlage auf, Inhalt bleibt', () => {
    const s = run('k1 frac k2 left del');
    expect(s.tokens).toEqual(['1', '2']);
  });
  it('Ergebnis als Zähler', () => expect(run('k5 eq frac').tokens).toEqual(['F(', 'Ans', 'F|', 'F)']));
  it('x² nach Ergebnis mit Ans', () => expect(value(run('k3 eq sq eq'))).toBe(9));
});

describe('▲▼ im Bruch', () => {
  it('▼ vom Zähler in den Nenner', () => {
    const s = run('frac k3 down k4');
    expect(s.tokens).toEqual(['F(', '3', 'F|', '4', 'F)']); expect(value(run('eq', s))).toBe(0.75);
  });
  it('▲ vom Nenner zurück in den Zähler', () => expect(run('k1 frac k4 up k2').tokens).toEqual(['F(', '1', '2', 'F|', '4', 'F)']));
  it('▼ im Nenner bleibt stehen (kein REPLAY)', () => {
    const s = run('k9 eq ac k1 frac k4 down');
    expect(s.shown).toBe(false); expect(s.tokens).toEqual(['F(', '1', 'F|', '4', 'F)']);
  });
  it('verschachtelt: innerster Bruch zuerst', () => {
    // Zähler enthält 1/2, Cursor im inneren Zähler → ▼ in inneren Nenner
    const s = run('frac frac k1 down k2 down');
    expect(s.tokens).toEqual(['F(', 'F(', '1', 'F|', '2', 'F)', 'F|', 'F)']);
    expect(s.cursor).toBe(7);  // innerer Nenner → beim zweiten ▼ in den äußeren Nenner
  });
  it('gemischter Bruch', () => expect(value(run('shift frac k2 right k1 down k4 eq'))).toBe(2.25));
  it('außerhalb von Brüchen weiter REPLAY', () => expect(run('k5 eq ac up').tokens).toEqual(['5']));
});

describe('SETUP wie am Gerät', () => {
  it('Seite 1: 8 Einträge, Seite 2 per ▼', () => {
    const s = run('shift mode');
    expect(s.menu?.items.slice(0, 8).map(i => i.label)).toEqual(['Mth2D', 'Linear', 'Deg', 'Rad', 'Gra', 'Fix', 'Sci', 'Norm']);
    const p2 = run('down', s);
    expect(p2.menu?.top).toBe(8);
    expect(p2.menu?.items.slice(8).map(i => i.label)).toEqual(['ab/c', 'd/c', 'STAT', 'PerD', 'AbAut', '◀KNTR▶']);
  });
  it('Seite 2: Nummerierung beginnt bei 1 (1 = ab/c)', () => expect(run('shift mode down k1').mixedOut).toBe(true));
  it('▲ zurück auf Seite 1', () => expect(run('shift mode down up k4').angle).toBe('RAD'));
  it('Linear und zurück', () => {
    expect(run('shift mode k2').math2d).toBe(false); expect(run('shift mode k2 shift mode k1').math2d).toBe(true);
  });
  it('Linear: S⇔D wechselt Dezimal → Bruch', () => {
    const s = run('shift mode k2 k1 div k3 eq');
    expect(s.view).toBe('auto'); expect(run('sd', s).view).toBe('frac');
  });
  it('PerD: S⇔D zeigt periodische Dezimalzahl', () => {
    const s = run('shift mode down k4 k1 k1 div k3 eq');
    expect(s.perD).toBe(true); expect(run('sd', s).view).toBe('per'); expect(run('sd sd', s).view).toBe('auto');
  });
  it('STAT Häufigkeit: Wert;Anzahl mit M+', () => {
    const s = run('shift mode down k3 k1 mode k2 k5 shift rpar k3 mplus k2 mplus');
    expect(s.freq).toBe(true); expect(s.stats).toEqual([5, 5, 5, 2]);
  });
  it('AbAut 60 Minuten', () => expect(run('shift mode down k5 k2').autoOff).toBe(60));
  it('Kontrast mit ◀▶, = beendet', () => {
    const s = run('shift mode down k6 right right left');
    expect(s.contrast).toBe(6); expect(s.menu?.contrast).toBe(true); expect(run('eq', s).menu).toBeNull();
  });
  it('CLR Setup setzt neue Einstellungen zurück', () => {
    const s = run('shift mode k2 shift mode down k4 k1 shift k9 k1 eq');
    expect(s.math2d).toBe(true); expect(s.perD).toBe(false);
  });
});

describe('Linear-Eingabe', () => {
  it('⌟ ist Rechenzeichen: 1⌟3+√(2)', () => {
    const s = run('shift mode k2 k1 frac k3 add sqrt k2 rpar eq');
    expect(s.tokens).toEqual(['1', 'frac', '3', '+', '√(', '2', ')']); expect(s.result?.value).toBeCloseTo(1 / 3 + Math.SQRT2);
  });
  it('x² linear', () => expect(run('shift mode k2 k3 sq').tokens).toEqual(['3', '²']));
});
