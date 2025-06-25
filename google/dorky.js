// ==UserScript==
// @name         Dorky - A Google-Fu / Dorking Helper
// @version      0.3
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
        // One-shot templates (Alt + key)
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
                'g'  : 'github.com',
                'S-g': 'gwern.net',
                's'  : 'stackoverflow.com',
                'r'  : 'reddit.com',
                'l'  : 'linkedin.com',
                'w'  : 'wikipedia.org',
                'a'  : 'archive.org',
                'n'  : 'nature.com'
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
    let previewElement = null;

    function showPreview(binding) {
        if (!previewElement) {
            previewElement = document.createElement('div');
            previewElement.className = 'dorky-preview';
            document.body.appendChild(previewElement);
        }

        let content = `<div class="dorky-preview-title">${binding.operator}</div>`;
        for (const key in binding.subBindings) {
            content += `<div class="dorky-preview-item"><span class="dorky-preview-key">${key}</span> ${binding.subBindings[key]}</div>`;
        }
        previewElement.innerHTML = content;

        const inputRect = searchInput.getBoundingClientRect();
        previewElement.style.display = 'block';
        previewElement.style.top  = `${window.scrollY + inputRect.bottom + 5}px`;
        previewElement.style.left = `${window.scrollX + inputRect.left}px`;
    }

    function hidePreview() {
        if (previewElement) previewElement.style.display = 'none';
        pendingBinding = null;
    }

    searchInput.addEventListener('keydown', function(e) {
        // handle the second key of a two-key binding.
        if (pendingBinding) {
            if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
                return; // stay in pending mode, keep preview
            }

            e.preventDefault();
            e.stopImmediatePropagation();

            // If space is pressed, just exit pending mode.
            if (e.key === ' ') {
                hidePreview();
                return;
            }

            // Modifier-aware descriptor
            let descriptor = '';
            if (e.ctrlKey)  descriptor += 'C-';
            if (e.shiftKey) descriptor += 'S-';
            descriptor += e.key.toLowerCase();

            const value =
                pendingBinding.subBindings[descriptor] ||
                pendingBinding.subBindings[e.key.toLowerCase()];

            if (value) {
                // A valid sub-binding was pressed, insert the value and a trailing space.
                insertText(value + ' ', value.length + 1, false);
            }

            hidePreview();
            return;
        }

        // Handle the initial trigger (Alt + key).
        if (e.altKey) {
            const triggerKey = e.key.toLowerCase();
            const binding   = DORK_BINDINGS[triggerKey];

            if (binding) {
                e.preventDefault();
                e.stopImmediatePropagation();

                if (binding.subBindings) {
                    insertText(binding.operator, binding.operator.length, true, false);
                    pendingBinding = binding;
                    showPreview(binding);
                } else {
                    insertText(binding.text, binding.cursorPos, true, true);
                }
            }
            return;
        }

        // Handle auto-pairing for convenience.
        switch (e.key) {
            case '"':
                const cursorPos = searchInput.selectionStart;
                const charBefore = searchInput.value.charAt(cursorPos - 1);

                if (cursorPos === 0 || /\s/.test(charBefore)) {
                    e.preventDefault();
                    insertText('""', 1, false);
                }
                break;
            case '(':
                e.preventDefault();
                insertText('()', 1, false);
                break;
        }
    });

    // Code for previewing sub-maps.
    GM_addStyle(`
        .dorky-preview {
            position: absolute;
            background-color: #06080B;
            color: #e8eaed;
            border: 1px solid #5f6368;
            border-radius: 8px;
            padding: 8px 12px;
            font-family: monospace;
            font-size: 14px;
            z-index: 9999;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            display: none;
            max-width: 400px;
            line-height: 1.5;
        }
        .dorky-preview-title {
            color: #88C0D0;
            font-weight: bold;
            margin-bottom: 5px;
            padding-bottom: 3px;
            border-bottom: 1px solid #5f6368;
        }
        .dorky-preview-item {
            display: flex;
            justify-content: space-between;
        }
        .dorky-preview-key {
            color: #9DB787;
            font-weight: bold;
            padding-right: 15px;
        }
    `);

    // Hide preview if the user clicks away from the input
    searchInput.addEventListener('blur', hidePreview);

    function insertText(text, cursorPos, appendToEnd = false, addTrailingSpace = true) {
        searchInput.focus();

        if (appendToEnd) {
            const currentValue  = searchInput.value.trimEnd();
            const textToInsert  = (currentValue.length ? ' ' : '') +
                                  text +
                                  (addTrailingSpace ? ' ' : '');
            searchInput.value   = currentValue + textToInsert;

            const basePos       = currentValue.length ? currentValue.length + 1 : 0;
            const finalPos      = basePos + cursorPos;
            searchInput.setSelectionRange(finalPos, finalPos);
        } else {
            const start = searchInput.selectionStart;
            const end   = searchInput.selectionEnd;
            searchInput.value = searchInput.value.substring(0, start) +
                                text +
                                searchInput.value.substring(end);
            const newPos = start + cursorPos;
            searchInput.setSelectionRange(newPos, newPos);
        }
    }
})();
