// ===================== App =====================
(function () {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// ---------- Modell & Analyse ----------
let model = null, harmony = null, playable = [], TOTAL = 0, piece = null, catalog = [];
let VOICE_NAMES = { 1: 'Sopran', 2: 'Alt', 3: 'Bass' };
const mLabel = m => (piece && piece.pickup ? m - 1 : m); // Taktnummer wie in der Ausgabe (Auftakt = 0)
const VOICE_COLORS = { 1: 'var(--v1)', 2: 'var(--v2)', 3: 'var(--v3)', 4: 'var(--v4)' };
const DUR_NAMES = { '1': 'Ganze', '2': 'Halbe', '4': 'Viertel', '8': 'Achtel', '16': 'Sechzehntel', '32': 'Zweiunddreißigstel' };

// ---------- Einstellungen ----------
const DEFAULTS = { col: 'voices', harm: true, ghosts: true, zoom: 1, orn: true, follow: false, explain: true, tempoPct: 75, room: 'halle', instr: 'grand', mute: [], sampleBase: 'https://tonejs.github.io/audio/salamander/' };
let S = Object.assign({}, DEFAULTS);
try { Object.assign(S, JSON.parse(localStorage.getItem('bach.settings') || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem('bach.settings', JSON.stringify(S)); } catch (e) {} };

function toast(msg, ms = 2200) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms); }

// ---------- Ansichten ----------
function show(id) { $$('.view').forEach(v => v.classList.toggle('show', v.id === id)); hideCards(); }
function hideCards() { if (typeof clearChordMarks === 'function') clearChordMarks(); $('#info').classList.remove('show'); $('#viewPanel').classList.remove('show'); $('#aboutPanel').classList.remove('show'); $('#page').style.paddingBottom = ''; if (typeof syncSelTools === 'function') syncSelTools(); }

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
  { id: 'inv', t: 'Inventionen & Sinfonien', s: 'BWV 772–801', c: '#2f4a3a', active: true,
    sub: 'Aufrichtige Anleitung · Köthen 1723 · BWV 772–801', h: ['Inventionen', 'Sinfonien'] },
  { id: 'wtk1', t: 'Das Wohltemperierte Klavier', cover: 'Das<br>Wohl<br>Temperierte<br>Klavier', s: 'Teil I<br>BWV 846–869', c: '#5b2626', active: true,
    sub: 'Teil I · Köthen 1722 · BWV 846–869', h: ['Präludien', 'Fugen'] },
  { t: 'Französische Suiten', s: 'BWV 812–817', c: '#273956' },
  { id: 'gold', t: 'Goldberg-Variationen', s: 'BWV 988', c: '#4b3a26', active: true,
    sub: 'Clavier-Übung IV · Nürnberg 1741 · BWV 988', h: ['Aria · Variationen 1–15', 'Variationen 16–30 · Aria da capo'] },
];
$('#shelf').innerHTML = BOOKS.map((b, i) => `
  <button class="book linen ${b.active ? '' : 'dim'}" style="--c:${b.c}" data-i="${i}">
    <div class="frame"><div class="orn">❦</div><div class="t">${b.cover || b.t}</div><div class="s">${b.s}</div><div class="orn">·</div></div>
    ${b.active ? '<div class="ribbon"></div>' : ''}
  </button>`).join('');
$('#shelf').addEventListener('click', e => {
  const b = e.target.closest('.book'); if (!b) return;
  const book = BOOKS[+b.dataset.i];
  if (!book.active) return toast('Dieses Buch ist noch in Vorbereitung');
  openBook(book);
});

// ---------- Inhalt ----------
const KEYS = ['C-Dur', 'c-Moll', 'D-Dur', 'd-Moll', 'Es-Dur', 'E-Dur', 'e-Moll', 'F-Dur', 'f-Moll', 'G-Dur', 'g-Moll', 'A-Dur', 'a-Moll', 'B-Dur', 'h-Moll'];
const WTK_KEYS = ['C-Dur', 'c-Moll', 'Cis-Dur', 'cis-Moll', 'D-Dur', 'd-Moll', 'Es-Dur', 'es-Moll', 'E-Dur', 'e-Moll', 'F-Dur', 'f-Moll',
  'Fis-Dur', 'fis-Moll', 'G-Dur', 'g-Moll', 'As-Dur', 'gis-Moll', 'A-Dur', 'a-Moll', 'B-Dur', 'b-Moll', 'H-Dur', 'h-Moll'];
let curBook = BOOKS[0];
const tocEntry = (label, key, bwv, id, on) => `<button class="entry ${on ? 'on' : 'off'}" ${on ? `data-open="${id}"` : ''}>
  <span class="num">${label}</span><span>${key}</span><span class="dots"></span><span class="bwv">BWV ${bwv}</span></button>`;
function renderToc() {
  const avail = id => catalog.some(c => c.id === id && c.available);
  const b = curBook;
  $('#bookTitle').textContent = b.t; $('#tocTitle').textContent = b.t; $('#tocSub').textContent = b.sub;
  $('#tocH1').textContent = b.h[0]; $('#tocH2').textContent = b.h[1];
  if (b.id === 'inv') {
    $('#tocInv').innerHTML = KEYS.map((k, i) => tocEntry('Inventio ' + (i + 1), k, 772 + i, 'bwv' + (772 + i), avail('bwv' + (772 + i)))).join('');
    $('#tocSin').innerHTML = KEYS.map((k, i) => tocEntry('Sinfonia ' + (i + 1), k, 787 + i, 'bwv' + (787 + i), avail('bwv' + (787 + i)))).join('');
  } else if (b.id === 'gold') {
    const gk = n => [15, 21, 25].includes(n) ? 'g-Moll' : 'G-Dur';
    const ge = (label, n, id) => tocEntry(label, gk(n), 988, id, avail(id));
    $('#tocInv').innerHTML = ge('Aria', 0, 'bwv988a') + Array.from({ length: 15 }, (_, i) => ge('Variatio ' + (i + 1), i + 1, 'bwv988v' + (i + 1))).join('');
    // Variatio 16 (Ouverture) wechselt die Taktart und steht deshalb als zwei Teile im Inhalt
    $('#tocSin').innerHTML = ge('Variatio 16 · Ouverture', 16, 'bwv988v16a') + ge('Variatio 16 · Fughetta', 16, 'bwv988v16b') +
      Array.from({ length: 14 }, (_, i) => ge('Variatio ' + (i + 17), i + 17, 'bwv988v' + (i + 17))).join('') + ge('Aria da capo', 31, 'bwv988da');
  } else {
    $('#tocInv').innerHTML = WTK_KEYS.map((k, i) => tocEntry('Präludium ' + (i + 1), k, 846 + i, `bwv${846 + i}p`, avail(`bwv${846 + i}p`))).join('');
    $('#tocSin').innerHTML = WTK_KEYS.map((k, i) => tocEntry('Fuge ' + (i + 1), k, 846 + i, `bwv${846 + i}f`, avail(`bwv${846 + i}f`))).join('');
  }
}
function openBook(book) {
  curBook = book;
  ['#bookView', '#scoreView'].forEach(v => $(v).style.setProperty('--c', book.c));
  renderToc(); show('bookView');
}
renderToc();
fetch('pieces/index.json').then(r => r.json()).then(c => { catalog = c; renderToc(); }).catch(() => toast('Inhaltsverzeichnis nicht erreichbar'));
$('#bookView').addEventListener('click', e => {
  const en = e.target.closest('.entry'); if (!en) return;
  if (en.dataset.open) openPiece(en.dataset.open);
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
async function openPiece(id) {
  stopPlayback(); clearSelection(); hideCards();
  show('scoreView');
  const meta = catalog.find(c => c.id === id) || { id };
  const bk = BOOKS.find(b => b.id === meta.book); if (bk && bk !== curBook) { curBook = bk; ['#bookView', '#scoreView'].forEach(v => $(v).style.setProperty('--c', bk.c)); renderToc(); }
  $('#scoreView .topbar .title').textContent = `${meta.title || ''} · ${meta.keyName || ''}`;
  $('#pageHead').innerHTML = `<h2>${meta.title || ''}</h2><div class="meta">${[meta.keyName, meta.bwv ? 'BWV ' + meta.bwv : '', meta.voicesLabel].filter(Boolean).join(' · ')}</div>`;
  $('#score').innerHTML = '<div id="loading">Notenstecher bei der Arbeit …</div>';
  $('#secLayer').innerHTML = ''; $('#cursor').style.display = 'none'; layout = null; rendered = false;
  $('#aboutBtn').style.display = 'none';
  try {
    const [p] = await Promise.all([fetch('pieces/' + id + '.json').then(r => { if (!r.ok) throw new Error('Stück fehlt'); return r.json(); }), initVerovio()]);
    piece = p;
    model = buildModel(piece); computeAccidentals(model); harmony = analyzeHarmony(model);
    playable = model.notes.filter(n => !n.tieEnd).sort((a, b) => a.onset - b.onset || a.role - b.role);
    TOTAL = model.measures * MEASURE;
    VOICE_NAMES = model.voiceCount === 2 ? { 1: 'Oberstimme', 3: 'Unterstimme' } : { 1: 'Sopran', 2: 'Alt', 4: 'Tenor', 3: 'Bass' };
    loadSections(id); buildChips(); syncPanel();
    playhead = piece.pickup ? MEASURE - piece.pickup : 0;
    loadAbout(id, meta);
    try { localStorage.setItem('bach.last', id); } catch (e) {}
    $('#scroller').scrollTop = 1;
    render(); rendered = true;
  } catch (e) {
    console.error(e);
    $('#score').innerHTML = '<div id="loading">Das Stück oder der Notenstecher (Verovio) konnte nicht geladen werden. Bitte Internetverbindung prüfen.</div>';
  }
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
    pageMarginLeft: 40, pageMarginRight: 40, pageMarginTop: sections.length ? 120 : 40, pageMarginBottom: 40,
    spacingSystem: S.harm ? 15 : 11, svgViewBox: false, smuflTextFont: 'embedded',
  });
  tk.loadData(mei);
  let svg = '';
  const pc = tk.getPageCount();
  for (let p = 1; p <= pc; p++) svg += tk.renderToSVG(p, {});
  $('#score').innerHTML = svg;
  decorate();
  requestAnimationFrame(() => { computeLayout(); updateCursor(); markSelection(); drawSections(); });
}

