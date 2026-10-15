# Testabdeckung der Rechenfunktionen

> Diese Datei wird aus [`src/funktionen.test.ts`](../src/funktionen.test.ts) erzeugt. Nicht von Hand ändern,
> sondern `npm test -- -u` ausführen. `npm test` schlägt fehl, wenn sie nicht zum Testkatalog passt.

## So wird Vollständigkeit geprüft

Der Funktionskatalog enthält **198 Testfälle**. Jeder Fall tippt eine Tastenfolge wie am Gerät ein und prüft das Ergebnis.
Zusätzlich prüfen automatische Tests, dass nichts fehlt:

1. **Jede Tastenbelegung** in `KEYMAP` (`src/calc.ts`) hat einen Fall: primär, SHIFT, ALPHA, Variable bei STO/RCL und BASE-N.
2. **Jede Vorlage** (Bruch, Wurzel, Potenz …) hat zusätzlich einen Fall im SETUP „Linear“.
3. **Jeder Menüeintrag** von MODE, SETUP, CLR, CONST, CONV, DRG▸ und STAT hat einen Fall. Die Einträge werden aus den Menüs selbst gelesen.
4. **Jedes Token des Rechenkerns** (`TOKENS` und Vorlagen-Strukturen in `src/engine.ts`) wird in mindestens einem Fall eingegeben.

Kommt eine Taste, ein Menüeintrag oder eine Funktion hinzu, schlägt `npm test` fehl, bis ein Testfall dafür existiert.

Bekannte Fehler: keine.
Sie laufen als `it.fails` und werden rot, sobald der Fehler behoben ist. Dann die Markierung entfernen.

Die Ergebnisse sind nicht mit dem Originalgerät abgeglichen. Die erwarteten Werte stammen aus der Mathematik bzw. aus CODATA.
Tests für Randfälle (Fehlermeldungen, Anzeigeformate, exakte Formen, Brüche navigieren …) stehen in
[`src/engine.test.ts`](../src/engine.test.ts) und [`src/calc.test.ts`](../src/calc.test.ts).

## Tasten (121)

Ebene: – = ohne Umschaltung, SHIFT = grün, ALPHA = orange, STO/RCL = Variable nach STO oder RCL, BASE-N = Belegung im BASE-N-Modus.
Winkeleinheit ist DEG, wenn nicht anders angegeben.

