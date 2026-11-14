% Wohltemperiertes Klavier I, Präludium 13, BWV 858 – Knute Snortum (github.com/ksnortum/bach-well-tempered-1), CC BY-SA 4.0
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
  \time 12/16
  \key fs \major
  \set Staff.extraNatural = ##f
}

rightHand = \relative {
  \global
  fs'16\< as cs  as fs cs'\!  cs4.~\prall |
  cs16[( as b8]  cs16[ as8]  ds16[ gs,8]  as16 fs~ |
  fs16[ b es,8]  b'16[ ds,8]  b'16[ cs,]  es gs b) |
  as16[ fs bs8]  fs16[ cs'8]  fs,16[ ds'8]  gs,16 es'~ |
  es16[ gs cs,8]  ds16 bs  cs es cs~  cs es32 ds cs16~ |
  cs16[ as' cs,8]  ds16 bs  cs es gs  es cs gs' |
  gs4.~\prall  gs16[ es fs8]  gs16 es~ |
  es16[ as ds,8]  es16[ css]  fs[ as, b8]  cs16 as~ |
  
  \barNumberCheck 9
  as16[ ds gs,8]  as16[ fs8]  b16[ e,8]  fs16 ds |
  gs16[ css, ds8]  css16[ gs'8]  es16[ b'8]  gs16 es'~ |
  es16[ es, fs8]  as16[ ds8]  es,16[ gs8]  as16 css |
  ds4.~\prall  ds16 fs as  fs ds gss |
  gss4.~\prall  gss16 as bs  es, fs ds |
  cs16[ es as,8]  bs16 gss  as cs as~  as cs32 bs as16~ |
  as16[ fs' as,8]  bs16 gss  as cs es  cs as fss' |
  fss4.~\prall  fss16 as ds,  cs b! as |
  
  \barNumberCheck 17
  b16[ ds gs,8]  as16 fss  gs b gs~  gs b32 as gs16~ |
  gs16[ e' gs,8]  as16 fss  gs b ds  b gs es' |
  es4.~\prall  es16 cs es  gs es gs |
  b4.~\prall  b16[ gs as8]  b16 gs~ |
  gs16[ es fs8]  gs16 es  fs[ as, b!8]  cs16 as~ |
  as16[ ds gs,8]  as16[ fs8]  es16[ b'8]  gs16 ds'~ |
  ds16[ b gs'8]  es16[ b8]  as16[ cs8]  as16 fs~ |
  fs16[ ds b'8]  gs16 es  fs4.~\prall |
  
  \barNumberCheck 25
  fs16[ as, b8]  cs16[ as8]  ds16[ gs,8]  as16 fs |
  b4.~\prall  b16 es gs  es b gs' |
  a,16 cs fs  b, es gs  cs, fs a  d, gs b |
  es,16[ b' d8]  b16[ es8]  d16[ gs8]  es16 b' |
  as16[ cs, fs8]  gs16 es  fs fs, fs'~  fs as32 gs fs16~ |
  fs16[ fs, fs'8]  gs16 es  fs cs as  fs8. |
  \bar "|."
}

leftHand = \relative {
  \global
  \clef bass
  r4. fs16 as cs  as fs ds' |
  ds8._(\prall cs b as |
  gs8. fs es cs) |
  fs8. gs as bs |
  cs8. gs as es |
  fs8. gs cs, r |
  cs16 es gs  es cs as'  as8.\prall gs |
  fs8. es ds cs |
  
  \barNumberCheck 9
  b8. as gs fs |
  es!8. es' css as |
  ds8. fs gs as |
  ds,16 fs as  fs ds bs'  bs4.~\prall |
  bs16 ds fs  ds \once \omit Accidental bs fs'  fs es ds  cs ds es |
  as,8. es fs cs |
  ds8. es as, r |
  ds16 fss as  fss ds cs'  cs8.\prall fss, |
  
  \barNumberCheck 17
  gs8. ds e b |
  cs8. ds gs, r |
  cs16 es gs  es cs b'  b8.~\prall  b16 gs b |
  es16 gs es  cs es cs  fs,8. b |
  bs8. cs ds, cs |
  b!8. as gs fs' |
  es8. cs fs as, |
  b8. cs  fs,16 as cs  as fs ds' |
  
  \barNumberCheck 25
  ds8.\prall cs b as |
  gs16 b ds  b gs es'  cs,4.~\prall |
  cs8. cs' cs, cs' |
  cs,8. es' gs cs |
  fs,8. cs ds as |
  b8. cs fs,4. |
}

dynamics = {
  \override TextScript.Y-offset = -0.5
  \override DynamicTextSpanner.style = #'none
  \tag layout { s4.^\pLegato } \tag midi { s4.\p } s4\sf\< s16 s\!
  s8.-\tweak Y-offset 0.5 \sf s8.\dim s4. |
  s2.\p |
  s2.\cresc |
  s4.\> s\pp |
  s4. s4\< s16 s\! |
  s4.\sf\< s8.\sf s\dim |
  s2. |
  
  \barNumberCheck 9
  s2.\p |
  s2.\cresc |
  s8. s\dim s4. |
  s4.\p\< s4\sf\< s16 s\! |
  s4.\sf s\dim |
  s8. s\pp s4. |
  s4. s4\< s16 s\! |
  s4.\sf\< s-\tweak Y-offset 0 \sf |
  
  \barNumberCheck 17
  s8. s\dim s4. |
  s4.\p s4\< s16 s\! |
  s4.\sf\< s4\sf\< s16 s\! |
  s4.\sf s8. s\dim |
  s2. |
  s2.\p |
  s2. |
  s4. s4\< s16 s\! |
  
  \barNumberCheck 25
  s8.\sf s\dim s4. |
  s4.\< s\sf |
  s8. s\cresc s4. |
  s8. s\f\< s4 s16 s\! |
  s4.\p s8. s\pp |
  s2. |
}

tempi = {
  \tempo "Allegretto" 8. = 96
  s2. * 29 |
  \set Score.tempoHideNote = ##t
  \tempo 8. = 88
  s8. \tempo 8. = 80 s \tempo 8. = 72 s \tempo 8. = 40 s |
}

forceBreaks = {
  % page 1
  \repeat unfold 2 { s2.\noBreak } s2.\break\noPageBreak
  \repeat unfold 2 { s2.\noBreak } s2.\break\noPageBreak
  \repeat unfold 2 { s2.\noBreak } s2.\break\noPageBreak
  \repeat unfold 2 { s2.\noBreak } s2.\break\noPageBreak
  \repeat unfold 2 { s2.\noBreak } s2.\pageBreak
  
  % page 2
  \repeat unfold 2 { s2.\noBreak } s2.\break\noPageBreak
  \repeat unfold 2 { s2.\noBreak } s2.\break\noPageBreak
  \repeat unfold 2 { s2.\noBreak } s2.\break\noPageBreak
  \repeat unfold 2 { s2.\noBreak } s2.\break\noPageBreak
}

preludeThirteenNotes =
\score {
  \header {
    title = "Prelude 13"
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


preludeThirteenMidi =
\book {
  \bookOutputName "prelude-13-bwv-858"
  \score {
    \keepWithTag midi
    \articulate <<
      \new Staff = "upper" << \rightHand \dynamics \tempi >>
      \new Staff = "lower" << \leftHand \dynamics \tempi >>
    >>
    \midi {}
  }
}
