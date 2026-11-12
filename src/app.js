// ===================== App =====================
(function () {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// ---------- Modell & Analyse ----------
const model = buildModel(DATA);
computeAccidentals(model);
const harmony = analyzeHarmony(model);
const evById = new Map(model.events.map(e => [e.id, e]));
const playable = model.notes.filter(n => !n.tieEnd).sort((a, b) => a.onset - b.onset || a.voice - b.voice);
const TOTAL = model.measures * MEASURE;
const VOICE_NAMES = { 1: 'Sopran', 2: 'Alt', 3: 'Bass' };
const VOICE_COLORS = { 1: 'var(--v1)', 2: 'var(--v2)', 3: 'var(--v3)' };
const DUR_NAMES = { '1': 'Ganze', '2': 'Halbe', '4': 'Viertel', '8': 'Achtel', '16': 'Sechzehntel' };

// ---------- Einstellungen ----------
const DEFAULTS = { col: 'voices', harm: true, ghosts: true, zoom: 1, tempoPct: 75, instr: 'grand', mute: [], sampleBase: 'https://tonejs.github.io/audio/salamander/' };
let S = Object.assign({}, DEFAULTS);
try { Object.assign(S, JSON.parse(localStorage.getItem('bach.settings') || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem('bach.settings', JSON.stringify(S)); } catch (e) {} };

function toast(msg, ms = 2200) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms); }

// ---------- Ansichten ----------
function show(id) { $$('.view').forEach(v => v.classList.toggle('show', v.id === id)); hideCards(); }
function hideCards() { $('#info').classList.remove('show'); $('#viewPanel').classList.remove('show'); }

// Scroll-Bereiche nie ganz oben/unten (Safari-Wischgeste beendet sonst das Vollbild)
function keepOffEdges(el) {
  const fix = () => {
    const max = el.scrollHeight - el.clientHeight;
    if (max < 4) return;
    if (el.scrollTop <= 0) el.scrollTop = 1;
    else if (el.scrollTop >= max) el.scrollTop = max - 1;
  };
  el.addEventListener('scroll', fix, { passive: true });
  el.addEventListener('touchstart', fix, { passive: true });
  setTimeout(fix, 300);
}
['#libScroll', '#tocScroll', '#scroller'].forEach(s => keepOffEdges($(s)));

$$('.fsBtn').forEach(b => b.addEventListener('click', () => {
  const d = document, el = d.documentElement;
  const inFs = d.fullscreenElement || d.webkitFullscreenElement;
  try {
    if (inFs) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  } catch (e) { toast('Vollbild wird hier nicht unterstützt'); }
}));

// ---------- Bibliothek ----------
const BOOKS = [
  { id: 'inv', t: 'Inventionen & Sinfonien', s: 'BWV 772–801', c: '#2f4a3a', active: true },
  { t: 'Das Wohltemperierte Klavier', s: 'Teil I · BWV 846–869', c: '#5b2626' },
  { t: 'Französische Suiten', s: 'BWV 812–817', c: '#273956' },
  { t: 'Goldberg-Variationen', s: 'BWV 988', c: '#4b3a26' },
];
$('#shelf').innerHTML = BOOKS.map((b, i) => `
  <button class="book linen ${b.active ? '' : 'dim'}" style="--c:${b.c}" data-i="${i}">
    <div class="frame"><div class="orn">❦</div><div class="t">${b.t}</div><div class="s">${b.s}</div><div class="orn">·</div></div>
    ${b.active ? '<div class="ribbon"></div>' : ''}
  </button>`).join('') + `<button class="book new" id="newBook"><div class="frame" style="border:0"><div class="t" style="font-size:40px">+</div><div class="s">Neues Notenbuch</div></div></button>`;
$('#shelf').addEventListener('click', e => {
  const b = e.target.closest('.book'); if (!b) return;
  if (b.id === 'newBook') return toast('Eigene Notenbücher kommen in einer späteren Version');
  const book = BOOKS[+b.dataset.i];
  if (!book.active) return toast('Dieses Buch ist noch in Vorbereitung');
  show('bookView');
});

// ---------- Inhalt ----------
const KEYS = ['C-Dur', 'c-Moll', 'D-Dur', 'd-Moll', 'Es-Dur', 'E-Dur', 'e-Moll', 'F-Dur', 'f-Moll', 'G-Dur', 'g-Moll', 'A-Dur', 'a-Moll', 'B-Dur', 'h-Moll'];
const tocEntry = (kind, i, bwv, on) => `<button class="entry ${on ? 'on' : 'off'}" ${on ? 'data-open="788"' : ''}>
  <span class="num">${kind} ${i + 1}</span><span>${KEYS[i]}</span><span class="dots"></span><span class="bwv">BWV ${bwv}</span></button>`;
$('#tocInv').innerHTML = KEYS.map((k, i) => tocEntry('Inventio', i, 772 + i, false)).join('');
$('#tocSin').innerHTML = KEYS.map((k, i) => tocEntry('Sinfonia', i, 787 + i, i === 1)).join('');
$('#bookView').addEventListener('click', e => {
  const en = e.target.closest('.entry'); if (!en) return;
  if (en.dataset.open) { show('scoreView'); ensureRendered(); }
  else toast('Dieses Stück ist noch nicht im Buch');
});
$('#tocBack').onclick = () => show('library');
$('#scoreBack').onclick = () => { stopPlayback(); show('bookView'); };

// ---------- Verovio ----------
let tk = null, verovioReady = null;
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}
function initVerovio() {
  if (verovioReady) return verovioReady;
  const urls = ['https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js',
    'https://cdn.jsdelivr.net/npm/verovio@4.3.1/dist/verovio-toolkit-wasm.js'];
  verovioReady = (async () => {
    for (const u of urls) {
      try {
        await loadScript(u);
        if (!window.verovio) continue;
        await new Promise(res => {
          const m = verovio.module;
          if (m.calledRun || (m.asm && m._malloc)) return res();
          const prev = m.onRuntimeInitialized;
          m.onRuntimeInitialized = () => { prev && prev(); res(); };
          setTimeout(res, 15000);
        });
        tk = new verovio.toolkit();
        return tk;
      } catch (e) { console.warn('Verovio-Quelle fehlgeschlagen', u, e); }
    }
    throw new Error('Verovio konnte nicht geladen werden');
  })();
  return verovioReady;
}

