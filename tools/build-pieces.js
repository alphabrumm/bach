// Erzeugt pieces/*.json aus tools/ly/*.ly
const fs = require('fs'), path = require('path');
const { buildPiece } = require('./lily.js');
const KEYS = ['C-Dur', 'c-Moll', 'D-Dur', 'd-Moll', 'Es-Dur', 'E-Dur', 'e-Moll', 'F-Dur', 'f-Moll', 'G-Dur', 'g-Moll', 'A-Dur', 'a-Moll', 'B-Dur', 'h-Moll'];
const out = path.join(__dirname, '..', 'pieces'); fs.mkdirSync(out, { recursive: true });
const catalog = [];
function addPiece(file, meta, keyName, opts) {
  const { piece, problems } = buildPiece(fs.readFileSync(file, 'utf8'), meta, opts);
  piece.key.mode = keyName.endsWith('Moll') ? 'minor' : 'major';
  fs.writeFileSync(path.join(out, `${meta.id}.json`), JSON.stringify(piece));
  catalog.push(Object.assign({ available: true, measures: piece.measures, time: piece.time }, meta));
  if (problems.filter(p => !p.startsWith('Hinweis')).length) console.log(meta.id, problems.join('; '));
}
for (let bwv = 772; bwv <= 801; bwv++) {
  const f = path.join(__dirname, 'ly', `bwv${bwv}.ly`);
  const inv = bwv <= 786, num = inv ? bwv - 771 : bwv - 786;
  const meta = { book: 'inv', id: `bwv${bwv}`, bwv, kind: inv ? 'Inventio' : 'Sinfonia', num, title: `${inv ? 'Inventio' : 'Sinfonia'} ${num}`, keyName: KEYS[num - 1],
    voicesLabel: inv ? '2 Stimmen' : '3 Stimmen', license: inv ? 'Mutopia Project, CC BY-SA 3.0' : 'Mutopia Project (Olivier Vermersch)' };
  if (!fs.existsSync(f)) { catalog.push(Object.assign({ available: false }, meta)); continue; }
  const { piece, problems } = buildPiece(fs.readFileSync(f, 'utf8'), meta);
  if (KEYS[num - 1].endsWith('Moll')) piece.key.mode = 'minor'; else piece.key.mode = 'major';
  fs.writeFileSync(path.join(out, `${meta.id}.json`), JSON.stringify(piece));
  catalog.push(Object.assign({ available: true, measures: piece.measures, time: piece.time }, meta));
  if (problems.filter(p => !p.startsWith('Hinweis')).length) console.log(meta.id, problems.join('; '));
}
// Wohltemperiertes Klavier I
const WTK_KEYS = ['C-Dur', 'c-Moll', 'Cis-Dur', 'cis-Moll', 'D-Dur', 'd-Moll', 'Es-Dur', 'es-Moll', 'E-Dur', 'e-Moll', 'F-Dur', 'f-Moll',
  'Fis-Dur', 'fis-Moll', 'G-Dur', 'g-Moll', 'As-Dur', 'gis-Moll', 'A-Dur', 'a-Moll', 'B-Dur', 'b-Moll', 'H-Dur', 'h-Moll'];
for (let i = 0; i < 24; i++) for (const kind of ['Praeludium', 'Fuga']) {
  const bwv = 846 + i, id = `bwv${bwv}${kind === 'Fuga' ? 'f' : 'p'}`;
  const meta = { book: 'wtk1', id, bwv, kind, num: i + 1, title: `${kind === 'Fuga' ? 'Fuge' : 'Präludium'} ${i + 1}`, keyName: WTK_KEYS[i],
    license: 'Mutopia Project' };
  const f = path.join(__dirname, 'ly', id + '.ly');
  if (fs.existsSync(f)) {
    const src = fs.readFileSync(f, 'utf8');
    const voices = (src.match(/\\new Voice/g) || []).length;
    meta.voicesLabel = kind === 'Fuga' ? `${voices || 4}-stimmige Fuge` : '';
    addPiece(f, meta, WTK_KEYS[i]);
  } else catalog.push(Object.assign({ available: false }, meta));
}
// Goldberg-Variationen
const GOLD_LABEL = { 3: 'Canone all’Unisono', 6: 'Canone alla Seconda', 9: 'Canone alla Terza', 10: 'Fughetta', 12: 'Canone alla Quarta',
  15: 'Canone alla Quinta · Andante', 18: 'Canone alla Sesta', 21: 'Canone alla Settima', 24: 'Canone all’Ottava', 25: 'Adagio',
  27: 'Canone alla Nona', 30: 'Quodlibet' };
const GOLD = [{ id: 'bwv988a', title: 'Aria', num: 0 }];
for (let i = 1; i <= 30; i++) {
  if (i === 16) {   // Ouverture wechselt die Taktart (2/2 → 3/8): zwei Stücke
    GOLD.push({ id: 'bwv988v16a', file: 'bwv988v16', title: 'Variatio 16 · Ouverture', num: 16, label: 'Ouverture (Grave)', opts: { alt: 'first', to: 16 * 96 } });
    GOLD.push({ id: 'bwv988v16b', file: 'bwv988v16', title: 'Variatio 16 · Fughetta', num: 16.5, label: 'Ouverture (Fughetta)', opts: { from: 15 * 96, time: { num: 3, den: 8 }, clipLast: 31 * 36 } });
    continue;
  }
  GOLD.push({ id: `bwv988v${i}`, title: `Variatio ${i}`, num: i, label: GOLD_LABEL[i], opts: i === 26 ? { time: { num: 3, den: 4 } } : undefined });
}
GOLD.push({ id: 'bwv988da', title: 'Aria da capo', num: 31 });
const MINOR = [15, 21, 25];
for (const g of GOLD) {
  const keyName = MINOR.includes(g.num) ? 'g-Moll' : 'G-Dur';
  const f = path.join(__dirname, 'ly', (g.file || g.id) + '.ly');
  const head = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n')[0] : '';
  const who = (/Mutopia(?: Project)?,? \(?([^),]+)\)?,/.exec(head) || [])[1] || 'JD Erickson';
  const meta = { book: 'gold', id: g.id, bwv: 988, kind: g.num === 0 || g.num === 31 ? 'Aria' : 'Variatio', num: g.num, title: g.title, keyName,
    voicesLabel: g.label || 'Goldberg-Variationen', license: `Mutopia Project (${who}), CC BY-SA 3.0` };
  if (fs.existsSync(f)) addPiece(f, meta, keyName, g.opts); else catalog.push(Object.assign({ available: false }, meta));
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(catalog));
console.log('Stücke:', catalog.filter(c => c.available).length);
