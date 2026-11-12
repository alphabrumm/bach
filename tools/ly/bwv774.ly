% Invention 3, BWV 774 – Mutopia, CC BY-SA 3.0
#(ly:set-option 'old-relative)
voiceone =  \relative c' {
  \key d \major
  \partial 8
  \time 3/8
   d16[ e] |
   fis16[ e( g fis e  d)] |
   a'[ g( fis e fis  d)] |
   a'8[ b cis16\mordent d] |
   cis8[\prall \grace { b } a cis16 d] |
   e[-. cis( fis d cis  b)] |
   e[ cis( d b a  gis)] |
   e'[ cis( fis d cis  b)] |
   e[ cis( d b a  gis)] |
   cis[ b( d cis b  a)] |
   fis'8[ gis, a] ~ |
   a16[\turn b]  b8.[ a16] |
  a4 r8 |
  r e' a ~ |
   a16[ b,( cis dis e  fis)] |
   g[ fis( a g fis  e)] |
   b'8[ b,] r |
  r  fis[ b] ~ |
   b16[ ais b cis d e] |
   fis[ e( g fis e  d)] |
   e[ d( fis e d  cis)] |
   d[ cis( e d cis  b)] |
  \stemDown  cis8[ ais\downprall b] ~ \stemNeutral |
   b16[ cis]  cis8.[\prall b16] ~ |
   b16[ fis( gis ais b  cis)] |
   d[( cis e d cis  b)] |
  g'4. ~ |
  g4. ~ |
   g16[ e,( fis gis a  b)] |
   cis[ b( d cis b  a)] |
  fis'4. ~ |
  fis ~ |
   fis16[ b,( e d cis  b)] |
   cis[-. b( d cis b  a)] |
   gis8[\prall e a16 b] |
   cis[ b( d cis b  a)] |
   fis'8.[ gis,16 a gis] |
   a[ d b8. a16] |
   a8.[ cis16 d e] |
   fis,8[ g a\turn] |
   b[ cis\turn d] ~ |
   d16[ cis( e d cis  d)] |
   e[( d cis b a  g)] |
   fis[ e( g fis e  d)] |
   a'[( g fis e fis  d)] |
   a'8[ b cis16\mordent d] |
   cis8[ a d] |
   d[ d, d'] |
   d[ d, d'] |
   d[ d, d'] |
   d[ d, d'16 e] |
   fis[-. e( g fis e  d)] |
   b'8[ cis, d] ~ |
   d16[\turn e]  e8.[ d16] |
   d8[ d, g] ~ |
   g16[ a,( b cis d  e)] |
   fis[ e( g fis e  d)] |
   b'8.[ cis,16 d cis] |
   d[ g]  e8.[ d16] |
  d4.\fermata \bar "|."
}

voicetwo =  \relative c {
  \key d \major
  \time 3/8
  \clef "bass"
  \partial 8
  r8 |
  r r r |
  r r  d16[ e] |
   fis[ e( g fis e  d)] |
   a'[ g( fis e fis  d)] |
   a'8[ a, a'] |
   a[ a, a'] |
   a[ a, a'] |
   a[ a, a'] |
   a[ b cis] |
   d16[ cis( e d cis  b)] |
   cis[ d e8 e,] |
   a16[ e( fis gis a  b)] |
   cis[ b( d cis b  a)] |
   e'8[ e,] r |
  r  b'[ e] ~ |
   e16[ fis, gis ais b cis] |
   d[ cis e d cis b] |
   fis'8[ fis, \clef "treble" e']
   d[ b'16 ais b8] |
   cis,[ ais'16 gis ais8] |
   b16[ a!( g! fis e  d)] |
   e[ d( fis e d  cis)] |
   d[ e fis8 fis,] \clef "bass" |
   b[ fis d] |
  b4 r8 |
  r16  b[( cis dis e  fis)] |
   g[ fis( a g fis  e)] |
  a4. ~ |
  a ~ |
   a16[ a,( b cis d  e)] |
   fis[( e g fis e  d) ] |
   gis8.[ e16 fis gis] |
   a[ gis( fis e d  fis)] |
   e[ d( cis b cis  a)] |
   a'8[ fis cis] |
   d16[ cis( e d cis  b)] |
   cis[ d e8 e,] |
   a16[ cis( d e fis  g)] |
   a[ g( b a g  fis)] |
   g[ fis( a g fis  e)] |
   fis[ e( g fis e  d)] |
   a'8[ a,] r |
  r r r |
  r r  d16[ e] |
   fis[ e( g fis e  d)] |
   a'[ g( fis e fis  d)] |
   a'[ fis( b g fis  e)] |
   a[ fis( g e d  cis)] |
   a'[ fis( b g fis  e)] |
   a[ fis( g e d  cis)] |
   d8[ e fis] |
   g16[ fis( a g fis  e)] |
   fis[ g a8 a,] |
   b16[ a( c b a  g)] |
  d'4. ~ |
   d16[ cis( b a g  fis)] |
   g[ fis( a g fis  e)] |
   fis[ g] a4 |
  d,4.\fermata \bar "|."
}

\score {
   \context GrandStaff <<
    \context Staff = "one" << \voiceone >>
    \context Staff = "two" << \voicetwo >>
  >>
}