let rendered = false;
async function ensureRendered() {
  if (rendered) return;
  try { await initVerovio(); render(); rendered = true; }
  catch (e) { $('#loading').textContent = 'Der Notenstecher (Verovio) konnte nicht geladen werden. Bitte Internetverbindung prüfen.'; }
}

let layout = null;
function render() {
  const pageEl = $('#page');
  const w = Math.min($('#scroller').clientWidth, 1100);
  pageEl.style.width = w + 'px';
  const scale = Math.round(S.zoom * Math.max(28, Math.min(48, w / 19)));
  const mei = buildMEI(model, harmony, { harm: S.harm, ghosts: S.ghosts });
  tk.setOptions({
    pageWidth: Math.round(w * 100 / scale), pageHeight: 60000, adjustPageHeight: true, scale,
    breaks: 'auto', header: 'none', footer: 'none',
    pageMarginLeft: 40, pageMarginRight: 40, pageMarginTop: 30, pageMarginBottom: 40,
    spacingSystem: S.harm ? 10 : 6, svgViewBox: false,
  });
  tk.loadData(mei);
  let svg = '';
  const pc = tk.getPageCount();
  for (let p = 1; p <= pc; p++) svg += tk.renderToSVG(p, {});
  $('#score').innerHTML = svg;
  decorate();
  requestAnimationFrame(() => { computeLayout(); updateCursor(); markSelection(); });
}

function decorate() {
  const root = $('#score');
  for (const e of model.events) {
    if (e.type === 'space') continue;
    const el = document.getElementById(e.id);
    if (el) el.classList.add('v' + e.voice, 'st' + e.staff);
    if (e.ghost) { const g = document.getElementById('ga_' + e.id); if (g) g.classList.add('ghost'); }
  }
  root.querySelectorAll('g.beam').forEach(b => { const m = /^b(\d)_/.exec(b.id); if (m) b.classList.add('v' + m[1], 'st' + (m[1] === '3' ? 2 : 1)); });
  $('#scoreView').classList.remove('col-voices', 'col-hands');
  if (S.col !== 'none') $('#scoreView').classList.add('col-' + S.col);
}

