// Common chord roots (both sharp and flat spellings, since musicians use either)
// and a practical subset of the official ChordPro extension list:
// https://www.chordpro.org/chordpro/chordpro-chords/#appendix-list-of-known-chord-extensions
// We don't enumerate every possible extension (the spec's list is huge) - just the ones
// musicians actually reach for often, so the dropdown stays useful instead of overwhelming.
const ROOTS = ['A', 'A#', 'Bb', 'B', 'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab'];

const QUALITIES = ['', 'm', '7', 'm7', 'maj7', 'sus2', 'sus4', '6', 'm6', '9', 'add9', 'dim', 'dim7', 'aug', 'm7b5'];

/** Every root+quality combination, e.g. "C", "Cm", "Cmaj7", "C#sus4", ... */
export const CHORD_VOCABULARY: readonly string[] = ROOTS.flatMap((root) => QUALITIES.map((quality) => root + quality));
