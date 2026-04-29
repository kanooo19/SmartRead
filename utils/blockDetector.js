/**
 * SmartRead — Block Detector
 *
 * Single responsibility: decide which DOM elements qualify as "smart blocks".
 * Returns a filtered list — never touches the DOM itself.
 *
 * Depends on: detector.js → isCodeElement
 */

// Semantic elements that can carry readable content
const BD_SELECTOR  = 'p, li, h1, h2, h3, blockquote';
const BD_MIN_CHARS = 20;   // skip decorative or navigation fragments
const BD_BLOCK_ATTR = 'data-sr-block'; // set by buttonInjector once managed

/**
 * Returns every unmanaged, readable block under `root`.
 * Automatically includes `root` itself if it is a qualifying block element
 * (handles the MutationObserver case where the observed node IS the block).
 */
function getReadableBlocks(root) {
  if (!root?.querySelectorAll) return [];

  const seen    = new Set();
  const results = [];

  const push = el => {
    if (!seen.has(el) && _qualifies(el)) {
      seen.add(el);
      results.push(el);
    }
  };

  // root itself (e.g. a freshly added <p>)
  if (root.matches?.(BD_SELECTOR)) push(root);

  // descendants
  root.querySelectorAll(BD_SELECTOR).forEach(push);

  return results;
}

function _qualifies(el) {
  if (el.hasAttribute(BD_BLOCK_ATTR)) return false;  // already managed — never duplicate
  if (isCodeElement(el))              return false;  // code/pre ancestry → skip
  if (el.textContent.trim().length < BD_MIN_CHARS) return false;
  return true;
}
