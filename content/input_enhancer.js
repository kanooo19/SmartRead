/**
 * SmartRead — Input Field Enhancer
 * Attaches a single floating smart button to focused input / textarea /
 * contenteditable elements. On click: detect direction, clean spacing,
 * rewrite text in place.
 *
 * Depends on (loaded before this file): content/direction.js
 *
 * Design rules:
 *  - ONE button in the DOM at a time (#smartread-input-btn)
 *  - data-smartread-input="true" marks processed inputs
 *  - position: fixed, tracked via rAF so it follows scroll + resize
 *  - mousedown (not click) prevents blur before action fires
 */

const IE_BTN_ID  = 'smartread-input-btn';
const IE_ATTR    = 'data-smartread-input';

// Inputs we care about — excludes password, file, color, etc.
const IE_SELECTOR = [
  'input[type="text"]',
  'input[type="search"]',
  'input[type="email"]',
  'input[type="url"]',
  'input:not([type])',
  'textarea',
  '[contenteditable="true"]',
  '[contenteditable=""]',
].join(', ');

const IE_MIN_WIDTH  = 80;   // px — skip tiny inputs
const IE_MIN_HEIGHT = 22;   // px

let _activeEl  = null;
let _blurTimer = null;
let _rafId     = null;

// ─── Public API ───────────────────────────────────────────────────────────────

function initInputEnhancer() {
  document.addEventListener('focusin',  _onFocusIn,  true);
  document.addEventListener('focusout', _onFocusOut, true);
}

function destroyInputEnhancer() {
  document.removeEventListener('focusin',  _onFocusIn,  true);
  document.removeEventListener('focusout', _onFocusOut, true);
  _hide();
}

// ─── Focus handlers ───────────────────────────────────────────────────────────

function _onFocusIn(e) {
  const el = e.target;

  if (!el.matches(IE_SELECTOR)) { _hide(); return; }
  if (el.readOnly || el.disabled) { _hide(); return; }

  const rect = el.getBoundingClientRect();
  if (rect.width < IE_MIN_WIDTH || rect.height < IE_MIN_HEIGHT) { _hide(); return; }

  clearTimeout(_blurTimer);
  _activeEl = el;
  _show(el);
}

function _onFocusOut() {
  // Small delay so mousedown on the button fires before we remove it
  _blurTimer = setTimeout(() => {
    if (document.activeElement?.id === IE_BTN_ID) return;
    _hide();
    _activeEl = null;
  }, 180);
}

// ─── Button lifecycle ─────────────────────────────────────────────────────────

function _show(el) {
  _hide(); // always start fresh

  const btn = document.createElement('button');
  btn.id        = IE_BTN_ID;
  btn.className = 'sr-input-btn';
  btn.textContent = '✦';
  btn.title = 'SmartRead — Fix direction & spacing';
  btn.setAttribute(IE_ATTR, 'true');
  btn.setAttribute('aria-label', 'SmartRead: fix text in this field');

  // mousedown prevents focus loss before click resolves
  btn.addEventListener('mousedown', e => {
    e.preventDefault();
    e.stopPropagation();
    _fixText(el);
  });

  document.body.appendChild(btn);
  _startTracking(btn, el);
}

function _hide() {
  _stopTracking();
  document.getElementById(IE_BTN_ID)?.remove();
}

// ─── rAF position tracking ────────────────────────────────────────────────────
// Runs every frame while the button is visible — handles scroll + resize without
// separate event listeners.

function _startTracking(btn, el) {
  const tick = () => {
    if (!document.getElementById(IE_BTN_ID)) return; // button gone
    _positionBtn(btn, el);
    _rafId = requestAnimationFrame(tick);
  };
  _rafId = requestAnimationFrame(tick);
}

function _stopTracking() {
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
}

function _positionBtn(btn, el) {
  const r  = el.getBoundingClientRect();
  const bw = 22; // button width — keep in sync with CSS
  const margin = 4;

  btn.style.top  = `${r.top  + margin}px`;
  btn.style.left = `${r.right - bw - margin}px`;
}

// ─── Text fixing ──────────────────────────────────────────────────────────────

function _fixText(el) {
  const isEditable = el.isContentEditable;
  const raw = isEditable ? (el.innerText || el.textContent || '') : (el.value || '');

  if (!raw.trim()) return;

  const dir     = detectDirection(raw);
  const cleaned = _cleanText(raw);

  el.setAttribute('dir', dir);

  if (isEditable) {
    el.textContent = cleaned;
    // Move caret to end so the user can keep typing
    try {
      const range = document.createRange();
      const sel   = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (_) {}
  } else {
    el.value = cleaned;
    // Notify React / Vue / Angular of the programmatic change
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  _showDone();
}

function _cleanText(text) {
  const AR = '؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿';
  return text
    .replace(/\r\n|\r/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    // Space at Arabic↔Latin boundaries that lack it
    .replace(new RegExp(`([${AR}])(?=[A-Za-z])`, 'g'), '$1 ')
    .replace(new RegExp(`([A-Za-z])(?=[${AR}])`, 'g'), '$1 ')
    .trim();
}

// ─── Visual feedback ──────────────────────────────────────────────────────────

function _showDone() {
  const btn = document.getElementById(IE_BTN_ID);
  if (!btn) return;
  btn.textContent = '✓';
  btn.classList.add('sr-input-btn--done');
  setTimeout(() => {
    if (!document.getElementById(IE_BTN_ID)) return;
    btn.textContent = '✦';
    btn.classList.remove('sr-input-btn--done');
  }, 1400);
}
