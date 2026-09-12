import { StreamLanguage, StringStream } from '@codemirror/language';
import { Tag, tags as t } from '@lezer/highlight';
import {
	CHORD_TEXT,
	DEFINE_DIRECTIVE,
	DEFINE_KEYWORD,
	DIRECTIVE_NAME,
	TAB_START_DIRECTIVES,
	baseDirectiveName,
	isKnownDirective,
} from './tokens';

type Mode =
	| 'default'
	| 'directiveName'
	| 'afterName'
	| 'directiveValue'
	| 'define'
	| 'chord'
	| 'afterChord'
	| 'afterChordInvalid'
	| 'tab';

interface State {
	mode: Mode;
	pendingName: string;
}

function startState(): State {
	return { mode: 'default', pendingName: '' };
}

function copyState(state: State): State {
	return { ...state };
}

function token(stream: StringStream, state: State): string | null {
	if (state.mode === 'tab') {
		if (stream.match(/^\{\s*(end_of_tab|eot)\s*\}/i)) {
			state.mode = 'default';
			return 'directiveBrace';
		}
		if (stream.match(/^-+/)) return 'tabDash';
		if (stream.match(/^\|+/)) return 'tabChar';
		if (stream.match(/^[A-Ga-g][b#]?/)) return 'tabString';
		if (stream.match(/^[0-9]+/)) return 'tabNumber';
		stream.next();
		return 'tabText';
	}

	if (state.mode === 'define') {
		if (stream.match(/^\}/)) {
			state.mode = 'default';
			return 'directiveBrace';
		}
		if (stream.eatSpace()) return null;
		if (stream.match(/^[0-9]+/)) return 'defineNumber';
		if (stream.match(DEFINE_KEYWORD)) return 'defineKeyword';
		stream.match(/^[^\s0-9}]+/) || stream.next();
		return 'defineValue';
	}

	if (state.mode === 'directiveValue') {
		if (stream.match(/^\}/)) {
			state.mode = 'default';
			return 'directiveBrace';
		}
		stream.match(/^(\\.|[^\\}])+/) || stream.next();
		return 'directiveValue';
	}

	if (state.mode === 'directiveName') {
		stream.eatSpace();
		const match = stream.match(DIRECTIVE_NAME) as RegExpMatchArray | false;
		if (match) {
			const name = match[0];
			state.pendingName = name;
			state.mode = 'afterName';
			return isKnownDirective(name) ? 'directiveName' : 'directiveNameInvalid';
		}
		// Nothing that looks like a directive name right after "{": bail out.
		state.mode = 'default';
		if (stream.match(/^\}/)) return 'directiveBrace';
		stream.next();
		return 'directiveNameInvalid';
	}

	if (state.mode === 'afterName') {
		const name = baseDirectiveName(state.pendingName);
		if (stream.match(/^:/)) {
			state.mode = DEFINE_DIRECTIVE.test(name) ? 'define' : 'directiveValue';
			return 'directiveColon';
		}
		if (stream.match(/^\}/)) {
			state.mode = TAB_START_DIRECTIVES.test(name) ? 'tab' : 'default';
			return 'directiveBrace';
		}
		// Some directives take their argument after a space instead of a colon, e.g.
		// {start_of_verse Verse 1} or {image src="x.jpg"} - see "Arguments and attributes".
		if (stream.eatSpace()) {
			state.mode = DEFINE_DIRECTIVE.test(name) ? 'define' : 'directiveValue';
			return null;
		}
		// Malformed directive (e.g. stray characters before ":" or "}").
		state.mode = 'default';
		stream.next();
		return 'directiveNameInvalid';
	}

	if (state.mode === 'chord' || state.mode === 'afterChord' || state.mode === 'afterChordInvalid') {
		if (stream.eat(']')) {
			state.mode = 'default';
			return 'chordBracket';
		}
		if (state.mode === 'chord') {
			const match = stream.match(CHORD_TEXT) as RegExpMatchArray | false;
			state.mode = match ? 'afterChord' : 'afterChordInvalid';
			if (!match) stream.match(/^[^\]]+/);
			return match ? 'chord' : 'chordInvalid';
		}
		// Already emitted the chord text; anything else before "]" is leftover/invalid.
		stream.match(/^[^\]]+/);
		return 'chordInvalid';
	}

	// default mode
	if (stream.sol() && stream.match(/^#.*/)) return 'comment';
	if (stream.match(/^\{/)) {
		state.mode = 'directiveName';
		return 'directiveBrace';
	}
	if (stream.eat('[')) {
		state.mode = 'chord';
		return 'chordBracket';
	}
	stream.match(/^[^{[]+/) || stream.next();
	return null;
}

// Maps our token names to Lezer highlight tags consumed by themes/*.ts.
const tokenTable: Record<string, Tag> = {
	directiveBrace: t.meta,
	directiveName: t.attributeName,
	directiveNameInvalid: t.invalid,
	directiveColon: t.punctuation,
	directiveValue: t.string,
	defineKeyword: t.keyword,
	defineNumber: t.number,
	defineValue: t.string,
	chordBracket: t.character,
	chord: t.keyword,
	chordInvalid: t.invalid,
	comment: t.lineComment,
	tabDash: t.comment,
	tabChar: t.character,
	tabString: t.string,
	tabNumber: t.number,
	tabText: t.comment,
};

export const chordProLanguage = StreamLanguage.define<State>({
	startState,
	copyState,
	token,
	tokenTable,
	languageData: {
		commentTokens: { line: '#' },
	},
});
