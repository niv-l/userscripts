// ==UserScript==
// @name         Random Category Article - Wikipedia
// @namespace    https://github.com/niv-l/userscripts/
// @version      1.2
// @description  Adds a dice button next to Wikipedia category pages to go to a random article in that category.
// @author       Nivyan Lakhani
// @match        *://*.wikipedia.org/wiki/Category%3A*
// @match        *://*.wikipedia.org/wiki/Category:*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    const diceSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
             stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r=".5" fill="currentColor"></circle>
            <circle cx="15.5" cy="8.5" r=".5" fill="currentColor"></circle>
            <circle cx="15.5" cy="15.5" r=".5" fill="currentColor"></circle>
            <circle cx="8.5" cy="15.5" r=".5" fill="currentColor"></circle>
            <circle cx="12" cy="12" r=".5" fill="currentColor"></circle>
        </svg>
    `;

    GM_addStyle(`
        #cat-random-btn {
            display: inline-block;
            vertical-align: middle;
            margin-left: 8px;
            line-height: 1;
        }
        #cat-random-btn svg {
            color: #36c; /* Wikipedia link blue */
            opacity: 0.65;
            transition: opacity 0.15s ease-in-out;
            width: 22px;
            height: 22px;
            transform: translateY(-1px);
        }
        #cat-random-btn:hover svg {
            opacity: 1;
        }
    `);

    const heading = document.getElementById('firstHeading');
    if (!heading) return;

    const button = document.createElement('a');
    button.id = 'cat-random-btn';
    button.href = '#';
    button.title = 'Go to a random article in this category';
    button.innerHTML = diceSVG;

    button.addEventListener('click', async (e) => {
        e.preventDefault();
        button.style.pointerEvents = 'none';

        const categoryName = `Category:${heading.textContent.replace('Category:', '').trim()}`;
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

    heading.appendChild(button);
})();
