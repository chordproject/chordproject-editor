import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { CHORD_VOCABULARY } from './chordVocabulary';

const CHORD_TOKEN = /\[([A-G](?:#|b)?(?:min|mi|m(?!aj)|-)?[^\]\s-]*(?:\/[A-G](?:#|b)?)?)\]/g;
const FREQUENCY_BOOST = 100;
const TRANSITION_BOOST = 1_000;
const PATTERN_BOOST = 10_000;

interface ChordOccurrence {
	name: string;
	from: number;
}

/** Counts how many times each chord already appears in the document, keyed by chord text. */
function countUsedChords(state: EditorState): Map<string, number> {
	const counts = new Map<string, number>();
	for (const { name: chord } of getChordOccurrences(state.doc.toString())) {
		counts.set(chord, (counts.get(chord) ?? 0) + 1);
	}
	return counts;
}

function getChordOccurrences(content: string): ChordOccurrence[] {
	return [...content.matchAll(CHORD_TOKEN)].flatMap((match) => {
		return match.index === undefined ? [] : [{ name: match[1], from: match.index }];
	});
}

/**
 * Scores chords that previously followed the same local progression. Matching the last two
 * chords is stronger than matching only the immediately preceding chord, which is stronger than
 * simple usage frequency.
 */
export function getChordCompletionPriorities(content: string, cursor: number): Map<string, number> {
	const history = getChordOccurrences(content)
		.filter((occurrence) => occurrence.from < cursor - 1)
		.map((occurrence) => occurrence.name);
	const priorities = new Map<string, number>();

	for (let index = 0; index < history.length; index++) {
		const candidate = history[index];
		if (index > 0 && history[index - 1] === history.at(-1)) {
			priorities.set(candidate, (priorities.get(candidate) ?? 0) + TRANSITION_BOOST);
		}
		if (
			index > 1 &&
			history[index - 2] === history.at(-2) &&
			history[index - 1] === history.at(-1)
		) {
			priorities.set(candidate, (priorities.get(candidate) ?? 0) + PATTERN_BOOST);
		}
	}

	return priorities;
}

/**
 * Inserts the chosen chord and moves the cursor past the closing "]" (already created when
 * opening the ChordPro token, or added here if missing) so typing continues in the lyric, not
 * trapped back inside the brackets.
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

function buildOptions(used: Map<string, number>, priorities: Map<string, number>): Completion[] {
	const options = new Map<string, Completion>();
	// Chords already used in this song are boosted so they float to the top of the list -
	// they're the ones you're most likely to want again in the same song.
	const rankedUsedChords = [...used.entries()].sort(([leftChord, leftCount], [rightChord, rightCount]) => {
		const priorityDifference = (priorities.get(rightChord) ?? 0) - (priorities.get(leftChord) ?? 0);
		return priorityDifference || rightCount - leftCount || leftChord.localeCompare(rightChord);
	});
	for (const [chord, count] of rankedUsedChords) {
		options.set(chord, {
			label: chord,
			type: 'chord-used',
			boost: FREQUENCY_BOOST + count + (priorities.get(chord) ?? 0),
			apply: applyChord,
		});
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
		options: buildOptions(
			countUsedChords(context.state),
			getChordCompletionPriorities(context.state.doc.toString(), match.from + 1)
		),
		validFor: /^[^\]\n]*$/,
	};
}