// Positionen der Noten / Systeme / Takte für Antippen und Scrubbing
function computeLayout() {
  const pr = $('#page').getBoundingClientRect();
  const rel = r => ({ l: r.left - pr.left, r: r.right - pr.left, t: r.top - pr.top, b: r.bottom - pr.top });
  const systems = $$('#score g.system').map(s => rel(s.getBoundingClientRect()));
  const sysEls = $$('#score g.system');
  const measures = {};
  $$('#score g.measure').forEach(m => {
    const n = +m.id.slice(1); if (!n) return;
    // Takt-Rechteck: Systemlinien-Bereich (ohne Harmonik-Text darunter)
    const staves = m.querySelectorAll('g.staff');
    let r = rel(m.getBoundingClientRect());
    if (staves.length) { const a = rel(staves[0].getBoundingClientRect()), b = rel(staves[staves.length - 1].getBoundingClientRect()); r = { l: r.l, r: r.r, t: a.t, b: b.b }; }
    measures[n] = Object.assign(r, { sys: sysEls.indexOf(m.closest('g.system')) });
  });
  const heads = [];
  for (const e of model.events) {
    if (e.type === 'space') continue;
    const el = document.getElementById(e.id); if (!el) continue;
    const h = el.querySelector('.notehead') || el;
    const r = rel(h.getBoundingClientRect());
    if (!r.r && !r.l) continue;
    heads.push({ e, x: (r.l + r.r) / 2, y: (r.t + r.b) / 2 });
  }
  // Zeitachse je System: (t, x)-Stützpunkte
  const sysPts = systems.map(() => []);
  const firstX = new Map();
  heads.forEach(h => { if (h.e.staff !== h.e.layerStaff) return; const k = h.e.onset; if (!firstX.has(k) || h.x < firstX.get(k)) firstX.set(k, h.x); });
  for (let n = 1; n <= model.measures; n++) {
    const m = measures[n]; if (!m) continue;
    const pts = sysPts[m.sys];
    const t0 = (n - 1) * MEASURE;
    const inner = [...firstX.entries()].filter(([t]) => t >= t0 && t < t0 + MEASURE).sort((a, b) => a[0] - b[0]);
    if (!inner.length || inner[0][0] !== t0) pts.push({ t: t0, x: m.l + 12 });
    inner.forEach(([t, x]) => pts.push({ t, x }));
    pts.push({ t: t0 + MEASURE - 0.001, x: m.r - 6 });
  }
  sysPts.forEach(p => { p.sort((a, b) => a.t - b.t); for (let i = 1; i < p.length; i++) if (p[i].x < p[i - 1].x) p[i].x = p[i - 1].x; });
  layout = { systems, measures, heads, sysPts };
}
function tickToPos(t) {
  if (!layout) return null;
  t = Math.max(0, Math.min(TOTAL - 0.01, t));
  const m = layout.measures[Math.floor(t / MEASURE) + 1]; if (!m) return null;
  const pts = layout.sysPts[m.sys];
  let x = pts[0].x;
  for (let i = 0; i < pts.length - 1; i++) if (t >= pts[i].t && t <= pts[i + 1].t) {
    const a = pts[i], b = pts[i + 1]; x = a.x + (b.x - a.x) * ((t - a.t) / (b.t - a.t || 1)); break;
  } else if (t > pts[i + 1].t) x = pts[i + 1].x;
  const sys = layout.systems[m.sys];
  return { x, top: m.t - 6, h: m.b - m.t + 12, sys: m.sys };
}
function posToTick(x, y) {
  if (!layout) return 0;
  let si = 0, bd = 1e9;
  layout.systems.forEach((s, i) => { const d = y < s.t ? s.t - y : y > s.b ? y - s.b : 0; if (d < bd) { bd = d; si = i; } });
  const pts = layout.sysPts[si]; if (!pts.length) return 0;
  if (x <= pts[0].x) return pts[0].t;
  for (let i = 0; i < pts.length - 1; i++) if (x >= pts[i].x && x <= pts[i + 1].x) {
    const a = pts[i], b = pts[i + 1]; return a.t + (b.t - a.t) * ((x - a.x) / (b.x - a.x || 1));
  }
  return pts[pts.length - 1].t;
}

// ---------- Cursor & Auswahl ----------
let playhead = 0, selNote = null, selRange = null, loopOn = false;
let markAnchor = null, markUntil = 0, markTimer = null; // Markiermodus
function updateCursor() {
  const c = $('#cursor'), p = tickToPos(playhead);
  if (!p) { c.style.display = 'none'; return; }
  c.style.display = 'block'; c.style.left = p.x + 'px'; c.style.top = p.top + 'px'; c.style.height = p.h + 'px';
}
function markSelection() {
  $$('#score g.note.sel').forEach(el => el.classList.remove('sel'));
  if (selNote) { const el = document.getElementById(selNote.id); el && el.classList.add('sel'); }
  const ms = $('#msel');
  ms.innerHTML = '';
  if (!selRange || !layout) { ms.style.display = 'none'; return; }
  ms.style.display = 'block';
  ms.classList.toggle('pulse', Date.now() < markUntil);
  // Ein Rechteck je System, aufeinanderfolgende Takte zusammengefasst
  let cur = null;
  const flush = () => { if (!cur) return; const d = document.createElement('div'); d.className = 'r';
    Object.assign(d.style, { left: cur.l + 'px', top: (cur.t - 8) + 'px', width: (cur.r - cur.l) + 'px', height: (cur.b - cur.t + 16) + 'px' }); ms.appendChild(d); };
  for (let k = selRange.a; k <= selRange.b; k++) {
    const m = layout.measures[k]; if (!m) continue;
    if (cur && cur.sys === m.sys) { cur.r = m.r; cur.t = Math.min(cur.t, m.t); cur.b = Math.max(cur.b, m.b); }
    else { flush(); cur = { l: m.l, r: m.r, t: m.t, b: m.b, sys: m.sys }; }
  }
  flush();
}

