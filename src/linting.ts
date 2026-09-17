import { Diagnostic, linter } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { ChordProParser } from '@chordproject/parser';
import { findChordNotationReplacements } from './chordNotation';

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

/**
 * Surfaces parser warnings next to the ChordPro source line. The client can still
 * render its translated warning summary, while CodeMirror provides local feedback.
 */
export const parserWarningLinter = linter((view: EditorView): Diagnostic[] => {
	const parser = new ChordProParser();
	parser.parse(view.state.doc.toString());

	return parser.warnings.flatMap((warning): Diagnostic[] => {
		if (warning.lineNumber < 1 || warning.lineNumber > view.state.doc.lines) {
			return [];
		}
		const line = view.state.doc.line(warning.lineNumber);
		return [{
			from: line.from,
			to: line.to,
			severity: 'warning',
			message: warning.message,
		}];
	});
});

/** Suggests explicit, canonical ChordPro suffixes without changing valid input automatically. */
export const chordNotationLinter = linter((view: EditorView): Diagnostic[] => {
	const diagnostics: Diagnostic[] = [];
	for (const replacement of findChordNotationReplacements(view.state.doc.toString())) {
		diagnostics.push({
			from: replacement.from,
			to: replacement.to,
			severity: 'info',
			message: `Usa "${replacement.replacement}". ${replacement.reason}`,
			actions: [{
				name: `Reemplazar por ${replacement.replacement}`,
				apply: (targetView, actionFrom, actionTo) => {
					targetView.dispatch({ changes: { from: actionFrom, to: actionTo, insert: `[${replacement.replacement}]` } });
				},
			}],
		});
	}

	return diagnostics;
});
