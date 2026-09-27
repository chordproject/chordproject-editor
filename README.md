# ChordPro Editor

A CodeMirror 6 editor for ChordPro songs, with syntax highlighting, completions, folding,
search and replace, and inline diagnostics.

**Part of [ChordProject](https://chordproject.com/)**

## Overview

A standalone CodeMirror 6 editor that understands ChordPro directives, chords, comments, and tab
blocks. Its syntax support follows the official
[ChordPro directives](https://www.chordpro.org/chordpro/chordpro-directives/) and
[chord](https://www.chordpro.org/chordpro/chordpro-chords/) specification.

The editor also lints parser warnings, repeated single-value metadata, unclosed sections, and
valid but non-canonical chord spellings. Hosts can provide localized labels for diagnostics and
the search panel.

## Usage

### Requirements

- Node.js 20.19.0 or newer for development and builds.
- `@chordproject/parser` version 1 or newer is a peer dependency and must be installed by the consuming application.

```sh
$ npm i @chordproject/editor
```

```ts
import { createChordProEditor } from '@chordproject/editor';

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
| `searchLabels` | `() => SearchLabels` | Supplies translated labels for the search and replace panel. |
| `lintLabels` | `() => LintLabels` | Supplies translated labels for all inline diagnostics. |

The returned `ChordProEditor` handle:

| Member | Description |
| --- | --- |
| `view` | The underlying CodeMirror `EditorView`, for anything not covered below. |
| `getValue()` / `setValue(value)` | Read/replace the whole document. |
| `setTheme('light' \| 'dark')` | Swaps the theme without recreating the editor. |
| `insertChord()` | Inserts `"[]"` at the cursor (or wraps the selection) and opens chord suggestions - no keyboard shortcut needed, works from a button/tap. |
| `openCompletionList()` | Opens the completion list (chords or snippets, depending on cursor position) without any keyboard shortcut. |
| `openSearch()` | Opens the search and replace panel. |
| `getChordNotationSuggestions()` | Returns grouped suggestions for valid non-canonical chord spellings, such as `Asus` to `Asus4`. |
| `normalizeChordNotation()` | Replaces all suggested spellings in one undoable CodeMirror transaction and returns the applied groups. |
| `refreshLint()` | Re-runs diagnostics, for example after changing the active language. |
| `focus()` / `destroy()` | Focus the editor / tear it down and release its DOM node. |

Multiple independent `createChordProEditor()` instances can coexist on the same page.

## Demo

```sh
$ npm i
$ npm run dev
```

Open http://localhost:5173/ to try it.

## Tests

```sh
$ npm test
```

The test suite covers grouped chord-notation suggestions and safe normalization of slash chords,
annotations, already canonical chords, and historical combined tokens.

## Publishing

Publishing uses npm Trusted Publishing from GitHub Actions; no npm token is stored in GitHub.
In npm package settings, add a GitHub Actions trusted publisher for organization `chordproject`,
repository `chordproject-editor`, and workflow file `publish.yml`. After merging changes, run
`npm run release` for a patch, or `npm run release:minor` / `npm run release:major`. These
commands run tests, bump the version, commit and tag it, then push; GitHub Actions publishes to
npmjs.org using OIDC. The tag must match `package.json`.

## Features

- Syntax highlighting: directives (known/custom/invalid), chords, comments, tab blocks, `{define:}`
- Chord autocomplete (common chord vocabulary, boosted by chords already used in the song)
- Directive snippets, expandable with `Tab` (see table below)
- Folding for `{start_of_x}`/`{end_of_x}` blocks
- Inline parser diagnostics for malformed directives, invalid metadata, and malformed chords
- Non-blocking warnings for repeated single-value metadata and unclosed sections, with an action to insert the missing closing directive
- Suggests canonical spellings for valid legacy abbreviations such as `Asus` to `Asus4`, `AM7` to `Amaj7`, and `D+` to `Daug`, with an individual replacement action
- Exposes `getChordNotationSuggestions()` and `normalizeChordNotationText(content)` for hosts that want to preview or apply grouped normalization
- Built-in search and replace, also available programmatically through `openSearch()`
- No fixed keyboard shortcut requirement: chords and snippets suggest themselves as you type,
  and `insertChord()`/`openCompletionList()` can be called from a button or touch control

### Localization

Provide `searchLabels` and `lintLabels` callbacks when creating the editor to translate the
search panel and lint messages. Call `refreshLint()` after changing the active language so
existing diagnostics are regenerated with the new labels. The exported `SearchLabels` and
`LintLabels` types describe the supported strings.

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

## Contributing

This project welcomes contributions of all types. If you find any bug or want some new features, please feel free to create an issue or submit a pull request.

Join the community and chat with us on **[Discord](https://discord.gg/ZQAgwBC9c8)**

## License
[GNU Affero General Public License v3.0](LICENSE)