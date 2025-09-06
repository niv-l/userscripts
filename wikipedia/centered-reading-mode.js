// ==UserScript==
// @name         Centered Reading Width (toggle Alt+T; h/l adjust; Esc locks)
// @description  Toggle a centered reading column with Alt+T; adjust width with h/l; Esc disables width adjustment.
// @author       Nivyan Lakhani
// @match        *://*.wikipedia.org/*
// @match        *://*.mediawiki.org/*
// @match        *://*.wikimedia.org/*
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';

  if (window.top !== window) return;

  let active = false;           // mode on/off
  let adjustEnabled = false;    // whether bindings are enabled
  let targetWidth = null;       // px

  const minWidth = 360;
  const maxWidth = 2400;
  const step = 40;

  let hudEl = null;
  let hudTimer = null;
  let styleEl = null;

  function ensureStyle() {
    if (styleEl) return;
    styleEl = document.createElement('style');
    styleEl.id = 'olivetti-userscript-style';
    styleEl.textContent = `
      body.olivetti-mode {
        padding-left: var(--olivetti-pad, 0) !important;
        padding-right: var(--olivetti-pad, 0) !important;
        box-sizing: border-box !important;
        overflow-x: hidden !important;
        transition: padding-left 120ms ease, padding-right 120ms ease;
      }
      #olivetti-hud {
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(20, 20, 20, 0.88);
        color: #fff;
        padding: 6px 10px;
        border-radius: 8px;
        font: 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        z-index: 2147483647;
        pointer-events: none;
        opacity: 0;
        transition: opacity 150ms ease;
        white-space: nowrap;
      }
    `;
    document.documentElement.appendChild(styleEl);
  }

  function ensureHud() {
    if (hudEl) return;
    hudEl = document.createElement('div');
    hudEl.id = 'olivetti-hud';
    document.documentElement.appendChild(hudEl);
  }

  function showHUD(text) {
    ensureHud();
    hudEl.textContent = text;
    hudEl.style.opacity = '1';
    if (hudTimer) clearTimeout(hudTimer);
    hudTimer = setTimeout(() => {
      if (hudEl) hudEl.style.opacity = '0';
    }, 900);
  }

  function computePad() {
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    if (targetWidth == null) {
      targetWidth = Math.min(900, Math.round(vw * 0.7));
    }
    targetWidth = Math.max(minWidth, Math.min(targetWidth, maxWidth));
    const pad = Math.max(0, Math.floor((vw - targetWidth) / 2));
    document.documentElement.style.setProperty('--olivetti-pad', pad + 'px');
    return pad;
  }

  function activate() {
    if (active) return;
    ensureStyle();
    active = true;
    adjustEnabled = true;

    computePad();
    document.body.classList.add('olivetti-mode');
    showHUD(`Olivetti on — ${targetWidth}px (h/l adjust; Esc locks)`);
    window.addEventListener('resize', onResize, true);
  }

  function deactivate() {
    if (!active) return;
    active = false;
    adjustEnabled = false;

    document.body.classList.remove('olivetti-mode');
    document.documentElement.style.removeProperty('--olivetti-pad');
    window.removeEventListener('resize', onResize, true);
    showHUD('Olivetti off');
  }

  function onResize() {
    if (!active) return;
    computePad();
  }

  function adjust(delta) {
    targetWidth = Math.max(minWidth, Math.min((targetWidth || 900) + delta, maxWidth));
    computePad();
    showHUD(`Width: ${targetWidth}px`);
  }

  function isEditable(el) {
    if (!el) return false;
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    return el.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select';
  }

  document.addEventListener('keydown', (e) => {
    const tgt = e.target;

    // Toggle mode: Alt+T
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 't') {
      if (!isEditable(tgt)) {
        e.preventDefault();
        e.stopPropagation();
        return (active ? deactivate() : activate());
      }
    }

    if (!active) return;
    if (isEditable(tgt)) return;

    // Esc: lock adjustments (keep mode on); don't block the page's own Esc behavior
    if (e.key === 'Escape') {
      adjustEnabled = false;
      showHUD('Adjustments locked (h/l disabled). Toggle with Alt+T to re-enable.');
      return;
    }

    // h/l adjust only when adjustments are enabled
    if (adjustEnabled && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const k = e.key.toLowerCase();
      if (k === 'h') {
        e.preventDefault();
        e.stopPropagation();
        return adjust(-step);
      } else if (k === 'l') {
        e.preventDefault();
        e.stopPropagation();
        return adjust(+step);
      }
    }
  }, true);
})();
