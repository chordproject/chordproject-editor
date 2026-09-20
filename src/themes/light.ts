import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Colors mirror chordproject-client's actual design tokens via CSS custom properties, so the
// editor matches the live app's light theme
// instead of a generic hardcoded palette. Fallback values only apply outside that app (e.g. this
// package's standalone demo), approximating Tailwind's zinc/blue/red scales.
const editorTheme = EditorView.theme(
	{
		'&': {
			backgroundColor: 'var(--color-white, #ffffff)',
			color: 'var(--color-neutral-950, #09090b)',
		},
		'.cm-content': {
			textDecoration: 'none',
			caretColor: 'var(--color-neutral-950, #09090b)',
		},
		'.cm-cursor, .cm-dropCursor': {
			borderLeftColor: 'var(--color-neutral-950, #09090b)',
		},
		'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
			backgroundColor: 'var(--color-primary-200, #bfdbfe) !important',
			color: 'inherit !important',
		},
		'&.cm-focused .cm-content:focus::selection, &.cm-focused .cm-content .cm-line::selection': {
			backgroundColor: 'var(--color-primary-200, #bfdbfe) !important',
			color: 'inherit !important',
		},
		'.cm-selectionLayer .cm-selectionBackground': {
			boxShadow: 'none',
		},
		'.cm-activeLine': {
			backgroundColor: 'transparent',
		},
		'.cm-gutters': {
			backgroundColor: 'var(--color-neutral-50, #fafafa)',
			color: 'var(--color-neutral-500, #71717a)',
			border: 'none',
		},
		'.cm-activeLineGutter': {
			backgroundColor: 'var(--color-neutral-100, #f4f4f5)',
		},
		'.cm-completionIcon-chord-used + .cm-completionLabel': {
			color: 'var(--color-primary-700, #1d4ed8)',
			fontWeight: '600',
		},
		'.cm-tooltip-autocomplete ul li[aria-selected] .cm-completionIcon-chord-used + .cm-completionLabel': {
			color: 'var(--color-white, #ffffff)',
		},
		'.cm-tooltip-autocomplete ul li[aria-selected]': {
			backgroundColor: 'var(--color-primary-600, #2563eb)',
			color: 'var(--color-white, #ffffff)',
		},
		'.cm-tooltip-autocomplete ul li[aria-selected] .cm-completionLabel, .cm-tooltip-autocomplete ul li[aria-selected] .cm-completionDetail, .cm-tooltip-autocomplete ul li[aria-selected] .cm-completionMatchedText': {
			color: 'var(--color-white, #ffffff)',
		},
		'.cm-lintRange-info': {
			backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"6\" height=\"3\"%3E%3Cpath d=\"m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0\" stroke=\"%23dc2626\" fill=\"none\" stroke-width=\"1\"/%3E%3C/svg%3E") !important',
			backgroundSize: '6px 3px',
			backgroundPosition: 'left bottom',
			backgroundRepeat: 'no-repeat',
		},
		'.cm-lintRange-warning': {
			backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"6\" height=\"3\"%3E%3Cpath d=\"m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0\" stroke=\"%23d97706\" fill=\"none\" stroke-width=\"1\"/%3E%3C/svg%3E") !important',
			backgroundSize: '6px 3px',
			backgroundPosition: 'left bottom',
			backgroundRepeat: 'no-repeat',
		},
		'.cm-lintRange-error': {
			backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"6\" height=\"3\"%3E%3Cpath d=\"m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0\" stroke=\"%23dc2626\" fill=\"none\" stroke-width=\"1\"/%3E%3C/svg%3E") !important',
			backgroundSize: '6px 3px',
			backgroundPosition: 'left bottom',
			backgroundRepeat: 'no-repeat',
		},
		'.chord-search-panel': {
			borderColor: 'var(--color-neutral-300, #d4d4d8)',
			backgroundColor: 'var(--color-white, #ffffff)',
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