function decorate() {
  const root = $('#score');
  for (const e of model.events) {
    if (e.type === 'space') continue;
    const el = document.getElementById(e.id);
    if (el) el.classList.add('v' + e.role, 'st' + e.staff);
    if (e.ghost) { const g = document.getElementById('ga_' + e.id); if (g) g.classList.add('ghost'); }
  }
  root.querySelectorAll('g.beam, g.chord, g.tuplet').forEach(b => { const n = b.querySelector('g.note'); if (n) n.classList.forEach(c => { if (/^(v|st)\d$/.test(c)) b.classList.add(c); }); });
  $('#scoreView').classList.remove('col-voices', 'col-hands');
  if (S.col !== 'none') $('#scoreView').classList.add('col-' + S.col);
  drawOrnaments();
}

// Barocke Verzierungszeichen, die Verovio nicht als eigene Zeichen kennt, zeichnen wir selbst
// (in Zwischenlinien-Einheiten, Ursprung = Mitte des Zeichens)
const ORN_GLYPH = (() => {
  const W = n => ' l.3,-.56 l.3,.56'.repeat(n);   // Wellen ab dem aktuellen Punkt
  return {
    prallprall: 'M-.9,.28' + W(3),
    trillmord: 'M-.9,.28' + W(3) + ' M.15,-.8 V.95',
    dcad: 'M-.7,-.75 C-1.45,-.95 -1.6,.28 -.95,.28' + W(3),
    acad: 'M-.7,1 C-1.45,1.1 -1.55,.28 -.95,.28' + W(3),
    ltrill: 'M-.95,-1.1 V.28' + W(3),
    prallup: 'M-1.05,.28' + W(3) + ' l.28,-.3 l.12,-.6',
  };
})();
function drawOrnaments() {
  const NS = 'http://www.w3.org/2000/svg';
  for (const n of model.notes) {
    const g = ORN_GLYPH[n.orn]; if (!g || n.tieEnd) continue;
    const el = document.getElementById(n.id); if (!el || !el.getBBox) continue;
    const staff = el.closest('g.staff'); if (!staff) continue;
    const lines = [...staff.children].filter(c => c.tagName === 'path' && !c.classList.contains('xorn')).map(p => p.getBBox().y).sort((a, b) => a - b);
    if (lines.length < 2) continue;
    const il = (lines[lines.length - 1] - lines[0]) / (lines.length - 1);
    const head = el.querySelector('.notehead') || el, hb = head.getBBox(), nb = el.getBBox();
    const top = Math.min(lines[0], nb.y);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', g);
    p.setAttribute('class', 'xorn');
    p.setAttribute('transform', `translate(${hb.x + hb.width / 2},${top - 1.25 * il}) scale(${il})`);
    p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '.17'); p.setAttribute('stroke-linejoin', 'round'); p.setAttribute('stroke-linecap', 'round');
    staff.appendChild(p);
  }
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

// Schlichte SVG-Symbole statt Emoji (iOS zeigt ${IC.play}& Co. sonst als bunte Emoji)
const IC = {
  play: '<svg class="ic" viewBox="0 0 20 20"><path d="M5 3.2v13.6c0 .6.7 1 1.2.7l10.6-6.8c.5-.3.5-1 0-1.3L6.2 2.5C5.7 2.2 5 2.6 5 3.2z"/></svg>',
  loop: '<svg class="ic" viewBox="0 0 20 20"><path d="M10 3a7 7 0 0 1 6.6 4.7l1.6-.9-.7 4.3-3.9-1.8 1.4-.8A5 5 0 0 0 5.2 8.6L3.3 8A7 7 0 0 1 10 3zm-6.6 9.3 3.9 1.8-1.4.8a5 5 0 0 0 9-1.6l1.9.6A7 7 0 0 1 3.4 13.3l-1.6.9.6-4.3z"/></svg>',
  stop: '<svg class="ic" viewBox="0 0 20 20"><rect x="4.5" y="4.5" width="11" height="11" rx="1.5"/></svg>',
  timer: '<svg class="ic" viewBox="0 0 20 20"><path d="M8 1.5h4v1.8H8zM10 4.5a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 1.9a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2zm-.9 1.6h1.8v3.7l2.5 1.5-.9 1.5-3.4-2z"/></svg>',
  note: '<svg class="ic" viewBox="0 0 20 20"><path d="M8.5 2.5h1.8c.4 2.2 2.2 3.2 3.8 4.4 1.4 1 2 2.6 1.6 4.2-.2-1.4-1.3-2.7-3.1-3.2l-2.3-.6v7.2c0 1.9-1.8 3.2-3.8 3.2-1.4 0-2.5-.8-2.5-2 0-1.7 1.9-3.1 4-3.1.2 0 .4 0 .5.1z"/></svg>',
  warn: '<svg class="ic" viewBox="0 0 20 20"><path d="M10 2.2c.4 0 .8.2 1 .6l7.3 12.8c.4.8-.1 1.7-1 1.7H2.7c-.9 0-1.4-.9-1-1.7L9 2.8c.2-.4.6-.6 1-.6zm-.9 5v4.6h1.8V7.2zm0 6.2v1.8h1.8v-1.8z"/></svg>',
};

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
  syncSelTools();
  const ms = $('#msel');
  if (!selRange || !layout || selHidden) { ms.style.display = 'none'; return; }
  ms.style.display = 'block';
  ms.classList.toggle('pulse', Date.now() < markUntil);
  drawSel(selRange.a - 1, selRange.b);
}
// Zeichnet die Markierung zwischen zwei Taktgrenzen (in Takteinheiten, auch gebrochen – fürs Ziehen)
function drawSel(P0, P1) {
  const ms = $('#msel'), N = model.measures;
  P0 = Math.max(0, Math.min(N, P0)); P1 = Math.max(P0, Math.min(N, P1));
  const xAt = (m, f) => m.l + Math.max(0, Math.min(1, f)) * (m.r - m.l);
  const rects = []; let cur = null;
  const flush = () => { if (cur && cur.r - cur.l > 1) rects.push({ l: cur.l, t: cur.t - 8, w: cur.r - cur.l, h: cur.b - cur.t + 16 }); };
  for (let k = Math.floor(P0 + 1e-6) + 1; k <= Math.ceil(P1 - 1e-6); k++) {
    const m = layout.measures[k]; if (!m) continue;
    const l = xAt(m, P0 - (k - 1)), r = xAt(m, P1 - (k - 1));
    if (cur && cur.sys === m.sys) { cur.r = r; cur.t = Math.min(cur.t, m.t); cur.b = Math.max(cur.b, m.b); }
    else { flush(); cur = { l, r, t: m.t, b: m.b, sys: m.sys }; }
  }
  flush();
  // Rechteck-Elemente wiederverwenden (damit das Einschnappen weich animiert)
  const els = [...ms.querySelectorAll('.r')];
  while (els.length < rects.length) { const d = document.createElement('div'); d.className = 'r'; ms.insertBefore(d, ms.firstChild); els.unshift(d); }
  while (els.length > rects.length) els.pop().remove();
  rects.forEach((r, i) => Object.assign(els[i].style, { left: r.l + 'px', top: r.t + 'px', width: r.w + 'px', height: r.h + 'px' }));
  // Griffe: links am Anfang, rechts am Ende, Verschiebe-Griff mittig unten
  const f = rects[0], z = rects[rects.length - 1];
  if (!f) return;
  const pos = (el, x, y) => { el.style.left = x + 'px'; el.style.top = y + 'px'; };
  pos($('#hdlL'), f.l, f.t + f.h / 2);
  pos($('#hdlR'), z.l + z.w, z.t + z.h / 2);
  pos($('#hdlM'), z.l + z.w / 2, z.t + z.h);
}

// ---------- Markierung: Griffe & schwebende Werkzeugleiste ----------
let selHidden = false, handleDrag = false;   // gelbes Rechteck ausgeblendet (Auswahl bleibt bestehen)
function infoShown() { return $('#info').classList.contains('show'); }
function syncSelTools() {
  const on = !!(selRange && layout);
  $('#selTools').classList.toggle('show', on);
  $('#stSel').classList.toggle('off', selHidden);
  $('#stFollow').classList.toggle('off', !S.follow);
  $('#stInfo').classList.toggle('off', !infoShown());
}
function toggleInfo() {
  if (!selRange) return;
  if (infoShown()) { $('#info').classList.remove('show'); $('#page').style.paddingBottom = ''; clearChordMarks(); syncSelTools(); }
  else showRangeInfo();
}
(function setupHandles() {
  const ms = $('#msel');
  ms.insertAdjacentHTML('beforeend',
    '<div class="hdl side" id="hdlL"><i></i></div><div class="hdl side" id="hdlR"><i></i></div>' +
    '<div class="hdl menu" id="hdlM" title="Markierung verschieben"><i></i><i></i><i></i></div>');
  // Fingerposition → Taktgrenze in Takteinheiten (System zuerst, dann waagrecht im Takt interpoliert)
  const posAt = (x, y) => {
    let best = null, bd = Infinity;
    for (const [k, m] of Object.entries(layout.measures)) {
      const dy = y < m.t ? m.t - y : y > m.b ? y - m.b : 0, dx = x < m.l ? m.l - x : x > m.r ? x - m.r : 0;
      const d = dy * 4 + dx;
      if (d < bd) { bd = d; best = [+k, m]; }
    }
    if (!best) return null;
    const [k, m] = best;
    return k - 1 + Math.max(0, Math.min(1, (x - m.l) / (m.r - m.l)));
  };
  let drag = null;
  const live = (P0, P1) => { drag.p0 = P0; drag.p1 = P1; drawSel(P0, P1); };
  for (const id of ['hdlL', 'hdlR', 'hdlM']) {
    const el = $('#' + id);
    el.addEventListener('pointerdown', e => {
      e.stopPropagation(); e.preventDefault();
      if (!selRange || !layout) return;
      const pr = $('#page').getBoundingClientRect();
      endMarkMode(); $('#msel').classList.remove('pulse');
      drag = { id: e.pointerId, kind: id, a: selRange.a, b: selRange.b, start: posAt(e.clientX - pr.left, e.clientY - pr.top) };
      handleDrag = true;
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      el.classList.add('drag'); $('#msel').classList.add('live');
    });
    el.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      e.preventDefault();
      const pr = $('#page').getBoundingClientRect();
      const P = posAt(e.clientX - pr.left, e.clientY - pr.top); if (P == null) return;
      const N = model.measures;
      if (drag.kind === 'hdlL') live(Math.min(P, drag.b - 1), drag.b);           // mindestens ein Takt bleibt
      else if (drag.kind === 'hdlR') live(drag.a - 1, Math.max(P, drag.a));
      else {                                                                       // ganzes Rechteck verschieben
        const len = drag.b - drag.a + 1;
        const d = Math.max(-(drag.a - 1), Math.min(N - drag.b, P - drag.start));
        live(drag.a - 1 + d, drag.a - 1 + d + len);
      }
    });
    const end = e => {
      if (!drag || e.pointerId !== drag.id) return;
      e.stopPropagation();
      const d = drag; drag = null; handleDrag = false;
      el.classList.remove('drag'); $('#msel').classList.remove('live');
      let { a, b } = d;
      if (d.p0 != null) {   // Einschnappen: über die Hälfte eines Takts gezogen → nächster Takt, sonst zurück
        if (d.kind === 'hdlL') a = Math.round(d.p0) + 1;
        else if (d.kind === 'hdlR') b = Math.round(d.p1);
        else { const sh = Math.round(d.p0 - (d.a - 1)); a += sh; b += sh; }
      }
      const changed = a !== selRange.a || b !== selRange.b;
      selRange = { a, b };
      if (changed) { playhead = (a - 1) * MEASURE; updateCursor(); }
      markSelection();
      if (changed && infoShown()) showRangeInfo();
      if (changed && loopOn && playing) startPlayback((a - 1) * MEASURE);
      requestAnimationFrame(keepSelectionVisible);
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  }
  $('#stSel').onclick = () => { selHidden = !selHidden; markSelection(); };
  $('#stFollow').onclick = () => { S.follow = !S.follow; save(); syncSelTools(); toast(S.follow ? 'Markierung folgt dem Abspielkopf' : 'Markierung bleibt stehen'); };
  $('#stInfo').onclick = toggleInfo;
  $('#stClear').onclick = () => { clearSelection(); hideCards(); };
})();

