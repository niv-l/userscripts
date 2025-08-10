// ==UserScript==
// @name         Wikipedia Article Info
// @description  Displays word count and article status, replaces the typical tagline.
// @author       Nivyan Lakhani
// @match        https://*.wikipedia.org/wiki/*
// @exclude      https://*.wikipedia.org/wiki/Special:*
// @exclude      https://*.wikipedia.org/wiki/File:*
// @exclude      https://*.wikipedia.org/wiki/Main_Page
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // We inject our css styles, edit this if you want a different style.
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Hide tagline */
            #siteSub { display: none !important; }

            #userscript-article-info {
                font-size: 0.8em;
                color: #54595d; /* Standard Wikipedia subtitle color */
                margin: 0.7em 0 0.2em;
            }
            #userscript-article-info strong {
                color: #202122; /* standard Wikipedia text color */
            }
            .userscript-status-featured {
                font-weight: bold;
                color: #b48c2c; /* gold for featured articles */
            }
            .userscript-status-good {
                font-weight: bold;
                color: #008000; /* green for good articles */
            }
            /* Subtle tints for assessment classes */
            .userscript-status-a    { font-weight: 600; color: #202122; }
            .userscript-status-b    { font-weight: 600; color: #202122; }
            .userscript-status-c    { font-weight: 600; color: #202122; }
            .userscript-status-list { font-weight: 600; color: #202122; }
            .userscript-status-start{ color: #54595d; }
            .userscript-status-stub { color: #72777d; }
        `;
        document.head.appendChild(style);
    }

    // We find the article status by the mediawiki indicator as a first resort.
    function getArticleStatus() {
        if (document.getElementById('mw-indicator-featured-article') ||
            document.getElementById('mw-indicator-featured-star')) {
            return { text: 'Featured Article', className: 'userscript-status-featured' };
        }
        if (document.getElementById('mw-indicator-good-article') ||
            document.getElementById('mw-indicator-good-star')) {
            return { text: 'Good Article', className: 'userscript-status-good' };
        }
        return null; // Let assessment API fill in A/B/C/Start/Stub if possible
    }

    /**
     * Fetches A/B/C/Start/Stub (and FL/GA/FA if present) via PageAssessments API.
     * Only returns something if available; otherwise null.
     */
    async function getAssessmentStatus() {
        try {
            if (!window.mw || !mw.config) return null;
            if (mw.config.get('wgNamespaceNumber') !== 0) return null;

            const title = mw.config.get('wgPageName');
            if (!title) return null;

            const url = `${location.origin}/w/api.php?action=query&prop=pageassessments&titles=${encodeURIComponent(title)}&format=json&origin=*`;
            const res = await fetch(url);
            if (!res.ok) return null;
            const data = await res.json();
            const pages = data?.query?.pages;
            if (!pages) return null;

            const rank = { FA: 8, FL: 7, GA: 6, A: 5, B: 4, C: 3, List: 3, Start: 2, Stub: 1 };
            const normalize = c => {
                if (!c) return null;
                const s = String(c).trim();
                const low = s.toLowerCase();
                if (low === 'fa') return 'FA';
                if (low === 'fl') return 'FL';
                if (low === 'ga') return 'GA';
                if (low === 'a') return 'A';
                if (low === 'b' || low === 'b-class' || low === 'b+') return 'B';
                if (low === 'c' || low === 'c-class') return 'C';
                if (low === 'list' || low === 'list-class' || /^list/i.test(s)) return 'List';
                if (/^start/i.test(s)) return 'Start';
                if (/^stub/i.test(s)) return 'Stub';
                return null;
            };

            let best = null;
            Object.values(pages).forEach(p => {
                const pa = p.pageassessments || {};
                Object.values(pa).forEach(a => {
                    const cls = normalize(a.class);
                    if (cls && (!best || (rank[cls] || 0) > (rank[best] || 0))) {
                        best = cls;
                    }
                });
            });

            if (!best) return null;

            const map = {
                FA:   { text: 'Featured Article', className: 'userscript-status-featured' },
                FL:   { text: 'Featured List',    className: 'userscript-status-featured' },
                GA:   { text: 'Good Article',     className: 'userscript-status-good' },
                A:    { text: 'A-Class',          className: 'userscript-status-a' },
                B:    { text: 'B-Class',          className: 'userscript-status-b' },
                C:    { text: 'C-Class',          className: 'userscript-status-c' },
                List: { text: 'List-Class',       className: 'userscript-status-list' },
                Start:{ text: 'Start-Class',      className: 'userscript-status-start' },
                Stub: { text: 'Stub-Class',       className: 'userscript-status-stub' }
            };
            return map[best] || null;
        } catch {
            return null;
        }
    }

    // Now we calculate the word count of the main article content.
    function getWordCount(contentElement) {
        // Work on a clone so we don't modify the page
        const clone = contentElement.cloneNode(true);

        // Remove references list and inline citation markers
        clone.querySelectorAll('ol.references, .reflist, .mw-references-wrap, sup.reference')
             .forEach(el => el.remove());

        // Count remaining words
        const text = clone.textContent;
        const words = text.trim().split(/\s+/).filter(Boolean);
        return words.length;
    }


    async function main() {
        const content = document.querySelector('#mw-content-text .mw-parser-output');
        const siteSub = document.getElementById('siteSub');

        // Keep the same insertion point behavior
        if (!content || !siteSub) {
            return;
        }

        // 1) Hide tagline + styles
        addStyles();

        // 2) Data
        const wordCount = getWordCount(content);

        // Prefer on-page FA/GA indicators; otherwise try assessment class
        let status = getArticleStatus();
        if (!status) {
            status = await getAssessmentStatus();
        }
        if (!status) {
            status = { text: 'Standard Article', className: '' };
        }

        // 3) Create the new element to display the info
        const infoDiv = document.createElement('div');
        infoDiv.id = 'userscript-article-info';
        infoDiv.innerHTML = `
            Word Count: <strong>${wordCount.toLocaleString()}</strong>
            <span style="margin: 0 0.5em;">|</span>
            Status: <span class="${status.className}">${status.text}</span>
        `;

        // 4) Insert exactly where the tagline used to be
        siteSub.after(infoDiv);
    }

    main();

})();
