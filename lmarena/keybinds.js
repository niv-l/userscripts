// ==UserScript==
// @name         LMArena Extra Keybinds
// @version      0.1
// @description  Adds keybinds to trigger search. I'd rather not use my mouse.
// @author       Nivyan Lakhani
// @match        https://beta.lmarena.ai/*
// @match        https://lmarena.ai/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
  "use strict";

  const BTN_SELECTOR = 'button[aria-label="Search"]';

  const getButton = () => document.querySelector(BTN_SELECTOR);

  const isSaveCombo = (ev) =>
    (ev.ctrlKey || ev.metaKey) &&
    !ev.altKey &&
    !ev.shiftKey &&
    ev.code === "KeyS";

  const onKeyDown = (ev) => {
    if (!isSaveCombo(ev)) return;

    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();

    const btn = getButton();
    if (btn) {
      btn.click();
    } else {
      const observer = new MutationObserver(() => {
        const lateBtn = getButton();
        if (lateBtn) {
          lateBtn.click();
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  };

  window.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("keydown", onKeyDown, true);
})();
