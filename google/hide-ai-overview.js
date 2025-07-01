// ==UserScript==
// @name         Hide Google's AI Overview Section
// @description  Hide AI Panel in Google search
// @author       Nivyan Lakhani
// @match        https://www.google.com/search?q=*
// @run-at       document-end
// @grant        none
// ==/UserScript==

document.querySelector("[jscontroller='qTdDb']")?.remove();
