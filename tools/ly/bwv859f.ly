% Wohltemperiertes Klavier I, Fuge 14, BWV 859 – Knute Snortum (github.com/ksnortum/bach-well-tempered-1), CC BY-SA 4.0
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

tieShapeA = \shape #'((0 . 0) (0 . -0.25) (0 . -0.25) (0 . 0)) \etc

%%% Music %%%

global = {
  \time 6/4
  \key fs \minor
  \set Staff.extraNatural = ##f
}

rightHandUpper = \relative {
  s1. * 8 |
  
  \barNumberCheck 9
  s1. * 6 |
  \voiceOne b'4\rest fs gs  a2.~ |
  a4 gs8 as b4~  b as8 gs as bs |
  
  \barNumberCheck 17
  cs4. b!8 a! cs  b a gs2 |
  fs8 a b cs d4~  d8 b cs ds e4~ |
  e8 d! d cs cs bs  bs4 cs2~ |
  cs4 bs2  cs8 ds e fs g4~ |
  g4 cs,4 fs8 e  d cs d2 |
  cs4 ds es  fs2.~ |
  fs2 e!4~  e d2~ |
  d4 cs2~  cs4 b2~ |
  
  \barNumberCheck 25
  b8 gs a cs fs ds  e!2.~ |
  e4 ds8 es fs4~  fs4 es8 ds es fss |
  gs4. fs!8 e! gs  fs e ds2\trill |
  cs8 e fs gs a4~  a8 fs gs as b4~ |
  b8 a! a gs gs fs  fs a16 gs fs8 e! e ds |
  ds8 e e d! d cs  cs2~ cs8 ds |
  es8 fs gs4 cs,  fs2 es4 |
  fs8 e! d cs cs b  b fs' b, a a gs |
  
  \barNumberCheck 33
  gs4. b8 a gs  fs es fs a b cs |
  ds2.~  ds8 gs, cs b b a |
  a2.~  a8 cs b a a gs |
  gs2.~  gs8 b a g g fs |
  fs8 es fs4 gs!  a2.~ |
  a4 gs8 as b4~  b as8 gs as bs |
  cs4. b!8 a cs  b a gs2^\rall |
  fs1.\fermata |
  \bar "|."
}

rightHandLower = \relative {
  R1. * 3 |
  r4 cs' ds e2.~ |
  e4 ds8 es fs4~  fs es8 ds es fss |
  gs4. fs!8 e! gs  fs e ds2\trill |
  \voiceOne cs8 e fs gs a4~  a8 fs gs as b4~ |
  b8 b b a! a gs  gs fs fs e e ds |
  
  \barNumberCheck 9
  ds8 e e d d cs  cs2~ cs8 ds |
  es8 fs gs4 cs,  fs2 es4 |
  fs2.  e!4 fs8 gs a4 |
  gs2. fs |
  e4. fs8 g4~  g fs8 e d cs |
  d4. e8 fs4~  fs e8 d cs b |
  \voiceFour cs4 ds es  fs2.~ |
  fs4 gs fs  es fs8 es fs4 |
  
  \barNumberCheck 17
  gs2 fs4~  fs8 e d!4 cs~ |
  cs4. gs'8 a b  e,!4. a8 b cs |
  fs,2.~  fs8 fs fs e e ds |
  ds8 gs gs fs fs e  e4 cs' b |
  as2.~  as4 b8 a gs4~ |
  gs a8 b a gs  fs4. gs8 a fs |
  gs8 a b2  cs fs,4 |
  b4. e,8 fs gs  a2 d,4 |
  
  \barNumberCheck 25
  cs2 a'4  gs8 cs cs b b as |
  as8 b b a a gs  gs2~ gs8 as |
  bs8 cs ds4 gs,  cs2 bs4 |
  cs4. b!8 cs ds  e4. cs8 ds es |
  fs4 fs, es  fs8 cs fs gs a fs |
  b4. fs8 gs a  es cs fs4 cs~ |
  cs8 ds es4 fs8 e  d cs b2 |
  a8 cs fs2~ fs2.~ |
  
  \barNumberCheck 33
  fs8 fs e2  d4 r8 fs gs as |
  b8 a! fs fs es fs  es fs gs2~ |
  gs8 gs fs e e ds  ds2.~ |
  ds8 fs e d! d cs  cs2.~ |
  cs4 b2  r8 gs' fs e e ds |
  ds8 e e d! d cs  cs2~ cs8 ds |
  es4 fs8 es fs4~  fs2 es4 |
  cs1. |
} 

