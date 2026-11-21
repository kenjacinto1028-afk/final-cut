/* v14.5 tutorial position: independent of the game save and guided-step rerenders. */
(() => {
  'use strict';
  const node = document.getElementById('tutorial');
  if (!node) return;
  const key = 'finalcut_tutorial_position_v1';
  const margin = 8;
  let position = null;
  let drag = null;
  let autoPlaceQueued = false;

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
    queueAutomaticPlacement();
  }

  // Keep guided actions usable even before the player manually moves the guide.
  function queueAutomaticPlacement() {
    if (position || autoPlaceQueued || node.hidden) return;
    autoPlaceQueued = true;
    requestAnimationFrame(() => {
      autoPlaceQueued = false;
      if (position || node.hidden) return;
      const width = node.getBoundingClientRect().width;
      const height = node.getBoundingClientRect().height;
      const maxX = Math.max(margin, innerWidth - width - margin);
      const maxY = Math.max(margin, innerHeight - height - margin);
      const candidates = [[margin,maxY],[margin,margin],[maxX,margin],[maxX,maxY]];
      const important = [...document.querySelectorAll('#main button.primary, #drawer button.primary, .tutorial-target, #mobile-nav-toggle')]
        .filter(el => el.getClientRects().length && !el.closest('#tutorial'))
        .map(el => ({rect: el.getBoundingClientRect(), weight: el.classList.contains('tutorial-target') || el.id === 'mobile-nav-toggle' ? 100 : 1}))
        .filter(item => item.rect.width < innerWidth * .75 && item.rect.height < innerHeight * .55);
      function overlap(x,y,r) {
        return Math.max(0,Math.min(x+width,r.right+12)-Math.max(x,r.left-12)) *
          Math.max(0,Math.min(y+height,r.bottom+12)-Math.max(y,r.top-12));
      }
      candidates.sort((a,b) => important.reduce((s,item)=>s+item.weight*overlap(a[0],a[1],item.rect),0) -
        important.reduce((s,item)=>s+item.weight*overlap(b[0],b[1],item.rect),0));
      node.style.left = candidates[0][0] + 'px';
      node.style.top = candidates[0][1] + 'px';
      node.style.right = 'auto';
      node.style.bottom = 'auto';
    });
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
    queueAutomaticPlacement();
    if (position && !node.hidden) requestAnimationFrame(() => {
      if (!drag && position) place(position.x, position.y, false);
    });
  });
  observer.observe(node, {childList:true});
  addEventListener('resize', () => { if (position) place(position.x, position.y, false); else queueAutomaticPlacement(); });
  // Game content often scrolls into view after a step is rendered; re-evaluate then.
  document.addEventListener('scroll', queueAutomaticPlacement, {capture:true, passive:true});
  restore();
})();