| Taste | Ebene | Funktion | Tastenfolge | Erwartet |  |
| --- | --- | --- | --- | --- | --- |
| SHIFT | – | SHIFT (grüne Funktionen) | `SHIFT` | SHIFT aktiv | ✅ |
| ALPHA | – | ALPHA (orange Funktionen) | `ALPHA` | ALPHA aktiv | ✅ |
| MODE | – | MODE-Menü | `MODE` | Menü MODE | ✅ |
| MODE | SHIFT | SETUP-Menü | `SHIFT MODE` | Menü SETUP | ✅ |
| ON | – | Einschalten | `SHIFT AC ON` | eingeschaltet | ✅ |
| ▲ | – | REPLAY zurück | `1 + 1 = 2 + 2 = ▲` | 1+1 wieder im Display | ✅ |
| ▼ | – | REPLAY vor | `1 = 2 = ▲ ▲ ▼` | 2 wieder im Display | ✅ |
| ◀ | – | Cursor nach links | `12 ◀ 3` | 132 | ✅ |
| ▶ | – | Cursor nach rechts | `12 ◀ ◀ ▶ 3` | 132 | ✅ |
| Abs | – | Betrag | `Abs (−) 5 =` | 5 | ✅ |
| Abs | SHIFT | Division mit Rest ÷R | `17 SHIFT Abs 5 =` | Q=3, R=2 | ✅ |
| x³ | – | x³ | `2 x³ =` | 8 | ✅ |
| x³ | ALPHA | Mehrfachanweisung : | `2 + 3 ALPHA x³ Ans × 2 =` | 10 | ✅ |
| x⁻¹ | – | Kehrwert x⁻¹ | `4 x⁻¹ =` | 0,25 | ✅ |
| x⁻¹ | SHIFT | Fakultät x! | `5 SHIFT x⁻¹ =` | 120 | ✅ |
| log▫▫ | – | Logarithmus zur Basis a | `log▫▫ 2 ▶ 8 =` | 3 | ✅ |
| ▭/▭ | – | Bruch | `1 ▭/▭ 4 =` | 0,25 | ✅ |
| ▭/▭ | SHIFT | Gemischter Bruch | `SHIFT ▭/▭ 2 ▶ 1 ▶ 2 =` | 2,5 | ✅ |
| √▫ | – | Quadratwurzel | `√▫ 16 =` | 4 | ✅ |
| √▫ | SHIFT | Kubikwurzel | `SHIFT √▫ 27 =` | 3 | ✅ |
| x² | – | x² | `3 x² =` | 9 | ✅ |
| x² | BASE-N | BASE-N: DEC | `SHIFT 3 x^▫ tan tan = x²` | 255 dezimal | ✅ |
| x^▫ | – | Potenz xʸ | `2 x^▫ 10 =` | 1024 | ✅ |
| x^▫ | SHIFT | n-te Wurzel | `SHIFT x^▫ 3 ▶ 27 =` | 3 | ✅ |
| x^▫ | BASE-N | BASE-N: HEX | `SHIFT 3 x^▫ tan tan =` | FF₁₆ = 255 | ✅ |
| log | – | Zehnerlogarithmus | `log 100 =` | 2 | ✅ |
| log | SHIFT | 10ˣ | `SHIFT log 3 =` | 1000 | ✅ |
| log | BASE-N | BASE-N: BIN | `SHIFT 3 log 101 =` | 101₂ = 5 | ✅ |
| ln | – | Natürlicher Logarithmus | `ln ALPHA ×10ˣ =` | 1 | ✅ |
| ln | SHIFT | eˣ | `SHIFT ln 1 =` | e | ✅ |
| ln | BASE-N | BASE-N: OCT | `SHIFT 3 ln 17 =` | 17₈ = 15 | ✅ |
| (−) | – | Vorzeichen | `(−) 3 × 2 =` | -6 | ✅ |
| (−) | ALPHA | Variable A | `7 SHIFT RCL (−) AC ALPHA (−) =` | 7 | ✅ |
| (−) | STO/RCL | A bei STO/RCL | `3 SHIFT RCL (−) AC RCL (−)` | A = 3 | ✅ |
| (−) | BASE-N | Hex-Ziffer A | `SHIFT 3 x^▫ (−) =` | 10 (A₁₆) | ✅ |
| °′″ | – | Grad-Minuten-Sekunden | `30 °′″ 30 °′″ =` | 30,5 | ✅ |
| °′″ | SHIFT | Primfaktorzerlegung FACT | `360 = SHIFT °′″` | Anzeige 2³×3²×5 | ✅ |
| °′″ | ALPHA | Variable B | `7 SHIFT RCL °′″ AC ALPHA °′″ =` | 7 | ✅ |
| °′″ | STO/RCL | B bei STO/RCL | `3 SHIFT RCL °′″ AC RCL °′″` | B = 3 | ✅ |
| °′″ | BASE-N | Hex-Ziffer B | `SHIFT 3 x^▫ °′″ =` | 11 (B₁₆) | ✅ |
| hyp | – | hyp: sinh | `hyp sin 1 =` | sinh 1 | ✅ |
| hyp | ALPHA | Variable C | `7 SHIFT RCL hyp AC ALPHA hyp =` | 7 | ✅ |
| hyp | STO/RCL | C bei STO/RCL | `3 SHIFT RCL hyp AC RCL hyp` | C = 3 | ✅ |
| hyp | BASE-N | Hex-Ziffer C | `SHIFT 3 x^▫ hyp =` | 12 (C₁₆) | ✅ |
| sin | – | Sinus (DEG) | `sin 30 =` | 0,5 | ✅ |
| sin | SHIFT | Arkussinus | `SHIFT sin 0,5 =` | 30 | ✅ |
| sin | ALPHA | Variable D | `7 SHIFT RCL sin AC ALPHA sin =` | 7 | ✅ |
| sin | STO/RCL | D bei STO/RCL | `3 SHIFT RCL sin AC RCL sin` | D = 3 | ✅ |
| sin | BASE-N | Hex-Ziffer D | `SHIFT 3 x^▫ sin =` | 13 (D₁₆) | ✅ |
| cos | – | Kosinus (DEG) | `cos 60 =` | 0,5 | ✅ |
| cos | SHIFT | Arkuskosinus | `SHIFT cos 0,5 =` | 60 | ✅ |
| cos | ALPHA | Variable E | `7 SHIFT RCL cos AC ALPHA cos =` | 7 | ✅ |
| cos | STO/RCL | E bei STO/RCL | `3 SHIFT RCL cos AC RCL cos` | E = 3 | ✅ |
| cos | BASE-N | Hex-Ziffer E | `SHIFT 3 x^▫ cos =` | 14 (E₁₆) | ✅ |
| tan | – | Tangens (DEG) | `tan 45 =` | 1 | ✅ |
| tan | SHIFT | Arkustangens | `SHIFT tan 1 =` | 45 | ✅ |
| tan | ALPHA | Variable F | `7 SHIFT RCL tan AC ALPHA tan =` | 7 | ✅ |
| tan | STO/RCL | F bei STO/RCL | `3 SHIFT RCL tan AC RCL tan` | F = 3 | ✅ |
| tan | BASE-N | Hex-Ziffer F | `SHIFT 3 x^▫ tan =` | 15 (F₁₆) | ✅ |
| RCL | – | RCL | `9 SHIFT RCL ) AC RCL )` | X = 9 | ✅ |
| RCL | SHIFT | STO | `9 SHIFT RCL )` | X = 9 gespeichert | ✅ |
| ENG | – | ENG-Notation | `1234 = ENG ENG` | 1234×10⁰ | ✅ |
| ENG | SHIFT | ENG← (Exponent +3) | `1234 = SHIFT ENG SHIFT ENG` | 0,001234×10⁶ | ✅ |
| ( | – | Klammer auf | `2 ( 3 + 4 =` | 14 | ✅ |
| ( | SHIFT | Prozent | `200 × 15 SHIFT ( =` | 30 | ✅ |
| ) | – | Klammer zu | `( 2 + 3 ) × 4 =` | 20 | ✅ |
| ) | SHIFT | Argumenttrenner ; | `ALPHA × 12 SHIFT ) 18 =` | 6 | ✅ |
| ) | ALPHA | Variable X | `7 SHIFT RCL ) AC ALPHA ) =` | 7 | ✅ |
| ) | STO/RCL | X bei STO/RCL | `3 SHIFT RCL ) AC RCL )` | X = 3 | ✅ |
| S⇔D | – | S⇔D | `1 ÷ 3 = S⇔D` | 0,3333333333 | ✅ |
| S⇔D | SHIFT | ab/c ⇔ d/c | `7 ÷ 3 = SHIFT S⇔D` | 2⌟1⌟3 | ✅ |
| S⇔D | ALPHA | Variable Y | `7 SHIFT RCL S⇔D AC ALPHA S⇔D =` | 7 | ✅ |
| S⇔D | STO/RCL | Y bei STO/RCL | `3 SHIFT RCL S⇔D AC RCL S⇔D` | Y = 3 | ✅ |
| M+ | – | M+ | `5 M+ 2 M+` | M = 7 | ✅ |
| M+ | SHIFT | M− | `5 M+ 2 SHIFT M+` | M = 3 | ✅ |
| M+ | ALPHA | Variable M | `7 SHIFT RCL M+ AC ALPHA M+ =` | 7 | ✅ |
| M+ | STO/RCL | M bei STO/RCL | `3 SHIFT RCL M+ AC RCL M+` | M = 3 | ✅ |
| 7 | – | Ziffer 7 | `7 =` | 7 | ✅ |
| 7 | SHIFT | CONST-Menü | `SHIFT 7` | Menü CONST | ✅ |
| 8 | – | Ziffer 8 | `8 =` | 8 | ✅ |
| 8 | SHIFT | CONV-Menü | `SHIFT 8` | Menü CONV | ✅ |
| 8 | ALPHA | Conv-Menü | `ALPHA 8` | Menü CONV | ✅ |
| 9 | – | Ziffer 9 | `9 =` | 9 | ✅ |
| 9 | SHIFT | CLR-Menü | `SHIFT 9` | Menü CLR | ✅ |
| DEL | – | Löschen | `123 DEL` | 12 | ✅ |
| DEL | SHIFT | INS (Überschreiben) | `123 ◀ ◀ SHIFT DEL 9` | 193 | ✅ |
| AC | – | Eingabe löschen | `12 AC` | leeres Display | ✅ |
| AC | SHIFT | Ausschalten OFF | `SHIFT AC` | ausgeschaltet | ✅ |
| 4 | – | Ziffer 4 | `4 =` | 4 | ✅ |
| 5 | – | Ziffer 5 | `5 =` | 5 | ✅ |
| 6 | – | Ziffer 6 | `6 =` | 6 | ✅ |
| 6 | SHIFT | VERIFY | `SHIFT 6` | Hinweis „nicht nachgebildet“ | ✅ |
| × | – | Multiplikation | `6 × 7 =` | 42 | ✅ |
| × | SHIFT | Permutationen nPr | `5 SHIFT × 2 =` | 20 | ✅ |
| × | ALPHA | ggT | `ALPHA × 12 SHIFT ) 18 =` | 6 | ✅ |
| ÷ | – | Division | `10 ÷ 4 =` | 2,5 | ✅ |
| ÷ | SHIFT | Kombinationen nCr | `5 SHIFT ÷ 2 =` | 10 | ✅ |
| ÷ | ALPHA | kgV | `ALPHA ÷ 4 SHIFT ) 6 =` | 12 | ✅ |
| 1 | – | Ziffer 1 | `1 =` | 1 | ✅ |
| 1 | SHIFT | STAT/DIST: wechselt in STAT | `SHIFT 1` | Modus STAT | ✅ |
| 2 | – | Ziffer 2 | `2 =` | 2 | ✅ |
| 3 | – | Ziffer 3 | `3 =` | 3 | ✅ |
| 3 | SHIFT | BASE-N ein/aus | `SHIFT 3` | Modus BASE-N, zweiter Druck zurück zu COMP | ✅ |
| + | – | Addition | `2 + 3 =` | 5 | ✅ |
| + | SHIFT | Polarkoordinaten Pol | `SHIFT + 1 SHIFT ) 1 =` | r=1,414213562, θ=45 | ✅ |
| + | ALPHA | Int (ganzzahliger Teil) | `ALPHA + (−) 2,5 =` | -2 | ✅ |
| − | – | Subtraktion | `5 − 7 =` | -2 | ✅ |
| − | SHIFT | Rechtwinklige Koordinaten Rec | `SHIFT − 2 SHIFT ) 90 =` | x=0, y=2 | ✅ |
| − | ALPHA | Intg (größte ganze Zahl ≤ x) | `ALPHA − (−) 2,5 =` | -3 | ✅ |
| 0 | – | Ziffer 0 | `0 =` | 0 | ✅ |
| 0 | SHIFT | Rnd (auf Anzeige runden, Fix 2) | `SHIFT MODE 6 2 SHIFT 0 2 ÷ 3 =` | 0,67 | ✅ |
| , | – | Dezimalkomma | `1,5 × 2 =` | 3 | ✅ |
| , | SHIFT | Zufallszahl Ran# | `SHIFT , =` | 0,123 (Zufall 0,12345) | ✅ |
| , | ALPHA | Zufalls-Ganzzahl RanInt | `ALPHA , 1 SHIFT ) 6 =` | 6 (Zufall 0,999) | ✅ |
| ×10ˣ | – | ×10ˣ | `1 ×10ˣ 3 =` | 1000 | ✅ |
| ×10ˣ | SHIFT | π | `SHIFT ×10ˣ =` | π | ✅ |
| ×10ˣ | ALPHA | Eulersche Zahl e | `ALPHA ×10ˣ =` | e | ✅ |
| Ans | – | Ans | `5 = AC Ans × 2 =` | 10 | ✅ |
| Ans | SHIFT | DRG▸-Menü | `SHIFT Ans` | Menü DRG▸ | ✅ |
| = | – | Ergebnis | `1 + 2 =` | 3 | ✅ |
| = | SHIFT | ≈ Dezimalergebnis | `1 ÷ 4 SHIFT =` | 0,25 als Dezimalzahl | ✅ |

