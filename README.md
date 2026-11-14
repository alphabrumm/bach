# Bach · Notenbücher

Eine iPad-taugliche Web-App, um in Klavierstücke von J. S. Bach einzutauchen: Notenbücher im Leinen-Look, Notenblätter als echte Daten (antippen, scrubben, Harmonik, Stimmen).

**Inhalt:** alle 15 Inventionen (BWV 772–786) und 15 Sinfonien (BWV 787–801), WTK I Fuge 1 (BWV 846), Goldberg-Variationen Aria, Variatio 1 und 2 (BWV 988)

- Noten und Takte antippen → Infokarte (Tonname, Stimme, Harmonie, Rolle im Akkord)
- Mit dem Finger waagrecht über die Noten wischen → Scrubbing; Finger ruhen lassen → Zusammenklang
- Stimmen bzw. Hände farbig, einzelne Stimmen stummschalten
- Harmonik im Notenbild (automatische Schätzung je punktierter Viertel, Stufentheorie)
- Geister-Vorzeichen: takt-gültige Vorzeichen, die nicht noch einmal dastehen
- Wiedergabe mit Tempo und Takt-Schleife; Konzertflügel (Samples), Flügel/Cembalo synthetisch

## Aufbau

- `index.html` – fertige App (wird gebaut, nicht von Hand bearbeiten)
- `pieces/` – ein JSON pro Stück + `index.json` (Katalog), wird aus `tools/ly/` erzeugt
- `src/` – Vorlage, Analyse & Notensatz-Daten (`analysis.js`) und App-Logik (`app.js`)
- `tools/ly/` – LilyPond-Quellen (Mutopia), `tools/lily.js` – Parser, prüft, dass jede Stimme Takt für Takt aufgeht

```
node tools/build-pieces.js   # tools/ly/*.ly -> pieces/*.json
node tools/build.js          # src/ -> index.html
```

## Quellen & Lizenzen

- Notentexte: [Mutopia Project](https://www.mutopiaproject.org) – Inventionen (BWV 772–786) unter CC BY-SA 3.0 (u. a. jeff covey, Urs Metzger), Sinfonien (BWV 787–801) gesetzt von Olivier Vermersch (Sinfonia 2: Public Domain). Lizenzangaben je Stück siehe Kopfzeile in `tools/ly/`.
- Wohltemperiertes Klavier I: Mutopia Project (u. a. Davide Castellone, Stelios Samelis, Sven Reichard, Itay Perl, Andrew Hawryluk, Urs Metzger, Heikki Junes; Public Domain bzw. CC BY-SA 4.0) und für Nr. 7, 9 (Präludium und Fuge), 13, 14, 18, 19, 21, 22, 23: Knute Snortum, github.com/ksnortum/bach-well-tempered-1, CC BY-SA 4.0. Lizenz je Stück in der Kopfzeile in `tools/ly/`.
- Goldberg-Variationen: Mutopia Project, CC BY-SA 3.0 – Aria, Var. 1–2 JD Erickson; Var. 18 Benjamin D. Esham; übrige Variationen Hajo Dezelski (Quelle: Bach-Gesellschaft).
- Offline-Dateien: Flügel-Samples „Salamander Grand Piano V2“ (Alexander Holm, CC BY 3.0, über Tone.js); Notensatz Verovio (RISM Digital, LGPL-3.0) in `lib/`; Schrift EB Garamond (SIL OFL) in `fonts/`.
- Schlüssel-Symbole im Analyse-Fenster: Glyphen aus GNU FreeFont (FreeSerif), GPLv3 mit Font-Ausnahme.
- WTK I Fuge 1: Mutopia, Andreas Scherer, Public Domain. Goldberg-Variationen: Mutopia, JD Erickson, CC BY-SA 3.0.
- Anpassungen: Bei Wiederholungen mit 1./2. Klammer (Variatio 2) wird nur die 2. Klammer dargestellt. Sinfonia 15 – Schlussnote auf die 9/16-Taktlänge gebracht.
- Notensatz: [Verovio](https://www.verovio.org) (LGPL), zur Laufzeit geladen
- Flügel-Samples: Salamander Grand Piano von Alexander Holm, CC-BY 3.0 (standardmäßig über tonejs.github.io geladen; Quelle in „Ansicht“ änderbar)
