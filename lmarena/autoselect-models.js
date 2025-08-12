// ==UserScript==
// @name         LMArena Auto-Select Models
// @version      2.0
// @description  Automatically selects specified models on LMArena's side-by-side view.
// @author       Nivyan Lakhani
// @match        https://beta.lmarena.ai/?mode=side-by-side
// @match        https://lmarena.ai/?mode=side-by-side
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';

  // --- USER CONFIGURATION ---
  const MODEL_1_NAME = 'gpt-5-high';                 // left
  const MODEL_2_NAME = 'gemini-2.5-pro';               // right
  // --------------------------

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function waitForElement(selector, parent = document, timeout = 8000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const el = parent.querySelector(selector);
      if (el) return el;
      await sleep(100);
    }
    return null;
  }

  function setReactInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async function selectModel(combobox, modelName) {
    if (!combobox || combobox.textContent.includes(modelName)) {
      return;
    }

    combobox.click();

    const dialog = await waitForElement('div[role="dialog"]');
    if (!dialog) return console.error('[LMArena] Model selection dialog did not appear.');

    const searchInput = await waitForElement('input', dialog);
    if (!searchInput) return console.error('[LMArena] Search input not found in dialog.');

    setReactInputValue(searchInput, modelName);

    const modelItem = await waitForElement(`[role="option"]`, dialog);
    if (!modelItem || !modelItem.textContent.includes(modelName)) {
        return console.error(`[LMArena] Model "${modelName}" not found in the list.`);
    }

    modelItem.click();

    const deadline = Date.now() + 4000;
    while (Date.now() < deadline) {
      if (!document.body.contains(dialog)) break;
      await sleep(100);
    }
  }


  async function run() {
    if (!await waitForElement('#chat-area', document, 10000)) {
      return console.error('[LMArena] Chat area not found. Aborting.');
    }

    const modelPickers = document.querySelectorAll(
      'button[role="combobox"][data-sentry-source-file="select-model.tsx"]'
    );

    if (modelPickers.length < 2) {
      return console.error('[LMArena] Could not find the model picker buttons.');
    }

    await selectModel(modelPickers[0], MODEL_1_NAME);
    await selectModel(modelPickers[1], MODEL_2_NAME);
  }

  setTimeout(run, 300);
})();
