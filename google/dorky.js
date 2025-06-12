// ==UserScript==
// @name         Dorky - A Google-Fu / Dorking Helper
// @version      0.2
// @description  Autocompletes quotes, adds keybinding templates for dorking (site:, intext:, etc.), and other QoL features.
// @author       Nivyan Lakhani
// @match        *://www.google.com/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Configure templates: 'text' is inserted, 'cursorPos' is where the cursor goes.
    const DORK_TEMPLATES = {
        's': { text: 'site:""',       cursorPos: 6 },
        'i': { text: 'intext:""',     cursorPos: 8 },
        't': { text: 'intitle:""',    cursorPos: 9 },
        'u': { text: 'inurl:""',      cursorPos: 7 },
        'f': { text: 'filetype:',     cursorPos: 9 },
        'r': { text: 'related:',      cursorPos: 8 },
        'e': { text: '-',             cursorPos: 1 }, // Exclude
        'a': { text: ' ""',           cursorPos: 2 }, // AND (another quoted term)
        'o': { text: ' OR ',          cursorPos: 4 }, // OR
        // add other templating here, e.g.:
        // 'g': { text: 'site:github.com ', cursorPos: 16 },
    };

    // Configure the autocomplete menu suggestions for each trigger.
    const AUTOCOMPLETE_SUGGESTIONS = {
        'site:': [
            'github.com', 'stackoverflow.com', 'reddit.com', 'linkedin.com', 'wikipedia.org', 'archive.org', 'medium.com'
        ],
        'filetype:': [
            'pdf', 'docx', 'xlsx', 'pptx', 'csv', 'json', 'xml', 'log', 'txt', 'sql', 'sh'
        ],
    };

    const searchInput = document.querySelector('textarea[name="q"], input[name="q"]');
    if (!searchInput) return;

    let autocompleteMenu = null;
    let autocompleteVisible = false;
    let selectedIndex = -1;
    let activeTrigger = null;

    function initAutocompleteMenu() {
        if (autocompleteMenu) return;
        autocompleteMenu = document.createElement('div');
        document.body.appendChild(autocompleteMenu);
        GM_addStyle(`
            #dorky-autocomplete-menu {
                position: absolute; display: none; z-index: 9999;
                background: white; min-width: 200px;
                border: 1px solid #dfe1e5;
                box-shadow: 0 4px 6px rgba(32,33,36,0.28);
                border-radius: 0 0 12px 12px;
                padding: 8px 0;
            }
            .dorky-item { padding: 6px 20px; cursor: pointer; font-size: 14px; line-height: 20px; }
            .dorky-item.selected { background-color: #eee; }
        `);
    }

    function showAutocompleteMenu(trigger) {
        if (!autocompleteMenu) initAutocompleteMenu();
        const items = AUTOCOMPLETE_SUGGESTIONS[trigger];
        if (!items) return;
        activeTrigger = trigger;

        autocompleteMenu.innerHTML = '';
        items.forEach(itemText => {
            const div = document.createElement('div');
            div.className = 'dorky-item';
            div.textContent = itemText;
            div.addEventListener('mousedown', e => {
                e.preventDefault();
                selectAutocompleteItem(itemText);
            });
            autocompleteMenu.appendChild(div);
        });

        const rect = searchInput.getBoundingClientRect();
        autocompleteMenu.id = 'dorky-autocomplete-menu';
        autocompleteMenu.style.left = `${rect.left}px`;
        autocompleteMenu.style.top = `${rect.bottom}px`;
        autocompleteMenu.style.width = `${rect.width}px`;
        autocompleteMenu.style.display = 'block';
        autocompleteVisible = true;
        selectedIndex = -1;
    }

    function hideAutocompleteMenu() {
        if (autocompleteMenu) autocompleteMenu.style.display = 'none';
        autocompleteVisible = false;
        activeTrigger = null;
    }

    function selectAutocompleteItem(value) {
        if (!activeTrigger) return;
        const currentVal = searchInput.value;
        const cursorPos = searchInput.selectionStart;
        const textBeforeCursor = currentVal.substring(0, cursorPos);
        const textAfterCursor = currentVal.substring(cursorPos);

        const triggerStartIndex = textBeforeCursor.lastIndexOf(activeTrigger);
        if (triggerStartIndex === -1) return;

        const newTextBefore = textBeforeCursor.substring(0, triggerStartIndex);
        const replacement = activeTrigger + value + ' ';
        const finalVal = newTextBefore + replacement + textAfterCursor;
        searchInput.value = finalVal;

        hideAutocompleteMenu();
        searchInput.focus();
        const newCursorPos = triggerStartIndex + replacement.length;
        searchInput.setSelectionRange(newCursorPos, newCursorPos);
    }

    function updateMenuHighlight() {
        const items = autocompleteMenu.querySelectorAll('.dorky-item');
        items.forEach((item, i) => item.classList.toggle('selected', i === selectedIndex));
    }

    searchInput.addEventListener('keydown', function(e) {
        if (autocompleteVisible) {
            let handled = true; // Assume we handle the key
            switch (e.key) {
                case 'ArrowDown':
                    selectedIndex = (selectedIndex + 1) % autocompleteMenu.childElementCount;
                    updateMenuHighlight();
                    break;
                case 'ArrowUp':
                    selectedIndex = (selectedIndex - 1 + autocompleteMenu.childElementCount) % autocompleteMenu.childElementCount;
                    updateMenuHighlight();
                    break;
                case 'Enter':
                case 'Tab':
                    if (selectedIndex > -1) {
                        const selectedItem = autocompleteMenu.querySelectorAll('.dorky-item')[selectedIndex];
                        selectAutocompleteItem(selectedItem.textContent);
                    } else {
                        hideAutocompleteMenu(); // If nothing selected, just hide menu
                    }
                    break;
                case 'Escape':
                    hideAutocompleteMenu();
                    break;
                default:
                    handled = false;
            }

            if (handled) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
            return;
        }

        if (e.altKey) {
            const template = DORK_TEMPLATES[e.key.toLowerCase()];
            if (template) {
                e.preventDefault();
                insertText(template.text, template.cursorPos, template.trigger);
            }
            return;
        }

        switch (e.key) {
            case '"': e.preventDefault(); insertText('""', 1); break;
            case '(': e.preventDefault(); insertText('()', 1); break;
        }
    });

    searchInput.addEventListener('input', () => {
        const textBeforeCursor = searchInput.value.substring(0, searchInput.selectionStart);
        if (!textBeforeCursor) { hideAutocompleteMenu(); return; }

        const lastWord = textBeforeCursor.match(/[\w:]+$/)?.[0] || '';
        const trigger = Object.keys(AUTOCOMPLETE_SUGGESTIONS).find(t => t === lastWord);

        if (trigger && !autocompleteVisible) {
            showAutocompleteMenu(trigger);
        } else if (!textBeforeCursor.endsWith(activeTrigger)) {
            hideAutocompleteMenu();
        }
    });

    searchInput.addEventListener('click', () => {
        const textBeforeCursor = searchInput.value.substring(0, searchInput.selectionStart);
        if (textBeforeCursor.endsWith(activeTrigger)) return;
        hideAutocompleteMenu();
    });

    searchInput.addEventListener('blur', () => setTimeout(hideAutocompleteMenu, 150));

    function insertText(text, cursorPos, trigger = null) {
        const start = searchInput.selectionStart;
        let textToInsert = text;
        if (start > 0 && searchInput.value[start - 1] !== ' ') {
            textToInsert = ' ' + text;
        }

        const before = searchInput.value.substring(0, start);
        const after = searchInput.value.substring(start);
        searchInput.value = before + textToInsert + after;

        const newCursorPos = start + textToInsert.length - (text.length - cursorPos);
        searchInput.setSelectionRange(newCursorPos, newCursorPos);
        searchInput.focus();

        if (trigger) {
            showAutocompleteMenu(trigger);
        }
    }
})();
