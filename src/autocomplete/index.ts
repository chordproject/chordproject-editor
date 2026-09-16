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

function chordProCompletionSource(context: CompletionContext) {
	const chordCompletions = chordCompletionSource(context);
	if (chordCompletions) return chordCompletions;

	// Directive names overlap ordinary lyrics (for example, "t" suggests "title"). Keep
	// snippets behind the explicit toolbar command instead of interrupting normal writing.
	return context.explicit ? completeSnippets(context) : null;
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
