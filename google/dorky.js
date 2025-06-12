// ==UserScript==
// @name         Dorky - A Google-Fu / Dorking Helper
// @version      0.1
// @description  Autocompletes quotes, adds keybinding templates for dorking (site:, intext:, etc.), and other QoL features.
// @author       Nivyan Lakhani
// @match        *://www.google.com/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  // change these bindings if you do not like them
  const DORK_KEYBINDINGS = {
    's': 'site:',
    'i': 'intext:',
    't': 'intitle:',
    'f': 'filetype:',
    'r': 'related:',
    'u': 'inurl:',
    'e': '-',
  };

  // finds the search input,
  const searchInput = document.querySelector('textarea[name="q"]');

  // uncomment the lines below if you want to autofocus the search bar
  // searchInput.focus();
  // searchInput.select();

  // main event listener for key presses
  searchInput.addEventListener('keydown', function(e) {
    // dorking templates with `Alt + Key`
    if (e.altKey) {
      const key = e.key.toLowerCase();
      if (DORK_KEYBINDINGS[key]) {
        e.preventDefault();
        const operator = DORK_KEYBINDINGS[key];
        const template = (operator === '-') ? operator : `${operator}""`;
        insertTextAndPositionCursor(template, template.length - 1);
      }
      // help menu toggle for new users.
      if (key === 'h') {
        e.preventDefault();
        toggleHelpMenu();
      }
      return;
    }

    // auto-closing characters - i never type a single quote
    const key = e.key;
    if (key === '"') {
      e.preventDefault();
      insertTextAndPositionCursor('""', 1);
    } else if (key === '(') {
      e.preventDefault();
      insertTextAndPositionCursor('()', 1);
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


  // let helpMenu = null;
  // let isHelpVisible = false;

  // function createHelpMenu() {
  //   if (helpMenu) return; // Only create once

  //   helpMenu = document.createElement('div');
  //   helpMenu.id = 'powerfu-help-menu';

  //   let content = '<h3>Google Power-Fu Helper</h3>';
  //   content += '<ul>';

  //   // Dynamically build list from configuration
  //   for (const key in DORK_KEYBINDINGS) {
  //     content += `<li><strong>Alt + ${key}</strong> &rarr; ${DORK_KEYBINDINGS[key]}</li>`;
  //   }

  //   content += '<hr>';
  //   content += '<li><strong>"</strong> &rarr; Auto-closes quotes</li>';
  //   content += '<li><strong>(</strong> &rarr; Auto-closes parentheses</li>';
  //   content += '<li><strong>Esc</strong> &rarr; Clear search box</li>';
  //   content += '<hr>';
  //   content += '<li>Press <strong>Alt + H</strong> to close this.</li>';
  //   content += '</ul>';

  //   helpMenu.innerHTML = content;
  //   document.body.appendChild(helpMenu);

  //   document.addEventListener('click', (e) => {
  //     if (isHelpVisible && !helpMenu.contains(e.target)) {
  //       toggleHelpMenu();
  //     }
  //   });
  // }

  // function toggleHelpMenu() {
  //   if (!helpMenu) {
  //     createHelpMenu();
  //   }
  //   isHelpVisible = !isHelpVisible;
  //   helpMenu.style.display = isHelpVisible ? 'block' : 'none';
  // }


  // // --- CSS Styles for the Help Menu ---
  // GM_addStyle(`
  //       #powerfu-help-menu {
  //           position: fixed;
  //           top: 20px;
  //           right: 20px;
  //           background-color: #f9f9f9;
  //           border: 1px solid #ccc;
  //           border-radius: 8px;
  //           padding: 15px 25px;
  //           box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  //           z-index: 9999;
  //           font-family: sans-serif;
  //           font-size: 14px;
  //           color: #333;
  //           display: none; /* Hidden by default */
  //       }
  //       #powerfu-help-menu h3 {
  //           margin-top: 0;
  //           margin-bottom: 15px;
  //           color: #4285F4; /* Google Blue */
  //           font-size: 16px;
  //           text-align: center;
  //       }
  //       #powerfu-help-menu ul {
  //           list-style: none;
  //           padding: 0;
  //           margin: 0;
  //       }
  //       #powerfu-help-menu li {
  //           margin-bottom: 8px;
  //       }
  //       #powerfu-help-menu hr {
  //           border: none;
  //           border-top: 1px solid #ddd;
  //           margin: 10px 0;
  //       }
  //       #powerfu-help-menu strong {
  //           display: inline-block;
  //           width: 80px; /* Aligns the arrows */
  //           color: #1a0dab;
  //       }
  //   `);

})();
