# Bach · Notenbücher

Eine iPad-taugliche Web-App, um in Klavierstücke von J. S. Bach einzutauchen: Notenbücher im Leinen-Look, Notenblätter als echte Daten (antippen, scrubben, Harmonik, Stimmen).

**Prototyp 1:** Sinfonia 2 c-Moll, BWV 788

- Noten und Takte antippen → Infokarte (Tonname, Stimme, Harmonie, Rolle im Akkord)
- Mit dem Finger waagrecht über die Noten wischen → Scrubbing; Finger ruhen lassen → Zusammenklang
- Stimmen bzw. Hände farbig, einzelne Stimmen stummschalten
- Harmonik im Notenbild (automatische Schätzung je punktierter Viertel, Stufentheorie)
- Geister-Vorzeichen: takt-gültige Vorzeichen, die nicht noch einmal dastehen
- Wiedergabe mit Tempo und Takt-Schleife; Konzertflügel (Samples), Flügel/Cembalo synthetisch

## Aufbau

- `index.html` – fertige App (wird gebaut, nicht von Hand bearbeiten)
- `src/` – Vorlage, Analyse (`analysis.js`) und App-Logik (`app.js`)
- `tools/` – LilyPond-Quelle, Parser (`parse.js` → `notes.json`) und `build.js`

```
node tools/parse.js   # bwv788.ly -> notes.json
node tools/build.js   # src/ + notes.json -> index.html
```

## Quellen & Lizenzen

- Notentext: Mutopia Project, Mutopia-2008/06/15-140, gesetzt von Olivier Vermersch – Public Domain
- Notensatz: [Verovio](https://www.verovio.org) (LGPL), zur Laufzeit geladen
- Flügel-Samples: Salamander Grand Piano von Alexander Holm, CC-BY 3.0 (standardmäßig über tonejs.github.io geladen; Quelle in „Ansicht“ änderbar)
