const SMARTREAD_ATTR = 'data-smartread-fixed';

// Arabic character class — keep in sync with detector.js ranges
const AR = '؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿';
const SPLIT_RE = new RegExp(
  `(?<=[${AR}])(?=[^${AR}])|(?<=[^${AR}])(?=[${AR}])`
);

// Technical terms to highlight (case-sensitive, word boundaries)
const TERM_RE = /\b(API|OpenAI|Gateway|Workflow|Model)\b/g;

// Block-level elements that receive paragraph-level direction in V2
const BLOCK_SELECTOR = 'p, li, blockquote, h1, h2, h3, h4, h5, h6, dt, dd, td, th';

// Direction mode: 'auto' | 'rtl' | 'ltr'
let _dirMode = 'auto';
function setDirMode(mode) { _dirMode = mode; }
function getDirMode() { return _dirMode; }

// ─── Text-level transforms (applied to raw text before HTML building) ────────

// Collapse 3+ consecutive newlines to 2
function normalizeWhitespace(text) {
  return text.replace(/\n{3,}/g, '\n\n');
}

// Insert one space at Arabic↔Latin boundaries lacking whitespace.
// Skips punctuation, symbols, and emoji (covered by \p{P} and \p{S}).
function spaceBoundaries(text) {
  return text
    .replace(new RegExp(`([${AR}])(?=[^\\s${AR}\\p{P}\\p{S}])`, 'gu'), '$1 ')
    .replace(new RegExp(`([^\\s${AR}\\p{P}\\p{S}])(?=[${AR}])`, 'gu'), '$1 ');
}

// Add spacing around common punctuation separators in mixed text.
// Careful not to affect URLs (colon guard) or numeric times (digit guard).
function fixPunctuation(text) {
  return text
    .replace(/\s*—\s*/g, ' — ')                   // em dash: space both sides
    .replace(/(?<!\d):(?!\/\/)(\S)/g, ': $1')      // colon: space after (not URLs, not times)
    .replace(/(\w)\((?!\s)/g, '$1 (')              // open paren: space before
    .replace(/(?<!\s)\)(\w)/g, ') $1');            // close paren: space after
}

// ─── HTML-level transforms (applied to already-escaped segment text) ─────────

// Wrap recognized technical terms in .sr-term spans.
// Only called on non-Arabic segments; safe because terms contain no HTML special chars.
function wrapTerms(escapedText) {
  if (!/[A-Z]/.test(escapedText)) return escapedText;
  return escapedText.replace(TERM_RE, '<span class="sr-term">$1</span>');
}

// ─── DOM-level transforms ────────────────────────────────────────────────────

// ── Block-level direction pass (V2 core feature) ─────────────────────────────

/**
 * Sets the `dir` attribute on each block-level element based on Smart Engine v2 rules:
 *   - Auto mode: detectDirection() per block (leading char + 20% fallback)
 *   - Manual mode: force the user-selected direction on every block
 *
 * Code elements are always skipped — they must remain untouched and LTR.
 */
function processBlockDirections(root) {
  root.querySelectorAll(BLOCK_SELECTOR).forEach(el => {
    if (el.hasAttribute(SMARTREAD_ATTR)) return;
    if (isCodeElement(el)) return;
    const text = el.textContent.trim();
    if (!text) return;
    const dir = _dirMode === 'auto' ? detectDirection(text) : _dirMode;
    el.setAttribute('dir', dir);
    el.setAttribute(SMARTREAD_ATTR, 'block');
  });
}

// Collapse runs of 3+ consecutive <br> elements to at most 2.
function normalizeLineBreaks(root) {
  const brs = Array.from(root.querySelectorAll('br'));
  let streak = 0;
  let prev = null;
  for (const br of brs) {
    if (br.hasAttribute(SMARTREAD_ATTR)) { streak = 0; prev = null; continue; }
    if (prev && isAdjacentBr(prev, br)) {
      streak++;
      if (streak > 2) br.remove();
      else prev = br;
    } else {
      streak = 1;
      prev = br;
    }
  }
}

