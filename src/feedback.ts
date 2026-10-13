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

/** Klick auf eine Taste. Jede Taste ist ein <label> mit verstecktem <input switch>: iOS (ab 18) hat keine
 *  Vibration-API, gibt aber einen Haptik-Tick, wenn der Finger einen Schalter umlegt – nicht, wenn Code ihn umlegt.
 *  Android vibriert über navigator.vibrate. Liefert false für den Klick, den das Label an den Schalter weiterreicht. */
export function keyClick(e: React.MouseEvent, vibrate: boolean): boolean {
  if (e.target instanceof HTMLInputElement) return false;
  if (!vibrate) e.preventDefault();  // Schalter bleibt, wie er ist → kein Tick
  else if (typeof navigator.vibrate === 'function') navigator.vibrate(10);
  return true;
}
