// ==UserScript==
// @name        Reuters Archive Redirect
// @author      Nivyan Lakhani
// @match       https://*.reuters.com/*
// @run-at      document-start
// @grant       none
// ==/UserScript==
(()=>{if(/archive\.today|archive\.is/.test(location.hostname))return;const r=/Subscribe to Reuters to continue reading/i,d=()=>{if(r.test(document.body?.innerText))location.replace('https://archive.today/'+location.href)};d();new MutationObserver(d).observe(document.documentElement,{childList:1,subtree:1})})();
