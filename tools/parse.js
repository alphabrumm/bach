// Parser für die (einfache) LilyPond-Quelle von BWV 788 -> Notenliste
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/bwv788.ly', 'utf8');

const STEPS = 'cdefgab';
const SEMI = [0, 2, 4, 5, 7, 9, 11];
const TPW = 48; // ticks pro Ganze

function extract(name) {
  const re = new RegExp(name + '\\s*=\\s*\\\\relative\\s+([a-g][\',]*)\\s*\\{');
  const m = re.exec(src);
  let i = m.index + m[0].length, depth = 1, start = i;
  while (depth) { if (src[i] === '{') depth++; if (src[i] === '}') depth--; i++; }
  return { ref: m[1], body: src.slice(start, i - 1) };
}

function parseVoice(name, voiceId, staffDefault) {
  const { ref, body } = extract(name);
  let prevDn = STEPS.indexOf(ref[0]) + 7 * (3 + (ref.match(/'/g) || []).length - (ref.match(/,/g) || []).length);
  const clean = body.replace(/%.*$/gm, '').replace(/\\bar\s+"[^"]*"/g, '').replace(/\\/g, ' \\').replace(/~/g, ' ~ ');
  const toks = clean.split(/\s+/).filter(Boolean);
  let dur = 4, dots = 0, t = 0, staff = staffDefault;
  const ev = [];
  const durTicks = (d, k) => { let v = TPW / d, add = v; for (let j = 0; j < k; j++) { add /= 2; v += add; } return v; };
  for (let i = 0; i < toks.length; i++) {
    const tk = toks[i];
    if (tk === '|') { if (t % 72 !== 0) throw new Error(`${name}: Taktstrich bei t=${t}`); continue; }
    if (tk === '~') { ev[ev.length - 1].tieStart = true; continue; }
    if (tk === '\\break' || tk.startsWith('\\stem')) continue;
    if (tk === '\\sd') { staff = 2; continue; }
    if (tk === '\\su') { staff = 1; continue; }
    if (tk === '\\prallprall') { ev[ev.length - 1].trill = true; continue; }
    if (tk === '\\skip') {
      const d = toks[++i]; const m = /^(\d+)(\.*)$/.exec(d);
      const len = durTicks(+m[1], m[2].length);
      ev.push({ type: 'space', onset: t, ticks: len, dur: +m[1], dots: m[2].length, voice: voiceId, staff });
      t += len; continue;
    }
    let m = /^r(\d+)?(\.*)$/.exec(tk);
    if (m) {
      if (m[1]) { dur = +m[1]; dots = m[2].length; }
      const len = durTicks(dur, dots);
      ev.push({ type: 'rest', onset: t, ticks: len, dur, dots, voice: voiceId, staff });
      t += len; continue;
    }
    m = /^([a-g])(isis|eses|is|es|s)?([',]*)(!?)(\??)(\d+)?(\.*)$/.exec(tk);
    if (!m) throw new Error(`${name}: unbekanntes Token "${tk}"`);
    const step = STEPS.indexOf(m[1]);
    const alter = { undefined: 0, is: 1, isis: 2, es: -1, eses: -2, s: -1 }[m[2]];
    let dn = step + 7 * Math.round((prevDn - step) / 7);
    dn += (m[3].match(/'/g) || []).length * 7 - (m[3].match(/,/g) || []).length * 7;
    prevDn = dn;
    if (m[6]) { dur = +m[6]; dots = m[7].length; }
    const len = durTicks(dur, dots);
    const oct = Math.floor(dn / 7) - 0; // dn: oct*7+step, mit c'=C4 -> oct 4
    const midi = 12 * (oct + 1) + SEMI[step] + alter;
    ev.push({ type: 'note', onset: t, ticks: len, dur, dots, voice: voiceId, staff, step, alter, oct, midi,
      forced: !!m[4], cautionary: !!m[5] });
    t += len;
  }
  return { events: ev, length: t };
}

const voices = [
  parseVoice('melone', 1, 1),
  parseVoice('meltwo', 2, 1),
  parseVoice('melthree', 3, 2),
];
voices.forEach((v, i) => console.error(`Stimme ${i + 1}: ${v.length / 72} Takte, ${v.events.filter(e => e.type === 'note').length} Noten`));

// Ties: Folge-Note markieren + Tonhöhe prüfen
for (const v of voices) {
  const notes = v.events.filter(e => e.type === 'note');
  for (let i = 0; i < notes.length; i++) if (notes[i].tieStart) {
    const n = notes[i + 1];
    if (!n || n.midi !== notes[i].midi) throw new Error('Haltebogen ohne gleiche Note bei ' + notes[i].onset);
    n.tieEnd = true;
  }
  // Taktüberschreitende Noten prüfen
  for (const e of v.events) {
    if (Math.floor(e.onset / 72) !== Math.floor((e.onset + e.ticks - 1) / 72)) console.error('über Taktstrich:', e);
  }
}
module.exports = { voices };
if (require.main === module) {
  fs.writeFileSync(__dirname + '/notes.json', JSON.stringify(voices.map(v => v.events)));
}
