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
	'.cm-lintRange-info': {
		backgroundImage: 'url("data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3"><path d="m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0" stroke="%23dc2626" fill="none" stroke-width="1"/></svg>") !important',
	},
	'.cm-lintRange-warning': {
		backgroundImage: 'url("data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3"><path d="m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0" stroke="%23d97706" fill="none" stroke-width="1"/></svg>") !important',
	},
	'.cm-lintRange-error': {
		backgroundImage: 'url("data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3"><path d="m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0" stroke="%23dc2626" fill="none" stroke-width="1"/></svg>") !important',
	},
});