// ---------- Hörfilter: nur Violin- oder Bassschlüssel ----------
// Hörfilter: Violin- bzw. Bassschlüssel einzeln stumm schalten (Symbole oben im Analyse-Fenster)
const hearOff = { 1: false, 2: false };
function audible(n) { return !S.mute.includes(n.role) && !hearOff[n.staff]; }
function syncHear() {
  $$('#hearTog button').forEach(b => b.classList.toggle('off', hearOff[b.dataset.st]));
  const c = $('#handChip'), t = hearOff[1] && hearOff[2] ? 'beide Systeme stumm' : hearOff[1] ? 'nur Bassschlüssel' : hearOff[2] ? 'nur Violinschlüssel' : '';
  c.style.display = t ? '' : 'none'; c.textContent = t ? t + ' ×' : '';
}
function setHear(v) { hearOff[1] = v === 2; hearOff[2] = v === 1; syncHear(); }   // 0 = beide, 1 = nur oben, 2 = nur unten
$('#hearTog').onclick = e => { const b = e.target.closest('button[data-st]'); if (!b) return; hearOff[b.dataset.st] = !hearOff[b.dataset.st]; syncHear(); };
$('#handChip').onclick = () => setHear(0);
function hearControls() { return ''; }
function refreshCard() { const sec = selRange && sections.find(x => x.a === selRange.a && x.b === selRange.b); if (sec && Date.now() >= markUntil) showSection(sec); else showRangeInfo(); }

// Ein Knopf für Abspielen/Stopp in den Karten
function playBtn(label) { return `<button data-act="play" data-label="${label}">${playing ? IC.stop + 'Stopp' : IC.play + label}</button>`; }

// ---------- Info-Karte ----------
function beatLabel(e) {
  const b = Math.floor(e.pos / BEAT + 1e-9) + 1, off = e.pos - (b - 1) * BEAT;
  if (off < 1e-6) return `Zählzeit ${b}`;
  return `Zählzeit ${b} + ${Math.round(off / (TPW / 16))} Sechzehntel`;
}
function durName(e) {
  let t = (e.dots ? 'punktierte ' : '') + DUR_NAMES[e.dur];
  if (e.tieStart) t += ' (übergebunden)';
  return t;
}
const ACC_SIGN = { '-1': '♭', '0': '♮', '1': '♯' };
function showNoteInfo(n) {
  const bt = beatAt(harmony, n.onset);
  const role = noteRole(n, harmony);
  const ch = bt.chord;
  let h = `<div class="lbl"><span class="vdot" style="background:${VOICE_COLORS[n.role]}"></span>${VOICE_NAMES[n.role] || 'Stimme'} · ${n.staff === 1 ? 'rechte' : 'linke'} Hand</div>
    <h4>${helmholtz(n)}</h4>
    <div class="row"><span class="k">Ort</span><span>Takt ${mLabel(n.measure)}, ${beatLabel(n)}</span></div>
    <div class="row"><span class="k">Dauer</span><span>${durName(n)}</span></div>
    <div class="row"><span class="k">Harmonie</span><span>${ch ? `${ch.name} – ${keyName(bt.key)}: <b>${ch.roman}</b>` : '–'}</span></div>
    <div class="row"><span class="k">Rolle</span><span>${n.grace ? (n.grace === 'acc' ? 'langer Vorschlag (Appoggiatura): auf den Schlag, nimmt der Hauptnote etwa die Hälfte ihres Werts' : 'kurzer Vorschlag: ganz kurz auf den Schlag') : role.text}</span></div>`;
  const ORN_TEXT = { trill: 'Triller – beginnt barock auf der oberen Nebennote', trillmord: 'Triller mit Nachschlag (beginnt oben, endet über die untere Nebennote)',
    prallprall: 'Langer Pralltriller – mehrmals obere Nebennote und Hauptnote im Wechsel',
    dcad: 'Doppelt-Cadence – beginnt oben, Schleife über die untere Nebennote, dann Triller',
    acad: 'Triller von unten – beginnt mit der unteren Nebennote, dann Triller',
    ltrill: 'Triller mit gehaltenem Vorhalt – die obere Nebennote wird zuerst etwas gehalten, dann Triller',
    prallup: 'Triller mit Nachschlag – Triller, der über die untere Nebennote zur Hauptnote schließt',
    prall: 'Pralltriller – kurz: obere Nebennote, Hauptnote', mordent: 'Mordent – Hauptnote, untere Nebennote, Hauptnote', turn: 'Doppelschlag – obere Nebennote, Hauptnote, untere Nebennote, Hauptnote' };
  if (n.orn && ORN_TEXT[n.orn]) h += `<div class="row"><span class="k">Verzierung</span><span>${ORN_TEXT[n.orn]}</span></div>`;
  if (n.graces && n.graces.length) h += `<div class="row"><span class="k">Vorschlag</span><span>${n.graces.map(g => helmholtz(g)).join(', ')} (${n.graces[0].grace === 'acc' ? 'lang' : 'kurz'})</span></div>`;
  if (n.ghost) h += `<div class="ghostnote">${IC.warn}Takt-gültiges Vorzeichen: Hier steht kein Zeichen, aber das ${ACC_SIGN[n.alter]} von weiter vorn im Takt gilt noch – also <b>${helmholtz(n)}</b>.</div>`;
  h += `<div class="btns"><button data-act="hear">${IC.note}anhören</button><button data-act="from">${IC.play}ab hier spielen</button><button data-act="measure">Takt ${mLabel(n.measure)}</button></div>`;
  openInfo(h, act => {
    if (act === 'hear') { audio.ensure(); if (n.grace) audio.note(n.midi, audio.now() + 0.02, 0.4, 0.8, n.role); else playOrnamented(n, audio.now() + 0.02, Math.min(2.5, n.playTicks * spt()) || 0.6, 0.8); }
    if (act === 'from') startPlayback(n.onset);
    if (act === 'measure') selectMeasure(n.measure);
  });
}
// ---------- Stufen erklären ----------
const DEG_WORD = ['1.', '2.', '3.', '4.', '5.', '6.', '7.'];
function spellChord(ch, from, to) {
  // Akkordtöne mit deutschen Namen in Terzschichtung, z. B. E–Gis–H–D
  const n0 = model.notes.find(n => n.pc === ch.root && n.onset < to && n.onset + n.ticks > from);
  let rStep, rAlt;
  if (n0) { rStep = n0.step; rAlt = n0.alter; }
  else {
    const nm = pcSpelling(ch.root, model, from, to);
    rStep = 'cdefgab'.indexOf(nm[0] === 'h' ? 'b' : nm[0] === 'b' ? 'b' : nm[0]);
    rAlt = nm === 'b' ? -1 : nm.endsWith('is') ? 1 : nm.length > 1 && nm.endsWith('s') ? -1 : 0;
  }
  const NAT = [0, 2, 4, 5, 7, 9, 11];
  return ch.pcs.map((pc, k) => {
    const step = (rStep + 2 * k) % 7;
    let alt = ((pc - NAT[step]) % 12 + 12) % 12; if (alt > 6) alt -= 12;
    if (k === 0) alt = rAlt;
    const nm = germanStepName(step, alt);
    return nm[0].toUpperCase() + nm.slice(1);
  }).join('–');
}
function explainChord(bt) {
  const ch = bt.chord; if (!ch) return 'Hier ist keine Akkordschätzung möglich (zu wenige Töne).';
  const key = bt.key, kn = keyName(key), notes = spellChord(ch, bt.from, bt.to), minor = key.minor;
  const r = ch.roman.replace(/ \(picardische Terz\)/, '');
  const base = r.replace(/^[♭♯]/, '').replace(/[°ø7]/g, '').split('/')[0];
  const deg = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].indexOf(base.toUpperCase());
  const where = `(in ${kn}: ${notes})`;
  const isSec = r.includes('/');
  let txt;
  if (ch.roman.includes('picardische')) txt = `I – Dur-Tonika am Schluss eines Moll-Stücks („picardische Terz“) ${where}: die Molltonika wird zum hellen Dur-Schlussklang aufgehellt.`;
  else if (isSec) {
    const target = r.split('/')[1];
    txt = r.startsWith('vii') ? `${r} – verminderter Akkord als Zwischendominante ${where}: Leittonakkord zur Stufe ${target}, zieht stark dorthin.`
      : `${r} – Zwischendominante ${where}: Dominant${ch.q === 'dom7' ? 'sept' : ''}akkord zur Stufe ${target}; macht ${target} kurz zur „Tonika“ und leitet dorthin.`;
  } else if (/^[♭♯]/.test(r)) txt = `${r} – leiterfremde Stufe ${where}: ${r.startsWith('♭') ? 'erniedrigte' : 'erhöhte'} ${DEG_WORD[deg]} Stufe, Klang aus der Nachbartonart (Mischklang/Ausweichung), färbt die Harmonik ein.`;
  else switch (base.toUpperCase() + '|' + ch.q) {
    default: {
      const T = {
        I: minor ? 'Tonika (Moll-Grundakkord) – Ruhepunkt, die Entspannung nach der Spannung.' : 'Tonika (Dur-Grundakkord) – Ruhepunkt, die Entspannung nach der Spannung.',
        II: minor ? (ch.q === 'hdim7' ? 'halbverminderter Septakkord auf der 2. Stufe – typische Subdominant-Vorbereitung der Dominante in Moll (iiø7–V–i).' : 'Akkord auf der 2. Stufe – bereitet die Dominante vor.')
          : 'Akkord auf der 2. Stufe (Subdominantparallele) – klassische Vorbereitung der Dominante (ii–V–I).',
        III: minor ? 'Dur-Akkord auf der 3. Stufe (Tonikaparallele) – das Dur-Gegenstück zur Molltonika, häufiges Ausweichziel.' : 'Moll-Akkord auf der 3. Stufe (Dominantparallele) – vermittelnder, eher selten eigenständiger Klang.',
        IV: minor ? 'Subdominante (Moll) – entfernt sich von der Tonika und bereitet oft die Dominante vor.' : 'Subdominante (Dur) – entfernt sich von der Tonika und bereitet oft die Dominante vor.',
        V: ch.q === 'dom7' ? 'Dominantseptakkord auf der 5. Stufe – Leitton und Septime erzeugen starke Auflösungsspannung zur Tonika.'
          : (ch.q === 'min' || ch.q === 'min7') ? `Moll-Variante der Dominante (${ch.q === 'min7' ? 'mit Mollseptime, ' : ''}ohne Leitton) – klingt weicher, eher modal; meist im Durchgang.`
          : 'Dominante ohne Septime – strebt zur Tonika.',
        VI: minor ? 'Dur-Akkord auf der 6. Stufe (Tonikagegenklang) – häufig als tröstende Ausweichstufe; nach V ein Trugschluss.' : 'Moll-Akkord auf der 6. Stufe (Tonikaparallele) – verwandt mit der Tonika; nach V ein Trugschluss.',
        VII: ch.q === 'dim7' ? 'verminderter Septakkord auf der 7. Stufe – sehr spannungsreich, oft als „Verstärker“ der Dominante (verkürzter Dominantseptnonakkord).'
          : ch.q === 'hdim7' ? 'halbverminderter Septakkord auf der 7. Stufe – verkürzte Dominante, strebt zur Tonika.'
          : ch.q === 'dim' ? 'verminderter Dreiklang auf der 7. Stufe – verkürzte Dominante (Leittonakkord), strebt zur Tonika.'
          : 'Dur-Akkord auf der 7. Stufe (natürliches Moll) – oft Dominante der Durparallele (III).',
      }[base.toUpperCase()] || 'Akkord der Tonart.';
      txt = `${r} – ${T.split(' – ')[0]} ${where}${T.includes(' – ') ? ', ' + T.split(' – ').slice(1).join(' – ') : ''}`;
    }
  }
  // Umkehrung
  if (ch.bass != null && ch.bass !== ch.root) {
    const iv = (ch.bass - ch.root + 12) % 12;
    const inv = (iv === 3 || iv === 4) ? (ch.pcs.length === 4 ? 'Quintsextakkord (Terz im Bass)' : 'Sextakkord (Terz im Bass)')
      : (iv === 6 || iv === 7) ? (ch.pcs.length === 4 ? 'Terzquartakkord (Quinte im Bass)' : 'Quartsextakkord (Quinte im Bass)')
      : 'Sekundakkord (Septime im Bass)';
    txt += ` Umkehrung: ${inv}.`;
  }
  // Tonartwechsel
  const i = harmony.beats.indexOf(bt), prev = harmony.beats[i - 1];
  if (prev && (prev.key.tonic !== key.tonic || prev.key.minor !== key.minor)) txt += ` Hier beginnt der Bereich in ${kn} (vorher ${keyName(prev.key)}).`;
  return txt;
}
let openBeat = null, chordTimers = [];
function clearChordMarks() {
  chordTimers.forEach(clearTimeout); chordTimers = [];
  $$('#score g.chordnote').forEach(el => el.classList.remove('chordnote', 'on'));
}
function toggleBeatExplain(i, silent) { // erneutes Tippen spielt den Akkord noch einmal; schließen über ×
  const box = $('#beatExp'); if (!box) return;
  $$('#infoBody [data-act^="beat"]').forEach(b => b.classList.toggle('act', +b.dataset.act.slice(4) === i));
  openBeat = i;
  const bt = harmony.beats[i];
  box.innerHTML = `<div class="small" style="font-style:normal;margin-bottom:2px">Takt ${mLabel(bt.measure)}, Zählzeit ${bt.beat + 1}</div>${explainChord(bt)}`;
  box.classList.add('show');
  // Noten im Notenbild markieren, die den Akkord bilden
  clearChordMarks();
  const tones = model.notes.filter(n => n.onset < bt.to - 1e-6 && n.onset + n.ticks > bt.from + 1e-6 && (!bt.chord || bt.chord.pcs.includes(n.pc)));
  tones.forEach(n => { const el = document.getElementById(n.id); if (el) el.classList.add('chordnote'); });
  if (silent) return;   // beim Mitverfolgen während der Wiedergabe nichts zusätzlich anspielen
  // aufgerollt von unten nach oben im Sechzehntel-Tempo; der gerade klingende Ton leuchtet auf
  audio.ensure();
  const snd = tones.filter(audible);
  const midis = [...new Map(snd.map(n => [n.midi, n])).values()].sort((x, y) => x.midi - y.midi);
  const step = (TPW / 16) * spt(), t0 = audio.now() + 0.03, total = midis.length * step;
  midis.forEach((n, k) => {
    audio.note(n.midi, t0 + k * step, total - k * step + 0.9, 0.55, n.role);
    const same = snd.filter(x => x.midi === n.midi);
    chordTimers.push(setTimeout(() => same.forEach(x => { const el = document.getElementById(x.id); if (el) el.classList.add('on'); }), (0.03 + k * step) * 1000));
  });
  chordTimers.push(setTimeout(() => $$('#score g.chordnote.on').forEach(el => el.classList.remove('on')), (0.03 + total + 0.9) * 1000));
}

