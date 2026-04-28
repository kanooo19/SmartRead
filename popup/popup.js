const toggleEl       = document.getElementById('toggle');
const statusDot      = document.getElementById('statusDot');
const hostnameEl     = document.getElementById('hostname');
const fixCountEl     = document.getElementById('fixCount');
const fixBtn         = document.getElementById('fixBtn');
const readingModeEl  = document.getElementById('readingMode');
const siteList       = document.getElementById('siteList');
const siteInput      = document.getElementById('siteInput');
const addSiteBtn     = document.getElementById('addSiteBtn');
const dirBtns        = document.querySelectorAll('.dir-btn');

let currentTabId = null;
let currentHost  = '';

// ── Bootstrap ──────────────────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  currentTabId = tab.id;

  try { currentHost = new URL(tab.url).hostname; } catch (_) { currentHost = ''; }

  hostnameEl.textContent = currentHost || 'Unsupported page';

  if (!currentHost) {
    toggleEl.disabled = true;
    fixBtn.disabled = true;
    return;
  }

  chrome.tabs.sendMessage(currentTabId, { type: 'GET_STATE' }, resp => {
    if (chrome.runtime.lastError || !resp) return;
    applyState(resp.enabled, resp.fixCount, resp.dirMode, resp.readingMode);
  });
});

loadCustomSites();

// ── Main toggle ─────────────────────────────────────────
toggleEl.addEventListener('change', () => {
  const enabled = toggleEl.checked;
  statusDot.classList.toggle('off', !enabled);
  chrome.tabs.sendMessage(currentTabId, { type: 'SET_ENABLED', enabled }, resp => {
    if (resp) applyState(resp.enabled, resp.fixCount);
  });
});

// ── Fix This Page ───────────────────────────────────────
fixBtn.addEventListener('click', () => {
  chrome.tabs.sendMessage(currentTabId, { type: 'FIX_PAGE' }, resp => {
    if (resp) fixCountEl.textContent = resp.fixCount;
  });
});

// ── Direction segmented control ─────────────────────────
dirBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    setActiveDirBtn(mode);
    chrome.tabs.sendMessage(currentTabId, { type: 'SET_DIR_MODE', mode }, () => {
      if (chrome.runtime.lastError) {}
    });
  });
});

// ── Reading Mode ────────────────────────────────────────
readingModeEl.addEventListener('change', () => {
  const active = readingModeEl.checked;
  chrome.tabs.sendMessage(currentTabId, { type: 'SET_READING_MODE', active }, () => {
    if (chrome.runtime.lastError) {}
  });
});

// ── Custom sites ────────────────────────────────────────
addSiteBtn.addEventListener('click', addCustomSite);
siteInput.addEventListener('keydown', e => { if (e.key === 'Enter') addCustomSite(); });

function addCustomSite() {
  const raw = siteInput.value.trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!raw) return;
  siteInput.value = '';

  chrome.storage.sync.get(['smartread_custom_sites'], result => {
    const sites = result.smartread_custom_sites || [];
    if (sites.includes(raw)) return;
    sites.push(raw);
    chrome.storage.sync.set({ smartread_custom_sites: sites }, () => renderSiteList(sites));
  });
}

function loadCustomSites() {
  chrome.storage.sync.get(['smartread_custom_sites'], result => {
    renderSiteList(result.smartread_custom_sites || []);
  });
}

function renderSiteList(sites) {
  siteList.innerHTML = '';
  for (const site of sites) {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="site-name">${site}</span>
      <button class="remove-btn" data-site="${site}" title="Remove">&times;</button>`;
    siteList.appendChild(li);
  }
  siteList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => removeCustomSite(btn.dataset.site));
  });
}

function removeCustomSite(site) {
  chrome.storage.sync.get(['smartread_custom_sites'], result => {
    const sites = (result.smartread_custom_sites || []).filter(s => s !== site);
    chrome.storage.sync.set({ smartread_custom_sites: sites }, () => renderSiteList(sites));
  });
}

// ── State helpers ───────────────────────────────────────
function applyState(enabled, count, dirMode = 'auto', readingMode = false) {
  toggleEl.checked = enabled;
  fixCountEl.textContent = count ?? 0;
  statusDot.classList.toggle('off', !enabled);
  setActiveDirBtn(dirMode);
  readingModeEl.checked = readingMode;
}

function setActiveDirBtn(mode) {
  dirBtns.forEach(btn =>
    btn.classList.toggle('active', btn.dataset.mode === (mode || 'auto'))
  );
}

// ── Live count updates from content script ──────────────
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'FIX_COUNT' && msg.host === currentHost) {
    fixCountEl.textContent = msg.count;
  }
});
