% Sinfonia 11, BWV 796 – Mutopia, Olivier Vermersch
su = { \change Staff = up}
sd = { \change Staff = down}

melone =  \relative c'' {
  r8 g8. \lbeamone \rbeamtwo fis16 \lbeamtwo g a b c d b |
  e d c b a g fis e d c' b a |
  b4 ~ b16 a b cis d4 ~ |
  d2 cis4 |
  d ~ d16 cis d e fis g a fis |
  b a g fis e d c b a g' fis e |
  d4 ~ d16 d e fis g4 ~ |
  g8 e c a fis'4 ~ |
  fis8 d b g e'4 ~ |
  e8 c a fis dis'4 |
  e r e ~ |
  e d!8 c d4 ~ |
  d16 d c b a gis a b c d e c |
  f e d c b a gis fis! e d' c b |
  a gis a b c d e fis g! a b g |
  c b a g fis e dis cis \stemDown b a' g fis |
  b a g fis e d! cis b a g' fis e |
  a g fis e d cis b a g fis' e d |
  g fis e d \stemUp cis b ais gis fis e' d cis |
  \stemDown fis e d cis \stemUp b2 ~ |
  b2 ais4 |
  b ~ b8 e d c |
  b f' e d c b |
  c4 ~ c8 d c b |
  a e' d c b a |
  b4 r g' ~ |
  g ~ g16 b a g fis4 |
  f ~ f16 a g f e4 ~ |
  e ~ e16 g fis e d4 ~ |
  d ~ d16 f e d c4 ~ |
  c16 c b a g fis g a b c d b |
  e d c b a g fis e d c' b a |
  b2. \bar "|."
}

meltwo =  \relative c' {
  R2. |
  R2. |
  r8 d8. \lbeamone \rbeamtwo cis16 \lbeamtwo d e fis g a fis |
  b a g fis e d cis b a g' fis e |
  fis  a, b cis d e fis g a b c a |
  d8 b g e \once \override NoteColumn   #'force-hshift = #-0.5 c'4 ~ |
  c16 c b a b4 ~ b16 a b g |
  c2 ( c16) e d c |
  b2 ( b16) d c b |
  a2 ( a16) c! b a |
  g a g fis e dis e fis g a b g |
  c b a g fis e d c b a' gis fis |
  e2. |
  d |
   c8[ b]  a[ c]  b[ e] ~ |
  e c \sd \stemUp \tu a fis dis'4 ~ |
  dis8 b g e cis'4 ~ |
  cis8 a fis d b'4 ~ |
  b8 g e cis ais'4 |
  b ~ b16 ais b \su \stemDown \td cis d e fis d |
  g fis e d cis \sd \stemUp b ais gis fis \su \stemDown e' d cis |
  d fis gis ais b8 c! b a |
  gis2. |
  r16 e fis! gis a8 b a g |
  fis2. |
  r16 d e fis g fis g a b c d b |
  e d c b a g fis e d c' b a |
  d c b a g f e d c b' a g |
  c b a g fis e d c b a' g fis |
  b a g fis e d c b a g' fis! e |
  d4 r g ~ |
  g2 \once \override NoteColumn   #'force-hshift = #-0.5 fis4 |
  g2. \bar "|."
}

melthree =  \relative c {
  g4 b g |
  c d d, |
  g g' fis |
  g a a, |
  d r r |
  R2. |
  r8 g8. \lbeamone \rbeamtwo fis16 \lbeamtwo g a b c d b |
  e d c b a g fis e d c' b a |
  d c b a g fis e d c b' a g |
  c b a g fis e dis cis b a' g fis |
  e8. dis16 e fis g a b8 e, |
  a fis b4. a8 |
  gis a16 b  c8[ b]  a[ c] ~ |
  c b16 a gis8 b gis e |
   fis[ gis]  a[ dis,]  e[ g] |
  \td \slurDown a2 ( a16) c! b a |
  g2 ( g16) b a g |
  fis2 ( fis16) a g fis |
  e2 ( e16) \slurNeutral g! fis e |
  d4 g fis |
  e fis \stemDown fis, \stemNeutral |
  b ~ b16 a! b c! d e f c |
  \stemUp d e d c b a gis fis! e d' c b \stemNeutral |
  a4 ~ a16 g! a b c d e b |
  c d c b a g fis e d c' b a |
   g8[ b]  d[ fis]  g[ b] |
  \tu c a d4 ~ d16 e d c |
  b8 g c4 ~ c16 d c b |
  a8 fis! b4 ~ b16 c b a |
  g8 e a4 ~ a16 b a g |
  fis e d c b a g fis g a b g |
  c a b c  d8[ c]  d[ d,] |
  g2. \bar "|."
}

\score {
\context PianoStaff
<<
  \context Staff = "up"   <<
    \time 3/4 \key g \major \clef G
    \context Voice = VA { \voiceOne \melone }
    \context Voice = VB { \voiceTwo \meltwo }>>
  \context Staff = "down" <<
    \time 3/4 \key g \major \clef F \melthree>>
>>
}
