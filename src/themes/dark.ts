import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Colors mirror chordproject-client's actual design tokens via CSS custom properties, so the
// editor matches the live app's dark theme
// instead of a generic hardcoded palette. Fallback values only apply outside that app (e.g. this
// package's standalone demo), approximating Tailwind's zinc/blue/red scales.
const editorTheme = EditorView.theme(
	{
		'&': {
			backgroundColor: 'var(--color-neutral-900, #18181b)',
			color: 'var(--color-neutral-100, #f4f4f5)',
		},
		'.cm-content': {
			textDecoration: 'none',
			caretColor: 'var(--color-neutral-100, #f4f4f5)',
		},
		'.cm-cursor, .cm-dropCursor': {
			borderLeftColor: 'var(--color-neutral-100, #f4f4f5)',
		},
		'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
			backgroundColor: 'var(--color-primary-700, #1d4ed8) !important',
			color: 'inherit !important',
		},
		'&.cm-focused .cm-content:focus::selection, &.cm-focused .cm-content .cm-line::selection': {
			backgroundColor: 'var(--color-primary-700, #1d4ed8) !important',
			color: 'inherit !important',
		},
		'.cm-selectionLayer .cm-selectionBackground': {
			boxShadow: 'none',
		},
		'.cm-activeLine': {
			backgroundColor: 'transparent',
		},
		'.cm-gutters': {
			backgroundColor: 'var(--color-neutral-900, #18181b)',
			color: 'var(--color-neutral-400, #a1a1aa)',
			border: 'none',
		},
		'.cm-activeLineGutter': {
			backgroundColor: 'var(--color-neutral-800, #27272a)',
		},
		'.chord-search-panel': {
			borderBottomColor: 'var(--color-neutral-700, #3f3f46)',
			backgroundColor: 'var(--color-neutral-900, #18181b)',
			borderColor: 'var(--color-neutral-700, #3f3f46)',
		},
		'.chord-search-field input': {
			backgroundColor: 'var(--color-neutral-800, #27272a)',
			color: 'var(--color-neutral-100, #f4f4f5)',
		},
		'.chord-search-field': {
			borderColor: 'var(--color-neutral-700, #3f3f46)',
			backgroundColor: 'var(--color-neutral-800, #27272a)',
		},
		'.chord-search-input-with-options input': {
			backgroundColor: 'transparent',
		},
		'.chord-search-button': {
			borderColor: 'var(--color-neutral-700, #3f3f46)',
			backgroundColor: 'var(--color-neutral-800, #27272a)',
			color: 'var(--color-neutral-100, #f4f4f5)',
		},
		'.chord-search-button:hover': {
			backgroundColor: 'var(--color-neutral-700, #3f3f46)',
		},
		'.chord-search-toggle-replace:hover, .chord-search-previous:hover, .chord-search-next:hover, .chord-search-close:hover': {
			backgroundColor: 'var(--color-neutral-800, #27272a)',
		},
		'.chord-search-options': {
			color: 'var(--color-neutral-300, #d4d4d8)',
		},
		'.chord-search-toggle.is-active': {
			borderColor: 'var(--color-primary-400, #60a5fa)',
			backgroundColor: 'var(--color-primary-950, #172554)',
			color: 'var(--color-primary-200, #bfdbfe)',
		},
		'.cm-completionIcon-chord-used + .cm-completionLabel': {
			color: 'var(--color-primary-300, #93c5fd)',
			fontWeight: '600',
		},
		'.cm-tooltip-autocomplete ul li[aria-selected] .cm-completionIcon-chord-used + .cm-completionLabel': {
			color: 'var(--color-white, #ffffff)',
		},
		'.cm-tooltip-autocomplete ul li[aria-selected]': {
			backgroundColor: 'var(--color-primary-700, #1d4ed8)',
			color: 'var(--color-white, #ffffff)',
		},
		'.cm-tooltip-autocomplete ul li[aria-selected] .cm-completionLabel, .cm-tooltip-autocomplete ul li[aria-selected] .cm-completionDetail, .cm-tooltip-autocomplete ul li[aria-selected] .cm-completionMatchedText': {
			color: 'var(--color-white, #ffffff)',
		},
		'.cm-lintRange-info': {
			backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"6\" height=\"3\"%3E%3Cpath d=\"m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0\" stroke=\"%23f87171\" fill=\"none\" stroke-width=\"1\"/%3E%3C/svg%3E") !important',
			backgroundSize: '6px 3px',
			backgroundPosition: 'left bottom',
			backgroundRepeat: 'no-repeat',
		},
		'.cm-lintRange-warning': {
			backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"6\" height=\"3\"%3E%3Cpath d=\"m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0\" stroke=\"%23fcd34d\" fill=\"none\" stroke-width=\"1\"/%3E%3C/svg%3E") !important',
			backgroundSize: '6px 3px',
			backgroundPosition: 'left bottom',
			backgroundRepeat: 'no-repeat',
		},
		'.cm-lintRange-error': {
			backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"6\" height=\"3\"%3E%3Cpath d=\"m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0\" stroke=\"%23f87171\" fill=\"none\" stroke-width=\"1\"/%3E%3C/svg%3E") !important',
			backgroundSize: '6px 3px',
			backgroundPosition: 'left bottom',
			backgroundRepeat: 'no-repeat',
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

