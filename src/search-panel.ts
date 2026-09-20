import { EditorView, Panel, ViewUpdate } from '@codemirror/view';
import {
    closeSearchPanel,
    findNext,
    findPrevious,
    getSearchQuery,
    replaceAll,
    replaceNext,
    SearchQuery,
    setSearchQuery,
} from '@codemirror/search';

export interface SearchLabels {
    search: string;
    replace: string;
    next: string;
    previous: string;
    replaceOne: string;
    replaceAll: string;
    close: string;
    toggleReplace: string;
    hideReplace: string;
    preserveCase: string;
    caseSensitive: string;
    wholeWord: string;
}

export const defaultSearchLabels: SearchLabels = {
    search: 'Find',
    replace: 'Replace',
    next: 'Next match',
    previous: 'Previous match',
    replaceOne: 'Replace',
    replaceAll: 'Replace all',
    close: 'Close search',
    toggleReplace: 'Show replace field',
    hideReplace: 'Hide replace field',
    preserveCase: 'Preserve case',
    caseSensitive: 'Match case',
    wholeWord: 'Whole word',
};

export function createSearchPanel(view: EditorView, labels: SearchLabels = defaultSearchLabels): Panel {
    const panel = document.createElement('form');
    panel.className = 'chord-search-panel';
    panel.addEventListener('submit', (event) => event.preventDefault());

    const searchInput = createInput('chord-search-input', labels.search);
    const replaceInput = createInput('chord-replace-input', labels.replace);
    const nextButton = createButton('chord-search-next', labels.next, '›');
    const previousButton = createButton('chord-search-previous', labels.previous, '‹');
    const replaceButton = createButton('chord-search-replace', labels.replaceOne, '↵');
    const replaceAllButton = createButton('chord-search-replace-all', labels.replaceAll, '↵×');
    const replaceToggle = createButton('chord-search-toggle-replace', labels.toggleReplace, '↔');
    const closeButton = createButton('chord-search-close', labels.close, '×');
    const matchCount = document.createElement('span');
    matchCount.className = 'chord-search-match-count';
    matchCount.setAttribute('aria-live', 'polite');
    const preserveCase = createToggle('chord-search-preserve-case', labels.preserveCase, 'AB');
    const caseSensitive = createToggle('chord-search-case', labels.caseSensitive, 'Aa');
    const wholeWord = createToggle('chord-search-whole-word', labels.wholeWord, 'ab');

    searchInput.wrapper.classList.add('chord-search-input-with-options');
    searchInput.wrapper.append(caseSensitive.button, wholeWord.button);
    replaceInput.wrapper.classList.add('chord-search-input-with-options');
    replaceInput.wrapper.append(preserveCase.button);

    const controls = document.createElement('div');
    controls.className = 'chord-search-controls';

    const replaceRow = document.createElement('div');
    replaceRow.className = 'chord-search-replace-row';
    replaceRow.hidden = false;
    replaceRow.append(replaceInput.wrapper, replaceButton, replaceAllButton);

    const searchFields = document.createElement('div');
    searchFields.className = 'chord-search-fields';
    searchFields.append(searchInput.wrapper, replaceRow);
    const navigation = document.createElement('div');
    navigation.className = 'chord-search-navigation';
    navigation.append(previousButton, nextButton, closeButton);
    controls.append(replaceToggle, searchFields, matchCount, navigation);
    panel.append(controls);

    const updateQuery = (): void => {
        const current = getSearchQuery(view.state);
        view.dispatch({
            effects: setSearchQuery.of(new SearchQuery({
                search: searchInput.input.value,
                replace: replaceInput.input.value,
                caseSensitive: caseSensitive.input.checked,
                wholeWord: wholeWord.input.checked,
                literal: current.literal,
            })),
        });
    };

    const runCommand = (command: (target: EditorView) => boolean): void => {
        updateQuery();
        command(view);
        searchInput.input.focus();
    };

    searchInput.input.addEventListener('input', updateQuery);
    replaceInput.input.addEventListener('input', updateQuery);
    caseSensitive.input.addEventListener('change', updateQuery);
    caseSensitive.button.addEventListener('click', () => {
        caseSensitive.input.checked = !caseSensitive.input.checked;
        updateQuery();
    });
    wholeWord.button.addEventListener('click', () => {
        wholeWord.input.checked = !wholeWord.input.checked;
        updateQuery();
    });
    preserveCase.button.addEventListener('click', () => {
        preserveCase.input.checked = !preserveCase.input.checked;
        preserveCase.button.classList.toggle('is-active', preserveCase.input.checked);
    });
    wholeWord.input.addEventListener('change', updateQuery);
    searchInput.input.addEventListener('keydown', (event) => handleKey(event, () => runCommand(findNext), () => runCommand(findPrevious)));
    replaceInput.input.addEventListener('keydown', (event) => handleKey(event, () => runCommand(findNext), () => runCommand(findPrevious)));
    nextButton.addEventListener('click', () => runCommand(findNext));
    previousButton.addEventListener('click', () => runCommand(findPrevious));
    replaceButton.addEventListener('click', () => runCommand(replaceNext));
    replaceAllButton.addEventListener('click', () => runCommand(replaceAll));
    closeButton.addEventListener('click', () => closeSearchPanel(view));
    replaceToggle.addEventListener('click', () => {
        replaceRow.hidden = !replaceRow.hidden;
        replaceToggle.classList.toggle('is-active', !replaceRow.hidden);
        replaceToggle.title = replaceRow.hidden ? labels.toggleReplace : labels.hideReplace;
        replaceToggle.setAttribute('aria-label', replaceToggle.title);
        replaceInput.input.focus();
    });

    replaceToggle.classList.add('is-active');
    replaceToggle.title = labels.hideReplace;
    replaceToggle.setAttribute('aria-label', labels.hideReplace);

    const update = (): void => {
        const query = getSearchQuery(view.state);
        if (document.activeElement !== searchInput.input) searchInput.input.value = query.search;
        if (document.activeElement !== replaceInput.input) replaceInput.input.value = query.replace;
        caseSensitive.input.checked = query.caseSensitive;
        wholeWord.input.checked = query.wholeWord;
        caseSensitive.button.classList.toggle('is-active', query.caseSensitive);
        wholeWord.button.classList.toggle('is-active', query.wholeWord);
        preserveCase.button.classList.toggle('is-active', preserveCase.input.checked);
        updateMatchCount(query, view, matchCount);
    };

    update();
    return {
        dom: panel,
        top: true,
        mount: () => {
            update();
            searchInput.input.focus();
            searchInput.input.select();
        },
        update: (_update: ViewUpdate) => update(),
    };
}

