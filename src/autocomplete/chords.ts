import { syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { CHORD_VOCABULARY } from './chordVocabulary';

/** Counts how many times each chord already appears in the document, keyed by chord text. */
function countUsedChords(state: EditorState): Map<string, number> {
	const counts = new Map<string, number>();
	syntaxTree(state).iterate({
		enter(node) {
			if (node.name !== 'chord') return;
			const text = state.doc.sliceString(node.from, node.to);
			counts.set(text, (counts.get(text) ?? 0) + 1);
		},
	});
	return counts;
}

/**
 * Inserts the chosen chord and moves the cursor past the closing "]" (added by closeBrackets
 * when "[" was typed, or added here if missing) so typing continues in the lyric, not trapped
 * back inside the brackets.
 */
function applyChord(view: EditorView, completion: Completion, from: number, to: number): void {
	const insert = completion.label;
	const hasClosingBracket = view.state.sliceDoc(to, to + 1) === ']';
	const cursor = from + insert.length + 1;
	view.dispatch({
		changes: hasClosingBracket ? { from, to, insert } : { from, to, insert: `${insert}]` },
		selection: { anchor: cursor },
	});
}

function buildOptions(used: Map<string, number>): Completion[] {
	const options = new Map<string, Completion>();
	// Chords already used in this song are boosted so they float to the top of the list -
	// they're the ones you're most likely to want again in the same song.
	for (const [chord, count] of used) {
		options.set(chord, { label: chord, type: 'chord', boost: 100 + count, apply: applyChord });
	}
	for (const chord of CHORD_VOCABULARY) {
		if (!options.has(chord)) options.set(chord, { label: chord, type: 'chord', apply: applyChord });
	}
	return [...options.values()];
}

/**
 * Suggests chords while typing inside "[...]". Unlike the legacy Ace chordFinder (which only
 * knew about chords already used in the song, so a brand new song had nothing to suggest), this
 * always offers the full common chord vocabulary too - useful from the very first chord.
 */
export function chordCompletionSource(context: CompletionContext): CompletionResult | null {
	const match = context.matchBefore(/\[[^\]\n]*/);
	if (!match || (match.from === match.to && !context.explicit)) return null;

	return {
		from: match.from + 1,
		options: buildOptions(countUsedChords(context.state)),
		validFor: /^[^\]\n]*$/,
	};
}