// Analyse-Fenster: welcher markierte Takt ist „aktuell“? Der des Abspielkopfs, sonst der erste
let shownCur = null, infoMode = null;
function analysisMeasure() {
  const t = playing ? curTick() : playhead, m = Math.floor(t / MEASURE + 1e-6) + 1;
  return m >= selRange.a && m <= selRange.b ? m : selRange.a;
}
function refreshAnalysis() {
  if (document.activeElement && document.activeElement.id === 'secName') return;   // Namen nicht beim Tippen überschreiben
  if (infoMode === 'range' && selRange && infoShown() && !selNote && analysisMeasure() !== shownCur) showRangeInfo();
  followBeat();
}
// Aufgeklappte Stufen-Erklärung springt im Folgen-Modus zur Zählzeit des Abspielkopfs
// Ausgeklappt (Standard): die Stufe unter dem Abspielkopf ist grün hinterlegt und erklärt
function followBeat() {
  if (!S.explain || infoMode !== 'range' || !selRange || !infoShown()) return;
  const t = playing ? curTick() : playhead;
  let i = harmony.beats.findIndex(x => t >= x.from - 1e-6 && t < x.to - 1e-6);
  if (i < 0 || harmony.beats[i].measure < selRange.a || harmony.beats[i].measure > selRange.b)
    i = harmony.beats.findIndex(x => x.measure === analysisMeasure());
  if (i >= 0 && i !== openBeat && $('#infoBody [data-act="beat' + i + '"]')) toggleBeatExplain(i, true);
}
function collapseExplain() {
  openBeat = null; clearChordMarks();
  const box = $('#beatExp'); if (box) { box.classList.remove('show'); box.innerHTML = ''; }
  $$('#infoBody [data-act^="beat"]').forEach(b => b.classList.remove('act'));
}
function syncExp() { const b = $('#expTog'); b.classList.toggle('on', !!S.explain); b.style.display = infoMode === 'range' ? '' : 'none'; $('#hearTog .sep').style.display = b.style.display; }
$('#expTog').onclick = e => { e.stopPropagation(); S.explain = !S.explain; save(); syncExp(); if (S.explain) followBeat(); else collapseExplain(); };
function showRangeInfo() {
  openBeat = null;
  const { a, b } = selRange, single = a === b;
  const sec = Date.now() >= markUntil ? sections.find(x => x.a === a && x.b === b) : null;
  const bs = harmony.beats.filter(x => x.measure >= a && x.measure <= b);
  const keys = bs.map(x => keyName(x.key)).filter((k, i, arr) => i === 0 || k !== arr[i - 1]).join(' → ');
  const pulsing = Date.now() < markUntil;
  const span = single ? `Takt ${mLabel(a)}` : `Takte ${mLabel(a)}–${mLabel(b)}`;
  let h = `<div class="lbl">${sec ? 'Übe-Abschnitt · ' + span : single ? `Takt ${mLabel(a)} von ${mLabel(model.measures)}` : `${span} · ${b - a + 1} Takte markiert`}</div>`;
  h += sec ? `<div class="sechead"><h4>${keys}</h4><input class="secname" id="secName" value="${sec.name.replace(/"/g, '&quot;')}" maxlength="60" enterkeyhint="done" title="Name des Übe-Abschnitts"></div>` + sectionHTML(sec) : `<h4>${keys}</h4>`;
  const bi = x => harmony.beats.indexOf(x);
  h += `<div class="beatexp" id="beatExp"></div>`;
  // Aktueller Takt groß, die übrigen markierten Takte links/rechts klein
  const cur = analysisMeasure();
  const big = m => { const mb = bs.filter(x => x.measure === m);
    return `<div class="main">${single ? '' : `<div class="mlbl">Takt ${mLabel(m)}</div>`}<div class="beats" style="grid-template-columns:repeat(${Math.min(4, harmony.perMeasure)},1fr)">${mb.map((x, i) => `<button class="beat" data-act="beat${bi(x)}"><i>${i + 1}</i><b>${x.chord ? x.chord.roman : '–'}</b>${x.chord ? x.chord.name : ''}</button>`).join('')}</div></div>`; };
  const mini = m => `<div class="mini"><i>T. ${mLabel(m)}</i>${bs.filter(x => x.measure === m).map(x => `<button class="rn" data-act="beat${bi(x)}">${x.chord ? x.chord.roman : '–'}</button>`).join('')}</div>`;
  const before = [], after = []; for (let m = a; m <= b; m++) { if (m < cur) before.push(m); if (m > cur) after.push(m); }
  h += `<div class="harmstrip">${before.length ? `<div class="side l">${before.map(mini).join('')}</div>` : ''}${big(cur)}${after.length ? `<div class="side r">${after.map(mini).join('')}</div>` : ''}</div>`;
  shownCur = cur;
  if (single && pulsing) h += `<div class="small" style="margin-top:6px">Markiermodus: Tippe jetzt auf einen anderen Takt, um bis dorthin zu markieren.</div>`;
  h += hearControls();
  const running = sec && practice && practice.id === sec.id;
  h += `<div class="btns">${sec ? `<button data-act="timer" class="${running ? 'timerOn' : ''}">${running ? IC.stop + 'Üben beenden' : IC.timer + 'Üben starten'}</button>` : ''}${playBtn(single ? 'Takt spielen' : 'Abschnitt spielen')}<button data-act="loop">${loopOn ? IC.loop + 'Schleife aus' : IC.loop + 'Schleife'}</button><button data-act="from" title="Spielt ab diesem Takt bis zum Ende des Stücks">ab hier bis Schluss</button>${sec ? `<button data-act="del">${confirmDel === sec.id ? 'Wirklich löschen?' : 'Abschnitt löschen'}</button>` : '<button data-act="addsec">＋ Übe-Abschnitt</button>'}</div>`;
  openInfo(h, act => {
    if (sec && sectionAct(sec, act)) return;
    if (act === 'play') { if (playing) stopPlayback(); else { loopOn = false; startPlayback((a - 1) * MEASURE, b * MEASURE); } }
    if (act === 'loop') { loopOn = !loopOn; if (loopOn) startPlayback((a - 1) * MEASURE); else stopPlayback(); showRangeInfo(); }
    if (act === 'from') { loopOn = false; startPlayback((a - 1) * MEASURE); }
    if (act === 'clear') { clearSelection(); }
    if (act.startsWith('hear')) { setHear(+act.slice(4)); showRangeInfo(); }
    if (act === 'addsec') { endMarkMode(); markSelection(); addSection(a, b); showRangeInfo(); }
    if (act.startsWith('beat')) { toggleBeatExplain(+act.slice(4)); if (!S.explain) { S.explain = true; save(); syncExp(); } }
  });
  infoMode = 'range';
  if (sec) { const inp = $('#secName');
    inp.addEventListener('change', () => { sec.name = inp.value.trim() || sec.name; saveSections(); drawSections(); renderSecList(); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); }); }
  syncExp(); followBeat();
  const l = $('#infoBody .harmstrip .side.l'); if (l) l.scrollLeft = l.scrollWidth;
}
function openInfo(html, onAct) {
  clearChordMarks(); infoMode = null; openBeat = null;
  $('#viewPanel').classList.remove('show'); $('#aboutPanel').classList.remove('show'); const sp = $('#secPanel'); if (sp) sp.classList.remove('show');
  $('#infoBody').innerHTML = html;
  $('#infoBody').onclick = e => { const b = e.target.closest('[data-act]'); if (b) onAct(b.dataset.act); };
  $('#info').classList.add('show');
  syncSelTools(); syncExp();
  requestAnimationFrame(keepSelectionVisible);
}
$('#infoX').onclick = () => { $('#info').classList.remove('show'); $('#page').style.paddingBottom = ''; clearChordMarks(); syncSelTools(); };
// Karte darf die markierten Noten nicht verdecken: unten Platz schaffen und ggf. hochscrollen
function keepSelectionVisible() {
  const card = $('#info'), sc = $('#scroller'), pg = $('#page');
  if (!card.classList.contains('show') || !layout || handleDrag) return;   // beim Ziehen nicht scrollen
  const cardTop = card.getBoundingClientRect().top;
  pg.style.paddingBottom = Math.max(140, card.offsetHeight + 60) + 'px';
  let target = null;
  if (selRange && layout.measures[selRange.b]) target = layout.measures[selRange.b];
  else if (selNote) { const el = document.getElementById(selNote.id); if (el) { const r = el.getBoundingClientRect(), pr = pg.getBoundingClientRect(); target = { b: r.bottom - pr.top }; } }
  if (!target) return;
  const bottomOnScreen = pg.getBoundingClientRect().top + target.b + 24;
  if (bottomOnScreen > cardTop - 12) sc.scrollBy({ top: bottomOnScreen - cardTop + 24, behavior: 'smooth' });
}