## Kombinationen und Fehlerfälle (12)

| Fall | Funktion | Tastenfolge | Erwartet |  |
| --- | --- | --- | --- | --- |
| hyp cos | cosh | `hyp cos 1 =` | cosh 1 | ✅ |
| hyp tan | tanh | `hyp tan 1 =` | tanh 1 | ✅ |
| hyp SHIFT sin | sinh⁻¹ | `hyp SHIFT sin 1 =` | arsinh 1 | ✅ |
| hyp SHIFT cos | cosh⁻¹ | `hyp SHIFT cos 2 =` | arcosh 2 | ✅ |
| hyp SHIFT tan | tanh⁻¹ | `hyp SHIFT tan 0,5 =` | artanh 0,5 | ✅ |
| °′″ nach Ergebnis | Anzeige in Grad-Minuten-Sekunden | `30,5 = °′″` | 30°30′0″ | ✅ |
| √ negativ | Wurzel aus negativer Zahl | `√▫ (−) 4 =` | Math ERROR | ✅ |
| ln negativ | Logarithmus einer negativen Zahl | `ln (−) 1 =` | Math ERROR | ✅ |
| log₁ | Logarithmus zur Basis 1 | `log▫▫ 1 ▶ 8 =` | Math ERROR | ✅ |
| 0÷0 | Division 0 durch 0 | `0 ÷ 0 =` | Math ERROR | ✅ |
| cosh⁻¹ < 1 | Definitionsbereich arcosh | `hyp SHIFT cos 0 =` | Math ERROR | ✅ |
| x! ganzzahlig | x! nur für ganze Zahlen | `2,5 SHIFT x⁻¹ =` | Math ERROR | ✅ |

