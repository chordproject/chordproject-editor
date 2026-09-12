import { EditorView } from '@codemirror/view';

// Layout-only rules shared by every theme, so the editor fills its container.
export const baseTheme = EditorView.baseTheme({
	'&': {
		height: '100%',
	},
	'.cm-scroller': {
		flex: '1',
		overflow: 'auto',
	},
});