function selectNote(n) { endMarkMode(); selNote = n;   // eine bestehende Takt-Markierung bleibt erhalten
  if (!selRange) loopOn = false; playhead = n.onset; snapSelToPlayhead(n.onset); markSelection(); updateCursor(); showNoteInfo(n); }
function selectMeasure(m) {
  selNote = null; selHidden = false;
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

// ---------- Sicherung (Export / Import) ----------
let meta = { changes: 0, lastExport: null };
try { Object.assign(meta, JSON.parse(localStorage.getItem('bach.meta') || '{}')); } catch (e) {}
const saveMeta = () => { try { localStorage.setItem('bach.meta', JSON.stringify(meta)); } catch (e) {} };
function markDirty() { meta.changes++; saveMeta(); syncDirty(); }
function syncDirty() { $$('.dirtyable').forEach(b => b.classList.toggle('dirty', meta.changes > 0)); }
const fmtDT = ts => { const d = new Date(ts); return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}, ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} Uhr`; };
function backupStatus() {
  if (!meta.changes) return meta.lastExport ? `Alles gesichert (zuletzt ${fmtDT(meta.lastExport)}).` : 'Noch keine Änderungen.';
  return `<b>${meta.changes} Änderung${meta.changes > 1 ? 'en' : ''}</b> seit ${meta.lastExport ? 'der letzten Sicherung am ' + fmtDT(meta.lastExport) : 'Beginn – noch nie gesichert'}.`;
}
function collectData() {
  const pieces = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i); if (!k || !k.startsWith('bach.sections.')) continue;
    try { pieces[k.slice('bach.sections.'.length)] = { sections: JSON.parse(localStorage.getItem(k)) }; } catch (e) {}
  }
  return { app: 'bach-notenbuecher', version: 1, exported: new Date().toISOString(), settings: S, pieces };
}
async function exportData() {
  const json = JSON.stringify(collectData(), null, 1);
  const d = new Date(), name = `bach-sicherung-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
  const done = () => { meta.changes = 0; meta.lastExport = Date.now(); saveMeta(); syncDirty(); toast('Gesichert: ' + name); showBackup(); };
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Bach-Sicherung' }); return done(); }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); done();
}
let pendingImport = null;
function importFile(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (d.app !== 'bach-notenbuecher' || !d.pieces) throw new Error('kein Bach-Format');
      pendingImport = d; showBackup();
    } catch (e) { toast('Diese Datei ist keine Bach-Sicherung'); }
  };
  r.readAsText(file);
}
function applyImport() {
  const d = pendingImport; pendingImport = null;
  Object.entries(d.pieces).forEach(([k, v]) => { try { localStorage.setItem('bach.sections.' + k, JSON.stringify(v.sections || [])); } catch (e) {} });
  try { sections = JSON.parse(localStorage.getItem(SEC_KEY) || '[]'); } catch (e) {}
  meta.changes = 0; meta.lastExport = Date.parse(d.exported) || Date.now(); saveMeta(); syncDirty();
  if (rendered) rerender(); renderSecList(); toast('Sicherung eingespielt'); showBackup();
}
function showBackup() {
  const n = pendingImport ? Object.values(pendingImport.pieces).reduce((x, p) => x + (p.sections || []).length, 0) : 0;
  const h = `<div class="lbl">Sicherung</div><h4>Deine Notenbuch-Daten</h4>
    <div class="row" style="display:block">${backupStatus()}</div>
    <div class="small">Übe-Abschnitte, Bewertungen und Übezeiten liegen nur in diesem Browser. Exportiere sie als Datei (z. B. in „Dateien“ oder iCloud), um sie zu sichern oder auf ein anderes Gerät zu bringen.</div>
    ${pendingImport ? `<div class="ghostnote">Datei vom ${fmtDT(Date.parse(pendingImport.exported))} mit ${n} Übe-Abschnitt${n === 1 ? '' : 'en'}. Einspielen ersetzt die aktuellen Daten.</div>` : ''}
    <div class="btns">${pendingImport ? '<button data-act="apply">Jetzt einspielen</button><button data-act="cancel">Abbrechen</button>'
      : '<button data-act="export">Exportieren</button><button data-act="import">Importieren …</button>'}</div>`;
  openInfo(h, act => {
    if (act === 'export') exportData();
    if (act === 'import') $('#importFile').click();
    if (act === 'apply') applyImport();
    if (act === 'cancel') { pendingImport = null; showBackup(); }
  });
}
$('#importFile').addEventListener('change', e => { const f = e.target.files[0]; if (f) importFile(f); e.target.value = ''; });
$$('.backupBtn').forEach(b => b.addEventListener('click', () => { $('#secPanel').classList.remove('show'); showBackup(); }));
syncDirty();

// ---------- Übe-Abschnitte ----------
let SEC_KEY = 'bach.sections.none';
const RATINGS = [
  { name: 'neu', c: '#9a8b75' }, { name: 'wackelt', c: '#b4442f' }, { name: 'geht', c: '#c3912a' }, { name: 'sitzt', c: '#3f7d4f' },
];
let sections = [];
function loadSections(id) {
  if (practice) stopPractice();
  SEC_KEY = 'bach.sections.' + id; sections = [];
  try { sections = JSON.parse(localStorage.getItem(SEC_KEY) || '[]'); } catch (e) {}
  const lbl = $('#secPanel .lbl'); if (lbl) lbl.textContent = 'Übe-Abschnitte · ' + ((catalog.find(c => c.id === id) || {}).title || id);
}
const saveSections = () => { try { localStorage.setItem(SEC_KEY, JSON.stringify(sections)); } catch (e) { toast('Speichern nicht möglich'); } markDirty(); };
let practice = null, practiceTick = null, secHits = [], confirmDel = null;
const fmtTime = sec => { sec = Math.round(sec); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s2 = sec % 60;
  return h ? `${h} h ${m} min` : m ? `${m}:${String(s2).padStart(2, '0')} min` : `${s2} s`; };