// ---------- Info-Karte ----------
function beatLabel(e) {
  const b = Math.floor(e.pos / BEAT) + 1, sub = Math.floor((e.pos % BEAT) / 6) + 1, six = (e.pos % 6) / 3;
  return `Zählzeit ${b}` + (sub > 1 || six ? ` · ${sub}. Achtel${six ? ' +' : ''}` : '');
}
function durName(e) {
  let t = (e.dots ? 'punktierte ' : '') + DUR_NAMES[e.dur];
  if (e.tieStart) t += ' (übergebunden)';
  return t;
}
const ACC_SIGN = { '-1': '♭', '0': '♮', '1': '♯' };
function showNoteInfo(n) {
  const bt = harmony.beats[Math.floor(n.onset / BEAT)];
  const role = noteRole(n, harmony);
  const ch = bt.chord;
  let h = `<div class="lbl"><span class="vdot" style="background:${VOICE_COLORS[n.voice]}"></span>${VOICE_NAMES[n.voice]} · ${n.staff === 1 ? 'rechte' : 'linke'} Hand</div>
    <h4>${helmholtz(n)}</h4>
    <div class="row"><span class="k">Ort</span><span>Takt ${n.measure}, ${beatLabel(n)}</span></div>
    <div class="row"><span class="k">Dauer</span><span>${durName(n)}</span></div>
    <div class="row"><span class="k">Harmonie</span><span>${ch ? `${ch.name} – ${keyName(bt.key)}: <b>${ch.roman}</b>` : '–'}</span></div>
    <div class="row"><span class="k">Rolle</span><span>${role.text}</span></div>`;
  if (n.ghost) h += `<div class="ghostnote">⚠ Takt-gültiges Vorzeichen: Hier steht kein Zeichen, aber das ${ACC_SIGN[n.alter]} von weiter vorn im Takt gilt noch – also <b>${helmholtz(n)}</b>.</div>`;
  h += `<div class="btns"><button data-act="hear">♪ anhören</button><button data-act="from">▶ ab hier spielen</button><button data-act="measure">Takt ${n.measure}</button></div>`;
  openInfo(h, act => {
    if (act === 'hear') { audio.ensure(); audio.note(n.midi, audio.now() + 0.02, Math.min(1.5, n.playTicks * spt()) || 0.6, 0.8, n.voice); }
    if (act === 'from') startPlayback(n.onset);
    if (act === 'measure') selectMeasure(n.measure);
  });
}
function showRangeInfo() {
  const { a, b } = selRange, single = a === b;
  const bs = harmony.beats.filter(x => x.measure >= a && x.measure <= b);
  const keys = bs.map(x => keyName(x.key)).filter((k, i, arr) => i === 0 || k !== arr[i - 1]).join(' → ');
  const ghosts = model.notes.filter(n => n.measure >= a && n.measure <= b && n.ghost);
  const pulsing = Date.now() < markUntil;
  let h = `<div class="lbl">${single ? `Takt ${a} von ${model.measures}` : `Takte ${a}–${b} · ${b - a + 1} Takte markiert`}</div><h4>${keys}</h4>`;
  if (single) h += `<div class="beats">${bs.map((x, i) => `<div class="beat"><i>${i + 1}</i><b>${x.chord ? x.chord.roman : '–'}</b>${x.chord ? x.chord.name : ''}</div>`).join('')}</div>`;
  else h += `<div class="rangeharm">${[...new Set(bs.map(x => x.measure))].map(m => `<div><i>${m}</i> ${bs.filter(x => x.measure === m).map(x => x.chord ? x.chord.roman : '–').join(' · ')}</div>`).join('')}</div>`;
  if (ghosts.length) h += `<div class="ghostnote">⚠ ${ghosts.length} Ton${ghosts.length > 1 ? 'e' : ''} mit takt-gültigem Vorzeichen: ${ghosts.map(n => `${helmholtz(n)} (T. ${n.measure})`).join(', ')}</div>`;
  if (single && pulsing) h += `<div class="small" style="margin-top:6px">Markiermodus: Tippe jetzt auf einen anderen Takt, um bis dorthin zu markieren.</div>`;
  h += `<div class="btns"><button data-act="play">▶ ${single ? 'Takt' : 'Abschnitt'} spielen</button><button data-act="loop">${loopOn ? '⟲ Schleife aus' : '⟲ Schleife'}</button><button data-act="from">ab hier</button>${single ? '' : '<button data-act="clear">Markierung aufheben</button>'}</div>`;
  openInfo(h, act => {
    if (act === 'play') { loopOn = false; startPlayback((a - 1) * MEASURE, b * MEASURE); }
    if (act === 'loop') { loopOn = !loopOn; if (loopOn) startPlayback((a - 1) * MEASURE); else stopPlayback(); showRangeInfo(); }
    if (act === 'from') { loopOn = false; startPlayback((a - 1) * MEASURE); }
    if (act === 'clear') { clearSelection(); }
  });
}
function openInfo(html, onAct) {
  $('#viewPanel').classList.remove('show');
  $('#infoBody').innerHTML = html;
  $('#infoBody').onclick = e => { const b = e.target.closest('[data-act]'); if (b) onAct(b.dataset.act); };
  $('#info').classList.add('show');
}
$('#infoX').onclick = () => { $('#info').classList.remove('show'); };

