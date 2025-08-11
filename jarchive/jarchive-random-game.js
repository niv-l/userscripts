// ==UserScript==
// @name         J-Archive Go To Random Game
// @author       Nivyan Lakhani
// @version      1.0
// @description  Press Alt R to go to a random day's game.
// @match        https://j-archive.com/*
// @match        https://*.j-archive.com/*
// @match        http://j-archive.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const MIN_ID = 1;

  // I calculated the base ID as simply the last ID of the day that I wrote
  // the script. I am aware that I could browse the home page for the latest
  // game but this is more computationally expensive then just calculating this
  // at runtime.
  const BASE_ID = 9262;                   // 2025-07-25 → 9262
  const BASE_UTC = Date.UTC(2025, 6, 25); // months are 0-based: July=6
  const MS_DAY = 86400000;

  const todayUTCStart = () => {
    const d = new Date();
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };

  const latestId = () =>
    BASE_ID + Math.max(0, Math.floor((todayUTCStart() - BASE_UTC) / MS_DAY));

  const rand = (min, max) => (Math.floor(Math.random() * (max - min + 1)) + min);

  const go = () => {
    const id = rand(MIN_ID, latestId());
    location.assign(`${location.origin}/showgame.php?game_id=${id}`);
  };

  addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      go();
    }
  }, true);
})();