const fmtDate = ts => { const d = new Date(ts); return `${d.getDate()}.${d.getMonth() + 1}.`; };
function addSection(a, b) {
  const sec = { id: 's' + Date.now().toString(36), a, b, name: a === b ? `Takt ${mLabel(a)}` : `Takte ${mLabel(a)}–${mLabel(b)}`, rating: 0, total: 0, sessions: [], created: Date.now() };
  sections.push(sec); sections.sort((x, y) => x.a - y.a || x.b - y.b); saveSections(); if (sections.length === 1) rerender(); else drawSections();
  return sec;
}
function selectSection(sec) {
  endMarkMode(); selNote = null; selHidden = false; selRange = { a: sec.a, b: sec.b };
  playhead = (sec.a - 1) * MEASURE; markSelection(); updateCursor(); showSection(sec);
}
function practiceSec(sec) { return practice && practice.id === sec.id ? (Date.now() - practice.start) / 1000 : 0; }
// Ein Übe-Abschnitt ist ein normales Analyse-Fenster mit Namen, Bewertung und Übezeit
function showSection(sec) {
  if (!selRange || selRange.a !== sec.a || selRange.b !== sec.b) selRange = { a: sec.a, b: sec.b };
  showRangeInfo();
}
function sectionHTML(sec) {
  const last = sec.sessions.slice(-3).reverse();
  return `<div class="row"><span class="k">Wie klappt’s?</span></div>
    <div class="rate">${RATINGS.map((r, i) => `<button data-act="rate${i}" class="${sec.rating === i ? 'act' : ''}" style="--rc:${r.c}">${r.name}</button>`).join('')}</div>
    <div class="row"><span class="k">Übezeit</span><span id="secTime">${fmtTime(sec.total + practiceSec(sec))} gesamt · ${sec.sessions.length} Mal geübt</span></div>
    ${last.length ? `<div class="sesslog">${last.map(x => `<div>${fmtDate(x.at)} · ${fmtTime(x.sec)} · <span style="color:${RATINGS[x.rating].c}">${RATINGS[x.rating].name}</span></div>`).join('')}</div>` : ''}`;
}
function sectionAct(sec, act) {
  const running = practice && practice.id === sec.id;
  if (act.startsWith('rate')) { sec.rating = +act.slice(4); saveSections(); drawSections(); renderSecList(); showRangeInfo(); return true; }
  if (act === 'timer') { if (running) stopPractice(); else startPractice(sec); showRangeInfo(); return true; }
  if (act === 'del') {
    if (confirmDel !== sec.id) { confirmDel = sec.id; showRangeInfo(); setTimeout(() => { confirmDel = null; }, 3000); return true; }
    if (practice && practice.id === sec.id) stopPractice();
    sections = sections.filter(x => x.id !== sec.id); saveSections(); drawSections(); renderSecList(); confirmDel = null; showRangeInfo(); return true;
  }
  return false;
}
function startPractice(sec) {
  if (practice) stopPractice();
  practice = { id: sec.id, start: Date.now() };
  $('#practiceChip').style.display = '';
  clearInterval(practiceTick);
  practiceTick = setInterval(() => {
    const s2 = sections.find(x => x.id === practice.id); if (!s2) return;
    const run = (Date.now() - practice.start) / 1000;
    $('#practiceChip').innerHTML = IC.timer + fmtTime(run).replace(' min', '');
    const el = $('#secTime'); if (el && $('#secName')) el.textContent = `${fmtTime(s2.total + run)} gesamt · ${s2.sessions.length} Mal geübt`;
  }, 1000);
  $('#practiceChip').innerHTML = IC.timer + '0 s';
}
function stopPractice() {
  if (!practice) return;
  const sec = sections.find(x => x.id === practice.id), dur = (Date.now() - practice.start) / 1000;
  if (sec && dur >= 5) { sec.total += dur; sec.sessions.push({ at: Date.now(), sec: Math.round(dur), rating: sec.rating }); saveSections(); renderSecList(); }
  practice = null; clearInterval(practiceTick); $('#practiceChip').style.display = 'none';
}
// Farbige Leisten über den Takten jedes Abschnitts
function drawSections() {
  const layer = $('#secLayer'); layer.innerHTML = ''; secHits = [];
  if (!layout) return;
  // Oberkante je System (höchster Punkt aller Takte), damit alle Leisten einer Zeile fluchten
  const sysTop = {};
  Object.values(layout.measures).forEach(m => { sysTop[m.sys] = Math.min(sysTop[m.sys] ?? 1e9, m.t); });
  // Spuren: überlappende Abschnitte bekommen eine eigene Spur
  const laneEnd = [], lanes = {};
  [...sections].sort((x, y) => x.a - y.a || y.b - x.b).forEach(sec => {
    let l = laneEnd.findIndex(e => e < sec.a); if (l < 0) { l = laneEnd.length; laneEnd.push(0); }
    laneEnd[l] = sec.b; lanes[sec.id] = l;
  });
  sections.forEach(sec => {
    const lane = lanes[sec.id], col = RATINGS[sec.rating].c;
    let cur = null, first = true;
    const flush = () => {
      if (!cur) return;
      const top = sysTop[cur.sys] - 14 - lane * 22;
      const l = cur.l + 2, w = cur.r - cur.l - 4;
      const bar = document.createElement('div'); bar.className = 'secbar';
      Object.assign(bar.style, { left: l + 'px', width: w + 'px', top: top + 'px', background: col });
      layer.appendChild(bar);
      const lb = document.createElement('div'); lb.className = 'seclbl';
      lb.textContent = first ? sec.name : '… ' + sec.name; lb.style.left = l + 'px'; lb.style.top = (top - 18) + 'px'; lb.style.color = col;
      if (!first) lb.style.opacity = .6;
      layer.appendChild(lb); first = false;
      secHits.push({ id: sec.id, l, r: l + w, t: top - 18, b: top + 5 });
    };
    for (let k = sec.a; k <= sec.b; k++) {
      const m = layout.measures[k]; if (!m) continue;
      if (cur && cur.sys === m.sys) cur.r = m.r;
      else { flush(); cur = { l: m.l, r: m.r, sys: m.sys }; }
    }
    flush();
  });
}
// Liste aller Abschnitte
function renderSecList() {
  const el = $('#secList'); if (!el) return;
  if (!sections.length) { el.innerHTML = '<div class="small">Noch keine Abschnitte. Takt antippen, innerhalb von 2 s einen zweiten Takt antippen, dann „＋ Übe-Abschnitt“.</div>'; return; }
  const total = sections.reduce((x, y) => x + y.total, 0);
  el.innerHTML = sections.map(sec => `<button class="secitem" data-id="${sec.id}">
      <span class="dot" style="background:${RATINGS[sec.rating].c}"></span>
      <span class="nm">${sec.name}<br><i>T. ${sec.a}${sec.b !== sec.a ? '–' + sec.b : ''} · ${RATINGS[sec.rating].name}</i></span>
      <span class="tm">${fmtTime(sec.total)}</span></button>`).join('') + `<div class="small" style="margin-top:8px">Gesamt geübt: ${fmtTime(total)}</div>`;
}
$('#practiceBtn').onclick = () => { $('#aboutPanel').classList.remove('show'); $('#info').classList.remove('show'); $('#viewPanel').classList.remove('show'); renderSecList(); $('#secPanel').classList.toggle('show'); };
$('#secList').addEventListener('click', e => {
  const b = e.target.closest('.secitem'); if (!b) return;
  const sec = sections.find(x => x.id === b.dataset.id); $('#secPanel').classList.remove('show');
  selectSection(sec);
  const m = layout && layout.measures[sec.a]; if (m) $('#scroller').scrollTo({ top: Math.max(1, m.t + $('#page').offsetTop - 120), behavior: 'smooth' });
});
$('#practiceChip').onclick = () => { const sec = practice && sections.find(x => x.id === practice.id); if (sec) selectSection(sec); };

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
  const sh = secHits.find(h => x >= h.l - 4 && x <= h.r + 4 && y >= h.t - 12 && y <= h.b + 12);
  if (sh && Date.now() >= markUntil) { const sec = sections.find(z => z.id === sh.id); if (sec) { selectSection(sec); return; } }
  if (Date.now() < markUntil) { const mk = measureAt(x, y); if (mk) { selectMeasure(mk); return; } } // Markiermodus hat Vorrang
  let best = null, bd = 26;
  for (const h of layout.heads) { if (h.e.type !== 'note') continue; const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h.e; } }
  if (best) {
    const n = best.tieEnd ? findTieStart(best) : best;
    selectNote(best);
    if (n.grace) audio.note(n.midi, audio.now() + 0.01, 0.35, 0.8, n.role);
    else playOrnamented(n, audio.now() + 0.01, Math.min(1.6, n.playTicks * spt()), 0.8);
    return;
  }
  // Aktive Markierungen werden nur über den Mülleimer gelöscht – Tippen daneben ändert sie nicht
  if (selRange) { if (selNote) { selNote = null; markSelection(); } return; }
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
    const crossed = playable.filter(n => n.onset > lo && n.onset <= hi && audible(n));
    crossed.slice(-6).forEach(n => audio.note(n.midi, audio.now() + 0.005, Math.min(0.5, n.ticks * spt()), 0.62, n.role));
    flashNotes(crossed.map(n => n.id));
  }
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => { // Finger ruht: Zusammenklang erklingt
    const snd = playable.filter(n => n.onset <= playhead && n.onset + n.playTicks > playhead && audible(n));
    snd.forEach(n => audio.note(n.midi, audio.now() + 0.01, 1.3, 0.5, n.role));
    flashNotes(snd.map(n => n.id));
  }, 380);
}
let flashSet = [];
function flashNotes(ids) {
  flashSet.forEach(id => { const el = document.getElementById(id); el && el.classList.remove('on'); });
  flashSet = ids;
  ids.forEach(id => { const el = document.getElementById(id); el && el.classList.add('on'); });
}

