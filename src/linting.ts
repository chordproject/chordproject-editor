import { Diagnostic, linter } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';

// Directives chordproject-parser treats as singular (last one wins silently, see
// ChordProParser.parseMetadataTag - title/subtitle/key/capo/duration/tempo/time/year/copyright
// are plain assignments). album/artist/composer/arranger/lyricist are intentionally cumulative
// (a song can have multiple artists) and are NOT included here.
const SINGULAR_DIRECTIVES: Record<string, string> = {
	title: 'title',
	t: 'title',
	subtitle: 'subtitle',
	st: 'subtitle',
	year: 'year',
	copyright: 'copyright',
	key: 'key',
	capo: 'capo',
	duration: 'duration',
	tempo: 'tempo',
	time: 'time',
};

const DIRECTIVE_LINE = /^\s*\{\s*([A-Za-z_][\w]*)\b/;

/**
 * Warns (without blocking anything) when a "singular" directive like {title:} or {key:}
 * appears more than once - the parser silently keeps only the last one, which is easy to miss
 * if you e.g. paste a full song under some test content that already had its own {title:}.
 */
export const duplicateDirectiveLinter = linter((view: EditorView): Diagnostic[] => {
	const diagnostics: Diagnostic[] = [];
	const firstSeenAtLine = new Map<string, number>();

	for (let lineNumber = 1; lineNumber <= view.state.doc.lines; lineNumber++) {
		const line = view.state.doc.line(lineNumber);
		const match = line.text.match(DIRECTIVE_LINE);
		if (!match) continue;

		const canonical = SINGULAR_DIRECTIVES[match[1].toLowerCase()];
		if (!canonical) continue;

		const firstLine = firstSeenAtLine.get(canonical);
		if (firstLine === undefined) {
			firstSeenAtLine.set(canonical, lineNumber);
			continue;
		}

		diagnostics.push({
			from: line.from,
			to: line.from + match[0].length,
			severity: 'warning',
			message: `"${canonical}" ya se definió en la línea ${firstLine}; este valor la reemplaza.`,
		});
	}

	return diagnostics;
});
