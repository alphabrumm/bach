% Invention 10, BWV 781 – Mutopia, CC BY-SA 3.0
voiceone =  \relative c'' {
  \key g \major
  \time 9/8
  g8[ b d]  b[ g d']  b[ g g'] |
  fis4\prall d8  a'[ fis d]  a'[ fis d] |
  g[ d b]  f'[ d b]  f'[ d b] |
  e[ c a]  fis[ a c]  e[ d c] |
  d[ b g]  e[ g b]  d[ c b] |
  c[ a fis]  d[ fis a]  c[ b a] |
  b[\mordent c d]  e[ b g']  e[ b g'] |
  a,[ b cis]  d[ a fis']  d[ a fis'] |
  g,4.\mordent ~  g8[ a g]  fis[ g e] |
  fis[ g fis]  e[ fis d]  a'[ b c] |
  b[\mordent c b]  a[ b g]  e'[ fis g] |
  cis,[\mordent d cis]  b[ cis a]  g'[ a b] |
  a[ g fis]  e[ fis d]  a[ d cis] |
  d4.\mordent r4. r4. |
  a8[ cis e]  cis[ a e']  cis[ a g'] |
  fis4.\prall d r |
  g,8[ b d]  b[ g d']  b[ g f'] |
  e[ c a]  a'[ e c]  a[ b c] |
  d[ b g]  g'[ d b]  g[ a b] |
  c2.\prall ~ c4. ~|
  c2. ~ c4. |
  \tieUp b2.\prall ~ b4. ~ |
  b2. ~ b4. ~ |
  b8[ e d]  c[ d b]  a[ b g] |
  a[ c b]  a[ b g]  fis[ g e] |
  fis4\prall d8 a'4\mordent fis8 d'4\mordent fis,8 |
  g8[ b d]  b[ g d']  b[ g g'] |
  d[ fis a]  fis[ d a']  fis[ d c'] |
  b[ a g]  fis[ g a]  d,[ g fis] |
  g[ fis e]  d[ c b]  a[ b c] |
  b[ a g]  fis[ g a]  d,[ g fis] |
  g[ d b] g4. r \bar "|."
}

voicetwo =  \relative c {
  \key g \major
  \time 9/8
  \clef "bass"
  r2. r4. |
  d8[ fis a]  fis[ d a']  fis[ d c'] |
  b4\prall g8  d'[ b g]  d'[ b g] |
  c[ e c]  a[ c a]  fis[ g a] |
  b[ d b]  g[ b g]  e[ fis g] |
  a[ c a]  fis[ a fis]  d[ e fis] |
  g4.\mordent ~  g8[ fis e]  d[ e cis] |
  fis4.\mordent ~  fis8[ e d]  cis[ d b] |
  e[ fis g]  a[ e cis']  a[ e cis'] |
  d4.\mordent ~  d8[ d, e]  fis[ e d] |
  g4.\mordent ~  g8[ e fis]  g[ fis e] |
  a4.\mordent ~  a8[ g fis]  e[ d cis] |
  d[ e fis]  g[ a b] a4 a,8 |
  d[ fis a]  fis[ d a']  fis[ d d'] |
  cis4.\prall a r |
  d,8[ fis a]  fis[ d a']  fis[ d c'] |
  b4.\prall g r |
  c,\mordent ~  c8[ d e]  fis,[ g a] |
  b4.\mordent ~  b8[ c d]  e,[ fis g] |
  a[ c e]  a[ e c]  a[ b c] |
  d[ fis a]  d[ a fis]  d[ e fis] |
  g[ b d]  g[ d b]  g[ a b] |
  e,[ g b]  e[ b g]  e[ fis g] |
  c,2.\prall ~ c4. ~ |
  c2. ~ c4. ~ |
  c8[ d fis]  a[ fis d]  c[ b a] |
  b[ g b]  d[ b g]  d'[ b g] |
  fis[ d fis]  a[ fis d]  a'[ fis d] |
  g[ a b]  a[ b c]  b[ c d] |
  e,4. ~ e4 e'8  fis[ e d] |
  g4\mordent b,8  e[ d c] d4\mordent d,8 |
  g4. ~  g8[ b d] g4.  \bar "|."
}

\score {
   \context GrandStaff <<
    \context Staff = "one" << \voiceone >>
    \context Staff = "two" << \voicetwo >>
  >>
}
