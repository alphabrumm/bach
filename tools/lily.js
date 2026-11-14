// Kleiner LilyPond-Parser für die Mutopia-Quellen der Inventionen & Sinfonien.
// Versteht die Teilmenge, die dort vorkommt: \relative, Akkorde, Polyphonie << { } \\ { } >>,
// \times/\tuplet, \grace (wird übersprungen), \repeat volta, \clef, \key, \time, \partial, \change Staff.
'use strict';
const TPW = 96; // Ticks pro Ganze (Zweiunddreißigstel = 3, Triolen-Achtel = 8)
const STEPS = 'cdefgab';
const SEMI = [0, 2, 4, 5, 7, 9, 11];
// Verzierungen: prall = Pralltriller (kurz, von oben), trill = Triller, trillmord = Triller mit Nachschlag
// Verzierungen: eigene Kürzel, damit Notenbild und Wiedergabe das Zeichen genau treffen
const ORN = { prall: 'prall', mordent: 'mordent', downmordent: 'mordent', upmordent: 'prall', trill: 'trill', prallprall: 'prallprall',
  downprall: 'dcad', upprall: 'acad', prallup: 'prallup', turn: 'turn', fermata: 'fermata', prallmordent: 'trillmord', lineprall: 'ltrill',
  reverseturn: 'turn', mordentprall: 'mordent' };
const NOARG = new Set(['voiceOne', 'voiceTwo', 'voiceThree', 'voiceFour', 'oneVoice', 'stemUp', 'stemDown', 'stemNeutral', 'break', 'noBreak',
  'pageBreak', 'autoBeamOff', 'autoBeamOn', 'shiftOn', 'shiftOff', 'shiftOnn', 'tieUp', 'tieDown', 'tieNeutral', 'slurUp', 'slurDown',
  'slurNeutral', 'dynamicUp', 'dynamicDown', 'arpeggio', 'staccato', 'tenuto', 'accent', 'p', 'f', 'mf', 'mp', 'pp', 'ff', 'sf',
  'cresc', 'decresc', 'dim', '!', 'startTrillSpan', 'stopTrillSpan', 'phrasingSlurUp', 'phrasingSlurDown', 'hideNotes', 'unHideNotes',
  'tupletUp', 'tupletDown', 'tupletNeutral', 'cadenzaOn', 'cadenzaOff', 'normalsize', 'small', 'tiny', 'teeny', 'segno', 'coda',
  'upbow', 'downbow', 'portato', 'marcato', 'espressivo', 'staccatissimo', 'flageolet', 'stopped', 'open', 'thumb', 'harmonic',
  'laissezVibrer', 'repeatTie', 'glissando', 'melisma', 'melismaEnd', 'arpeggioArrowUp', 'arpeggioNormal', 'arpeggioBracket',
  'mergeDifferentlyHeadedOn', 'mergeDifferentlyDottedOn', 'textLengthOn', 'textLengthOff', 'fatText', 'emptyText', 'override',
  'germanChords', 'clefsOn']);

