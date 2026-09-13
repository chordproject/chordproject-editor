export interface ChordNotationSuggestion {
	original: string;
	replacement: string;
	occurrences: number;
	reason: string;
}

export interface ChordNotationReplacement {
	from: number;
	to: number;
	original: string;
	replacement: string;
	reason: string;
}

export interface ChordNotationNormalization {
	content: string;
	suggestions: ChordNotationSuggestion[];
}

const CHORD_TOKEN = /\[([A-G](?:#|b)?)([^/\]\s]*)(\/[A-G](?:#|b)?)?\]/g;

const CHORD_TYPE_ALIASES: Record<string, { canonical: string; reason: string }> = {
	sus: { canonical: 'sus4', reason: '"sus" se interpreta como sus4; escríbelo explícitamente.' },
	'2': { canonical: 'sus2', reason: '"sus2" identifica el acorde suspendido de segunda.' },
	'+': { canonical: 'aug', reason: '"aug" es la notación explícita para quinta aumentada.' },
	M7: { canonical: 'maj7', reason: '"maj7" identifica explícitamente la séptima mayor.' },
	Maj7: { canonical: 'maj7', reason: '"maj7" identifica explícitamente la séptima mayor.' },
};

export function findChordNotationReplacements(content: string): ChordNotationReplacement[] {
	const replacements: ChordNotationReplacement[] = [];

	for (const match of content.matchAll(CHORD_TOKEN)) {
		const alias = CHORD_TYPE_ALIASES[match[2]];
		if (!alias || match.index === undefined) continue;

		const replacement = `${match[1]}${alias.canonical}${match[3] ?? ''}`;
		replacements.push({
			from: match.index,
			to: match.index + match[0].length,
			original: match[0].slice(1, -1),
			replacement,
			reason: alias.reason,
		});
	}

	return replacements;
}

export function getChordNotationSuggestions(content: string): ChordNotationSuggestion[] {
	const grouped = new Map<string, ChordNotationSuggestion>();
	for (const replacement of findChordNotationReplacements(content)) {
		const key = `${replacement.original}\u0000${replacement.replacement}`;
		const suggestion = grouped.get(key);
		if (suggestion) {
			suggestion.occurrences++;
		} else {
			grouped.set(key, {
				original: replacement.original,
				replacement: replacement.replacement,
				occurrences: 1,
				reason: replacement.reason,
			});
		}
	}
	return [...grouped.values()];
}

export function normalizeChordNotationText(content: string): ChordNotationNormalization {
	const replacements = findChordNotationReplacements(content);
	const normalizedContent = [...replacements]
		.reverse()
		.reduce((result, replacement) => {
			return `${result.slice(0, replacement.from)}[${replacement.replacement}]${result.slice(replacement.to)}`;
		}, content);

	return {
		content: normalizedContent,
		suggestions: getChordNotationSuggestions(content),
	};
}