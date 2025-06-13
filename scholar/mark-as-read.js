// ==UserScript==
// @name         Mark as read - Google Scholar
// @version      0.1
// @description  Marks Google Scholar papers as 'read' and adds a visual tag.
// @author       Nivyan Lakhani
// @match        *://scholar.google.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(async function() {
    'use strict';

    const STORAGE_KEY = 'scholarReadPapers';
    let readPapers = new Set();

    // add some css to make our tag and button look nice.
    GM_addStyle(`
        .read-marker-tag {
            background-color: #28a745;
            color: white;
            padding: 2px 6px;
            font-size: 0.8em;
            font-weight: bold;
            border-radius: 4px;
            margin-right: 8px;
            vertical-align: middle;
        }
        .read-marker-button {
            cursor: pointer;
            margin-left: 10px; /* Spacing from other links like 'Cite' */
        }
    `);

    // load the list of read paper ids from storage.
    async function loadReadPapers() {
        const storedData = await GM_getValue(STORAGE_KEY, '[]');
        try {
            readPapers = new Set(JSON.parse(storedData));
        } catch (e) {
            console.error('Could not parse read papers data:', e);
            readPapers = new Set();
        }
    }

    // save the updated list of read paper ids to storage.
    async function saveReadPapers() {
        await GM_setValue(STORAGE_KEY, JSON.stringify([...readPapers]));
    }

    // toggles the read status of a paper and updates the ui.
    function toggleReadStatus(paperId, resultElement) {
        if (readPapers.has(paperId)) {
            readPapers.delete(paperId);
        } else {
            readPapers.add(paperId);
        }
        saveReadPapers();
        updateSingleResultUI(resultElement);
    }

    // this function adds the tag and button to a single search result.
    // it's designed to be idempotent (safe to run multiple times).
    function updateSingleResultUI(resultElement) {
        const titleElement = resultElement.querySelector('.gs_rt');
        const titleLink = titleElement ? titleElement.querySelector('a') : null;
        const footerElement = resultElement.querySelector('.gs_ri .gs_fl');  // <<< changed: target the left-side action bar only

        // if the result doesn't have a title link or footer, skip it.
        if (!titleLink || !footerElement) {
            return;
        }

        const paperId = titleLink.href; // Use the paper's URL as its unique ID.
        const isRead = readPapers.has(paperId);

        // remove any old tag or button we might have added before.
        resultElement.querySelector('.read-marker-tag')?.remove();
        resultElement.querySelector('.read-marker-button')?.remove();

        // add the "read" tag if the paper is marked as read.
        if (isRead) {
            const tag = document.createElement('span');
            tag.className = 'read-marker-tag';
            tag.textContent = 'READ';
            titleElement.prepend(tag);
        }

        // add the "mark as read/unread" button.
        const button = document.createElement('a');
        button.className = 'read-marker-button';
        button.textContent = isRead ? 'Mark as Unread' : 'Mark as Read';
        button.addEventListener('click', (e) => {
            e.preventDefault();
            toggleReadStatus(paperId, resultElement);
        });
        footerElement.appendChild(button);
    }

    // main function to process all results on the page.
    function processAllResults() {
        // selector for each search result container
        const results = document.querySelectorAll('.gs_r.gs_or.gs_scl');
        results.forEach(updateSingleResultUI);
    }

    await loadReadPapers();
    processAllResults();

})();
