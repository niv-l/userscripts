// ==UserScript==
// @name         LMArena Auto-Select Models
// @version      4.0
// @description  Autoselects specified models on LMArena. Now optimized for speed using MutationObservers.
// @author       Nivyan Lakhani
// @match        https://beta.lmarena.ai/?mode=side-by-side
// @match        https://lmarena.ai/?mode=side-by-side
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
    'use strict';

    // ==================================================================================
    // --- USER CONFIGURATION ---
    // ==================================================================================

    const MODEL_1_NAME = 'gemini-3-pro';
    const MODEL_2_NAME = 'claude-opus-4-5-20251101-thinking-32k';

    const SELECTORS = {
        dialog: 'div[role="dialog"]',
        input: 'input[placeholder*="Search"]',
        option: 'div[role="option"]',
        buttonCandidates: 'button'
    };

    /**
     * Waits for an element to appear in the DOM using MutationObserver for zero-latency detection.
     */
    function waitFor(selector, scope = document) {
        return new Promise(resolve => {
            const existing = scope.querySelector(selector);
            if (existing) return resolve(existing);

            const observer = new MutationObserver(() => {
                const el = scope.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });
            observer.observe(scope, { childList: true, subtree: true });
        });
    }

    /**
     * React hack to trigger input changes programmatically
     */
    function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

        if (valueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
        } else {
            valueSetter.call(element, value);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Selects a specific model from a specific dropdown button
     */
    async function performSelection(button, modelName) {
        if (!button || button.textContent.toLowerCase().includes(modelName.toLowerCase())) {
            return; // Already selected or invalid button
        }

        button.click();

        const dialog = await waitFor(SELECTORS.dialog);
        const input = await waitFor(SELECTORS.input, dialog);

        setNativeValue(input, modelName);

        // We use an XPath here to find the div that explicitly contains the text
        const findOption = () => {
            const options = Array.from(dialog.querySelectorAll(SELECTORS.option));
            return options.find(opt => opt.textContent.toLowerCase().includes(modelName.toLowerCase()));
        };

        let targetOption = findOption();
        if (!targetOption) {
            await new Promise(resolve => {
                const obs = new MutationObserver(() => {
                    targetOption = findOption();
                    if (targetOption) {
                        obs.disconnect();
                        resolve();
                    }
                });
                obs.observe(dialog, { childList: true, subtree: true });
            });
        }

        targetOption.click();
    }

    /**
     * Identifies the two main model picker buttons based on common model names.
     */
    function findModelButtons() {
        // Broad regex to identify model buttons versus other UI buttons
        const pattern = /grok|google|qwen|gpt|claude|gemini|llama|mixtral|command|dbrx|model/i;
        return Array.from(document.querySelectorAll('button'))
            .filter(btn => pattern.test(btn.textContent) && btn.offsetParent !== null); // Must be visible
    }

    async function init() {
        console.log('[LMArena Turbo] Waiting for UI...');

        // Wait until we see at least 2 potential buttons in the DOM
        if (findModelButtons().length < 2) {
            await new Promise(resolve => {
                const obs = new MutationObserver(() => {
                    if (findModelButtons().length >= 2) {
                        obs.disconnect();
                        resolve();
                    }
                });
                obs.observe(document.body, { childList: true, subtree: true });
            });
        }

        const buttons = findModelButtons();
        console.log('[LMArena Turbo] UI Ready. Executing selection.');

        // Execute sequentially to prevent React state collision (safer than parallel)
        // but without arbitrary sleeps between them.
        await performSelection(buttons[0], MODEL_1_NAME);
        await performSelection(buttons[1], MODEL_2_NAME);

        console.log('[LMArena Turbo] Done.');
    }

    init();

})();
