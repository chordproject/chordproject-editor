import { createChordProEditor } from '../src/index';

const sample = `# This is a comment
{title: Amazing Grace}
{sorttitle: Amazing Grace}
{artist: John Newton}
{key: G}
{unknown_directive: oops}
{comment-alto: Very softly!}

{start_of_verse Verse 1}
[G]Amazing [G7]grace, how [C]sweet the [C]sound
That [Em]saved a [D]wretch like [G]me
{end_of_verse}

{define: G frets 3 2 0 0 0 3 fingers 2 1 0 0 0 3}

{start_of_tab}
e|--3--------------------|
B|--0--------------------|
{end_of_tab}
`;

const status = document.querySelector('#status')!;
let theme: 'light' | 'dark' = 'light';

const editor = createChordProEditor({
	parent: document.querySelector('#editor')!,
	doc: sample,
	theme,
	onChange: (value) => {
		status.textContent = `${value.length} chars`;
	},
	onFocus: () => console.log('focus'),
	onBlur: () => console.log('blur'),
});

document.querySelector('#toggle-theme')!.addEventListener('click', () => {
	theme = theme === 'light' ? 'dark' : 'light';
	editor.setTheme(theme);
	document.body.style.background = theme === 'dark' ? '#111' : '#fff';
});

document.querySelector('#insert-chord')!.addEventListener('click', () => {
	editor.insertChord();
});

document.querySelector('#show-snippets')!.addEventListener('click', () => {
	editor.openCompletionList();
});

// expose for manual poking in the browser console during the smoke test
(window as any).editor = editor;
