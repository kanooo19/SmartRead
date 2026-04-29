/**
 * SmartRead — UI Enhancer
 *
 * Pure pipeline: given a DOM block element, returns an HTML string
 * representing the enhanced structured view. Never touches the DOM.
 *
 * Depends on (loaded before this file):
 *   detector.js → detectDirection, isMixedText
 *   fixer.js    → escapeHtml
 */

// ─── Glossary ─────────────────────────────────────────────────────────────────

const UE_GLOSSARY = {
  'API':         'واجهة برمجية تتيح التواصل بين التطبيقات',
  'OpenAI':      'شركة ذكاء اصطناعي، مطوّرة نماذج GPT',
  'GPT':         'نموذج لغوي ضخم من OpenAI',
  'LLM':         'نموذج لغوي كبير مُدرَّب على النصوص',
  'Gateway':     'بوابة تتحكم في توجيه الطلبات والاستجابات',
  'Workflow':    'مسار عمل أو تدفق مهام متسلسلة',
  'Model':       'نموذج ذكاء اصطناعي مُدرَّب على بيانات',
  'SDK':         'مجموعة أدوات تطوير البرمجيات',
  'JSON':        'تنسيق بيانات خفيف لتبادل المعلومات',
  'REST':        'نمط معماري لواجهات برمجية عبر HTTP',
  'Prompt':      'النص المُدخَل لتوجيه نموذج الذكاء الاصطناعي',
  'Token':       'وحدة نصية تعالجها النماذج اللغوية',
  'Embedding':   'تمثيل رقمي للنص في فضاء المتجهات',
  'Fine-tuning': 'ضبط دقيق لنموذج مُدرَّب مسبقاً',
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the enhanced HTML string for a given block element.
 * Returns null if the block is empty or too short to process.
 */
function buildEnhancedHTML(block) {
  const rawText = _extractText(block);
  const cleaned = _cleanText(rawText);
  if (!cleaned || cleaned.length < 20) return null;

  const dir   = detectDirection(cleaned);
  const terms = _findTerms(cleaned);
  const mixed = isMixedText(cleaned);

  if (terms.length > 0 && mixed) {
    return _buildTermLayout(cleaned, terms, dir);
  }
  if (cleaned.length > 220) {
    return _buildLineLayout(cleaned, dir);
  }
  return _buildSimple(cleaned, dir);
}

// ─── Text extraction ──────────────────────────────────────────────────────────

/** Extract text from block, converting <br> to newlines, excluding the smart button. */
function _extractText(block) {
  const clone = block.cloneNode(true);
  clone.querySelector('.sr-block-btn')?.remove();
  clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
  return clone.textContent;
}

// ─── Text cleaning ────────────────────────────────────────────────────────────

function _cleanText(text) {
  return text
    .replace(/\r\n|\r/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n[ \t]+/g, '\n')
    .trim();
}

// ─── Term detection ───────────────────────────────────────────────────────────

function _findTerms(text) {
  return Object.keys(UE_GLOSSARY).filter(term =>
    new RegExp(`\\b${term}\\b`).test(text)
  );
}

// ─── HTML builders ────────────────────────────────────────────────────────────
// All use <span> — valid inside <p>, <li>, <blockquote>.
// Block-like layout via CSS (display:block on sr-line, sr-body, etc.)

function _buildTermLayout(text, terms, dir) {
  const termCards = terms.map(term => {
    const gloss = UE_GLOSSARY[term] || '';
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

  const lines   = _splitSentences(text);
  const bodyHTML = lines
    .map(l => `<span class="sr-line" dir="${dir}">${escapeHtml(l)}</span>`)
    .join('');

  return (
    `<span class="sr-terms-section">${termCards}</span>` +
    `<span class="sr-divider" role="separator"></span>` +
    `<span class="sr-body" dir="${dir}">${bodyHTML}</span>`
  );
}

function _buildLineLayout(text, dir) {
  const lines = _splitSentences(text);
  return (
    `<span class="sr-body" dir="${dir}">` +
    lines.map(l => `<span class="sr-line" dir="${dir}">${escapeHtml(l)}</span>`).join('') +
    `</span>`
  );
}

function _buildSimple(text, dir) {
  return `<span class="sr-body" dir="${dir}">${escapeHtml(text)}</span>`;
}

// ─── Sentence splitting ───────────────────────────────────────────────────────

/**
 * Splits text at sentence boundaries and groups pairs of short sentences
 * to avoid excessive fragmentation. Always returns at least one item.
 */
function _splitSentences(text) {
  const raw = text
    .split(/(?<=[.!?؟])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (raw.length <= 2) return [text.trim()];

  const grouped = [];
  for (let i = 0; i < raw.length; i += 2) {
    const pair = raw.slice(i, i + 2).join('  ');
    if (pair.trim()) grouped.push(pair.trim());
  }
  return grouped;
}