rightHand = {
  \global
  \mergeDifferentlyDottedOn
  <<
    \new Voice \rightHandUpper
    \new Voice \rightHandLower
  >>
}

leftHandUpper = \relative {
  r4 fs gs a2.~ |
  a4 gs8\< as b4~\!  b as8\< gs as bs\! |
  cs4. b!8 a! cs  b a gs2\trill |
  fs2. r8 cs' cs b b as |
  as8 b b a a gs  gs2~ gs8 as |
  bs8 cs ds4 gs,  cs2 bs4 |
  cs4. b!8 cs ds  e4. cs8 ds es |
  \voiceUp fs4 cs b  cs \voiceDown a fs |
  
  \barNumberCheck 9
  b2.  es,8 cs fs4 \voiceUp cs'~ |
  cs8 ds es4 fs8 e  d cs b2~ |
  b8 a b cs d4~  d8 cs ds es fs4~ |
  fs8 fs e! ds cs b!  as4 bs8 cs ds4~ |
  ds8 ds cs4 b  as8 b cs2~ |
  cs8 cs \voiceDown b4 a!  gs8 a b2~ |
  b8 d cs b b a  a b cs2 |
  b2. cs~ |
  
  \barNumberCheck 17
  cs8 ds es4  fs8 e d cs  b a gs b |
  a4 r r  s2. |
  s1. * 6 |
  
  \barNumberCheck 25
  s1. * 7 |
  \voiceThree fs4 a2~  a4 fs b~ |
  
  \barNumberCheck 33
  b2 cs8 b  a2 r4 |
  r8 fs b4. a8  gs4. gs8 cs4~ |
  cs8 e ds cs cs b  b2.~ |
  b8 d! cs b b a  a2.~ |
  a4. a8 gs fs  es b' a gs gs fs |
  fs8 gs gs fs fs es  es4 fs8 es fs4 |
  gs4 cs2  r8 fs, cs' b b as |
  as1. |
}

