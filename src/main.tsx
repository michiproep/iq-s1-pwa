import React, {useEffect, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {createRoot} from 'react-dom/client';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto-condensed/700.css';
import './style.css';
import {initialState, MENU_PAGE, press, tableRows, type State} from './calc';
import {asFraction, engParts, exactForm, factorize, formatParts, fractionText, recurring, toBase, toDMS} from './engine';
import {ExactView, Formula, Recurring} from './natural';
import {KEYS, type KeySpec, type Label} from './keys';
import {keyClick, pressHandlers} from './feedback';

const REF_W = 478, REF_H = 929;

function Num({v, s}: {v: number; s: State}) {
  const {mant, exp} = formatParts(v, s.fmt);
  return <>{mant}{exp !== null && <span className="e10">×10<sup>{exp}</sup></span>}</>;
}

function ResultView({s}: {s: State}): ReactNode {
  const r = s.result!;
  if (s.mode === 'BASE') return toBase(r.value, s.base);
  if (r.kind === 'pair') return <span className="pair">{r.labels.map((l, i) => <span key={l}>{l}=<Num v={r.values[i]} s={s}/></span>)}</span>;
  const v = r.value;
  switch (s.view) {
    case 'fact': return factorize(v).split('×').map((p, i) => {
      const [b, e] = p.split('^');
      return <React.Fragment key={i}>{i > 0 && '×'}{b}{e && <sup>{e}</sup>}</React.Fragment>;
    });
    case 'dms': return toDMS(v);
    case 'eng': { const {mant, exp} = engParts(v, s.engExp); return <>{mant}<span className="e10">×10<sup>{exp}</sup></span></>; }
    case 'dec': return <Num v={v} s={s}/>;
    case 'per': {
      const f = asFraction(v), r = f && recurring(f.n, f.d);
      return r ? <Recurring sign={f.s < 0} {...r}/> : <Num v={v} s={s}/>;
    }
    default: {
      if (!s.math2d) {
        // Linear: Dezimalzahl; S⇔D zeigt den Bruch in linearer Schreibweise
        const lin = s.view === 'frac' || s.view === 'mixed' ? fractionText(v, s.view === 'mixed' || s.mixedOut) : null;
        return lin ? lin.replace('-', '−') : <Num v={v} s={s}/>;
      }
      const e = s.mode === 'COMP' || s.mode === 'STAT' ? exactForm(v) : null;
      return e ? <ExactView e={e} mixed={s.view === 'mixed' || (s.view === 'auto' && s.mixedOut)}/> : <Num v={v} s={s}/>;
    }
  }
}

function InputLine({s, prompt}: {s: State; prompt?: string}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const box = ref.current, cur = box?.querySelector('.cursor') as HTMLElement | null;
    if (!box) return;
    if (!cur) { box.scrollLeft = 0; box.scrollTop = 0; return; }
    const l = cur.offsetLeft, r = l + 12;
    if (l < box.scrollLeft) box.scrollLeft = Math.max(0, l - 30);
    else if (r > box.scrollLeft + box.clientWidth) box.scrollLeft = r - box.clientWidth + 2;
    // Senkrecht nur, wenn die Eingabe höher als das Display ist (mehrfach gestapelte Brüche); k = Skalierung der Bühne
    const br = box.getBoundingClientRect(), cr = cur.getBoundingClientRect(), k = br.height / box.offsetHeight || 1;
    const top = (cr.top - br.top) / k + box.scrollTop, bottom = top + cr.height / k;
    if (top < box.scrollTop) box.scrollTop = top;
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight;
  });
  const showCursor = !s.shown && !s.error;
  return <div className="input" ref={ref}>{prompt && <span className="prompt">{prompt}</span>}
    <Formula tokens={s.tokens} cursor={showCursor ? s.cursor : -1} ovr={!s.insert} linear={!s.math2d}/></div>;
}

const ANGLE = {DEG: 'D', RAD: 'R', GRA: 'G'} as const;
const BASE_NAME = {10: 'Dec', 16: 'Hex', 2: 'Bin', 8: 'Oct'} as const;
const PROMPT = {f: 'f(x)=', start: 'Start?', end: 'Ende?', step: 'Schritt?', list: ''} as const;

