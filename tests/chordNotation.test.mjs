import assert from 'node:assert/strict';
import test from 'node:test';
import { getChordNotationSuggestions, normalizeChordNotationText } from '../dist/index.js';

test('groups repeated non-canonical chord notation', () => {
    assert.deepEqual(getChordNotationSuggestions('[Asus] [AM7] [Asus] [D+]'), [
        {
            original: 'Asus',
            replacement: 'Asus4',
            occurrences: 2,
            reason: '"sus" se interpreta como sus4; escríbelo explícitamente.',
        },
        {
            original: 'AM7',
            replacement: 'Amaj7',
            occurrences: 1,
            reason: '"maj7" identifica explícitamente la séptima mayor.',
        },
        {
            original: 'D+',
            replacement: 'Daug',
            occurrences: 1,
            reason: '"aug" es la notación explícita para quinta aumentada.',
        },
    ]);
});

test('normalizes chord tokens while preserving basses and unrelated bracket content', () => {
    const result = normalizeChordNotationText('[Asus/E] [AM7] [D+] [Asus4] [*Intro] [Am-G-F]');

    assert.equal(result.content, '[Asus4/E] [Amaj7] [Daug] [Asus4] [*Intro] [Am-G-F]');
    assert.equal(result.suggestions.reduce((total, item) => total + item.occurrences, 0), 3);
});