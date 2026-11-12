// ===== Musikalische Analyse + MEI-Erzeugung (läuft im Browser und in Node) =====
const MEASURE = 72, BEAT = 18; // Ticks: Ganze = 48, 12/8-Takt = 72, punktierte Viertel = 18
const STEP_NAMES = 'cdefgab';
const KEY_ALTER = { 6: -1, 2: -1, 5: -1 }; // c-Moll: b, e, a erniedrigt (step-Index)

function buildModel(voicesRaw) {
  const notes = [], events = [];
  voicesRaw.forEach((evs, vi) => {
    let k = 0;
    evs.forEach(e => {
      const o = Object.assign({}, e);
      o.id = (e.type === 'note' ? 'n' : e.type === 'rest' ? 'r' : 's') + (vi + 1) + '_' + (k++);
      o.measure = Math.floor(e.onset / MEASURE) + 1;
      o.pos = e.onset % MEASURE;
      if (o.staff == null) o.staff = vi === 2 ? 2 : 1;
      o.layerStaff = vi === 2 ? 2 : 1;
      events.push(o);
      if (o.type === 'note') { o.pc = ((o.midi % 12) + 12) % 12; notes.push(o); }
    });
  });
  // Haltebogen-Ketten: Gesamtdauer für die Wiedergabe
  const byVoice = [1, 2, 3].map(v => notes.filter(n => n.voice === v).sort((a, b) => a.onset - b.onset));
  byVoice.forEach(list => {
    list.forEach((n, i) => { n.prev = list[i - 1] || null; n.next = list[i + 1] || null; });
    list.forEach(n => {
      if (n.tieEnd) return;
      let total = n.ticks, cur = n;
      while (cur.tieStart && cur.next) { cur = cur.next; total += cur.ticks; }
      n.playTicks = total;
    });
  });
  const measures = Math.max(...events.map(e => e.measure));
  return { notes, events, measures, byVoice };
}

