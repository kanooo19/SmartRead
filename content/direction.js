/**
 * SmartRead — Direction Engine
 * Standalone Unicode-aware RTL/LTR detection. No DOM dependencies.
 */

const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const CODE_TAGS = new Set(['PRE', 'CODE', 'SAMP', 'KBD', 'TEXTAREA']);

// First letter-class character wins (emoji/numbers/symbols skipped via for...of)
function detectLeadingScript(text) {
  for (const char of text) {
    if (ARABIC_RE.test(char)) return 'rtl';
    if (/[A-Za-z]/.test(char)) return 'ltr';
  }
  return null;
}

// Ratio of Arabic letters to all Unicode letters (excludes emoji/numbers from denominator)
function arabicRatio(text) {
  const letters = text.replace(/[^\p{L}]/gu, '');
  if (!letters.length) return 0;
  const arCount = (letters.match(new RegExp(ARABIC_RE.source, 'g')) || []).length;
  return arCount / letters.length;
}

// Rule 1: first meaningful character. Rule 2 fallback: >20% Arabic ratio → rtl.
function detectDirection(text) {
  const t = text.trim();
  if (!t) return 'ltr';
  const leading = detectLeadingScript(t);
  if (leading) return leading;
  return arabicRatio(t) > 0.2 ? 'rtl' : 'ltr';
}

function isMixedText(text) {
  return ARABIC_RE.test(text) && /[A-Za-z]/.test(text);
}

function containsArabic(text) {
  return ARABIC_RE.test(text);
}

// Walk ancestor chain — code-type ancestors mean we never touch this element
function isCodeElement(el) {
  if (CODE_TAGS.has(el.tagName)) return true;
  let node = el.parentElement;
  while (node) {
    if (CODE_TAGS.has(node.tagName)) return true;
    node = node.parentElement;
  }
  return false;
}
