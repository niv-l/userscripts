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
        // add custom site "autocompletes" here, e.g.:
        // 'g': { text: 'site:github.com ', cursorPos: 16 },
    };

    // a more reliable selector for the search input
    const searchInput = document.querySelector('textarea[name="q"], input[name="q"]');
    if (!searchInput) return;

    // uncomment the lines below if you want to autofocus the search bar
    // searchInput.focus();
    // searchInput.select();

    // main event listener for key presses
    searchInput.addEventListener('keydown', function(e) {
        const key = e.key.toLowerCase();

        // dorking templates with `Alt + Key`
        if (e.altKey) {
            const template = DORK_TEMPLATES[key];
            if (template) {
                e.preventDefault();
                insertTextAndPositionCursor(template.text, template.cursorPos);
            }
            // help menu toggle (if re-implemented)
            // if (key === 'h') {
            //     e.preventDefault();
            // }
            return;
        }

        // other keybindings and auto-closing
        switch (key) {
            case 'Escape':
                e.preventDefault();
                searchInput.value = '';
                break;
            case '"':
                e.preventDefault();
                insertTextAndPositionCursor('""', 1);
                break;
            case '(':
                e.preventDefault();
                insertTextAndPositionCursor('()', 1);
                break;
        }
    });

    // helper function for text insertion
    function insertTextAndPositionCursor(text, cursorPosition) {
        const start = searchInput.selectionStart;
        const end = searchInput.selectionEnd;
        const currentText = searchInput.value;

        searchInput.value = currentText.substring(0, start) + text + currentText.substring(end);

        const newCursorPos = start + cursorPosition;
        searchInput.setSelectionRange(newCursorPos, newCursorPos);
        searchInput.focus();
    }

})();
