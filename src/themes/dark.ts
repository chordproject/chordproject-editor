import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Colors mirror chordproject-client's actual design tokens (src/styles/components/editor.css,
// .ace-cobalt rules) via CSS custom properties, so the editor matches the live app's dark theme
// instead of a generic hardcoded palette. Fallback values only apply outside that app (e.g. this
// package's standalone demo), approximating Tailwind's zinc/blue/red scales.
const editorTheme = EditorView.theme(
	{
		'&': {
			backgroundColor: 'var(--color-neutral-900, #18181b)',
			color: 'var(--color-neutral-100, #f4f4f5)',
		},
		'.cm-content': {
			caretColor: 'var(--color-neutral-100, #f4f4f5)',
		},
		'.cm-cursor, .cm-dropCursor': {
			borderLeftColor: 'var(--color-neutral-100, #f4f4f5)',
		},
		'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
			backgroundColor: 'color-mix(in oklch, var(--color-primary-600, #2563eb) 35%, transparent)',
		},
		'.cm-activeLine': {
			backgroundColor: 'var(--color-neutral-800, #27272a)',
		},
		'.cm-gutters': {
			backgroundColor: 'var(--color-neutral-900, #18181b)',
			color: 'var(--color-neutral-400, #a1a1aa)',
			border: 'none',
		},
		'.cm-activeLineGutter': {
			backgroundColor: 'var(--color-neutral-800, #27272a)',
		},
	},
	{ dark: true }
);

const highlightStyle = HighlightStyle.define([
	{ tag: t.keyword, color: 'var(--color-error-400, #f87171)' },
	{ tag: [t.meta, t.attributeName], color: 'var(--color-primary-300, #93c5fd)' },
	{ tag: [t.constant(t.name), t.character, t.number], color: 'var(--color-neutral-400, #a1a1aa)' },
	{ tag: t.invalid, color: 'var(--color-error-200, #fecaca)', backgroundColor: 'color-mix(in oklch, var(--color-error-600, #dc2626) 30%, transparent)' },
	{ tag: t.string, color: 'var(--color-neutral-300, #d4d4d8)' },
	{ tag: [t.comment, t.lineComment], fontStyle: 'italic', color: '#79c98d' },
	{ tag: t.heading, color: 'var(--color-primary-300, #93c5fd)' },
]);

export const darkTheme = [editorTheme, syntaxHighlighting(highlightStyle)];

