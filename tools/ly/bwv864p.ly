% Wohltemperiertes Klavier I, Präludium 19, BWV 864 – Knute Snortum (github.com/ksnortum/bach-well-tempered-1), CC BY-SA 4.0
%...+....1....+....2....+....3....+....4....+....5....+....6....+....7....+....

%
% Scheme functions
%

makeSpanner =
#(define-music-function (mrkup) (markup?)
  #{
    \override TextSpanner.bound-details.left.text = #mrkup
    \override TextSpanner.bound-details.left.stencil-align-dir-y = 0.25
    \override TextSpanner.bound-details.left-broken.text = ##f
  #})

voiceFive = #(context-spec-music (make-voice-props-set 4) 'Voice)

%
% Redefine
%

fermataOverBarline = {
  \override Score.TextMark.self-alignment-X = #CENTER
  \textEndMark \markup { \musicglyph "scripts.ufermata" }
}

fermataUnderBarline = {
  \tweak direction #DOWN
  \textEndMark \markup { \musicglyph "scripts.dfermata" }
}

staffDown = \change Staff = "lower" 
staffUp = \change Staff = "upper" 

voiceDown = {
  \change Staff = "lower"
  \voiceThree 
}
voiceUp = {
  \change Staff = "upper"
  \voiceFour 
}

hideNoteHead = \once {
  \omit Stem
  \omit Dots
  \omit Flag
  \hideNotes
  \override NoteColumn.ignore-collision = ##t
}

tupletOff = {
  \omit TupletBracket
  \omit TupletNumber
}
tupletOn = {
  \undo \omit TupletBracket
  \undo \omit TupletNumber
}

% TODO can these be Voice or do they need to be Staff?
beamQuarterNotes.44 = {
  \set Voice.beamExceptions = #'()
  \set Voice.baseMoment = #(ly:make-moment 1/4)
  \set Voice.beatStructure = 1,1,1,1
}

beamQuarterNotes.34 = {
  \set Staff.beamExceptions = #'()
  \set Staff.baseMoment = #(ly:make-moment 1/4)
  \set Staff.beatStructure = 1,1,1
}

beamQuarterNotes.32 = {
  \set Staff.beamExceptions = #'()
  \set Staff.baseMoment = #(ly:make-moment 1/4)
  \set Staff.beatStructure = 1,1,1,1,1,1
}

beamEighthNotes = {
  \set Staff.beamExceptions = #'()
  \set Staff.baseMoment = #(ly:make-moment 1/8)
  \set Staff.beatStructure = 1,1,1,1,1,1,1,1
}

revertBeaming = {
  \unset Voice.beamExceptions
  \unset Voice.baseMoment
  \unset Voice.beatStructure
}

insideSlur = \tweak avoid-slur #'inside \etc
calando = \makeSpanner \markup \large \italic "calando "
snh = \single \override NoteHead.font-size = -2 \etc
hairpinAcrossBreak = \once \override Hairpin.after-line-breaking = ##f

slurCloserToNoteHeadOn = \override Slur.details.edge-attraction-factor = #83
slurCloserToNoteHeadOff = \revert Slur.details.edge-attraction-factor

connectArpeggios = \set PianoStaff.connectArpeggios = ##t

%
% Markup
%