function stripComments(s) {
  s = s.replace(/%\{[\s\S]*?%\}/g, ' ');
  return s.split('\n').map(line => {
    let out = '', inStr = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && line[i - 1] !== '\\') inStr = !inStr;
      if (c === '%' && !inStr) break;
      out += c;
    }
    return out;
  }).join('\n');
}
function balanced(s, i, open = '{', close = '}') { // i zeigt auf open; liefert Index nach dem passenden close
  let d = 0;
  for (; i < s.length; i++) {
    if (s[i] === '"') { i = s.indexOf('"', i + 1); continue; }
    if (s[i] === open) d++;
    else if (s[i] === close) { d--; if (d === 0) return i + 1; }
  }
  throw new Error('Klammer nicht geschlossen');
}
function removeBlock(s, re) { // entfernt "\cmd { ... }" inklusive Klammerinhalt
  let m;
  while ((m = re.exec(s))) {
    const b = s.indexOf('{', m.index + m[0].length - 1);
    const e = balanced(s, b);
    s = s.slice(0, m.index) + ' ' + s.slice(e);
    re.lastIndex = 0;
  }
  return s;
}
// Scheme-Ausdrücke (#'(…), #(…), #"…", #t, #-0.5, #+inf.0 …) entfernen – sie sind nie Musik
function stripScheme(s) {
  let out = '', i = 0;
  while (i < s.length) {
    if (s[i] !== '#') { out += s[i++]; continue; }
    let j = i + 1; while (s[j] === '#' || s[j] === "'" || s[j] === '`') j++;
    if (s[j] === '(') { let d = 0; for (; j < s.length; j++) { if (s[j] === '"') { j = s.indexOf('"', j + 1); continue; } if (s[j] === '(') d++; else if (s[j] === ')') { d--; if (!d) { j++; break; } } } }
    else if (s[j] === '"') j = s.indexOf('"', j + 1) + 1;
    else while (j < s.length && /[^\s{}<>]/.test(s[j]) && !(s[j] === '\\')) j++;
    out += ' '; i = j;
  }
  return out;
}
// Italienische Notennamen (do re mi … mit d = Kreuz, b = Be) in die niederländischen umschreiben
function fromItaliano(s) {
  const base = { do: 'c', re: 'd', mi: 'e', fa: 'f', sol: 'g', la: 'a', si: 'b' };
  const acc = { '': '', d: 'is', dd: 'isis', b: 'es', bb: 'eses' };
  return s.replace(/(?<![A-Za-z\\#"])(do|re|mi|fa|sol|la|si)(dd|bb|d|b)?(?![A-Za-z])/g, (_, n, a) => {
    let r = base[n] + acc[a || ''];
    return r.replace(/^ees/, 'es').replace(/^aes/, 'as');
  });
}
// Englische Notennamen (cs = cis, bf = b/es …)
function fromEnglish(s) {
  const acc = { '': '', s: 'is', sharp: 'is', ss: 'isis', x: 'isis', sharpsharp: 'isis', f: 'es', flat: 'es', ff: 'eses', flatflat: 'eses' };
  return s.replace(/(?<![A-Za-z\\#"])([a-g])(sharpsharp|flatflat|sharp|flat|ss|ff|x|s|f)?(?![A-Za-z])/g, (_, n, a) =>
    (n + acc[a || '']).replace(/^ees/, 'es').replace(/^aes/, 'as'));
}
// Deutsche Notennamen: h = H, b = B (niederländisch bes), heses usw.
function fromDeutsch(s) {
  return s.replace(/(?<![A-Za-z\\#"])(h|b)(isis|is|eses|es|s)?(?![A-Za-z])/g, (_, n, a) => n === 'h' ? 'b' + (a || '') : (a ? 'bes' + a : 'bes'));
}
// \tag midi {…} weglassen (nur für die MIDI-Ausgabe), \tag layout {…} behalten
function stripTags(s) {
  s = s.replace(/\\(?:keepWithTag|removeWithTag)\s+#?'?\w+/g, ' ');
  let m; const re = /\\tag\s+#?'?(\w+)\s*/g;
  while ((m = re.exec(s))) {
    let j = m.index + m[0].length;
    if (m[1] !== 'midi') { s = s.slice(0, m.index) + ' ' + s.slice(j); re.lastIndex = m.index; continue; }
    if (s[j] === '{') j = balanced(s, j); else if (s.startsWith('<<', j)) { let d = 0; for (; j < s.length; j++) { if (s.startsWith('<<', j)) { d++; j++; } else if (s.startsWith('>>', j)) { d--; j++; if (!d) { j++; break; } } } }
    else { while (j < s.length && !/\s/.test(s[j])) j++; }
    s = s.slice(0, m.index) + ' ' + s.slice(j); re.lastIndex = m.index;
  }
  return s;
}
function clean(s) {
  s = stripComments(s);
  if (/\\include\s+"deutsch\.ly"|\\language\s+"deutsch"/.test(s)) s = fromDeutsch(removeBlock(s, /\\header\s*\{/g));
  if (/\\include\s+"english\.ly"|\\language\s+"english"/.test(s)) s = fromEnglish(removeBlock(s, /\\header\s*\{/g));
  if (/\\include\s+"italiano\.ly"|\\language\s+"italiano"/.test(s)) s = fromItaliano(removeBlock(s, /\\header\s*\{/g));
  s = s.replace(/(\\relative\s+[a-g](?:is|es|s)?[',]*)\s*\\context\s+Staff\s*=\s*"?(\w+)"?\s*(?:\\new\s+Voice)?\s*\{/g, '$1 { \\change Staff = "$2" ');   // Stimme mit fester Notenzeile
  s = s.replace(/(\d\.*)(?=[rs]\d)/g, '$1 ');            // zusammengeschrieben: mid4r8
  s = s.replace(/(\d\.*)\s*\*\s*(\d+(?:\/\d+)?)/g, '$1*$2');   // Dauer-Faktor mit Leerzeichen: a,8. * 5/6
  s = s.replace(/(?<![\\\w])([a-g](?:isis|eses|is|es|s)?[',]*\d+\.*)(?=[a-g](?:isis|eses|is|es|s)?[',!?]*(?:\d|\s|$))/g, '$1 ');   // zusammengeschrieben: b16a
  s = s.replace(/((?<![A-Za-z\\])(?:[a-g](?:isis|eses|is|es|s)?|[rs])[',]*[!?]?|>)[ \t]+(\d+\.*)(?=[\s|~\[\]()])/g, '$1$2');   // Dauer mit Leerzeichen: c 16
  s = s.replace(/(?<=[a-z]['",]+)(?=[a-g](?:is|es|s)?['",\d\s])/g, ' ');   // zusammengeschrieben: sib'la
  s = s.replace(/#\(ly:set-option[^)]*\)/g, ' ');
  s = removeBlock(s, /\\header\s*\{/g);
  s = removeBlock(s, /\\paper\s*\{/g);
  s = removeBlock(s, /\\layout\s*\{/g);
  s = removeBlock(s, /\\midi\s*\{/g);
  s = removeBlock(s, /\\markup(?:\s*\\override\s*#'\([^)]*\))*\s*\{/g);
  s = s.replace(/\\version\s+"[^"]*"/g, ' ');
  s = s.replace(/\\(?:once\s*\\)?(?:override|revert)\s+[A-Za-z.-]+(?:\s*#'[\w-]+)?(?:\s*\.\s*[\w-]+)*(?:\s*=(?:\s*-?\d+(?:\.\d+)?(?=\s))?)?/g, ' ');   // Overrides: Eigenschaft weg, Wert fällt mit Scheme
  s = s.replace(/\\set\s+[A-Za-z.-]+\s*=\s*(?:"[^"]*"|\\\w+)?/g, ' ');
  s = s.replace(/\\scaleDurations\s*#'\(\s*(\d+)\s*\.\s*(\d+)\s*\)/g, ' \\times $1/$2 ');   // z. B. 18/16 gegen 3/4 (Var. 26)
  s = stripTags(s);
  for (let k = 0; k < 3; k++) s = s.replace(/\\after\s+\d+\.*\s+[-^_]?(?:\\[<>!]|\\[A-Za-z]+|\S+)/g, ' ');   // \after 16 \<  (Nachschlag-Dynamik)
  s = s.replace(/\\[<>!](?![<>])/g, ' ');                                   // Crescendo-/Decrescendo-Gabeln
  s = s.replace(/([a-gsr\d.',>])-(?=\s|$)/g, '$1').replace(/\s-\s/g, ' ');     // Richtungs-Strich ohne Inhalt
  s = s.replace(/\\tweak\s+[\w.-]+\s+(?:#'\([^)]*\)|#?'?[-\w.]+)/g, ' ');   // \tweak Eigenschaft Wert
  s = s.replace(/\\(?:omit|hide|undo)\s+[A-Za-z.]+/g, ' ');
  s = s.replace(/\*(\d+)(?:\/(\d+))?\s*\*\s*(\d+)(?:\/(\d+))?/g, (_, a, b, c, d) => '*' + (+a * +c) + '/' + ((+b || 1) * (+d || 1)));   // s1*9/8 * 8
  s = stripScheme(s);
  s = s.replace(/\\barNumberCheck\s+#?\d+/g, " ");
  s = s.replace(/\\(?:once\s*\\)?(?:override|revert)\s+[A-Za-z.]+\s*(?:#'[\w-]+)?(?:\s*\.\s*[\w-]+)*\s*(?:=\s*(?:#'\([^)]*\)|#'?[\w-]+(?:\s*\.\s*[\w-]+)*|#"[^"]*"|##[tf]|#-?[\d.]+|#\([^)]*\)|#[\w-]+))?/g, ' ');
  s = s.replace(/\\set\s+[A-Za-z.]+\s*=\s*(?:#'\([^)]*\)|#'?[\w-]+|#"[^"]*"|##[tf]|#-?[\d.]+|#\([^)]*\)|"[^"]*"|\\[\w]+)/g, ' ');
  s = s.replace(/\\unset\s+[A-Za-z.]+/g, ' ');
  s = s.replace(/\\clef\s+"?([\w^_]+)"?/g, ' \\clef:$1 ');
  s = s.replace(/\\bar\s+"[^"]*"/g, ' ');
  s = s.replace(/\\mark\s+(?:"[^"]*"|\\default|#\d+)/g, ' ');
  s = s.replace(/\\tempo\s+(?:"[^"]*"\s*)?(?:\d+\.?\s*=\s*\d+)?/g, ' ');
  s = s.replace(/\\change\s+Staff\s*=\s*"?(\w+)"?/g, ' \\change:$1 ');
  s = s.replace(/\\context\s+Voice\s*=\s*"?\w+"?/g, ' ');
  s = s.replace(/\\new\s+Voice(?:\s*=\s*"?\w+"?)?/g, ' ');
  s = s.replace(/[-^_]"[^"]*"/g, ' ');                 // Text-Anmerkungen
  s = s.replace(/[-^_](?=\\)/g, ' ');                   // Richtung vor Artikulation
  s = s.replace(/[\^_](?=[\[\]()~\s])/g, m => ' ');      // Richtung vor Balken/Bogen/Haltebogen oder allein
  s = s.replace(/[-^_][.>^+!_|]/g, ' ');                 // Kurz-Artikulationen
  s = s.replace(/(?<=[\d\]a-z>.'),])[-^_]\d+/g, ' ');   // Fingersätze
  s = s.replace(/\\\(|\\\)/g, ' ');

  s = s.replace(/[\[\]()]/g, ' ');                       // Balken, Bögen
  s = s.replace(/([a-gr\d.',>])[-^_](?=[\s~]|$)/g, '$1');      // Richtungszeichen ohne Inhalt
  s = s.replace(/[-^_]~/g, ' ~');                         // Richtung vor Haltebogen
  return s;
}

function parseKey(name, mode) {
  const m = /^([a-g])(is|es|s)?$/.exec(name);
  const step = STEPS.indexOf(m[1]), alter = { undefined: 0, is: 1, es: -1, s: -1 }[m[2]];
  // Quintenzirkel: Position der Durtonart
  const majFifths = { c: 0, g: 1, d: 2, a: 3, e: 4, b: 5, f: -1 }[m[1]] + 7 * alter;
  return { fifths: mode === 'minor' ? majFifths - 3 : majFifths, mode, tonicStep: step, tonicAlter: alter };
}

// ---------- Musik-Ausdruck parsen ----------
function tokenize(s) {
  return s.replace(/<</g, ' << ').replace(/>>/g, ' >> ').replace(/\{/g, ' { ').replace(/\}/g, ' } ').replace(/\\\\/g, ' \\\\ ')
    .replace(/~/g, ' ~ ').replace(/\|/g, ' | ')
    .replace(/(?<!<)<(?!<)/g, ' <').replace(/>(?!>)/g, '> ').replace(/> (\d+\.*(?:\*\d+(?:\/\d+)?)?)/g, '>$1')
    .replace(/\\/g, ' \\').replace(/ \\ \\/g, ' \\\\')
    .split(/\s+/).filter(Boolean);
}

class Parser {
  constructor(vars, staffNames) { this.vars = vars; this.staffNames = staffNames; }
  parseVoiceVar(name, voiceId, staff, ctx) {
    this.ev = ctx.events; this.ctx = ctx; this.voiceId = voiceId; this.staff = staff;
    const st = { t: ctx.startT || 0, dur: [4, 0], scale: [1, 1], prev: null, grace: false, tuplet: null, staff, voice: voiceId };
    this.expand(this.vars[name], st);
    return st.t;
  }
  expand(text, st) {
    const toks = tokenize(text);
    this.i = 0; this.toks = toks;
    this.seq(st, null);
  }
  seq(st, end) { // liest bis "}" bzw. Ende
    while (this.i < this.toks.length) {
      const tk = this.toks[this.i];
      if (tk === end) { this.i++; return; }
      this.item(st);
    }
  }
  item(st) {
    let tk = this.toks[this.i++];
    if (tk === '-' ) return;
    if (tk.length > 1 && tk.endsWith('-') && !tk.startsWith('\\')) tk = tk.slice(0, -1);   // s-\markup …
    if (tk === '{') return this.seq(st, '}');
    if (tk === '<<') return this.simul(st);
    if (tk === '|') { this.ctx.barchecks.push({ voice: st.voice, t: st.t }); return; }
    if (tk === '~') { const l = this.lastNotes(st); l.forEach(n => n.tieStart = true); return; }
    if (tk.startsWith('\\clef:')) { this.ctx.clefs.push({ voice: st.voice, staff: st.staff, t: st.t, clef: tk.slice(6) }); return; }
    if (tk.startsWith('\\change:')) { const n = this.staffNames[tk.slice(8)]; if (n) st.staff = n; return; }
    if (tk === '\\transpose' || tk === '\\modalTranspose') {
      const a = this.toks[this.i++], b = this.toks[this.i++];
      const pm = x => { const m = /^([a-g])(isis|eses|is|es|s)?([',]*)$/.exec(x); const step = STEPS.indexOf(m[1]);
        const oct = 3 + (m[3].match(/'/g) || []).length - (m[3].match(/,/g) || []).length;
        return { dn: step + 7 * oct, midi: 12 * (oct + 1) + SEMI[step] + { undefined: 0, is: 1, isis: 2, es: -1, eses: -2, s: -1 }[m[2]] }; };
      const A = pm(a), B = pm(b);
      const old = [st.transDn || 0, st.transSemi || 0, st.modal];
      st.transDn = old[0] + B.dn - A.dn; st.transSemi = old[1] + B.midi - A.midi;
      if (tk === '\\modalTranspose') {   // Transposition innerhalb einer Tonleiter: Vorzeichen aus der Tonleiter
        const sc = this.toks[this.i++].slice(1), alt = {};
        (this.vars[sc] || '').replace(/(?<![A-Za-z\\])([a-g])(isis|eses|is|es|s)?(?![A-Za-z])/g, (_, n, x) => { alt[STEPS.indexOf(n)] = { undefined: 0, is: 1, isis: 2, es: -1, eses: -2, s: -1 }[x]; });
        st.modal = alt;
      }
      this.item(st); [st.transDn, st.transSemi, st.modal] = old; return;
    }
    if (tk === '\\relative') {
      let ref = 'f';
      if (!/^[{<\\]/.test(this.toks[this.i])) ref = this.toks[this.i++];
      const m = /^([a-g])\w*?([',]*)$/.exec(ref);
      st.prev = STEPS.indexOf(m[1]) + 7 * (3 + (m[2].match(/'/g) || []).length - (m[2].match(/,/g) || []).length);
      const oldRel = st.rel; st.rel = true; this.item(st); st.rel = oldRel; return;
    }
    if (tk === '\\key') { const nm = this.toks[this.i++], md = this.toks[this.i++].slice(1); this.ctx.key = this.ctx.key || parseKey(nm, md); return; }
    if (tk === '\\time') { const [n, d] = this.toks[this.i++].split('/').map(Number); this.ctx.time = this.ctx.time || { num: n, den: d }; return; }
    if (tk === '\\partial') { const m = /^(\d+)(\.*)(?:\*(\d+))?$/.exec(this.toks[this.i++]); this.ctx.partial = this.durTicks(+m[1], m[2].length) * (m[3] ? +m[3] : 1); return; }
    if (tk === '\\times' || tk === '\\tuplet') {
      let [a, b] = this.toks[this.i++].split('/').map(Number);
      if (tk === '\\tuplet') [a, b] = [b, a];
      const old = st.scale, oldT = st.tuplet;
      st.scale = [old[0] * a, old[1] * b];
      st.tuplet = { id: 't' + (this.ctx.tupId++), num: b, numbase: a };
      this.item(st);
      st.scale = old; st.tuplet = oldT; return;
    }
    if (tk === '\\grace' || tk === '\\appoggiatura' || tk === '\\acciaccatura' || tk === '\\slashedGrace') {
      const g = st.grace; st.grace = tk === '\\appoggiatura' ? 'acc' : 'unacc'; this.item(st); st.grace = g; return;
    }
    if (tk === '\\repeat' && (this.toks[this.i] === 'unfold' || this.toks[this.i] === 'percent')) {
      const n = +this.toks[this.i + 1]; this.i += 2;   // ausgeschriebene Wiederholung: Inhalt n-mal
      const start = this.i;
      for (let k = 0; k < n; k++) { this.i = start; this.item(st); }
      return;
    }
    if (tk === '\\repeat') {
      this.i++; this.i++; // volta N
      const startT = st.t; this.item(st);
      const rep = { voice: st.voice, from: startT, to: st.t }; this.ctx.repeats.push(rep);
      if (this.toks[this.i] === '\\alternative') {
        // Nur die letzte Klammer (2. Ende) wird als Musik übernommen; die erste wird übersprungen,
        // zählt aber für die relative Tonhöhe mit.
        this.i++;
        if (this.toks[this.i] === '{') this.i++;
        const alts = [];
        while (this.i < this.toks.length && this.toks[this.i] !== '}') { alts.push(this.i); this.skipItem(); }
        this.i++;
        const endI = this.i;
        alts.forEach((ai, k) => {
          this.i = ai; const sk = st.skip;
          if (k !== (this.ctx.altKeep === 'first' ? 0 : alts.length - 1)) st.skip = true;
          this.item(st); st.skip = sk;
        });
        this.i = endI;
        rep.to = st.t; // Wiederholungszeichen nach der (übernommenen) 2. Klammer
      }
      return;
    }
    if (tk === '\\skip') { const m = /^(\d+)(\.*)$/.exec(this.toks[this.i++]); this.addRest(st, 'space', +m[1], m[2].length, 1); return; }
    if (tk.startsWith('\\')) {
      const name = tk.slice(1);
      if (ORN[name]) { const l = this.lastNotes(st); if (l.length) l[0].orn = ORN[name]; return; }
      if (this.vars[name] != null) { // Makro (z. B. \su / \sd) oder globale Einstellungen
        const saveToks = this.toks, saveI = this.i;
        this.toks = tokenize(this.vars[name]); this.i = 0; this.seq(st, null);
        this.toks = saveToks; this.i = saveI; return;
      }
      return; // unbekannter Befehl ohne Argument
    }
    if (tk.startsWith('<') && !tk.startsWith('<<')) return this.chord(tk, st);
    let m = /^([rRs])(\d+)?(\.*)(?:\*(\d+)(?:\/(\d+))?)?$/.exec(tk);
    if (m) {
      if (m[2]) st.dur = [+m[2], m[3].length];
      const mult = m[4] ? +m[4] / (m[5] ? +m[5] : 1) : 1;
      this.addRest(st, m[1] === 's' ? 'space' : 'rest', st.dur[0], st.dur[1], mult, m[1] === 'R');
      return;
    }
    m = /^([a-g])(isis|eses|is|es|s)?([',]*)(=[',]*)?(!?)(\??)(\d+)?(\.*)(?:\*(\d+)(?:\/(\d+))?)?$/.exec(tk);
    if (m) return this.note(m, st);
    const bare = /^(\d+)(\.*)$/.exec(tk);
    if (bare && st.last && st.last.length && st.last[0].type === 'note') {   // nackte Dauer = Ton wiederholen (ef16 16)
      st.dur = [+bare[1], bare[2].length];
      if (st.skip || st.grace) return;
      const ticks = this.durTicks(st.dur[0], st.dur[1]) * st.scale[0] / st.scale[1];
      const list = st.last.map(n => Object.assign({}, n, { onset: st.t, ticks, dur: st.dur[0], dots: st.dur[1], tieStart: false, tieEnd: false, orn: null }));
      list.forEach(e => this.ev.push(e)); st.last = list; st.t += ticks; return;
    }
    const qm = /^q(\d+)?(\.*)$/.exec(tk);
    if (qm) {   // Akkord wiederholen
      if (qm[1]) st.dur = [+qm[1], qm[2].length];
      const ticks = this.durTicks(st.dur[0], st.dur[1]) * st.scale[0] / st.scale[1];
      if (st.skip || st.grace) return;
      const chordId = 'c' + (this.ctx.chordId++), list = (st.lastChord || []).map(n => Object.assign({}, n, { onset: st.t, ticks, dur: st.dur[0], dots: st.dur[1], chord: chordId, tieStart: false, tieEnd: false, orn: null, tuplet: st.tuplet || undefined }));
      list.forEach(e => this.ev.push(e)); st.last = list; st.t += ticks; return;
    }
    if (tk.includes('"')) return;   // Text (Anmerkungen, Markup-Reste)
    throw new Error(`Unbekanntes Token "${tk}" (Stimme ${st.voice}, t=${st.t}) bei: ${this.toks.slice(Math.max(0, this.i - 8), this.i + 3).join(' ')}`);
  }
  skipItem() { // springt über einen Ausdruck, ohne ihn auszuwerten
    const tk = this.toks[this.i++];
    if (tk === '{' || tk === '<<') { let d = 1; const o = tk, c = tk === '{' ? '}' : '>>'; while (d && this.i < this.toks.length) { const t = this.toks[this.i++]; if (t === o) d++; else if (t === c) d--; } }
  }
  durTicks(d, dots) { let v = TPW / d, add = v; for (let k = 0; k < dots; k++) { add /= 2; v += add; } return v; }
  pitch(m, st) {
    const step = STEPS.indexOf(m[1]);
    const alter = { undefined: 0, is: 1, isis: 2, es: -1, eses: -2, s: -1 }[m[2]];
    // relativ (Bezug = vorige Note) oder absolut (c = C3, c' = C4)
    let dn = !st.rel || st.prev == null ? step + 21 : step + 7 * Math.round((st.prev - step) / 7);
    dn += ((m[3].match(/'/g) || []).length - (m[3].match(/,/g) || []).length) * 7;
    if (!st.transDn && !st.transSemi) { const oct = Math.floor(dn / 7); return { step, alter, oct, dn, midi: 12 * (oct + 1) + SEMI[step] + alter }; }
    // \transpose: Stufe verschieben, Vorzeichen so, dass der Halbtonabstand stimmt (bzw. aus der Tonleiter bei \modalTranspose)
    const out = dn + (st.transDn || 0), oct = Math.floor(out / 7), nstep = ((out % 7) + 7) % 7;
    const natural = 12 * (oct + 1) + SEMI[nstep];
    let nalter;
    if (st.modal) nalter = st.modal[nstep] || 0;
    else nalter = (12 * (Math.floor(dn / 7) + 1) + SEMI[step] + alter + (st.transSemi || 0)) - natural;
    return { step: nstep, alter: nalter, oct, dn, midi: natural + nalter };
  }
  note(m, st) {
    if (this.toks[this.i] === '\\rest') { // Note mit \rest = Pause an fester Position
      this.i++;
      st.prev = this.pitch(m, st).dn; // die Tonhöhe der Pause gilt als Bezug für die nächste relative Note
      if (m[7]) st.dur = [+m[7], m[8].length];
      return this.addRest(st, 'rest', st.dur[0], st.dur[1], m[9] ? +m[9] / (m[10] ? +m[10] : 1) : 1);
    }
    const p = this.pitch(m, st);
    st.prev = p.dn;
    if (m[7]) st.dur = [+m[7], m[8].length];
    if (st.skip) return;
    const ticks = st.grace ? 0 : this.durTicks(st.dur[0], st.dur[1]) * st.scale[0] / st.scale[1] * (m[9] ? +m[9] / (m[10] ? +m[10] : 1) : 1);
    const e = { type: 'note', voice: st.voice, staff: st.staff, onset: st.t, ticks, dur: st.dur[0], dots: st.dur[1],
      step: p.step, alter: p.alter, oct: p.oct, midi: p.midi, forced: !!m[5], cautionary: !!m[6] };
    if (st.grace) { e.grace = st.grace; this.ev.push(e); return; } // Vorschlag: keine eigene Zeit
    if (st.tuplet) e.tuplet = st.tuplet;
    this.ev.push(e); st.last = [e];
    st.t += ticks;
  }
  chord(tk, st) {
    // tk wie "<c" ... wir sammeln bis zum Token mit ">"
    let body = tk.slice(1), durTok = '';
    while (!body.includes('>')) { if (this.i >= this.toks.length) throw new Error('Akkord ohne Ende: <' + body.slice(0, 40)); body += ' ' + this.toks[this.i++]; }
    const k = body.indexOf('>'); durTok = body.slice(k + 1); body = body.slice(0, k);
    const notes = body.split(/\s+/).filter(Boolean).filter(x => !x.startsWith('\\') && !/^[~()\[\]]+$/.test(x)).map(x => x.replace(/[~()\[\]]+$/, ''));
    const dm = /^(\d+)?(\.*)/.exec(durTok);
    if (dm[1]) st.dur = [+dm[1], dm[2].length];
    const ticks = this.durTicks(st.dur[0], st.dur[1]) * st.scale[0] / st.scale[1];
    let first = null; const chordId = 'c' + (this.ctx.chordId++), list = [];
    let ref = st.prev;
    for (const n of notes) {
      const m = /^([a-g])(isis|eses|is|es|s)?([',]*)(!?)(\??)/.exec(n);
      if (!m) throw new Error(`Akkord nicht lesbar: <${body}>`);
      const p = this.pitch([null, m[1], m[2], m[3]], { prev: ref, transDn: st.transDn, transSemi: st.transSemi, modal: st.modal, rel: st.rel });
      ref = p.dn; if (first == null) first = p.dn;
      if (st.skip) continue;
      const e = { type: 'note', voice: st.voice, staff: st.staff, onset: st.t, ticks, dur: st.dur[0], dots: st.dur[1],
        step: p.step, alter: p.alter, oct: p.oct, midi: p.midi, forced: !!m[4], cautionary: !!m[5], chord: chordId };
      if (st.tuplet) e.tuplet = st.tuplet;
      if (st.grace) { e.grace = st.grace; e.ticks = 0; }
      this.ev.push(e); list.push(e);
    }
    st.prev = first;
    if (!st.grace && !st.skip) { st.last = list; st.lastChord = list; st.t += ticks; }
  }
  addRest(st, type, d, dots, mult, measureRest) {
    st.dur = [d, dots];
    if (st.grace || st.skip) return;
    const ticks = this.durTicks(d, dots) * st.scale[0] / st.scale[1] * mult;
    const e = { type, voice: st.voice, staff: st.staff, onset: st.t, ticks, dur: d, dots, mrest: !!measureRest };
    if (st.tuplet) e.tuplet = st.tuplet;
    this.ev.push(e); st.last = [];
    st.t += ticks;
  }
  lastNotes(st) { return st.last || []; }
  simul(st) {
    // << {A} \\ {B} >>  oder  << {A} {B} >> : Zweige parallel, erster Zweig = Hauptstimme
    const start = st.t, prev0 = st.prev; let maxT = start, branch = 0, firstPrev = null, firstLast = null;
    const saveVoice = st.voice;
    while (this.i < this.toks.length && this.toks[this.i] !== '>>') {
      if (this.toks[this.i] === '\\\\') { this.i++; continue; }
      st.t = start; st.prev = prev0;
      st.voice = branch === 0 ? saveVoice : saveVoice + '.' + branch;
      const before = this.ev.length;
      this.item(st);
      if (branch === 0 && this.ev.length === before) { maxT = Math.max(maxT, st.t); continue; }   // z. B. \global: keine eigene Stimme
      if (branch === 0) { firstPrev = st.prev; firstLast = st.last; }
      maxT = Math.max(maxT, st.t); branch++;
    }
    this.i++;
    st.voice = saveVoice; st.t = maxT; st.prev = firstPrev ?? prev0; st.last = firstLast;
  }
}

function parseLily(src, opts = {}) {
  const s = clean(src);
  // Variablen
  const vars = {};
  const re = /(?:^|\n)\s*([A-Za-z]+)\s*=\s*/g; let m;
  const scoreIdx = s.search(/\\score\s*\{/);
  while ((m = re.exec(s))) {
    if (m.index > scoreIdx && scoreIdx >= 0) break;
    let i = m.index + m[0].length;
    let j = i;
    const relPar = /^\\relative\s+[a-g](?:isis|eses|is|es|s)?[',]*\s*(?=<<)/.exec(s.slice(i, i + 40));
    if (relPar) { // left = \relative c' << {…} \\ {…} >>
      let d = 0, k = i + relPar[0].length;
      for (; k < s.length; k++) { if (s.startsWith('<<', k)) { d++; k++; } else if (s.startsWith('>>', k)) { d--; k++; if (!d) { k++; break; } } }
      vars[m[1]] = s.slice(i, k); re.lastIndex = k; continue;
    }
    if (s.startsWith('<<', i)) { // Variable aus parallelen Stimmen: soprano = << \sopranoOne \\ \sopranoTwo >>
      let d = 0, k = i;
      for (; k < s.length; k++) { if (s.startsWith('<<', k)) { d++; k++; } else if (s.startsWith('>>', k)) { d--; k++; if (!d) { k++; break; } } }
      vars[m[1]] = s.slice(i, k); re.lastIndex = k; continue;
    }
    // Ausdruck: optional \relative X, dann { ... }
    const b = s.indexOf('{', i);
    const back = () => { re.lastIndex = m.index + m[0].trimEnd().length; };   // Zeilenumbruch nicht verschlucken
    if (b < 0) { back(); continue; }
    const between = s.slice(i, b);
    if (!/^\s*(\\relative(?:\s+[a-g](?:isis|eses|is|es|s)?[',]*)?\s*|\\transpose[^{]*|\\new\s+(?:Piano|Grand)Staff\s*)?$/.test(between) && !/^\s*$/.test(between)) { back(); continue; }
    j = balanced(s, b);
    vars[m[1]] = s.slice(i, j);
    re.lastIndex = j;
  }
  // Score: Systeme und ihre Stimmen
  const sb = s.indexOf('{', scoreIdx), se = balanced(s, sb);
  // Variablen, die selbst Notensysteme enthalten (staffPiano = \new PianoStaff {...}), in den Score einsetzen
  const score = s.slice(sb + 1, se - 1).replace(/\\([A-Za-z]+)/g, (x, n) => vars[n] && /\\(?:new|context)\s+Staff/.test(vars[n]) ? ' ' + vars[n] + ' ' : x);
  const staffRe = /\\(?:context|new)\s+Staff\s*(?:=\s*"?(\w+)"?)?/g;
  const staffPos = []; while ((m = staffRe.exec(score))) staffPos.push({ name: m[1] || ('s' + staffPos.length), at: m.index + m[0].length });
  const staffNames = {}; staffPos.forEach((p, k) => staffNames[p.name] = k + 1);
  const ctx = { events: [], clefs: [], repeats: [], barchecks: [], key: null, time: null, partial: 0, tupId: 0, chordId: 0, altKeep: opts.alt };
  const parser = new Parser(vars, staffNames);
  const voices = [];
  staffPos.forEach((p, k) => {
    let seg = score.slice(p.at, k + 1 < staffPos.length ? staffPos[k + 1].at : score.length);
    // Inline-Einstellungen im Score (\time, \key, \clef)
    const ti = /\\time\s+(\d+)\/(\d+)/.exec(seg); if (ti && !ctx.time) ctx.time = { num: +ti[1], den: +ti[2] };
    const ki = /\\key\s+([a-g]\w*)\s+\\(major|minor)/.exec(seg); if (ki && !ctx.key) ctx.key = parseKey(ki[1], ki[2]);
    const ci0 = /\\clef:(\w+)/.exec(seg);
    // Noten direkt im Score (ohne Variable): den Block des Systems selbst als Stimme lesen
    if (![...seg.matchAll(/\\([A-Za-z]+)/g)].some(x => vars[x[1]] != null && /[a-g]\d|[a-g][',]|\br\d|\\relative/.test(vars[x[1]]))) {
      let j = 0; while (j < seg.length && /\s/.test(seg[j])) j++;
      if (seg.startsWith('\\with', j)) { const w = seg.indexOf('{', j); j = balanced(seg, w); while (/\s/.test(seg[j])) j++; }
      let body = null;
      if (seg[j] === '{') body = seg.slice(j, balanced(seg, j));
      else if (seg.startsWith('<<', j)) { let d = 0, k = j; for (; k < seg.length; k++) { if (seg.startsWith('<<', k)) { d++; k++; } else if (seg.startsWith('>>', k)) { d--; k++; if (!d) { k++; break; } } } body = seg.slice(j, k); }
      if (body && /[a-g]\d|[a-g][',]/.test(body)) { const vn = 'zzStaff' + String.fromCharCode(65 + k); vars[vn] = body; seg = seg.replace(body, ' \\' + vn + ' '); }
    }
    let refs = [...seg.matchAll(/\\([A-Za-z]+)/g)].map(x => x[1]).filter(n => vars[n] != null);
    // zusammengesetzte Variablen (<< \a \\ \b >>) in ihre Stimmen auflösen
    // auch verschachtelt: right = { \clef treble << \sopran \alt >> }
    const isMus = t => /[a-g]\d|[a-g][',]|\br\d|\\relative/.test(t.replace(/\\[A-Za-z]+/g, ' '));
    const flat = (n, depth) => {
      const body = vars[n];
      if (depth > 4 || isMus(body)) return [n];
      const inner = [...body.matchAll(/\\([A-Za-z]+)/g)].map(x => x[1]).filter(x => vars[x] != null);
      const sub = inner.flatMap(x => flat(x, depth + 1));
      if (!sub.some(x => isMus(vars[x]))) return [n];
      if (!ci0) { const c2 = /\\clef:(\w+)/.exec(body); if (c2) ciVar = c2; }
      return sub;
    };
    let ciVar = null;
    refs = refs.flatMap(n => flat(n, 0));
    const ci = ci0 || ciVar;
    refs.forEach(n => {
      const body = vars[n];
      const isMusic = /[a-g]\d|[a-g][',]|\br\d|\\relative/.test(body);
      if (!isMusic) { const save = ctx.events.length; try { parser.parseVoiceVar(n, 'g', k + 1, ctx); } catch (e) { /* Dynamik/Layout-Spur: Fehler egal */ } ctx.events.length = save; return; }
      const vid = String(voices.length + 1);
      if (ci && !voices.some(v => v.staff === k + 1)) ctx.clefs.push({ voice: vid, staff: k + 1, t: -1, clef: ci[1] });
      voices.push({ id: vid, staff: k + 1, name: n });
      parser.parseVoiceVar(n, vid, k + 1, ctx);
    });
  });
  // Stimmen, die sich selbst einer Notenzeile zuordnen (\context Staff = "one" in der Variablen): dort beheimaten
  voices.forEach(v => {
    const m = /^\s*\\relative[^{]*\{\s*\\change:(\w+)/.exec(vars[v.name] || '');
    if (m && staffNames[m[1]]) v.staff = staffNames[m[1]];
  });
  if (!ctx.key) ctx.key = { fifths: 0, mode: 'major', tonicStep: 0, tonicAlter: 0 };
  if (!ctx.time) ctx.time = { num: 4, den: 4 };
  return { ctx, voices, staffCount: staffPos.length };
}

// ---------- Zu Stück-JSON verarbeiten und prüfen ----------
const CLEFS = { treble: ['G', 2], violin: ['G', 2], G: ['G', 2], bass: ['F', 4], F: ['F', 4], alto: ['C', 3], tenor: ['C', 4], soprano: ['C', 1], C: ['C', 3] };
// opts: alt ('first' = erste statt letzte Klammer), from/to (Ausschnitt in Ticks), time (andere Taktart, z. B. Var. 16)
function buildPiece(src, meta, opts = {}) {
  const { ctx, voices, staffCount } = parseLily(src, opts);
  if (opts.time) ctx.time = opts.time;
  if (opts.from != null || opts.to != null) {
    const a = opts.from || 0, b = opts.to == null ? Infinity : opts.to;
    ctx.events = ctx.events.filter(e => e.voice === 'g' || (e.onset >= a - 1e-6 && e.onset < b - 1e-6));
    ctx.events.forEach(e => { if (e.voice !== 'g') { e.onset -= a; if (e.onset + e.ticks > b - a) e.ticks = b - a - e.onset; } });
    ctx.barchecks = ctx.barchecks.filter(x => x.t >= a && x.t <= b).map(x => Object.assign({}, x, { t: x.t - a }));
    ctx.partial = 0;
  }
  const measure = TPW * ctx.time.num / ctx.time.den;
  if (opts.clipLast) ctx.events.forEach(e => { const m0 = Math.floor(e.onset / measure + 1e-9); if (e.onset + e.ticks > (m0 + 1) * measure + 1e-6 && e.onset >= opts.clipLast - 1e-6) e.ticks = (m0 + 1) * measure - e.onset; });
  const shift = ctx.partial ? measure - ctx.partial : 0;
  const ev = ctx.events.filter(e => e.voice !== 'g');
  ev.forEach(e => e.onset += shift);
  const ends = {};
  ev.forEach(e => { ends[e.voice] = Math.max(ends[e.voice] || 0, e.onset + e.ticks); });
  const total = Math.max(...Object.values(ends));
  const measures = Math.ceil(total / measure - 1e-6);
  const problems = [];
  // Taktstriche prüfen
  ctx.barchecks.forEach(b => { const t = b.t + shift; if (Math.abs(t / measure - Math.round(t / measure)) > 1e-6) problems.push(`Taktstrich daneben: Stimme ${b.voice}, Takt ~${(t / measure + 1).toFixed(2)}`); });
  voices.forEach(v => { if (Math.abs((ends[v.id] || 0) - total) > 1e-6) problems.push(`Stimme ${v.id} endet bei Takt ${((ends[v.id] || 0) / measure).toFixed(2)} statt ${(total / measure).toFixed(2)}`); });
  // Noten über Taktgrenzen: aufteilen (mit Haltebogen)
  const out = [];
  for (const e of ev) {
    const m0 = Math.floor(e.onset / measure + 1e-9), m1 = Math.floor((e.onset + e.ticks) / measure - 1e-9);
    if (m0 === m1 || e.mrest || e.type === 'space' || e.ticks === 0) { out.push(e); continue; }
    problems.push(`Hinweis: Note über Taktstrich geteilt (Stimme ${e.voice}, Takt ${m0 + 1})`);
    let t = e.onset, rest = e.ticks, firstPart = true;
    while (rest > 1e-9) {
      const room = Math.min(rest, (Math.floor(t / measure + 1e-9) + 1) * measure - t);
      const d = ticksToDur(room);
      const part = Object.assign({}, e, { onset: t, ticks: room, dur: d[0], dots: d[1] });
      if (e.type === 'note') { if (!firstPart) part.tieEnd = true; if (rest - room > 1e-9) part.tieStart = true; else part.tieStart = e.tieStart; }
      out.push(part); t += room; rest -= room; firstPart = false;
    }
  }
  // Haltebögen der Folgenoten
  const byVoice = {};
  out.filter(e => e.type === 'note' && !e.grace).sort((a, b) => a.onset - b.onset).forEach(n => (byVoice[n.voice] = byVoice[n.voice] || []).push(n));
  Object.values(byVoice).forEach(list => {
    list.forEach((n, i) => {
      if (!n.tieStart) return;
      const nxt = list.find(x => x.onset > n.onset + 1e-9 - 0 && Math.abs(x.onset - (n.onset + n.ticks)) < 1e-6 && x.midi === n.midi);
      if (nxt) nxt.tieEnd = true; else n.tieStart = false;
    });
  });
  const clefs = ctx.clefs.map(c => ({ staff: c.staff, voice: c.voice, t: c.t < 0 ? -1 : c.t + shift, clef: CLEFS[c.clef] || CLEFS.treble }));
  const staffClefs = [];
  for (let s = 1; s <= staffCount; s++) {
    const c0 = clefs.find(c => c.staff === s && c.t <= shift + 1e-9 && c.t < (ev.find(e => e.staff === s)?.onset ?? 0) + 1e-9) || clefs.find(c => c.staff === s && c.t === -1);
    staffClefs.push(c0 ? c0.clef : (s === 1 ? CLEFS.treble : CLEFS.bass));
  }
  const clefChanges = clefs.filter(c => c.t > 0 && !(staffClefs[c.staff - 1] === c.clef && c.t <= shift)).map(c => ({ staff: c.staff, voice: c.voice, t: c.t, shape: c.clef[0], line: c.clef[1] }));
  const repeats = [];
  ctx.repeats.filter(r => r.voice === voices[0].id).forEach(r => repeats.push({ from: Math.round((r.from + shift) / measure) + 1, to: Math.round((r.to + shift) / measure) }));
  // Kompaktes Format
  const voiceIdx = {}; const allVoices = [...new Set(out.map(e => e.voice))];
  allVoices.forEach(v => voiceIdx[v] = v);
  const events = out.sort((a, b) => a.onset - b.onset || (b.grace ? 1 : 0) - (a.grace ? 1 : 0)).map(e => {
    const o = { y: e.type[0], v: e.voice, s: e.staff, t: +e.onset.toFixed(4), k: +e.ticks.toFixed(4), d: e.dur, };
    if (e.dots) o.p = e.dots;
    if (e.type === 'note') { o.m = e.midi; o.st = e.step; o.al = e.alter; o.oc = e.oct; }
    if (e.tieStart) o.ts = 1; if (e.tieEnd) o.te = 1;
    if (e.forced) o.fo = 1; if (e.cautionary) o.ca = 1;
    if (e.chord) o.c = e.chord; if (e.tuplet) o.tu = [e.tuplet.id, e.tuplet.num, e.tuplet.numbase];
    if (e.orn) o.o = e.orn; if (e.mrest) o.mr = 1; if (e.grace) o.g = e.grace;
    return o;
  });
  return {
    piece: Object.assign({}, meta, {
      tpw: TPW, key: ctx.key, time: ctx.time, measureTicks: measure, pickup: ctx.partial || 0, measures, staffClefs,
      voices: voices.map(v => ({ id: v.id, staff: v.staff })), clefChanges, repeats, events,
    }), problems,
  };
}
function ticksToDur(t) {
  for (const d of [1, 2, 4, 8, 16, 32, 64]) for (const dots of [0, 1, 2]) {
    let v = TPW / d, add = v; for (let k = 0; k < dots; k++) { add /= 2; v += add; }
    if (Math.abs(v - t) < 1e-6) return [d, dots];
  }
  return [4, 0];
}
module.exports = { parseLily, buildPiece, TPW };
