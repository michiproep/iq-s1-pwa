# Bedienungsanleitung IQ-S1 PWA

Diese Anleitung erklärt die Bedienung des Rechners. Die Bedienung folgt dem Tastenaufdruck des Geräts.

> Hinweis: Dies ist eine unabhängige Nachbildung, kein offizieller Emulator. Für Prüfungen das zugelassene Originalgerät verwenden.

## Inhalt

1. [Installation als App](#1-installation-als-app)
2. [Grundprinzip der Tasten](#2-grundprinzip-der-tasten)
3. [Das Display](#3-das-display)
4. [Eingeben, Korrigieren, Rechnen](#4-eingeben-korrigieren-rechnen)
5. [Ergebnisdarstellung](#5-ergebnisdarstellung)
6. [Funktionen im Überblick](#6-funktionen-im-überblick)
7. [Speicher und Variablen](#7-speicher-und-variablen)
8. [Einstellungen (SETUP)](#8-einstellungen-setup)
9. [Rechenmodi (MODE)](#9-rechenmodi-mode)
10. [Weitere Menüs](#10-weitere-menüs)
11. [Fehlermeldungen](#11-fehlermeldungen)
12. [Bedienung per PC-Tastatur](#12-bedienung-per-pc-tastatur)
13. [Grenzen der Nachbildung](#13-grenzen-der-nachbildung)

---

## 1. Installation als App

Die Seite muss über HTTPS (oder `localhost`) geöffnet werden.

- **Android (Chrome):** Menü ⋮ → *App installieren* bzw. *Zum Startbildschirm hinzufügen*.
- **iPhone/iPad (Safari):** Teilen-Symbol → *Zum Home-Bildschirm*.
- **PC (Chrome/Edge):** Installieren-Symbol in der Adressleiste.

Nach dem ersten Aufruf funktioniert der Rechner auch **offline**. Updates werden beim nächsten Start mit Internetverbindung automatisch geladen.

## 2. Grundprinzip der Tasten

Jede Taste hat bis zu drei Belegungen:

| Beschriftung | So erreichst du sie | Beispiel |
|---|---|---|
| weiß auf der Taste | Taste direkt drücken | `sin` |
| **grün** über der Taste | zuerst **SHIFT**, dann die Taste | SHIFT `sin` → sin⁻¹ |
| **orange** über der Taste | zuerst **ALPHA**, dann die Taste | ALPHA `×` → ggT |
| **gelb** (DEC, HEX, BIN, OCT, A–F) | nur im Modus BASE-N, Taste direkt | `log` → BIN |

SHIFT und ALPHA gelten nur für den **nächsten** Tastendruck. Ein zweiter Druck auf SHIFT bzw. ALPHA hebt die Auswahl wieder auf.

## 3. Das Display

- **Obere Zeile (Statusanzeigen):** `S` (SHIFT aktiv), `A` (ALPHA aktiv), `M` (unabhängiger Speicher ≠ 0), `STO`/`RCL` (Speichern/Abrufen wartet auf Variable), `hyp`, aktueller Modus (`STAT`, `TABLE`, `Dec`/`Hex`/`Bin`/`Oct`), `FIX`/`SCI`, Winkelmaß `D`/`R`/`G`.
- **Eingabezeile (links):** der eingegebene Ausdruck mit blinkendem Cursor.
- **Ergebniszeile (rechts):** das Ergebnis nach `=`.

## 4. Eingeben, Korrigieren, Rechnen

| Aktion | Taste |
|---|---|
| Ergebnis berechnen | `=` |
| Dezimalkomma | `,` (unten links neben 0) |
| Trennzeichen zwischen Argumenten | SHIFT `)` → `;` |
| Cursor bewegen | ◀ ▶ am Steuerkreuz |
| Zeichen links vom Cursor löschen | `DEL` |
| Überschreiben statt Einfügen (umschalten) | SHIFT `DEL` (INS) |
| Eingabe löschen | `AC` |
| Ausschalten / Einschalten | SHIFT `AC` (OFF) / `ON` |
| Frühere Rechnungen anzeigen | ▲ ▼ (REPLAY) |
| Letzte Rechnung bearbeiten | nach dem Ergebnis ◀ oder ▶ |

**Weiterrechnen mit dem Ergebnis:** Beginnt man direkt nach einem Ergebnis mit einem Rechenzeichen (z. B. `+`, `×`, `x²`), setzt der Rechner automatisch `Ans` davor. Beginnt man mit einer Ziffer, startet eine neue Rechnung.

**Mehrere Anweisungen:** ALPHA `x³` fügt `:` ein. `2+3:Ans×2` liefert 10.

Beispiel: `2` `+` `3` `×` `4` `=` → **14**

### Lehrbuch-Eingabe (Vorlagen)

Wie am Gerät erscheinen Brüche, Wurzeln, Potenzen, log und Betrag als **Formel mit Eingabefeldern**. Leere Felder werden als gepunktetes Kästchen angezeigt.

| Vorlage | Taste | Darstellung |
|---|---|---|
| Bruch | `▭/▭` | Zähler über Nenner |
| gemischter Bruch | SHIFT `▭/▭` | Ganzes, Zähler, Nenner |
| Quadrat-/Kubikwurzel | `√■` / SHIFT `√■` | Wurzelzeichen mit Überstrich |
| n-te Wurzel | SHIFT `x■` | Index, Radikand |
| Potenz | `x■`, `x²`, `x³`, `x⁻¹` | hochgestellter Exponent |
| 10ˣ, eˣ | SHIFT `log`, SHIFT `ln` | 10 bzw. e mit hochgestelltem Exponenten |
| Logarithmus zur Basis a | `log■□` | log mit tiefgestellter Basis |
| Betrag | `Abs` | Betragsstriche \|x\| |

- **Zwischen den Feldern wechseln:** ◀ ▶. Mit ▶ am Ende eines Feldes geht es ins nächste Feld bzw. hinter die Vorlage.
- **Zahl vor ▭/▭:** Steht direkt vor dem Cursor eine Zahl oder ein Ausdruck wie `4√2`, wird er automatisch zum Zähler, und der Cursor springt in den Nenner. Direkt nach einem Ergebnis wird `Ans` zum Zähler.
- **Vorlage entfernen:** `DEL` am Anfang eines Feldes löst die Vorlage auf. Der eingegebene Inhalt bleibt erhalten.
- **Schließende Klammern** am Ende dürfen fehlen, etwa bei `sin(30`. Sie werden beim Rechnen ergänzt.

Beispiel (wie im Gerätedisplay):
`4` `√■` `2` ▶ `▭/▭` `3` ▶ `+` `1` `▭/▭` `6` `√■` `2` `=` → Eingabe 4√2⁄3 + 1⁄(6√2), Ergebnis **17√2⁄12**

## 5. Ergebnisdarstellung

- Ergebnisse erscheinen nach Möglichkeit **exakt** in Lehrbuchform:
  - als **Bruch**, z. B. 1÷3 → ⅓
  - als **Wurzelterm**, z. B. √8 → 2√2, sin 45° → √2⁄2, 4√2⁄3 + 1⁄(6√2) → 17√2⁄12
  - als **π-Vielfaches**, z. B. 3π÷4 → 3π⁄4
- Gibt es keine exakte Form, erscheint die Dezimalzahl.
- **S⇔D** wechselt zwischen exakter Form und Dezimalzahl.
- **SHIFT =** (≈) berechnet und zeigt direkt die Dezimalzahl.
- **SHIFT S⇔D** wechselt zwischen gemischtem Bruch (2 ⅓) und unechtem Bruch (7/3).
- **ENG** zeigt das Ergebnis in technischer Notation (Exponent durch 3 teilbar). Jeder weitere Druck verkleinert den Exponenten um 3. **SHIFT ENG** (←) vergrößert ihn.
- **°,,,** direkt nach einem Ergebnis zeigt es in Grad°Minuten°Sekunden°.
- **SHIFT °,,,** (FACT) zerlegt ein ganzzahliges Ergebnis in Primfaktoren, z. B. 360 → 2³×3²×5.
- Sehr große oder sehr kleine Zahlen erscheinen als `1,8×10¹³`.

## 6. Funktionen im Überblick

### Grundrechenarten und Potenzen

| Funktion | Eingabe | Beispiel |
|---|---|---|
| Quadrat, Kubik | `x²`, `x³` | `3` `x²` `=` → 9 |
| Kehrwert | `x⁻¹` | `4` `x⁻¹` `=` → ¼ |
| beliebige Potenz | `x■` | `2` `x■` `10` `=` → 1024 |
| Quadratwurzel / Kubikwurzel | `√■` / SHIFT `√■` | `√■` `16` `=` → 4 |
| n-te Wurzel | SHIFT `x■` | SHIFT `x■` `3` ▶ `(−)` `8` `=` → −2 |
| Zehnerpotenz eingeben | `x10ˣ` | `5` `x10ˣ` `3` → 5000 |
| Prozent | SHIFT `(` | `200` `×` `15` `%` `=` → 30 |
| Fakultät | SHIFT `x⁻¹` (x!) | `5` `x!` `=` → 120 |
| Vorzeichen | `(−)` | `(−)` `3` |
| Betrag | `Abs` | `Abs` `(−)` `7` `=` → 7 |
| Division mit Rest | SHIFT `Abs` (÷R) | `17` `÷R` `5` `=` → Q=3, R=2 |
| Bruch eingeben | `▭/▭` | `1` `▭/▭` `3` `=` → ⅓ |
| gemischter Bruch | SHIFT `▭/▭` | SHIFT `▭/▭` `2` ▶ `1` ▶ `2` `=` → 2½ |

### Logarithmen und Exponentialfunktion

| Funktion | Eingabe |
|---|---|
| log₁₀ / 10ˣ | `log` / SHIFT `log` |
| ln / eˣ | `ln` / SHIFT `ln` |
| Logarithmus zur Basis a | `log■□` `2` ▶ `8` `=` → 3 (log₂8) |

### Trigonometrie

| Funktion | Eingabe |
|---|---|
| sin, cos, tan | `sin`, `cos`, `tan` |
| sin⁻¹, cos⁻¹, tan⁻¹ | SHIFT + `sin`/`cos`/`tan` |
| sinh, cosh, tanh | `hyp`, dann `sin`/`cos`/`tan` |
| sinh⁻¹ usw. | `hyp`, dann SHIFT + `sin`/`cos`/`tan` |
| Polar-Koordinaten | SHIFT `+` → Pol(x;y) → r, θ |
| Kartesische Koordinaten | SHIFT `−` → Rec(r;θ) → x, y |
| Winkeleinheit erzwingen | SHIFT `Ans` (DRG▸) → 1:° 2:ʳ 3:ᵍ |
| Grad-Minuten-Sekunden eingeben | `30` `°,,,` `30` `°,,,` → 30,5° |

Das Winkelmaß (Deg/Rad/Gra) wird im SETUP eingestellt (siehe Abschnitt 8).

### Kombinatorik, Zahlentheorie, Zufall

| Funktion | Eingabe | Beispiel |
|---|---|---|
| nPr | SHIFT `×` | `5` nPr `2` = 20 |
| nCr | SHIFT `÷` | `5` nCr `2` = 10 |
| ggT | ALPHA `×` | ggT(12;18) = 6 |
| kgV | ALPHA `÷` | kgV(4;6) = 12 |
| ganzzahliger Anteil | ALPHA `+` (INT) | Int(−2,5) = −2 |
| größte ganze Zahl ≤ x | ALPHA `−` (Intg) | Intg(−2,5) = −3 |
| Runden auf Anzeigeformat | SHIFT `0` (Rnd) | |
| Zufallszahl 0–1 | SHIFT `,` (Ran#) | |
| ganzzahlige Zufallszahl | ALPHA `,` (RanInt) | RanInt(1;6) |
| π / e | SHIFT `x10ˣ` / ALPHA `x10ˣ` | |

## 7. Speicher und Variablen

Es gibt neun Variablen: **A, B, C, D, E, F, X, Y, M**. Sie liegen auf den orange beschrifteten Tasten: `(−)`=A, `°,,,`=B, `hyp`=C, `sin`=D, `cos`=E, `tan`=F, `)`=X, `S⇔D`=Y, `M+`=M.

| Aktion | Eingabe |
|---|---|
| Wert speichern | Ausdruck eingeben (oder Ergebnis anzeigen), dann SHIFT `RCL` (STO), dann Variablentaste |
| Wert abrufen und anzeigen | `RCL`, dann Variablentaste |
| Variable in Rechnung verwenden | ALPHA + Variablentaste, z. B. `2` ALPHA `(−)` → 2A |
| Zum Speicher M addieren | `M+` |
| Vom Speicher M abziehen | SHIFT `M+` (M−) |
| Letztes Ergebnis | `Ans` |
| Alle Variablen löschen | SHIFT `9` (CLR) → 2:Speicher → `=` |

Beispiel: `7` SHIFT `RCL` `(−)` speichert 7 in A. Danach ergibt ALPHA `(−)` `×` `2` `=` den Wert 14.

> Speicherinhalte bleiben nur erhalten, solange die App geöffnet ist. Beim Neuladen werden sie zurückgesetzt.

## 8. Einstellungen (SETUP)

**SHIFT MODE** öffnet das SETUP. Wähle mit der Zifferntaste, mit ▲ ▼ blätterst du.

| Nr. | Einstellung | Wirkung |
|---|---|---|
| 1 | Deg | Winkel in Grad (Standard) |
| 2 | Rad | Winkel im Bogenmaß |
| 3 | Gra | Winkel in Gon |
| 4 | Fix | feste Nachkommastellen, danach Ziffer 0–9 |
| 5 | Sci | wissenschaftliche Darstellung mit n Stellen, danach Ziffer 0–9 (0 = 10) |
| 6 | Norm | Normaldarstellung, danach 1 oder 2 |
| 7 | ab/c | Brüche gemischt anzeigen (2 ⅓) |
| 8 | d/c | Brüche unecht anzeigen (7/3, Standard) |

Zurücksetzen auf Standard: SHIFT `9` (CLR) → 1:Setup → `=`.

## 9. Rechenmodi (MODE)

**MODE** öffnet die Modusauswahl: 1:COMP 2:STAT 3:TABLE 4:BASE-N. Der aktive Modus steht in der Statuszeile.

### COMP – normale Berechnungen
Standardmodus für alle Rechnungen.

### STAT – Statistik (eine Variable)
1. MODE `2` (oder SHIFT `1` aus COMP heraus).
2. Wert eingeben und **M+** drücken. Der Wert wird gespeichert (Anzeige `n=…`). So für alle Werte wiederholen.
3. **SHIFT 1** öffnet das Statistikmenü: 1:n 2:x̄ 3:σx 4:sx 5:Σx 6:Σx² 7:minX 8:maxX 9:Daten löschen.
4. Gewählte Größe wird in die Eingabe übernommen, dann `=`. Sie lässt sich auch in Formeln verwenden, z. B. `x̄ × 2`.

Beispiel: 2 M+ 4 M+ 6 M+, dann SHIFT 1 → 2 (x̄) → `=` → **4**.

### TABLE – Wertetabelle
1. MODE `3`.
2. Bei `f(x)=` die Funktion eingeben. Die Variable x erhältst du mit ALPHA `)`. Dann `=`.
3. `Start?`, `Ende?`, `Schritt?` jeweils mit Wert und `=` bestätigen. Ein vorgeschlagener Wert wird durch die erste Eingabe ersetzt, `=` übernimmt ihn unverändert.
4. Mit ▲ ▼ durch die Tabelle blättern (höchstens 30 Zeilen).
5. `AC` kehrt zur Funktionseingabe zurück.

Beispiel: f(x)=x², Start 1, Ende 3, Schritt 1 → 1 | 1, 2 | 4, 3 | 9.

### BASE-N – Zahlensysteme
1. MODE `4` oder SHIFT `3`. SHIFT `3` im Modus BASE-N kehrt zu COMP zurück.
2. Zahlensystem wählen (gelbe Beschriftung): `x²` = DEC, `x■` = HEX, `log` = BIN, `ln` = OCT.
3. Hex-Ziffern A–F über `(−)`, `°,,,`, `hyp`, `sin`, `cos`, `tan`.
4. Es wird ganzzahlig gerechnet. Ein Wechsel des Zahlensystems nach `=` zeigt das Ergebnis im neuen System.

Beispiel: HEX, `FF` `+` `1` `=` → **100**. Mit DEC umgeschaltet erscheint 256.

## 10. Weitere Menüs

| Menü | Taste | Inhalt |
|---|---|---|
| CONST | SHIFT `7` | 1:c Lichtgeschwindigkeit, 2:h Planck, 3:k Boltzmann, 4:Nᴀ Avogadro, 5:G Gravitation, 6:g Fallbeschleunigung, 7:e Elementarladung, 8:mₑ Elektronenmasse, 9:R Gaskonstante |
| CONV | SHIFT `8` oder ALPHA `8` | 1:cm▸in 2:in▸cm 3:km▸mile 4:mile▸km 5:kg▸lb 6:lb▸kg 7:°C▸°F 8:°F▸°C 9:km/h▸m/s – wird auf die aktuelle Eingabe bzw. das letzte Ergebnis angewendet |
| CLR | SHIFT `9` | 1:Setup 2:Speicher 3:Alle, Bestätigung mit `=`, Abbruch mit `AC` |
| DRG▸ | SHIFT `Ans` | Winkeleinheit °, ʳ, ᵍ an einen Wert anhängen |

In allen Menüs wählst du mit der Zifferntaste, blätterst mit ▲ ▼ und schließt mit `AC`.

Beispiel Umrechnung: `2,54` SHIFT `8` `1` → **1** (inch).

## 11. Fehlermeldungen

| Meldung | Ursache |
|---|---|
| Syntax ERROR | Ausdruck unvollständig oder falsch, z. B. `1+` |
| Math ERROR | Rechnung nicht definiert, z. B. Division durch 0, tan(90°), Wurzel aus negativer Zahl, Ergebnis zu groß |
| Range ERROR | ungültiger Tabellenbereich (Ende < Start, Schritt ≤ 0 oder mehr als 30 Zeilen) |

`AC` verwirft die Eingabe. ◀ oder ▶ kehrt zur Eingabe zurück, damit du sie korrigieren kannst.

## 12. Bedienung per PC-Tastatur

| Taste | Wirkung |
|---|---|
| `0`–`9`, `+ - * / ^ ( )` | wie auf dem Rechner |
| `,` oder `.` | Dezimalkomma |
| `;` | Argumenttrenner |
| `!` / `%` | Fakultät / Prozent |
| `s` `c` `t` `l` | sin, cos, tan, ln |
| `p` | π |
| Enter oder `=` | Ergebnis |
| Backspace | DEL |
| Esc oder Entf | AC |
| Pfeiltasten | Steuerkreuz |

## 13. Grenzen der Nachbildung

- Die Lehrbuch-Darstellung nutzt eine normale Schrift, nicht die Pixelschrift des LCD. Exakte Ergebnisse gibt es für Brüche, einfache Wurzelterme (a√b⁄c) und π-Vielfache, aber nicht für Summen wie 1+√2.
- VERIFY (SHIFT 6), Verteilungen und Regression sind nicht nachgebildet.
- Es gibt 9 Konstanten und 9 Umrechnungen statt des vollen Umfangs des Originals.
- Die Ergebnisse sind nicht gegen das Originalgerät geprüft.
