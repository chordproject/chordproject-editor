import { LanguageSupport } from '@codemirror/language';
import { chordProLanguage } from './chordproStream';

export { chordProLanguage } from './chordproStream';

/** ChordPro language support: highlights directives, chords, comments and tab blocks. */
export function chordPro(): LanguageSupport {
	return new LanguageSupport(chordProLanguage);
}