function Screen({s}: {s: State}) {
  if (!s.on) return <div className="lcd"/>;
  const ind = <div className="ind">
    <span className={s.shift ? '' : 'off'}>S</span><span className={s.alpha ? '' : 'off'}>A</span>
    <span className={s.vars.M !== 0 ? '' : 'off'}>M</span><span className={s.pending ? '' : 'off'}>{s.pending ?? 'STO'}</span>
    <span className={s.hyp ? '' : 'off'}>hyp</span>
    <span>{s.mode === 'COMP' ? '' : s.mode === 'BASE' ? BASE_NAME[s.base] : s.mode}</span>
    <span className="grow"/>
    <span>{s.fmt.mode === 'NORM' ? '' : s.fmt.mode}</span><span>{ANGLE[s.angle]}</span><span className={s.math2d ? '' : 'off'}>Math</span>
  </div>;
  let body: ReactNode;
  if (s.menu) {
    const m = s.menu;
    if (m.contrast) {
      body = <div className="menu contrast"><div className="title">{m.heading}</div>
        <div className="cbar"><span>HELL</span><span className="track"><i style={{width: `${s.contrast * 10}%`}}/></span><span>DUNKEL</span></div>
        <div className="hint">[◀] [▶] ändern · [=] fertig</div></div>;
    } else if (m.digitPrompt) {
      body = <div className="menu"><div className="title">{m.heading}</div></div>;
    } else if (m.title === 'Zurücksetzen?') {
      body = <div className="menu"><div className="title">{m.heading}</div><div>[=] : Ja</div><div>[AC] : Abbrechen</div></div>;
    } else {
      // Wie am Gerät: ohne Überschrift, 2 Spalten × 4 Zeilen, Nummerierung je Seite ab 1, Seitenpfeil oben rechts
      body = <div className="menu list">{m.heading && <div className="title">{m.heading}</div>}
        <div className="grid">{m.items.slice(m.top, m.top + MENU_PAGE).map((it, i) => <div key={i}>{i + 1}:{it.label}</div>)}</div>
        {m.top > 0 && <span className="more up">▲</span>}
        {m.items.length > m.top + MENU_PAGE && <span className="more">▼</span>}
      </div>;
    }
  } else if (s.info) {
    body = <div className="menu">{s.info.map((l, i) => <div key={i}>{l}</div>)}</div>;
  } else if (s.error) {
    body = <div className="menu err"><div className="title">{s.error}</div><div>[AC] :Abbrechen</div><div>[◀][▶]:Gehe zu</div></div>;
  } else if (s.mode === 'TABLE' && s.table.phase === 'list') {
    const rows = tableRows(s), top = Math.max(0, Math.min(s.table.pos - 1, rows.length - 3));
    body = <table className="tbl"><thead><tr><th/><th>x</th><th>f(x)</th></tr></thead><tbody>
      {rows.slice(top, top + 3).map(([x, y], i) => <tr key={i} className={top + i === s.table.pos ? 'sel' : ''}>
        <td>{top + i + 1}</td><td><Num v={x} s={s}/></td><td>{y === null ? 'ERROR' : <Num v={y} s={s}/>}</td></tr>)}
    </tbody></table>;
  } else {
    body = <><InputLine s={s} prompt={s.mode === 'TABLE' ? PROMPT[s.table.phase] : undefined}/>
      <div className="result">{s.shown && s.result && <ResultView s={s}/>}</div></>;
  }
  // Kontrast 0–10: unter 5 blasser, über 5 wird der LCD-Hintergrund dunkler (Stufe 5 = Standard)
  const lcdStyle = {opacity: Math.min(1, 0.4 + s.contrast * 0.12), background: s.contrast > 5 ? `rgba(0,0,0,${(s.contrast - 5) * 0.035})` : undefined};
  return <div className="lcd on" style={lcdStyle}>{s.menu && !s.menu.digitPrompt && !s.menu.heading ? null : ind}{body}</div>;
}

