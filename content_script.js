// ── State ──────────────────────────────────────────────────────────────────────
let _enabled     = true;
let _fixCount    = 0;
let _readingMode = false;

// ── Storage keys ───────────────────────────────────────────────────────────────
const H         = location.hostname;
const KEY_ON    = `smartread_enabled_${H}`;
const KEY_DIR   = `smartread_dir_${H}`;
const KEY_READ  = `smartread_reading_${H}`;
const KEY_FONT  = `smartread_font_${H}`;
const KEY_SIZE  = `smartread_size_${H}`;

// ── Chat container selectors ───────────────────────────────────────────────────
const CHAT_SEL = {
  'claude.ai':         '[data-testid="assistant-message"], .font-claude-message, .prose',
  'gemini.google.com': 'message-content, .response-content, model-response .markdown',
};

function _chatSelector() {
  for (const [host, sel] of Object.entries(CHAT_SEL)) {
    if (H.includes(host)) return sel;
  }
  return 'body';
}

// ── Core operations ────────────────────────────────────────────────────────────
function _processPage() {
  setFabState('loading');
  const containers = document.querySelectorAll(_chatSelector());
  const targets    = containers.length ? [...containers] : [document.body];
  _fixCount = 0;
  targets.forEach(el => { _fixCount += processRoot(el); });
  setFabState('active');
  _notify();
}

function _resetPage() {
  resetRoot(document.body);
  _fixCount = 0;
  setFabState('idle');
  _notify();
}

function _notify() {
  chrome.runtime.sendMessage({ type: 'FIX_COUNT', count: _fixCount, host: H })
    .catch(() => {});
}

function _applyReadingMode(active) {
  _readingMode = active;
  document.body.classList.toggle('sr-reading-mode', active);
}

// ── FAB click handler ──────────────────────────────────────────────────────────
function _onFabClick() {
  if (getFabState() === 'active') {
    _resetPage();
  } else {
    _processPage();
  }
}

// ── Initialization ─────────────────────────────────────────────────────────────
chrome.storage.sync.get([KEY_ON, KEY_DIR, KEY_READ, KEY_FONT, KEY_SIZE], result => {
  _enabled = result[KEY_ON] !== false;

  setDirMode(result[KEY_DIR] || 'auto');
  _applyReadingMode(result[KEY_READ] === true);
  applyFont(result[KEY_FONT] || 'tajawal');
  setFontSize(result[KEY_SIZE] || 'medium');

  if (_enabled) {
    createFab(_onFabClick);
    initInputEnhancer();
    startObserver(node => {
      const n = processRoot(node);
      if (n > 0) { _fixCount += n; _notify(); }
    });
  }
});

// ── Message listener ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {

  if (msg.type === 'GET_STATE') {
    sendResponse({ enabled: _enabled, fixCount: _fixCount, dirMode: getDirMode(), readingMode: _readingMode });

  } else if (msg.type === 'SET_ENABLED') {
    _enabled = msg.enabled;
    chrome.storage.sync.set({ [KEY_ON]: _enabled });
    if (_enabled) {
      createFab(_onFabClick);
      startObserver(node => { _fixCount += processRoot(node); _notify(); });
    } else {
      stopObserver();
      removeFab();
      destroyInputEnhancer();
      _resetPage();
    }
    sendResponse({ enabled: _enabled, fixCount: _fixCount });

  } else if (msg.type === 'FIX_PAGE') {
    _processPage();
    sendResponse({ fixCount: _fixCount });

  } else if (msg.type === 'SET_DIR_MODE') {
    setDirMode(msg.mode);
    chrome.storage.sync.set({ [KEY_DIR]: msg.mode });
    _resetPage();
    _processPage();
    sendResponse({ fixCount: _fixCount });

  } else if (msg.type === 'SET_READING_MODE') {
    _applyReadingMode(msg.active);
    chrome.storage.sync.set({ [KEY_READ]: msg.active });
    sendResponse({ ok: true });

  } else if (msg.type === 'SET_FONT') {
    applyFont(msg.font);
    chrome.storage.sync.set({ [KEY_FONT]: msg.font });
    sendResponse({ ok: true });

  } else if (msg.type === 'SET_FONT_SIZE') {
    setFontSize(msg.size);
    chrome.storage.sync.set({ [KEY_SIZE]: msg.size });
    sendResponse({ ok: true });
  }

  return true;
});
