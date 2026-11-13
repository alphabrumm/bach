% Goldberg-Variationen, Aria da capo (= Aria), BWV 988 – Notentext nach Mutopia (JD Erickson, CC BY-SA 3.0);
% Verzierungen und Vorschläge an die vom Nutzer gewünschte Ausgabe angepasst
staffUpper = {\change Staff = upper \stemDown}
staffLower = {\change Staff = lower \stemUp}

soprano = \relative c'' {
    \override Staff.NoteCollision #'merge-differently-dotted = ##t
    \override Script #'padding = #1.0
    \repeat volta 2 {
        \stemDown g'4 g4( a8.\prall) b16
        a8 \appoggiatura g8 fis8 \appoggiatura e8 d2
        \stemUp g,4\prall g4.\downprall fis16 g16
        a32[( g32 fis16) g32( fis32 e16)] \appoggiatura e8 d2
        \stemDown d'4 d4( e8.\prall) f16
        e8 \appoggiatura d8 c8 \appoggiatura b8 \stemUp a4. \stemDown fis'8\turn
        \stemDown g32[( fis16.) a32( g16.)] fis32[( e16.) d32( c16.)] \once \override Slur #'direction = #UP \appoggiatura c8 a'8. c,16
        \stemUp b32[( g16.) fis8] \appoggiatura fis8 g2\prall
        b4 b4( cis8.\prall) d16
        d16 cis16 b16 a16_~ \stemDown a2 \stemUp
        <g b e g>4\arpeggio \stemDown g'4.\downprall fis16 g16
        \override NoteColumn #'ignore-collision = ##t
        g8 \appoggiatura fis8 e8 \once \override Stem #'length-fraction = #(magstep -6) cis4.\lineprall e8
        a16( g16 fis16 e16) d8 \stemUp a4_~ a32 b32 c16
        b16( a16 g16 fis16) e8 \appoggiatura d'8 cis4_~ cis32 d32 e16
        d16^( cis16 b16 a16) g'8 b,4 cis8
        \appoggiatura cis8 d8^~[ d32 e32 d32 cis32] \appoggiatura cis8 d2
    }
    \repeat volta 2 {
        a4\prall a4_~\downprall a16[ a32( b32 c32 d32 e16)]
        \appoggiatura e8 d8 \appoggiatura c8 b8 \appoggiatura a8 g4. g'8
        \appoggiatura fis8 e8. fis32 dis32 \appoggiatura dis8 e4.\prall a32 b32 a32 g32
        \appoggiatura g8 a8. fis16 \appoggiatura e8 dis4. b8
        \stemDown g'8. \prallup fis16 \appoggiatura fis8 e4^~ e16[ b16 c32( b32 a32 b32)]
        g'32[( e16.) fis32( dis16.)] \appoggiatura dis8 e4^~ \stemUp e16 g,16 fis16 e16
        fis8. e'16 \appoggiatura e16 dis8 a'8 \prallup g8 fis8
        \appoggiatura fis8 e8. fis32 dis32 \appoggiatura dis8 e2
        \stemDown e8 \appoggiatura d8 c8 \appoggiatura b8 a4. b16[ c16]
        d32[( c32 b16) c32( b32 a16)] \appoggiatura a8 \stemUp g4. a16 b16
        c16 d16 c16 b16 c16 a16 e16 a16 c4^~
        c16 d16 c16 b16 c16 a16 fis16 a16 c16 e16 d16 c16
        b16 c16 b16 a16 b16 g16 d16 g16 b16 g16 c16 d16
        e16 f16 e16 d16 e16 c16 g16 c16 e16 c16 fis16 g16
        a16 c,16 b16 a16 b16 c16 d16 g,16 b16 a16 g16 fis16
        g4^~ g16 d16 g16 fis16 \appoggiatura fis8 g4\fermata
    }
}

bassOne = \relative c' {
    \stemDown g2.
    fis2.
    e2.
    d2_~ d8 c8
    b2.
    c2_~ c8 d8
    e8 c8 d2
    g,4. d'8[ e8.\prall fis16]
    g2._~
    g4 fis8\prallprall e8 fis8 b8
    e,4. e8 fis8 g8
    a4. b8 a8 g8
    fis2.
    g2.
    a2.
    d,2.
    d'2 c4
    b4. a8 b4
    c4. b8 a4
    b4. a8 g8 fis8
    e2 d4
    c2 b4
    a8 c8 b8 a8 b4
    e8 b8 e,8 b'8 e8 d8
    c2.
    b2.
    a4. g8 fis8 e8
    \stemUp d8 a'8 d8 c8 b8 a8
    \stemDown g8 d'8 g8 f8 e8 d8
    c8 g'8 c8 b8 a8 g8
    fis8 d8 g8 b8 d8 d,8
    g4. d8 \stemUp \once \override Script #'padding = #.8 g,4_\fermata
}

bassTwo = \relative c' {
    \override Script #'padding = #1.0
    \stemDown f4\rest b,2
    f'4\rest a,2
    f'4\rest g,2
    f'4\rest \stemUp fis,2
    f'4\rest d,2
    s4 e4. s8
    f'8\rest c8^~ c8[ b16 a16] g16 fis16 e16 fis16
    g8 a8 b2
    s4 b2
    a4 \staffUpper \stemUp d'2 \staffLower
    f,8\rest b,8 e4. d8
    cis8 d8 \staffUpper e2 \staffLower
    f4\rest a,2
    f'4\rest b,4 \staffUpper e4
    fis4 e8. fis16 g4_~
    g4 fis2
    \staffLower a8\rest e8 \once \override Stem #'length-fraction = #(magstep -2) fis2^\prall
    f8\rest c8 d2
    f8\rest e8 g4 fis8^\prall e8
    dis8 e8 \staffUpper fis2
    \staffLower f8\rest a,8 g8^\prall fis8 g4
    f'8\rest a,8 g8^\prall fis8 g8 b8
    \staffUpper fis'4. c'8 b8 a8_~
    a4 g2
    \staffLower s4 e,2
    \skip 2.
    \skip 4. \staffUpper e'8_~ e16 b'16 a16 g16
    fis4 r8 fis4.
    g8 r8 r8 d8. g8._~
    g4 r8 g8. c8.
    \skip 2.
    c,16\rest c16 b16 a16 b2
}

bassThree = \relative c' {
    \stemUp s4 f4\rest d4
    s4 f4\rest d4
    s4 f4\rest cis4
    s4 f4\rest a,4
    s4 f'4\rest g,4
    f'4\rest f4\rest a,4
    \skip 2.
    \skip 2.
    f'4\rest f4\rest \staffUpper e4
    \staffLower \skip 2.
    \skip 2.
    \skip 2.
    f4\rest f4\rest d4
    \skip 2.
    \skip 2.
    f4\rest f8\rest a,8 d4
    \skip 2.
    \skip 2.
    \skip 2.
    \skip 2.
    \skip 2.
    \skip 2.
    r4 r4 r8 dis,8
    e4 \skip 2
    f'4\rest f4\rest a,4^~
    a8 fis8 \once \override Slur #'direction = #DOWN \appoggiatura e16 d8[ e16 fis16] g16[ fis16 g8]^~
    g8[ e8] a8 a8\rest a4\rest
}

\score {
    \context PianoStaff <<
        \context Staff = "upper" { \clef treble \key g \major \time 3/4 << \soprano >>  }
        \context Staff = "lower"  { \clef bass \key g \major \time 3/4 << \bassOne \\ \bassTwo \\ \bassThree >> }
    >>
}
