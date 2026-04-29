/**
 * SmartRead — Typography Engine
 * Loads Arabic Google Fonts on demand and applies them via body class.
 * Fonts are applied ONLY to .sr-ar spans (Arabic text segments).
 */

const FONTS = {
  // ── Original 5 ──────────────────────────────────────────────────────────────
  tajawal:   { name: 'Tajawal',              class: 'font-tajawal',   url: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap' },
  cairo:     { name: 'Cairo',                class: 'font-cairo',     url: 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap' },
  ibm:       { name: 'IBM Plex Sans Arabic', class: 'font-ibm',       url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;700&display=swap' },
  naskh:     { name: 'Noto Naskh Arabic',   class: 'font-naskh',     url: 'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;700&display=swap' },
  amiri:     { name: 'Amiri',               class: 'font-amiri',     url: 'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&display=swap' },
  // ── New 5 ───────────────────────────────────────────────────────────────────
  almarai:   { name: 'Almarai',             class: 'font-almarai',   url: 'https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap' },
  elmessiri: { name: 'El Messiri',          class: 'font-elmessiri', url: 'https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap' },
  reemkufi:  { name: 'Reem Kufi',          class: 'font-reemkufi',  url: 'https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&display=swap' },
  changa:    { name: 'Changa',              class: 'font-changa',    url: 'https://fonts.googleapis.com/css2?family=Changa:wght@300;400;500;700&display=swap' },
  lateef:    { name: 'Lateef',             class: 'font-lateef',    url: 'https://fonts.googleapis.com/css2?family=Lateef:wght@300;400;500;700;800&display=swap' },
  // ── System fallback ─────────────────────────────────────────────────────────
  system:    { name: 'System',              class: null,             url: null },
};

const FONT_SIZES  = { small: '14px', medium: '16px', large: '18px', xl: '20px' };
const FONT_CLASSES = Object.values(FONTS).map(f => f.class).filter(Boolean);

const _loaded = new Set();

function _injectPreconnect() {
  if (document.querySelector('[data-sr-preconnect]')) return;
  ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].forEach((href, i) => {
    const link = document.createElement('link');
    link.rel  = 'preconnect';
    link.href = href;
    if (i === 1) link.crossOrigin = 'anonymous';
    link.setAttribute('data-sr-preconnect', '');
    document.head.appendChild(link);
  });
}

function loadFont(fontKey) {
  const font = FONTS[fontKey];
  if (!font?.url || _loaded.has(fontKey)) return;
  _injectPreconnect();
  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = font.url;
  link.setAttribute('data-sr-font', fontKey);
  document.head.appendChild(link);
  _loaded.add(fontKey);
}

function applyFont(fontKey) {
  document.body.classList.remove(...FONT_CLASSES);
  const font = FONTS[fontKey];
  if (!font?.class) return;
  loadFont(fontKey);
  document.body.classList.add(font.class);
}

function setFontSize(sizeKey) {
  const value = FONT_SIZES[sizeKey] || '16px';
  document.documentElement.style.setProperty('--smartread-font-size', value);
}

function getFontList() { return FONTS; }
