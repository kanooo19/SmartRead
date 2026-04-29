/**
 * SmartRead — Button Injector
 *
 * Manages the ✨ smart button lifecycle for readable blocks.
 * Delegates detection to blockDetector.js, HTML building to uiEnhancer.js.
 *
 * Depends on (loaded before this file):
 *   detector.js      → isCodeElement
 *   blockDetector.js → getReadableBlocks
 *   uiEnhancer.js    → buildEnhancedHTML
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const BI_BLOCK_ATTR     = 'data-sr-block';   // element is managed by this engine
const BI_PROCESSED_ATTR = 'data-sr-done';    // element is currently in structured view
const BI_BTN_CLASS      = 'sr-block-btn';

// ─── Original content store (GC-safe) ────────────────────────────────────────

const _originals = new WeakMap();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scan `root` and attach smart buttons to every qualifying block.
 * Already-managed blocks are skipped. Safe to call on every mutation.
 */
function initButtons(root) {
  getReadableBlocks(root).forEach(_attachBtn);
}

/**
 * Remove all smart buttons under `root` and restore any structured blocks.
 * Called when the extension is toggled off.
 */
function destroyButtons(root) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll(`[${BI_BLOCK_ATTR}]`).forEach(el => {
    if (_originals.has(el)) _restoreBlock(el, /* silent= */ true);
    el.querySelector('.' + BI_BTN_CLASS)?.remove();
    el.removeAttribute(BI_BLOCK_ATTR);
    el.removeAttribute(BI_PROCESSED_ATTR);
    el.classList.remove('sr-structured');
  });
}

// ─── Button lifecycle ─────────────────────────────────────────────────────────

function _attachBtn(block) {
  block.setAttribute(BI_BLOCK_ATTR, '');
  block.appendChild(_makeBtn(block));
}

function _makeBtn(block) {
  const btn = document.createElement('button');
  btn.className = BI_BTN_CLASS;
  btn.setAttribute('aria-label', 'SmartRead: format this block');

  const processed = block.hasAttribute(BI_PROCESSED_ATTR);
  btn.textContent = processed ? '↩' : '✨';
  btn.title       = processed ? 'Restore original' : 'Format with SmartRead';
  if (processed) btn.classList.add('sr-active');

  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if (block.hasAttribute(BI_PROCESSED_ATTR)) {
      _restoreBlock(block);
    } else {
      _enhanceBlock(block);
    }
  });

  return btn;
}

/** Swap the button in-place after innerHTML changes. */
function _refreshBtn(block) {
  block.querySelector('.' + BI_BTN_CLASS)?.remove();
  block.appendChild(_makeBtn(block));
}

// ─── Block transform ──────────────────────────────────────────────────────────

function _enhanceBlock(block) {
  const savedHTML = _getContentHTML(block);

  const html = buildEnhancedHTML(block);
  if (!html) return;

  _originals.set(block, savedHTML);
  block.innerHTML = html;
  block.setAttribute(BI_PROCESSED_ATTR, '1');
  block.classList.add('sr-structured');
  _refreshBtn(block);
}

function _restoreBlock(block, silent = false) {
  const orig = _originals.get(block);
  if (!orig) return;
  _originals.delete(block);

  block.innerHTML = orig;
  block.removeAttribute(BI_PROCESSED_ATTR);
  block.classList.remove('sr-structured');
  if (!silent) _refreshBtn(block);
}

// ─── Content extraction ───────────────────────────────────────────────────────

/** innerHTML excluding the smart button — what we save for restoration. */
function _getContentHTML(block) {
  const clone = block.cloneNode(true);
  clone.querySelector('.' + BI_BTN_CLASS)?.remove();
  return clone.innerHTML;
}
