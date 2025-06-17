// ==UserScript==
// @name         Random Category Article - Wikipedia
// @namespace    https://github.com/niv-l/userscripts/
// @version      1.3
// @description  Adds a dice button next to Wikipedia category pages to go to a random article in that category.
// @author       Nivyan Lakhani
// @match        *://*.wikipedia.org/wiki/Category%3A*
// @match        *://*.wikipedia.org/wiki/Category:*
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

    const heading = document.getElementById('firstHeading');
    if (!heading) return;

    const categoryName = `Category:${heading.textContent.replace('Category:', '').trim()}`;

    const button = document.createElement('a');
    button.className = 'cat-random-btn';
    button.href = '#';
    button.title = 'Go to a random article in this category';
    button.innerHTML = shuffleSVG;

    button.addEventListener('click', async (e) => {
        e.preventDefault();
        button.style.pointerEvents = 'none';

        const apiUrl = `/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(categoryName)}&cmlimit=500&cmtype=page&format=json&origin=*`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            const members = data?.query?.categorymembers;

            if (members && members.length > 0) {
                const randomMember = members[Math.floor(Math.random() * members.length)];
                window.location.href = `/wiki/${encodeURIComponent(randomMember.title.replace(/ /g, '_'))}`;
            } else {
                button.style.pointerEvents = 'auto';
            }
        } catch (error) {
            console.error('Random Category Article Error:', error);
            button.style.pointerEvents = 'auto';
        }
    });

    const deepButton = document.createElement('a');
    deepButton.className = 'cat-random-btn';
    deepButton.href = '#';
    deepButton.title = 'Go to a random article in this category or its subcategories (1 level deep)';
    deepButton.innerHTML = sitemapSVG;

    deepButton.addEventListener('click', async (e) => {
        e.preventDefault();
        deepButton.style.pointerEvents = 'none';

        try {
            const allPages = new Map();
            const parentUrl = `/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(categoryName)}&cmlimit=500&cmtype=page|subcat&format=json&origin=*`;

            const parentRes = await fetch(parentUrl);
            const parentData = await parentRes.json();
            const parentMembers = parentData?.query?.categorymembers || [];

            const subcatPromises = [];
            for (const member of parentMembers) {
                if (member.ns === 14) { // Namespace 14 is Category
                    const subcatUrl = `/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(member.title)}&cmlimit=500&cmtype=page&format=json&origin=*`;
                    subcatPromises.push(fetch(subcatUrl).then(res => res.json()));
                } else {
                    allPages.set(member.pageid, member);
                }
            }

            const subcatResults = await Promise.all(subcatPromises);
            for (const result of subcatResults) {
                const subcatMembers = result?.query?.categorymembers || [];
                for (const member of subcatMembers) {
                    allPages.set(member.pageid, member);
                }
            }

            const uniquePages = Array.from(allPages.values());

            if (uniquePages.length > 0) {
                const randomPage = uniquePages[Math.floor(Math.random() * uniquePages.length)];
                window.location.href = `/wiki/${encodeURIComponent(randomPage.title.replace(/ /g, '_'))}`;
            } else {
                deepButton.style.pointerEvents = 'auto';
            }
        } catch (error) {
            console.error('Deep Random Category Article Error:', error);
            deepButton.style.pointerEvents = 'auto';
        }
    });

    heading.appendChild(button);
    heading.appendChild(deepButton);
})();