function isAdjacentBr(a, b) {
  let node = a.nextSibling;
  while (node) {
    if (node === b) return true;
    if (node.nodeType === Node.TEXT_NODE && /^\s*$/.test(node.nodeValue)) {
      node = node.nextSibling;
    } else {
      return false;
    }
  }
  return false;
}

// For very long mixed-text block elements, insert one soft <br> after the first
// sentence boundary past the 300-char mark. Non-destructive: only one break per element.
const SENTENCE_END_RE = /[.!?؟]\s/g;

function softBreakLongParagraphs(root) {
  const blocks = root.querySelectorAll('p, li, blockquote');
  for (const el of blocks) {
    if (el.hasAttribute(SMARTREAD_ATTR)) continue;
    const text = el.textContent;
    if (text.length < 500 || !isMixedText(text)) continue;
    SENTENCE_END_RE.lastIndex = 300;
    const match = SENTENCE_END_RE.exec(text);
    SENTENCE_END_RE.lastIndex = 0;
    if (!match) continue;
    insertBreakAtOffset(el, match.index + match[0].length);
  }
}

// Walk text nodes in `el`, find the one spanning `charOffset`, split it,
// and insert a SmartRead-owned <br> between the two halves.
function insertBreakAtOffset(el, charOffset) {
  let accumulated = 0;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let node;
  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length;
    if (accumulated + len > charOffset) {
      const localOffset = charOffset - accumulated;
      if (localOffset <= 0 || localOffset >= len) break;
      const after = node.splitText(localOffset);
      const br = document.createElement('br');
      br.setAttribute(SMARTREAD_ATTR, 'break');
      node.parentNode.insertBefore(br, after);
      return;
    }
    accumulated += len;
  }
}

// ─── Core BDI builder ────────────────────────────────────────────────────────

function buildBdiHtml(text) {
  const cleaned = spaceBoundaries(fixPunctuation(normalizeWhitespace(text)));
  const segments = cleaned.split(SPLIT_RE);
  return segments.map(seg => {
    if (/^\s+$/.test(seg)) return escapeHtml(seg);
    const escaped = escapeHtml(seg);
    // Only highlight terms in non-Arabic segments to avoid false matches
    const content = ARABIC_RE.test(seg) ? escaped : wrapTerms(escaped);
    return `<bdi>${content}</bdi>`;
  }).join('');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Node-level fix ──────────────────────────────────────────────────────────

function fixTextNode(textNode) {
  const text = textNode.nodeValue;
  if (!text || !isMixedText(text)) return false;

  const parent = textNode.parentElement;
  if (!parent || parent.hasAttribute(SMARTREAD_ATTR)) return false;
  if (['SCRIPT', 'STYLE', 'CODE', 'PRE', 'BDI', 'SAMP', 'KBD'].includes(parent.tagName)) return false;

  const dir = _dirMode === 'auto' ? detectDirection(text) : _dirMode;

  const wrapper = document.createElement('span');
  wrapper.setAttribute('dir', dir);
  wrapper.setAttribute(SMARTREAD_ATTR, '1');
  wrapper.innerHTML = buildBdiHtml(text);

  parent.replaceChild(wrapper, textNode);
  return true;
}

// ─── Subtree entry points ─────────────────────────────────────────────────────

function fixSubtree(root) {
  normalizeLineBreaks(root);
  softBreakLongParagraphs(root);  // must run before processBlockDirections marks block elements
  processBlockDirections(root);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (['SCRIPT', 'STYLE', 'CODE', 'PRE', 'BDI', 'SAMP', 'KBD'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (p.hasAttribute(SMARTREAD_ATTR)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);

  let count = 0;
  for (const n of nodes) {
    if (fixTextNode(n)) count++;
  }
  return count;
}

function unfixSubtree(root) {
  root.querySelectorAll(`[${SMARTREAD_ATTR}]`).forEach(el => {
    const val = el.getAttribute(SMARTREAD_ATTR);
    if (el.tagName === 'BR' || val === 'break') {
      el.remove();
    } else if (val === 'block') {
      // Block elements: remove direction and marker, keep the element intact
      el.removeAttribute('dir');
      el.removeAttribute(SMARTREAD_ATTR);
    } else {
      el.replaceWith(document.createTextNode(el.textContent));
    }
  });
}
