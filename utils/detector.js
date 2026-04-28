// Arabic Unicode ranges (U+0600–U+06FF and extended blocks)
const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

// Tags whose content must never be modified (code blocks, terminal output)
const CODE_TAGS = new Set(['PRE', 'CODE', 'SAMP', 'KBD']);

// ── Direction detection ───────────────────────────────────────────────────────

/**
 * Finds the first letter-class character (Arabic or Latin) in `text`,
 * skipping emojis, numbers, symbols, punctuation, and whitespace.
 * Returns 'rtl', 'ltr', or null if no letter is found.
 *
 * Uses for...of to iterate by Unicode code points — emoji-safe.
 */
function detectLeadingScript(text) {
  for (const char of text) {
    if (ARABIC_RE.test(char)) return 'rtl';
    if (/[A-Za-z]/.test(char)) return 'ltr';
    // Numbers, emoji, symbols, punctuation, whitespace → skip
  }
  return null;
}

/**
 * Returns the ratio of Arabic letters to all letters in `text`.
 * Uses \p{L} (Unicode letter) so emoji, numbers, and symbols don't skew the ratio.
 */
function arabicRatio(text) {
  const letters = text.replace(/[^\p{L}]/gu, '');
  if (!letters.length) return 0;
  const arabicCount = (letters.match(new RegExp(ARABIC_RE.source, 'g')) || []).length;
  return arabicCount / letters.length;
}

/**
 * Main direction detector for Smart Engine v2.
 * Rule 1: first meaningful script character wins (Arabic → rtl, Latin → ltr).
 * Rule 2 (fallback): if no clear leading script, Arabic ratio > 20% → rtl, else → ltr.
 */
function detectDirection(text) {
  const trimmed = text.trim();
  if (!trimmed) return 'ltr';
  const leading = detectLeadingScript(trimmed);
  if (leading) return leading;
  return arabicRatio(trimmed) > 0.2 ? 'rtl' : 'ltr';
}

// ── Mixed-content helpers (used by fixer.js BDI logic) ───────────────────────

/** True when `text` contains both Arabic and Latin characters. */
function isMixedText(text) {
  return ARABIC_RE.test(text) && /[A-Za-z]/.test(text);
}

/** True when Arabic letters make up more than half of all letters. */
function isArabicDominant(text) {
  return arabicRatio(text) > 0.5;
}

// ── Code-block detection ──────────────────────────────────────────────────────

/**
 * Returns true if `el` is, or is a descendant of, a code-type element.
 * These elements must never have their content or direction modified.
 */
function isCodeElement(el) {
  if (CODE_TAGS.has(el.tagName)) return true;
  let node = el.parentElement;
  while (node) {
    if (CODE_TAGS.has(node.tagName)) return true;
    node = node.parentElement;
  }
  return false;
}
