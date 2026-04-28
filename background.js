// Dynamically inject content scripts into user-defined custom sites
chrome.storage.sync.get(['smartread_custom_sites'], result => {
  const sites = result.smartread_custom_sites || [];
  if (sites.length === 0) return;

  chrome.tabs.query({}, tabs => {
    for (const tab of tabs) {
      try {
        const url = new URL(tab.url);
        if (sites.some(site => url.hostname.includes(site))) {
          injectIntoTab(tab.id);
        }
      } catch (_) {}
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  chrome.storage.sync.get(['smartread_custom_sites'], result => {
    const sites = result.smartread_custom_sites || [];
    try {
      const url = new URL(tab.url);
      if (sites.some(site => url.hostname.includes(site))) {
        injectIntoTab(tabId);
      }
    } catch (_) {}
  });
});

function injectIntoTab(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['utils/detector.js', 'utils/fixer.js', 'content_script.js']
  }).catch(() => {});
}