leftHandLower = \relative {
  s1. * 7 |
  \voiceTwo r4 fs, gs  a2.~ |
  
  \barNumberCheck 9
  a4 gs8 as b4~  b as8 gs as bs |
  \oneVoice cs4. b!8 a! cs  b a gs2\trill |
  fs4. e!8 fs gs  a2~ a8 b |
  cs8 bs cs ds e4~  e8 fs e ds cs bs |
  cs4. cs8 d! e  fs4.  fs,8 gs as |
  \voiceTwo b4. b8 cs d  e4. e,8 fs gs |
  a8 b a gs gs fs  fs fs' fs e e ds |
  ds8 e e d d cs  cs2~ cs8 ds |
  
  \barNumberCheck 17
  es8 fs gs4 cs,  fs2 es4 |
  fs4. es8 fs gs  \oneVoice a4. fs8 gs as |
  b8 b, b a a gs  gs a' a gs gs fs |
  fs4 gs gs, cs4. cs8 d! e |
  fs8 g fs e d cs  b d gs,! fs fs es |
  es8 es' fs gs gs a  a d d cs cs b |
  b8 a gs d' cs b  as b b a a gs |
  gs8 fs e b' a gs  fs gs gs fs fs es |
  
  \barNumberCheck 25
  es4 fs fs,  cs'8 ds e! fs g e |
  fs8 fs, b cs d! b  cs cs, cs' bs cs e! |
  ds8 cs bs gs cs e  a fs gs fs gs gs, |
  cs4 r r r2 r4 |
  r4 fs gs  a2.~ |
  a4 gs8 as b4~  b as8 gs as bs |
  cs4. b!8 a! cs  b a gs2 |
  \voiceTwo r4 fs e  ds2.~ |
  
  \barNumberCheck 33
  ds4 e8 d! cs4~  cs d8 e! d cs |
  b4. cs8 d b  cs ds es2 |
  fs2.~  fs8 a gs fs fs e |
  e2.~  e8 gs fs e e d |
  d2. cs-\tieShapeA ~ |
  cs1.-\tieShapeA ~ |
  cs8 b a gs fs a  d b cs4 cs, |
  fs1.\fermata |
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
  \override TextScript.Y-offset = -0.5
  \override DynamicTextSpanner.style = #'none
  s4 s2^\mfLegatoEdEspressivo s2. |
  s1. |
  s4.\sf s\dim s2. |
  s4 s2-\tweak Y-offset -1 \mf s2. |
  s2. s4. s4\< s8\! |
  s2\sf s1\dim |
  s2.\p s\cresc |
  s4 s2-\tweak Y-offset -1.5 \f-\tweak Y-offset -1 \< s2.\! |
  
  \barNumberCheck 9
  s4 s4.\< s8\! s2 s8\< s\! |
  s1.-\tweak Y-offset -1 \sf |
  s1. * 2 |
  s1.-\tweak Y-offset -1 \dim |
  s1. |
  s1\p s2\cresc |
  s4 s\< s\! s4. s4\< s8\! |
  
  \barNumberCheck 17
  s1.-\tweak Y-offset 0.5 \f |
  s4. s4-\tweak Y-offset 1.5 \< s8\! s4. s4-\tweak Y-offset 1 \< s8\! |
  s2. s4. s-\tweak extra-offset #'(0 . -0.5) \dim |
  s2. s\p |
  s1. |
  s1.\cresc |
  s2. s\dim |
  s2. s\p |
  
  \barNumberCheck 25
  s1.\cresc |
  s2\< s8 s\! s4 s4.\< s8\! |
  s2\f s1\dim |
  s1.\p |
  s1. * 3 |
  s4 s2\cresc s2. |
  
  \barNumberCheck 33
  s1. |
  s1.\f |
  s1 s2\dim |
  s1. |
  s2 s1\cresc |
  s1. |
  s4.\sf s\dim s8 s-\tweak Y-offset 1 \p s2 |
  s1.\pp |
}

tempi = {
  \tempo "Andante maestoso" 4 = 88
  s1. * 38 |
  \set Score.tempoHideNote = ##t
  s1 \tempo 4 = 80 s4 \tempo 4 = 72 s |
  s1. |
}

forceBreaks = {
  % page 1
  \repeat unfold 3 { s1.\noBreak } s1.\break\noPageBreak
  \repeat unfold 2 { s1.\noBreak } s1.\break\noPageBreak
  \repeat unfold 2 { s1.\noBreak } s1.\break\noPageBreak
  \repeat unfold 3 { s1.\noBreak } s1.\break\noPageBreak
  \repeat unfold 2 { s1.\noBreak } s1.\break\noPageBreak
  \repeat unfold 2 { s1.\noBreak } s1.\pageBreak
  
  % page 2
  \repeat unfold 3 { s1.\noBreak } s1.\break\noPageBreak
  \repeat unfold 2 { s1.\noBreak } s1.\break\noPageBreak
  \repeat unfold 2 { s1.\noBreak } s1.\break\noPageBreak
  \repeat unfold 2 { s1.\noBreak } s1.\break\noPageBreak
  \repeat unfold 2 { s1.\noBreak } s1.\break\noPageBreak
}

fugueFourteenNotes =
\score {
  \header {
    title = "Fugue 14"
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
      \override Stem.details.beamed-lengths = #'(3.5 3.9)
    }
  }
}


fugueFourteenMidi =
\book {
  \bookOutputName "fugue-14-bwv-859"
  \score {
    \keepWithTag midi
    \articulate <<
      \new Staff = "upper" << \rightHand \dynamics \tempi >>
      \new Staff = "lower" << \leftHand \dynamics \tempi >>
    >>
    \midi {}
  }
}
