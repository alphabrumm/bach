% Goldberg-Variationen, Variatio 2, BWV 988 – Mutopia, JD Erickson, CC BY-SA 3.0
staffUpper = {\change Staff = upper \stemDown}
staffLower = {\change Staff = lower \stemUp}

soprano = \relative c''' {
    \override Script #'padding = #1.0
    \repeat volta 2 {
        a2\rest
        a2\rest
        g4 c4^~\prallmordent
        c8 b16 a16 b16 a16 g16 fis16
        g4^~ g16 f16 e16 d16
        e4^~ e16 d16 c16 b16
        a4^~ a16 c16 b16 a16
        b16 g'16 fis16 a16 g16 fis16 e16 d16
        c'8^( b8) b4\rest
        r2
        b,16^( dis16 e16 g16) b4^~
        b16 a16 g16 b16 a16 g16 fis16 e16
        d4^~ d16 c16 b16 a16
        b4^~ b16 a16 g16 fis16
        e4^~ e16 g16 fis16 e16
    }
        \alternative { { d8 d'8\rest d4\rest } { d,4 d'4\rest } }
    \repeat volta 2 {
        \stemUp a4 a'4^~
        a16 g16 fis16 a16 g16 fis16 e16 dis16
        e4 a8\rest fis8
        dis8 b8 d4\rest
        e4^~ e16 d16 c16 b16
        c4^~ c16 b16 a16 g16
        fis4^~ fis16 a16 g16 fis16
        g4 f'4\rest
        e,4 a4^~
        a16 g16 fis16 a16 g16 fis16 e16 d16
        c4 c'4^~
        c16 b16 a16 c16 b16 a16 g16 fis16
        b8[ g8] b8[ d8]
        g4 c4^~
        c16 b16 a16 c16 b16 a16 g16 fis16
    }
        \alternative { { g4 f4\rest } { g4 f4\rest } }
}

alto = \relative c'' {
        \override Script #'padding = #1.0
        \repeat volta 2 {
        \stemDown b4 e4^~^\prallmordent
        e8 d16 c16 d16 c16 b16 a16
        g4 b8\rest a'8
        fis8 d8 b4\rest
        b16\rest d16[ c16 e16] d8 b8_~
        b16 a16 g16 b16 a8 g8_~
        g16 fis16 e16 g16 fis4
        g8 e8\rest e4\rest
        g16^( a16 b16 d16) e4^~
        e16 d16 cis16 e16 d16 cis16 b16 a16
        g4 b8\rest g'8
        e8 cis8 b4\rest
        e,16\rest a16[ g16 b16] a8 fis8_~
        fis16 e16 d16 fis16 e8 d8_~
        d16 cis16 b16 d16 cis4
        }
        \alternative { { d8 e8\rest e4\rest } { d4 e4\rest } }
        \repeat volta 2 {
        \stemDown c16\rest fis'16[ e16 g16] fis16 e16 d16 cis16
        d4 b8\rest b8
        g8 e8 a4_~
        a16 g16 fis16 a16 g16 fis16 e16 dis!16
        e16 b'16 a16 c16 b8 g8_~
        g16 fis16 e16 g16 fis8 e8_~
        e16 dis16 cis16 e16 dis4
        e4 b'4_~
        b16 a16 g16 b16 a16 g16 fis16 e16
        d4
        g4_~
        g16 fis16 e16 g16 fis16 e16 d16 c16
        d4 c4\rest
        d'4 f4_~
        f16 e16 d16 f16 e16 g16 fis16 g16
        a8 d,8_~ d16 c16 b16 a16
        }
        \alternative { { b4 g4\rest } { b4 g4\rest } }
}

bass = \relative c' {
    \repeat volta 2 {
        \stemDown g8[ fis8 g8 e8]
        fis8[ e8 fis8 d8]
        e8[ d8 e8 c8]
        \stemUp d8 d,8 d'16 c16 b16 a16
        b8[ a8 b8 g8]
        c8[ b8 c8 a8]
        d8[ c8 d8 d,8]
        g8[ \stemDown g'8 b8 d8]
        g8[ fis8 g8 e8]
        fis8[ e8 fis8 d8]
        e8[ d!8 e8 b8]
        cis8[ e16 d16] cis16 b16 a16 g16
        fis8[ e8 fis8 d8]
        g8[ fis8 g8 e8]
        a8[ g8 a8 a,8]
    }
        \alternative { { d8[ d'16 c!16] d16 c16 b16 a16 } { \stemUp d,8 a8 d,4 } }
        \repeat volta 2 {
        \stemDown d''8[ cis8 d8 a8]
        b8[ a8 b8 g8]
        c16 c,16 b16 d16 \stemUp c16 b16 a16 c16
        \stemDown b16 b'16 a16 c16 b16 a16 g16 fis16
        g8[ fis8 g8 e8]
        a8[ g8 a8 fis8]
        b8[ ais8 b8 b,8]
        \stemUp e,16 e'16 dis16 fis16 e16 d16 c16 b16
        \stemDown c8[ b8 c8 a'8]
        b,8[ a8 b8 g'8]
        a,8[ g8 a8 g'8]
        fis16 d16 c16 e16 \stemUp d16 c16 b16 a16
        \stemDown g16 g'16 f16 a16 g16 f16 e16 d16
        c16 c'16 b16 d16 c16 b16 a16 g16
        fis16 g16 fis16 a16 \stemUp b,8 d8
    }
        \alternative { { \stemDown g,8[ g'16 fis16] g16 a16 b16 c16 } { \stemDown g8 d8 \stemUp g,4 } }
}

\score  {
    \context PianoStaff <<
        \context Staff = "upper" { \clef treble \key g \major \time 2/4 << \soprano \\ \alto >>  }
        \context Staff = "lower"  { \clef bass \key g \major \time 2/4 \bass }
    >>
}
