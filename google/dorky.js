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

    // Configure dork bindings.
    const DORK_BINDINGS = {
        // Simple, one-shot templates (Alt + key)
        'i': { text: 'intext:""',     cursorPos: 8 },
        't': { text: 'intitle:""',    cursorPos: 9 },
        'u': { text: 'inurl:""',      cursorPos: 7 },
        'r': { text: 'related:',      cursorPos: 8 },
        'n': { text: 'AND',           cursorPos: 4 },
        'e': { text: '-""',           cursorPos: 2 },
        'a': { text: '""',            cursorPos: 1 },
        'o': { text: 'OR',            cursorPos: 3 },

        // Two-key bindings (e.g., Alt+s, then g for site:github.com)
        's': { // site:
            operator: 'site:',
            subBindings: {
                'g': 'github.com',
                's': 'stackoverflow.com',
                'r': 'reddit.com',
                'l': 'linkedin.com',
                'w': 'wikipedia.org',
                'a': 'archive.org',
                'm': 'medium.com'
            }
        },
        'f': { // filetype:
            operator: 'filetype:',
            subBindings: {
                'p': 'pdf',
                'd': 'docx',
                'x': 'xlsx',
                't': 'pptx',
                'c': 'csv',
                'j': 'json',
                'm': 'xml',
                'l': 'log',
                'e': 'txt',
                's': 'sql',
                'h': 'sh'
            }
        }
    };

    const searchInput = document.querySelector('textarea[name="q"], input[name="q"]');
    if (!searchInput) return;

    let pendingBinding = null;

    searchInput.addEventListener('keydown', function(e) {
        // Handle the second key of a two-key binding.
        if (pendingBinding) {
            // If space is pressed, exit pending mode without inserting a space.
            if (e.key === ' ') {
                e.preventDefault();
                e.stopImmediatePropagation();
                pendingBinding = null;
                return;
            }

            e.preventDefault();
            e.stopImmediatePropagation();

            const subKey = e.key.toLowerCase();
            const value = pendingBinding.subBindings[subKey];

            if (value) {
                // A valid sub-binding was pressed, insert the value and a trailing space.
                insertText(value + ' ', value.length + 1, false);
            }
            // For any other key, exit pending mode.
            pendingBinding = null;
            return;
        }

        // Handle the initial trigger (Alt + key).
        if (e.altKey) {
            const triggerKey = e.key.toLowerCase();
            const binding = DORK_BINDINGS[triggerKey];

            if (binding) {
                e.preventDefault();
                e.stopImmediatePropagation();

                if (binding.subBindings) {
                    // Start a two-key binding by inserting the operator and waiting.
                    insertText(binding.operator, binding.operator.length, true, false);
                    pendingBinding = binding;
                } else {
                    // It's a simple, one-shot binding. Append it with a trailing space.
                    insertText(binding.text, binding.cursorPos, true, true);
                }
            }
            return;
        }

        // Handle auto-pairing for convenience.
        switch (e.key) {
            case '"':
                e.preventDefault();
                insertText('""', 1, false);
                break;
            case '(':
                e.preventDefault();
                insertText('()', 1, false);
                break;
        }
    });

    function insertText(text, cursorPos, appendToEnd = false, addTrailingSpace = true) {
        searchInput.focus();

        if (appendToEnd) {
            const currentValue = searchInput.value.trimEnd();
            const textToInsert = (currentValue.length > 0 ? ' ' : '') + text + (addTrailingSpace ? ' ' : '');
            searchInput.value = currentValue + textToInsert;

            const basePos = (currentValue.length > 0 ? currentValue.length + 1 : 0);
            const finalCursorPos = basePos + cursorPos;
            searchInput.setSelectionRange(finalCursorPos, finalCursorPos);
        } else {
            // Insert at the current cursor position.
            const start = searchInput.selectionStart;
            const end = searchInput.selectionEnd;
            searchInput.value = searchInput.value.substring(0, start) + text + searchInput.value.substring(end);
            const newCursorPos = start + cursorPos;
            searchInput.setSelectionRange(newCursorPos, newCursorPos);
        }
    }
})();
