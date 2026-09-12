# ChordPro Editor

A CodeMirror 6 based editor for ChordPro songs. **~22 KB** (~6 KB gzipped) - about 19x smaller
than the previous Ace-based build.

**Part of [ChordProject](https://chordproject.com/)**

## Overview

A from-scratch rewrite of this library (previously built on the Ace editor) using
[CodeMirror 6](https://codemirror.net/). It highlights ChordPro syntax (directives, chords,
comments, tab blocks), aligned with the official
[ChordPro directives](https://www.chordpro.org/chordpro/chordpro-directives/) and
[chord](https://www.chordpro.org/chordpro/chordpro-chords/) specification.

> **Coming from 0.1.x (Ace-based)?** The public API changed completely - see
> [Migrating from 0.1.x](#migrating-from-01x-ace-based) below.

## Usage

```sh
$ npm i chordproject-editor
```

```ts
import { createChordProEditor } from 'chordproject-editor';

const editor = createChordProEditor({
	parent: document.querySelector('#editor'),
	doc: '{title: Amazing Grace}\n[G]Amazing [C]grace...',
	theme: 'light', // or 'dark'
	onChange: (value) => console.log(value),
});
```

Colors read the same CSS custom properties as [chordproject-client](https://github.com/chordproject/chordproject-client)
(`--color-primary-*`, `--color-error-*`, `--color-neutral-*`), with sensible fallbacks for
standalone use. Ships with its own TypeScript types, no `@types/*` package needed.

## API

### `createChordProEditor(options): ChordProEditor`

| Option | Type | Description |
| --- | --- | --- |
| `parent` | `HTMLElement` | **Required.** Element that will contain the editor. |
| `doc` | `string?` | Initial document content. |
| `theme` | `'light' \| 'dark'?` | Initial theme. Defaults to `'light'`. |
| `extensions` | `Extension[]?` | Extra CodeMirror 6 extensions to append (escape hatch). |
| `onChange` | `(value: string) => void` | Called with the full document on every change. |
| `onFocus` / `onBlur` | `() => void` | Called when the editor gains/loses focus. |

The returned `ChordProEditor` handle:

| Member | Description |
| --- | --- |
| `view` | The underlying CodeMirror `EditorView`, for anything not covered below. |
| `getValue()` / `setValue(value)` | Read/replace the whole document. |
| `setTheme('light' \| 'dark')` | Swaps the theme without recreating the editor. |
| `insertChord()` | Inserts `"[]"` at the cursor (or wraps the selection) and opens chord suggestions - no keyboard shortcut needed, works from a button/tap. |
| `openCompletionList()` | Opens the completion list (chords or snippets, depending on cursor position) without any keyboard shortcut. |
| `focus()` / `destroy()` | Focus the editor / tear it down and release its DOM node. |

Unlike the previous Ace-based singleton, multiple independent `createChordProEditor()`
instances can coexist on the same page.

## Demo

```sh
$ npm i
$ npm run dev
```

Open http://localhost:5173/ to try it.

## Features

- Syntax highlighting: directives (known/custom/invalid), chords, comments, tab blocks, `{define:}`
- Chord autocomplete (common chord vocabulary, boosted by chords already used in the song)
- Directive snippets, expandable with `Tab` (see table below)
- Folding for `{start_of_x}`/`{end_of_x}` blocks
- Warns (non-blocking) when a "once per song" directive like `{title:}` or `{key:}` is repeated
- No fixed keyboard shortcut requirement: chords and snippets suggest themselves as you type,
  and `insertChord()`/`openCompletionList()` work from a button/tap - useful since `Ctrl+Space`
  and its usual alternates are unreliable across OS/keyboard layouts

### Snippets

Type the snippet and press `Tab` to expand it.

| Snippet | Result |
| --- | --- |
| `title` or `t` | `{title: value}` |
| `subtitle` or `st` | `{subtitle: value}` |
| `artist` or `a` | `{artist: value}` |
| `album` | `{album: value}` |
| `arranger` | `{arranger: value}` |
| `composer` | `{composer: value}` |
| `lyricist` | `{lyricist: value}` |
| `copyright` | `{copyright: value}` |
| `capo` | `{capo: 5}` |
| `key` or `k` | `{key: Am}` |
| `tempo` | `{tempo: 120}` |
| `time` | `{time: 4/4}` |
| `duration` | `{duration: 4:00}` |
| `year` | `{year: 2020}` |
| `meta` | `{meta: label value}` |
| `comment` or `c` | `{comment: value}` |
| `chorus` / `soc` / `eoc` | Chorus block / `{start_of_chorus}` / `{end_of_chorus}` |
| `verse` / `sov` / `eov` | Verse block / `{start_of_verse}` / `{end_of_verse}` |
| `bridge` / `sob` / `eob` | Bridge block / `{start_of_bridge}` / `{end_of_bridge}` |
| `tab` / `sot` / `eot` | Tab block with a 6-string template / `{start_of_tab}` / `{end_of_tab}` |
| `define` or `d` | `{define: Am base-fret 1 frets 0 0 0 0 0 0 fingers 0 0 0 0 0 0}` |
| `[` | Inserts a chord (`[Am]`) |

## Migrating from 0.1.x (Ace-based)

The library was rewritten from scratch on CodeMirror 6. The old Ace-based singleton API
(`ChordProjectEditor.Main.init()` / `.getEditor()` / `.doSetTheme()`) is gone, replaced by
`createChordProEditor()` (see [API](#api) above). There is no automatic migration - update your
integration code to call `createChordProEditor({ parent, doc, theme, onChange })` and use the
returned handle's methods instead.

## Contributing

This project welcomes contributions of all types. If you find any bug or want some new features, please feel free to create an issue or submit a pull request.

Join the community and chat with us on **[Discord](https://discord.gg/ZQAgwBC9c8)**

## License
[MIT License](LICENSE)