function LabelView({l}: {l: Label}) {
  const size = l.size ?? 16;
  const style: React.CSSProperties = {left: l.cx, top: l.top - size * 0.131 + (l.dy ?? 0), fontSize: size, transform: l.sx ? `translateX(-50%) scaleX(${l.sx})` : undefined};
  if (l.br) return <span className={`lbl br br-${l.br} c-${l.c}`} style={style}><span>{l.t}</span></span>;
  return <span className={`lbl c-${l.c}`} style={style}>{l.t}</span>;
}

/** Versteckter Schalter in jeder Taste: Tippen legt ihn um, das gibt am iPhone den Haptik-Tick (siehe feedback.ts). */
const Tick = () => <input type="checkbox" {...{switch: ''} /* fehlt in @types/react */} hidden tabIndex={-1} aria-hidden="true"/>;

function Key({k, vibrate, onPress}: {k: KeySpec; vibrate: boolean; onPress: (id: string) => void}) {
  return <>
    {k.labels?.map((l, i) => <LabelView key={i} l={l}/>)}
    <label role="button" aria-label={k.aria} className={`key ${k.kind} f-${k.font ?? 'sans'}`}
      style={{left: k.x, top: k.y, width: k.w, height: k.h, fontSize: k.fs}}
      {...pressHandlers} onMouseDown={e => e.preventDefault() /* keine Textauswahl per Maus */} onClick={e => keyClick(e, vibrate) && onPress(k.id)}>
      <Tick/><span className="face">{k.face}</span>
    </label>
  </>;
}

/** Steuerkreuz (REPLAY) aus vier Trapezen. Koordinaten relativ zu (182, 317). Das SVG zeichnet nur;
 *  bedient wird über zugeschnittene Labels darüber, damit auch hier der iPhone-Tick funktioniert. */
const DPAD_X = 182, DPAD_Y = 317;
const PADS: [string, string, string][] = [
  ['up', '14,1 103,1 85,33 32,33', 'Nach oben'], ['down', '32,100 85,100 103,132 14,132', 'Nach unten'],
  ['left', '1,17 32,50 32,82 1,115', 'Nach links'], ['right', '116,17 85,50 85,82 116,115', 'Nach rechts'],
];

function PadHit({id, pts, aria, vibrate, onPress}: {id: string; pts: string; aria: string; vibrate: boolean; onPress: (id: string) => void}) {
  const xy = pts.split(' ').map(p => p.split(',').map(Number));
  const x0 = Math.min(...xy.map(p => p[0])), y0 = Math.min(...xy.map(p => p[1]));
  const w = Math.max(...xy.map(p => p[0])) - x0, h = Math.max(...xy.map(p => p[1])) - y0;
  return <label role="button" aria-label={aria} className="padHit"
    style={{left: DPAD_X + x0, top: DPAD_Y + y0, width: w, height: h, clipPath: `polygon(${xy.map(([x, y]) => `${x - x0}px ${y - y0}px`).join(',')})`}}
    {...pressHandlers} onMouseDown={e => e.preventDefault()} onClick={e => keyClick(e, vibrate) && onPress(id)}>
    <Tick/>
  </label>;
}

function DPad({vibrate, onPress}: {vibrate: boolean; onPress: (id: string) => void}) {
  return <>
    <svg className="dpad" viewBox="0 0 117 133" width={117} height={133} style={{left: DPAD_X, top: DPAD_Y}} aria-hidden="true">
      <defs>
        <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a4645"/><stop offset=".25" stopColor="#433f3f"/><stop offset="1" stopColor="#423e3e"/></linearGradient>
        <linearGradient id="gL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#4a4645"/><stop offset=".25" stopColor="#45413f"/><stop offset="1" stopColor="#433f3e"/></linearGradient>
        <linearGradient id="gR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#4a4645"/><stop offset=".25" stopColor="#474342"/><stop offset="1" stopColor="#433f3e"/></linearGradient>
      </defs>
      {PADS.map(([id, pts]) => <polygon key={id} points={pts}
        fill={`url(#${id === 'left' ? 'gL' : id === 'right' ? 'gR' : 'gV'})`} stroke={id === 'left' ? '#46423f' : id === 'right' ? '#464241' : '#443f3f'}
        strokeWidth={5} strokeLinejoin="round"/>)}
      <g className="dpadText" pointerEvents="none">
        <polygon points="58.5,19 63.5,25 53.5,25" fill="#fff"/>
        <polygon points="53.5,109 63.5,109 58.5,115" fill="#fff"/>
        <polygon points="17,66 25,61.5 25,70.5" fill="#fff"/>
        <polygon points="101,66 93,61.5 93,70.5" fill="#fff"/>
        <text x="58.5" y="70.3" textAnchor="middle">REPLAY</text>
      </g>
    </svg>
    {PADS.map(([id, pts, aria]) => <PadHit key={id} id={id} pts={pts} aria={aria} vibrate={vibrate} onPress={onPress}/>)}
  </>;
}

