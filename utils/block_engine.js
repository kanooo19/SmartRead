/**
 * SmartRead — Block Engine V3
 *
 * Attaches a per-paragraph ✨ smart button to readable content blocks.
 * On click, the block is transformed into clean structured output.
 * A second click restores the original content exactly.
 *
 * Depends on (loaded before this file via manifest):
 *   detector.js  → isCodeElement, isMixedText, detectDirection
 *   fixer.js     → escapeHtml
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const BE_BLOCK_ATTR     = 'data-sr-block';    // marks a block as engine-managed
const BE_PROCESSED_ATTR = 'data-sr-done';     // marks a block as currently structured
const BE_BTN_CLASS      = 'sr-block-btn';
const BE_MIN_LENGTH     = 45;                 // skip blocks shorter than this

// Blocks the engine targets. Intentionally narrow — excludes headings and tables.
const BE_SELECTOR = 'p, li, blockquote';

// ─── Glossary ─────────────────────────────────────────────────────────────────
// Arabic explanations for common English tech terms found in AI tool responses.
// Used only when the term already appears in the paragraph — never injected blindly.

const GLOSSARY = {
  'API':        'واجهة برمجية تتيح التواصل بين التطبيقات',
  'OpenAI':     'شركة ذكاء اصطناعي، مطوّرة نماذج GPT',
  'GPT':        'نموذج لغوي ضخم من OpenAI',
  'LLM':        'نموذج لغوي كبير مُدرَّب على النصوص',
  'Gateway':    'بوابة تتحكم في توجيه الطلبات والاستجابات',
  'Workflow':   'مسار عمل أو تدفق مهام متسلسلة',
  'Model':      'نموذج ذكاء اصطناعي مُدرَّب على بيانات',
  'SDK':        'مجموعة أدوات تطوير البرمجيات',
  'JSON':       'تنسيق بيانات خفيف لتبادل المعلومات',
  'REST':       'نمط معماري لواجهات برمجية عبر HTTP',
  'Prompt':     'النص المُدخَل لتوجيه نموذج الذكاء الاصطناعي',
  'Token':      'وحدة نصية تعالجها النماذج اللغوية',
  'Embedding':  'تمثيل رقمي للنص في فضاء المتجهات',
  'Fine-tuning':'ضبط دقيق لنموذج مُدرَّب مسبقاً',
};

// ─── Per-block state ──────────────────────────────────────────────────────────
// WeakMap is GC-safe: when a block is removed from the DOM the entry is freed.

const _originals = new WeakMap();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scan `root` for readable blocks and attach smart buttons.
 * Safe to call multiple times — already-managed blocks are skipped.
 */
function initBlockEngine(root) {
  if (!root || !root.querySelectorAll) return;
  root.querySelectorAll(BE_SELECTOR).forEach(el => {
    if (el.hasAttribute(BE_BLOCK_ATTR)) return;
    if (isCodeElement(el)) return;
    if (el.textContent.trim().length < BE_MIN_LENGTH) return;
    _attachButton(el);
  });
}

/**
 * Remove all smart buttons and restore any structured blocks to their originals.
 * Called when the extension is toggled off.
 */
function destroyBlockEngine(root) {
  if (!root || !root.querySelectorAll) return;
  root.querySelectorAll(`[${BE_BLOCK_ATTR}]`).forEach(el => {
    if (_originals.has(el)) _restoreBlock(el, /* silent = */ true);
    el.querySelector('.' + BE_BTN_CLASS)?.remove();
    el.removeAttribute(BE_BLOCK_ATTR);
    el.removeAttribute(BE_PROCESSED_ATTR);
    el.classList.remove('sr-structured');
  });
}

// ─── Button lifecycle ─────────────────────────────────────────────────────────

function _attachButton(block) {
  block.setAttribute(BE_BLOCK_ATTR, '');
  block.appendChild(_makeButton(block));
}

function _makeButton(block) {
  const btn = document.createElement('button');
  btn.className  = BE_BTN_CLASS;
  btn.setAttribute('aria-label', 'SmartRead: format this block');

  const isProcessed = block.hasAttribute(BE_PROCESSED_ATTR);
  btn.textContent = isProcessed ? '↩' : '✨';
  btn.title       = isProcessed ? 'Restore original' : 'Format with SmartRead';
  if (isProcessed) btn.classList.add('sr-active');

  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if (block.hasAttribute(BE_PROCESSED_ATTR)) {
      _restoreBlock(block);
    } else {
      _processBlock(block);
    }
  });

  return btn;
}

/** Replace the button in-place after innerHTML is swapped. */
function _refreshButton(block) {
  block.querySelector('.' + BE_BTN_CLASS)?.remove();
  block.appendChild(_makeButton(block));
}

// ─── Processing pipeline ──────────────────────────────────────────────────────

