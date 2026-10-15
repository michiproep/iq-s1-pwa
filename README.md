# IQ-S1 PWA – unabhängige Nachbildung

Eigenständiger, **nicht offizieller** wissenschaftlicher Rechner als PWA. Die Optik ist einem Gerätefoto nachgebaut: Gehäuse, Solarzelle, Display, Steuerkreuz und alle Tasten mit SHIFT- (grün) und ALPHA-Beschriftung (orange) an den gemessenen Positionen. Keine Original-Firmware; für Prüfungen bitte das zugelassene Originalgerät verwenden.

🔗 **Live:** https://michiproep.github.io/iq-s1-pwa/ (installierbar, offlinefähig)

📖 **[Bedienungsanleitung](ANLEITUNG.md)**: alle Tasten, Menüs, Modi und Beispiele.

## Start

Voraussetzung: Node.js 18 oder neuer (empfohlen 24, wie im Deployment).

```bash
npm install
npm run dev          # Entwicklungsserver auf http://localhost:5173
npm run build        # Produktionsbuild nach dist/ (PWA, offlinefähig)
npm run preview      # Produktionsbuild lokal ansehen (http://localhost:4173)
```

Installierbar ist die PWA über HTTPS oder `localhost`. Der Service Worker speichert alle Ressourcen inklusive Schriften für den Offlinebetrieb.

**Deployment:** Jeder Push auf `main` startet den Workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml). Er führt die Unit-Tests aus, baut mit `BASE_PATH=/<repo-name>/`, veröffentlicht auf GitHub Pages und prüft die Live-Seite danach mit dem Smoke-Test. Lokal entspricht das `BASE_PATH=/iq-s1-pwa/ npm run build`. Unter Git Bash auf Windows muss `MSYS_NO_PATHCONV=1` davorstehen, sonst wird der Pfad umgewandelt.

## Tests

```bash
npm test                                         # 327 Unit-Tests: Funktionskatalog, Rechenkern, Tastenfolgen, Vorlagen, SETUP, exakte Formen
npm test -- -u                                   # zusätzlich docs/TESTABDECKUNG.md neu erzeugen
npm run test:e2e -- http://localhost:5173/       # Tippt Tasten per Touch im Browser und prüft die Anzeige
npm run test:visual -- http://localhost:5173/    # Pixelvergleich mit dem Referenzfoto
npm run test:smoke                               # Smoke-Test gegen die Live-Seite auf GitHub Pages
```

🧪 **[Testabdeckung der Rechenfunktionen](docs/TESTABDECKUNG.md)**: Jede Tastenbelegung (primär, SHIFT, ALPHA, STO/RCL, BASE-N), jeder Menüeintrag und jede Vorlage mit Tastenfolge, erwartetem Ergebnis und Status. Der Funktionskatalog [`src/funktionen.test.ts`](src/funktionen.test.ts) prüft automatisch, dass keine Taste, kein Menüeintrag und kein Token des Rechenkerns ohne Testfall bleibt. Die Datei wird aus dem Katalog erzeugt, `npm test` schlägt fehl, wenn sie veraltet ist. Bekannte Fehler sind dort mit ihrem Issue verlinkt.

