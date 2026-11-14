// ===== Musikalische Analyse + MEI-Erzeugung (läuft im Browser und in Node) =====
// Gilt für jedes Stück: Taktart, Tonart, Auftakt und Stimmen kommen aus dem Stück-JSON.
let TPW = 96, MEASURE = 96, BEAT = 24, UNIT = 24, KEY_ALTER = {}, PIECE = null;
const STEP_NAMES = 'cdefgab';
const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6], FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];

function setupPiece(piece) {
  PIECE = piece; TPW = piece.tpw || 96;
  const { num, den } = piece.time;
  MEASURE = piece.measureTicks;
  UNIT = TPW / den;
  const compound = num % 3 === 0 && num > 3 && den >= 8;
  BEAT = compound ? 3 * UNIT : (num === 3 && den >= 8 ? MEASURE : UNIT);
  KEY_ALTER = {};
  const f = piece.key.fifths;
  if (f > 0) SHARP_ORDER.slice(0, f).forEach(s => KEY_ALTER[s] = 1);
  if (f < 0) FLAT_ORDER.slice(0, -f).forEach(s => KEY_ALTER[s] = -1);
}
function pieceKey(piece) {
  const majTonic = ((piece.key.fifths * 7) % 12 + 12) % 12;
  return piece.key.mode === 'minor' ? { tonic: (majTonic + 9) % 12, minor: true } : { tonic: majTonic, minor: false };
}

