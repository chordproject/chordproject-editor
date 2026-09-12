import { Completion, snippetCompletion } from '@codemirror/autocomplete';

// Ported from legacy-ace/src/snippets-chordpro.js, with the column_break/comment_box
// short-name mix-up fixed (see language/tokens.ts). Directives only useful for print styling
// (fonts/colours/etc.), {transpose} (superseded by our own transpose feature) and {chord}
// (superseded by the click-to-view chord diagram feature) are intentionally left out.
export const CHORDPRO_SNIPPETS: readonly Completion[] = [
	snippetCompletion('{album: ${value}}', { label: 'album', type: 'directive' }),
	snippetCompletion('{arranger: ${value}}', { label: 'arranger', type: 'directive' }),
	snippetCompletion('{artist: ${value}}', { label: 'artist', type: 'directive' }),
	snippetCompletion('{artist: ${value}}', { label: 'a', type: 'directive', detail: 'artist' }),
	snippetCompletion('{capo: ${5}}', { label: 'capo', type: 'directive' }),
	snippetCompletion('{composer: ${value}}', { label: 'composer', type: 'directive' }),
	snippetCompletion('{copyright: ${value}}', { label: 'copyright', type: 'directive' }),
	snippetCompletion('{duration: ${4}:${00}}', { label: 'duration', type: 'directive' }),
	snippetCompletion('{key: ${Am}}', { label: 'key', type: 'directive' }),
	snippetCompletion('{key: ${Am}}', { label: 'k', type: 'directive', detail: 'key' }),
	snippetCompletion('{lyricist: ${value}}', { label: 'lyricist', type: 'directive' }),
	snippetCompletion('{tempo: ${120}}', { label: 'tempo', type: 'directive' }),
	snippetCompletion('{time: ${4}/${4}}', { label: 'time', type: 'directive' }),
	snippetCompletion('{title: ${value}}', { label: 'title', type: 'directive' }),
	snippetCompletion('{title: ${value}}', { label: 't', type: 'directive', detail: 'title' }),
	snippetCompletion('{subtitle: ${value}}', { label: 'subtitle', type: 'directive' }),
	snippetCompletion('{subtitle: ${value}}', { label: 'st', type: 'directive', detail: 'subtitle' }),
	snippetCompletion('{year: ${2020}}', { label: 'year', type: 'directive' }),
	snippetCompletion('{meta: ${label} ${value}}', { label: 'meta', type: 'directive' }),
	snippetCompletion('{comment: ${value}}', { label: 'comment', type: 'directive' }),
	snippetCompletion('{comment: ${value}}', { label: 'c', type: 'directive', detail: 'comment' }),

	snippetCompletion('{start_of_chorus: ${Chorus}}\n${lyrics}\n{end_of_chorus}', {
		label: 'chorus',
		type: 'directive',
	}),
	snippetCompletion('{start_of_chorus}', { label: 'soc', type: 'directive', detail: 'start_of_chorus' }),
	snippetCompletion('{end_of_chorus}', { label: 'eoc', type: 'directive', detail: 'end_of_chorus' }),

	snippetCompletion('{start_of_verse: ${Verse} ${1}}\n${lyrics}\n{end_of_verse}', {
		label: 'verse',
		type: 'directive',
	}),
	snippetCompletion('{start_of_verse}', { label: 'sov', type: 'directive', detail: 'start_of_verse' }),
	snippetCompletion('{end_of_verse}', { label: 'eov', type: 'directive', detail: 'end_of_verse' }),

	snippetCompletion('{start_of_bridge: ${Bridge}}\n${lyrics}\n{end_of_bridge}', {
		label: 'bridge',
		type: 'directive',
	}),
	snippetCompletion('{start_of_bridge}', { label: 'sob', type: 'directive', detail: 'start_of_bridge' }),
	snippetCompletion('{end_of_bridge}', { label: 'eob', type: 'directive', detail: 'end_of_bridge' }),

	snippetCompletion(
		'{start_of_tab}\ne|-${1}--------------------------------|\nB|----------------------------------|\nG|----------------------------------|\nD|----------------------------------|\nA|----------------------------------|\nE|----------------------------------|\n{end_of_tab}',
		{ label: 'tab', type: 'directive' }
	),
	snippetCompletion('{start_of_tab}', { label: 'sot', type: 'directive', detail: 'start_of_tab' }),
	snippetCompletion('{end_of_tab}', { label: 'eot', type: 'directive', detail: 'end_of_tab' }),

	snippetCompletion('{define: ${Am} base-fret ${1} frets ${0 0 0 0 0 0} fingers ${0 0 0 0 0 0}}', {
		label: 'define',
		type: 'directive',
	}),
	snippetCompletion('{define: ${Am} base-fret ${1} frets ${0 0 0 0 0 0} fingers ${0 0 0 0 0 0}}', {
		label: 'd',
		type: 'directive',
		detail: 'define',
	}),

	snippetCompletion('[${Am}]', { label: '[', type: 'chord', detail: 'insert a chord' }),

	snippetCompletion(
		'{title: ${value}}\n{artist: ${value}}\n{key: ${C}}\n\n${lyrics}\n{start_of_chorus}\n${lyrics}\n{end_of_chorus}',
		{ label: '!', type: 'directive', detail: 'new song template' }
	),
];
