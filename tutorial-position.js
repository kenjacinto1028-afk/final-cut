/* v14.5 tutorial position: independent of the game save and guided-step rerenders. */
(() => {
  'use strict';
  const node = document.getElementById('tutorial');
  if (!node) return;
  const key = 'finalcut_tutorial_position_v1';
  const margin = 8;
  let position = null;
  let drag = null;

  function clamp(x, y) {
    const width = node.getBoundingClientRect().width || 392;
    const height = node.getBoundingClientRect().height || 120;
    return {
      x: Math.max(margin, Math.min(Math.round(x), Math.max(margin, innerWidth - width - margin))),
      y: Math.max(margin, Math.min(Math.round(y), Math.max(margin, innerHeight - height - margin)))
    };
  }
  function place(x, y, persist) {
    position = clamp(x, y);
    node.style.left = position.x + 'px';
    node.style.top = position.y + 'px';
    node.style.right = 'auto';
    node.style.bottom = 'auto';
    if (persist) {
      try { localStorage.setItem(key, JSON.stringify(position)); } catch (_) {}
    }
  }
  function restore() {
    if (position) { place(position.x, position.y, false); return; }
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
        place(saved.x, saved.y, false);
      }
    } catch (_) {}
  }
  function reset() {
    position = null;
    node.style.removeProperty('left');
    node.style.removeProperty('top');
    node.style.removeProperty('right');
    node.style.removeProperty('bottom');
    try { localStorage.removeItem(key); } catch (_) {}
  }

  node.addEventListener('pointerdown', event => {
    const head = event.target.closest('.tutorial-head');
    if (!head || event.target.closest('button, a, input, select, textarea') || event.button !== 0) return;
    const rect = node.getBoundingClientRect();
    drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: rect.left, y: rect.top };
    head.setPointerCapture(event.pointerId);
    head.classList.add('is-dragging');
    event.preventDefault();
  });
  node.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    place(drag.x + event.clientX - drag.startX, drag.y + event.clientY - drag.startY, false);
  });
  function finish(event) {
    if (!drag || drag.id !== event.pointerId) return;
    drag = null;
    const head = node.querySelector('.tutorial-head');
    if (head) head.classList.remove('is-dragging');
    if (position) place(position.x, position.y, true);
  }
  node.addEventListener('pointerup', finish);
  node.addEventListener('pointercancel', finish);
  node.addEventListener('keydown', event => {
    if (!event.target.matches('.tutorial-head')) return;
    const offsets = {ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]};
    if (!offsets[event.key]) return;
    event.preventDefault();
    const r = node.getBoundingClientRect();
    place(r.left + offsets[event.key][0], r.top + offsets[event.key][1], true);
  });
  node.addEventListener('dblclick', event => {
    if (event.target.closest('.tutorial-head') && !event.target.closest('button')) reset();
  });
  const observer = new MutationObserver(() => {
    const head = node.querySelector('.tutorial-head');
    if (head) {
      head.tabIndex = 0;
      head.setAttribute('aria-label', 'Move tutorial. Drag this header or use arrow keys. Double click to reset.');
      head.title = 'Drag to move · arrow keys to nudge · double click to reset';
    }
    if (position && !node.hidden) requestAnimationFrame(() => {
      if (!drag && position) place(position.x, position.y, false);
    });
  });
  observer.observe(node, {childList:true});
  addEventListener('resize', () => { if (position) place(position.x, position.y, false); });
  restore();
})();
