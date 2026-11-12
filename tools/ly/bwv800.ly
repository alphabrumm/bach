% Sinfonia 14, BWV 800 – Mutopia, Olivier Vermersch
su = { \change Staff = up}
sd = { \change Staff = down}

melone =  \relative c'' {
  R1  |
  r8  f ~ f16 ees d c bes8 d a16 bes c8 |
  f,16 f' d bes ees!8 g ~ g16 ees c \slurDown a(  c8) f |
  d4 e f8 bes,4 a8 ~ |
   a[ g] ~  g[ f] ~  f[ ees] ~  ees[ d] ~ |
  d16 g ees c a'!8 c ~ c16 f, bes d c8 ees ~ |
  ees8 d4 c8 d r  r4  |
  r8  g ~ g16 g f ees d8 f b,16 c d8 |
  g, b c2 b4 |
  c1 ~  |
  c4. f8 ~ f16 e d e e8. f16 |
  f8 a ~ a16 a g f e8 g cis,16 d e8 |
  a,8. b16 c! b c d b a b cis d4 ~ |
  d cis d8 f ~ f16 ees! d c! |
  b8 d g,16 a b8 ees,4 ees' ~  |
  ees8 d16 c bes8 a d8. ees16 d c bes aes |
  g8. aes16 bes8 f g g' ~ g16 f ees d |
  c g f'8 bes,16 c d8 g,8 ees' ~ ees16 d c bes |
  a8 d g,16 a bes8 ees, c' ~ c16 bes a g |
  f4 r r8  f'8 ~ f16 ees d c |
  bes8 d a16 bes c8 ~ c16 f, bes d c8 ees ~ |
  ees16 a, bes d f4 ~ f16 bes, c ees g4 |
  bes16 a! g f  bes[ a32 g f ees d c] bes4 ~ bes16 bes8 a16 |
  bes1\fermata \bar "|."
}

meltwo =  \relative c'' {
  bes4 ~ bes16 bes a g f8 g d16 ees f8 |
  bes,16 f bes d c8 ees ~ ees d16 e e8._\prall d32 e |
  f4  g8[ bes]  ees,[ g]  a[ c] ~ |
  c16 f, bes d g,8 bes a d,16 ees! f g ees f |
  d f bes, c d ees c d bes d \sd \stemUp g, a bes c aes bes |
  g4 f8 r \su \stemDown r2  |
  bes'4 ~ bes16 bes a g fis8 g d16 ees f8 |
  b,4 c4 ~ c8 aes' d,16 ees f8 |
  b, d g16 bes! aes g f8 aes d,16 ees f8 ~ |
  f16 f e d e8 bes' ~ bes16 a g f g a bes g |
  e g e c f8 a g2 |
  a4 bes ~ bes16 a g f e8 g  |
  cis,16 d e8 a, a' ~ a g ~ g16 f! g a |
  bes!16 g a bes e, bes' a g f4 r   |
  r2  r8 c'8 ~ c16 bes! a g |
  f8 a d,16 ees f8 bes, f' ~ f4 ~  |
  f16 d ees4 d8 ees r  c'8. bes16 |
  a! g f8 g bes ees,16 f g8 c, f ~  |
  f16 ees d \sd \stemUp \tu c bes8 d a16 bes c8 f,4 ~ |
  f8 \su \stemDown \td bes' ~ bes16 bes a g f8 a d,16 ees f8 |
  bes,16 a bes d c8 ees ~ ees d r16 bes'16 a g  |
  f4 r16 d'16 bes aes g4 r16  ees' c bes |
  f'4 r  r32  a,[ g f g16 ees] d8 c  |
  d1 \bar "|."
}

melthree =  \relative c' {
  \stemDown bes8 d c bes a g f ees |
  d4 f g c |
  d ~ d16 d bes g c8 ees ~ ees16 c a f |
  bes4 ~ bes16 bes a g f8 g d16 ees f8 |
  bes, ees bes16 c d8 g, c g16 a! bes8 |
  ees, ees'^~  ees16 \tu c' a f d8 g ees16 c f a |
  bes, bes' g d ees4\trill d16 c' bes a g bes aes g |
  f aes g f ees8 c f16 ees f g aes g f ees |
  f aes g f ees d c bes aes! c f aes g8 g, |
  c c' ~ c16 bes a! g f8 a e16 f g8 |
  \stemUp a,4 ~ \stemDown a16 a' f d \stemUp bes d bes g c8 c, |
  f16 g' f e \stemDown d8 e16 f g2 ~ |
  g16 bes a g fis d e fis g fis g a bes!8 a |
  g16 e f g a8 a, d16 a' f d d'8 f ~ |
  f16 ees d c b8 g c16 g ees c bes'! d c bes |
  a g f ees f8. g16 aes bes aes g f ees d c |
  \stemUp bes8 c g16 aes bes8 ees,4 r8 \stemDown ees''8 ~ |
  ees d ~ d16 d c bes c d c bes a bes a g |
  f8 bes, ees16 d c bes c bes a g a g f ees |
  d ees' d c bes g' f ees d ees' d c bes8. a16 |
  g8 f ~ f16 ees d c \stemUp bes8 d a16 bes c8 |
   d,[ d']  bes[ d]  ees,[ ees'] \stemDown  c[ ees] ~ |
   ees[ ees']  d[ bes]  g[ ees] \stemUp  f[ f,] |
  bes1\fermata \bar "|."
}

\score {
\context PianoStaff
<<
  \context Staff = "up"   <<
    \time 4/4 \key bes \major \clef G
    \context Voice = VA { \voiceOne \melone }
    \context Voice = VB { \voiceTwo \meltwo }>>
  \context Staff = "down" <<
    \time 4/4 \key bes \major \clef F \melthree>>
>>
}
