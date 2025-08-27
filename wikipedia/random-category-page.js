// ==UserScript==
// @name         Random Category Article - Wikipedia
// @namespace    https://github.com/niv-l/userscripts/
// @version      1.6
// @description  Adds a dice button next to Wikipedia category pages to go to a random article in that category or subcategory.
// @author       Nivyan Lakhani
// @match        *://*.wikipedia.org/*
// @match        *://*.mediawiki.org/*
// @match        *://*.wikimedia.org/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    const shuffleSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
             stroke-linejoin="round">
            <polyline points="16 3 21 3 21 8"></polyline>
            <line x1="4" y1="20" x2="21" y2="3"></line>
            <polyline points="21 16 21 21 16 21"></polyline>
            <line x1="15" y1="15" x2="21" y2="21"></line>
            <line x1="4" y1="4" x2="9" y2="9"></line>
        </svg>
    `;

    const sitemapSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
             stroke-linejoin="round">
            <rect x="3" y="3" width="6" height="6"></rect>
            <rect x="15" y="15" width="6" height="6"></rect>
            <rect x="15" y="3" width="6" height="6"></rect>
            <path d="M6 9v6h6"></path>
            <path d="M15 9h-3v6"></path>
        </svg>
    `;

    const layersSVG = `
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
    `;

    const CACHE_KEY = 'randomCategoryLastSearch';

    GM_addStyle(`
        .cat-random-btn {
            display: inline-block;
            vertical-align: middle;
            margin-left: 8px;
            line-height: 1;
        }
        .cat-random-btn svg {
            color: #36c; /* Wikipedia link blue */
            opacity: 0.65;
            transition: opacity 0.15s ease-in-out;
            width: 20px;
            height: 20px;
            transform: translateY(-1px);
        }
        .cat-random-btn:hover svg {
            opacity: 1;
        }
    `);

    async function executeSearch(category, depth) {
        document.body.style.cursor = 'wait';
        try {
            const allPages = new Map();
            let subcatsToScan = [{ title: category }];

            for (let currentDepth = 0; currentDepth <= depth; currentDepth++) {
                if (subcatsToScan.length === 0) break;

                const isLastLevel = currentDepth === depth;
                const cmtype = isLastLevel ? 'page' : 'page|subcat';
                const promises = subcatsToScan.map(cat =>
                    fetch(`/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(cat.title)}&cmlimit=500&cmtype=${cmtype}&format=json&origin=*`).then(res => res.json())
                );

                const results = await Promise.all(promises);
                subcatsToScan = [];

                for (const result of results) {
                    const members = result?.query?.categorymembers || [];
                    for (const member of members) {
                        if (member.ns === 14) {
                            subcatsToScan.push(member);
                        } else {
                            allPages.set(member.pageid, member);
                        }
                    }
                }
            }

            const uniquePages = Array.from(allPages.values());
            if (uniquePages.length > 0) {
                const randomPage = uniquePages[Math.floor(Math.random() * uniquePages.length)];
                window.location.href = `/wiki/${encodeURIComponent(randomPage.title.replace(/ /g, '_'))}`;
            } else {
                 document.body.style.cursor = 'default';
            }
        } catch (error) {
            console.error('Random Category Search Error:', error);
            document.body.style.cursor = 'default';
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 'r') {
            e.preventDefault();
            const lastSearchJSON = localStorage.getItem(CACHE_KEY);
            if (lastSearchJSON) {
                const { category, depth } = JSON.parse(lastSearchJSON);
                executeSearch(category, depth);
            }
        }
    });

    if (document.body.classList.contains('ns-14')) {
        const heading = document.getElementById('firstHeading');
        if (!heading) return;

        const categoryName = `Category:${heading.textContent.replace(/^.+?:/, '').trim()}`;

        function createButton(title, svg, depth) {
            const button = document.createElement('a');
            button.className = 'cat-random-btn';
            button.href = '#';
            button.title = `${title} (Alt+R to run again)`;
            button.innerHTML = svg;
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const searchParams = { category: categoryName, depth };
                localStorage.setItem(CACHE_KEY, JSON.stringify(searchParams));
                executeSearch(searchParams.category, searchParams.depth);
            });
            return button;
        }

        const button = createButton('Go to a random article in this category', shuffleSVG, 0);
        const deepButton = createButton('Go to a random article in this category or its subcategories (1 level deep)', sitemapSVG, 1);
        const deepestButton = createButton('Go to a random article in this category or its subcategories (2 levels deep)', layersSVG, 2);

        heading.appendChild(button);
        heading.appendChild(deepButton);
        heading.appendChild(deepestButton);
    }
})();
