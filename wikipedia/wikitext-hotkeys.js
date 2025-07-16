// ==UserScript==
// @name         Wikipedia Editor Hotkeys
// @description  Press Alt+T to insert a template and Alt+A to insert a link in Wikipedia's wikitext editor.
// @author       Nivyan Lakhani
// @match        *://*.wikipedia.org/w/index.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const hotkeyMap = {
        't': 'Insert a template',  // alt+t
        'a': 'Link',              // alt+a
    };

    document.addEventListener('keydown', (event) => {
        // we exit early if alt isn't pressed or if we're not in the wikitext editor.
        if (!event.altKey || !document.getElementById('wpTextbox1')) {
            return;
        }

        const key = event.key.toLowerCase();
        const buttonTitle = hotkeyMap[key];

        if (buttonTitle) {

            const button = document.querySelector(`a[title^="${buttonTitle}"]`);

            if (button) {
                event.preventDefault(); // we stop browser default actions (e.g., opening a menu).
                event.stopPropagation();
                button.click();
            }
        }
    }, false);
})();