## Vorlagen im Linear-Modus (13)

Alle Folgen beginnen mit `SHIFT MODE 2` (SETUP → Linear).

| Fall | Funktion | Tastenfolge | Erwartet |  |
| --- | --- | --- | --- | --- |
| abs.p.lin | Abs( | `SHIFT MODE 2 Abs (−) 5 ) =` | 5 | ✅ |
| cube.p.lin | ³ | `SHIFT MODE 2 3 x³ =` | 27 | ✅ |
| inv.p.lin | ⁻¹ | `SHIFT MODE 2 4 x⁻¹ =` | 0,25 | ✅ |
| logab.p.lin | logₐ( | `SHIFT MODE 2 log▫▫ 2 SHIFT ) 8 ) =` | 3 | ✅ |
| frac.s.lin | a⌟b⌟c | `SHIFT MODE 2 2 SHIFT ▭/▭ 1 SHIFT ▭/▭ 2 =` | 2,5 | ✅ |
| sqrt.p.lin | √( | `SHIFT MODE 2 √▫ 16 ) =` | 4 | ✅ |
| sqrt.s.lin | ³√( | `SHIFT MODE 2 SHIFT √▫ 27 ) =` | 3 | ✅ |
| sq.p.lin | ² | `SHIFT MODE 2 3 x² =` | 9 | ✅ |
| pow.p.lin | ^( | `SHIFT MODE 2 2 x^▫ 10 ) =` | 1024 | ✅ |
| pow.s.lin | ˣ√( | `SHIFT MODE 2 SHIFT x^▫ 3 SHIFT ) 8 ) =` | 2 | ✅ |
| log.s.lin | 10^( | `SHIFT MODE 2 SHIFT log 2 ) =` | 100 | ✅ |
| ln.s.lin | ℯ^( | `SHIFT MODE 2 SHIFT ln 0 ) =` | 1 | ✅ |
| frac.p.lin | ⌟ | `SHIFT MODE 2 1 ▭/▭ 4 =` | 0,25 | ✅ |

## Menüs (52)

STAT-Fälle verwenden die Daten 2, 4, 4, 4, 5, 5, 7, 9 (eingegeben mit `MODE 2` und je Wert `M+`). In der Tabelle ist das als „…“ abgekürzt.

| Fall | Funktion | Tastenfolge | Erwartet |  |
| --- | --- | --- | --- | --- |
| MODE › COMP | Normalrechnen | `MODE 2 MODE 1` | Modus COMP | ✅ |
| MODE › STAT | Statistik | `MODE 2` | Modus STAT | ✅ |
| MODE › TABLE | Wertetabelle f(X) = X², 1…3 | `MODE 3 ALPHA ) x² = 1 = 3 = 1 =` | (1\|1) (2\|4) (3\|9) | ✅ |
| MODE › BASE-N | Zahlensysteme | `MODE 4` | Modus BASE-N | ✅ |
| SETUP › Mth2D | Lehrbuch-Ein-/Ausgabe | `SHIFT MODE 2 SHIFT MODE 1` | Mth2D | ✅ |
| SETUP › Linear | Lineare Ein-/Ausgabe | `SHIFT MODE 2` | Linear | ✅ |
| SETUP › Deg | Altgrad | `SHIFT MODE 4 SHIFT MODE 3` | DEG | ✅ |
| SETUP › Rad | Bogenmaß | `SHIFT MODE 4 sin SHIFT ×10ˣ ÷ 2 =` | RAD, sin(π/2) = 1 | ✅ |
| SETUP › Gra | Neugrad | `SHIFT MODE 5 sin 100 =` | GRA, sin 100 = 1 | ✅ |
| SETUP › Fix | Feste Nachkommastellen | `SHIFT MODE 6 2` | Fix 2 | ✅ |
| SETUP › Sci | Wissenschaftliche Notation | `SHIFT MODE 7 3` | Sci 3 | ✅ |
| SETUP › Norm | Normaldarstellung | `SHIFT MODE 6 2 SHIFT MODE 8 2` | Norm 2 | ✅ |
| SETUP › ab/c | Ausgabe gemischter Bruch | `SHIFT MODE ▼ 1` | ab/c | ✅ |
| SETUP › d/c | Ausgabe unechter Bruch | `SHIFT MODE ▼ 1 SHIFT MODE ▼ 2` | d/c | ✅ |
| SETUP › STAT | Häufigkeitsspalte | `SHIFT MODE ▼ 3 1` | Häufigkeit EIN | ✅ |
| SETUP › PerD | Periodische Dezimalzahlen | `SHIFT MODE ▼ 4 1` | PerD EIN | ✅ |
| SETUP › AbAut | Abschaltautomatik | `SHIFT MODE ▼ 5 2` | 60 Minuten | ✅ |
| SETUP › ◀KNTR▶ | Kontrast | `SHIFT MODE ▼ 6 ▶ ▶ ◀ =` | Kontrast 6 | ✅ |
| SETUP › Vibr | Vibration (nur PWA) | `SHIFT MODE ▼ 7 2` | Vibration AUS | ✅ |
| CLR › Setup | Einstellungen zurücksetzen | `SHIFT MODE 4 SHIFT 9 1 =` | wieder DEG | ✅ |
| CLR › Speicher | Variablen löschen | `5 SHIFT RCL (−) SHIFT 9 2 =` | A = 0 | ✅ |
| CLR › Alle | Alles zurücksetzen | `5 SHIFT RCL (−) SHIFT MODE 4 SHIFT 9 3 =` | A = 0 und DEG | ✅ |
| CONST › c Lichtgeschw. | Konstante | `SHIFT 7 1 =` | 299792458 | ✅ |
| CONST › h Planck | Konstante | `SHIFT 7 2 =` | 6,62607015×10^-34 | ✅ |
| CONST › k Boltzmann | Konstante | `SHIFT 7 3 =` | 1,380649×10^-23 | ✅ |
| CONST › Nᴀ Avogadro | Konstante | `SHIFT 7 4 =` | 6,02214076×10^23 | ✅ |
| CONST › G Gravitation | Konstante | `SHIFT 7 5 =` | 6,6743×10^-11 | ✅ |
| CONST › g Fallbeschl. | Konstante | `SHIFT 7 6 =` | 9,80665 | ✅ |
| CONST › e Elementarladung | Konstante | `SHIFT 7 7 =` | 1,602176634×10^-19 | ✅ |
| CONST › mₑ Elektronenmasse | Konstante | `SHIFT 7 8 =` | 9,109383702×10^-31 | ✅ |
| CONST › R Gaskonstante | Konstante | `SHIFT 7 ▼ 1 =` | 8,314462618 | ✅ |
| CONV › cm▸in | Umrechnung | `2,54 SHIFT 8 1` | 1 | ✅ |
| CONV › in▸cm | Umrechnung | `1 SHIFT 8 2` | 2,54 | ✅ |
| CONV › km▸mile | Umrechnung | `1,609344 SHIFT 8 3` | 1 | ✅ |
| CONV › mile▸km | Umrechnung | `1 SHIFT 8 4` | 1,609344 | ✅ |
| CONV › kg▸lb | Umrechnung | `0,45359237 SHIFT 8 5` | 1 | ✅ |
| CONV › lb▸kg | Umrechnung | `1 SHIFT 8 6` | 0,45359237 | ✅ |
| CONV › °C▸°F | Umrechnung | `100 SHIFT 8 7` | 212 | ✅ |
| CONV › °F▸°C | Umrechnung | `212 SHIFT 8 8` | 100 | ✅ |
| CONV › km/h▸m/s | Umrechnung | `36 SHIFT 8 ▼ 1` | 10 | ✅ |
| DRG▸ › ° | Eingabe in Grad | `SHIFT MODE 4 sin 90 SHIFT Ans 1 =` | RAD: sin 90° = 1 | ✅ |
| DRG▸ › ʳ | Eingabe im Bogenmaß | `SHIFT ×10ˣ SHIFT Ans 2 =` | DEG: πʳ = 180 | ✅ |
| DRG▸ › ᵍ | Eingabe in Neugrad | `100 SHIFT Ans 3 =` | DEG: 100ᵍ = 90 | ✅ |
| STAT › n | Daten 2, 4, 4, 4, 5, 5, 7, 9 | `… SHIFT 1 1 =` | 8 | ✅ |
| STAT › x̄ | Daten 2, 4, 4, 4, 5, 5, 7, 9 | `… SHIFT 1 2 =` | 5 | ✅ |
| STAT › σx | Daten 2, 4, 4, 4, 5, 5, 7, 9 | `… SHIFT 1 3 =` | 2 | ✅ |
| STAT › sx | Daten 2, 4, 4, 4, 5, 5, 7, 9 | `… SHIFT 1 4 =` | 2,138089935 | ✅ |
| STAT › Σx | Daten 2, 4, 4, 4, 5, 5, 7, 9 | `… SHIFT 1 5 =` | 40 | ✅ |
| STAT › Σx² | Daten 2, 4, 4, 4, 5, 5, 7, 9 | `… SHIFT 1 6 =` | 232 | ✅ |
| STAT › minX | Daten 2, 4, 4, 4, 5, 5, 7, 9 | `… SHIFT 1 7 =` | 2 | ✅ |
| STAT › maxX | Daten 2, 4, 4, 4, 5, 5, 7, 9 | `… SHIFT 1 8 =` | 9 | ✅ |
| STAT › Daten löschen | Statistikdaten löschen | `… SHIFT 1 ▼ 1` | keine Daten | ✅ |
