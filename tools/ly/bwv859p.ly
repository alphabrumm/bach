% Wohltemperiertes Klavier I, Präludium 14, BWV 859 – Knute Snortum (github.com/ksnortum/bach-well-tempered-1), CC BY-SA 4.0
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


%%% Positions and shapes %%%

slurShapeA = \shape #'((0 . -1) (0 . 0) (0 . 0) (0 . -0.5)) \etc

%%% Music %%%

global = {
  \time 4/4
  \key fs \minor
}

rightHand = \relative {
  \global
  \beamQuarterNotes.44
  r8 cs''-\slurShapeA (  d16 cs b d  cs b a cs  b a gs b |
  a gs fs a  cs8-.) a'-.  bs,-. gs'-.  gs,-. fs'-. |
  cs8-. e-.  a,16( gs fs a  b!8-.) d-.  gs,16( fs e gs |
  a8-.) cs-.  b16->( cs d fs  a,-> b cs fs  gs,-> a b es) |
  fs,8-. a-.  b16( cs d b  gs8-.) b-.  cs16( d e cs |
  a8-.) cs-.  fs16-> e d fs  e-> d cs e  d-> cs b d |
  cs16 b a gs  a-> b cs e  gs,-> a b e  fs,-> gs a ds |
  e,8-. gs'->~  gs16 e cs bs  cs8-. a'~  a16 fs ds cs |
  
  \barNumberCheck 9
  bs16 ds gs cs,  a'-> gs fs a  gs-> fs e gs  fs-> e ds fs |
  e16( ds cs e  gs8-.) b,!-.  a16( gs fs a  fs'8-.) ds-. |
  bs16 as gs e'  a,-> gs fs ds'  gs,-> fs e cs'   fs,-> e ds bs' |
  cs16 bs cs fs  ds8.\trill cs16  \voiceOne cs2~ |
  cs2~ cs8 \oneVoice r fs,16 gs a cs |
  e,16 fs gs cs  ds, e fs bs  cs8-. cs,-. \voiceOne <fs cs'>-. b\rest |
  <fs d'!>8-. b\rest <e, as>-. b'\rest  b16 a gs fs  gs a b gs |
  a16 b cs a  b cs d b  cs b a gs  fs e' d cs |
  
  \barNumberCheck 17
  \oneVoice b16 a gs fs  es d' cs b  a gs fs e  d a' gs fs |
  es16 ds cs8  r16 b' a gs  a b cs d! \voiceOne b8.\prall cs16 |
  cs8-. b\rest <b es>-. b\rest <cs fs>-. b\rest <cs gs'>-. b\rest |
  \oneVoice r16 cs fs e!  d cs b d  cs b a cs  b a gs b |
  a16 b cs d  es, d' cs b  a gs a fs  es8.\trill fs16 |
  fs1^~ |
  fs8 \oneVoice r b,16 cs d fs  a, b cs fs  gs, a b es |
  % fermata, SrcB
  \voiceOne fs4~ fs16 fs8 es16  fs2\fermata |
  \bar "|."
}

leftHandUpper = \relative {
  \voiceThree a8-. r b-. r a-. r gs-. r |
  fs8-. r s2. |
  s1 * 6 | 
  
  \barNumberCheck 9
  s1 * 3 |
  s2 \voiceUp r8 gs'  a16 gs fs a |
  gs16 fs e gs  fs e ds fs  e8 s s4 |
  s2. e8 s |
  d!8 s cs s  <b fs'> r \voiceDown e r |
  fs r \voiceUp gs r  a16 s8. s4 |
  
  \barNumberCheck 17
  s1 |
  s2. fs4 |
  es8 s gs s a s es s |
  s1 * 2 |
  \voiceDown r16 a, b cs  d cs b d  cs b a cs  b a gs b |
  a8 s s2. |
  % final as, SrcB
  \voiceUp r16 d cs b  a8 gs  as2 |
}

leftHandLower = \relative {
  \beamQuarterNotes.44
  \voiceTwo fs1 |
  fs,8 fs' \oneVoice a16( gs fs a  gs fs e gs  fs e ds fs) |
  e16( ds cs e  fs8-.) a-.  d,16( cs b d  e8-.) gs-. |
  cs,16( b a cs  d cs b d  cs b a cs  b a gs b) |
  a16( gs fs a  d8-.) fs-.  b,16( a gs b  e8-.) gs-. |
  cs,16 b a cs  d e fs a  cs, d e a  b, cs d gs |
  a,8 a'16 b  cs b a cs  b a gs b  a gs fs a |
  gs16( fs e gs  cs8-.) e-.  a,16( gs fs a  ds8-.) fs-. |
  
  \barNumberCheck 9
  gs,8-. e'-.  fs,-. ds'-.  e,-. cs'-.  ds,-. bs'-. |
  cs,8-. cs'-.  e,16 fs gs e  fs gs a fs  ds e fs ds |
  gs8-. cs,-.  fs-. bs,-.  e-. cs-.  ds-. gs,-. |
  a8-. fs-.  gs16( fs gs8  cs,) r fs' r |
  e8 r ds r  cs16 e fs gs  a gs fs a |
  gs16 fs e gs  fs e ds fs  e ds cs b!  as b cs as |
  b16 cs d! b  cs d e cs  \voiceTwo d8 d\rest d'-> r |
  cs8-> r \oneVoice b_> r  a16( b cs a  d8-.) fs,-. |
  
  \barNumberCheck 17
  gs16( a b gs  cs8-.) es,-.  fs16 fs, gs a  b cs d b |
  cs8.( b'16)  a( gs fs es  fs gs a fs  d'8-.) d,-. |
  cs8-. cs'-.  d16 cs b d  cs b a cs  b a gs b |
  a16( gs fs a  b a gs b  a gs fs a  gs fs es gs |
  fs8-.) a,16( b  cs b a gs)  fs8-. b-. cs-. cs,-. |
  \voiceTwo fs8 r b-. r a-. r gs-. r |
  fs16 a b cs  \oneVoice d cs b d  cs b a cs  b a gs b |
  a8-. b-. cs-. cs,-.  fs2_\fermata |
}

leftHand = {
  \global
  \clef bass
  <<
    \new Voice \leftHandUpper
    \new Voice \leftHandLower
  >>
}

dynamics = {
  \override DynamicTextSpanner.style = #'none
  s1\f |
  s1 * 5 |
  s1\cresc |
  s1\f |
  
  \barNumberCheck 9
  s1 * 3 |
  s4 \tag layout { s\sf } \tag midi { s } s8 s\p s4 |
  s1 |
  s2 s\cresc |
  s1 |
  s2 s-\tweak Y-offset 0.5 \f |
  
  \barNumberCheck 17
  s1 |
  s2.\dim s4-\tweak Y-offset 1 \p |
  s1\f |
  s1 * 2 |
  s1\ff |
  s1 |
  s2 s-\tweak Y-offset -2 \sf |
}

tempi = {
  \tempo "Allegro moderato" 4 = 100
  s1 * 23 |
  \set Score.tempoHideNote = ##t
  \tempo 4 = 92
  s4 \tempo 4 = 84 s \tempo 4 = 60 s2 |
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

preludeFourteenNotes =
\score {
  \header {
    title = "Prelude 14"
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


preludeFourteenMidi =
\book {
  \bookOutputName "prelude-14-bwv-859"
  \score {
    \keepWithTag midi
    \articulate <<
      \new Staff = "upper" << \rightHand \dynamics \tempi >>
      \new Staff = "lower" << \leftHand \dynamics \tempi >>
    >>
    \midi {}
  }
}