const KEYBOARD: Record<string, string[]> = {
  '+': ['add'], '-': ['sub'], '*': ['mul'], '/': ['div'], ',': ['comma'], '.': ['comma'], '(': ['lpar'], ')': ['rpar'],
  '^': ['pow'], '!': ['shift', 'inv'], '%': ['shift', 'lpar'], ';': ['shift', 'rpar'], 'Enter': ['eq'], '=': ['eq'],
  'Backspace': ['del'], 'Escape': ['ac'], 'Delete': ['ac'], 'ArrowLeft': ['left'], 'ArrowRight': ['right'], 'ArrowUp': ['up'], 'ArrowDown': ['down'],
  's': ['sin'], 'c': ['cos'], 't': ['tan'], 'l': ['ln'], 'p': ['shift', 'exp'],
};

const REPO = 'https://github.com/michiproep/iq-s1-pwa';
const LINKS: [string, string][] = [['Anleitung', `${REPO}/blob/main/ANLEITUNG.md`], ['Fehler melden', `${REPO}/issues`], ['Info', `${REPO}#readme`]];

/** Menü oben links. Es hängt per Portal direkt in <body> und ist position: fixed, liegt also außerhalb von #root
 *  und des skalierten Rechners und kann dessen Layout nicht verschieben. Die Links zeigen auf GitHub, also außerhalb
 *  des PWA-Bereichs, und öffnen mit target="_blank": Als installierte PWA gehen sie im Browser auf. */
function AppMenu() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!(e.target as Element).closest?.('.appMenu')) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  return createPortal(<nav className="appMenu">
    <button type="button" aria-label="Menü" aria-expanded={open} aria-controls="appMenuList" onClick={() => setOpen(o => !o)}>
      <svg viewBox="0 0 18 14" width={18} height={14} aria-hidden="true"><path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth={2}/></svg>
    </button>
    {open && <ul id="appMenuList">{LINKS.map(([t, href]) =>
      <li key={t}><a href={href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>{t}</a></li>)}</ul>}
  </nav>, document.body);
}

function App() {
  const [s, setS] = useState<State>(initialState);
  const [scale, setScale] = useState(1);
  const onPress = (id: string) => setS(st => press(st, id));

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / REF_W, window.innerHeight / REF_H));
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  useEffect(() => {
    if (!s.on) return;
    const t = window.setTimeout(() => setS(st => ({...st, on: false, menu: null, info: null, shift: false, alpha: false})), s.autoOff * 60_000);
    return () => window.clearTimeout(t);
  }, [s]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as Element).closest?.('.appMenu')) return;
      const seq = /^[0-9]$/.test(e.key) ? ['k' + e.key] : KEYBOARD[e.key];
      if (!seq) return;
      e.preventDefault();
      setS(st => seq.reduce(press, st));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return <main style={{width: REF_W * scale, height: REF_H * scale}}>
    <div className="stage" style={{transform: `scale(${scale})`}}>
      <div className="body"><div className="seam s1"/><div className="seam s2"/><div className="seam s3"/><div className="seam s4"/>
        <div className="face"/></div>
      <div className="brand">IQ-S1</div>
      <div className="solar"><span/><span/><span/><span/></div>
      <div className="bezel"/>
      <div className="window" aria-live="polite"><Screen s={s}/></div>
      <DPad vibrate={s.vibrate} onPress={onPress}/>
      {KEYS.map(k => <Key key={k.id} k={k} vibrate={s.vibrate} onPress={onPress}/>)}
    </div>
    <AppMenu/>
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
