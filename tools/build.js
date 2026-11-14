// Baut index.html aus src/ (Daten + Analyse + App in eine Datei)
const fs = require('fs'), path = require('path');
const R = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const analysis = R('src/analysis.js').replace(/if \(typeof module[\s\S]*$/, '');
let html = R('src/template.html');
html = html.replace('/*ANALYSIS*/', () => analysis).replace('/*APP*/', () => R('src/app.js'));
fs.writeFileSync(path.join(__dirname, '..', 'index.html'), html);
console.log('index.html', (html.length / 1024).toFixed(0), 'KB');

// ---------- Service Worker für den Offline-Betrieb ----------
// Alle Dateien der App (Stücke, Werkinfos, Flügel-Samples, Notensatz, Schrift, Symbole) werden beim ersten Besuch gespeichert.
const crypto = require('crypto');
const root = path.join(__dirname, '..');
const walk = d => fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = ['index.html', 'manifest.webmanifest']
  .concat(walk('pieces'), walk('samples'), walk('lib'), walk('fonts'), walk('icons'))
  .filter(f => !/\.(txt|md)$/.test(f) && !f.endsWith('.DS_Store'))
  .map(f => f.split(path.sep).join('/'));
const hash = crypto.createHash('sha1');
files.forEach(f => hash.update(f).update(fs.readFileSync(path.join(root, f))));
const version = hash.digest('hex').slice(0, 10);
const sw = R('src/sw.js').replace('/*VERSION*/', version).replace('/*FILES*/', JSON.stringify(files));
fs.writeFileSync(path.join(root, 'sw.js'), sw);
console.log('sw.js', files.length, 'Dateien, Version', version);