// ---------- Raumklang ----------
// Synthetische Raumimpulsantworten: frühe Reflexionen per Spiegelquellen-Modell (Quaderraum)
// + diffuser Nachhall mit frequenzabhängiger Abklingzeit (Höhen klingen schneller ab).
const ROOMS = {
  zimmer: { name: 'Zimmer', dim: [5.2, 4.1, 2.7], src: [1.6, 2.4, 1.1], mic: [3.4, 1.9, 1.2], rt: 0.42, hfRatio: 0.6, lfRatio: 1.1, pre: 0.002, wet: 0.30, dry: 0.95, order: 4 },
  halle:  { name: 'Halle',  dim: [34, 22, 15],   src: [17, 6, 1.4],    mic: [15.5, 15, 1.6], rt: 1.9, hfRatio: 0.55, lfRatio: 1.2, pre: 0.016, wet: 0.36, dry: 0.85, order: 3 },
  kirche: { name: 'Kirche', dim: [52, 19, 24],   src: [12, 9.5, 1.4],  mic: [24, 8.5, 1.7],  rt: 4.2, hfRatio: 0.42, lfRatio: 1.3, pre: 0.028, wet: 0.46, dry: 0.74, order: 3 },
};
function buildIR(ctx, P) {
  const sr = ctx.sampleRate, len = Math.ceil(sr * (P.rt * 1.35 + 0.1));
  const ir = ctx.createBuffer(2, len, sr);
  const [Lx, Ly, Lz] = P.dim, V = Lx * Ly * Lz, S = 2 * (Lx * Ly + Lx * Lz + Ly * Lz);
  const alpha = Math.min(0.9, Math.max(0.02, 0.161 * V / (S * P.rt)));
  const R = Math.sqrt(1 - alpha), c = 343;
  const ears = [-0.12, 0.12]; // zwei Mikrofone, leicht versetzt -> Stereobild
  const direct = Math.hypot(P.src[0] - P.mic[0], P.src[1] - P.mic[1], P.src[2] - P.mic[2]);
  const erEnd = Math.min(0.12, 0.02 + P.rt * 0.04);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    const mic = [P.mic[0] + ears[ch], P.mic[1], P.mic[2]];
    // --- frühe Reflexionen ---
    const N = P.order;
    for (let nx = -N; nx <= N; nx++) for (let ny = -N; ny <= N; ny++) for (let nz = -N; nz <= N; nz++) {
      for (const px of [0, 1]) for (const py of [0, 1]) for (const pz of [0, 1]) {
        const refl = Math.abs(2 * nx - px) + Math.abs(2 * ny - py) + Math.abs(2 * nz - pz);
        if (refl === 0 || refl > N) continue;
        const ix = (1 - 2 * px) * P.src[0] + 2 * nx * Lx, iy = (1 - 2 * py) * P.src[1] + 2 * ny * Ly, iz = (1 - 2 * pz) * P.src[2] + 2 * nz * Lz;
        const dist = Math.hypot(ix - mic[0], iy - mic[1], iz - mic[2]);
        const t = P.pre + (dist - direct) / c;
        if (t < 0 || t > erEnd) continue;
        const amp = Math.pow(R, refl) * direct / dist * 0.9;
        const pos = t * sr, i0 = Math.floor(pos), fr = pos - i0;
        // Wandreflexionen dämpfen Höhen: Impuls etwas verschmiert, je öfter reflektiert
        const spread = 1 + refl;
        for (let k = 0; k < spread * 2 && i0 + k < len; k++) d[i0 + k] += amp * (k === 0 ? 1 - fr : 1) * Math.exp(-k / spread) / spread * 1.6;
      }
    }
    // --- diffuser Nachhall in drei Bändern ---
    const tm = erEnd * 0.6;
    const bands = [{ rt: P.rt * P.lfRatio, lp: 300 }, { rt: P.rt, lp: 3000 }, { rt: P.rt * P.hfRatio, lp: 0 }];
    const lowA = Math.exp(-2 * Math.PI * 300 / sr), midA = Math.exp(-2 * Math.PI * 3000 / sr);
    let l1 = 0, l2 = 0;
    const tailGain = 0.5 * Math.pow(R, 2);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      if (t < P.pre + tm * 0.3) continue;
      const n = Math.random() * 2 - 1;
      l1 = (1 - lowA) * n + lowA * l1;          // tief
      l2 = (1 - midA) * n + midA * l2;          // bis 3 kHz
      const low = l1, mid = l2 - l1, high = n - l2;
      const tt = t - P.pre;
      const env = b => Math.exp(-6.91 * tt / b.rt);
      const fadeIn = Math.min(1, (t - P.pre - tm * 0.3) / (tm * 1.2 + 0.005));
      d[i] += tailGain * fadeIn * (low * env(bands[0]) * 1.6 + mid * env(bands[1]) + high * env(bands[2]) * 0.55);
    }
  }
  // Energie normieren, damit die Räume gleich laut wirken (Mischung über wet)
  let e = 0; for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) e += d[i] * d[i]; }
  const g = 1 / Math.sqrt(e / 2 + 1e-9) * 0.35;
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] *= g; }
  return ir;
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
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 2.5; comp.knee.value = 12;
      comp.attack.value = 0.02; comp.release.value = 0.25;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 28; hp.Q.value = 0.6; // entfernt Gleichanteil/Rumpeln
      master.connect(hp); hp.connect(comp); comp.connect(ctx.destination);
      // Raumklang: trocken + Faltungshall
      this.master = master;
      this.out = ctx.createGain();
      this.dry = ctx.createGain(); this.wet = ctx.createGain();
      this.out.connect(this.dry); this.dry.connect(master); this.wet.connect(master);
      this.irCache = {};
      this.setRoom(S.room, true);
      const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); // iOS entsperren
      this.makeWaves();
      if (S.instr === 'grand') this.loadSamples();
    }
    if (this.ctx.state !== 'running') this.ctx.resume();
  },
  async setRoom(room, instant) {
    const ctx = this.ctx; if (!ctx) return;
    const P = ROOMS[room] || ROOMS.halle;
    let buf = this.irCache[room];
    if (!buf) {
      try { // gemessene Impulsantwort im Repo (ir/zimmer.wav …) hat Vorrang
        const r = await fetch('ir/' + room + '.wav');
        if (r.ok) { const ab = await r.arrayBuffer(); buf = await new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)).catch(() => null); }
      } catch (e) {}
      if (!buf) buf = buildIR(ctx, P);
      this.irCache[room] = buf;
    }
    const conv = ctx.createConvolver(); conv.normalize = false; conv.buffer = buf;
    this.out.connect(conv); conv.connect(this.wet);
    const t = ctx.currentTime, k = instant ? 0.001 : 0.12;
    if (this.conv) { const old = this.conv; setTimeout(() => { try { this.out.disconnect(old); old.disconnect(); } catch (e) {} }, 400); }
    this.conv = conv;
    this.dry.gain.setTargetAtTime(P.dry, t, k);
    this.wet.gain.setTargetAtTime(P.wet, t, k);
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
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vel * 0.9, when + 0.004); // weicher Einsatz, kein Knacken
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
  snapSelToPlayhead(from);
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
// ---------- Verzierungen und Vorschläge hörbar machen (barocke Ausführung) ----------
const SEMI_STEPS = [0, 2, 4, 5, 7, 9, 11];
function auxPitch(n, dir) { // diatonischer Nachbarton über (+1) oder unter (−1) der Note
  let step = n.step + dir, oct = n.oct;
  if (step > 6) { step = 0; oct++; } if (step < 0) { step = 6; oct--; }
  const base = 12 * (oct + 1) + SEMI_STEPS[step];
  // geschriebenes Vorzeichen derselben Stufe weiter vorn im Takt gilt
  const prev = model.notes.filter(x => x.measure === n.measure && x.step === step && x.oct === oct && x.onset < n.onset - 1e-6).pop();
  if (prev) return base + prev.alter;
  const sc = scaleSet(harmony.keys[n.measure - 1] || pieceKey(piece));
  for (const a of [KEY_ALTER[step] || 0, 0, -1, 1]) if (sc.has(((base + a) % 12 + 12) % 12)) return base + a;
  return base + (KEY_ALTER[step] || 0);
}
function playOrnamented(n, when, len, vel) {
  const play = (midi, t, d, v) => audio.note(midi, t, Math.max(0.03, d), v, n.role);
  if (!S.orn || (!n.graces && !n.orn)) return play(n.midi, when, len, vel);
  const dt = 0.068 * Math.sqrt(100 / S.tempoPct); // Dauer eines Verzierungstons
  let t = when, L = len;
  // Vorschläge
  if (n.graces && n.graces.length) {
    const g = n.graces;
    if (g[0].grace === 'acc' && g.length === 1) {
      // langer Vorschlag: auf den Schlag, nimmt die Hälfte (bei punktierter Note zwei Drittel) des Werts
      const a = Math.min(n.dots ? L * 2 / 3 : L / 2, Math.max(L / 2, 0.6));
      play(g[0].midi, t, a * 1.02, vel * 1.08); t += a; L -= a; vel *= 0.8;
    } else {
      // kurzer Vorschlag: sehr kurz auf den Schlag
      const d = Math.min(dt, L / (g.length + 2));
      g.forEach(x => { play(x.midi, t, d * 1.1, vel * 0.9); t += d; L -= d; });
    }
  }
  const o = n.orn;
  const up = () => auxPitch(n, 1), down = () => auxPitch(n, -1);
  const seq = (list, f = 1) => { list.forEach(m => { play(m, t, dt * 1.08, vel * 0.85 * f); t += dt; L -= dt; }); };
  const TRILLS = ['trill', 'trillmord', 'prallprall', 'dcad', 'acad', 'ltrill', 'prallup'];
  if (TRILLS.includes(o)) {
    const TR = 0.7; // echte Triller deutlich leiser
    // Anfang: Doppelt-Cadence (oben–Haupt–unten–Haupt), Triller von unten, gehaltener Vorhalt
    if (o === 'dcad' && L > 7 * dt) seq([up(), n.midi, down(), n.midi], TR);
    if (o === 'acad' && L > 6 * dt) seq([down(), n.midi], TR);
    if (o === 'ltrill' && L > 6 * dt) { const h = Math.min(L * 0.3, 0.45); play(up(), t, h * 1.02, vel * 0.9); t += h; L -= h; seq([n.midi], TR); }
    if (L < 4 * dt) seq([up(), n.midi], TR);
    else {
      const u = up(), tail = (o === 'trillmord' || o === 'prallup') ? 2 : 0;
      let k = Math.floor((L * (o === 'prallprall' ? 0.6 : 0.8)) / dt) - tail; if (k % 2) k--; k = Math.max(2, k);
      for (let i = 0; i < k; i++) { play(i % 2 ? n.midi : u, t, dt * 1.08, vel * TR * (i === 0 ? 1 : 0.8)); t += dt; L -= dt; }
      if (tail) seq([down(), n.midi], TR);
    }
  } else if (o === 'prall') {
    seq(L < 5 * dt ? [up(), n.midi] : [up(), n.midi, up()]);
  } else if (o === 'mordent') {
    seq([n.midi, down()]);
  } else if (o === 'turn') {
    seq([up(), n.midi, down()]);
  }
  if (L > 0.02) play(n.midi, t, L, vel * 0.95);
}