function selectNote(n) { endMarkMode(); selNote = n; selRange = null; loopOn = false; playhead = n.onset; markSelection(); updateCursor(); showNoteInfo(n); }
function selectMeasure(m) {
  selNote = null;
  if (markAnchor != null && Date.now() < markUntil && m !== markAnchor) {
    // Markiermodus: vom ursprünglichen Takt bis zum angetippten Takt
    selRange = { a: Math.min(markAnchor, m), b: Math.max(markAnchor, m) };
    endMarkMode();
  } else {
    selRange = { a: m, b: m };
    markAnchor = m; markUntil = Date.now() + 2000;
    clearTimeout(markTimer);
    markTimer = setTimeout(() => { endMarkMode(); markSelection(); if ($('#info').classList.contains('show') && selRange && selRange.a === selRange.b) showRangeInfo(); }, 2000);
  }
  if (playing && loopOn) startPlayback((selRange.a - 1) * MEASURE);
  playhead = (selRange.a - 1) * MEASURE;
  markSelection(); updateCursor(); showRangeInfo();
}
function endMarkMode() { markAnchor = null; markUntil = 0; clearTimeout(markTimer); }
function clearSelection() { endMarkMode(); selRange = null; selNote = null; loopOn = false; markSelection(); $('#info').classList.remove('show'); }

// ---------- Gesten: Antippen & Scrubbing ----------
const pageEl = $('#page');
let g = null;
pageEl.addEventListener('pointerdown', e => {
  if (!layout) return;
  audio.ensure();
  const pr = pageEl.getBoundingClientRect();
  g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, scrub: false, lastTick: null, pr };
});
pageEl.addEventListener('pointermove', e => {
  if (!g || e.pointerId !== g.id) return;
  const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
  if (!g.scrub && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.3) {
    g.scrub = true; try { pageEl.setPointerCapture(e.pointerId); } catch (_) {}
    if (playing) stopPlayback();
    $('#info').classList.remove('show');
    selNote = null; markSelection();
  }
  if (g.scrub) {
    e.preventDefault();
    const pr = pageEl.getBoundingClientRect();
    const t = posToTick(e.clientX - pr.left, (g.y0 - g.pr.top));
    scrubTo(t);
  }
});
const endG = e => {
  audio.ensure();
  if (!g || e.pointerId !== g.id) return;
  if (!g.scrub && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < 10) tapAt(e.clientX - g.pr.left, e.clientY - g.pr.top);
  if (g.scrub) clearTimeout(holdTimer);
  g = null;
};
pageEl.addEventListener('pointerup', endG);
pageEl.addEventListener('pointercancel', () => { g = null; clearTimeout(holdTimer); });

function measureAt(x, y) {
  for (const [k, m] of Object.entries(layout.measures)) if (x >= m.l && x <= m.r && y >= m.t - 30 && y <= m.b + 30) return +k;
  return null;
}
function tapAt(x, y) {
  if (Date.now() < markUntil) { const mk = measureAt(x, y); if (mk) { selectMeasure(mk); return; } } // Markiermodus hat Vorrang
  let best = null, bd = 26;
  for (const h of layout.heads) { if (h.e.type !== 'note') continue; const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h.e; } }
  if (best) {
    const n = best.tieEnd ? findTieStart(best) : best;
    selectNote(best);
    audio.note(n.midi, audio.now() + 0.01, Math.min(1.2, n.playTicks * spt()), 0.8, n.voice);
    return;
  }
  for (const [k, m] of Object.entries(layout.measures)) {
    if (x >= m.l && x <= m.r && y >= m.t - 30 && y <= m.b + 30) { selectMeasure(+k); return; }
  }
  clearSelection(); hideCards();
}
function findTieStart(n) { let c = n; while (c.tieEnd && c.prev) c = c.prev; return c; }

