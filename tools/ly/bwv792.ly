% Sinfonia 6, BWV 792 – Mutopia, Olivier Vermersch
su = { \change Staff = up}
sd = { \change Staff = down}

melone =  \relative c'' {
  R4. R4. R4. |
  b8 cis dis e fis gis fis gis e |
  dis4. cis2.  |
  b a4. ~ |
  a gis2.  |
  cis dis4. |
  e2. dis4. ~ dis cis2. |
  bis4. cis2. ~  |
  cis8 dis e fis gis a gis a fis |
  e gis dis e gis bis, cis e4 ~ |
  e4. r e! ~ |
  e dis2. ~ |
  dis4. cis b ~ |
  b ais cis ~ |
  cis2. r4. |
  b'8 ais gis fis e dis e cis dis  |
  b4.\prall r r |
  R4. R4. R4. |
  fis8 gis a b cis d cis d b |
  a b cis d e fis e fis d |
  cis dis! e fis gis a gis a fis |
  e2. ~ e4. ~  |
  e8 e dis cis b a b a cis |
  dis4. ~ dis8 e fis gis fis a |
  b,2. ~ b4. |
  a2. gis4. ~ |
  gis fis2.~ \td |
  fis4. e dis ~  |
  dis2. ~ dis4. ~ |
  dis8 cis dis e fis gis fis gis e |
  \tu a2. ~ a4. ~ |
  a8 fis gis a b cis b cis a |
  dis4.\fermata r r |
  \stemDown e8 dis cis \stemUp b a gis a gis b |
  \stemDown cis4. r r |
  b'8 a gis fis e dis e dis fis ~ |
  fis16 e dis cis gis'8 ~ gis16 fis e dis a'8 ~ a16 gis fis e b'8 ~ |
  \stemUp b b, cis dis e fis e fis dis |
  e4. r fis,4 a8 |
  gis2.\fermata \bar "|."
}

meltwo =  \relative c' {
  e8 fis gis a b cis b cis a |
  gis2. ais4. |
  b2. a!4. ~ |
  a gis2. |
  fis e4. ~ |
  e8 fis gis a b cis b cis a |
  gis4. fis2. |
  e dis4. ~ |
  dis8 e fis gis a b a b gis |
  fis4. bis,2. |
  cis4. r r8 r8 gis'8  |
  ais cis gis ais cis eis, fis ais4 ~ |
  ais4. b fis |
  e2. dis4. |
  e2. ~ e4. ~ |
  e8 fis gis ais b cis b cis ais |
  b2. ais4.  |
  b4. r r |
  b,8 cis dis e fis gis fis gis e |
  dis4. eis2. |
  fis gis4. |
  a r r |
  cis8 b a gis fis e fis e gis  |
  a2. ~ a4. ~ |
  a2. ~ a4. ~ |
  a8 gis fis e d cis d b cis |
  cis dis! e dis e cis b cis dis |
  cis dis \sd \stemUp \tu b a b cis b cis a |
  gis2. fis4. ~ |
  fis8 dis e fis gis a gis a fis |
  e4. cis'2. ~ |
  cis8 a b cis \su \stemDown \td dis e dis e cis  |
  b4. fis'2. ~  |
  fis4. r r |
  \sd \stemUp e,8 fis gis a b cis b cis a |
  g4. r r |
  r8 fis gis! a b cis b cis a |
  gis4. a b  |
  cis8 \su \stemDown dis e fis gis a gis a fis |
  gis4. r cis,8 dis4 |
  e2. |
}

melthree =  \relative c' {
  \stemDown e2. dis4. |
  e cis fis |
  b,8 cis dis e fis gis fis gis e |
  dis e fis e fis dis cis dis e |
  dis e cis b cis dis cis dis b |
  a4. fis b |
  e,8 fis gis a b cis b cis a |
  gis a b a b gis fis gis a |
  gis4. e fis |
  dis2. gis4. |
  \stemUp cis,4. \stemDown r e |
  fis r r8 r cis' |
  dis fis cis dis fis ais, b dis fis, |
  gis b fis gis b dis, e gis b,  |
  \stemUp cis e b cis e gis, ais cis e,  |
  fis4. \stemDown e' r |
  dis e fis  |
  \stemUp b,8 cis dis \stemDown e fis gis fis gis e  |
  dis e fis gis fis e a4. ~ |
  a gis cis |
  fis, b2. |
  a8 gis fis e dis cis \stemUp bis cis dis |
  cis4. \stemDown r r |
  fis r r |
  b8 a gis fis e dis e dis fis |
  gis2. ~ gis4. ~ |
  gis fis2. |
  e dis4. |
  e8 dis cis b a gis a gis b |
  bis,4. r r |
  cis r r |
  fis r r |
  \stemUp dis \stemDown r r |
  \stemUp a'\fermata \stemDown r r  |
  gis r r |
  ais8 cis dis e fis g! fis g e  |
  dis4. r r |
  e fis gis |
  a r r |
  r8 b fis gis dis e \stemUp ais, b b,  |
  e2.\fermata |
}

\score {
\context PianoStaff
<<
  \context Staff = "up"   <<
    \time 9/8 \key e \major \clef G
    \context Voice = VA { \voiceOne \melone }
    \context Voice = VB { \voiceTwo \meltwo }>>
  \context Staff = "down" <<
    \time 9/8 \key e \major \clef F \melthree>>
>>
}
