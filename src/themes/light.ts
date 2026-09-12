import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Colors mirror chordproject-client's actual design tokens (src/styles/components/editor.css,
// .ace-clouds rules) via CSS custom properties, so the editor matches the live app's light theme
// instead of a generic hardcoded palette. Fallback values only apply outside that app (e.g. this
// package's standalone demo), approximating Tailwind's zinc/blue/red scales.
const editorTheme = EditorView.theme(
	{
		'&': {
			backgroundColor: 'var(--color-white, #ffffff)',
			color: 'var(--color-neutral-950, #09090b)',
		},
		'.cm-content': {
			caretColor: 'var(--color-neutral-950, #09090b)',
		},
		'.cm-cursor, .cm-dropCursor': {
			borderLeftColor: 'var(--color-neutral-950, #09090b)',
		},
		'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
			backgroundColor: 'var(--color-primary-100, #dbeafe)',
		},
		'.cm-activeLine': {
			backgroundColor: 'var(--color-neutral-100, #f4f4f5)',
		},
		'.cm-gutters': {
			backgroundColor: 'var(--color-neutral-50, #fafafa)',
			color: 'var(--color-neutral-500, #71717a)',
			border: 'none',
		},
		'.cm-activeLineGutter': {
			backgroundColor: 'var(--color-neutral-100, #f4f4f5)',
		},
	},
	{ dark: false }
);

const highlightStyle = HighlightStyle.define([
	{ tag: t.keyword, color: 'var(--color-error-600, #dc2626)' },
	{ tag: [t.meta, t.attributeName], color: 'var(--color-primary-600, #2563eb)' },
	{ tag: [t.constant(t.name), t.character, t.number], color: 'var(--color-neutral-600, #52525b)' },
	{ tag: t.invalid, color: 'var(--color-error-700, #b91c1c)', backgroundColor: 'var(--color-error-100, #fee2e2)' },
	{ tag: t.string, color: 'var(--color-neutral-700, #3f3f46)' },
	{ tag: [t.comment, t.lineComment], fontStyle: 'italic', color: '#4d9f68' },
	{ tag: t.heading, color: 'var(--color-primary-600, #2563eb)' },
]);

export const lightTheme = [editorTheme, syntaxHighlighting(highlightStyle)];

