// Baut index.html aus src/ (Daten + Analyse + App in eine Datei)
const fs = require('fs'), path = require('path');
const R = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const data = JSON.stringify(require('./notes.json').map(v => v.map(e => {
  const o = {}; for (const k of Object.keys(e)) if (e[k] !== false && e[k] !== undefined) o[k] = e[k]; return o;
})));
const analysis = R('src/analysis.js').replace(/if \(typeof module[\s\S]*$/, '');
let html = R('src/template.html');
html = html.replace('/*DATA*/', () => data).replace('/*ANALYSIS*/', () => analysis).replace('/*APP*/', () => R('src/app.js'));
fs.writeFileSync(path.join(__dirname, '..', 'index.html'), html);
console.log('index.html', (html.length / 1024).toFixed(0), 'KB');
