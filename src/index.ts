import { Compartment, EditorState, Extension } from '@codemirror/state';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { chordProAutocomplete, insertChord, openCompletionList } from './autocomplete';
import { basicSetup } from './extensions';
import { chordProFolding } from './folding';
import { chordPro } from './language';
import { duplicateDirectiveLinter } from './linting';
import { themeExtension, ThemeName } from './themes';

export type { ThemeName } from './themes';

export interface ChordProEditorOptions {
	/** Element that will contain the editor. */
	parent: HTMLElement;
	/** Initial document content. */
	doc?: string;
	/** Initial theme. Defaults to 'light'. */
	theme?: ThemeName;
	/** Extra CodeMirror extensions to append (escape hatch for advanced use cases). */
	extensions?: Extension[];
	onChange?: (value: string) => void;
	onFocus?: () => void;
	onBlur?: () => void;
}

export interface ChordProEditor {
	/** Underlying CodeMirror view, for advanced use cases not covered by this API. */
	readonly view: EditorView;
	getValue(): string;
	setValue(value: string): void;
	setTheme(theme: ThemeName): void;
	/** Inserts "[]" at the cursor (or wraps the selection) and opens chord suggestions. */
	insertChord(): void;
	/** Opens the completion list (chords or snippets) without needing a keyboard shortcut. */
	openCompletionList(): void;
	focus(): void;
	destroy(): void;
}

/**
 * Creates a standalone ChordPro editor instance. Unlike the previous Ace-based
 * implementation, multiple independent instances can coexist on the same page.
 */
export function createChordProEditor(options: ChordProEditorOptions): ChordProEditor {
	const themeCompartment = new Compartment();

	const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
		if (update.docChanged) {
			options.onChange?.(update.state.doc.toString());
		}
		if (update.focusChanged) {
			(update.view.hasFocus ? options.onFocus : options.onBlur)?.();
		}
	});

	const state = EditorState.create({
		doc: options.doc ?? '',
		extensions: [
			basicSetup(),
			chordPro(),
			chordProFolding,
			duplicateDirectiveLinter,
			chordProAutocomplete(),
			themeCompartment.of(themeExtension(options.theme ?? 'light')),
			updateListener,
			...(options.extensions ?? []),
		],
	});

	const view = new EditorView({ state, parent: options.parent });

	return {
		view,
		getValue: () => view.state.doc.toString(),
		setValue: (value: string) => {
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: value },
			});
		},
		setTheme: (theme: ThemeName) => {
			view.dispatch({ effects: themeCompartment.reconfigure(themeExtension(theme)) });
		},
		insertChord: () => {
			insertChord(view);
		},
		openCompletionList: () => {
			openCompletionList(view);
		},
		focus: () => view.focus(),
		destroy: () => view.destroy(),
	};
}