let holdTimer = null;
function scrubTo(t) {
  const prev = playhead;
  playhead = t; updateCursor();
  const lo = Math.min(prev, t), hi = Math.max(prev, t);
  if (hi > lo) {
    const crossed = playable.filter(n => n.onset > lo && n.onset <= hi && !S.mute.includes(n.voice));
    crossed.slice(-6).forEach(n => audio.note(n.midi, audio.now() + 0.005, Math.min(0.5, n.ticks * spt()), 0.62, n.voice));
    flashNotes(crossed.map(n => n.id));
  }
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => { // Finger ruht: Zusammenklang erklingt
    const snd = playable.filter(n => n.onset <= playhead && n.onset + n.playTicks > playhead && !S.mute.includes(n.voice));
    snd.forEach(n => audio.note(n.midi, audio.now() + 0.01, 1.3, 0.5, n.voice));
    flashNotes(snd.map(n => n.id));
  }, 380);
}
let flashSet = [];
function flashNotes(ids) {
  flashSet.forEach(id => { const el = document.getElementById(id); el && el.classList.remove('on'); });
  flashSet = ids;
  ids.forEach(id => { const el = document.getElementById(id); el && el.classList.add('on'); });
}

// ---------- Audio ----------
const audio = {
  ctx: null, out: null, buffers: {}, loading: null, waves: {},
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = this.ctx = new AC();
      const master = ctx.createGain(); master.gain.value = 0.85;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
      master.connect(comp); comp.connect(ctx.destination);
      // Hall aus synthetischer Impulsantwort
      const len = ctx.sampleRate * 2.4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      const conv = ctx.createConvolver(); conv.buffer = ir;
      const wet = ctx.createGain(); wet.gain.value = 0.22;
      this.out = ctx.createGain(); this.out.connect(master); this.out.connect(conv); conv.connect(wet); wet.connect(master);
      const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); // iOS entsperren
      this.makeWaves();
      if (S.instr === 'grand') this.loadSamples();
    }
    if (this.ctx.state !== 'running') this.ctx.resume();
  },
  makeWaves() {
    const mk = amps => { const re = new Float32Array(amps.length + 1), im = new Float32Array(amps.length + 1); amps.forEach((a, i) => im[i + 1] = a); return this.ctx.createPeriodicWave(re, im); };
    this.waves.piano = mk(Array.from({ length: 18 }, (_, i) => (1 / Math.pow(i + 1, 1.7)) * (i === 1 ? 1.4 : 1)));
    this.waves.harp = mk(Array.from({ length: 28 }, (_, i) => Math.abs(Math.sin(Math.PI * (i + 1) * 0.14)) / Math.pow(i + 1, 0.75)));
  },
  sampleList() {
    const names = ['C', 'Ds', 'Fs', 'A'], res = [];
    for (let o = 1; o <= 7; o++) names.forEach((nm, i) => { const midi = 12 * (o + 1) + [0, 3, 6, 9][i]; if (midi >= 33 && midi <= 96) res.push({ midi, file: nm + o + '.mp3' }); });
    return res;
  },
  loadSamples() {
    if (this.loading) return this.loading;
    const base = S.sampleBase.endsWith('/') ? S.sampleBase : S.sampleBase + '/';
    const list = this.sampleList(); let done = 0;
    toast('Flügel wird geladen …', 1500);
    this.loading = Promise.all(list.map(s => fetch(base + s.file).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(ab => new Promise((res, rej) => this.ctx.decodeAudioData(ab, res, rej)))
      .then(buf => { this.buffers[s.midi] = buf; done++; })))
      .then(() => { toast('Konzertflügel bereit'); })
      .catch(e => { console.warn(e); this.loading = null; this.buffers = {}; toast('Flügel-Samples nicht erreichbar – nutze synthetischen Klang', 3500); });
    return this.loading;
  },
  note(midi, when, dur, vel, voice) {
    if (!this.ctx) return;
    const inst = S.instr;
    const keys = Object.keys(this.buffers);
    if (inst === 'grand' && keys.length) return this.sample(midi, when, dur, vel, keys);
    if (inst === 'harpsichord') return this.harpsi(midi, when, dur);
    return this.synth(midi, when, dur, vel);
  },
  sample(midi, when, dur, vel, keys) {
    let best = +keys[0]; for (const k of keys) if (Math.abs(k - midi) < Math.abs(best - midi)) best = +k;
    const ctx = this.ctx, src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = this.buffers[best]; src.playbackRate.value = Math.pow(2, (midi - best) / 12);
    g.gain.setValueAtTime(vel * 0.9, when);
    g.gain.setTargetAtTime(0, when + dur, 0.11);
    src.connect(g); g.connect(this.out); src.start(when); src.stop(when + dur + 1.2);
  },
  synth(midi, when, dur, vel) {
    const ctx = this.ctx, f = 440 * Math.pow(2, (midi - 69) / 12);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), g2 = ctx.createGain();
    o1.setPeriodicWave(this.waves.piano); o2.setPeriodicWave(this.waves.piano);
    o1.frequency.value = f; o2.frequency.value = f; o2.detune.value = 3; g2.gain.value = 0.5;
    lp.type = 'lowpass'; lp.Q.value = 0.6;
    lp.frequency.setValueAtTime(Math.min(16000, f * 9), when); lp.frequency.setTargetAtTime(f * 2.2, when, 0.35);
    const tau = 0.7 * Math.pow(2, (60 - midi) / 24), a = vel * 0.32;
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + 0.006);
    g.gain.setTargetAtTime(a * 0.04, when + 0.01, tau);
    g.gain.setTargetAtTime(0, when + dur, 0.09);
    o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(this.out);
    o1.start(when); o2.start(when); o1.stop(when + dur + 0.7); o2.stop(when + dur + 0.7);
  },
  harpsi(midi, when, dur) {
    const ctx = this.ctx, f = 440 * Math.pow(2, (midi - 69) / 12);
    const o = ctx.createOscillator(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.setPeriodicWave(this.waves.harp); o.frequency.value = f;
    hp.type = 'highpass'; hp.frequency.value = 140;
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.2, when + 0.002);
    g.gain.setTargetAtTime(0.05, when + 0.004, 0.3 * Math.pow(2, (60 - midi) / 30));
    g.gain.setTargetAtTime(0, when + dur, 0.035);
    o.connect(hp); hp.connect(g); g.connect(this.out); o.start(when); o.stop(when + dur + 0.4);
  },
};

