// ==UserScript==
// @name         Mark as read - Google Scholar
// @version      0.5
// @description  Marks Google Scholar papers as 'read' and adds a visual tag.
// @author       Nivyan Lakhani
// @match        *://scholar.google.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

// Google Scholar natively supports an option to "Save" a paper by clicking on the star icon.
// Though this functionality is similar to ours, I have only seen people using the functionality
// to mark papers as 'to read'.

(async function() {
    'use strict';

    const STORAGE_KEY = 'scholarReadPapers';
    let readPapers = new Set();

    // add some css to make our tag and button look nice.
    GM_addStyle(`
        a.read-marker-tag, a.read-marker-toggle {
            text-decoration: none;
            color: white !important;
        }
        .read-marker-tag {
            background-color: #28a745;
            color: white;
            padding: 2px 6px;
            font-size: 0.6em;
            font-weight: bold;
            border-radius: 4px;
            margin-right: 8px;
            margin-left: 8px;
            vertical-align: middle;
            cursor: pointer;
            user-select: none; /* Prevent text selection on click */
            transition: background-color 0.15s ease-in-out;
        }
        .read-marker-tag:hover {
            background-color: #A3BE8C;
        }
        .read-marker-toggle {
            display: inline-flex; /* Use flex to center the SVG */
            align-items: center;
            justify-content: center;
            width: 17px;
            height: 17px;
            margin-right: 8px;
            margin-left: 8px;
            vertical-align: middle;
            cursor: pointer;
            user-select: none; /* Prevent text selection on click */
            opacity: 0.4;
            transition: opacity 0.15s ease-in-out;
            border: 1px solid #ccc;
            border-radius: 4px;
            position: relative;
            top: -1px;
        }
        .read-marker-toggle:hover {
            opacity: 1;
            border-color: #888;
        }
        .read-marker-toggle svg {
            width: 12px;
            height: 14px;
            fill: currentColor;
        }
    `);

    // load the list of read paper ids from storage.
    async function loadReadPapers() {
        const storedData = await GM_getValue(STORAGE_KEY, '[]');
        try {
            readPapers = new Set(JSON.parse(storedData));
        } catch (e) {
            console.error('Mark-as-Read: Could not parse read papers data:', e);
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

        // if the result doesn't have a title link, skip it.
        if (!titleLink) {
            return;
        }

        const paperId = titleLink.href; // Use the paper's URL as its unique ID.
        const isRead = readPapers.has(paperId);

        // remove any old indicators we might have added before.
        resultElement.querySelector('.read-marker-tag')?.remove();
        resultElement.querySelector('.read-marker-toggle')?.remove();
        resultElement.querySelector('.read-marker-button')?.remove();

        const toggleElement = document.createElement('a');
        toggleElement.href = '#';

        if (isRead) {
            toggleElement.className = 'read-marker-tag';
            toggleElement.textContent = 'READ';
            toggleElement.title = 'Click to mark as unread';
        } else {
            toggleElement.className = 'read-marker-toggle';
            toggleElement.title = 'Click to mark as read';
            // checkmark svg icon
            toggleElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
        }

        toggleElement.addEventListener('click', (e) => {
            e.preventDefault(); // stop click from navigating to '#'
            e.stopPropagation(); // stop click from propagating to the title link
            toggleReadStatus(paperId, resultElement);
        });

        titleElement.append(toggleElement);
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
