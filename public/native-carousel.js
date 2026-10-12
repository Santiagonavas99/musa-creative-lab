/* MUSA mobile carousel: one native 3D ring, no React layers or pointer-state rerenders.
   Scroll remains vertical; horizontal drags rotate the ring with short inertia. */
(() => {
  let cleanup = () => {};
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  function mount() {
    cleanup();
    const element = document.getElementById('musa-native-cylinder');
    if (!element) return;
    const ring = element.querySelector('.musa-native-ring');
    if (!ring) return;
    element.dataset.interactive = 'true';
    let angle = 0;
    let velocity = 0;
    let current = null;
    let last = 0;
    let raf = 0;
    let visible = true;
    let suppressClickUntil = 0;
    let holdUntil = 0;
    let hover = false;
    let dead = false;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    const paint = () => { ring.style.transform = 'rotateY(' + angle.toFixed(3) + 'deg)'; };
    const stopFrame = () => { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; };
    function frame(now) {
      raf = 0;
      if (dead || !visible || document.hidden) { last = 0; return; }
      const dt = last ? Math.min(now - last, 48) : 16;
      last = now;
      if (!current?.dragging) {
        if (Math.abs(velocity) > 0.006) {
          angle += velocity * dt;
          velocity *= Math.exp(-dt / 260);
          if (Math.abs(velocity) < 0.006) velocity = 0;
        } else if (!reduced && now >= holdUntil && !hover) {
          angle += 14 * dt / 1000;
        }
      }
      paint();
      raf = requestAnimationFrame(frame);
    }
    const wake = () => { if (!dead && visible && !document.hidden && !raf) raf = requestAnimationFrame(frame); };
    function down(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (current) return;
      const now = performance.now();
      current = { id:event.pointerId, startX:event.clientX, startY:event.clientY,
        x:event.clientX, startAngle:angle, time:now, dragging:false, vertical:false,
        samples:[{t:now,a:angle}] };
      velocity = 0;
      holdUntil = now + 1500;
      wake();
    }
    function move(event) {
      const p = current;
      if (!p || event.pointerId !== p.id || p.vertical) return;
      const dx = event.clientX - p.startX;
      const dy = event.clientY - p.startY;
      if (!p.dragging) {
        if (Math.abs(dy) > 9 && Math.abs(dy) > Math.abs(dx) * 1.2) {
          p.vertical = true;
          current = null; // Let normal page scrolling continue
          holdUntil = performance.now() + 350;
          return;
        }
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
        p.dragging = true;
        element.dataset.dragging = 'true';
        try { element.setPointerCapture(event.pointerId); } catch {}
      }
      if (event.cancelable) event.preventDefault();
      // A swipe of roughly 130px advances one card in a six-card ring.
      const degPerPx = clamp(360 / (Math.max(3, element.querySelectorAll('.musa-native-card').length) * 130), .25, .7);
      angle = p.startAngle + dx * degPerPx;
      const now = performance.now();
      p.samples.push({t:now,a:angle});
      while (p.samples.length > 2 && now - p.samples[0].t > 110) p.samples.shift();
      paint();
      wake();
    }
    function release(event) {
      const p = current;
      if (!p || event.pointerId !== p.id) return;
      current = null;
      delete element.dataset.dragging;
      const now = performance.now();
      if (p.dragging) {
        const first = p.samples[0], lastSample = p.samples[p.samples.length - 1];
        const span = Math.max(1, lastSample.t - first.t);
        velocity = clamp((lastSample.a - first.a) / span, -.75, .75);
        suppressClickUntil = now + 350;
      }
      holdUntil = now + 1350;
      wake();
    }
    function cancel(event) {
      if (!current || event.pointerId !== current.id) return;
      current = null;
      delete element.dataset.dragging;
      velocity = 0;
      holdUntil = performance.now() + 400;
      wake();
    }
    function suppressClick(event) {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }
    const onHoverIn = event => { if (event.pointerType === 'mouse') hover = true; };
    const onHoverOut = event => { if (event.pointerType === 'mouse') {hover = false;wake();} };
    const onVisibility = () => { if (document.hidden) stopFrame(); else wake(); };
    const onKeyDown = event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const count = Math.max(3,element.querySelectorAll('.musa-native-card').length);
      angle += (event.key === 'ArrowRight' ? 1 : -1) * (360 / count);
      velocity = 0;
      holdUntil = performance.now() + 1700;
      paint();
      event.preventDefault();
      wake();
    };
    element.addEventListener('pointerdown', down);
    element.addEventListener('pointermove', move, {passive:false});
    element.addEventListener('pointerup', release);
    element.addEventListener('pointercancel', cancel);
    element.addEventListener('lostpointercapture', cancel);
    element.addEventListener('click', suppressClick, true);
    element.addEventListener('pointerenter', onHoverIn);
    element.addEventListener('pointerleave', onHoverOut);
    element.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisibility);
    element.tabIndex = 0;
    const io = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(([entry]) => {
          visible = Boolean(entry?.isIntersecting);
          if (visible) wake(); else stopFrame();
        }, {threshold:0}) : null;
    io?.observe(element);
    wake();
    cleanup = () => {
      dead = true;
      stopFrame();
      io?.disconnect();
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', release);
      element.removeEventListener('pointercancel', cancel);
      element.removeEventListener('lostpointercapture', cancel);
      element.removeEventListener('click', suppressClick, true);
      element.removeEventListener('pointerenter', onHoverIn);
      element.removeEventListener('pointerleave', onHoverOut);
      element.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }
  window.musaNativeCarousel = { mount, unmount: () => cleanup() };
  window.dispatchEvent(new Event('musa-native-carousel-ready'));
})();