// ---------- Wiedergabe ----------
const BASE_BPM = 60; // punktierte Viertel bei 100 %
const spt = () => 60 / (BASE_BPM * S.tempoPct / 100) / BEAT; // Sekunden pro Tick
let playing = false, pl = null, timer = null, raf = null, onSet = [], lastUserScroll = 0;
function startPlayback(from, until) {
  audio.ensure();
  stopPlayback(true);
  if (from >= TOTAL - 1) from = 0;
  let loopStart = null, loopEnd = null;
  if (loopOn) {
    const r = selRange || { a: Math.floor(from / MEASURE) + 1, b: Math.floor(from / MEASURE) + 1 };
    loopStart = (r.a - 1) * MEASURE; loopEnd = r.b * MEASURE;
    if (from < loopStart || from >= loopEnd) from = loopStart;
  }
  pl = { t0Tick: from, t0Time: audio.now() + 0.08, prev: null, idx: playable.findIndex(n => n.onset >= from),
    end: until || (loopOn ? loopEnd : TOTAL), loopStart };
  if (pl.idx < 0) pl.idx = playable.length;
  playing = true; setPlayIcon();
  timer = setInterval(schedule, 25); schedule();
  raf = requestAnimationFrame(frame);
}
function stopPlayback(silent) {
  playing = false; clearInterval(timer); cancelAnimationFrame(raf);
  setPlayIcon();
  flashNotes([]);
  if (!silent && pl) { /* Cursor bleibt stehen */ }
}
function schedule() {
  if (!playing) return;
  const s = spt(), now = audio.now();
  const horizon = pl.t0Tick + (now + 0.18 - pl.t0Time) / s;
  while (pl.idx < playable.length && playable[pl.idx].onset < Math.min(horizon, pl.end)) {
    const n = playable[pl.idx++];
    if (S.mute.includes(n.voice)) continue;
    const when = pl.t0Time + (n.onset - pl.t0Tick) * s;
    const len = Math.min(n.playTicks, pl.end - n.onset) * s;
    const accent = n.onset % BEAT === 0 ? 1 : n.onset % 6 === 0 ? 0.88 : 0.78;
    const vv = { 1: 0.95, 2: 0.78, 3: 0.88 }[n.voice];
    audio.note(n.midi, Math.max(when, now), Math.max(0.05, len * 0.97), accent * vv, n.voice);
  }
  if (horizon >= pl.end) {
    if (loopOn && pl.loopStart != null) {
      pl.prev = { t0Tick: pl.t0Tick, t0Time: pl.t0Time };
      pl.t0Time = pl.t0Time + (pl.end - pl.t0Tick) * s; pl.t0Tick = pl.loopStart;
      pl.idx = playable.findIndex(n => n.onset >= pl.loopStart);
    } else if (now > pl.t0Time + (pl.end - pl.t0Tick) * s + 0.2) {
      playhead = Math.min(pl.end, TOTAL - 0.01); stopPlayback(); updateCursor();
    }
  }
}
function curTick() {
  const now = audio.now(), s = spt();
  if (now < pl.t0Time && pl.prev) return pl.prev.t0Tick + (now - pl.prev.t0Time) / s;
  return pl.t0Tick + (now - pl.t0Time) / s;
}
function frame() {
  if (!playing) return;
  const t = Math.min(curTick(), pl.end - 0.01);
  if (t >= 0) {
    playhead = t; updateCursor();
    const ids = model.notes.filter(n => n.onset <= t && n.onset + n.ticks > t && !S.mute.includes(n.voice)).map(n => n.id);
    if (ids.join() !== onSet.join()) { flashNotes(ids); onSet = ids; }
    autoScroll();
  }
  raf = requestAnimationFrame(frame);
}
function autoScroll() {
  if (Date.now() - lastUserScroll < 2000) return;
  const p = tickToPos(playhead), sc = $('#scroller'); if (!p) return;
  const top = p.top + pageEl.offsetTop, bottom = top + p.h;
  if (top < sc.scrollTop + 20 || bottom > sc.scrollTop + sc.clientHeight - 120) sc.scrollTo({ top: Math.max(1, top - sc.clientHeight * 0.22), behavior: 'smooth' });
}
$('#scroller').addEventListener('touchmove', () => { lastUserScroll = Date.now(); }, { passive: true });
$('#scroller').addEventListener('wheel', () => { lastUserScroll = Date.now(); }, { passive: true });

