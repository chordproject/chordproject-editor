import { EditorState, Extension } from '@codemirror/state';
import {
	EditorView,
	keymap,
	highlightActiveLine,
	highlightSpecialChars,
	drawSelection,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { lintGutter, lintKeymap } from '@codemirror/lint';
import {
	acceptCompletion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
	completionStatus,
	startCompletion,
} from '@codemirror/autocomplete';
import { insertChord } from './autocomplete';

// True when the cursor sits right after an unclosed "[" on the current line.
function isInsideChordBrackets(view: EditorView): boolean {
	const pos = view.state.selection.main.head;
	const line = view.state.doc.lineAt(pos);
	return /\[[^\]]*$/.test(line.text.slice(0, pos - line.from));
}

// Ctrl-Space (and its Mac alternates) should suggest chords wherever the cursor is, not only
// right after typing "[" - so if we're not already inside brackets, insert them first.
function chordAwareCompletion(view: EditorView): boolean {
	return isInsideChordBrackets(view) ? startCompletion(view) : insertChord(view);
}

// Editing behavior shared by every instance.
export function basicSetup(): Extension[] {
	return [
		foldGutter(),
		lintGutter(),
		highlightSpecialChars(),
		highlightActiveLine(),
		history(),
		drawSelection(),
		bracketMatching(),
		closeBrackets(),
		EditorState.allowMultipleSelections.of(true),
		keymap.of([
			...closeBracketsKeymap,
			...defaultKeymap,
			...historyKeymap,
			...foldKeymap,
			...lintKeymap,
			// Override completionKeymap's Ctrl-Space/Option-`/Option-i (same keys, listed first so
			// they take precedence) to be chord-aware instead of plain startCompletion.
			{ key: 'Ctrl-Space', run: chordAwareCompletion },
			{ mac: 'Alt-`', run: chordAwareCompletion },
			{ mac: 'Alt-i', run: chordAwareCompletion },
			...completionKeymap,
			// Tab accepts a completion/snippet field when the popup is open, same as the
			// legacy Ace editor's snippet behavior.
			{
				key: 'Tab',
				preventDefault: true,
				run: (view) => (completionStatus(view.state) ? acceptCompletion(view) : false),
			},
		]),
	];
}