- `test:smoke` prüft die Live-Seite (ohne Argument https://michiproep.github.io/iq-s1-pwa/): Sie lädt ohne Fehler in Konsole und Netzwerk, alle Tasten sind da, der Rechner rechnet, Manifest und Service Worker sind aktiv und die Menü-Links erreichbar. Der Workflow führt ihn nach jedem Deployment aus. Vorher wartet er, bis die Live-Seite genau den gerade gebauten Stand ausliefert (Hash der `index.html` in `EXPECT_INDEX_SHA256`).
- `test:e2e` läuft standardmäßig in Chromium. Mit `BROWSER=webkit` nutzt er die Safari-Engine, gesucht wird sie über `WEBKIT_PATH` oder in `ext/webkit-win64/` (nicht im Repository). Echte iOS-Touch-Verarbeitung bildet WebKit unter Windows allerdings nicht ab; ein Test auf dem iPhone bleibt maßgeblich.
- `test:e2e` und `test:visual` brauchen einen laufenden Server (`npm run dev` oder `npm run preview`) und ein installiertes Chrome oder Edge. Ein anderer Browserpfad lässt sich über die Umgebungsvariable `CHROME_PATH` angeben. Ohne URL-Argument wird `http://localhost:5173/` verwendet.
- `test:visual` vergleicht mit dem Referenzfoto `doc/images/fa1baf658f2e03a563050fc49235c4866037454d189e0366a039a9835fbcdd61.png`. Das Foto ist **nicht im Repository enthalten**, weil die Bildrechte ungeklärt sind. Fehlt es, wird der Test übersprungen. Den Display-Inhalt blendet er aus, weil das Foto ein leeres Display zeigt. Die Ergebnisse landen in `test-results/` (`side-by-side.png`, `diff.png`, `screenshot.png`). Der Test schlägt fehl, wenn mehr als 6 % der Pixel abweichen (änderbar mit `VISUAL_LIMIT`). Aktuell sind es etwa 4,9 %, fast ausschließlich Schriftglättung (Webfont gegenüber Foto) und der neutrale Schriftzug „IQ-S1“ statt des Herstellernamens.

## Projektstruktur

| Datei | Inhalt |
|---|---|
| `src/engine.ts` | Rechenkern: Tokens, Auswertung (mathjs), Zahlenformat, Brüche, BASE-N, Konstanten, Umrechnungen |
| `src/calc.ts` | Zustandsmaschine des Rechners: Tastenbelegung, Menüs, Modi, Verlauf, Speicher |
| `src/keys.tsx` | Geometrie und Beschriftung aller Tasten (Koordinaten des 478 × 929 px großen Fotos) |
| `src/natural.tsx` | Lehrbuch-Darstellung: Brüche, Wurzeln, Exponenten, exakte Ergebnisse |
| `src/main.tsx` | Darstellung: Gehäuse, Display, Steuerkreuz, Skalierung, PC-Tastatur |
| `src/style.css` | Farben und Formen |
| `src/*.test.ts` | Unit-Tests; `funktionen.test.ts` ist der Funktionskatalog |
| `docs/TESTABDECKUNG.md` | aus dem Funktionskatalog erzeugte Testübersicht |
| `scripts/` | Browser- und Pixeltests |

## Funktionsumfang (Kurzfassung)

Lehrbuch-Eingabe und -Ausgabe (gestapelte Brüche, Wurzeln, Exponenten, exakte Ergebnisse wie 17√2⁄12 oder (√6+√2)⁄4), Grundrechenarten, Potenzen, Wurzeln, Logarithmen, Trigonometrie inkl. hyperbolisch, Brüche, Grad-Minuten-Sekunden, Pol/Rec, nPr/nCr, ggT/kgV, Int/Intg, Zufallszahlen, Primfaktorzerlegung, ENG-Notation, Variablen A–F/X/Y/M mit STO/RCL/M±, Verlauf (REPLAY), Modi COMP, STAT, TABLE und BASE-N, SETUP wie am Gerät (Mth2D/Linear, Deg/Rad/Gra, Fix/Sci/Norm, ab/c oder d/c, Häufigkeit, periodische Dezimalzahlen, Abschaltautomatik, Kontrast), Konstanten, Umrechnungen und PC-Tastatur. Details in der [Bedienungsanleitung](ANLEITUNG.md).

## Einschränkungen

Die Lehrbuch-Darstellung nutzt eine normale Schrift statt der LCD-Pixelschrift. Exakte Ergebnisse gibt es für Brüche, Wurzelterme, π-Vielfache und Summen mit höchstens zwei Wurzeltermen. VERIFY, Verteilungen und Regression sind nicht nachgebildet. Es gibt 9 Konstanten und 9 Umrechnungen. Speicherinhalte werden nicht dauerhaft gespeichert. Die Ergebnisse sind nicht gegen das Originalgerät geprüft.

## Quellen

- https://www.taschenrechner.de/shop/artikel/details/IQ-S1
- https://tiplanet.org/forum/archives_voir.php?id=5096568

Genannte Marken gehören dem jeweiligen Markeninhaber. Es besteht keine Verbindung zum Hersteller.
