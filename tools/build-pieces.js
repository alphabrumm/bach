// Erzeugt pieces/*.json aus tools/ly/*.ly
const fs = require('fs'), path = require('path');
const { buildPiece } = require('./lily.js');
const KEYS = ['C-Dur', 'c-Moll', 'D-Dur', 'd-Moll', 'Es-Dur', 'E-Dur', 'e-Moll', 'F-Dur', 'f-Moll', 'G-Dur', 'g-Moll', 'A-Dur', 'a-Moll', 'B-Dur', 'h-Moll'];
const out = path.join(__dirname, '..', 'pieces'); fs.mkdirSync(out, { recursive: true });
const catalog = [];
for (let bwv = 772; bwv <= 801; bwv++) {
  const f = path.join(__dirname, 'ly', `bwv${bwv}.ly`);
  const inv = bwv <= 786, num = inv ? bwv - 771 : bwv - 786;
  const meta = { id: `bwv${bwv}`, bwv, kind: inv ? 'Inventio' : 'Sinfonia', num, title: `${inv ? 'Inventio' : 'Sinfonia'} ${num}`, keyName: KEYS[num - 1],
    voicesLabel: inv ? '2 Stimmen' : '3 Stimmen', license: inv ? 'Mutopia Project, CC BY-SA 3.0' : 'Mutopia Project (Olivier Vermersch)' };
  if (!fs.existsSync(f)) { catalog.push(Object.assign({ available: false }, meta)); continue; }
  const { piece, problems } = buildPiece(fs.readFileSync(f, 'utf8'), meta);
  if (KEYS[num - 1].endsWith('Moll')) piece.key.mode = 'minor'; else piece.key.mode = 'major';
  fs.writeFileSync(path.join(out, `${meta.id}.json`), JSON.stringify(piece));
  catalog.push(Object.assign({ available: true, measures: piece.measures, time: piece.time }, meta));
  if (problems.filter(p => !p.startsWith('Hinweis')).length) console.log(meta.id, problems.join('; '));
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(catalog));
console.log('Stücke:', catalog.filter(c => c.available).length);
