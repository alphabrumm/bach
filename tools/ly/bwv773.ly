% Invention 2, BWV 773 – Mutopia, CC BY-SA 3.0
voiceone =  \relative c'' {
  \key c \minor
  r8  c16[ b]  c[ d ees g,]  aes[ bes aes f]  f'[ es d c] |
   b[ aes' g f]  ees[ d c b]  c[ d c d]  d8.[\downprall c32 d] |
   ees16[ d c d]  ees[ f g8]  g[\prall f] r f |
   f[\prall ees] r d  ees[ aes,] ~  aes16[ f bes f] |
   g8[ ees'] ~  ees16[ d ees bes]  c[ ees aes g]  f[ ees d c] |
   bes[ d g f]  ees[ d c bes]  aes[ c f c]  d8.[\prall  d16] |
   ees[ bes c bes] g'4 ~  g16[ bes, c bes] aes'4 ~ |
   aes16[ bes, ees d]  g[(  f) aes g]  c[ bes aes g]  f[ bes aes bes] |
   g[ bes aes bes]  ees,[ g f g]  c,[ d ees f]  d[ ees f g] |
   ees[ f g aes]  bes[ aes c bes]  aes[ g f aes] d,4 ~ |
   d16[ d g d]  ees[ c d bes] c4 ~  c16[ g' fis a]  |
   c,[ bes c8] ~  c16[ fis e d]  bes'8.[ e,16]  fis8.[ g16] |
   g8[ g,16 fis]  g[ a bes d,]  ees[ f ees c]  c'[ bes a g] |
   fis[ ees' d c]  bes[ a g fis]  g[ a g a]  a8.[\downprall g32 a] |
   bes16[ a g a]  bes[ c d8]  d[\prall c] r c |
   c[\prall bes] r a  bes[ ees,] ~  ees16[ c f c] |
   d8[ bes'] ~  bes16[ a bes f]  g[ bes ees d]  c[ bes a g] |
   f[ a d c]  bes[ a g f]  ees[ g c g]  a8.[\prall a16] |
   bes[ f g f] d'4 ~  d16[ f, g f] ees'4 ~ |
   ees16[ f, bes a]  d[ c ees d]  g[ f ees d]  c[ f ees f] |
   d[ c bes a]  d[ c ees d]  c[ bes a c] f4 ~ |
   f16[ g, c b]  ees[ d f ees]  aes[ g f ees]  d[ g f g] |
   ees[ d c b]  c[ d ees g,]  aes[ bes aes f]  f'[ ees d c] |
   b[ aes' g f]  ees[ d c b]  c[ d c d]  d8.[\downprall c32 d] |
   ees16[ d c d]  ees[ f g8]  g[\prall f] r f |
   f[\prall ees16 d]  g[ f aes g]  g8.[ aes16]  d,8.[\prall c16] |
  c1^\fermata \bar "|."
}

voicetwo =  \relative c' {
  \key c \minor
  \clef "bass"
  R1 |
  R1 \clef "treble" |
  r8  c16[ b]  c[ d ees g,]  aes[ bes aes f]  f'[ ees d c] |
   b[ aes' g f]  ees[ d c b]  c[ d c d]  d8.[\downprall c32 d] |
   ees16[ d c d]  ees[ f g8]  g[\prall f] r f |
   f[\prall ees] r d  ees[ aes,] ~  aes16[ f bes f] |
   g8[ ees'] ~  ees16[ d ees bes]  c[ ees aes g]  f[ ees d c] |
   bes[ d g f]  ees[ d c bes]  aes[ c f c]  d8.[\prall d16] |
   ees[ bes c bes] g'4 ~  g16[ bes, c bes] aes'4 ~ |
   aes16[ bes, ees d]  g[ f aes g]  c[ bes aes g]  f[ bes aes bes]|
   g8[ \clef bass ees,16 f]  g[ a bes d,]  ees[ f ees c]  c'[ bes a g] |
   fis[ ees' d c]  bes[ a g fis]  g[ a g a]  a8.[\downprall g32 a]|
   bes16[ a g a]  bes[ c d8]  d[\prall c] r c |
   c[\prall bes] r a  bes[ ees,] ~  ees16[ c f! c] |
   d8[ bes'] ~  bes16[ a bes f]  g[ bes ees d]  c[ bes a g] |
   f[ a d c]  bes[ a g f]  ees[ g c g]  a8.[\prall a16] |
   bes[ f g f] d'4 ~  d16[ f, g f] ees'4 ~ |
   ees16[ f, bes a]  d[ c ees d]  g[ f ees d]  c[ f ees f] |
   d[ f ees f]  bes,[ d c d]  g,[ a bes c]  a[ bes c d] |
   bes[ c d ees]  f[ ees g f]  ees[ d c ees] a,4 ~ |
   a16[ d, g fis]  bes[ a c bes]  ees[ d c bes]  a[ d c d] |
   b[ f' ees d]  c[ bes aes! g]  f[ ees d c]  g'8[ g,] |
   c8.[ d16]  ees[ f g8]  g[\prall f] r f |
   f[\prall ees] ~  ees16[ f ees d]  c[ bes aes g]  f[ ees f g] |
   c,8[ c'16 b]  c[ d ees g,]  aes[ bes! aes f]  f'[ ees d c] |
   b[ aes' g f]  ees[ d c b]  c[ g aes f]  g8[ g] |
  c,1_\fermata \bar "|."
}

\score {
  \context GrandStaff <<
    \context Staff = "one" << \voiceone >>
    \context Staff = "two" << \voicetwo >>
  >>
}