spLegato = \markup \large \italic " legato"
pSempreLegato = \markup { \dynamic p \large \italic "sempre legato" }
pScherzondo = \markup { \dynamic p \large \italic scherzando }
pDolceEspressivo = \markup { \dynamic p \large \italic "dolce espressivo" }
pMoltoEspressivo = \markup { \dynamic p \large \italic "molto espressivo" }
pSempreLegatoEPesante = \markup { 
  \dynamic p \large \italic \whiteout \pad-markup #0.25 
  "sempre legato e pesante" 
}
pDolce = \markup { \dynamic p \large \italic dolce }
pDolceSempreLegato = \markup { 
  \dynamic p \large \italic \whiteout \pad-markup #0.25 "dolce sempre legato" 
}
ppSempreMoltoLegato = \markup { 
  \dynamic pp \large \italic "sempre molto legato" 
}
ppStaccato = \markup { \dynamic pp \large \italic staccto }
ppDolce = \markup { \dynamic pp \large \italic dolce }
ppRit = \markup { \dynamic pp \large \italic rit. }
pLeggiermente = \markup { \dynamic p \large \italic leggiermente }
pLegato = \markup { \dynamic p \large \italic legato }
fMarcato = \markup { \dynamic f \large \italic marcato }
sfDimERall = \markup { \dynamic sf \large \italic "dim. e rall." }
sfDim = \markup { \dynamic sf \large \italic dim. }
fzDimERall = \markup { \dynamic fz \large \italic "dim. e rall." }
mfLegatoEdEspressivo = 
  \markup { \dynamic mf \large \italic \whiteout \pad-markup #0.25 "legato ed espressivo" }
piuF = \markup { \large \italic più \dynamic f }
piuCresc = \markup \large \italic "più cresc."
rf = \markup \dynamic rf
ffz = \markup \dynamic ffz
fMarkup = \markup \dynamic f
poco = \markup \large \italic poco
pocoCresc = \markup \large \italic "poco cresc."
pocoRall = \markup \large \italic "poco rall."
pocoRit = \markup \large \italic "poco rit."
aPocoRall = \markup \large \italic "a poco rall."
dimERall = \markup \large \italic \whiteout \pad-markup #0.15 "dim. e rall."
crescWO = \markup \large \italic \whiteout \pad-markup #0.25 cresc.
piuCresc = \markup \large \italic \whiteout \pad-markup #0.25 "più cresc."
rall = \markup \large \italic rall.
rit = \markup \large \italic rit.
dolce = \markup \large \italic dolce
aTempo = \markup \large \italic "a tempo"
%...+....1....+....2....+....3....+....4....+....5....+....6....+....7....+....

\version "2.24.0"
\language "english"


%%% Music %%%

global = {
  \time 4/4
  \key a \major
}

rightHandUpper = \relative {
  \voiceOne a'16( b cs a  fs'8) fs-.  fs16( ds e8-.)  r16 (e fs g |
  a16 g fs a  \oneVoice d,! cs b a'  gs fs e gs  cs, b a g') |
  fs16 e d fs  b, fs' e d  cs b a b  cs ds e fs |
  \voiceOne gs16( a b gs  e fs gs e  fs8 gs16 a)  b4~ |
  b8 e, r a->~  a ds, r gs |
  a16 gs fs a  ds, a' gs fs  e4 r8 g |
  g8( fs) b,\rest fs'-.  fs( e) b\rest e-. |
  e8( d) r d-.  d( cs a'4) |
  
  \barNumberCheck 9
  gs4( g fs b) |
  e,4 a2 gs!4~ |
  gs16 fs es gs  fs2 es4 |
  fs16 gs a fs  d8 d  d16 bs cs8  r16 cs d e |
  \oneVoice fs16 e ds fs  b, a gs fs'  es ds cs b'  a gs fs es |
  fs16 es fs gs  gs8.\trill fs16  \voiceOne fs4 r8 a |
  a8( gs) r gs  gs fs r b |
  b8( a) r a  a gs r e |
  
  \barNumberCheck 17
  e8 a, d[ d]  d cs  r16 e d cs |
  b8 cs16 ds e4~  e8( a,) r d->~ |
  d8( gs,!) r cs  d16 cs b cs  d cs d e |
  a,16( b cs a  \oneVoice fs'8-.) fs-.  fs16( ds e8)  r16 e fs g |
  a16 g fs a  d, cs b a'  gs fs e gs  cs, b a g' |
  fs16 e d fs  b, fs' e d  cs b a cs  fs, e d fs |
  b,16 cs d e  fs gs a b  cs d e fs  gs a b gs |
  \voiceOne a4~ a8. gs16  a2\fermata |
  \bar "|."
}

rightHandLower = \relative {
  \voiceFour r2 r4 r8 e'8->~ |
  e8 a,  \voiceDown r d!->~  d gs, r cs->~ |
  cs8 b16 a  gs8.\prall gs16  a8 r r4 |
  \voiceUp r4 e'' ds d |
  cs4 fs b, e~ |
  e4 ds4  e8 b e e |
  e8 d! s d  d cs s cs |
  cs8 b r4  \voiceDown a,16 b cs a  \voiceUp fs'8 fs-. |
  
  \barNumberCheck 9
  fs16( ds e8-.) r16 e fs g  a g fs a  d,! cs b a' |
  gs!16 fs e gs  cs, b a g'  fs e d fs  b, fs' e d |
  cs4 r16 e'! d cs  b a gs b  cs, d' cs b |
  a4  r16 cs b a  gs4 r8 \voiceDown cs,->~ |
  cs8 fs, r b->~  b es, r a->~ |
  a8 gs16 fs  es8 b'  a16 \voiceUp d' cs b  a gs fs e! |
  ds4 r8 e'~  e16 e ds cs  b a! gs fs |
  e4 r8 fs'~  fs16 fs e d!  cs b a gs |
  
  \barNumberCheck 17
  fs4 r8 b~  b e, a4( |
  gs4 g fs b) |
  e,4 a a gs! |
  a4 \voiceDown a,( gs g |
  fs4) b e, a |
  d,4~ d16 d cs b  a b cs a  d e fs d |
  gs a gs fs  e d' cs b  a r r8 r4 |
  \voiceUp r16 gs'' fs e  d cs b8  cs2 |
}

rightHand = {
  \global
  <<
    \new Voice \rightHandUpper
    \new Voice \rightHandLower
  >>
}

leftHand = \relative {
  \global
  \clef bass
  a,4( a' gs g) |
  fs4 \voiceTwo b e, a |
  d,4 e  a,8 a' gs fs |
  \oneVoice e16( fs gs e  cs'8) cs-.  cs16( as b8-.)  r16 b cs d! |
  e16 d cs e  a, gs fs e'  ds cs b ds  gs, fs e d' |
  cs16 b a cs  fs, cs' b a  gs fs e fs  gs a b cs |
  d!16 e fs d  b cs d b  cs d e cs  a b cs a |
  b16 cs d b  gs a b gs  a4_~  a16 gs a b |
  
  \barNumberCheck 9
  cs4  r16 e8.~  e8( a,) r d~ |
  d8( gs,) r cs(  d b) r e,( |
  a8 gs a fs  gs b cs cs,)  |
  fs8 fs, fs'4(  es e) |
  \voiceTwo ds4 gs cs, fs |
  d!8 b cs4  fs r |
  r16 cs' b a  gs fs e as  b4 r |
  r16 ds cs b  a gs fs ds'  \oneVoice e4 r |
  
  \barNumberCheck 17
  r16 e16 d! cs  b a gs b  a,( b cs a  fs'8-.) fs-. |
  fs16( ds e8)  r16 e fs g  a g fs a  d,! cs b a' |
  gs!16 fs e gs  cs, b a g'  fs e d fs  b, fs' e d |
  cs16 b a cs  \voiceTwo d e d cs  b a gs b  cs8 e->~ |
  e8 a, r d->~  d gs, r cs->~ |
  cs8 b16 a gs!4  a8 r r4 |
  r2 r16 fs' e d  cs b a gs |
  \oneVoice fs16 e^\pocoRall d8 e e'  a,2\fermata |
}

dynamics = {
  \override DynamicTextSpanner.style = #'none
  s1\f |
  s4 s2.-\tweak Y-offset 1 \p |
  s2. s4\cresc |
  s2.-\tweak Y-offset -1.5 \f s8.\> s16\! |
  s4 s2.-\tweak Y-offset 1 \p |
  s1 |
  s2. s4\cresc |
  s2 s-\tweak X-offset -0.5 \f |
  
  \barNumberCheck 9
  s1 * 2 |
  s8 s4.\dim s2 |
  s1\f |
  s1 |
  s2 s16 s8.-\tweak Y-offset -2 \p s4 |
  s2 s-\tweak extra-offset #'(0 . -1) \cresc |
  s1 |
  
  \barNumberCheck 17
  s2 s\f |
  s1 * 2 |
  s4 s8-\tweak Y-offset 0.5 \sf \tag layout { s } \tag midi { s\f } s2 |
  s1 * 2 |
  s2 s16 s8.\< s s16\! |
  s4.\fz\> s8\! s2\p |
}

tempi = {
  \tempo "Moderato" 4 = 80
  s1 * 23
  \set Score.tempoHideNote = ##t
  \tempo 4 = 72
  s4 \tempo 4 = 66 s \tempo 4 = 50 s2 |
}

forceBreaks = {
  % page 1
  s1\noBreak s1\break\noPageBreak
  s1\noBreak s1\break\noPageBreak
  s1\noBreak s1\break\noPageBreak
  s1\noBreak s1\break\noPageBreak
  s1\noBreak s1\pageBreak
  
  % page 2
  s1\noBreak s1\break\noPageBreak
  \repeat unfold 2 { s1\noBreak } s1\break\noPageBreak
  \repeat unfold 2 { s1\noBreak } s1\break\noPageBreak
  \repeat unfold 2 { s1\noBreak } s1\break\noPageBreak
}

preludeNinteenNotes =
\score {
  \header {
    title = "Prelude 19"
  }
  \keepWithTag layout  
  \new PianoStaff \with {
    \override StaffGrouper.staff-staff-spacing = 
      #'((basic-distance . 10)
         (padding . 1))
  } <<
    \new Staff = "upper" \rightHand
    \new Dynamics \dynamics
    \new Staff = "lower" \leftHand
    \new Dynamics \tempi
    \new Devnull \forceBreaks
  >>
  \layout {
    \context {
      \Score
      \override Stem.details.beamed-lengths = #'(3.5 4.1)
    }
  }
}


preludeNinteenMidi =
\book {
  \bookOutputName "prelude-19-bwv-864"
  \score {
    \keepWithTag midi
    \articulate <<
      \new Staff = "upper" << \rightHand \dynamics \tempi >>
      \new Staff = "lower" << \leftHand \dynamics \tempi >>
    >>
    \midi {}
  }
}
