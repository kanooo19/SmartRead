let enabled     = true;
let fixCount    = 0;
let readingMode = false;
let observer    = null;

const SITE_KEY    = `smartread_enabled_${location.hostname}`;
const DIR_KEY     = `smartread_dir_${location.hostname}`;
const READING_KEY = `smartread_reading_${location.hostname}`;

// Site-specific selectors for AI tool chat output containers
const CHAT_SELECTORS = {
  'claude.ai':          '[data-testid="assistant-message"], .font-claude-message, .prose',
  'gemini.google.com':  'message-content, .response-content, model-response .markdown'
};

function getChatSelector() {
  for (const host of Object.keys(CHAT_SELECTORS)) {
    if (location.hostname.includes(host)) return CHAT_SELECTORS[host];
  }
  return 'body';
}

function runFix() {
  const selector   = getChatSelector();
  const containers = document.querySelectorAll(selector);
  const targets    = containers.length ? containers : [document.body];
  targets.forEach(el => {
    fixCount += fixSubtree(el);
    initBlockEngine(el);        // V3: attach ✨ buttons to readable blocks
  });
  notifyCount();
}

function runUnfix() {
  destroyBlockEngine(document.body);  // V3: restore structured blocks + remove buttons
  unfixSubtree(document.body);
  fixCount = 0;
  notifyCount();
}

function notifyCount() {
  chrome.runtime.sendMessage({ type: 'FIX_COUNT', count: fixCount, host: location.hostname });
}

function applyReadingMode(active) {
  readingMode = active;
  document.body.classList.toggle('sr-reading-mode', active);
}

function startObserver() {
  if (observer) return;
  observer = new MutationObserver(mutations => {
    if (!enabled) return;
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          fixCount += fixSubtree(node);
          initBlockEngine(node);    // V3: attach buttons to newly streamed blocks
        } else if (node.nodeType === Node.TEXT_NODE) {
          if (fixTextNode(node)) fixCount++;
        }
      }
    }
    notifyCount();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver() {
  if (observer) { observer.disconnect(); observer = null; }
}

// Load all persisted state and initialize
chrome.storage.sync.get([SITE_KEY, DIR_KEY, READING_KEY], result => {
  enabled = result[SITE_KEY] !== false;
  setDirMode(result[DIR_KEY] || 'auto');
  applyReadingMode(result[READING_KEY] === true);
  if (enabled) { runFix(); startObserver(); }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_STATE') {
    sendResponse({ enabled, fixCount, dirMode: getDirMode(), readingMode });

  } else if (msg.type === 'SET_ENABLED') {
    enabled = msg.enabled;
    chrome.storage.sync.set({ [SITE_KEY]: enabled });
    if (enabled) { runFix(); startObserver(); }
    else { stopObserver(); runUnfix(); }
    sendResponse({ enabled, fixCount });

  } else if (msg.type === 'FIX_PAGE') {
    runFix();
    sendResponse({ fixCount });

  } else if (msg.type === 'SET_DIR_MODE') {
    setDirMode(msg.mode);
    chrome.storage.sync.set({ [DIR_KEY]: msg.mode });
    runUnfix();
    runFix();
    sendResponse({ fixCount });

  } else if (msg.type === 'SET_READING_MODE') {
    applyReadingMode(msg.active);
    chrome.storage.sync.set({ [READING_KEY]: msg.active });
    sendResponse({ ok: true });
  }

  return true;
});