function buildModel(piece) {
  setupPiece(piece);
  const notes = [], events = [];
  // Stimmrollen: oben = 1 (rot), Mitte = 2 (grün), unten = 3 (blau)
  const main = [...new Set(piece.events.map(e => String(e.v).split('.')[0]))];
  const avg = {};
  main.forEach(v => { const ns = piece.events.filter(e => e.y === 'n' && String(e.v).split('.')[0] === v); avg[v] = ns.reduce((a, b) => a + b.m, 0) / (ns.length || 1); });
  const order = [...main].sort((a, b) => avg[b] - avg[a]);
  const roleOf = {};
  const ROLE_SETS = { 1: [1], 2: [1, 3], 3: [1, 2, 3], 4: [1, 2, 4, 3] }; // 4 = Tenor
  order.forEach((v, i) => { roleOf[v] = (ROLE_SETS[order.length] || [1, 2, 4, 3])[Math.min(i, 3)]; });
  const homeStaff = {}; piece.voices.forEach(v => homeStaff[v.id] = v.staff);
  piece.events.forEach((e, i) => {
    const v = String(e.v), mainV = v.split('.')[0];
    const type = e.y === 'n' ? 'note' : e.y === 'r' ? 'rest' : 'space';
    const o = { id: (type === 'note' ? 'n' : type === 'rest' ? 'r' : 's') + i, type, voice: v, mainVoice: mainV, role: roleOf[mainV],
      staff: e.s, layerStaff: homeStaff[mainV] || e.s, onset: e.t, ticks: e.k, dur: e.d, dots: e.p || 0,
      tieStart: !!e.ts, tieEnd: !!e.te, forced: !!e.fo, cautionary: !!e.ca, chord: e.c || null, tuplet: e.tu || null, orn: e.o || null, mrest: !!e.mr,
      grace: e.g || null };
    if (type === 'note') Object.assign(o, { midi: e.m, step: e.st, alter: e.al, oct: e.oc, pc: ((e.m % 12) + 12) % 12 });
    o.measure = Math.floor(o.onset / MEASURE + 1e-9) + 1;
    o.pos = o.onset - (o.measure - 1) * MEASURE;
    events.push(o); if (type === 'note' && !o.grace) notes.push(o);
  });
  // Vorschläge der folgenden Hauptnote derselben Stimme zuordnen
  const graces = events.filter(e => e.grace);
  graces.forEach(g => {
    const main = notes.filter(n => n.voice === g.voice && Math.abs(n.onset - g.onset) < 1e-6).sort((a, b) => b.midi - a.midi)[0];
    if (main) { g.mainId = main.id; (main.graces = main.graces || []).push(g); }
  });
  // Nachbarn je Stimme (für Rollen/Bögen) – bei Akkorden zählt der höchste Ton
  const byVoice = {};
  notes.forEach(n => (byVoice[n.voice] = byVoice[n.voice] || []).push(n));
  Object.values(byVoice).forEach(list => {
    list.sort((a, b) => a.onset - b.onset || b.midi - a.midi);
    const line = list.filter((n, i) => i === 0 || n.onset !== list[i - 1].onset);
    line.forEach((n, i) => { n.prev = line[i - 1] || null; n.next = line[i + 1] || null; });
    list.forEach(n => { if (!n.prev && !n.next) { const ref = line.find(x => x.onset === n.onset); if (ref) { n.prev = ref.prev; n.next = ref.next; } } });
  });
  // Klingende Gesamtdauer über Haltebögen
  Object.values(byVoice).forEach(list => {
    list.forEach(n => {
      if (n.tieEnd) return;
      let total = n.ticks, cur = n;
      while (cur.tieStart) {
        const nx = list.find(x => Math.abs(x.onset - (cur.onset + cur.ticks)) < 1e-6 && x.midi === cur.midi);
        if (!nx) break; total += nx.ticks; cur = nx;
      }
      n.playTicks = total;
    });
  });
  const roles = [...new Set(order.map(v => roleOf[v]))]; // von oben nach unten
  return { notes, events, graces, measures: piece.measures, roles, voiceCount: order.length, piece };
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
  for (const n of notes) { const s = Math.max(n.onset, from), e = Math.min(n.onset + n.ticks, to); if (e > s) h[n.pc] += e - s; }
  return h;
}
function analyzeKeys(model) {
  const M = model.measures, scores = [];
  // Fenster ~ 2–3 Takte, bei kurzen Takten (3/8) breiter
  const span = MEASURE <= 48 ? 2 : 1;
  for (let m = 1; m <= M; m++) {
    const h = new Array(12).fill(0);
    for (let d = -span; d <= span; d++) {
      const mm = m + d; if (mm < 1 || mm > M) continue;
      const w = d === 0 ? 1 : 0.45;
      pcHist(model.notes, (mm - 1) * MEASURE, mm * MEASURE).forEach((x, i) => h[i] += w * x);
    }
    const row = [];
    for (let t = 0; t < 12; t++) {
      const rot = p => p.map((_, i) => p[(i - t + 12) % 12]);
      row.push(corr(h, rot(KK_MAJ)), corr(h, rot(KK_MIN)));
    }
    scores.push(row);
  }
  const home = pieceKey(model.piece), homeIdx = home.tonic * 2 + (home.minor ? 1 : 0);
  const K = 24, PEN = MEASURE <= 48 ? 0.32 : 0.22;
  let best = scores[0].map((s, k) => s + (k === homeIdx ? 0.4 : 0));
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
  best[homeIdx] += 0.4; // Schluss in der Grundtonart bevorzugen
  let k = best.indexOf(Math.max(...best));
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
function detectChord(model, from, to, key, noLook) {
  const w = new Array(12).fill(0);
  let bass = null;
  const sub = UNIT / 2; // Unterteilung: Töne zwischen den Hauptwerten sind oft Durchgänge
  const sounding = model.notes.filter(n => n.onset < to && n.onset + n.ticks > from);
  for (const n of sounding) {
    const s = Math.max(n.onset, from), e = Math.min(n.onset + n.ticks, to);
    let x = e - s;
    if (n.onset < from) x *= 0.75;
    if (Math.abs(n.onset - from) < 1e-6) x *= 1.4;
    if (n.ticks <= TPW / 16 && Math.abs((n.onset - from) % (TPW / 8)) > 1e-6) x *= 0.6;
    w[n.pc] += x;
  }
  const early = sounding.filter(n => n.onset < from + Math.min(BEAT, TPW / 8) * 0.6);
  if (early.length) bass = early.reduce((a, b) => (b.midi < a.midi ? b : a)).pc;
  const total = w.reduce((a, b) => a + b, 0);
  if (!total) return null;
  const sc = scaleSet(key);
  let best = null; const all = [];
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
    all.push({ root: r, q: c.q, pcs, score: s });
    if (!best || s > best.score) best = { root: r, q: c.q, pcs, score: s, bass };
  }
  // Belege für „Warum?“: Tongewichte und die besten Deutungen
  if (best) best.ev = { w, total, bass, top: best.score, cands: all.sort((a, b) => b.score - a.score).slice(0, 6) };
  // Terz fehlt in diesem Schlag (z. B. Präludium C-Dur: d–a–d, das f kommt erst danach)?
  // Dann entscheidet der nächste Schlag über Dur/Moll, sofern derselbe Grundton bleibt.
  if (best && !noLook && w[(best.root + (CHORDS.find(c => c.q === best.q).iv[1])) % 12] === 0) {
    const ext = detectChord(model, from, to + BEAT, key, true);
    if (ext && ext.root === best.root) { best.q = ext.q; best.pcs = ext.pcs; }
  }
  if (best && best.q === 'dim7') {
    const cands = [0, 3, 6, 9].map(i => (best.root + i) % 12);
    const lt = (key.tonic + 11) % 12;
    let r = cands.find(c => c === lt);
    if (r == null) r = cands.find(c => (c - key.tonic + 12) % 12 === 6);
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
  if (key.minor && iv === 11) acc = '';
  let r = ROMAN[deg];
  if (['min', 'dim', 'dim7', 'hdim7', 'min7'].includes(ch.q)) r = r.toLowerCase();
  const suf = { maj: '', min: '', dim: '°', dom7: '7', dim7: '°7', hdim7: 'ø7', min7: '7' }[ch.q];
  return acc + r + suf;
}
function isDiatonic(ch, key) { const sc = scaleSet(key); return ch.pcs.every(p => sc.has(p)); }
function diatonicQuality(root, key) {
  const nat = key.minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const nat12 = new Set(nat.map(x => (x + key.tonic) % 12));
  const third = [3, 4].find(i => nat12.has((root + i) % 12));
  const fifth = [6, 7].find(i => nat12.has((root + i) % 12));
  if (third === 4) return 'maj';
  if (fifth === 6) return 'dim';
  return 'min';
}
function chordRoman(ch, key) {
  if (ch.root === key.tonic) return romanFor(ch, key) + (key.minor && ch.q === 'maj' ? ' (picardische Terz)' : '');
  if (!isDiatonic(ch, key)) {
    if (ch.q === 'maj' || ch.q === 'dom7') {
      const target = (ch.root + 5) % 12;
      if (target !== key.tonic && scaleSet(key).has(target)) return (ch.q === 'dom7' ? 'V7' : 'V') + '/' + romanFor({ root: target, q: diatonicQuality(target, key) }, key);
    }
    if (ch.q === 'dim7' || ch.q === 'dim') {
      const target = (ch.root + 1) % 12;
      if (target !== key.tonic && scaleSet(key).has(target)) return 'vii' + (ch.q === 'dim7' ? '°7' : '°') + '/' + romanFor({ root: target, q: diatonicQuality(target, key) }, key);
    }
  }
  return romanFor(ch, key);
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
  return (PIECE && PIECE.key.fifths < 0) || [1, 3, 8, 10].includes(pc) && !(PIECE && PIECE.key.fifths > 1) ? PC_NAMES_FLAT[pc] : PC_NAMES_SHARP[pc];
}
const MAJ_N = ['C', 'Des', 'D', 'Es', 'E', 'F', 'Fis', 'G', 'As', 'A', 'B', 'H'];
const MIN_N = ['c', 'cis', 'd', 'es', 'e', 'f', 'fis', 'g', 'gis', 'a', 'b', 'h'];
function keyName(key) { return key.minor ? MIN_N[key.tonic] + '-Moll' : MAJ_N[key.tonic] + '-Dur'; }
function keyShort(key) { return key.minor ? MIN_N[key.tonic] : MAJ_N[key.tonic]; }
function chordName(ch, model, from, to) {
  let r = pcSpelling(ch.root, model, from, to);
  if (['maj', 'dom7'].includes(ch.q)) r = r[0].toUpperCase() + r.slice(1);
  return r + { maj: '', min: '', dim: '°', dom7: '7', dim7: '°7', hdim7: 'ø7', min7: '7' }[ch.q];
}
const QUALITY_TEXT = { maj: 'Dur-Dreiklang', min: 'Moll-Dreiklang', dim: 'verminderter Dreiklang', dom7: 'Dominantseptakkord', dim7: 'verminderter Septakkord', hdim7: 'halbverminderter Septakkord', min7: 'Moll-Septakkord' };

// ---------- Funktionsbezeichnungen (Riemann) ----------
const FUNC_MAJ = { 0: { maj: 'T', min: 't' }, 1: { maj: 'sN' }, 2: { min: 'Sp', min7: 'Sp7', dim: 's6', hdim7: 's65' }, 3: { maj: 'tP' }, 4: { min: 'Dp', min7: 'Dp7' }, 5: { maj: 'S', min: 's', min7: 's7' }, 8: { maj: 'sP' }, 10: { maj: 'dP' },
  7: { maj: 'D', dom7: 'D7', min: 'd', min7: 'd7' }, 9: { min: 'Tp', min7: 'Tp7' }, 11: { dim: 'Đ7', hdim7: 'Đ9', dim7: 'Dv' } };
const FUNC_MIN = { 0: { min: 't', min7: 't7', maj: 'T' }, 1: { maj: 'sN' }, 2: { dim: 's6', hdim7: 's65' }, 3: { maj: 'tP' }, 5: { min: 's', min7: 's7', maj: 'S' },
  7: { min: 'd', min7: 'd7', maj: 'D', dom7: 'D7' }, 8: { maj: 'sP' }, 10: { maj: 'dP' }, 11: { dim: 'Đ7', hdim7: 'Đ9', dim7: 'Dv' } };
function plainFunc(root, q, key) { const t = (key.minor ? FUNC_MIN : FUNC_MAJ)[(root - key.tonic + 12) % 12]; return t && t[q]; }
function functionLabel(ch, key) {
  const roman = ch.roman || chordRoman(ch, key);
  if (roman.includes('/')) {   // Zwischendominante: (D) zum Zielklang, zur Dominante = Doppeldominante
    const lead = roman.startsWith('vii'), target = (ch.root + (lead ? 1 : 5)) % 12;
    const d = lead ? (ch.q === 'dim7' ? 'Dv' : 'Đ7') : (ch.q === 'dom7' ? 'D7' : 'D');
    if ((target - key.tonic + 12) % 12 === 7) return 'D' + d;
    const tf = plainFunc(target, diatonicQuality(target, key), key);
    return '(' + d + ')' + (tf || '');
  }
  return plainFunc(ch.root, ch.q, key) || roman.replace(/ \(.*\)$/, '');
}
// Akkord nach eigener Angabe (Grundton + Art) an einer Zählzeit
function makeChord(model, bt, root, q) {
  const def = CHORDS.find(c => c.q === q), pcs = def.iv.map(i => (i + root) % 12);
  const ch = { root, q, pcs, bass: bassPc(model, bt), score: 0 };
  ch.roman = chordRoman(ch, bt.key); ch.func = functionLabel(ch, bt.key); ch.name = chordName(ch, model, bt.from, bt.to); ch.quality = QUALITY_TEXT[q];
  return ch;
}
// Eigene Deutungen des Nutzers über die berechnete Analyse legen: Tonart je Takt, Akkord je Zählzeit
function applyOwn(model, H, ov) {
  H.autoKeys = H.keys.slice();
  if (!ov) return H;
  const km = ov.keys || {};
  if (Object.keys(km).length) {
    const auto = H.autoKeys;
    H = harmonize(model, H.keys.map((k, i) => km[i + 1] ? { tonic: km[i + 1].tonic, minor: !!km[i + 1].minor } : k));
    H.autoKeys = auto;
    H.beats.forEach(b => { if (km[b.measure]) b.keyOwn = true; });
  }
  for (const [i, o] of Object.entries(ov.beats || {})) {
    const bt = H.beats[+i]; if (!bt) continue;
    const auto = bt.chord; bt.auto = auto;
    bt.chord = makeChord(model, bt, o.root, o.q); bt.chord.own = true; if (auto) bt.chord.ev = auto.ev;
  }
  return H;
}
function harmonize(model, keys) {
  const beats = [], perMeasure = Math.round(MEASURE / BEAT);
  for (let m = 1; m <= model.measures; m++) {
    for (let b = 0; b < perMeasure; b++) {
      const from = (m - 1) * MEASURE + b * BEAT, to = from + BEAT;
      const key = keys[m - 1];
      const ch = detectChord(model, from, to, key);
      if (ch) { ch.roman = chordRoman(ch, key); ch.func = functionLabel(ch, key); ch.name = chordName(ch, model, from, to); ch.quality = QUALITY_TEXT[ch.q]; }
      beats.push({ measure: m, beat: b, from, to, key, chord: ch });
    }
  }
  return { keys, beats, perMeasure };
}
const sameKey = (x, y) => x.tonic === y.tonic && x.minor === y.minor;
// Basston einer Zählzeit: tiefster Ton, der zu Beginn klingt (sonst der tiefste im Schlag)
function bassPc(model, b) {
  let best = null;
  for (const n of model.notes) {
    if (n.onset > b.from + 1e-6 || n.onset + n.ticks <= b.from + 1e-6) continue;
    if (!best || n.midi < best.midi) best = n;
  }
  if (!best) for (const n of model.notes) { if (n.onset >= b.from - 1e-6 && n.onset < b.to - 1e-6 && (!best || n.midi < best.midi)) best = n; }
  return best ? best.pc : null;
}
function lowPc(model, b) {   // tiefster Ton irgendwo im Schlag
  let best = null;
  for (const n of model.notes) if (n.onset < b.to - 1e-6 && n.onset + n.ticks > b.from + 1e-6 && (!best || n.midi < best.midi)) best = n;
  return best ? best.pc : null;
}
// Kadenzen in Tonart K zwischen den Zählzeiten i0..i1 → Liste der Ankunfts-Zählzeiten.
// Dominante (V, V7, vii°, vii°7 oder kadenzierender Quartsextakkord) → I bzw. i mit der Tonika im Bass.
function cadences(beats, K, i0, i1) {
  const M = MODEL_FOR_CAD, ch = i => beats[i] && beats[i].chord, out = [];
  const dom = (K.tonic + 7) % 12, lt = (K.tonic + 11) % 12, tq = K.minor ? 'min' : 'maj';
  const one = Math.round(MEASURE / BEAT) === 1;
  for (let j = Math.max(1, i0); j <= Math.min(beats.length - 1, i1); j++) {
    const t = ch(j); if (!t || t.root !== K.tonic || t.q !== tq || bassPc(M, beats[j]) !== K.tonic) continue;
    let i = j - 1; while (ch(i) && ch(i).root === K.tonic && ch(i).q === tq && bassPc(M, beats[i]) === K.tonic) i--;
    const c = ch(i), b = beats[i]; if (!b) continue;
    const isV = c && ((c.root === dom && (c.q === 'maj' || c.q === 'dom7')) || (c.root === lt && (c.q === 'dim' || c.q === 'dim7')));
    const cad64 = c && c.root === K.tonic && c.q === tq && (bassPc(M, b) === dom || lowPc(M, b) === dom);
    let ltOK = false;
    if (one) { const h = pcHist(M.notes, b.from, b.to), tot = h.reduce((x, y) => x + y, 0); ltOK = tot && h[lt] / tot >= 0.08; }
    if (isV || cad64 || ltOK) out.push(j);
  }
  return out;
}
// Ausweichung oder Modulation? Passt die Musik nach der Kadenz (vier Takte, eine Phrase) wieder besser
// zur alten Tonart (z. B. c statt cis), war es nur eine Ausweichung (Tonikalisierung).
function persists(beats, K, P, j) {
  const M = MODEL_FOR_CAD, pm = Math.round(MEASURE / BEAT);
  const from = beats[j].to, to = Math.min(beats[beats.length - 1].to, beats[j].from + (pm === 1 ? 8 : 4) * MEASURE);
  if (to - from < BEAT) return true;   // Schluss des Stücks
  const h = pcHist(M.notes, from, to);
  const prof = k => { const base = k.minor ? KK_MIN : KK_MAJ; return base.map((_, i) => base[(i - k.tonic + 12) % 12]); };
  return corr(h, prof(K)) > corr(h, prof(P));
}
let MODEL_FOR_CAD = null;
// Ein Tonartwechsel gilt nur, wenn er durch eine Kadenz in der neuen Tonart bestätigt wird;
// sonst bleibt es bei der bisherigen Tonart (Ausweichung, Zwischendominanten, Orgelpunkt).
function analyzeHarmony(model, ov) {
  MODEL_FOR_CAD = model;
  let keys = analyzeKeys(model);
  let H = harmonize(model, keys);
  const pm = H.perMeasure;
  for (let pass = 0; pass < 4; pass++) {
    const regions = [];
    keys.forEach((k, i) => { const r = regions[regions.length - 1]; if (r && sameKey(r.k, k)) r.b = i; else regions.push({ k, a: i, b: i }); });
    let changed = false;
    for (let r = 1; r < regions.length; r++) {
      const R = regions[r];
      const end = R.b === keys.length - 1 ? R.b : R.b + 1;   // Kadenz darf im ersten Schlag danach landen
      const prev = regions[r - 1].k;
      if (r === regions.length - 1 && sameKey(R.k, pieceKey(model.piece)) && R.b === keys.length - 1) continue;   // Schluss in der Grundtonart
      const arr = cadences(H.beats, R.k, R.a * pm - pm, end * pm + pm - 1);
      // Ausweichung, wenn innerhalb einer Phrase (4 Takte) schon wieder eine Kadenz in der alten Tonart folgt
      const L = (pm === 1 ? 8 : 4) * pm;
      if (arr.some(j => !cadences(H.beats, prev, j + 1, j + L).length)) continue;
      for (let i = R.a; i <= R.b; i++) keys[i] = prev;
      R.k = prev; changed = true;
    }
    if (!changed) break;
    H = harmonize(model, keys);
  }
  return applyOwn(model, H, ov);
}
function beatAt(harmony, t) { return harmony.beats[Math.min(harmony.beats.length - 1, Math.floor(t / BEAT + 1e-9))]; }

function noteRole(n, harmony) {
  const bt = beatAt(harmony, n.onset);
  if (!bt || !bt.chord) return { text: 'keine Akkordschätzung' };
  const ch = bt.chord;
  const iv = (n.pc - ch.root + 12) % 12;
  if (ch.pcs.includes(n.pc)) {
    const name = iv === 0 ? 'Grundton' : (iv === 3 || iv === 4) ? 'Terz' : (iv === 6 || iv === 7) ? 'Quinte' : 'Septime';
    return { chordTone: true, text: name + ' des Akkords' };
  }
  const p = n.prev && Math.abs(n.prev.onset + n.prev.ticks - n.onset) < 1e-6 ? n.prev : null;
  const q = n.next && Math.abs(n.onset + n.ticks - n.next.onset) < 1e-6 ? n.next : null;
  const d1 = p ? n.midi - p.midi : null, d2 = q ? q.midi - n.midi : null;
  const step = d => d != null && Math.abs(d) >= 1 && Math.abs(d) <= 2;
  const strong = Math.abs(n.onset % BEAT) < 1e-6;
  if (strong && step(d2) && (p && (p.midi === n.midi || step(d1)))) return { text: 'Vorhalt (auf der Zählzeit, löst sich stufenweise auf)' };
  if (step(d1) && step(d2) && Math.sign(d1) === Math.sign(d2)) return { text: 'Durchgangston' };
  if (step(d1) && step(d2) && Math.sign(d1) !== Math.sign(d2)) return { text: 'Wechselnote (Nebennote)' };
  if (step(d2)) return { text: 'akkordfremd, löst sich stufenweise auf' };
  return { text: 'akkordfremder Ton' };
}

// ---------- Vorzeichen: geschrieben / takt-gültig ("Geister") ----------
function computeAccidentals(model) {
  const staffs = [...new Set(model.notes.map(n => n.staff))];
  for (let m = 1; m <= model.measures; m++) {
    for (const staff of staffs) {
      const list = model.notes.concat(model.graces || []).filter(n => n.measure === m && n.staff === staff)
        .sort((a, b) => a.onset - b.onset || (b.grace ? 1 : 0) - (a.grace ? 1 : 0) || a.midi - b.midi);
      const state = {};
      for (const n of list) {
        const k = n.step + ':' + n.oct;
        const cur = k in state ? state[k] : (KEY_ALTER[n.step] || 0);
        n.showAcc = false; n.ghost = false;
        if (n.tieEnd) continue;
        if (n.alter !== cur || n.forced || n.cautionary) n.showAcc = true;
        else if (k in state && n.alter !== (KEY_ALTER[n.step] || 0)) n.ghost = true;
        state[k] = n.alter;
      }
    }
  }
}

// ---------- MEI ----------
const ACC = { '-2': 'ff', '-1': 'f', '0': 'n', '1': 's', '2': 'x' };
function measureLabel(m) { return PIECE && PIECE.pickup ? m - 1 : m; }
function buildMEI(model, harmony, opts) {
  const P = model.piece, out = [];
  const f = P.key.fifths, ks = f > 0 ? f + 's' : f < 0 ? (-f) + 'f' : '0';
  out.push('<?xml version="1.0" encoding="UTF-8"?>');
  out.push('<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="4.0.1"><meiHead><fileDesc><titleStmt><title>' + esc(P.title || '') + '</title></titleStmt><pubStmt/></fileDesc></meiHead>');
  out.push('<music><body><mdiv><score>');
  out.push(`<scoreDef meter.count="${P.time.num}" meter.unit="${P.time.den}" key.sig="${ks}"><staffGrp symbol="brace" bar.thru="true">`);
  P.staffClefs.forEach((c, i) => out.push(`<staffDef n="${i + 1}" lines="5" clef.shape="${c[0]}" clef.line="${c[1]}"/>`));
  out.push('</staffGrp></scoreDef><section>');
  // Layer je System: Hauptstimmen, dann Nebenstimmen
  const staffs = P.staffClefs.map((_, i) => i + 1);
  const layersOf = {};
  staffs.forEach(s => {
    const vs = [...new Set(model.events.filter(e => e.layerStaff === s).map(e => e.voice))];
    vs.sort((a, b) => (a.includes('.') - b.includes('.')) || a.localeCompare(b));
    layersOf[s] = vs;
  });
  const repStart = new Set((P.repeats || []).map(r => r.from)), repEnd = new Set((P.repeats || []).map(r => r.to));
  for (let m = 1; m <= model.measures; m++) {
    let attrs = '';
    if (m === 1 && P.pickup) attrs += ' metcon="false"';
    if (repStart.has(m) && m > 1) attrs += ' left="rptstart"';
    if (repEnd.has(m)) attrs += ' right="rptend"'; else if (m === model.measures) attrs += ' right="end"';
    out.push(`<measure n="${measureLabel(m)}" xml:id="m${m}"${attrs}>`);
    for (const s of staffs) {
      out.push(`<staff n="${s}">`);
      layersOf[s].forEach((v, li) => {
        const evs = model.events.filter(e => e.voice === v && e.measure === m).sort((a, b) => a.onset - b.onset || (b.grace ? 1 : 0) - (a.grace ? 1 : 0));
        if (!evs.length && v.includes('.')) return;
        out.push(`<layer n="${li + 1}">`);
        const clefs = (P.clefChanges || []).filter(c => c.voice === v.split('.')[0] && c.t > (m - 1) * MEASURE - 1e-6 && c.t < m * MEASURE - 1e-6 && !v.includes('.'));
        out.push(layerXML(evs, clefs, opts));
        out.push('</layer>');
      });
      out.push('</staff>');
    }
    model.notes.filter(n => n.measure === m && n.orn && !n.tieEnd).forEach(n => {
      const sid = n.chord ? n.chord + '_' + m : n.id;
      if (n.orn === 'trill') out.push(`<trill startid="#${sid}" place="above"/>`);
      else if (n.orn === 'prall') out.push(`<mordent startid="#${sid}" form="upper" place="above"/>`);
      else if (n.orn === 'mordent') out.push(`<mordent startid="#${sid}" form="lower" place="above"/>`);
      else if (n.orn === 'turn') out.push(`<turn startid="#${sid}" form="upper" place="above"/>`);
      else if (n.orn === 'fermata') out.push(`<fermata startid="#${sid}" place="${n.role === 3 ? 'below' : 'above'}"/>`);
    });
    if (opts.harm) {
      const per = harmony.perMeasure, shift = P.pickup ? MEASURE - P.pickup : 0;
      const bassStaff = staffs[staffs.length - 1];
      for (let b = 0; b < per; b++) {
        const bt = harmony.beats[(m - 1) * per + b];
        if (!bt || !bt.chord) continue;
        if (m === 1 && P.pickup && b * BEAT < shift - 1e-6) continue;
        const prev = harmony.beats[(m - 1) * per + b - 1];
        const keyChanged = !prev || prev.key.tonic !== bt.key.tonic || prev.key.minor !== bt.key.minor;
        const L = c => (opts.func ? c.func : c.roman).replace(/ \(picardische Terz\)/, '');
        if (!keyChanged && !bt.chord.own && prev && prev.chord && !prev.chord.own && L(prev.chord) === L(bt.chord)) continue;
        const txt = (keyChanged ? keyShort(bt.key) + ': ' : '') + L(bt.chord);
        const pos = b * BEAT - (m === 1 ? shift : 0);
        out.push(`<harm xml:id="h${m}_${b}" staff="${bassStaff}" tstamp="${+(1 + pos / UNIT).toFixed(3)}" place="below">${esc(txt)}</harm>`);
      }
    }
    out.push('</measure>');
  }
  out.push('</section></score></mdiv></body></music></mei>');
  return out.join('');
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function durAttr(e) { return `dur="${e.dur}"${e.dots ? ` dots="${e.dots}"` : ''}`; }
function layerXML(evs, clefs, opts) {
  // Ganztaktpause
  if (evs.length && evs.every(e => e.type === 'rest' && e.mrest) && Math.abs(evs.reduce((a, e) => a + e.ticks, 0) - MEASURE) < 1e-6) return `<mRest xml:id="${evs[0].id}"/>`;
  // Einheiten: Einzelereignis, Akkord, Triole
  const units = [];
  for (let i = 0; i < evs.length; i++) {
    const e = evs[i];
    if (e.tuplet) {
      const id = e.tuplet[0]; const grp = [];
      while (i < evs.length && evs[i].tuplet && evs[i].tuplet[0] === id) grp.push(evs[i++]);
      i--; units.push({ kind: 'tuplet', events: grp, onset: grp[0].onset, end: grp[grp.length - 1].onset + grp[grp.length - 1].ticks }); continue;
    }
    if (e.chord) {
      const grp = []; while (i < evs.length && evs[i].chord === e.chord) grp.push(evs[i++]);
      i--; units.push({ kind: 'chord', events: grp, onset: e.onset, end: e.onset + e.ticks, beamable: e.dur >= 8 }); continue;
    }
    units.push({ kind: 'single', events: [e], onset: e.onset, end: e.onset + e.ticks, beamable: e.type === 'note' && e.dur >= 8 && !e.grace });
  }
  // Balken je Zählzeit
  const out = []; let beam = null, clefIdx = 0;
  const flush = () => { if (!beam) return; if (beam.length > 1) out.push(`<beam>${beam.map(u => unitXML(u, opts)).join('')}</beam>`); else out.push(unitXML(beam[0], opts)); beam = null; };
  for (const u of units) {
    while (clefIdx < clefs.length && clefs[clefIdx].t <= u.onset + 1e-6) { flush(); out.push(`<clef shape="${clefs[clefIdx].shape}" line="${clefs[clefIdx].line}"/>`); clefIdx++; }
    const bt = Math.floor((u.onset % MEASURE) / BEAT + 1e-9), btEnd = Math.floor(((u.end - 1e-6) % MEASURE) / BEAT + 1e-9);
    if (u.beamable && bt === btEnd) {
      if (beam && beam.bt === bt) beam.push(u); else { flush(); beam = [u]; beam.bt = bt; }
    } else { flush(); out.push(unitXML(u, opts)); }
  }
  flush();
  while (clefIdx < clefs.length) { out.push(`<clef shape="${clefs[clefIdx].shape}" line="${clefs[clefIdx].line}"/>`); clefIdx++; }
  return out.join('');
}
function unitXML(u, opts) {
  if (u.kind === 'tuplet') {
    const [id, num, numbase] = u.events[0].tuplet;
    const inner = u.events.length > 1 && u.events.every(e => e.type === 'note' && e.dur >= 8)
      ? `<beam>${u.events.map(e => eventXML(e, opts)).join('')}</beam>` : u.events.map(e => eventXML(e, opts)).join('');
    return `<tuplet num="${num}" numbase="${numbase}" bracket.visible="false">${inner}</tuplet>`;
  }
  if (u.kind === 'chord') {
    const e0 = u.events[0];
    let a = `<chord xml:id="${e0.chord}_${e0.measure}" ${durAttr(e0)}`;
    if (e0.tieStart && e0.tieEnd) a += ' tie="m"'; else if (e0.tieStart) a += ' tie="i"'; else if (e0.tieEnd) a += ' tie="t"';
    return a + '>' + u.events.map(e => eventXML(e, opts, true)).join('') + '</chord>';
  }
  return eventXML(u.events[0], opts);
}
function eventXML(e, opts, inChord) {
  const d = inChord ? '' : durAttr(e);
  if (e.type === 'space') return `<space xml:id="${e.id}" ${d}/>`;
  if (e.type === 'rest') return `<rest xml:id="${e.id}" ${d}/>`;
  let a = `<note xml:id="${e.id}" pname="${STEP_NAMES[e.step]}" oct="${e.oct}" ${d}`;
  if (e.grace) a += e.grace === 'acc' ? ' grace="acc"' : ' grace="unacc" stem.mod="1slash"';
  if (e.staff !== e.layerStaff) a += ` staff="${e.staff}"`;
  if (!inChord) { if (e.tieStart && e.tieEnd) a += ' tie="m"'; else if (e.tieStart) a += ' tie="i"'; else if (e.tieEnd) a += ' tie="t"'; }
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

if (typeof module !== 'undefined') module.exports = { setupPiece, buildModel, analyzeHarmony, computeAccidentals, buildMEI, noteRole, helmholtz, keyName, beatAt, get MEASURE() { return MEASURE; }, get BEAT() { return BEAT; } };
