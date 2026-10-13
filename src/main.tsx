import React, {useEffect, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto-condensed/700.css';
import './style.css';
import {initialState, press, tableRows, type State} from './calc';
import {engParts, exactForm, factorize, formatParts, toBase, toDMS} from './engine';
import {ExactView, Formula} from './natural';
import {KEYS, type KeySpec, type Label} from './keys';

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
    default: {
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
    if (!cur) { box.scrollLeft = 0; return; }
    const l = cur.offsetLeft, r = l + 12;
    if (l < box.scrollLeft) box.scrollLeft = Math.max(0, l - 30);
    else if (r > box.scrollLeft + box.clientWidth) box.scrollLeft = r - box.clientWidth + 2;
  });
  const showCursor = !s.shown && !s.error;
  return <div className="input" ref={ref}>{prompt && <span className="prompt">{prompt}</span>}
    <Formula tokens={s.tokens} cursor={showCursor ? s.cursor : -1} ovr={!s.insert}/></div>;
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
    <span>{s.fmt.mode === 'NORM' ? '' : s.fmt.mode}</span><span>{ANGLE[s.angle]}</span><span>Math</span>
  </div>;
  let body: ReactNode;
  if (s.menu) {
    const m = s.menu;
    body = m.digitPrompt ? <div className="menu"><div className="title">{m.title}</div></div>
      : <div className="menu">{m.title && <div className="title">{m.title}</div>}
        {m.title === 'Zurücksetzen?' ? <><div>[=] : Ja</div><div>[AC] : Abbrechen</div></>
          : <div className="grid">{m.items.slice(m.top, m.top + 6).map((it, i) => <div key={i}>{m.top + i + 1}:{it.label}</div>)}</div>}
        {m.top > 0 && <span className="more up">▲</span>}
        {m.items.length > m.top + 6 && <span className="more">▼</span>}
      </div>;
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
  return <div className="lcd on">{ind}{body}</div>;
}

function LabelView({l}: {l: Label}) {
  const size = l.size ?? 16;
  const style: React.CSSProperties = {left: l.cx, top: l.top - size * 0.131 + (l.dy ?? 0), fontSize: size, transform: l.sx ? `translateX(-50%) scaleX(${l.sx})` : undefined};
  if (l.br) return <span className={`lbl br br-${l.br} c-${l.c}`} style={style}><span>{l.t}</span></span>;
  return <span className={`lbl c-${l.c}`} style={style}>{l.t}</span>;
}

function Key({k, onPress}: {k: KeySpec; onPress: (id: string) => void}) {
  return <>
    {k.labels?.map((l, i) => <LabelView key={i} l={l}/>)}
    <button type="button" aria-label={k.aria} className={`key ${k.kind} f-${k.font ?? 'sans'}`}
      style={{left: k.x, top: k.y, width: k.w, height: k.h, fontSize: k.fs}}
      onMouseDown={e => e.preventDefault() /* kein Fokus per Maus */} onClick={() => onPress(k.id)}>
      <span className="face">{k.face}</span>
    </button>
  </>;
}

/** Steuerkreuz (REPLAY) aus vier Trapezen. Koordinaten relativ zu (182, 317). */
function DPad({onPress}: {onPress: (id: string) => void}) {
  const pads: [string, string, string][] = [
    ['up', '14,1 103,1 85,33 32,33', 'Nach oben'], ['down', '32,100 85,100 103,132 14,132', 'Nach unten'],
    ['left', '1,17 32,50 32,82 1,115', 'Nach links'], ['right', '116,17 85,50 85,82 116,115', 'Nach rechts'],
  ];
  return <svg className="dpad" viewBox="0 0 117 133" width={117} height={133} style={{left: 182, top: 317}}>
    <defs>
      <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a4645"/><stop offset=".25" stopColor="#433f3f"/><stop offset="1" stopColor="#423e3e"/></linearGradient>
      <linearGradient id="gL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#4a4645"/><stop offset=".25" stopColor="#45413f"/><stop offset="1" stopColor="#433f3e"/></linearGradient>
      <linearGradient id="gR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#4a4645"/><stop offset=".25" stopColor="#474342"/><stop offset="1" stopColor="#433f3e"/></linearGradient>
    </defs>
    {pads.map(([id, pts, aria]) => <polygon key={id} points={pts} role="button" aria-label={aria} className="pad"
      fill={`url(#${id === 'left' ? 'gL' : id === 'right' ? 'gR' : 'gV'})`} stroke={id === 'left' ? '#46423f' : id === 'right' ? '#464241' : '#443f3f'}
      strokeWidth={5} strokeLinejoin="round" onClick={() => onPress(id)}/>)}
    <g className="dpadText" pointerEvents="none">
      <polygon points="58.5,19 63.5,25 53.5,25" fill="#fff"/>
      <polygon points="53.5,109 63.5,109 58.5,115" fill="#fff"/>
      <polygon points="17,66 25,61.5 25,70.5" fill="#fff"/>
      <polygon points="101,66 93,61.5 93,70.5" fill="#fff"/>
      <text x="58.5" y="70.3" textAnchor="middle">REPLAY</text>
    </g>
  </svg>;
}

const KEYBOARD: Record<string, string[]> = {
  '+': ['add'], '-': ['sub'], '*': ['mul'], '/': ['div'], ',': ['comma'], '.': ['comma'], '(': ['lpar'], ')': ['rpar'],
  '^': ['pow'], '!': ['shift', 'inv'], '%': ['shift', 'lpar'], ';': ['shift', 'rpar'], 'Enter': ['eq'], '=': ['eq'],
  'Backspace': ['del'], 'Escape': ['ac'], 'Delete': ['ac'], 'ArrowLeft': ['left'], 'ArrowRight': ['right'], 'ArrowUp': ['up'], 'ArrowDown': ['down'],
  's': ['sin'], 'c': ['cos'], 't': ['tan'], 'l': ['ln'], 'p': ['shift', 'exp'],
};

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
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Enter/Leertaste auf einer fokussierten Taste löst deren eigenen Klick aus
      if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
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
      <DPad onPress={onPress}/>
      {KEYS.map(k => <Key key={k.id} k={k} onPress={onPress}/>)}
    </div>
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
