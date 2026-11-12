% Sinfonia 9, BWV 795 – Mutopia, Olivier Vermersch
su = { \change Staff = up}
sd = { \change Staff = down}

melone =  \relative c'' {
  R1 |
  \once \override MultiMeasureRest #'staff-position = #8 R1 |
  r8 c ees d r d f e |
  r8 f b c ~ c bes16 aes g8 f |
  ees g aes g f4 ~ f16 ges e f |
  e4 r16 c' f, ees des4 ~ des16 g! c, bes |
  aes4 f' e ees |
  d des c8 f4 e8 |
  f ees!4 des16 c des4 d |
  ees8 ees ces' bes r bes, fes' ees ~ |
  ees16 bes c aes f8 d'16 ees32 f f16 d ees8 r ees16 c |
  a g aes8 r bes16 c32 des! c8. bes16 g4\prall |
  aes8 ees ges f d'\rest f, aes! g |
  d'\rest aes d  ees ~ ees d16 c bes8 aes |
  g bes des! c r c ees d |
  r d f e ~ e c f4 |
  e g f aes! |
  g c, b bes |
  a aes g8[ c] ~ c[ b!] |
  c bes!4 aes16 g aes4 a |
  bes8 bes ges' f r \once \override NoteColumn #'force-hshift = #0.5 f, ces' bes ~ |
  bes aes4 ges16 f ges4 g |
  aes8 aes fes' ees r ees, beses' aes ~ |
  aes aes des4 c ces |
  bes beses aes8 des4 c8 |
  des aes ces bes r bes des! c |
  r des g aes ~ aes g16 f ees8 des |
  c4 ees d f |
  ees ges f8 bes, des c |
  r c ees d r d f e ~ |
  e f, aes g r g bes a |
  r bes e f ~ f ees16 des c8 bes |
  aes4 r8 \std bes16 c32 des des16 b c8 r c'16 a |
  ges e f8 \stb d\rest g,!16 aes32 bes aes8. g16 e8. f16 |
  f1\fermata \bar "|."
}

meltwo =  \relative c' {
  r8 f^( aes g^) r g^( bes a^) |
  bes8\rest bes e f^~ f ees16 des c8 bes |
  aes4 c b bes |
  a aes g8 c4 b8 |
  c4 r8 c des c bes4 ~ |
  bes16 c a bes a4 bes16 ges e f e4 |
  f4 r8 bes16 c32 des des16 b c8 r c16 a |
  ges e f8 r g!16 aes32 bes aes8. bes16 aes8 g |
  f c ges' f r f ces' bes ~ |
  bes aes4 ges16 f ges4 g |
  aes8 aes, c bes r bes des! c |
  r des g aes ~ aes g16 f ees8 des |
  c4 ees d des |
  c ces bes8[ ees] ~ ees[ d] |
  ees4 bes' a c |
  bes des c8 f, aes g |
  r g bes a r a c b |
  r c, ees d r d f e |
  r f b c ~ c bes16 aes g8 f |
  ees4 e f8 ees4 d16 c |
  d8 g a4 bes8 aes4 g!16 f |
  g8 f16 ees d4 ees8 des4 c!16 bes |
  c8 f g4 aes8 \once \override NoteColumn #'force-hshift = #-0.5 ges4 f!16 ees |
  f4 r8 g!16 aes32 bes bes16 g aes8 r aes16 f |
  d16 c des8 r ees16 f32 ges f8. ges16 f8 ees |
  des4 aes' g! ges |
  f fes ees8[ aes] ~ aes[ g] |
  aes ees ges f r f aes g |
  r g bes a ~ a f bes4 |
  a c bes des |
  c f, e ees |
  d des c8 f4 e8 |
  f \sd \stu f, aes g r g bes a |
  r bes \su \std e f ~ f ees16 des c8 bes |
  a1 \bar "|."
}

melthree =  \relative c, {
  f4 f' e ees |
  d des c8 bes c c, |
  f4 r8 f'16 (g32 aes) aes16 fis g8 r g'16 e |
  des! b c8 r d16 ees32 f ees8 f g g, |
  c4 r r2 |
  R1 |
  r8 f, aes g r g bes a |
  r bes e f ~ f ees16 des c8 bes |
  aes4 a bes8 aes4 g!16 f |
  g8 c d4 ees8 des4 c!16 bes |
  c4 aes g ges |
  f fes ees8 des ees ees, |
  aes4 r8 a'16 bes32 c c16 a bes8 r bes16 g |
  e16 d ees8 r f16 g32 aes g8[ aes] bes[ bes,] |
  ees4 r8 ees ges f r f |
  aes g! r g bes aes r bes |
  des, c r c' ees,! d r d' |
  f, ees r f,16 g32 aes aes16 fis g8 r g'16 e |
  des! b c8 r d16 ees32 f ees8 f g g, |
  c c, des'! c r c ges' f ~ |
  f ees4 des!16 c des4 d |
  ees8 bes ces' bes r bes, fes' ees ~ |
  ees des4 ces16 bes ces4 c |
  des8 des f ees r ees ges f |
  r ges c des~ des c16 bes aes8 ges |
  f4 r8 d16 ees32 f f16 d ees8 r ees16 c |
  a g aes8 r bes'16 c32 des c8 des ees ees, |
  aes4 r8 aes ces bes r bes |
  des c! r c ees des r ees |
  ges, f r f' aes,! g r g' |
  bes, aes r bes16 c32 des des16 b c8 r c16 a |
  ges e f8 r g!16 aes32 bes aes8 bes c c, |
  \std f,4 \stb f' e ees |
  d des c8 bes c c, |
  \once \override Script #'padding = #1.5
  f1_\fermata \bar "|."
}

\score {
\context PianoStaff
<<
  \context Staff = "up"   <<
    \time 4/4 \key f \minor \clef G
    \context Voice = VA { \voiceOne \melone }
    \context Voice = VB { \voiceTwo \meltwo }
  >>
  \context Staff = "down" <<
    \time 4/4 \key f \minor \clef F \melthree
  >>
>>
}
