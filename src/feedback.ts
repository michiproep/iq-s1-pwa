// Rückmeldung beim Tastendruck: sichtbares Eindrücken und kurze Vibration.

/** So lange bleibt eine Taste mindestens eingedrückt, damit auch ein schneller Tipp sichtbar ist (ms). */
const MIN_DOWN = 90;

/** Pointer-Handler für eine Taste: setzt die Klasse `down`, solange der Finger bzw. die Maus drückt.
 *  Ersetzt `:active`, das iOS Safari bei Touch kaum oder gar nicht anzeigt. */
export const pressHandlers = {
  onPointerDown(e: React.PointerEvent<Element>) {
    if (e.button !== 0) return;
    const el = e.currentTarget;
    el.classList.add('down');
    el.setAttribute('data-down', String(performance.now()));
  },
  onPointerUp: release, onPointerCancel: release, onPointerLeave: release,
};

function release(e: React.PointerEvent<Element>) {
  const el = e.currentTarget, since = el.getAttribute('data-down');
  if (since === null) return;
  el.removeAttribute('data-down');
  const rest = MIN_DOWN - (performance.now() - Number(since));
  if (rest > 0) window.setTimeout(() => el.classList.remove('down'), rest);
  else el.classList.remove('down');
}

let iosTick: HTMLLabelElement | null = null;

/** Kurzer Haptik-Tick. Android: Vibration-API. iOS (Safari ab 18) hat keine Vibration-API, löst aber beim
 *  Umschalten eines `<input switch>` einen System-Tick aus – dafür ein unsichtbarer Schalter.
 *  Muss direkt in einem Klick-Handler aufgerufen werden; wo nichts davon geht, passiert nichts. */
export function haptic() {
  if (typeof navigator.vibrate === 'function') { navigator.vibrate(10); return; }
  if (!iosTick) {
    iosTick = document.createElement('label');
    iosTick.setAttribute('aria-hidden', 'true');
    iosTick.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
    const input = document.createElement('input');
    input.type = 'checkbox'; input.setAttribute('switch', ''); input.tabIndex = -1;
    iosTick.append(input);
    document.body.append(iosTick);
  }
  iosTick.click();
}
