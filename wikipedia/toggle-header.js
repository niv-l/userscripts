// ==UserScript==
// @name         Toggle Header - Wikipedia
// @author       Nivyan Lakhani
// @namespace    https://github.com/niv-l/userscripts
// @version      0.1
// @description  Collapses/expands the header bar on Vector 2010 & 2022 skins.
// @match        *://*.wikipedia.org/*
// @grant        none
// ==/UserScript==

(() => {
  // Hotkey Config
  const TOGGLE_KEY      = '\\';   // key the user presses
  const REQUIRE_CTRL    = true;   // require Ctrl / ⌘
  const REQUIRE_ALT     = false;
  const REQUIRE_SHIFT   = false;
  const LS_KEY          = 'userHeaderHidden';  // localStorage key
  const BODY_CLASS      = 'usr-header-hidden'; // toggled <body> class

  const css = `
.${BODY_CLASS} header.vector-header,
.${BODY_CLASS} .vector-sticky-header, /* Vector 2022 sticky */
.${BODY_CLASS} #mw-head,
.${BODY_CLASS} #mw-head-base,
.${BODY_CLASS} #p-personal,
.${BODY_CLASS} #mw-page-base           { display:none !important; }

/* 2) Remove the “reserved” top spacing so the article hugs the top */
.${BODY_CLASS} #content,
.${BODY_CLASS} .mw-body,
.${BODY_CLASS} .vector-body,
.${BODY_CLASS} .mw-page-container,
.${BODY_CLASS} .mw-body-content        { margin-top:0 !important; padding-top:0 !important; }
`;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);

  const body = document.body;
  const isHidden    = () => body.classList.contains(BODY_CLASS);
  const setHidden   = flag => {
        body.classList.toggle(BODY_CLASS, flag);
        try { localStorage.setItem(LS_KEY, flag ? '1' : '0'); } catch(e){}
  };
  const toggle      = () => setHidden(!isHidden());

  if (localStorage.getItem(LS_KEY) === '1') setHidden(true);

  document.addEventListener('keydown', e => {

        if (e.key !== TOGGLE_KEY) return;

        if (REQUIRE_CTRL  && !(e.ctrlKey || e.metaKey)) return;
        if (REQUIRE_ALT   && !e.altKey)   return;
        if (REQUIRE_SHIFT && !e.shiftKey) return;

        if (!REQUIRE_CTRL  && (e.ctrlKey || e.metaKey)) return;
        if (!REQUIRE_ALT   &&  e.altKey)  return;
        if (!REQUIRE_SHIFT &&  e.shiftKey) return;

        toggle();
        e.preventDefault();
        e.stopPropagation();
  });
})();
