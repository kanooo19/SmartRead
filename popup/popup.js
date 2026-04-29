// ── DOM refs ──────────────────────────────────────────────────────────────────
const $toggle   = document.getElementById('enabledToggle');
const $sitePill = document.getElementById('sitePill');
const $count    = document.getElementById('fixCount');
const $btnFix   = document.getElementById('btnFix');
const $reading  = document.getElementById('readingToggle');
const $siteList = document.getElementById('siteList');
const $siteIn   = document.getElementById('siteInput');
const $btnAdd   = document.getElementById('btnAdd');
const $dirSegs  = document.querySelectorAll('#dirGroup .seg');
const $sizeSegs = document.querySelectorAll('#sizeGroup .seg');
const $fontOpts = document.querySelectorAll('[name="font"]');

let _tabId = null;
let _host  = '';

// ── Storage keys (must match content_script.js) ───────────────────────────────
const key = k => `smartread_${k}_${_host}`;

// ── Bootstrap ─────────────────────────────────────────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.url) return;
  _tabId = tab.id;

  try { _host = new URL(tab.url).hostname; } catch (_) {}

  $sitePill.textContent = _host || 'Unsupported';

  if (!_host) {
    $toggle.disabled = true;
    $btnFix.disabled = true;
    return;
  }

  // Fetch live state from content script
  chrome.tabs.sendMessage(_tabId, { type: 'GET_STATE' }, resp => {
    if (chrome.runtime.lastError || !resp) return;
    _applyState(resp.enabled, resp.fixCount, resp.dirMode, resp.readingMode);
  });

  // Restore font + size from storage (not in content script GET_STATE)
  chrome.storage.sync.get([key('font'), key('size')], result => {
    _setActiveFont(result[key('font')] || 'tajawal');
    _setActiveSize(result[key('size')] || 'medium');
  });
});

_loadCustomSites();

// ── Main toggle ────────────────────────────────────────────────────────────────
$toggle.addEventListener('change', () => {
  const enabled = $toggle.checked;
  chrome.tabs.sendMessage(_tabId, { type: 'SET_ENABLED', enabled }, resp => {
    if (resp) _applyState(resp.enabled, resp.fixCount);
  });
});

// ── Fix Page ───────────────────────────────────────────────────────────────────
$btnFix.addEventListener('click', () => {
  chrome.tabs.sendMessage(_tabId, { type: 'FIX_PAGE' }, resp => {
    if (resp) _animateCount(resp.fixCount);
  });
});

// ── Direction ──────────────────────────────────────────────────────────────────
$dirSegs.forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.dir;
    _setActiveDir(mode);
    chrome.tabs.sendMessage(_tabId, { type: 'SET_DIR_MODE', mode }, resp => {
      if (resp) _animateCount(resp.fixCount);
    });
  });
});

// ── Font size ──────────────────────────────────────────────────────────────────
$sizeSegs.forEach(btn => {
  btn.addEventListener('click', () => {
    const size = btn.dataset.size;
    _setActiveSize(size);
    chrome.storage.sync.set({ [key('size')]: size });
    chrome.tabs.sendMessage(_tabId, { type: 'SET_FONT_SIZE', size }, () => {
      if (chrome.runtime.lastError) {}
    });
  });
});

// ── Arabic Font ────────────────────────────────────────────────────────────────
$fontOpts.forEach(radio => {
  radio.addEventListener('change', () => {
    if (!radio.checked) return;
    const font = radio.value;
    chrome.storage.sync.set({ [key('font')]: font });
    chrome.tabs.sendMessage(_tabId, { type: 'SET_FONT', font }, () => {
      if (chrome.runtime.lastError) {}
    });
  });
});

// ── Reading Mode ───────────────────────────────────────────────────────────────
$reading.addEventListener('change', () => {
  const active = $reading.checked;
  chrome.tabs.sendMessage(_tabId, { type: 'SET_READING_MODE', active }, () => {
    if (chrome.runtime.lastError) {}
  });
});

// ── Custom Sites ───────────────────────────────────────────────────────────────
$btnAdd.addEventListener('click', _addSite);
$siteIn.addEventListener('keydown', e => { if (e.key === 'Enter') _addSite(); });

function _addSite() {
  const raw = $siteIn.value.trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!raw) return;
  $siteIn.value = '';
  chrome.storage.sync.get(['smartread_custom_sites'], r => {
    const sites = r.smartread_custom_sites || [];
    if (sites.includes(raw)) return;
    sites.push(raw);
    chrome.storage.sync.set({ smartread_custom_sites: sites }, () => _renderSites(sites));
  });
}

function _loadCustomSites() {
  chrome.storage.sync.get(['smartread_custom_sites'], r => {
    _renderSites(r.smartread_custom_sites || []);
  });
}

function _renderSites(sites) {
  $siteList.innerHTML = '';
  for (const site of sites) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${site}</span><button class="remove-btn" data-site="${site}" title="Remove">&times;</button>`;
    li.querySelector('.remove-btn').addEventListener('click', () => _removeSite(site));
    $siteList.appendChild(li);
  }
}

function _removeSite(site) {
  chrome.storage.sync.get(['smartread_custom_sites'], r => {
    const sites = (r.smartread_custom_sites || []).filter(s => s !== site);
    chrome.storage.sync.set({ smartread_custom_sites: sites }, () => _renderSites(sites));
  });
}

// ── Live count updates ─────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'FIX_COUNT' && msg.host === _host) {
    _animateCount(msg.count);
  }
});

// ── State helpers ──────────────────────────────────────────────────────────────
function _applyState(enabled, count, dirMode = 'auto', readingMode = false) {
  $toggle.checked  = enabled;
  $reading.checked = readingMode;
  _animateCount(count ?? 0);
  _setActiveDir(dirMode);
}

function _setActiveDir(mode) {
  $dirSegs.forEach(b => b.classList.toggle('active', b.dataset.dir === (mode || 'auto')));
}

function _setActiveSize(size) {
  $sizeSegs.forEach(b => b.classList.toggle('active', b.dataset.size === (size || 'medium')));
}

function _setActiveFont(font) {
  $fontOpts.forEach(r => { r.checked = r.value === (font || 'tajawal'); });
}

function _animateCount(n) {
  const current = parseInt($count.textContent, 10) || 0;
  if (n === current) { $count.textContent = n; return; }
  // Micro-animation: scale pulse
  $count.style.transform = 'scale(1.18)';
  $count.textContent = n;
  setTimeout(() => { $count.style.transform = ''; }, 200);
}