function schedule() {
  if (!playing) return;
  const s = spt(), now = audio.now();
  const horizon = pl.t0Tick + (now + 0.18 - pl.t0Time) / s;
  while (pl.idx < playable.length && playable[pl.idx].onset < Math.min(horizon, pl.end)) {
    const n = playable[pl.idx++];
    if (!audible(n)) continue;
    const when = pl.t0Time + (n.onset - pl.t0Tick) * s;
    const len = Math.min(n.playTicks, pl.end - n.onset) * s;
    const accent = Math.abs(n.onset % BEAT) < 1e-6 ? 1 : Math.abs(n.onset % (TPW / 8)) < 1e-6 ? 0.88 : 0.78;
    const vv = { 1: 0.95, 2: 0.78, 4: 0.78, 3: 0.88 }[n.role] || 0.85;
    playOrnamented(n, Math.max(when, now), Math.max(0.05, len * 0.97), accent * vv);
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
    playhead = t; updateCursor(); followPlayhead(t); refreshAnalysis();
    const ids = model.notes.filter(n => n.onset <= t && n.onset + n.ticks > t && audible(n)).map(n => n.id);
    if (ids.join() !== onSet.join()) { flashNotes(ids); onSet = ids; }
    autoScroll();
  }
  raf = requestAnimationFrame(frame);
}
// Markierung folgt dem Abspielkopf: erreicht er die erste Note hinter dem markierten Abschnitt,
// rückt das Rechteck um seine eigene Länge weiter
function firstOnsetFrom(tick) { const n = playable.find(x => x.onset >= tick - 1e-6 && !x.grace); return n ? n.onset : Infinity; }
function snapSelToPlayhead(t) {   // bei Neupositionierung: Rechteck springt zum Abspielkopf
  if (!S.follow || !selRange || loopOn || handleDrag) return;
  const m = Math.floor(t / MEASURE + 1e-6) + 1;
  if (m >= selRange.a && m <= selRange.b) return;
  const len = selRange.b - selRange.a + 1, N = model.measures;
  selRange = { a: m, b: Math.min(N, m + len - 1) }; markSelection();
  if (infoShown() && !selNote) showRangeInfo();
}
function followPlayhead(t) {
  if (!S.follow || !selRange || loopOn || handleDrag) return;
  let { a, b } = selRange, moved = false;
  const len = b - a + 1, N = model.measures;
  while (b < N && t >= firstOnsetFrom(b * MEASURE)) { a = b + 1; b = Math.min(N, b + len); moved = true; }
  if (moved) { selRange = { a, b }; markSelection(); if (infoShown() && !selNote) showRangeInfo(); }
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
function setPlayIcon() {
  const b = $('#play'); b.innerHTML = playing ? ICON_STOP : ICON_PLAY; b.title = playing ? 'Anhalten' : 'Abspielen';
  $$('#infoBody [data-act="play"]').forEach(x => { x.innerHTML = playing ? IC.stop + 'Stopp' : IC.play + x.dataset.label; });
}
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
function buildChips() {
  const box = $('.chips'); if (!box || !model) return;
  box.innerHTML = model.roles.map(r => `<button class="chip" data-v="${r}" title="${VOICE_NAMES[r]} stumm/an">${(VOICE_NAMES[r] || '?')[0]}</button>`).join('');
  $$('.chip').forEach(c => {
    const v = +c.dataset.v; c.classList.toggle('mute', S.mute.includes(v));
    c.onclick = () => { S.mute = S.mute.includes(v) ? S.mute.filter(x => x !== v) : S.mute.concat(v); c.classList.toggle('mute', S.mute.includes(v)); save(); };
  });
}
$('#roomSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.room = b.dataset.r; save(); syncPanel(); if (audio.ctx) audio.setRoom(S.room); else audio.ensure(); toast('Raum: ' + ROOMS[S.room].name); };
$('#instr').value = S.instr;
$('#instr').onchange = () => { S.instr = $('#instr').value; save(); audio.ensure(); if (S.instr === 'grand') audio.loadSamples(); };

// ---------- Tastenkürzel (Notenansicht) ----------
function cursorVisible() {
  const p = tickToPos(playhead), sc = $('#scroller'); if (!p) return;
  const top = p.top + pageEl.offsetTop, bottom = top + p.h;
  if (top < sc.scrollTop + 10 || bottom > sc.scrollTop + sc.clientHeight - 40) sc.scrollTo({ top: Math.max(1, top - sc.clientHeight * 0.25), behavior: 'smooth' });
}
function jumpTo(tick, audition) {
  tick = Math.max(0, Math.min(TOTAL - 1, tick));
  if (playing) { startPlayback(tick); return; }
  playhead = tick; updateCursor(); cursorVisible(); snapSelToPlayhead(tick); refreshAnalysis();
  if (audition) {   // angesprungenen Zusammenklang kurz anspielen
    audio.ensure();
    const ns = playable.filter(n => !n.grace && Math.abs(n.onset - tick) < 1e-6 && audible(n));
    ns.forEach(n => audio.note(n.midi, audio.now() + 0.02, Math.min(0.9, Math.max(0.25, n.ticks * spt())), 0.7, n.role));
    flashNotes(ns.map(n => n.id)); clearTimeout(jumpTo.t); jumpTo.t = setTimeout(() => flashNotes([]), 450);
  }
}
const measStart = k => (k - 1) * MEASURE;
document.addEventListener('keydown', e => {
  if (!$('#scoreView').classList.contains('show') || !model) return;
  const tg = e.target; if (tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) && tg.type !== 'range')) return;
  const k = e.key, mod = e.metaKey || e.ctrlKey, alt = e.altKey, eps = 1e-6;
  const here = playing ? curTick() : playhead;
  const curM = Math.floor(here / MEASURE + eps) + 1;
  if (k === ' ') { e.preventDefault(); if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur(); $('#play').click(); return; }
  if (k === 'ArrowLeft' || k === 'ArrowRight') {
    e.preventDefault();
    const right = k === 'ArrowRight';
    if (mod) {            // Übe-Abschnitte
      const secs = sections.slice().sort((x, y) => x.a - y.a);
      if (!secs.length) { toast('Noch keine Übe-Abschnitte angelegt'); return; }
      const starts = secs.map(x => firstOnsetFrom(measStart(x.a)));
      let t;
      if (right) t = starts.find(x => x > here + eps);
      else t = starts.filter(x => x < here - eps).pop();   // Anfang des aktuellen, am Anfang stehend des vorigen
      if (t == null || !isFinite(t)) { toast(right ? 'Kein weiterer Übe-Abschnitt' : 'Kein früherer Übe-Abschnitt'); return; }
      const sec = secs[starts.indexOf(t)];
      jumpTo(t, false); toast('Übe-Abschnitt: ' + sec.name);
    } else if (alt) {     // taktweise
      const st = measStart(curM);
      const t = right ? measStart(curM + 1) : (here > firstOnsetFrom(st) + eps ? st : measStart(curM - 1));
      if (t >= TOTAL) return;
      jumpTo(Math.max(firstOnsetFrom(Math.max(0, t)), 0), true);
    } else {              // notenweise
      const ons = [...new Set(playable.filter(n => !n.grace).map(n => n.onset))];
      const t = right ? ons.find(x => x > here + eps) : ons.filter(x => x < here - eps).pop();
      if (t != null) jumpTo(t, true);
    }
    return;
  }
  if (mod || alt) return;
  if (k === 'i' || k === 'I') { e.preventDefault(); if ($('#aboutBtn').style.display === 'none') toast('Für dieses Stück gibt es noch keine Werkinfo'); else $('#aboutBtn').click(); return; }
  if (k === 'm' || k === 'M') {
    e.preventDefault();
    endMarkMode(); selNote = null; selHidden = false;
    selRange = { a: curM, b: curM }; markSelection(); showRangeInfo();
    return;
  }
});

// ---------- Ansicht-Panel ----------
// ---------- Über das Stück (i) ----------
let aboutFor = null;
async function loadAbout(id, meta) {
  aboutFor = id;
  let d = null;
  try { const r = await fetch('pieces/notes/' + id + '.json'); if (r.ok) d = await r.json(); } catch (e) {}
  if (aboutFor !== id) return;
  $('#aboutBtn').style.display = d ? '' : 'none';
  if (!d) return;
  const mref = (a, b) => `<button class="mref" data-a="${a}" data-b="${b || a}">T. ${a}${b && b !== a ? '–' + b : ''}</button>`;
  const fmt = t => t.replace(/(\(?)\{T(\d+)(?:-(\d+))?\}([),:;.]*)/g, (_, o, a, b, c) => `<span class="nw">${o}${mref(+a, b ? +b : +a)}${c}</span>`);
  $('#aboutBody').innerHTML = `<h3>${meta.title || ''}</h3><div class="sub">${[meta.keyName, meta.bwv ? 'BWV ' + meta.bwv : ''].filter(Boolean).join(' · ')}</div>` +
    d.sections.map(s => `<h4>${s.h}</h4>` + s.p.map(p => `<p>${fmt(p)}</p>`).join('')).join('') +
    (d.sources && d.sources.length ? `<div class="src">Quellen: ${d.sources.map(s => `<a href="${s.u}" target="_blank" rel="noopener">${s.t}</a>`).join(' · ')}</div>` : '');
}
$('#aboutBtn').onclick = () => { $('#info').classList.remove('show'); $('#secPanel').classList.remove('show'); $('#viewPanel').classList.remove('show'); $('#aboutPanel').classList.toggle('show'); $('#aboutPanel').scrollTop = 0; };
$('#aboutX').onclick = () => $('#aboutPanel').classList.remove('show');
$('#aboutBody').addEventListener('click', e => {
  const b = e.target.closest('.mref'); if (!b || !layout) return;
  const off = PIECE && PIECE.pickup ? 1 : 0;   // gedruckte Taktnummer → interner Takt
  const a = +b.dataset.a + off, z = +b.dataset.b + off;
  $('#aboutPanel').classList.remove('show');
  endMarkMode(); selNote = null; selRange = { a, b: z }; loopOn = false;
  playhead = (a - 1) * MEASURE; markSelection(); updateCursor(); showRangeInfo();
  const m = layout.measures[a]; if (m) $('#scroller').scrollTo({ top: Math.max(1, m.t + $('#page').offsetTop - 140), behavior: 'smooth' });
});

$('#viewBtn').onclick = () => { $('#aboutPanel').classList.remove('show'); $('#info').classList.remove('show'); $('#secPanel').classList.remove('show'); $('#viewPanel').classList.toggle('show'); };
function syncPanel() {
  $$('#colSeg button').forEach(b => b.classList.toggle('act', b.dataset.c === S.col));
  $('#harmSw').classList.toggle('act', S.harm);
  $('#ornSw').classList.toggle('act', S.orn);
  $$('#roomSeg button').forEach(b => b.classList.toggle('act', b.dataset.r === S.room));
  $('#ghostSw').classList.toggle('act', S.ghosts);
  $('#ghostCount').textContent = model ? `(${model.notes.filter(n => n.ghost).length} Stellen)` : '';
  $('#sampleBase').value = S.sampleBase;
}
syncPanel();
$('#colSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.col = b.dataset.c; save(); syncPanel(); decorate(); };
$('#harmSw').onclick = () => { S.harm = !S.harm; save(); syncPanel(); rerender(); };
$('#ornSw').onclick = () => { S.orn = !S.orn; save(); syncPanel(); };
$('#ghostSw').onclick = () => { S.ghosts = !S.ghosts; save(); syncPanel(); rerender(); };
$('#zoomIn').onclick = () => { S.zoom = Math.min(1.6, +(S.zoom + 0.1).toFixed(2)); save(); rerender(); };
$('#zoomOut').onclick = () => { S.zoom = Math.max(0.6, +(S.zoom - 0.1).toFixed(2)); save(); rerender(); };
$('#sampleBase').onchange = () => { S.sampleBase = $('#sampleBase').value.trim() || DEFAULTS.sampleBase; save(); audio.buffers = {}; audio.loading = null; if (audio.ctx && S.instr === 'grand') audio.loadSamples(); };
function rerender() { if (rendered && tk) render(); }
let rz = null;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(rerender, 250); });
})();
