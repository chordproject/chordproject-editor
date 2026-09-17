import { EditorState, Extension } from '@codemirror/state';
import {
	EditorView,
	keymap,
	inputHandler,
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

// Keymaps do not receive every international keyboard or touch text-input event. Intercept the
// actual insertion too, so any typed "[" always becomes a complete ChordPro token.
const chordBracketInputHandler = EditorView.inputHandler.of((view, from, to, text) => {
	if (text !== '[') return false;

	const selected = view.state.sliceDoc(from, to);
	view.dispatch({
		changes: { from, to, insert: `[${selected}]` },
		selection: { anchor: from + 1 + selected.length },
	});
	startCompletion(view);
	return true;
});

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
		chordBracketInputHandler,
		EditorState.allowMultipleSelections.of(true),
		keymap.of([
			// Insert a complete ChordPro token before opening suggestions so an unfinished "["
			// is never momentarily interpreted as invalid song content.
			{ key: '[', run: insertChord },
			...closeBracketsKeymap,
			...defaultKeymap,
			...historyKeymap,
			...foldKeymap,
			...lintKeymap,
			// Override completionKeymap's Ctrl-Space/Option-`/Option-i (same keys, listed first so
			// they take precedence) to be chord-aware instead of plain startCompletion.
			{ key: 'Ctrl-Space', run: chordAwareCompletion },
			{ mac: 'Cmd-Shift-Space', run: chordAwareCompletion },
			{ mac: 'Alt-`', run: chordAwareCompletion },
			{ mac: 'Alt-i', run: chordAwareCompletion },
			...completionKeymap,
			// Tab accepts a completion/snippet field when the popup is open.
			{
				key: 'Tab',
				preventDefault: true,
				run: (view) => (completionStatus(view.state) ? acceptCompletion(view) : false),
			},
		]),
	];
}
