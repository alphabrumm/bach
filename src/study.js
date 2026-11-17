
// =====================================================================
//  Studierplätze: Notenlesen (mit Klaviatur) und Harmonien bestimmen
// =====================================================================
let stTk = null;
async function studyToolkit() { await initVerovio(); stTk = stTk || new verovio.toolkit(); return stTk; }
const MEI_HEAD = '<?xml version="1.0" encoding="UTF-8"?><mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="4.0.1"><meiHead><fileDesc><titleStmt><title/></titleStmt><pubStmt/></fileDesc></meiHead><music><body><mdiv><score>';
const MEI_FOOT = '</section></score></mdiv></body></music></mei>';
const NATS = [0, 2, 4, 5, 7, 9, 11], LETTERS = 'cdefgab';
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
function loadStore(k, d) { try { return Object.assign(d, JSON.parse(localStorage.getItem(k) || '{}')); } catch (e) { return d; } }
function saveStore(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
const fmtS = s => s < 10 ? s.toFixed(1).replace('.', ',') + ' s' : Math.round(s) + ' s';

// ---------- Klaviatur ----------
// lo/hi: MIDI-Grenzen (weiße Tasten); onPress(midi)
function makeKeyboard(el, lo, hi, onPress) {
  const whites = []; for (let m = lo; m <= hi; m++) if (NATS.includes(m % 12)) whites.push(m);
  const W = 100 / whites.length;
  let h = '<div class="kb">';
  whites.forEach((m, i) => { h += `<button class="wk" data-m="${m}" style="left:${i * W}%;width:${W}%">${m % 12 === 0 ? `<i>c${m / 12 - 4 >= 0 ? "'".repeat(m / 12 - 4) : ''}</i>` : ''}<b></b></button>`; });
  whites.forEach((m, i) => { if (m + 1 <= hi && !NATS.includes((m + 1) % 12)) h += `<button class="bk" data-m="${m + 1}" style="left:${(i + 1) * W - W * 0.32}%;width:${W * 0.64}%"><b></b></button>`; });
  el.innerHTML = h + '</div>';
  const kb = el.firstChild;
  kb.addEventListener('pointerdown', e => { const k = e.target.closest('[data-m]'); if (!k) return; e.preventDefault(); onPress(+k.dataset.m); });
  return {
    set(m, cls, on = true) { const k = kb.querySelector(`[data-m="${m}"]`); if (k) k.classList.toggle(cls, on); },
    label(m, txt) { const k = kb.querySelector(`[data-m="${m}"] b`); if (k) k.textContent = txt || ''; },
    clear(...cls) { kb.querySelectorAll('[data-m]').forEach(k => { k.classList.remove(...cls); if (cls.includes('lab')) k.querySelector('b').textContent = ''; }); },
    names(on) { kb.classList.toggle('names', on); kb.querySelectorAll('[data-m]').forEach(k => { const m = +k.dataset.m, pc = m % 12; k.querySelector('b').dataset.n = on ? ['c', 'cis', 'd', 'es', 'e', 'f', 'fis', 'g', 'as', 'a', 'b', 'h'][pc] : ''; }); },
  };
}

// ---------- Notenlesen ----------
const RD = loadStore('bach.read', { cfg: { clef: 'G', what: 'ton', range: 'staff', acc: 'keine', mode: 'ueben', oct: true, names: false }, best: {}, notes: {}, total: { ok: 0, bad: 0 } });
const RD_RANGE = { G: { staff: [30, 38], ledger: [25, 42] }, F: { staff: [18, 26], ledger: [14, 30] } };   // Diatonische Nummern: Oktave*7 + Stufe
const dnMidi = (dn, alt) => 12 * (Math.floor(dn / 7) + 1) + NATS[((dn % 7) + 7) % 7] + alt;
let rdPressed = [], rdTask = null, rdSel = new Set(), rdKb = null, rdLock = false, rdRun = null;
function rdCfgKey() { const c = RD.cfg; return [c.clef, c.what, c.range, c.acc, c.oct ? 'o' : 'p'].join('|'); }
function rdSigAlt(step, fifths) { return fifths > 0 && [3, 0, 4, 1, 5, 2, 6].slice(0, fifths).includes(step) ? 1 : fifths < 0 && [6, 2, 5, 1, 4, 0, 3].slice(0, -fifths).includes(step) ? -1 : 0; }
function rdGenerate() {
  const c = RD.cfg, clef = c.clef === 'beide' ? pick(['G', 'F']) : c.clef, [lo, hi] = RD_RANGE[clef][c.range];
  const fifths = c.acc === 'tonart' ? pick([-4, -3, -2, -1, 1, 2, 3, 4]) : 0;
  const altFor = step => {
    if (c.acc === 'tonart') return rdSigAlt(step, fifths);
    if (c.acc !== 'frei' || Math.random() > 0.35) return 0;
    let a = pick([-1, 1]); if ((step === 2 || step === 6) && a === 1) a = -1; if ((step === 0 || step === 3) && a === -1) a = 1; return a;
  };
  // Häufig verwechselte Töne kommen öfter dran (Gewicht nach Fehlerquote)
  const weight = dn => { const s = RD.notes[clef + dn]; return s ? 1 + 4 * (s.bad + 1) / (s.ok + s.bad + 2) : 1.6; };
  const choose = (a, b) => { const pool = []; for (let d = a; d <= b; d++) pool.push([d, weight(d)]); let r = Math.random() * pool.reduce((x, y) => x + y[1], 0);
    for (const [d, w] of pool) { if ((r -= w) <= 0) return d; } return b; };
  let dns;
  if (c.what === 'ton') dns = [choose(lo, hi)];
  else if (c.what === 'intervall') { const iv = 1 + Math.floor(Math.random() * 7), a = choose(lo, hi - iv); dns = [a, a + iv]; }
  else { const r = choose(lo, hi - 4), inv = Math.floor(Math.random() * 3); dns = [r, r + 2, r + 4]; for (let k = 0; k < inv; k++) dns.push(dns.shift() + 7); if (dns[2] > hi + 2) dns = [r, r + 2, r + 4]; }
  const notes = dns.map(dn => { const step = ((dn % 7) + 7) % 7; return { dn, step, oct: Math.floor(dn / 7), alt: altFor(step) }; });
  if (c.what === 'dreiklang' && c.acc === 'frei') {   // freie Akkorde: Dur, Moll, vermindert, übermäßig
    const base = notes.find(n => notes.every(x => [0, 2, 4].includes(((x.dn - n.dn) % 7 + 7) % 7))) || notes[0], q = pick([[4, 7], [3, 7], [3, 6], [4, 8]]);
    const rootMidi = dnMidi(base.dn, base.alt);
    notes.forEach(n => { if (n !== base && ![2, 4].includes(((n.dn - base.dn) % 7 + 7) % 7)) n.alt = base.alt; });
    notes.forEach(n => { const deg = ((n.dn - base.dn) % 7 + 7) % 7; if (deg === 2 || deg === 4) { const want = (rootMidi + (deg === 2 ? q[0] : q[1])) % 12, nat = dnMidi(n.dn, 0) % 12; let a = ((want - nat) % 12 + 12) % 12; if (a > 6) a -= 12; n.alt = a; } });
  }
  notes.forEach(n => { n.midi = dnMidi(n.dn, n.alt); });
  return { clef, fifths, notes, at: performance.now() };
}
async function rdRender() {
  const t = rdTask, box = $('#rdStaff');
  let tk; try { tk = await studyToolkit(); } catch (e) { box.innerHTML = '<div class="small">Notenbild nicht verfügbar.</div>'; return; }
  if (t !== rdTask) return;
  const ACC = { '-2': 'ff', '-1': 'f', 0: 'n', 1: 's', 2: 'x' }, seen = {};
  const nt = n => { const k = n.step + '_' + n.oct, cur = k in seen ? seen[k] : rdSigAlt(n.step, t.fifths), a = n.alt !== cur; seen[k] = n.alt;
    return `<note pname="${LETTERS[n.step]}" oct="${n.oct}"${a ? ` accid="${ACC[n.alt]}"` : ''}/>`; };
  const ks = t.fifths === 0 ? '0' : Math.abs(t.fifths) + (t.fifths > 0 ? 's' : 'f');
  const body = t.notes.length === 1 ? nt(t.notes[0]).replace('<note ', '<note xml:id="rdn" dur="1" ') : `<chord xml:id="rdn" dur="1">${t.notes.map(nt).join('')}</chord>`;
  const mei = MEI_HEAD + `<scoreDef key.sig="${ks}"><staffGrp><staffDef n="1" lines="5" clef.shape="${t.clef}" clef.line="${t.clef === 'G' ? 2 : 4}"/></staffGrp></scoreDef><section>` +
    `<measure n="1" right="invis"><staff n="1"><layer n="1">${body}</layer></staff></measure>` + MEI_FOOT;
  tk.setOptions({ pageWidth: 900, pageHeight: 3000, adjustPageHeight: true, adjustPageWidth: true, scale: 70, header: 'none', footer: 'none', pageMarginLeft: 20, pageMarginRight: 20, pageMarginTop: 60, pageMarginBottom: 60, svgViewBox: true, smuflTextFont: 'embedded' });
  tk.loadData(mei); box.innerHTML = tk.renderToSVG(1);
}
function rdNext() {
  rdTask = rdGenerate(); rdSel.clear(); rdPressed = []; rdLock = false;
  rdKb.clear('down', 'ok', 'bad', 'hint', 'lab');
  $('#rdMsg').innerHTML = { ton: 'Welcher Ton ist das? Tippe die Taste.', intervall: 'Tippe beide Töne.', dreiklang: 'Tippe alle drei Töne des Akkords.' }[RD.cfg.what] +
    (RD.cfg.oct ? '' : ' <span class="small">(Oktave egal)</span>');
  rdRender();
}
const rdName = n => helmholtz({ step: n.step, alter: n.alt, oct: n.oct });
function rdPress(m) {
  if (!rdTask || rdLock) return;
  audio.ensure(); audio.note(m, audio.now() + 0.01, 0.6, 0.55, 1);
  const need = rdTask.notes.length, key = RD.cfg.oct ? m : m % 12;
  if (rdSel.has(key)) { rdSel.delete(key); rdKb.set(m, 'down', false); rdPressed = rdPressed.filter(x => (RD.cfg.oct ? x : x % 12) !== key); return; }
  rdSel.add(key); rdKb.set(m, 'down'); rdPressed.push(m);
  if (rdSel.size < need && need > 1) return;
  // auswerten
  const want = rdTask.notes.map(n => RD.cfg.oct ? n.midi : ((n.midi % 12) + 12) % 12);
  const ok = want.every(w => rdSel.has(w)) && rdSel.size === want.length, dt = (performance.now() - rdTask.at) / 1000;
  const st = RD.notes[rdTask.clef + rdTask.notes[0].dn] = RD.notes[rdTask.clef + rdTask.notes[0].dn] || { ok: 0, bad: 0 };
  if (ok) st.ok++; else st.bad++;
  RD.total[ok ? 'ok' : 'bad']++;
  if (rdRun) { rdRun[ok ? 'ok' : 'bad']++; if (ok) { rdRun.streak++; rdRun.best = Math.max(rdRun.best, rdRun.streak); rdRun.times.push(dt); } else rdRun.streak = 0; }
  saveStore('bach.read', RD);
  rdLock = true;
  const names = rdTask.notes.map(rdName).join(' – ');
  // Tasten einfärben: gedrückte richtig grün / falsch rot, nicht gefundene als Hinweis
  rdKb.clear('down');
  const pcOf = x => ((x % 12) + 12) % 12, hit = x => RD.cfg.oct ? want.includes(x) : want.includes(pcOf(x));
  rdPressed.forEach(x => rdKb.set(x, hit(x) ? 'ok' : 'bad'));
  rdTask.notes.forEach(n => { const found = rdPressed.some(x => RD.cfg.oct ? x === n.midi : pcOf(x) === pcOf(n.midi)); if (!found) rdKb.set(n.midi, 'hint'); });
  rdTask.notes.forEach(n => rdKb.label(n.midi, germanStepName(n.step, n.alt)));
  let extra = '';
  if (rdTask.notes.length === 3) extra = ' · ' + triadName(rdTask.notes);
  if (rdTask.notes.length === 2) extra = ' · ' + intervalName(rdTask.notes[0], rdTask.notes[1]);
  $('#rdMsg').innerHTML = ok ? `<span class="okc">Richtig</span> – ${names}${extra} <span class="small">(${fmtS(dt)})</span>` : `<span class="badc">Nicht ganz</span> – richtig wäre: <b>${names}</b>${extra}`;
  if (!ok) { audio.ensure(); rdTask.notes.forEach((n, i) => audio.note(n.midi, audio.now() + 0.25 + i * 0.12, 0.9, 0.5, 1)); }
  rdStats();
  setTimeout(() => { if (rdRun && rdRun.over) return; rdNext(); }, ok ? (RD.cfg.mode === 'sprint' ? 280 : 650) : (RD.cfg.mode === 'sprint' ? 1300 : 2300));
}
function intervalName(a, b) {
  const steps = b.dn - a.dn, semi = b.midi - a.midi;
  const N = ['Prime', 'Sekunde', 'Terz', 'Quarte', 'Quinte', 'Sexte', 'Septime', 'Oktave'];
  const perfect = [0, 3, 4, 7].includes(steps), ref = [0, 2, 4, 5, 7, 9, 11, 12][steps], d = semi - ref;
  const q = perfect ? { '-1': 'verminderte', 0: 'reine', 1: 'übermäßige' }[d] : { '-2': 'verminderte', '-1': 'kleine', 0: 'große', 1: 'übermäßige' }[d];
  return (q ? q + ' ' : '') + N[steps];
}
function triadName(ns) {
  // Grundton: der Ton, über dem die anderen in Terzen liegen
  const s = ns.slice().sort((a, b) => a.dn - b.dn);
  for (const r of s) {
    const rel = s.map(n => ((n.dn - r.dn) % 7 + 7) % 7).sort();
    if (rel.join() !== '0,2,4') continue;
    const third = s.find(n => ((n.dn - r.dn) % 7 + 7) % 7 === 2), fifth = s.find(n => ((n.dn - r.dn) % 7 + 7) % 7 === 4);
    const i3 = ((third.midi - r.midi) % 12 + 12) % 12, i5 = ((fifth.midi - r.midi) % 12 + 12) % 12;
    const q = i3 === 4 && i5 === 7 ? 'Dur' : i3 === 3 && i5 === 7 ? 'Moll' : i3 === 3 && i5 === 6 ? 'vermindert' : i3 === 4 && i5 === 8 ? 'übermäßig' : '?';
    const nm = germanStepName(r.step, r.alt), bass = s[0];
    const inv = bass === r ? 'Grundstellung' : bass === third ? 'Sextakkord' : 'Quartsextakkord';
    return (q === 'Dur' ? nm[0].toUpperCase() + nm.slice(1) + '-Dur' : q === 'Moll' ? nm + '-Moll' : nm + ' ' + q) + ', ' + inv;
  }
  return '';
}
function rdStats() {
  const c = RD.cfg, run = rdRun, best = RD.best[rdCfgKey()];
  let h = '';
  if (run) {
    const avg = run.times.length ? run.times.reduce((a, b) => a + b, 0) / run.times.length : 0;
    h += `<div class="stat"><b>${run.ok}</b><span>richtig</span></div><div class="stat"><b>${run.bad}</b><span>Fehler</span></div>` +
      `<div class="stat"><b>${run.best}</b><span>beste Serie</span></div><div class="stat"><b>${avg ? fmtS(avg) : '–'}</b><span>Ø Zeit</span></div>`;
    if (c.mode === 'sprint') h += `<div class="stat"><b id="rdClock">${Math.max(0, Math.ceil(run.left))}</b><span>Sekunden</span></div>`;
  }
  if (best) h += `<div class="stat dim"><b>${best}</b><span>Rekord (60 s)</span></div>`;
  $('#rdStats').innerHTML = h;
  // schwierigste Töne
  const list = Object.entries(RD.notes).filter(([k, s]) => s.ok + s.bad >= 3 && k[0] === (c.clef === 'beide' ? k[0] : c.clef))
    .map(([k, s]) => ({ clef: k[0], dn: +k.slice(1), rate: s.bad / (s.ok + s.bad), n: s.ok + s.bad })).filter(x => x.rate > 0).sort((a, b) => b.rate - a.rate).slice(0, 6);
  $('#rdWeak').innerHTML = list.length ? 'Häufigste Fehler: ' + list.map(x => `<span>${helmholtz({ step: ((x.dn % 7) + 7) % 7, alter: 0, oct: Math.floor(x.dn / 7) })} <i>${x.clef === 'G' ? '𝄞' : '𝄢'} ${Math.round(100 * x.rate)} %</i></span>`).join('') +
    ' <span class="small">– diese Töne kommen öfter dran.</span>' : '';
}
function rdStart() {
  clearInterval(rdStart.t);
  rdRun = { ok: 0, bad: 0, streak: 0, best: 0, times: [], left: 60, over: false };
  if (RD.cfg.mode === 'sprint') {
    const t0 = performance.now();
    rdStart.t = setInterval(() => {
      rdRun.left = 60 - (performance.now() - t0) / 1000;
      const el = $('#rdClock'); if (el) el.textContent = Math.max(0, Math.ceil(rdRun.left));
      if (rdRun.left <= 0) { clearInterval(rdStart.t); rdRun.over = true; rdLock = true;
        const k = rdCfgKey(), old = RD.best[k] || 0, score = rdRun.ok - rdRun.bad;
        if (score > old) { RD.best[k] = score; saveStore('bach.read', RD); }
        $('#rdMsg').innerHTML = `<b>Zeit um!</b> ${rdRun.ok} richtig, ${rdRun.bad} Fehler – Wertung ${score}${score > old ? ' · <span class="okc">neuer Rekord!</span>' : old ? ` (Rekord ${old})` : ''}. <button class="pill" data-rd="start">Noch einmal</button>`;
        rdStats(); }
    }, 200);
  }
  rdStats(); rdNext();
}
function rdSetup() {
  const c = RD.cfg;
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-rdc="${k}:${v}" class="${String(c[k]) === String(v) ? 'act' : ''}">${l}</button>`).join('')}</div>`;
  $('#rdCfg').innerHTML =
    `<div class="opt"><span>Schlüssel</span>${seg('clef', [['G', 'Violin'], ['F', 'Bass'], ['beide', 'gemischt']])}</div>` +
    `<div class="opt"><span>Aufgabe</span>${seg('what', [['ton', 'Einzeltöne'], ['intervall', 'Intervalle'], ['dreiklang', 'Dreiklänge']])}</div>` +
    `<div class="opt"><span>Umfang</span>${seg('range', [['staff', 'im System'], ['ledger', 'mit Hilfslinien']])}</div>` +
    `<div class="opt"><span>Vorzeichen</span>${seg('acc', [['keine', 'keine'], ['tonart', 'Tonarten'], ['frei', 'Versetzungszeichen']])}</div>` +
    `<div class="opt"><span>Modus</span>${seg('mode', [['ueben', 'Üben'], ['sprint', '60-Sekunden-Sprint']])}</div>` +
    `<div class="opt"><span>Oktave</span>${seg('oct', [['true', 'genau'], ['false', 'egal']])}</div>` +
    `<div class="opt"><span>Tastennamen</span>${seg('names', [['false', 'aus'], ['true', 'ein']])}</div>`;
  const [lo, hi] = c.clef === 'F' ? [36, 64] : c.clef === 'G' ? [55, 84] : [36, 84];
  rdKb = makeKeyboard($('#rdKb'), lo, hi, rdPress); rdKb.names(c.names);
}
$('#rdCfg').addEventListener('click', e => {
  const b = e.target.closest('[data-rdc]'); if (!b) return;
  const [k, v] = b.dataset.rdc.split(':'); RD.cfg[k] = v === 'true' ? true : v === 'false' ? false : v; saveStore('bach.read', RD);
  rdSetup(); if (k !== 'names') rdStart(); else rdStats();
});
$('#readView').addEventListener('click', e => { const b = e.target.closest('[data-rd]'); if (b && b.dataset.rd === 'start') rdStart(); });
$('#readBack').onclick = () => { clearInterval(rdStart.t); show('library'); };
function openRead() { show('readView'); rdSetup(); rdStart(); }

// ---------- Harmonien bestimmen ----------
const HB = loadStore('bach.hb', { cfg: { book: 'all', level: 1, lab: 'stufen' }, cat: {}, total: { ok: 0, bad: 0 } });
const hbCache = {};
let hbTask = null, hbBusy = false;
const HB_LEVEL = {
  1: { t: 'Hauptstufen', d: 'I, IV, V (T, S, D) und V7', ok: r => /^(I|i|IV|iv|V|V7)$/.test(r) },
  2: { t: 'Alle Stufen', d: 'alle leitereigenen Dreiklänge und Septakkorde', ok: r => !/[/♭♯(]/.test(r) },
  3: { t: 'Mit Zwischendominanten', d: 'auch V/x, vii°/x und leiterfremde Klänge', ok: r => true },
};
async function hbPiece(id) {
  if (!hbCache[id]) hbCache[id] = await fetch('pieces/' + id + '.json').then(r => r.json());
  return hbCache[id];
}
// Zählzeiten, die sich gut zum Üben eignen: eindeutige Deutung (oder vom Nutzer bestätigt), kein Tonartwechsel daneben
function hbCandidates(P, M, H, level) {
  const out = [];
  H.beats.forEach((bt, i) => {
    const ch = bt.chord; if (!ch) return;
    const r = ch.roman.replace(/ \(.*\)$/, '');
    if (!HB_LEVEL[level].ok(r)) return;
    if (ch.roman.includes('picardische') && bt.measure < M.measures - 1) return;   // Dur-Tonika mitten im Moll-Stück ist meist eine Zwischendominante
    if (P.pickup && bt.measure === 1) return;
    const prev = H.beats[i - H.perMeasure], next = H.beats[i + H.perMeasure];
    const same = (a, b) => a && b && a.key.tonic === b.key.tonic && a.key.minor === b.key.minor;
    if ((prev && !same(prev, bt)) || (next && !same(next, bt))) return;
    if (!ch.own) {
      const ev = ch.ev; if (!ev || ev.top <= 0) return;
      const second = ev.cands.find(c => !(c.root === ch.root && c.q === ch.q) && !(c.q === 'dim7' && ch.q === 'dim7'));
      if (second && second.score / ev.top > 0.62) return;
      if (!ev.w[ch.root] || !ev.w[ch.pcs[1]]) return;   // Grundton und Terz müssen erklingen
    }
    out.push(i);
  });
  return out;
}
async function hbNext() {
  if (hbBusy) return; hbBusy = true;
  $('#hbMsg').innerHTML = 'Suche eine passende Stelle …'; $('#hbOpts').innerHTML = ''; $('#hbAfter').innerHTML = '';
  try {
    const pool = catalog.filter(c => c.available !== false && c.book && (HB.cfg.book === 'all' || c.book === HB.cfg.book));
    for (let tries = 0; tries < 8; tries++) {
      const meta = pick(pool), P = await hbPiece(meta.id);
      const M = buildModel(P); computeAccidentals(M);
      let ov = null; try { ov = JSON.parse(localStorage.getItem('bach.harm.' + meta.id) || 'null'); } catch (e) {}
      const H = analyzeHarmony(M, ov);
      const cands = hbCandidates(P, M, H, HB.cfg.level); if (!cands.length) continue;
      const i = pick(cands);
      hbTask = { meta, P, M, H, i, bt: H.beats[i], at: performance.now() };
      await hbRender(); hbOptions(); break;
    }
    if (!hbTask) $('#hbMsg').textContent = 'Keine passende Stelle gefunden.';
  } catch (e) { console.warn(e); $('#hbMsg').textContent = 'Stück konnte nicht geladen werden.'; }
  hbBusy = false;
}
// Notenausschnitt: Zieltakt mit Nachbartakten, Töne der gefragten Zählzeit farbig
function hbExcerpt(t) {
  const { P, bt } = t, Mt = P.measureTicks, short = Mt <= 48;
  const a = Math.max(1, bt.measure - (short ? 2 : 1)), b = Math.min(P.measures, bt.measure + 1);
  const t0 = (a - 1) * Mt, t1 = b * Mt;
  const clefs = P.staffClefs.map(c => c.slice());
  (P.clefChanges || []).filter(c => c.t <= t0 + 1e-6).forEach(c => { clefs[c.staff - 1] = [c.shape, c.line]; });
  const events = P.events.filter(e => e.t >= t0 - 1e-6 && e.t < t1 - 1e-6).map(e => { const x = Object.assign({}, e, { t: e.t - t0 }); if (x.t < Mt && x.te) delete x.te; return x; });
  const E = Object.assign({}, P, { events, measures: b - a + 1, pickup: 0, staffClefs: clefs, repeats: [], clefChanges: (P.clefChanges || []).filter(c => c.t > t0 && c.t < t1).map(c => Object.assign({}, c, { t: c.t - t0 })) });
  return { E, a, b, t0 };
}
async function hbRender() {
  const t = hbTask, box = $('#hbStaff');
  let tk; try { tk = await studyToolkit(); } catch (e) { box.innerHTML = '<div class="small">Notenbild nicht verfügbar.</div>'; return; }
  const ex = hbExcerpt(t), EM = buildModel(ex.E); computeAccidentals(EM); t.ex = ex; t.EM = EM;
  const mei = buildMEI(EM, { beats: [], perMeasure: 1 }, { harm: false, ghosts: false, mOff: ex.a - 1 });
  const w = Math.max(320, box.clientWidth), scale = w < 600 ? 34 : 40;
  tk.setOptions({ pageWidth: Math.round(w * 100 / scale), pageHeight: 60000, adjustPageHeight: true, scale, breaks: 'auto', header: 'none', footer: 'none',
    pageMarginLeft: 20, pageMarginRight: 20, pageMarginTop: 40, pageMarginBottom: 20, svgViewBox: false, smuflTextFont: 'embedded' });
  tk.loadData(mei); box.innerHTML = tk.renderToSVG(1);
  const from = t.bt.from - ex.t0, to = t.bt.to - ex.t0;
  EM.notes.filter(n => n.onset < to - 1e-6 && n.onset + n.ticks > from + 1e-6).forEach(n => { const el = document.getElementById(n.id); if (el) el.classList.add('tgt'); });
  setupPiece(t.P);   // Globale Taktmaße wieder auf das ganze Stück
  const pk = pieceKey(t.P), kn = pk.tonic === t.bt.key.tonic && pk.minor === t.bt.key.minor && t.meta.keyName ? t.meta.keyName : keyName(t.bt.key), lab = HB.cfg.lab === 'funk' ? 'Funktion' : 'Stufe';
  $('#hbMsg').innerHTML = `<b>${t.meta.title}</b> <span class="small">${t.meta.keyName || ''} · BWV ${t.meta.bwv}</span><br>` +
    `Welche ${lab} erklingt in <b>Takt ${t.P.pickup ? t.bt.measure - 1 : t.bt.measure}</b>, Zählzeit ${t.bt.beat + 1}? <span class="small">(farbig markiert, Tonart: ${kn})</span>`;
}
function hbLabel(ch) { return (HB.cfg.lab === 'funk' ? ch.func : ch.roman).replace(/ \(.*\)$/, ''); }
function hbOptions() {
  const t = hbTask, { M, bt } = t, ch = bt.chord, key = bt.key, correct = hbLabel(ch);
  setupPiece(t.P);
  const cand = [];
  // nur sinnvolle Verwechslungen: im gewählten Niveau erlaubt, leitereigen oder (ab Niveau 3) Zwischendominante
  const add = (root, q) => { try { const c = makeChord(M, bt, root, q), l = hbLabel(c), r = c.roman.replace(/ \(.*\)$/, '');
    if (HB.cfg.level > 1 && !HB_LEVEL[HB.cfg.level].ok(r) || !(isDiatonic(c, key) || (HB.cfg.level >= 3 && r.includes('/')))) return;
    if (HB.cfg.level === 1 && !/^(I|i|IV|iv|V|V7|ii|vi|VI|III|iii)$/.test(r)) return;
    if (l && l !== correct && !cand.some(x => x.l === l)) cand.push({ l, c }); } catch (e) {} };
  // plausible Verwechslungen zuerst (die nächstbesten Deutungen der App), dann leitereigene Stufen
  ((ch.ev || (bt.auto && bt.auto.ev) || {}).cands || []).forEach(c => add(c.root, c.q));
  const sc = [...scaleSet(key)].sort((x, y) => ((x - key.tonic + 12) % 12) - ((y - key.tonic + 12) % 12));
  shuffle(sc.slice()).forEach(r => add(r, diatonicQuality(r, key)));
  if (HB.cfg.level >= 2) [7, 2, 11, 9, 5].forEach(iv => add((key.tonic + iv) % 12, iv === 7 ? 'dom7' : iv === 11 ? (key.minor ? 'dim7' : 'hdim7') : key.minor ? (iv === 2 ? 'hdim7' : 'min7') : (iv === 5 ? 'maj' : 'min7')));
  if (HB.cfg.level === 1) [0, 5, 7, 2, 9].forEach(iv => add((key.tonic + iv) % 12, iv === 7 ? (Math.random() < .5 ? 'maj' : 'dom7') : diatonicQuality((key.tonic + iv) % 12, key)));
  if (HB.cfg.level >= 3) [2, 9, 4].forEach(iv => add((key.tonic + iv) % 12, 'dom7'));
  const opts = shuffle([{ l: correct, ok: true }].concat(cand.slice(0, 5)));
  $('#hbOpts').innerHTML = opts.map(o => `<button data-hb="ans" data-l="${o.l.replace(/"/g, '&quot;')}">${o.l}</button>`).join('');
}
function hbAnswer(btn) {
  const t = hbTask; if (!t || t.done) return;
  t.done = true;
  const correct = hbLabel(t.bt.chord), ok = btn.dataset.l === correct;
  $$('#hbOpts button').forEach(b => { b.disabled = true; if (b.dataset.l === correct) b.classList.add('ok'); });
  if (!ok) btn.classList.add('bad');
  const cat = correct.replace(/[0-9°øv]+$/, '').replace(/\/.*/, '/x') || correct;
  HB.cat[cat] = HB.cat[cat] || { ok: 0, bad: 0 }; HB.cat[cat][ok ? 'ok' : 'bad']++; HB.total[ok ? 'ok' : 'bad']++; saveStore('bach.hb', HB);
  // Erklärung: die Texte aus der Notenansicht, mit den Daten dieses Stücks
  const sv = [model, harmony, piece]; let txt = '';
  try { setupPiece(t.P); model = t.M; harmony = t.H; piece = t.P; txt = explainChord(t.bt); } catch (e) { txt = ''; } finally { [model, harmony, piece] = sv; }
  const own = t.bt.chord.own ? ' <span class="owntag">(deine eigene Deutung)</span>' : '';
  $('#hbAfter').innerHTML = `<div class="${ok ? 'okc' : 'badc'}" style="font-size:19px">${ok ? 'Richtig!' : 'Nicht ganz – gesucht war ' + correct}${own}</div>` +
    `<div style="margin:4px 0 8px">${t.bt.chord.name}: ${txt}</div>` +
    `<div class="plays"><button data-hb="chord">${IC.play}Akkord</button><button data-hb="play">${IC.play}Ausschnitt</button><button data-hb="open">Im Stück ansehen</button><button data-hb="next" class="primary">Weiter</button></div>` +
    `<div class="small" style="margin-top:6px">Die Lösung stammt von der automatischen Analyse. Wenn du anderer Meinung bist: „Im Stück ansehen“ → Stufe antippen → „Andere Deutung“. Deine Deutung gilt dann auch hier.</div>`;
  hbStats();
}
function hbPlay(what) {
  const t = hbTask; if (!t) return;
  audio.ensure(); const t0 = audio.now() + 0.05;
  if (what === 'chord') { const ch = t.bt.chord, b = 48 + ((ch.root - 48) % 12 + 12) % 12;
    audio.note(b - 12, t0, 1.6, 0.5, 3); ch.pcs.forEach((pc, i) => audio.note(60 + ((pc - 60) % 12 + 12) % 12, t0 + i * 0.06, 1.5, 0.45, 1)); return; }
  const sp = 60 / (72 * S.tempoPct / 75) / (t.P.tpw / 4);   // Sekunden pro Tick (Viertel ≈ 72 bei 75 %)
  const from = t.bt.from - t.ex.t0, to = t.bt.to - t.ex.t0;
  t.EM.notes.filter(n => !n.tieEnd).forEach(n => {
    audio.note(n.midi, t0 + n.onset * sp, Math.max(0.08, n.ticks * sp), n.onset < to && n.onset + n.ticks > from ? 0.62 : 0.45, n.role);
  });
}
function hbStats() {
  const tot = HB.total, all = tot.ok + tot.bad;
  const weak = Object.entries(HB.cat).filter(([, s]) => s.ok + s.bad >= 3).map(([k, s]) => ({ k, r: s.ok / (s.ok + s.bad), n: s.ok + s.bad })).sort((a, b) => a.r - b.r).slice(0, 5);
  $('#hbStats').innerHTML = all ? `<div class="stat"><b>${tot.ok}</b><span>richtig</span></div><div class="stat"><b>${tot.bad}</b><span>Fehler</span></div><div class="stat"><b>${Math.round(100 * tot.ok / all)} %</b><span>Trefferquote</span></div>` +
    (weak.length ? `<div class="weak">Noch unsicher: ${weak.map(w => `<span>${w.k} <i>${Math.round(100 * w.r)} %</i></span>`).join('')}</div>` : '') : '';
}
function hbSetup() {
  const c = HB.cfg;
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-hbc="${k}:${v}" class="${String(c[k]) === String(v) ? 'act' : ''}">${l}</button>`).join('')}</div>`;
  $('#hbCfg').innerHTML =
    `<div class="opt"><span>Stücke</span>${seg('book', [['all', 'alle'], ['inv', 'Inventionen'], ['wtk1', 'WTK I'], ['gold', 'Goldberg']])}</div>` +
    `<div class="opt"><span>Stufe</span>${seg('level', [[1, HB_LEVEL[1].t], [2, HB_LEVEL[2].t], [3, HB_LEVEL[3].t]])}</div>` +
    `<div class="opt"><span>Antworten als</span>${seg('lab', [['stufen', 'Stufen'], ['funk', 'Funktionen']])}</div>` +
    `<div class="small">${HB_LEVEL[c.level].d}</div>`;
}
$('#hbCfg').addEventListener('click', e => { const b = e.target.closest('[data-hbc]'); if (!b) return; const [k, v] = b.dataset.hbc.split(':'); HB.cfg[k] = k === 'level' ? +v : v; saveStore('bach.hb', HB); hbSetup(); hbTask = null; hbNext(); });
$('#harmStudy').addEventListener('click', async e => {
  const b = e.target.closest('[data-hb]'); if (!b) return; const a = b.dataset.hb;
  if (a === 'ans') hbAnswer(b);
  else if (a === 'next') { hbTask = null; hbNext(); }
  else if (a === 'chord' || a === 'play') hbPlay(a);
  else if (a === 'open') { const t = hbTask; await openPiece(t.meta.id); setTimeout(() => { endMarkMode(); selectMeasure(t.bt.measure); }, 400); }
});
$('#harmBack').onclick = () => show('library');
function openHarm() { show('harmView'); hbSetup(); hbStats(); if (!hbTask) hbNext(); }
window.__st = { rd: () => rdTask, hb: () => hbTask, rdNext, triadName };   // für Tests
