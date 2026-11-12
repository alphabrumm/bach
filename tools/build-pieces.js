// Erzeugt pieces/*.json aus tools/ly/*.ly
const fs = require('fs'), path = require('path');
const { buildPiece } = require('./lily.js');
const KEYS = ['C-Dur', 'c-Moll', 'D-Dur', 'd-Moll', 'Es-Dur', 'E-Dur', 'e-Moll', 'F-Dur', 'f-Moll', 'G-Dur', 'g-Moll', 'A-Dur', 'a-Moll', 'B-Dur', 'h-Moll'];
const out = path.join(__dirname, '..', 'pieces'); fs.mkdirSync(out, { recursive: true });
const catalog = [];
function addPiece(file, meta, keyName) {
  const { piece, problems } = buildPiece(fs.readFileSync(file, 'utf8'), meta);
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
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(catalog));
console.log('Stücke:', catalog.filter(c => c.available).length);
