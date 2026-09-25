import { Diagnostic, linter } from '@codemirror/lint';
import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { ChordProParser } from '@chordproject/parser';
import { findChordNotationReplacements } from './chordNotation';

export interface LintLabels {
	duplicateDirective: (directive: string, firstLine: number) => string;
	parserWarning: (warning: { code: string; message: string; params: Record<string, string> }) => string;
	sectionMessage: (endDirective: string) => string;
	sectionAction: (endDirective: string) => string;
	chordNotationMessage: (replacement: string, reason: string) => string;
	chordNotationAction: (replacement: string) => string;
}

export const defaultLintLabels: LintLabels = {
	duplicateDirective: (directive, firstLine) => `"${directive}" was already defined on line ${firstLine}; this value replaces it.`,
	parserWarning: (warning) => warning.message,
	sectionMessage: (endDirective) => `This section must be closed with {${endDirective}}.`,
	sectionAction: (endDirective) => `Insert {${endDirective}}`,
	chordNotationMessage: (replacement, reason) => `Use "${replacement}". ${reason}`,
	chordNotationAction: (replacement) => `Replace with ${replacement}`,
};

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
const SECTION_STARTS: Record<string, string> = {
	start_of_chorus: 'end_of_chorus',
	soc: 'end_of_chorus',
	chorus: 'end_of_chorus',
	start_of_verse: 'end_of_verse',
	sov: 'end_of_verse',
	start_of_bridge: 'end_of_bridge',
	sob: 'end_of_bridge',
	start_of_tab: 'end_of_tab',
	sot: 'end_of_tab',
};
const SECTION_ENDS = new Set(['end_of_chorus', 'eoc', 'end_of_verse', 'eov', 'end_of_bridge', 'eob', 'end_of_tab', 'eot']);

/**
 * Warns (without blocking anything) when a "singular" directive like {title:} or {key:}
 * appears more than once - the parser silently keeps only the last one, which is easy to miss
 * if you e.g. paste a full song under some test content that already had its own {title:}.
 */
export function createLintExtensions(getLabels: () => LintLabels = () => defaultLintLabels): Extension[] {
	const duplicateDirectiveLinter = linter((view: EditorView): Diagnostic[] => {
	const diagnostics: Diagnostic[] = [];
	const firstSeenAtLine = new Map<string, number>();
	const labels = getLabels();

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
			message: labels.duplicateDirective(canonical, firstLine),
		});
	}

	return diagnostics;
});

/**
 * Surfaces parser warnings next to the ChordPro source line. The client can still
 * render its translated warning summary, while CodeMirror provides local feedback.
 */
const parserWarningLinter = linter((view: EditorView): Diagnostic[] => {
	const parser = new ChordProParser();
	parser.parse(view.state.doc.toString());
	const labels = getLabels();

	return parser.warnings.flatMap((warning): Diagnostic[] => {
		if (warning.code === 'empty_sheet') {
			return [];
		}
		if (warning.lineNumber < 1 || warning.lineNumber > view.state.doc.lines) {
			return [];
		}
		const line = view.state.doc.line(warning.lineNumber);
		return [{
			from: line.from,
			to: line.to,
			severity: 'warning',
			message: labels.parserWarning(warning),
		}];
	});
}, { delay: 0 });

