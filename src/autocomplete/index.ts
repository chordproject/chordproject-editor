import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
	CompletionContext,
	autocompletion,
	completeFromList,
	startCompletion,
} from '@codemirror/autocomplete';
import { chordCompletionSource } from './chords';
import { CHORDPRO_SNIPPETS } from './snippets';

const completeSnippets = completeFromList(CHORDPRO_SNIPPETS);
const QUICK_SNIPPET_PREFIXES = new Set(
	CHORDPRO_SNIPPETS
		.map((snippet) => snippet.label)
		.filter((label) => label.length <= 3 && /^[a-z]+$/i.test(label))
);

function chordProCompletionSource(context: CompletionContext) {
	const chordCompletions = chordCompletionSource(context);
	if (chordCompletions) return chordCompletions;

	const word = context.matchBefore(/[a-z]+$/i);
	const isQuickSnippet = word && QUICK_SNIPPET_PREFIXES.has(word.text.toLowerCase());

	// Only the documented short prefixes open automatically. Full directive names remain behind
	// the explicit toolbar command so ordinary lyrics are never interrupted by suggestions.
	return context.explicit || isQuickSnippet ? completeSnippets(context) : null;
}

/** Chord suggestions inside "[...]", plus explicitly requested directive snippets. */
export function chordProAutocomplete(): Extension {
	return autocompletion({ override: [chordProCompletionSource], activateOnTyping: true });
}

/**
 * Opens the completion list (chords or directive snippets, depending on cursor position) without
 * requiring a keyboard shortcut. On Mac, every Ctrl/Option+key combo risks colliding with system
 * shortcuts or accent dead-keys (especially on Spanish/Latin American layouts) - a button click
 * sidesteps that entirely, and works the same on mobile where there's no keyboard shortcut at all.
 */
export function openCompletionList(view: EditorView): boolean {
	view.focus();
	return startCompletion(view);
}

/**
 * Inserts "[]" at the cursor (or wraps the current selection, e.g. "Am" -> "[Am]") and opens
 * the chord completion list. Meant for a toolbar button / shortcut so reaching for the "["
 * key isn't required - most useful on mobile and on a brand new, chord-less song.
 */
export function insertChord(view: EditorView): boolean {
	const range = view.state.selection.main;
	const selected = view.state.sliceDoc(range.from, range.to);
	view.dispatch({
		changes: { from: range.from, to: range.to, insert: `[${selected}]` },
		selection: { anchor: range.from + 1 + selected.length },
	});
	view.focus();
	startCompletion(view);
	return true;
}
