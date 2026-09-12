import { foldService } from '@codemirror/language';

// Same regexes as the legacy Ace fold mode (legacy-ace/src/mode-chordpro.js), ported to CM6's
// line-based foldService. "so(v|b|c|t)" / "start_of_x" pairs with "eo(v|b|c|t)" / "end_of_x".
const START_RE = /\{(so(?<name>v|b|c|t)|start_of_(?<longname>[^\s:}]+))(?:[: ][^}]*)?\}/i;
const END_RE = /\{(eo(?<name>v|b|c|t)|end_of_(?<longname>[^\s:}]+))\}/i;

const SHORT_TO_LONG: Record<string, string> = { v: 'verse', b: 'bridge', c: 'chorus', t: 'tab' };

function blockName(match: RegExpMatchArray): string | null {
	const name = match.groups?.name ?? match.groups?.longname;
	if (!name) return null;
	return (SHORT_TO_LONG[name.toLowerCase()] ?? name.toLowerCase()).replace(/s$/, '');
}

/** Folds {start_of_x}...{end_of_x} blocks, matching start/end by block name (verse/chorus/etc). */
export const chordProFolding = foldService.of((state, lineStart, lineEnd) => {
	const startMatch = state.doc.sliceString(lineStart, lineEnd).match(START_RE);
	if (!startMatch) return null;
	const name = blockName(startMatch);
	if (!name) return null;

	let pos = lineEnd;
	while (pos < state.doc.length) {
		const line = state.doc.lineAt(pos + 1);
		const endMatch = line.text.match(END_RE);
		if (endMatch && blockName(endMatch) === name) {
			return line.to > lineEnd ? { from: lineEnd, to: line.to } : null;
		}
		pos = line.to;
	}
	return null;
});
