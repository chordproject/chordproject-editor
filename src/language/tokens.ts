// Directive names recognized by this editor, aligned with the official spec:
// https://www.chordpro.org/chordpro/chordpro-directives/ (checked Sep 2026).
// Grouped the same way the spec groups them, so future updates are easy to diff.
//
// Only directives chordproject-parser actually understands (or silently tolerates as a
// no-op) are marked "known" here - anything else is intentionally styled as invalid so the
// editor and the parser always agree on what's really supported. Print/font-styling
// directives, {chord} (superseded by the upcoming click-to-view chord diagram feature) and
// {transpose} (superseded by our own text-rewriting transpose) are deliberately excluded.

export const PREAMBLE_DIRECTIVES = /^(new_song|ns)$/i;

export const META_DIRECTIVES =
	/^(title|t|sorttitle|subtitle|st|artist|sortartist|composer|arranger|lyricist|copyright|album|year|key|time|tempo|duration|capo|tag|meta)$/i;

export const FORMATTING_DIRECTIVES = /^(comment|c|highlight|comment_italic|ci|comment_box|cb|image)$/i;

export const ENV_DIRECTIVES =
	/^(start_of_chorus|soc|end_of_chorus|eoc|chorus|start_of_verse|sov|end_of_verse|eov|start_of_bridge|sob|end_of_bridge|eob|start_of_tab|sot|end_of_tab|eot|start_of_grid|sog|end_of_grid|eog)$/i;

// Delegated environments turn their content into an image (abc/lilypond/svg) or a free text block.
export const DELEGATED_ENV_DIRECTIVES =
	/^(start_of_abc|end_of_abc|start_of_ly|end_of_ly|start_of_svg|end_of_svg|start_of_textblock|end_of_textblock)$/i;

// Note: {chord} (inline diagram reference) is intentionally NOT included - see the module
// comment above. Only {define} (custom chord diagram data) is actually used.
export const CHORD_DIAGRAM_DIRECTIVES = /^define$/i;

export const CUSTOM_EXTENSION_DIRECTIVE = /^x_[\w]+$/i;

const KNOWN_DIRECTIVE_LISTS = [
	PREAMBLE_DIRECTIVES,
	META_DIRECTIVES,
	FORMATTING_DIRECTIVES,
	ENV_DIRECTIVES,
	DELEGATED_ENV_DIRECTIVES,
	CHORD_DIAGRAM_DIRECTIVES,
];

export const TAB_START_DIRECTIVES = /^(start_of_tab|sot)$/i;
export const DEFINE_DIRECTIVE = /^define$/i;


export const DIRECTIVE_NAME = /^[A-Za-z_][\w]*(?:-[\w!]+)?/;
export const DEFINE_KEYWORD = /^(fingers|frets|base-fret)\b/i;

/**
 * Any directive can be postfixed with "-selector" (optionally negated with "!"), e.g.
 * {comment-alto: ...} or {start_of_verse-soprano}. Strip that before checking the base name.
 * See "Conditional directives" in the spec.
 */
export function baseDirectiveName(name: string): string {
	return name.replace(/-[\w!]+$/, '');
}

export function isKnownDirective(name: string): boolean {
	const base = baseDirectiveName(name);
	if (CUSTOM_EXTENSION_DIRECTIVE.test(base)) return true;
	return KNOWN_DIRECTIVE_LISTS.some((re) => re.test(base));
}

// A chord is either a "*"-prefixed annotation (printed verbatim, e.g. [*Rit.]), or a real
// root note (A-G, case-insensitive so single lowercase notes like [f] are accepted too - see
// "ChordPro Implementation: Notes") with any suffix/bass text. This intentionally mirrors
// "relaxed mode" from https://www.chordpro.org/chordpro/chordpro-chords/ (unknown extensions
// are still accepted) to match chordproject-parser's own permissive Chord.parse.
export const CHORD_TEXT = /^(\*.+|[A-G](?:#{1,2}|b{1,2}|x)?[^\]]*)/i;

