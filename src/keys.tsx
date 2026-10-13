import type {ReactNode} from 'react';

/** Koordinaten in Pixeln bezogen auf das 478 × 929 px große Referenzfoto. */
export type Color = 'g' | 'o' | 'y' | 'w';
export interface Label {t: ReactNode; c: Color; cx: number; top: number; size?: number; br?: 'y' | 'w'; dy?: number; sx?: number}
export interface KeySpec {id: string; x: number; y: number; w: number; h: number; kind: 'small' | 'big' | 'pillL' | 'pillR'; face?: ReactNode; fs?: number; font?: 'cond' | 'sans' | 'serif'; labels?: Label[]; aria: string}

/** Kleines gefülltes Quadrat (Platzhalter in Tastensymbolen). */
export const Sq = ({s = 0.42}: {s?: number}) => <span className="sq" style={{width: `${s}em`, height: `${s * 1.15}em`}}/>;
/** Hohles Kästchen. */
export const Bx = ({s = 0.42}: {s?: number}) => <span className="bx" style={{width: `${s}em`, height: `${s * 1.5}em`}}/>;
const FracIcon = ({filled = true}: {filled?: boolean}) => <span className="fracIcon"><Bx s={0.62}/><i/>{filled ? <Sq s={0.62}/> : <Bx s={0.62}/>}</span>;
const X = ({children}: {children?: ReactNode}) => <span className="xv">x{children}</span>;
/** Rechenzeichen als SVG, damit Strichstärke und Größe exakt dem Gerät entsprechen. */
const Glyph = ({w, h, children}: {w: number; h: number; children: ReactNode}) =>
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="currentColor" aria-hidden="true">{children}</svg>;
const Plus = () => <Glyph w={25} h={25}><rect x={0} y={10.5} width={25} height={4}/><rect x={10.5} y={0} width={4} height={25}/></Glyph>;
const Minus = () => <Glyph w={24} h={5}><rect x={0} y={0.5} width={24} height={4}/></Glyph>;
const Times = () => <Glyph w={20} h={20}><path d="M2.3 0 10 7.7 17.7 0 20 2.3 12.3 10 20 17.7 17.7 20 10 12.3 2.3 20 0 17.7 7.7 10 0 2.3z"/></Glyph>;
const Divide = () => <Glyph w={24} h={22}><rect x={0} y={9.25} width={24} height={3.5}/><circle cx={12} cy={2.8} r={2.8}/><circle cx={12} cy={19.2} r={2.8}/></Glyph>;
const Equals = () => <Glyph w={22} h={15.5}><rect x={0} y={0} width={22} height={4.5}/><rect x={0} y={11} width={22} height={4.5}/></Glyph>;
const CommaIcon = () => <Glyph w={11} h={20}><path d="M5.5 0a5.5 5.5 0 0 1 5.5 5.6c0 6-3.4 11.3-8.4 14.2l-1.3-1.7c2.6-2 4.4-4.4 4.8-7.3A5.5 5.5 0 1 1 5.5 0z"/></Glyph>;
const LeftArrow = () => <Glyph w={20} h={9}><path d="M0 4.5 7 0v3h13v3H7v3z"/></Glyph>;
const Dash = () => <span className="dash"/>;

const SX = [55, 119, 183, 248, 312, 376], SY = [432, 484, 537, 589];
const BX = [55, 133, 211, 289, 367], BY = [638, 707, 776, 845];
const sTop = [415, 467, 519, 572], bTop = [624, 692, 761, 831];

const small = (id: string, c: number, r: number, face: ReactNode, aria: string, labels: Omit<Label, 'top'>[] = [], fs = 17, font: KeySpec['font'] = 'sans'): KeySpec =>
  ({id, x: SX[c], y: SY[r], w: 52, h: 29, kind: 'small', face, fs, font, aria, labels: labels.map(l => ({top: sTop[r], size: 14.5, ...l}))});
const big = (id: string, c: number, r: number, face: ReactNode, aria: string, labels: Omit<Label, 'top'>[] = [], fs = 34, font: KeySpec['font'] = 'sans'): KeySpec =>
  ({id, x: BX[c], y: BY[r], w: 60, h: 47, kind: 'big', face, fs, font, aria, labels: labels.map(l => ({top: bTop[r], size: 13.5, ...l}))});

