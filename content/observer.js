/**
 * SmartRead — Mutation Observer
 * Debounced observer that batches new nodes and drops descendants
 * to avoid double-processing streamed AI responses.
 */

let _observer  = null;
let _debTimer  = null;
let _onFlush   = null;
const _pending = new Set();

function startObserver(onFlush) {
  if (_observer) return;
  _onFlush = onFlush;

  _observer = new MutationObserver(mutations => {
    let dirty = false;
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          _pending.add(node);
          dirty = true;
        }
      }
    }
    if (dirty) {
      clearTimeout(_debTimer);
      _debTimer = setTimeout(_flush, 150);
    }
  });

  _observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver() {
  clearTimeout(_debTimer);
  _pending.clear();
  if (_observer) { _observer.disconnect(); _observer = null; }
  _onFlush = null;
}

function _flush() {
  // Keep only root-level nodes — skip any node whose ancestor is also pending
  const roots = [..._pending].filter(n =>
    ![..._pending].some(o => o !== n && o.contains?.(n))
  );
  _pending.clear();
  if (typeof _onFlush === 'function') roots.forEach(_onFlush);
}
