// ==UserScript==
// @name         Wikipedia Power-Search
// @namespace    https://github.com/niv-l/userscripts/
// @version      1.2
// @description  Keyboard-centric search overlay for Wikipedia.
// @author       Nivyan Lakhani
// @match        *://*.wikipedia.org/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  // available bindings
  const BINDINGS = [
    { id: 'doubleCtrl', label: 'Double Ctrl', type: 'double', key: 'Control', interval: 400 },
    { id: 'ctrlK',      label: 'Ctrl + K',   type: 'combo',  key: 'k', ctrl: true        },
    { id: 'slash',      label: '/ (single)', type: 'single', key: '/'                     },
  ];

  const DEFAULT_BINDING_ID = 'doubleCtrl';

  // wrapper so the script still works if GM_* is missing (Firefox + Violentmonkey etc.)
  const storage = {
    get:  (k, d)  => (typeof GM_getValue === 'function') ? GM_getValue(k, d) : JSON.parse(localStorage.getItem(k) || 'null') ?? d,
    set:  (k, v)  => (typeof GM_setValue === 'function') ? GM_setValue(k, v) : localStorage.setItem(k, JSON.stringify(v)),
  };

  function getCurrentBinding () {
    const id = storage.get('wkqHotKey', DEFAULT_BINDING_ID);
    return BINDINGS.find(b => b.id === id) || BINDINGS[0];
  }

  function chooseBinding () {
    const labels = BINDINGS.map(b => `${b.id === getCurrentBinding().id ? '✓ ' : '  '} ${b.label}`)
                           .join('\n');
    const answer = prompt(
      'Wikipedia Power-Search --- choose opener:\n' +
      labels + '\n\n' +
      'Type the name (e.g. "ctrlK") or press Cancel to keep the current one.',
      getCurrentBinding().id
    );
    if (!answer) return;
    const newB = BINDINGS.find(b => b.id.toLowerCase() === answer.trim().toLowerCase());
    if (newB) {
      storage.set('wkqHotKey', newB.id);
      alert(`Hot-key switched to: ${newB.label}`);
    } else {
      alert('Unrecognised choice – nothing changed.');
    }
  }

  if (typeof GM_registerMenuCommand === 'function')
    GM_registerMenuCommand('Configure hot-key …', chooseBinding);

  let lastCtrlTime = 0;

  // key listener
  document.addEventListener('keydown', e => {
    const bind = getCurrentBinding();
    switch (bind.type) {
      case 'double':
        if (e.key === bind.key) {
          const now = Date.now();
          if (now - lastCtrlTime < bind.interval) {
            e.preventDefault();
            toggleOverlay(true);
          }
          lastCtrlTime = now;
        }
        break;

      case 'combo':
        if (e.key.toLowerCase() === bind.key &&
            (!!bind.ctrl === e.ctrlKey) &&
            (!!bind.shift === e.shiftKey) &&
            (!!bind.alt === e.altKey) ) {
          e.preventDefault();
          toggleOverlay(true);
        }
        break;

      case 'single':
        if (e.key === bind.key &&
            !e.ctrlKey && !e.metaKey && !e.altKey) {
          // let Wikipedia’s own search bar lose focus first
          if (document.activeElement && ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
          e.preventDefault();
          toggleOverlay(true);
        }
        break;
    }

    if (e.key === 'Escape' && overlay.style.display !== 'none') {
      toggleOverlay(false);
    }
  });

  const MAX_SUGGESTIONS = 12;
  const KEY_NAV_CLASS   = 'wkq-selected';

  GM_addStyle(`
    #wkq-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,.35); backdrop-filter: blur(2px);
      display:none; align-items:flex-start; justify-content:center;
      padding-top: 15vh;
    }
    #wkq-box {
      background:#fff; color:#202122; width:900px; max-width:90vw;
      border-radius:6px; box-shadow:0 6px 24px rgba(0,0,0,.25);
      display:flex; flex-direction:row; overflow:hidden; font-size:15px;
      height: 65vh; max-height: 700px;
    }
    #wkq-left {
      flex:1 1 40%; padding:16px; display:flex; flex-direction:column;
    }
    #wkq-input {
      width:95%; border:1px solid #a2a9b1; border-radius:4px;
      padding:8px 10px; font-size:17px; outline:none;
      flex-shrink: 0;
    }
    #wkq-list {
      margin:8px 0 0; list-style:none; padding:0; overflow-y:auto;
      flex-grow: 1;
    }
    #wkq-list li { padding:6px 8px; cursor:pointer; border-radius:4px; }
    #wkq-list li.${KEY_NAV_CLASS}, #wkq-list li:hover {
      background:#36c; color:#fff;
    }
    #wkq-right {
      flex:1 1 40%; min-width:200px; background:#f6f6f6; padding:16px;
      overflow-y:auto; border-left:1px solid #eaecf0;
    }
    #wkq-right h2 { font-size:18px; margin-top:0; }
    #wkq-right img { max-width:100%; height:auto; border-radius: 4px; }
  `);

  const overlay = document.createElement('div');
  overlay.id = 'wkq-overlay';
  overlay.innerHTML = `
    <div id="wkq-box" role="dialog" aria-label="Quick search">
      <div id="wkq-left">
        <input id="wkq-input" type="text" autocomplete="off" placeholder="Search Wikipedia…">
        <ul id="wkq-list"></ul>
      </div>
      <div id="wkq-right"><em>Start typing…</em></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input      = overlay.querySelector('#wkq-input');
  const listEl     = overlay.querySelector('#wkq-list');
  const previewEl  = overlay.querySelector('#wkq-right');

  function toggleOverlay(show) {
    overlay.style.display = show ? 'flex' : 'none';
    if (show) {
      input.value = '';
      listEl.innerHTML = '';
      previewEl.innerHTML = '<em>Start typing…</em>';
      input.focus();
    } else {
      input.blur();
    }
  }

  let fetchAbort = null;
  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q) {
      listEl.innerHTML = '';
      previewEl.innerHTML = '<em>Start typing…</em>';
      return;
    }
    if (fetchAbort) fetchAbort.abort();
    fetchAbort = new AbortController();

    const url = `https://${location.host}/w/api.php?` +
                new URLSearchParams({
                  action: 'opensearch',
                  format: 'json',
                  origin: '*',
                  search: q,
                  limit: MAX_SUGGESTIONS
                });
    fetch(url, {signal: fetchAbort.signal})
      .then(r => r.json())
      .then(data => {
        populateList(data[1], data[2]);
      })
      .catch(() => {});
  });

  function populateList(titles, descs) {
    listEl.innerHTML = '';
    titles.forEach((title, idx) => {
      const li = document.createElement('li');
      li.dataset.title = title;
      li.innerHTML = `<strong>${title}</strong><br><small>${descs[idx] || ''}</small>`;
      listEl.appendChild(li);
    });
    if (listEl.children.length > 0) selectIndex(0);
  }

  let selIndex = -1;
  input.addEventListener('keydown', e => {
    const total = listEl.children.length;
    if (!total) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectIndex((selIndex + 1) % total);
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectIndex((selIndex - 1 + total) % total);
        break;
      case 'Enter':
        e.preventDefault();
        openPage(getSel()?.dataset.title);
        break;
      case 'Escape':
        e.preventDefault();
        toggleOverlay(false);
        break;
    }
  });

  listEl.addEventListener('mouseover', e => {
    const li = e.target.closest('li');
    if (li) selectLi(li);
  });
  listEl.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (li) openPage(li.dataset.title);
  });

  function selectIndex(i) {
    const li = listEl.children[i];
    if (li) selectLi(li);
  }
  function selectLi(li) {
    [...listEl.children].forEach(x => x.classList.remove(KEY_NAV_CLASS));
    li.classList.add(KEY_NAV_CLASS);
    li.scrollIntoView({ block: 'nearest' });
    selIndex = [...listEl.children].indexOf(li);
    showPreview(li.dataset.title);
  }
  function getSel() {
    return listEl.children[selIndex];
  }

  // preview logic
  let previewAbort = null;
  function showPreview(title) {
    if (!title) return;
    if (previewAbort) previewAbort.abort();
    previewAbort = new AbortController();

    previewEl.innerHTML = '<em>Loading…</em>';
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {signal:previewAbort.signal})
      .then(r => r.json())
      .then(d => {
        if (d.title) {
            previewEl.innerHTML = `
            ${d.thumbnail ? `<img src="${d.thumbnail.source}" alt="">` : ''}
            <h2>${d.title}</h2>
            <div>${d.extract_html ?? d.extract}</div>`;
        } else {
            previewEl.innerHTML = `<h2>${title}</h2><em>No preview available.</em>`;
        }
      })
      .catch(() => {
        previewEl.innerHTML = `<h2>${title}</h2><em>Preview could not be loaded.</em>`;
      });
  }

  function openPage(title) {
    if (!title) return;
    location.href = `/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
  }
})();
