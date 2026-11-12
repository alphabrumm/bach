% Invention 13, BWV 784 – Mutopia, CC BY-SA 3.0
voiceone =  \relative c' {
   \key a \minor
   r16  e[ a c]  b[ e, b' d]  c8[ e gis, e'] |
   a,16[ e a c]  b[ e, b' d]  c8[ a] r4 |
   r16  e'16[ c e]  a,[ c e, g]  f8[ a d f] ~ |
   f16[ d b d]  g,[ b d, f]  e8[ g c e] ~ |
   e16[ c a c]  f,8[ d'] ~  d16[ b g b]  e,8[ c'] ~ |
   c16[ a f a]  d,8[ b'] c r r4 |
   r16  g[ c e]  d[ g, d' f]  e8[ g b, g'] |
   c,16[ g c e]  d[ g, d' f]  e8[ c g' e] |
   c'16[ a e a]  c,[ e a, c]  d8[ fis a c] |
   b16[ g d g]  b,[ d g, b]  c8[ e g b] |
   a16[ fis dis fis]  b,[ dis fis, a]  g8[ g'] ~  g16[ e c e] |
   a,8[ fis'] ~  fis16[ d b d]  g,8[ e'] ~  e16[ c a c] |
   fis,16[ g' fis e]  dis[ fis b, dis] e8 r r4 |
   r16  g[ bes g]  e[ g cis, e]  g[ e cis e] a, r r8 |
   r16  f'[ a f]  d[ f b, d]  f[ d b d] g, r r8 |
   r16  e'[ g e]  c[ e a, c]  dis[ c a c] fis, r r8 |
   r16  d'[ f d]  b[ d gis, b]  d[ b gis b] e, r r8 |
   r16  e[ a c]  b[ e, b' d]  c8[ a gis e] |
   a16[ c e c]  a[ c fis, a]  c[ a fis a]  dis,[ c' b a] |
   gis[ b d b]  gis[ b d, f]  gis[ f d f]  b,[ f' e d] |
   c[ e a e]  c[ e a, c]  dis[ c a c]  fis,[ c' b a] |
   gis8[ b' gis e] r16  e[ a c]  b[ e, b' d]  |
   c[ a c e]  d[ b d f]  e[ c e g]  f[ e d c] |
   b[ c d e]  f[ d gis d]  b'[ d, c a']  f[ d b d] |
   gis,[ b c a]  e[ a b gis]  a[ e c e] a,4^\fermata \bar "|."
}

voicetwo =  \relative c {
   \key a \minor
   \clef "bass"
   a8 a'4 gis8  a16[ e a c]  b[ e, b' d] |
   c8[ a gis e]  a16[ e a c]  b[ e, b' d] |
   c8[ a c a]  d16[ a f a]  d,[ f a, c] |
   b8[ d g b] ~  b16[ g e g]  c,[ e g, b] |
   a8[ c]  d16[ f b, d]  g,8[ b]  c16[ e a, c] |
   f,8[ d]  g16[ g' f g]  c,[ g' c e]  d[ g, d' f] |
   e8[ c b g]  c16[ g c e]  d[ g, d' f] |
   e8[ c] r4 r16  g'[ e g]  c,[ e g, b] |
   a8[ c e g]  fis16[ a d, fis]  a,[ d fis, a] |
   g8[ b d fis]  e16[ g c, e]  g,[ c e, g] |
   fis8[ a b dis] r16  e[ c e]  a,[ c e g] |
   fis[ d b d]  g,[ b d fis]  e[ c a c]  fis,[ a c8] ~ |
   c16[ b c a]  b8[ b,]  e16[ e' b g]  e[ b g b] |
   e,8[ e' g bes] cis,8 r r16  g''[ f e] |
   d8[ d, f aes] b, r r16  f''[ e d] |
   c8[ c, e fis] a, r r16  e''[ dis cis] |
   b8[ b, d f] gis, r r16  d''[ c b] |
   c8[ a gis e]  a16[ e a c]  b[ e, b' d] |
   c[ e a e]  c[ e a, c]  fis,[ a c a]  fis[ a dis, fis] |
   e8[ gis b gis]  e[ b gis e] |
   a[ c e c]  a[ c] dis, r |
   r16  b''[ gis e]  d[ b' gis d]  c8[ e gis, e'] |
   a,[ fis' b, gis']  c,[ a' d, bes'] |
   gis[ f d b]  gis[ a d, e] |
   f[ dis e e'] a,2^\fermata \bar "|."
}

\score {
   \context GrandStaff <<
    \context Staff = "one" << \voiceone >>
    \context Staff = "two" << \voicetwo >>
  >>
}