export const KEYS: KeySpec[] = [
  {id: 'shift', x: 61, y: 339, w: 46, h: 36, kind: 'pillL', aria: 'SHIFT', labels: [{t: 'SHIFT', c: 'g', cx: 84, top: 318}]},
  {id: 'alpha', x: 113, y: 339, w: 46, h: 36, kind: 'pillR', aria: 'ALPHA', labels: [{t: 'ALPHA', c: 'o', cx: 137, top: 318}]},
  {id: 'mode', x: 323, y: 339, w: 44, h: 36, kind: 'pillL', aria: 'MODE', labels: [{t: 'MODE', c: 'w', cx: 324.5, top: 318, size: 15, sx: 0.78}, {t: 'SETUP', c: 'g', cx: 361, top: 318}]},
  {id: 'on', x: 376, y: 339, w: 45, h: 36, kind: 'pillR', aria: 'ON', labels: [{t: 'ON', c: 'w', cx: 402, top: 318, size: 17}]},

  small('abs', 0, 0, 'Abs', 'Abs', [{t: '÷R', c: 'g', cx: 80, size: 16.5}]),
  small('cube', 1, 0, <X><sup>3</sup></X>, 'x hoch 3', [{t: ':', c: 'o', cx: 145, size: 18, dy: -1}], 24, 'serif'),
  small('inv', 4, 0, <X><sup>-1</sup></X>, 'x hoch minus 1', [{t: <span className="xv">x!</span>, c: 'g', cx: 336, size: 20, dy: -1}], 23, 'serif'),
  small('logab', 5, 0, <>log<Sq s={0.36}/><Bx s={0.5}/></>, 'log a b', [], 14.5, 'cond'),

  small('frac', 0, 1, <span style={{fontSize: 19}}><FracIcon filled={false}/></span>, 'Bruch', [{t: <><Sq s={0.4}/><FracIcon/></>, c: 'g', cx: 80, size: 13}]),
  small('sqrt', 1, 1, <>√<Sq s={0.45}/></>, 'Wurzel', [{t: <><sup>3</sup>√<Sq s={0.4}/></>, c: 'g', cx: 143, size: 15}], 22),
  small('sq', 2, 1, <X><sup>2</sup></X>, 'x Quadrat', [{t: <Sq s={0.42}/>, c: 'g', cx: 193}, {t: 'DEC', c: 'y', size: 13, cx: 217}], 24, 'serif'),
  small('pow', 3, 1, <X><sup><Sq s={0.55}/></sup></X>, 'x hoch y', [{t: <><Sq s={0.38}/>√<Bx s={0.38}/></>, c: 'g', cx: 257, size: 14}, {t: 'HEX', c: 'y', size: 13, cx: 286}], 24, 'serif'),
  small('log', 4, 1, 'log', 'log', [{t: <>10<sup><Sq s={0.5}/></sup></>, c: 'g', cx: 322, size: 13}, {t: 'BIN', c: 'y', size: 13, cx: 352}], 18, 'cond'),
  small('ln', 5, 1, 'ln', 'ln', [{t: <span className="xv">e<sup><Sq s={0.5}/></sup></span>, c: 'g', cx: 385, size: 15}, {t: 'OCT', c: 'y', size: 13, cx: 412}], 18, 'cond'),

  small('neg', 0, 2, <>(<Dash/>)</>, 'Vorzeichen', [{t: 'A', c: 'o', cx: 91, br: 'y', size: 11.5}], 17),
  small('dms', 1, 2, <span className="dmsFace">o<b>,</b><b>,,</b></span>, 'Grad Minuten Sekunden', [{t: 'FACT', c: 'g', cx: 132}, {t: 'B', c: 'o', cx: 160, br: 'y', size: 11.5}], 18),
  small('hyp', 2, 2, 'hyp', 'hyp', [{t: 'C', c: 'o', cx: 220, br: 'y', size: 11.5}], 17),
  small('sin', 3, 2, 'sin', 'sin', [{t: <>sin<sup>-1</sup></>, c: 'g', cx: 263}, {t: 'D', c: 'o', cx: 287, br: 'y', size: 11.5}], 18),
  small('cos', 4, 2, 'cos', 'cos', [{t: <>cos<sup>-1</sup></>, c: 'g', cx: 327}, {t: 'E', c: 'o', cx: 351, br: 'y', size: 11.5}], 18),
  small('tan', 5, 2, 'tan', 'tan', [{t: <>tan<sup>-1</sup></>, c: 'g', cx: 391}, {t: 'F', c: 'o', cx: 415, br: 'y', size: 11.5}], 18),

  small('rcl', 0, 3, 'RCL', 'RCL', [{t: 'STO', c: 'g', cx: 81}], 16, 'cond'),
  small('eng', 1, 3, 'ENG', 'ENG', [{t: <LeftArrow/>, c: 'g', cx: 145, size: 14}], 16, 'cond'),
  small('lpar', 2, 3, '(', 'Klammer auf', [{t: '%', c: 'g', cx: 208, size: 16}], 17),
  small('rpar', 3, 3, ')', 'Klammer zu', [{t: ';', c: 'g', cx: 257, size: 21, dy: -2}, {t: 'X', c: 'o', cx: 286}], 17),
  small('sd', 4, 3, 'S⇔D', 'S D', [{t: <span className="abc">a<span className="mf"><i>b</i><i>c</i></span>⇔<span className="mf"><i>d</i><i>c</i></span></span>, c: 'g', cx: 330, size: 12}, {t: 'Y', c: 'o', cx: 355, size: 14}], 16, 'cond'),
  small('mplus', 5, 3, 'M+', 'M plus', [{t: 'M−', c: 'g', cx: 390}, {t: 'M', c: 'o', cx: 417}], 17, 'cond'),

  big('k7', 0, 0, '7', '7', [{t: 'CONST', c: 'g', cx: 85}]),
  big('k8', 1, 0, '8', '8', [{t: 'CONV', c: 'g', cx: 142}, {t: '▸', c: 'w', cx: 163, size: 13, dy: -1}, {t: 'Conv', c: 'o', cx: 185}]),
  big('k9', 2, 0, '9', '9', [{t: 'CLR', c: 'g', cx: 240}]),
  big('del', 3, 0, 'DEL', 'DEL', [{t: 'INS', c: 'g', cx: 318}], 25, 'cond'),
  big('ac', 4, 0, 'AC', 'AC', [{t: 'OFF', c: 'g', cx: 397}], 25, 'cond'),

  big('k4', 0, 1, '4', '4'),
  big('k5', 1, 1, '5', '5'),
  big('k6', 2, 1, '6', '6', [{t: 'VERIFY', c: 'g', cx: 241, br: 'w', size: 12.5}]),
  big('mul', 3, 1, <Times/>, 'mal', [{t: 'nPr', c: 'g', cx: 299}, {t: 'ggT', c: 'o', cx: 333}], 36),
  big('div', 4, 1, <Divide/>, 'geteilt', [{t: 'nCr', c: 'g', cx: 379}, {t: 'kgV', c: 'o', cx: 414}], 36),

  big('k1', 0, 2, '1', '1', [{t: 'STAT/DIST', c: 'g', cx: 85, br: 'w', size: 12}]),
  big('k2', 1, 2, '2', '2'),
  big('k3', 2, 2, '3', '3', [{t: 'BASE', c: 'g', cx: 241, br: 'y', size: 12}]),
  big('add', 3, 2, <Plus/>, 'plus', [{t: 'Pol', c: 'g', cx: 298}, {t: 'INT', c: 'o', cx: 337}], 38),
  big('sub', 4, 2, <Minus/>, 'minus', [{t: 'Rec', c: 'g', cx: 378}, {t: 'Intg', c: 'o', cx: 414}], 38),

  big('k0', 0, 3, '0', '0', [{t: 'Rnd', c: 'g', cx: 85}]),
  big('comma', 1, 3, <CommaIcon/>, 'Komma', [{t: 'Ran#', c: 'g', cx: 141}, {t: 'RanInt', c: 'o', cx: 181}]),
  big('exp', 2, 3, <span className="expFace">x10<span className="xv">x</span></span>, 'mal zehn hoch', [{t: 'π', c: 'g', cx: 225, size: 17, dy: -2}, {t: <span className="eLabel">e</span>, c: 'o', cx: 256, size: 21, dy: -6}], 19.5),
  big('ans', 3, 3, 'Ans', 'Ans', [{t: 'DRG▸', c: 'g', cx: 318}], 25, 'cond'),
  big('eq', 4, 3, <Equals/>, 'gleich', [{t: '≈', c: 'g', cx: 397, size: 23, dy: -3}], 40),
];
