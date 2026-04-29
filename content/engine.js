/**
 * SmartRead — Processing Engine
 * Scans blocks, sets direction, wraps mixed text nodes in BDI.
 * Arabic segments get class="sr-ar" for selective font application.
 *
 * Depends on (loaded before this file): content/direction.js
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const ENGINE_ATTR    = 'data-smartread';
const BLOCK_SELECTOR = 'p, li, h1, h2, h3, h4, h5, h6, blockquote';
const MIN_LENGTH     = 20;

// Arabic/Latin boundary split regex — matches position between the two scripts
const _AR  = '؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿';
const _SPLIT = new RegExp(
  `(?<=[${_AR}])(?=[^${_AR}])|(?<=[^${_AR}])(?=[${_AR}])`
);

const _SKIP = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'BDI', 'SAMP', 'KBD', 'TEXTAREA']);

let _dirMode = 'auto';
function setDirMode(mode) { _dirMode = mode; }
function getDirMode()     { return _dirMode; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Insert one space at Arabic↔Latin boundaries that lack whitespace
function _spaceBoundaries(text) {
  return text
    .replace(new RegExp(`([${_AR}])(?=[^\\s${_AR}\\p{P}\\p{S}])`, 'gu'), '$1 ')
    .replace(new RegExp(`([^\\s${_AR}\\p{P}\\p{S}])(?=[${_AR}])`, 'gu'), '$1 ');
}

// ─── BDI builder ─────────────────────────────────────────────────────────────

/**
 * Split `text` at script boundaries and wrap each segment in <bdi>.
 * Arabic segments get class="sr-ar" so CSS font rules apply selectively.
 */
function _buildBdi(text) {
  const cleaned  = _spaceBoundaries(text);
  const segments = cleaned.split(_SPLIT);
  return segments.map(seg => {
    if (/^\s+$/.test(seg)) return escapeHtml(seg);
    const isAr = ARABIC_RE.test(seg);
    return isAr
      ? `<bdi class="sr-ar">${escapeHtml(seg)}</bdi>`
      : `<bdi>${escapeHtml(seg)}</bdi>`;
  }).join('');
}

// ─── Block-level direction ────────────────────────────────────────────────────

function _processBlock(el) {
  if (el.getAttribute(ENGINE_ATTR) === 'block') return false;
  if (isCodeElement(el)) return false;
  const text = el.textContent.trim();
  if (text.length < MIN_LENGTH) return false;

  const dir = _dirMode === 'auto' ? detectDirection(text) : _dirMode;
  el.setAttribute('dir', dir);
  el.setAttribute(ENGINE_ATTR, 'block');
  return true;
}

// ─── Text-node BDI wrapping ───────────────────────────────────────────────────

function _wrapTextNode(node) {
  const text = node.nodeValue;
  if (!text || !isMixedText(text)) return;

  const parent = node.parentElement;
  if (!parent) return;
  if (_SKIP.has(parent.tagName)) return;
  if (parent.getAttribute(ENGINE_ATTR) === 'wrapped') return;

  const dir     = _dirMode === 'auto' ? detectDirection(text) : _dirMode;
  const wrapper = document.createElement('span');
  wrapper.setAttribute('dir', dir);
  wrapper.setAttribute(ENGINE_ATTR, 'wrapped');
  wrapper.innerHTML = _buildBdi(text);
  parent.replaceChild(wrapper, node);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Process all qualifying blocks and mixed text nodes under `root`.
 * Returns the count of block-level elements processed (not text node count).
 */
function processRoot(root) {
  if (!root?.querySelectorAll) return 0;
  let count = 0;

  // Pass 1 — block-level direction
  if (root.matches?.(BLOCK_SELECTOR) && _processBlock(root)) count++;
  root.querySelectorAll(BLOCK_SELECTOR).forEach(el => { if (_processBlock(el)) count++; });

  // Pass 2 — text node BDI wrapping
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (_SKIP.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (p.getAttribute(ENGINE_ATTR) === 'wrapped') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach(_wrapTextNode);

  return count;
}

/**
 * Undo all SmartRead changes under `root`. Restores original DOM.
 */
function resetRoot(root) {
  if (!root?.querySelectorAll) return;

  // Unwrap BDI spans → plain text
  root.querySelectorAll(`[${ENGINE_ATTR}="wrapped"]`).forEach(el => {
    el.replaceWith(document.createTextNode(el.textContent));
  });

  // Strip direction + marker from blocks
  root.querySelectorAll(`[${ENGINE_ATTR}="block"]`).forEach(el => {
    el.removeAttribute('dir');
    el.removeAttribute(ENGINE_ATTR);
  });
}
