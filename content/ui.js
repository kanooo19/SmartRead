/**
 * SmartRead — Global Floating Action Button
 * ONE button per page, fixed position. No per-paragraph buttons.
 * States: idle ✨ → loading ⟳ → active ✓ → (click) → idle
 */

const FAB_ID = 'smartread-fab';

let _fabState    = 'idle';
let _clickHandler = null;

const STATES = {
  idle:    { icon: '✨', title: 'SmartRead — Fix this page',      cls: '' },
  loading: { icon: '⟳',  title: 'SmartRead — Processing…',       cls: 'sr-fab--loading' },
  active:  { icon: '✓',  title: 'SmartRead — Fixed! Click to reset', cls: 'sr-fab--active' },
};

function createFab(onClick) {
  if (document.getElementById(FAB_ID)) return;
  _clickHandler = onClick;

  const btn = document.createElement('button');
  btn.id        = FAB_ID;
  btn.className = 'sr-fab';
  _applyState(btn, 'idle');

  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (typeof _clickHandler === 'function') _clickHandler();
  });

  document.body.appendChild(btn);
}

function setFabState(state) {
  _fabState = state;
  const btn = document.getElementById(FAB_ID);
  if (btn) _applyState(btn, state);
}

function getFabState() { return _fabState; }

function removeFab() {
  document.getElementById(FAB_ID)?.remove();
}

function _applyState(btn, state) {
  const s = STATES[state] || STATES.idle;
  // Remove all state classes, add the new one
  btn.className = ['sr-fab', s.cls].filter(Boolean).join(' ');
  btn.textContent = s.icon;
  btn.title       = s.title;
  btn.setAttribute('aria-label', s.title);
}
