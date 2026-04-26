// SmartSpend — lightweight UI polish (no command palette)
(function () {
  function setFooterYear() {
    var el = document.getElementById('footer-year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  document.addEventListener('DOMContentLoaded', function () {
    setFooterYear();
(function () {
  var tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'wallets', label: 'Wallets' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'add', label: 'Add Transaction' },
    { key: 'budget', label: 'Budget' },
    { key: 'goals', label: 'Goals' },
    { key: 'split', label: 'Split' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'settings', label: 'Settings' },
    { key: 'feedback', label: 'Feedback' }
  ];

  var activeIndex = 0;

  function byId(id) {
    return document.getElementById(id);
  }

  function setFooterYear() {
    var el = byId('footer-year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function createPalette() {
    if (byId('cp-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'cp-overlay';
    overlay.className = 'cp-overlay';
    overlay.innerHTML = [
      '<div class="cp" role="dialog" aria-modal="true" aria-label="Quick navigation">',
      '  <div class="cp-head">',
      '    <input id="cp-input" class="cp-input" type="text" placeholder="Jump to a section..." autocomplete="off">',
      '  </div>',
      '  <div id="cp-list" class="cp-list"></div>',
      '  <div class="cp-help">Tip: Press <strong>Ctrl/Cmd + K</strong> anytime to open this quick switcher.</div>',
      '</div>'
    ].join('');

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closePalette();
    });

    byId('cp-input').addEventListener('input', renderItems);
    byId('cp-input').addEventListener('keydown', onPaletteKey);
    renderItems();
  }

  function openPalette() {
    createPalette();
    var overlay = byId('cp-overlay');
    var input = byId('cp-input');
    overlay.classList.add('open');
    input.value = '';
    renderItems();
    input.focus();
  }

  function closePalette() {
    var overlay = byId('cp-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function isPaletteOpen() {
    var overlay = byId('cp-overlay');
    return !!(overlay && overlay.classList.contains('open'));
  }

  function isTypingTarget(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
  }

  function filteredTabs() {
    var q = (byId('cp-input').value || '').trim().toLowerCase();
    if (!q) return tabs.slice();
    return tabs.filter(function (t) {
      return t.label.toLowerCase().indexOf(q) !== -1 || t.key.indexOf(q) !== -1;
    });
  }

  function renderItems() {
    var list = byId('cp-list');
    if (!list) return;

    var items = filteredTabs();
    activeIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));

    if (!items.length) {
      list.innerHTML = '<div class="cp-help">No matching section found.</div>';
      return;
    }

    list.innerHTML = items.map(function (t, idx) {
      var sel = idx === activeIndex ? ' sel' : '';
      return '<button class="cp-item' + sel + '" data-tab="' + t.key + '">' + t.label + '<span class="cp-kbd">↵</span></button>';
    }).join('');

    var buttons = list.querySelectorAll('.cp-item');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        jumpTo(this.getAttribute('data-tab'));
      });
    }
  }

  function jumpTo(tab) {
    if (typeof window.goTab === 'function') {
      window.goTab(tab);
      closePalette();
      if (tab === 'transactions') {
        var search = byId('search');
        if (search) setTimeout(function () { search.focus(); }, 120);
      }
    }
  }

  function onPaletteKey(e) {
    var items = filteredTabs();

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % Math.max(items.length, 1);
      renderItems();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1);
      renderItems();
      return;
    }

    if (e.key === 'Enter' && items[activeIndex]) {
      e.preventDefault();
      jumpTo(items[activeIndex].key);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    }
  }

  document.addEventListener('keydown', function (e) {
    var metaK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';

    if (metaK) {
      e.preventDefault();
      if (isPaletteOpen()) closePalette(); else openPalette();
      return;
    }

    if (e.key === 'Escape' && isPaletteOpen()) {
      closePalette();
      return;
    }

    if (e.key === '/' && !isTypingTarget(e.target)) {
      e.preventDefault();
      if (typeof window.goTab === 'function') window.goTab('transactions');
      var search = byId('search');
      if (search) setTimeout(function () { search.focus(); }, 100);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    setFooterYear();
    createPalette();
  });
})();
