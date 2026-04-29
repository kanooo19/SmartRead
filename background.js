// Inject SmartRead into user-defined custom sites on startup and tab load

const SCRIPTS = [
  'content/direction.js',
  'content/engine.js',
  'content/typography.js',
  'content/observer.js',
  'content/ui.js',
  'content/input_enhancer.js',
  'content_script.js',
];

const CSS_FILES = ['styles/content.css'];

chrome.storage.sync.get(['smartread_custom_sites'], result => {
  const sites = result.smartread_custom_sites || [];
  if (!sites.length) return;

  chrome.tabs.query({}, tabs => {
    for (const tab of tabs) {
      if (_matchesSite(tab.url, sites)) _injectTab(tab.id);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  chrome.storage.sync.get(['smartread_custom_sites'], result => {
    const sites = result.smartread_custom_sites || [];
    if (_matchesSite(tab.url, sites)) _injectTab(tabId);
  });
});

function _matchesSite(url, sites) {
  try {
    const hostname = new URL(url).hostname;
    return sites.some(site => hostname.includes(site));
  } catch (_) {
    return false;
  }
}

function _injectTab(tabId) {
  const target = { tabId };
  chrome.scripting.executeScript({ target, files: SCRIPTS }).catch(() => {});
  chrome.scripting.insertCSS({ target, files: CSS_FILES }).catch(() => {});
}