// ---------- Transport ----------
const ICON_PLAY = '<svg viewBox="0 0 20 20"><path d="M5 3.2v13.6c0 .6.7 1 1.2.7l10.6-6.8c.5-.3.5-1 0-1.3L6.2 2.5C5.7 2.2 5 2.6 5 3.2z"/></svg>';
const ICON_STOP = '<svg viewBox="0 0 20 20"><rect x="4" y="3" width="4.2" height="14" rx="1"/><rect x="11.8" y="3" width="4.2" height="14" rx="1"/></svg>';
function setPlayIcon() { const b = $('#play'); b.innerHTML = playing ? ICON_STOP : ICON_PLAY; b.title = playing ? 'Anhalten' : 'Abspielen'; }
setPlayIcon();
// Spielt ab der aktuellen Stelle (Cursor); nach dem Öffnen steht er am Anfang
$('#play').onclick = () => { if (playing) stopPlayback(); else startPlayback(playhead); };
const tempo = $('#tempo');
const showTempo = () => { $('#tempoVal').textContent = S.tempoPct + ' %'; };
tempo.value = S.tempoPct; showTempo();
tempo.oninput = () => {
  const t = playing ? curTick() : null;
  S.tempoPct = +tempo.value; showTempo(); save();
  if (playing && t != null) { pl.t0Tick = t; pl.t0Time = audio.now(); pl.prev = null; }
};
$$('.chip').forEach(c => {
  const v = +c.dataset.v; c.classList.toggle('mute', S.mute.includes(v));
  c.onclick = () => { S.mute = S.mute.includes(v) ? S.mute.filter(x => x !== v) : S.mute.concat(v); c.classList.toggle('mute', S.mute.includes(v)); save(); };
});
$('#instr').value = S.instr;
$('#instr').onchange = () => { S.instr = $('#instr').value; save(); audio.ensure(); if (S.instr === 'grand') audio.loadSamples(); };

// ---------- Ansicht-Panel ----------
$('#viewBtn').onclick = () => { $('#info').classList.remove('show'); $('#viewPanel').classList.toggle('show'); };
function syncPanel() {
  $$('#colSeg button').forEach(b => b.classList.toggle('act', b.dataset.c === S.col));
  $('#harmSw').classList.toggle('act', S.harm);
  $('#ghostSw').classList.toggle('act', S.ghosts);
  $('#ghostCount').textContent = `(${model.notes.filter(n => n.ghost).length} Stellen)`;
  $('#sampleBase').value = S.sampleBase;
}
syncPanel();
$('#colSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.col = b.dataset.c; save(); syncPanel(); decorate(); };
$('#harmSw').onclick = () => { S.harm = !S.harm; save(); syncPanel(); rerender(); };
$('#ghostSw').onclick = () => { S.ghosts = !S.ghosts; save(); syncPanel(); rerender(); };
$('#zoomIn').onclick = () => { S.zoom = Math.min(1.6, +(S.zoom + 0.1).toFixed(2)); save(); rerender(); };
$('#zoomOut').onclick = () => { S.zoom = Math.max(0.6, +(S.zoom - 0.1).toFixed(2)); save(); rerender(); };
$('#sampleBase').onchange = () => { S.sampleBase = $('#sampleBase').value.trim() || DEFAULTS.sampleBase; save(); audio.buffers = {}; audio.loading = null; if (audio.ctx && S.instr === 'grand') audio.loadSamples(); };
function rerender() { if (rendered && tk) render(); }
let rz = null;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(rerender, 250); });
})();
