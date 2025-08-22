// ==UserScript==
// @name         LMArena Extra Keybinds
// @version      0.3
// @description  Adds keybinds to trigger search and auto-select search models.
// @author       Nivyan Lakhani
// @match        https://beta.lmarena.ai/*
// @match        https://lmarena.ai/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
  "use strict";

  const BTN_SELECTOR = 'button[aria-label="Search"]';
  const LEFT_MODEL = 'gpt-5-search';
  const RIGHT_MODEL = 'gemini-2.5-pro-grounding';
  const MODEL_NAME_PAT = /(gpt|claude|gemini|llama|mixtral|command|dbrx|mistral|qwen|cohere|deepseek|phi)/i;

  const getButton = () => document.querySelector(BTN_SELECTOR);
  const isSaveCombo = (ev) =>
    (ev.ctrlKey || ev.metaKey) &&
    !ev.altKey &&
    !ev.shiftKey &&
    ev.code === "KeyS";

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = (el) => el && el.offsetParent !== null;

  async function waitForElement(selector, parent = document, timeout = 5000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const el = parent.querySelector(selector);
      if (visible(el)) return el;
      await sleep(50);
    }
    return null;
  }

  function setReactInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async function selectFromDialog(modelName) {
    const dialog = await waitForElement('div[role="dialog"]', document, 4000);
    if (!dialog) return false;

    const searchInput = await waitForElement('input[placeholder*="Search"]', dialog, 2000);
    if (!searchInput) return false;

    setReactInputValue(searchInput, modelName);
    await sleep(150);

    const option = await waitForElement('div[role="option"]:not([aria-disabled="true"])', dialog, 2000);
    if (!option || !option.textContent.includes(modelName)) {
      document.body.click();
      return false;
    }

    option.click();

    const end = Date.now() + 3000;
    while (Date.now() < end && document.body.contains(dialog)) {
      await sleep(50);
    }
    return true;
  }

  async function selectModelOnButton(btn, modelName) {
    if (!btn) return;
    if ((btn.textContent || '').includes(modelName)) return;
    btn.click();
    await selectFromDialog(modelName);
  }

  async function findModelButtons(timeout = 3500) {
    const end = Date.now() + timeout;
    const scope = () => document.querySelector('main') || document;

    const looksLikeModel = (b) => {
      const txt = (b.textContent || '').trim();
      const al = (b.getAttribute('aria-label') || '').toLowerCase();
      const title = (b.getAttribute('title') || '').toLowerCase();
      return MODEL_NAME_PAT.test(txt) || al.includes('model') || title.includes('model') || /model\s*\d/i.test(txt);
    };

    while (Date.now() < end) {
      const root = scope();

      // Collect combobox-like buttons
      let combos = Array.from(root.querySelectorAll('button[role="combobox"], [role="combobox"] button, button[aria-haspopup="listbox"]'))
        .filter(visible);

      // Prefer comboboxes that look like model selectors
      let modelCombos = combos.filter(looksLikeModel);

      if (modelCombos.length >= 2) {
        if (modelCombos.length > 2) modelCombos = modelCombos.slice(-2); // Skip any leading non-model (e.g., battle type)
        return [modelCombos[0], modelCombos[1]];
      }

      // If there are exactly 3 comboboxes, assume first is battle-type and last two are models
      if (combos.length >= 3) {
        const lastTwo = combos.slice(-2);
        if (lastTwo.length === 2) return [lastTwo[0], lastTwo[1]];
      }

      // Fallback: any visible buttons whose text looks like a model
      const allButtons = Array.from(root.querySelectorAll('button')).filter(visible);
      const patternButtons = allButtons.filter((b) => MODEL_NAME_PAT.test(b.textContent || ''));
      if (patternButtons.length >= 2) return [patternButtons[0], patternButtons[1]];

      await sleep(100);
    }
    return [];
  }

  async function ensureModelsSelected() {
    const [leftBtn, rightBtn] = await findModelButtons(4000);
    if (!leftBtn || !rightBtn) return;
    await selectModelOnButton(leftBtn, LEFT_MODEL);
    await sleep(150);
    await selectModelOnButton(rightBtn, RIGHT_MODEL);
  }

  async function triggerSearchAndSelect() {
    const btn = getButton();
    if (btn) {
      btn.click();
      await ensureModelsSelected();
      return;
    }

    const observer = new MutationObserver((_, obs) => {
      const b = getButton();
      if (b) {
        b.click();
        obs.disconnect();
        ensureModelsSelected();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 8000);
  }

  const onKeyDown = (ev) => {
    if (!isSaveCombo(ev) || ev.repeat) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    triggerSearchAndSelect();
  };

  window.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("keydown", onKeyDown, true);
})();