// ---------- Tonart pro Takt (Krumhansl-Kessler + Viterbi-Glättung) ----------
const KK_MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
function corr(a, b) {
  const ma = a.reduce((s, x) => s + x, 0) / 12, mb = b.reduce((s, x) => s + x, 0) / 12;
  let n = 0, da = 0, db = 0;
  for (let i = 0; i < 12; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return da && db ? n / Math.sqrt(da * db) : 0;
}
function pcHist(notes, from, to) {
  const h = new Array(12).fill(0);
  for (const n of notes) {
    const s = Math.max(n.onset, from), e = Math.min(n.onset + n.ticks, to);
    if (e > s) h[n.pc] += e - s;
  }
  return h;
}
function analyzeKeys(model) {
  const M = model.measures, scores = [];
  for (let m = 1; m <= M; m++) {
    const h = new Array(12).fill(0);
    [[m - 1, 0.4], [m, 1], [m + 1, 0.4]].forEach(([mm, w]) => {
      if (mm < 1 || mm > M) return;
      pcHist(model.notes, (mm - 1) * MEASURE, mm * MEASURE).forEach((x, i) => h[i] += w * x);
    });
    const row = [];
    for (let t = 0; t < 12; t++) {
      const rot = p => p.map((_, i) => p[(i - t + 12) % 12]);
      row.push(corr(h, rot(KK_MAJ)), corr(h, rot(KK_MIN)));
    }
    scores.push(row); // Index: t*2 + (0=Dur,1=Moll)
  }
  // Viterbi: Tonartwechsel kosten etwas, damit die Anzeige nicht flackert
  const K = 24, PEN = 0.22;
  let best = scores[0].map((s, k) => s + (k === 1 ? 0.3 : 0)); // Start: c-Moll bevorzugen
  const back = [];
  for (let m = 1; m < M; m++) {
    const nb = [], bk = [];
    for (let k = 0; k < K; k++) {
      let bv = -1e9, bi = 0;
      for (let j = 0; j < K; j++) { const v = best[j] - (j === k ? 0 : PEN); if (v > bv) { bv = v; bi = j; } }
      nb.push(bv + scores[m][k]); bk.push(bi);
    }
    best = nb; back.push(bk);
  }
  let k = 1; // Ende: Tonika c-Moll erzwingen ist zu stark – Maximum nehmen
  k = best.indexOf(Math.max(...best));
  const path = [k];
  for (let m = M - 2; m >= 0; m--) { k = back[m][k]; path.unshift(k); }
  return path.map(k => ({ tonic: Math.floor(k / 2), minor: k % 2 === 1 }));
}

// ---------- Akkorde pro Zählzeit ----------
const CHORDS = [
  { q: 'maj', iv: [0, 4, 7], prior: 1.0 },
  { q: 'min', iv: [0, 3, 7], prior: 1.0 },
  { q: 'dim', iv: [0, 3, 6], prior: 0.85 },
  { q: 'dom7', iv: [0, 4, 7, 10], prior: 0.97, sev: 10 },
  { q: 'dim7', iv: [0, 3, 6, 9], prior: 0.9, sev: 9 },
  { q: 'hdim7', iv: [0, 3, 6, 10], prior: 0.82, sev: 10 },
  { q: 'min7', iv: [0, 3, 7, 10], prior: 0.75, sev: 10 },
];
function scaleSet(key) {
  const base = key.minor ? [0, 2, 3, 5, 7, 8, 10, 11] : [0, 2, 4, 5, 7, 9, 11];
  return new Set(base.map(x => (x + key.tonic) % 12));
}
function detectChord(model, from, to, key) {
  const w = new Array(12).fill(0);
  let bass = null;
  const sounding = model.notes.filter(n => n.onset < to && n.onset + n.ticks > from);
  for (const n of sounding) {
    const s = Math.max(n.onset, from), e = Math.min(n.onset + n.ticks, to);
    let x = e - s;
    if (n.onset < from) x *= 0.75;             // gehaltener Ton zählt etwas weniger
    if (n.onset === from) x *= 1.4;            // Ton auf der Zählzeit zählt mehr
    if (n.ticks <= 3 && n.onset % 6 !== 0) x *= 0.6; // Sechzehntel zwischen den Achteln: oft Durchgang
    w[n.pc] += x;
  }
  const early = sounding.filter(n => n.onset < from + 7);
  if (early.length) bass = early.reduce((a, b) => (b.midi < a.midi ? b : a)).pc;
  const total = w.reduce((a, b) => a + b, 0);
  if (!total) return null;
  const sc = scaleSet(key);
  let best = null;
  for (let r = 0; r < 12; r++) for (const c of CHORDS) {
    const pcs = c.iv.map(i => (i + r) % 12);
    if (c.sev != null && w[(r + c.sev) % 12] < total * 0.06) continue;
    const third = (r + c.iv[1]) % 12;
    let s = 0;
    pcs.forEach(p => s += w[p]);
    for (let p = 0; p < 12; p++) if (!pcs.includes(p)) s -= 0.75 * w[p];
    if (w[r] === 0) s -= 0.35 * total;
    if (w[third] === 0) s -= 0.3 * total;
    if (bass === r) s += 0.18 * total;
    if (pcs.every(p => sc.has(p))) s += 0.12 * total;
    s *= c.prior;
    if (!best || s > best.score) best = { root: r, q: c.q, pcs, score: s, bass };
  }
  // Verminderter Septakkord ist symmetrisch: Grundton als Leitton deuten
  if (best && best.q === 'dim7') {
    const cands = [0, 3, 6, 9].map(i => (best.root + i) % 12);
    const lt = (key.tonic + 11) % 12;
    let r = cands.find(c => c === lt);
    if (r == null) r = cands.find(c => (c - key.tonic + 12) % 12 === 6); // vii°7/V
    if (r == null) r = cands.find(c => sc.has((c + 1) % 12));
    if (r != null) { best.root = r; best.pcs = [0, 3, 6, 9].map(i => (i + r) % 12); }
  }
  return best;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
function romanFor(ch, key) {
  const iv = (ch.root - key.tonic + 12) % 12;
  const maj = { 0: [0, ''], 1: [1, '♭'], 2: [1, ''], 3: [2, '♭'], 4: [2, ''], 5: [3, ''], 6: [3, '♯'], 7: [4, ''], 8: [5, '♭'], 9: [5, ''], 10: [6, '♭'], 11: [6, ''] };
  const min = { 0: [0, ''], 1: [1, '♭'], 2: [1, ''], 3: [2, ''], 4: [2, '♯'], 5: [3, ''], 6: [3, '♯'], 7: [4, ''], 8: [5, ''], 9: [5, '♯'], 10: [6, ''], 11: [6, '♯'] };
  let [deg, acc] = (key.minor ? min : maj)[iv];
  if (key.minor && iv === 11) acc = ''; // Leitton-Akkord vii° ohne Vorzeichen
  let r = ROMAN[deg];
  const lower = ['min', 'dim', 'dim7', 'hdim7', 'min7'].includes(ch.q);
  if (lower) r = r.toLowerCase();
  const suf = { maj: '', min: '', dim: '°', dom7: '7', dim7: '°7', hdim7: 'ø7', min7: '7' }[ch.q];
  return acc + r + suf;
}
function isDiatonic(ch, key) { const sc = scaleSet(key); return ch.pcs.every(p => sc.has(p)); }
function chordRoman(ch, key) {
  if (ch.root === key.tonic) return romanFor(ch, key) + (key.minor && ch.q === 'maj' ? ' (picardische Terz)' : '');
  if (!isDiatonic(ch, key)) {
    // Zwischendominante: (V oder V7) einer leitereigenen Stufe ≠ I
    if (ch.q === 'maj' || ch.q === 'dom7') {
      const target = (ch.root + 5) % 12;
      const tIv = (target - key.tonic + 12) % 12;
      if (tIv !== 0 && scaleSet(key).has(target)) {
        const tq = diatonicQuality(target, key);
        return (ch.q === 'dom7' ? 'V7' : 'V') + '/' + romanFor({ root: target, q: tq }, key);
      }
    }
    if (ch.q === 'dim7' || ch.q === 'dim') {
      const target = (ch.root + 1) % 12;
      const tIv = (target - key.tonic + 12) % 12;
      if (tIv !== 0 && scaleSet(key).has(target)) {
        return 'vii' + (ch.q === 'dim7' ? '°7' : '°') + '/' + romanFor({ root: target, q: diatonicQuality(target, key) }, key);
      }
    }
  }
  return romanFor(ch, key);
}
function diatonicQuality(root, key) {
  const sc = scaleSet(key);
  const nat = key.minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const nat12 = new Set(nat.map(x => (x + key.tonic) % 12));
  const third = [3, 4].find(i => nat12.has((root + i) % 12));
  const fifth = [6, 7].find(i => nat12.has((root + i) % 12));
  if (third === 4) return 'maj';
  if (fifth === 6) return 'dim';
  return 'min';
}

// ---------- Deutsche Namen ----------
const PC_NAMES_FLAT = ['c', 'des', 'd', 'es', 'e', 'f', 'ges', 'g', 'as', 'a', 'b', 'h'];
const PC_NAMES_SHARP = ['c', 'cis', 'd', 'dis', 'e', 'f', 'fis', 'g', 'gis', 'a', 'ais', 'h'];
function germanStepName(step, alter) {
  const L = STEP_NAMES[step];
  if (alter === 0) return L === 'b' ? 'h' : L;
  if (alter === 1) return (L === 'b' ? 'h' : L) + 'is';
  if (alter === 2) return (L === 'b' ? 'h' : L) + 'isis';
  if (alter === -1) return { b: 'b', e: 'es', a: 'as' }[L] || L + 'es';
  if (alter === -2) return { b: 'heses', e: 'eses', a: 'asas' }[L] || L + 'eses';
}
function helmholtz(n) {
  let s = germanStepName(n.step, n.alter);
  const o = n.oct;
  if (o >= 4) return s + "'".repeat(o - 3);
  if (o === 3) return s;
  s = s[0].toUpperCase() + s.slice(1);
  if (o === 2) return s;
  return s + ','.repeat(2 - o);
}
function pcSpelling(pc, model, from, to) {
  const n = model.notes.find(n => n.pc === pc && n.onset < to && n.onset + n.ticks > from);
  if (n) return germanStepName(n.step, n.alter);
  return [1, 3, 8, 10].includes(pc) ? PC_NAMES_FLAT[pc] : PC_NAMES_SHARP[pc];
}
function keyName(key) {
  const majN = ['C', 'Des', 'D', 'Es', 'E', 'F', 'Fis', 'G', 'As', 'A', 'B', 'H'];
  const minN = ['c', 'cis', 'd', 'es', 'e', 'f', 'fis', 'g', 'gis', 'a', 'b', 'h'];
  return key.minor ? minN[key.tonic] + '-Moll' : majN[key.tonic] + '-Dur';
}
function keyShort(key) {
  const majN = ['C', 'Des', 'D', 'Es', 'E', 'F', 'Fis', 'G', 'As', 'A', 'B', 'H'];
  const minN = ['c', 'cis', 'd', 'es', 'e', 'f', 'fis', 'g', 'gis', 'a', 'b', 'h'];
  return key.minor ? minN[key.tonic] : majN[key.tonic];
}
function chordName(ch, model, from, to) {
  let r = pcSpelling(ch.root, model, from, to);
  const upper = ['maj', 'dom7'].includes(ch.q);
  r = upper ? r[0].toUpperCase() + r.slice(1) : r;
  const suf = { maj: '', min: '', dim: '°', dom7: '7', dim7: '°7', hdim7: 'ø7', min7: '7' }[ch.q];
  return r + suf;
}
const QUALITY_TEXT = { maj: 'Dur-Dreiklang', min: 'Moll-Dreiklang', dim: 'verminderter Dreiklang', dom7: 'Dominantseptakkord', dim7: 'verminderter Septakkord', hdim7: 'halbverminderter Septakkord', min7: 'Moll-Septakkord' };

function analyzeHarmony(model) {
  const keys = analyzeKeys(model);
  const beats = [];
  for (let m = 1; m <= model.measures; m++) {
    for (let b = 0; b < 4; b++) {
      const from = (m - 1) * MEASURE + b * BEAT, to = from + BEAT;
      const key = keys[m - 1];
      const ch = detectChord(model, from, to, key);
      if (ch) {
        ch.roman = chordRoman(ch, key);
        ch.name = chordName(ch, model, from, to);
        ch.quality = QUALITY_TEXT[ch.q];
      }
      beats.push({ measure: m, beat: b, from, to, key, chord: ch });
    }
  }
  return { keys, beats };
}

// Rolle einer Note im Akkord ihrer Zählzeit
function noteRole(n, harmony) {
  const bt = harmony.beats[Math.floor(n.onset / BEAT)];
  if (!bt || !bt.chord) return { text: 'keine Akkordschätzung' };
  const ch = bt.chord;
  const iv = (n.pc - ch.root + 12) % 12;
  if (ch.pcs.includes(n.pc)) {
    const name = iv === 0 ? 'Grundton' : (iv === 3 || iv === 4) ? 'Terz' : (iv === 6 || iv === 7) ? 'Quinte' : 'Septime';
    return { chordTone: true, text: name + ' des Akkords' };
  }
  const p = n.prev && n.prev.onset + n.prev.ticks === n.onset ? n.prev : null;
  const q = n.next && n.onset + n.ticks === n.next.onset ? n.next : null;
  const d1 = p ? n.midi - p.midi : null, d2 = q ? q.midi - n.midi : null;
  const step = d => d != null && Math.abs(d) >= 1 && Math.abs(d) <= 2;
  const strong = n.onset % BEAT === 0;
  if (strong && step(d2) && (p && (p.midi === n.midi || step(d1)))) return { text: 'Vorhalt (auf der Zählzeit, löst sich stufenweise auf)' };
  if (step(d1) && step(d2) && Math.sign(d1) === Math.sign(d2)) return { text: 'Durchgangston' };
  if (step(d1) && step(d2) && Math.sign(d1) !== Math.sign(d2)) return { text: 'Wechselnote (Nebennote)' };
  if (step(d2)) return { text: 'akkordfremd, löst sich stufenweise auf' };
  return { text: 'akkordfremder Ton' };
}

// ---------- Vorzeichen: geschrieben / takt-gültig ("Geister") ----------
function computeAccidentals(model) {
  for (let m = 1; m <= model.measures; m++) {
    for (const staff of [1, 2]) {
      const list = model.notes.filter(n => n.measure === m && n.staff === staff).sort((a, b) => a.onset - b.onset || a.voice - b.voice);
      const state = {};
      for (const n of list) {
        const k = n.step + ':' + n.oct;
        const cur = k in state ? state[k] : (KEY_ALTER[n.step] || 0);
        n.showAcc = false; n.ghost = false;
        if (n.tieEnd) { continue; }
        if (n.alter !== cur || n.forced || n.cautionary) n.showAcc = true;
        else if (k in state && n.alter !== (KEY_ALTER[n.step] || 0)) n.ghost = true; // gilt nur wegen eines früheren Vorzeichens im Takt
        state[k] = n.alter;
      }
    }
  }
}

// ---------- MEI ----------
const ACC = { '-2': 'ff', '-1': 'f', '0': 'n', '1': 's', '2': 'x' };
function buildMEI(model, harmony, opts) {
  const out = [];
  out.push('<?xml version="1.0" encoding="UTF-8"?>');
  out.push('<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="4.0.1"><meiHead><fileDesc><titleStmt><title>Sinfonia 2</title></titleStmt><pubStmt/></fileDesc></meiHead>');
  out.push('<music><body><mdiv><score>');
  out.push('<scoreDef meter.count="12" meter.unit="8" key.sig="3f"><staffGrp symbol="brace" bar.thru="true">');
  out.push('<staffDef n="1" lines="5" clef.shape="G" clef.line="2"/><staffDef n="2" lines="5" clef.shape="F" clef.line="4"/>');
  out.push('</staffGrp></scoreDef><section>');
  const beamId = { n: 0 };
  for (let m = 1; m <= model.measures; m++) {
    out.push(`<measure n="${m}" xml:id="m${m}"${m === model.measures ? ' right="end"' : ''}>`);
    const layers = [[1, 1, 1], [1, 2, 2], [2, 1, 3]]; // staff, layer, voice
    let curStaff = 0;
    for (const [st, ly, v] of layers) {
      if (st !== curStaff) { if (curStaff) out.push('</staff>'); out.push(`<staff n="${st}">`); curStaff = st; }
      out.push(`<layer n="${ly}">`);
      const evs = model.events.filter(e => e.voice === v && e.measure === m).sort((a, b) => a.onset - b.onset);
      // Balken pro punktierter Viertel
      const groups = []; let g = null;
      evs.forEach(e => {
        const beamable = e.type === 'note' && e.dur >= 8;
        const beat = Math.floor(e.pos / BEAT);
        const fits = Math.floor((e.pos + e.ticks - 1) / BEAT) === beat;
        if (beamable && fits && g && g.beat === beat) g.items.push(e);
        else { g = beamable && fits ? { beat, items: [e] } : null; groups.push(g || { items: [e], single: true }); }
      });
      for (const grp of groups) {
        const beam = !grp.single && grp.items.length > 1;
        if (beam) out.push(`<beam xml:id="b${v}_${beamId.n++}" type="v${v}">`);
        for (const e of grp.items) out.push(eventXML(e, opts));
        if (beam) out.push('</beam>');
      }
      out.push('</layer>');
    }
    out.push('</staff>');
    // Ornamente
    model.notes.filter(n => n.measure === m && n.trill).forEach(n => out.push(`<trill startid="#${n.id}" place="above"/>`));
    // Harmonik
    if (opts.harm) {
      for (let b = 0; b < 4; b++) {
        const bt = harmony.beats[(m - 1) * 4 + b];
        if (!bt.chord) continue;
        const prev = harmony.beats[(m - 1) * 4 + b - 1];
        const keyChanged = !prev || prev.key.tonic !== bt.key.tonic || prev.key.minor !== bt.key.minor;
        if (!keyChanged && prev && prev.chord && prev.chord.roman === bt.chord.roman) continue;
        const txt = (keyChanged ? keyShort(bt.key) + ': ' : '') + bt.chord.roman;
        out.push(`<harm xml:id="h${m}_${b}" staff="2" tstamp="${1 + b * 3}" place="below">${esc(txt)}</harm>`);
      }
    }
    out.push('</measure>');
  }
  out.push('</section></score></mdiv></body></music></mei>');
  return out.join('');
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function eventXML(e, opts) {
  const d = `dur="${e.dur}"${e.dots ? ` dots="${e.dots}"` : ''}`;
  if (e.type === 'space') return `<space xml:id="${e.id}" ${d}/>`;
  if (e.type === 'rest') return `<rest xml:id="${e.id}" ${d}/>`;
  let a = `<note xml:id="${e.id}" pname="${STEP_NAMES[e.step]}" oct="${e.oct}" ${d}`;
  if (e.staff !== e.layerStaff) a += ` staff="${e.staff}"`;
  if (e.tieStart && e.tieEnd) a += ' tie="m"'; else if (e.tieStart) a += ' tie="i"'; else if (e.tieEnd) a += ' tie="t"';
  let inner = '';
  if (e.showAcc) {
    if (e.cautionary) inner = `<accid accid="${ACC[e.alter]}" func="caution" enclose="paren"/>`;
    else a += ` accid="${ACC[e.alter]}"`;
  } else {
    if (e.alter !== 0) a += ` accid.ges="${ACC[e.alter]}"`;
    if (opts.ghosts && e.ghost) inner = `<accid xml:id="ga_${e.id}" accid="${ACC[e.alter]}" func="edit" enclose="paren"/>`;
  }
  return inner ? a + '>' + inner + '</note>' : a + '/>';
}

if (typeof module !== 'undefined') module.exports = { buildModel, analyzeHarmony, computeAccidentals, buildMEI, noteRole, helmholtz, keyName, MEASURE, BEAT };
