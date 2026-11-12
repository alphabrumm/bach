% Goldberg-Variationen, Variatio 1, BWV 988 – Mutopia, JD Erickson, CC BY-SA 3.0
staffUpper = {\change Staff = upper \stemDown}
staffLower = {\change Staff = lower \stemUp}

soprano = \relative c'' {
    \override Script #'padding = #1.0
    \repeat volta 2 {
        \stemUp g16 fis16 g8_~ g16 d16 e16 fis16 g16 a16 b16 cis16
        \stemDown d16 cis16 d8^~ d16 a16 b16 cis16 d16 e16 fis16 d16
        g16 fis16 g8^~ g16 fis16 e16 d16 \stemUp cis16 e16 a,16 g16
        fis16 e16 d16 cis16 \adjustBeamOne d16 fis16 \staffLower \stemExtend \noFlag a,16 \stemExtend \noFlag g16 \adjustBeamTwo fis16 a16 d,8
        \staffUpper \stemUp b''8\rest d16[ c16 d8 g,8 b,8 d'8]
        b8\rest e16[ d16 e8 a,8 c,8 e'8]
        \stemDown b8\rest fis'16[ e16 fis8 d8 a'8 c,8^~]
        c8 b8 b16\rest g16 b16 d16 g16 d16 g16 a16
        b16 g16 d16 b16 g16 b16 d16 g16 b16 g16 fis16 e16
        a16 e16 cis16 a16 fis16 a16 cis16 e16 a16 fis16 e16 d16
        g16 d16 b16 g16 e16 g16 b16 d16 g16 fis16 e16 d16
        \stemUp cis16 g16 e16 cis16 a16 cis16 e16 g16 \stemDown cis16 e16 d16 cis16
        d8 \clef "bass" fis,,8 fis8 \clef "treble"  a'8 d8 fis8
        b,8 \clef "bass"  g,8 g8 \clef "treble" b'8 e8 g8
        cis,16 e16 a,16 g16 fis16 a16 d16 fis16 g16 e16 d16 cis16
        fis16 d16 cis16 b16 \stemUp a16 g16 fis16 e16 \staffLower d4
    }
    \repeat volta 2 {
        \staffUpper fis'16 g16 a8^~ a16 b16 a16 g16 fis16 e16 d16 c16
        b16 c16 d8^~ d16 e16 d16 c16 \stemUp b16 a16 g16 fis16
        e16 gis16 a16 b16 a16 e16 a16 b16 c16 a16 dis16 e16
        fis16 e16 dis16 cis16 b2^~
        b16 dis16 e8^~ e16 dis,16 e8_~ e16 \staffLower \stemExtend \noFlag dis,16 \stemExtend \noFlag e8
        \staffUpper \stemUp a''16\rest gis16 a8^~ a16 gis,16 a8_~ a16 \staffLower \stemExtend \noFlag gis,16 \stemExtend \noFlag a8^~
        \stemExtend \noFlag \adjustBeamFour a16 \staffUpper \stemUp b16 c16 fis16 b,16 dis16 e16 g16 fis16 e16 dis16 a'16
        g16 fis16 e16 dis16 \stemDown e16 g16 \staffLower \stemExtend \noFlag b,16 \stemExtend \noFlag a16 g16 b16 e,8
        \staffUpper \stemDown b''8\rest e8 c8 e8 a8 a,8
        b8\rest d8 b8 d8 g8 g,8
        \stemUp c16 a16 e16 c16 a16 c16 e16 a16 \stemDown c16 a16 c16 e16
        fis16 c16 a16 fis16 \stemUp d16 fis16 a16 c16 \stemDown fis16 c16 fis16 a16
        b16 g16 d16 b16 g16 b16 d16 g16 b16 f16 b16 d16
        e,16 d'16 c16 e,16 d16 c'16 b16 d,16 c16 e16 fis16 g16
        a16 c,16 b16 a16 \stemUp b16 d16 b16 g16 c16 a16 g16 fis16
        b16 g16 fis16 e16 d16 c16 b16 a16 g4\fermata
    }
}

bass = \relative c {
        \override Script #'padding = #1.0
        \stemUp g8[ b'16 a16 b8 g8 g,8 g'8]
        fis,8[ fis'16 e16 fis8 d8 fis,8 d'8]
        e,8[ e'16 d16 e8 g8 a,8 cis'8]
        \stemDown d,8[ fis16 e16 fis8 d8] d,8 e16\rest c'!16
        \stemUp b16 a16 b8_~ b16 d16 e16 fis16 \stemDown g16 a16 b16 g16
        \stemUp c,16 b16 c8_~ \stemDown c16 e16 fis16 g16 a16 b16 c16 a16
        \stemUp d,16 cis16 d8_~ \stemDown d16 a'16 b16 c!16 d16 e16 fis16 d16
        g16 fis16 g16 d16 b16 d16 g,16 b16 d,16 g16 b,16 d16
        \stemUp \flatBeam g,8[ \stemDown g'8 b8 g8 \stemUp g,8 \stemDown g'8]
        \stemUp \flatBeamTwo fis,8[ \stemDown fis'8 a8 fis8 \stemUp fis,8 \stemDown fis'8]
        \stemUp \flatBeamThree e,8[ \stemDown e'8 g8 e8 \stemUp e,8 \stemDown g'8]
        a,8 e'8 g8 e8 a,8 g'8
        fis16 a16 d16 fis16 a16 fis16 d16 a16 fis16 a16 d,16 fis16
        g16 b16 d16 g16 b16 g16 d16 b16 g16 b16 e,16 g16
        a8[ cis8] d16[ a16 fis16 d16] a'8[ a,8]
        \stemUp d,16 d'16 e16 fis16 \stemDown g16 a16 b16 cis16 d4
        \stemUp d,,8[ fis'16 e16 fis8 d8 d,8 fis'8]
        g,8[ b'16 a16 b8 g8 g,8 b'8]
        \stemDown c,8[ c'16 b16 c8 fis,8 a8 c8]
        a8 fis8 dis16 b16 dis16 fis16 \adjustBeamThree b16 \staffUpper \stemExtend \noFlag dis16 \stemExtend \noFlag fis16 \stemExtend \noFlag a16
        g8. fis16 g8.[ \staffLower \stemUp fis,16] \stemDown g8. b,16
        \stemUp c8.[ \staffUpper \stemDown b''16] c8.[ \staffLower \stemUp b,16] \stemDown c8. e,16
        dis8[ a'8 g8 ais,8 b8 fis'8]
        e8[ g16 fis16 g8 e8] e,8 g16\rest d'16
        c16 e16 a16 c16 e16 c16 a16 e16 c16 e16 d16 c16
        b16 d16 g16 b16 d16 b16 g16 d16 \stemUp b16 d16 c16 b16
        \stemDown a8[ c8 e8 g8 fis8 e8]
        d8[ fis8 a8 c8 b8 a8]
        g8[ b8 d8 f8 e8 d8]
        c8[ e8 fis!8 gis8 a8 g8]
        fis8[ d8 g8  g,8 d'8 d,8]
        \stemUp g16 g,16 a16 b16 \stemDown c16 d16 e16 fis16 g4_\fermata
}

\score {
    \context PianoStaff <<
        \context Staff = "upper" { \clef treble \key g \major \time 3/4 \soprano }
        \context Staff = "lower"  { \clef bass \key g \major \time 3/4 \bass }
    >>
}