/** Offers a one-click closing directive for sections left open while drafting. */
const unclosedSectionLinter = linter((view: EditorView): Diagnostic[] => {
	const diagnostics: Diagnostic[] = [];
	let openSection: { endDirective: string; lineFrom: number; lineTo: number; insertionAt: number; insertionTo: number } | null = null;
	let sectionHasContent = false;

	for (let lineNumber = 1; lineNumber <= view.state.doc.lines; lineNumber++) {
		const line = view.state.doc.line(lineNumber);
		const match = line.text.match(DIRECTIVE_LINE);
		const directive = match?.[1].toLowerCase();

		if (directive && SECTION_STARTS[directive]) {
			if (openSection) {
				openSection.insertionAt = line.from;
				openSection.insertionTo = line.from;
				diagnostics.push(sectionDiagnostic(openSection, getLabels()));
			}
			openSection = {
				endDirective: SECTION_STARTS[directive],
				lineFrom: line.from,
				lineTo: line.to,
				insertionAt: line.from,
				insertionTo: line.from,
			};
			sectionHasContent = false;
			continue;
		}

		if (directive && SECTION_ENDS.has(directive)) {
			openSection = null;
			sectionHasContent = false;
			continue;
		}

		if (openSection && directive) {
			openSection.insertionAt = line.from;
			openSection.insertionTo = line.from;
			diagnostics.push(sectionDiagnostic(openSection, getLabels()));
			openSection = null;
			sectionHasContent = false;
			continue;
		}

		if (openSection && !line.text.trim()) {
			const nextDirective = nextNonBlankDirective(view, lineNumber);
			if (sectionHasContent) {
				openSection.insertionAt = line.from;
				openSection.insertionTo = nextDirective
					? nextNonBlankDirectiveLine(view, lineNumber)
					: line.from;
				diagnostics.push(sectionDiagnostic(openSection, getLabels()));
				openSection = null;
				sectionHasContent = false;
			}
			continue;
		}

		if (openSection && lineNumber === view.state.doc.lines) {
			openSection.insertionAt = view.state.doc.length;
			openSection.insertionTo = view.state.doc.length;
		}

		if (openSection) {
			sectionHasContent = true;
		}
	}


function nextNonBlankDirective(view: EditorView, lineNumber: number): string | null {
	const directiveLine = nextNonBlankDirectiveLine(view, lineNumber);
	return directiveLine < view.state.doc.length
		? view.state.doc.lineAt(directiveLine).text.match(DIRECTIVE_LINE)?.[1].toLowerCase() ?? null
		: null;
}

function nextNonBlankDirectiveLine(view: EditorView, lineNumber: number): number {
	for (let nextLineNumber = lineNumber + 1; nextLineNumber <= view.state.doc.lines; nextLineNumber++) {
		const nextLine = view.state.doc.line(nextLineNumber);
		if (!nextLine.text.trim()) {
			continue;
		}
		if (nextLine.text.match(DIRECTIVE_LINE)) {
			return nextLine.from;
		}
		return view.state.doc.length;
	}
	return view.state.doc.length;
}
	if (openSection) {
		diagnostics.push(sectionDiagnostic(openSection, getLabels()));
	}

	return diagnostics;
}, { delay: 0 });

function sectionDiagnostic(section: { endDirective: string; lineFrom: number; lineTo: number; insertionAt: number; insertionTo: number }, labels: LintLabels): Diagnostic {
	return {
		from: section.lineFrom,
		to: section.lineTo,
		severity: 'warning',
		message: labels.sectionMessage(section.endDirective),
		actions: [{
			name: labels.sectionAction(section.endDirective),
			apply: (view, from, to) => {
				const previousCharacter = section.insertionAt > 0
					? view.state.doc.sliceString(section.insertionAt - 1, section.insertionAt)
					: '';
				const needsLeadingNewline = previousCharacter !== '\n';
				const insertion = `${needsLeadingNewline ? '\n' : ''}{${section.endDirective}}${section.insertionTo < view.state.doc.length ? '\n' : ''}`;
				view.dispatch({ changes: { from: section.insertionAt, to: section.insertionTo, insert: insertion } });
			},
		}],
	};
}

/** Suggests explicit, canonical ChordPro suffixes without changing valid input automatically. */
const chordNotationLinter = linter((view: EditorView): Diagnostic[] => {
	const diagnostics: Diagnostic[] = [];
	const labels = getLabels();
	for (const replacement of findChordNotationReplacements(view.state.doc.toString())) {
		diagnostics.push({
			from: replacement.from,
			to: replacement.to,
			severity: 'info',
			message: labels.chordNotationMessage(replacement.replacement, replacement.reason),
			actions: [{
				name: labels.chordNotationAction(replacement.replacement),
				apply: (targetView, actionFrom, actionTo) => {
					targetView.dispatch({ changes: { from: actionFrom, to: actionTo, insert: `[${replacement.replacement}]` } });
				},
			}],
		});
	}

	return diagnostics;
});

	return [duplicateDirectiveLinter, parserWarningLinter, unclosedSectionLinter, chordNotationLinter];
}
