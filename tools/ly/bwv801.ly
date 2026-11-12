% Sinfonia 15, BWV 801 – Mutopia, Olivier Vermersch
% Schlussnote im Original b2. (Fermate) – hier als b4. ~ b8. auf die 9/16-Taktlänge gebracht
su = { \change Staff = up}
sd = { \change Staff = down}

melone =  \relative c'' {
   b16[ fis fis]  g[ fis fis]  b[ fis fis] |
   cis'[ fis, fis]  g[ fis fis]  cis'[ fis, fis] |
   d'32[ b d fis b fis]  d[ fis d b d b]  fis[ b fis d fis d] |
  b16 r r r  b'[ cis]  d[ cis b] |
  ais8. ~  ais16[ b cis]  b[ cis ais] |
   b32[ fis b d fis d]  b[ d b fis b fis]  d[ fis d b d b] |
  d'4. ~ d8. ~ |
   d16[ b b]  cis[ b b]  e[ b b]
  cis4. ~ cis8. ~ |
   cis16[ a a]  b[ a a]  d[ a a] |
   b32[ d b g b g] e8.  e'32[ g e cis e cis] |
   a[ cis a fis a fis] d8.  d'32[ fis d b d b] |
   g[ b g e g e]  cis[ e cis a cis a]  a'16[ fis g] |
  fis8. r r |
  R8. R8. R8. |
  R8. R8. R8. |
   a16[ e e]  fis[ e e]  a[ e e] |
   b'[ e, e]  fis[ e e]  b'[ e, e] |
  \stemDown  cis'32[ a cis e a fis] \stemUp  dis[ fis dis b dis b] \stemNeutral  fis[ b fis dis fis dis] |
  e8. r g ~ \tu |
   g16[ e e]  fis[ e e]  a[ e e] |
  fis4. ~ fis8. ~ |
   fis16[ d d]  e[ d d]  g[ d d] |
  e4. ~ e8. ~ |
   e16[ cis cis]  \stemUp d[ cis cis]  fis[ cis cis] |
   d32[ b d fis d fis]  b[ fis b d b d] g8. |
   cis,,32[ a cis e cis e]  a[ e a cis a cis] fis8. |
   b,,32[ g b d b d]  g[ d g b g b] e8. ~ |
   e16[ fis, fis]  g[ fis fis]  e'[ fis, fis] |
  d'4. ~ d8. ~ |
   d16[ b b]  c[ b b]  g'[ b, b] |
  ais8. fis'4.\fermata ~
   fis32[ b, d fis b fis]  d[ fis d b d b]  fis[ b fis d fis d] |
  d'4. ~ d8. ~ |
   d16[ cis cis]  gis'[ cis, cis]  d[ cis cis] |
   e[ cis cis]  ais'[ cis, d]  e[ d cis] |
   fis[ g e] d8.(   cis8)[\trill b16] |
  b4. ~ b8.\fermata \bar "|."
}

meltwo =  \relative c'' {
  R8. R8. R8. |
  R8. R8. R8. |
  R8. R8. R8. |
  R8. R8. R8. |
  R8. R8. R8. |
  R8. R8. R8. |
   b16[ fis fis]  g[ fis fis]  b[ fis fis] |
  gis4. ~ \td gis8.   |
   a16[ e e]  fis[ e e]  a[ e e] |
  fis4. ~ fis8. |
  g16 r r r8. r8. |
  R8. R8. R8. |
  R8. R8. R8.
   d16[ a a]  b[ a a]  d[ a a] |
   e'[ a, a]  b[ a a]  e'[ a, a] |
   fis'32[ d fis a d b]  gis[ b gis e gis e]  b[ e b \sd \stemUp \tu gis b gis] |
  e8. r16   a[ b]  cis[ b a] |
  gis8. ~  gis16[ a b]  a[ b gis] |
  a8. ~  a16[ b \su \stemDown \td c]  b[ c a] |
   e'[ b b]  c[ b b]  e[ b b] |
  cis!4. ~ cis8. ~ |
   cis16[ a a]  b[ a a]  d[ a a] |
  b4. ~ b8. ~  |
   b16[ \sd \stemUp \tu gis gis]  a[ gis gis]  cis[ gis gis] |
  ais4. ~ ais8. |
  b16 r r r8. \su \stemDown \td r8. |
  R8. R8. R8. |
  R8. R8. R8. |
  R8. R8. R8. |
  \stemDown  fis'16[ b, b]  d[ b b]  fis'[ b, b]  |
  g'4. ~ g8. |
  fis8. ais!4.  |
  R8. R8. R8. |
  b4. ~ b8. ~ |
  b4. ~ b8. |
  ais8. r16  ais[ b]  cis[ b ais] |
  b4. ais8. |
  b4. ~ b8. |
}

melthree =  \relative c {
  b8. r16  b'[ cis]  d[ cis b] |
  ais8. ~  ais16[ b cis]  b[ cis ais]  |
  b8. r r |
   b16[ fis fis]  g[ fis fis]  b[ fis fis] |
   cis'[ fis, fis]  g[ fis fis]  cis'[ fis, fis] |
   d'32[ b d fis b fis]  d[ fis d b d b]  fis[ b fis d fis d] |
  b8. r16  b'[ cis]  d[ cis b]  |
  e8. r16  e,[ fis]  gis[ fis e] |
  a8. r16  a,[ b]  cis[ b a] |
  d8. r16  d,[ e]  fis[ e d] |
  g8.  g'32[ b g e g e]  cis[ e cis a cis a] |
  fis8.  fis'32[ a fis d fis d]  b[ d b g b g] |
  e8.  e'32[ g e cis e cis]  a[ cis a fis a fis] |
  d8. r16  d[ e]  fis[ e d] |
  cis8. r16  a'[ b]  cis[ b a] |
  d8. ~  d16[ e fis]  e[ fis d] |
  \stemDown cis8. r r |
  e r r  |
  a, fis'4. |
  g8. r16  e[ fis]  g[ fis e] |
  a8. r16 \stemUp  a,[ b]  cis[ b a] \stemDown |
  d8. r16  d[ e]  fis[ e d] |
  g8. r16  g[ fis]  e[ fis g] |
  cis,8. r16  cis[ b]  ais[ b cis] |
  fis,8. r16  fis'[ e]  d[ e fis] |
  b,8.  d32[ b d fis d fis]  b[ g b e b e] |
  a8. \stemUp  cis,,32[ a cis e cis e]  \stemDown a[ fis a d a d] |
   g[ b g d g d]  b[ d b g b g]  e[ g e cis e cis] |
  \stemUp ais8. ~ \td  ais16[ b cis]  fis,[ b ais] |
  b8. r b |
  \stemDown e4. ~ \tu e8. ~ |
  e8. ~ e4.^\fermata |
  d8 r16 r8. r8. |
   b'32[ g b d g d]  b[ d b g b g]  d[ g d b d b] |
  \stemUp eis,8. r r |
  fis \stemDown r16  e'[ fis]  g[ fis e] |
   d8[ e16]  fis8[ e16] \stemUp  fis8[ fis,16] |
  b4. ~ b8.\fermata |
}

\score {
\context PianoStaff
<<
  \context Staff = "up"   <<
    \time 9/16 \key b \minor \clef G
    \context Voice = VA { \voiceOne \melone }
    \context Voice = VB { \voiceTwo \meltwo }>>
  \context Staff = "down" <<
    \time 9/16 \key b \minor \clef F \melthree>>
>>
}
