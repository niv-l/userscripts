// ==UserScript==
// @name        Reuters Archive Redirect
// @author      Nivyan Lakhani
// @match       https://*.reuters.com/*
// @run-at      document-start
// @grant       none
// ==/UserScript==
(() => {
  if (/archive\.(today|ph|is)$/.test(location.hostname)) return;
  const w = /Subscribe to Reuters to continue reading/i,
        f = () => w.test(document.body?.innerText) && location.replace('https://archive.today/newest/' + encodeURIComponent(location.href));
  f();
  new MutationObserver(f).observe(document.documentElement, { childList: 1, subtree: 1 });
})();
