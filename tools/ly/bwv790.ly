% Sinfonia 4, BWV 790 – Mutopia, Olivier Vermersch
tu = \tieUp
td = \tieDown
tb = \tieNeutral
su = { \change Staff = up}
sd = { \change Staff = down}

melone =  \relative c'' {
  \stemUp \tu r16 d cis d a8 f' ~ f16 e d e a,8 g' ~ |
  g16 f e d a'4 ~ a16 gis fis gis gis8. a16 |
  a4 ~ a16 d, cis d g4 ~ g16 cis,! b! cis |
  f4.  a8 g4 ~ g16 f e f |
  d4 r16 bes' a bes e,4 ~ e16 a g a |
  d,4 ~ d16 d e f g4 ~ g16 f e d |
  c2 ~ c16 bes a bes g d' c d |
  g, bes a bes ~ bes c bes c a4 r8 f' ~ |
  f16 e8. r8 g8 ~ g16 f e f c8 a' ~ |
  a16 g f g c,8 bes' ~ bes16 a8. ~ a4 ~ |
  a16 d, cis d g4 ~ g16 f e g f4 ~ |
  f16 e d e a,8 d ~ d16 c b c fis,8 b ~ |
  b16 a gis a ~ a gis fis gis r a gis a e8 c' ~ |
  c16 b a b e,8 d' ~ d16 c b c ees4 ~ |
  ees16 d8. r8 fis g2 ~ |
  g16 fis bes a fis4 g16 d c d g,8 f' ~ |
  f16 e! d e c8 bes' ~ bes16 a g bes a g f e |
  d4~ d16 f e d cis4 ~ cis16 a d c |
  bes2 ~ bes16 a gis b a g f g |
  f4 ~ f16 a g a  bes!8[ b]  c[ cis] |
  d2 ~ d4. d8 |
   cis[ c]  b[ bes] a4 gis8 g |
  fis f e4 d2\fermata \bar "|."
}

meltwo =  \relative c'' {
  \stemDown \td R1 |
  r16 a gis a e8 c' ~ c16 b a b e,8 d' ~ |
  d16 c b c
  \once \override Tie #'staff-position = #-0.5
  f!4 ~ f16
  b, a b \once \override Tie #'staff-position = #-1.0 e4 ~ |
  e8 a, d16 e d c! b8. cis16 cis4_\prall |
  d16 d cis d g,4 ~ g16 c bes c f,4 ~ |
  f16 bes a c bes4 ~ bes16 c bes a bes a g f |
  e8 bes' ~ bes16 a g a f2 ~ |
  f4 e! r16 f e f c8 a' ~ |
  a16 g f g c,8 bes' ~ bes16 a8. r8 f' ~ |
  f16 e8. r8 g ~ g16 f8. ~ f16 e d c |
  bes4 ~ bes16 a bes g cis!4 d16 bes a bes |
   gis8[ a]  fis[ f] e4 dis8 d |
  cis c b4 a r |
  r2 r16 e'16 dis e a,8 g' ~ |
  g16 fis e! fis d!8 c' ~ c16 bes a bes c d c d |
  ees4 ~ ees16 d ees c d  r r8 r4 |
  r2 r16 f, e f c8 a' ~ |
  a16 g f g bes,8 g' ~ g16 f e f a,8 f' ~ |
  f16 e d f ees d cis d cis8 d e4 ~ |
  e8 a, d4 ~ d16 g f g e bes' a g |
  a d, c'!8 ~ c16 bes a bes a g fis g d8 bes' ~ |
  bes16 a g a d,8 g ~ g16 f e! f b,8 e ~ |
  e16 d cis d ~ d cis b cis d2 |
}

melthree =  \relative c {
  \stemDown  \tu d8 e f d a' b cis a |
  d4 ~ d16 c! b a e'4 e, |
  \stemUp a, r r2 |
  r16 d cis d a8 f'~ \stemDown f16 e d e a,8 g' ~ |
  g16 f e d bes'!4 ~ bes16 e, d c a'4 ~ |
  a16 d, c d \stemUp g,8 f' ~ \stemDown f16 e d e c8 bes' ~ |
  bes16 a g a f8 ees' d c bes a |
  bes g c c, \stemUp f, g a f \stemDown |
  c' d e c f g a f |
  c' d e c f16 c bes c f,8 f' ~ |
  f16 bes, a bes e,8 e' ~ e16 a, g a d,8 d' ~ |
  d c! ~ c16 b a b gis8 a ~ a16 gis fis gis |
   a8[ dis,] \stemUp  e[ e,] a b c a \stemDown |
  e' fis gis e a4 ~ a16 g fis! g |
  \stemUp  d8[ c]  bes![ a] g16 g' fis g \stemDown d8 bes' ~ |
  bes16 a g a d,8 c' ~ c16 bes a bes c bes a g |
  c8 d e c f,4 r8 f |
  bes a g bes a g f d |
  g f g e! a b cis a |
  d16 d, cis d \stemUp a8 f' ~ \stemDown f16 e d e a,8 g' ~ |
  g16 fis e fis d8 c' bes a bes16 a g a |
  g fis e fis g f ees d \stemUp \td cis8 d ~ d16 cis b cis |
  d8 gis, a4 d,2\fermata
}

\score {
\context PianoStaff
<<
  \context Staff = "up"   <<
    \time 4/4 \key d \minor \clef G
    \context Voice = VA { \voiceOne \melone }
    \context Voice = VB { \voiceTwo \meltwo }>>
  \context Staff = "down" <<
    \time 4/4 \key d \minor \clef F \melthree>>
>>
}