function _processBlock(block) {
  // ── 1. Save original so we can restore it ──────────────────────────────────
  const savedHTML = _getContentHTML(block);
  _originals.set(block, savedHTML);

  // ── 2. Extract and clean text ───────────────────────────────────────────────
  const rawText = _getContentText(block);
  const cleaned = _cleanText(rawText);
  if (!cleaned) { _originals.delete(block); return; }

  // ── 3. Detect direction and terms ───────────────────────────────────────────
  const dir   = detectDirection(cleaned);
  const terms = _findGlossaryTerms(cleaned);
  const mixed = isMixedText(cleaned);

  // ── 4. Choose the right structure ───────────────────────────────────────────
  let html;
  if (terms.length > 0 && mixed) {
    html = _buildTermStructure(cleaned, terms, dir);
  } else if (cleaned.length > 220) {
    html = _buildReadableLines(cleaned, dir);
  } else {
    html = _buildSimple(cleaned, dir);
  }

  // ── 5. Apply ─────────────────────────────────────────────────────────────────
  block.innerHTML = html;
  block.setAttribute(BE_PROCESSED_ATTR, '1');
  block.classList.add('sr-structured');
  _refreshButton(block);
}

function _restoreBlock(block, silent = false) {
  const orig = _originals.get(block);
  if (!orig) return;
  _originals.delete(block);

  block.innerHTML = orig;
  block.removeAttribute(BE_PROCESSED_ATTR);
  block.classList.remove('sr-structured');
  if (!silent) _refreshButton(block);
}

// ─── Content extraction ───────────────────────────────────────────────────────

/** innerHTML of the block, excluding the smart button. */
function _getContentHTML(block) {
  const clone = block.cloneNode(true);
  clone.querySelector('.' + BE_BTN_CLASS)?.remove();
  return clone.innerHTML;
}

/** Text content of the block, with <br> converted to newlines. */
function _getContentText(block) {
  const clone = block.cloneNode(true);
  clone.querySelector('.' + BE_BTN_CLASS)?.remove();
  clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
  return clone.textContent;
}

// ─── Cleaning ─────────────────────────────────────────────────────────────────

function _cleanText(text) {
  return text
    .replace(/\r\n|\r/g, '\n')       // normalise line endings
    .replace(/[ \t]{2,}/g, ' ')      // collapse multiple spaces/tabs
    .replace(/\n{3,}/g, '\n\n')      // max two consecutive blank lines
    .replace(/\n[ \t]+/g, '\n')      // remove leading whitespace from lines
    .trim();
}

// ─── Term detection ───────────────────────────────────────────────────────────

function _findGlossaryTerms(text) {
  return Object.keys(GLOSSARY).filter(term =>
    new RegExp(`\\b${term}\\b`).test(text)
  );
}

// ─── HTML builders ────────────────────────────────────────────────────────────
// All use <span> elements so they remain valid inside both <p> and <li>.
// Block-like layout is achieved via CSS (display:block on .sr-line etc.)

/**
 * Mixed content with known terms:
 *   📌 Term  (+ Arabic gloss)
 *   ─────────────────────────
 *   Cleaned paragraph text
 */
function _buildTermStructure(text, terms, dir) {
  const termCards = terms.map(term => {
    const gloss = GLOSSARY[term] || '';
    return (
      `<span class="sr-term-card">` +
        `<span class="sr-term-header">` +
          `<span class="sr-pin" aria-hidden="true">📌</span>` +
          `<span class="sr-term-name">${escapeHtml(term)}</span>` +
        `</span>` +
        (gloss
          ? `<span class="sr-term-gloss" dir="rtl">${escapeHtml(gloss)}</span>`
          : '') +
      `</span>`
    );
  }).join('');

  const bodyLines = _splitSentences(text);
  const bodyHTML  = bodyLines
    .map(l => `<span class="sr-line" dir="${dir}">${escapeHtml(l)}</span>`)
    .join('');

  return (
    `<span class="sr-terms-section">${termCards}</span>` +
    `<span class="sr-divider" role="separator"></span>` +
    `<span class="sr-body" dir="${dir}">${bodyHTML}</span>`
  );
}

/**
 * Long single-language text: split into short readable sentence groups.
 */
function _buildReadableLines(text, dir) {
  const lines = _splitSentences(text);
  return (
    `<span class="sr-body" dir="${dir}">` +
    lines.map(l => `<span class="sr-line" dir="${dir}">${escapeHtml(l)}</span>`).join('') +
    `</span>`
  );
}

/**
 * Short text or unclassified: just set the correct direction.
 */
function _buildSimple(text, dir) {
  return `<span class="sr-body" dir="${dir}">${escapeHtml(text)}</span>`;
}

// ─── Sentence splitting ───────────────────────────────────────────────────────

/**
 * Splits `text` at sentence-ending punctuation.
 * Groups pairs of short sentences to avoid excessive fragmentation.
 * Never splits below 2 items.
 */
function _splitSentences(text) {
  const raw = text
    .split(/(?<=[.!?؟])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (raw.length <= 2) return [text.trim()];

  // Pair up sentences — avoids over-splitting
  const grouped = [];
  for (let i = 0; i < raw.length; i += 2) {
    const pair = raw.slice(i, i + 2).join('  ');
    if (pair.trim()) grouped.push(pair.trim());
  }
  return grouped;
}
