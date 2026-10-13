import type {ReactNode} from 'react';
import {isClose, isOpen, isSep, tokenDisplay, type Exact} from './engine';

/** Bruch mit Zähler über Nenner. */
export const Fr = ({num, den}: {num: ReactNode; den: ReactNode}) =>
  <span className="nf"><span className="nf-n">{num}</span><span className="nf-d">{den}</span></span>;

/** Wurzelzeichen, das sich der Höhe des Radikanden anpasst, mit Überstrich. */
export const Root = ({children, index}: {children: ReactNode; index?: ReactNode}) =>
  <span className="nr">
    {index !== undefined && <span className="nr-i">{index}</span>}
    <svg className="nr-s" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0.5 12.5 3 11 6 19 9.6 0.8" fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="miter"/>
    </svg>
    <span className="nr-r">{children}</span>
  </span>;

const Cursor = ({ovr}: {ovr?: boolean}) => <span className={ovr ? 'cursor ovr' : 'cursor'}/>;

/**
 * Stellt eine Tokenfolge in Lehrbuchform dar (Brüche gestapelt, Wurzeln mit Überstrich,
 * Exponenten hochgestellt) oder mit `linear` einzeilig wie im SETUP „Linear“.
 * `cursor` < 0 blendet den Cursor aus.
 */
export function Formula({tokens, cursor, ovr, linear}: {tokens: string[]; cursor: number; ovr?: boolean; linear?: boolean}) {
  let i = 0, key = 0;
  const cur = () => <Cursor key={`c${key++}`} ovr={ovr}/>;

  function seq(): ReactNode[] {
    const out: ReactNode[] = [];
    while (i < tokens.length && !isSep(tokens[i]) && !isClose(tokens[i])) {
      if (i === cursor) out.push(cur());
      const t = tokens[i];
      if (isOpen(t)) out.push(group(t));
      else { out.push(<span key={`t${key++}`} className={t === 'frac' ? 'lf' : undefined}>{tokenDisplay(t)}</span>); i++; }
    }
    if (i === cursor) out.push(cur());
    return out;
  }
  /** Ein Eingabefeld der Vorlage; leer erscheint ein Platzhalterkästchen. */
  function slot(): ReactNode {
    const start = i, nodes = seq();
    if (linear) return nodes;
    return i === start ? <>{nodes}<span className="ph"/></> : nodes;  // leeres Feld: Kästchen (ggf. mit Cursor)
  }
  /** Trenner bzw. Schluss-Token überspringen (fehlt er, wird nichts verbraucht). */
  const skip = () => { if (i < tokens.length && (isSep(tokens[i]) || isClose(tokens[i]))) i++; };

  function group(t: string): ReactNode {
    const k = key++;
    i++;
    if (linear) return <span key={k}>{linearGroup(t)}</span>;
    switch (t) {
      case 'F(': { const n = slot(); skip(); const d = slot(); skip(); return <Fr key={k} num={n} den={d}/>; }
      case 'M(': { const w = slot(); skip(); const n = slot(); skip(); const d = slot(); skip(); return <span key={k} className="nm">{w}<Fr num={n} den={d}/></span>; }
      case 'R(': { const r = slot(); skip(); return <Root key={k}>{r}</Root>; }
      case 'R3(': { const r = slot(); skip(); return <Root key={k} index="3">{r}</Root>; }
      case 'N(': { const n = slot(); skip(); const r = slot(); skip(); return <Root key={k} index={n}>{r}</Root>; }
      case 'P(': { const e = slot(); skip(); return <sup key={k} className="np">{e}</sup>; }
      case 'L(': { const a = slot(); skip(); const b = slot(); skip(); return <span key={k}>log<sub className="nl">{a}</sub>({b})</span>; }
      case 'A(': { const a = slot(); skip(); return <span key={k} className="na">{a}</span>; }
    }
    return null;
  }

  /** Einzeilige Schreibweise wie im Linear-Modus des Geräts. */
  function linearGroup(t: string): ReactNode {
    // x², x³, x⁻¹ bleiben hochgestellt, sofern der Cursor nicht im Exponenten steht
    const short: Record<string, string> = {'2': '²', '3': '³', 'neg1': '⁻¹'};
    if (t === 'P(' && (cursor < i || cursor > i + 2)) {
      const body = tokens[i] === 'neg' ? 'neg' + tokens[i + 1] : tokens[i];
      const len = tokens[i] === 'neg' ? 2 : 1;
      if (short[body] && tokens[i + len] === 'P)') { i += len + 1; return short[body]; }
    }
    switch (t) {
      case 'F(': { const n = slot(); skip(); const d = slot(); skip(); return <>{n}⌟{d}</>; }
      case 'M(': { const w = slot(); skip(); const n = slot(); skip(); const d = slot(); skip(); return <>{w}⌟{n}⌟{d}</>; }
      case 'R(': { const r = slot(); skip(); return <>√({r})</>; }
      case 'R3(': { const r = slot(); skip(); return <>³√({r})</>; }
      case 'N(': { const n = slot(); skip(); const r = slot(); skip(); return <>{n}ˣ√({r})</>; }
      case 'P(': { const e = slot(); skip(); return <>^({e})</>; }
      case 'L(': { const a = slot(); skip(); const b = slot(); skip(); return <>log({a};{b})</>; }
      case 'A(': { const a = slot(); skip(); return <>Abs({a})</>; }
    }
    return null;
  }

  const out = seq();
  // Verwaiste Trenner/Schluss-Tokens (sollte nicht vorkommen) überspringen und weiter darstellen
  while (i < tokens.length) { i++; out.push(...seq()); }
  return <>{out}</>;
}

/** Periodische Dezimalzahl mit Überstrich über der Periode, z. B. 0,1‾6‾. */
export const Recurring = ({sign, int, pre, rep}: {sign: boolean; int: number; pre: string; rep: string}) =>
  <>{sign && '−'}{int}{(pre || rep) && ','}{pre}{rep && <span className="ovl">{rep}</span>}</>;

/** Exaktes Ergebnis in Lehrbuchform. */
export function ExactView({e, mixed}: {e: Exact; mixed: boolean}) {
  const sign = e.s < 0 ? '−' : '';
  if (e.kind === 'frac') {
    if (mixed && e.n > e.d) return <>{sign}{Math.floor(e.n / e.d)}<Fr num={e.n % e.d} den={e.d}/></>;
    return <>{sign}<Fr num={e.n} den={e.d}/></>;
  }
  const num = e.kind === 'surd'
    ? <>{e.n > 1 && e.n}<Root>{e.r}</Root></>
    : <>{e.n > 1 && e.n}π</>;
  return <>{sign}{e.d === 1 ? num : <Fr num={num} den={e.d}/>}</>;
}