function updateMatchCount(query: SearchQuery, view: EditorView, target: HTMLSpanElement): void {
    if (!query.valid || !query.search) {
        target.textContent = '';
        return;
    }

    const matches: { from: number; to: number }[] = [];
    const cursor = query.getCursor(view.state);
    for (let match = cursor.next(); !match.done; match = cursor.next()) {
        matches.push(match.value);
    }
    if (!matches.length) {
        target.textContent = '0';
        return;
    }

    const selection = view.state.selection.main;
    const current = matches.findIndex((match) => match.from === selection.from && match.to === selection.to);
    target.textContent = `${current >= 0 ? current + 1 : 1} / ${matches.length}`;
}

function createInput(className: string, placeholder: string): { wrapper: HTMLLabelElement; input: HTMLInputElement } {
    const wrapper = document.createElement('label');
    wrapper.className = `chord-search-field ${className}`;
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.setAttribute('aria-label', placeholder);
    wrapper.append(input);
    return { wrapper, input };
}

function createButton(className: string, label: string, text = label): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chord-search-button ${className}`;
    button.textContent = text;
    button.title = label;
    button.setAttribute('aria-label', label);
    return button;
}

function createToggle(className: string, label: string, text: string): { button: HTMLButtonElement; input: HTMLInputElement } {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chord-search-option chord-search-toggle ${className}`;
    button.title = label;
    button.setAttribute('aria-label', label);
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
    const textElement = document.createElement('span');
    textElement.textContent = text;
    button.append(input, textElement);
    return { button, input };
}

function handleKey(event: KeyboardEvent, next: () => void, previous: () => void): void {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.shiftKey ? previous() : next();
}
