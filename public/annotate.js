/**
 * @module annotate
 * Pikaso annotation overlay — injected into every frame mockup.
 *
 * Features:
 *   - Hover: dashed outline on elements
 *   - Click: capture CSS selector path + bounding box + viewport → comment box
 *   - Comment box: textarea + Save / Cancel
 *   - Numbered pins positioned at annotation boxes
 *   - Resolved pins greyed out
 *   - Reloads annotations from /api/annotations/:frame on init and after save
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // Frame name — derived from the URL path: /frames/<name>/mockup.html or /site/<name>.html
  // -------------------------------------------------------------------------
  const pathMatch = location.pathname.match(/\/frames\/([^/]+)\/mockup\.html/)
    || location.pathname.match(/\/site\/([^/]+)\.html/);
  if (!pathMatch) return; // not running inside a pikaso frame
  const FRAME_NAME = decodeURIComponent(pathMatch[1]);

  // -------------------------------------------------------------------------
  // Styles
  // -------------------------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = `
    .pikaso-hover-outline {
      outline: 2px dashed #3fbf57 !important;
      outline-offset: 2px !important;
      cursor: crosshair !important;
    }
    .pikaso-comment-box {
      position: fixed;
      z-index: 2147483647;
      background: #1d1c19;
      border: 1px solid rgba(244, 242, 234, 0.14);
      border-radius: 10px;
      padding: 12px 14px;
      min-width: 260px;
      max-width: 340px;
      box-shadow: 5px 6px 0 -1px rgba(98, 217, 107, 0.45), 0 16px 36px rgba(43, 42, 38, 0.3);
      font-family: "Manrope", -apple-system, "Segoe UI", system-ui, sans-serif;
      font-size: 13px;
      color: #f4f2ea;
    }
    .pikaso-comment-box textarea {
      width: 100%;
      min-height: 72px;
      background: #2b2a25;
      border: 1px solid rgba(244, 242, 234, 0.16);
      border-radius: 7px;
      color: #f4f2ea;
      font: 600 13px/1.5 "Manrope", -apple-system, "Segoe UI", system-ui, sans-serif;
      padding: 7px 9px;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
      margin-bottom: 8px;
    }
    .pikaso-comment-box textarea:focus { border-color: #62d96b; }
    .pikaso-comment-box textarea::placeholder { color: rgba(244, 242, 234, 0.45); font-weight: 400; }
    .pikaso-comment-actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
    .pikaso-btn {
      font: 700 12px/1 "Manrope", -apple-system, "Segoe UI", system-ui, sans-serif;
      border-radius: 7px;
      padding: 6px 13px;
      border: none;
      cursor: pointer;
    }
    .pikaso-btn-save {
      background: #f2cf62;
      color: #2b2a26;
    }
    .pikaso-btn-save:hover { background: #f8e9a9; }
    .pikaso-btn-cancel {
      background: none;
      color: rgba(244, 242, 234, 0.55);
    }
    .pikaso-btn-cancel:hover { color: #f4f2ea; }

    /* Annotation pins */
    .pikaso-pin {
      position: absolute;
      z-index: 2147483646;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #62d96b;
      color: #1d1c19;
      font: 800 11px/18px "Manrope", -apple-system, "Segoe UI", system-ui, sans-serif;
      text-align: center;
      cursor: pointer;
      pointer-events: auto;
      border: 2px solid #fff;
      box-shadow: inset -2px -3px 4px rgba(0,0,0,0.25), inset 2px 3px 4px rgba(255,255,255,0.45), 0 2px 6px rgba(0,0,0,0.35);
      user-select: none;
    }
    .pikaso-pin.resolved {
      background: #84837b;
      border-color: #f4f2ea;
      color: #f4f2ea;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    /* Pin tooltip */
    .pikaso-pin-tooltip {
      position: absolute;
      z-index: 2147483647;
      background: #1d1c19;
      border: 1px solid rgba(244, 242, 234, 0.14);
      border-radius: 8px;
      padding: 8px 12px;
      max-width: 280px;
      font: 600 12px/1.5 "Manrope", -apple-system, "Segoe UI", system-ui, sans-serif;
      color: #f4f2ea;
      box-shadow: 0 12px 28px rgba(43, 42, 38, 0.35);
      pointer-events: none;
      white-space: pre-wrap;
    }
    /* Resolve button inside tooltip */
    .pikaso-resolve-btn {
      font: 700 11px/1 "Manrope", -apple-system, "Segoe UI", system-ui, sans-serif;
      background: none;
      border: 1px solid rgba(244, 242, 234, 0.24);
      border-radius: 6px;
      color: rgba(244, 242, 234, 0.7);
      padding: 4px 9px;
      cursor: pointer;
      margin-top: 6px;
      pointer-events: auto;
    }
    .pikaso-resolve-btn:hover { color: #62d96b; border-color: #62d96b; }

    /* Hover target layer */
    #pikaso-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483640;
      pointer-events: none;
    }
    #pikaso-overlay.active { pointer-events: auto; }
    #pikaso-pins-layer {
      position: fixed;
      inset: 0;
      z-index: 2147483645;
      pointer-events: none;
    }

    /* Floating annotate button (bottom-left) */
    .pikaso-annotate-fab {
      position: fixed;
      bottom: 18px; left: 18px;
      z-index: 2147483647;
      font: 700 12px/1 "Manrope", -apple-system, system-ui, sans-serif;
      color: #f4f2ea;
      background: #1d1c19;
      border: 1px solid rgba(244,242,234,0.2);
      border-radius: 999px;
      padding: 10px 16px;
      cursor: pointer;
      box-shadow: 0 10px 26px rgba(43,42,38,0.35);
      user-select: none;
      transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
    }
    .pikaso-annotate-fab:hover { transform: translateY(-1px); }
    .pikaso-annotate-fab.armed {
      background: #62d96b;
      color: #1d1c19;
      border-color: transparent;
      box-shadow: 3px 4px 0 -1px rgba(29,28,25,0.45);
    }

    /* Mini toolbar (visible while armed) */
    .pikaso-annotate-toolbar {
      position: fixed;
      bottom: 64px; left: 18px;
      z-index: 2147483647;
      display: none;
      gap: 4px;
      background: #1d1c19;
      border: 1px solid rgba(244,242,234,0.2);
      border-radius: 10px;
      padding: 5px;
      box-shadow: 0 10px 26px rgba(43,42,38,0.35);
    }
    .pikaso-annotate-toolbar.visible { display: flex; }
    .pikaso-tool-chip {
      font: 700 11.5px/1 "Manrope", -apple-system, system-ui, sans-serif;
      color: rgba(244,242,234,0.7);
      background: none;
      border: none;
      border-radius: 7px;
      padding: 7px 11px;
      cursor: pointer;
    }
    .pikaso-tool-chip:hover { color: #f4f2ea; }
    .pikaso-tool-chip.on { background: #f2cf62; color: #1d1c19; }

    /* Freehand drawing canvas */
    #pikaso-freehand-canvas {
      position: fixed;
      inset: 0;
      z-index: 2147483644;
      pointer-events: none;
    }
    #pikaso-freehand-canvas.drawing { pointer-events: auto; cursor: crosshair; }
  `;
  document.head.appendChild(style);

  // -------------------------------------------------------------------------
  // Overlay layers
  // -------------------------------------------------------------------------
  const overlay = document.createElement('div');
  overlay.id = 'pikaso-overlay';
  document.body.appendChild(overlay);

  const pinsLayer = document.createElement('div');
  pinsLayer.id = 'pikaso-pins-layer';
  document.body.appendChild(pinsLayer);

  // -------------------------------------------------------------------------
  // Selector path builder
  // -------------------------------------------------------------------------

  /**
   * Build a stable, unambiguous CSS selector path for an element,
   * scoped to document.body (id → nth-of-type chain).
   * @param {Element} el
   * @returns {string}
   */
  function buildSelectorPath(el) {
    if (!el || el === document.body) return 'body';
    const parts = [];
    let node = el;
    while (node && node !== document.body && node.nodeType === 1) {
      if (node.id) {
        parts.unshift(`#${CSS.escape(node.id)}`);
        break; // id is unique — stop here
      }
      const tag = node.tagName.toLowerCase();
      const siblings = Array.from(node.parentElement?.children ?? []).filter(
        c => c.tagName === node.tagName
      );
      if (siblings.length === 1) {
        parts.unshift(tag);
      } else {
        const idx = siblings.indexOf(node) + 1;
        parts.unshift(`${tag}:nth-of-type(${idx})`);
      }
      node = node.parentElement;
    }
    return parts.length ? parts.join(' > ') : el.tagName.toLowerCase();
  }

  // -------------------------------------------------------------------------
  // Annotate mode — OFF until armed via the floating button or a board message.
  // While idle, clicks pass through to the mockup (links work as normal).
  // -------------------------------------------------------------------------
  let armed = false;
  let tool = 'pin'; // 'pin' | 'pen'
  let hoveredEl = null;

  function enableHover() {
    overlay.classList.add('active');
  }

  function disableHover() {
    overlay.classList.remove('active');
    if (hoveredEl) {
      hoveredEl.classList.remove('pikaso-hover-outline');
      hoveredEl = null;
    }
  }

  // We attach mousemove to document (works even through the transparent overlay layer)
  document.addEventListener('mousemove', (e) => {
    if (!armed || tool !== 'pin' || commentBox) return; // idle / pen / comment box — no hover
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === document.body || el === document.documentElement) return;
    if (el.closest('#pikaso-overlay, #pikaso-pins-layer, .pikaso-comment-box, .pikaso-pin, .pikaso-pin-tooltip')) return;
    if (hoveredEl !== el) {
      hoveredEl?.classList.remove('pikaso-hover-outline');
      hoveredEl = el;
      el.classList.add('pikaso-hover-outline');
    }
  });

  // -------------------------------------------------------------------------
  // Comment box
  // -------------------------------------------------------------------------
  let commentBox = null;
  let pendingSelector = null;
  let pendingBox = null;

  function openCommentBox(x, y, selector, box) {
    closeCommentBox();
    pendingSelector = selector;
    pendingBox = box;

    commentBox = document.createElement('div');
    commentBox.className = 'pikaso-comment-box';

    // Position near click, keep in viewport
    const W = window.innerWidth;
    const H = window.innerHeight;
    const boxW = 300;
    let left = x + 12;
    let top  = y + 12;
    if (left + boxW > W - 10) left = x - boxW - 12;
    if (top + 160 > H - 10)   top  = H - 170;
    commentBox.style.left = `${Math.max(4, left)}px`;
    commentBox.style.top  = `${Math.max(4, top)}px`;

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Add a comment…';
    commentBox.appendChild(textarea);

    const actions = document.createElement('div');
    actions.className = 'pikaso-comment-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'pikaso-btn pikaso-btn-save';
    saveBtn.textContent = 'Save';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'pikaso-btn pikaso-btn-cancel';
    cancelBtn.textContent = 'Cancel';

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    commentBox.appendChild(actions);
    document.body.appendChild(commentBox);
    textarea.focus();

    saveBtn.addEventListener('click', () => saveComment(textarea.value));
    cancelBtn.addEventListener('click', closeCommentBox);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCommentBox();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveComment(textarea.value);
    });
  }

  function closeCommentBox() {
    commentBox?.remove();
    commentBox = null;
    pendingSelector = null;
    pendingBox = null;
  }

  async function saveComment(text) {
    text = (text ?? '').trim();
    if (!text) return;

    const payload = {
      selector: pendingSelector,
      box: pendingBox,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      text,
    };

    try {
      const res = await fetch(`/api/annotations/${encodeURIComponent(FRAME_NAME)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      closeCommentBox();
      await loadPins();
    } catch (err) {
      alert(`Failed to save annotation: ${err.message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Click to annotate
  // -------------------------------------------------------------------------

  document.addEventListener('click', (e) => {
    if (!armed || tool !== 'pin') return; // annotate mode only, pin tool only
    // Ignore clicks on our own UI
    if (e.target.closest('.pikaso-comment-box, .pikaso-pin, .pikaso-pin-tooltip, .pikaso-annotate-fab, .pikaso-annotate-toolbar')) return;
    // Ignore clicks on overlay / pins layer
    if (e.target.closest('#pikaso-overlay, #pikaso-pins-layer')) return;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === document.body || el === document.documentElement) return;
    if (el.closest('#pikaso-overlay, #pikaso-pins-layer, .pikaso-comment-box')) return;

    e.preventDefault();
    e.stopPropagation();

    const selector = buildSelectorPath(el);
    const rect = el.getBoundingClientRect();
    const box = { x: rect.left, y: rect.top, w: rect.width, h: rect.height };

    openCommentBox(e.clientX, e.clientY, selector, box);
  }, true);

  // -------------------------------------------------------------------------
  // Pins rendering
  // -------------------------------------------------------------------------

  let currentTooltip = null;

  function clearPins() {
    pinsLayer.innerHTML = '';
    currentTooltip = null;
  }

  /**
   * Render annotation pins on the page (element pins only — freehand strokes
   * are drawn on the canvas overlay).
   * @param {Array<{id:string,selector:string,box:{x,y,w,h},text:string,status:string}>} annotations
   */
  function renderPins(annotations) {
    clearPins();
    annotations.forEach((ann, idx) => {
      const pin = document.createElement('div');
      pin.className = 'pikaso-pin' + (ann.status === 'resolved' ? ' resolved' : '');
      pin.textContent = String(idx + 1);
      pin.style.pointerEvents = 'auto';

      // Position at top-right of the bounding box
      const x = ann.box.x + ann.box.w - 10;
      const y = ann.box.y - 10;
      pin.style.left = `${Math.max(0, x)}px`;
      pin.style.top  = `${Math.max(0, y)}px`;
      pin.style.position = 'fixed';

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTooltip(pin, ann, idx + 1);
      });

      pinsLayer.appendChild(pin);
    });
  }

  function toggleTooltip(pin, ann, num) {
    if (currentTooltip) {
      currentTooltip.remove();
      currentTooltip = null;
      return;
    }

    const tt = document.createElement('div');
    tt.className = 'pikaso-pin-tooltip';

    const rect = pin.getBoundingClientRect();
    let left = rect.right + 8;
    let top  = rect.top;
    if (left + 300 > window.innerWidth) left = rect.left - 308;
    tt.style.left = `${Math.max(4, left)}px`;
    tt.style.top  = `${Math.max(4, top)}px`;
    tt.style.position = 'fixed';

    tt.innerHTML = `<strong>(${num})</strong> ${escHtml(ann.text)}`;

    if (ann.status !== 'resolved') {
      const resolveBtn = document.createElement('button');
      resolveBtn.className = 'pikaso-resolve-btn';
      resolveBtn.textContent = 'Mark resolved';
      resolveBtn.style.display = 'block';
      resolveBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          const res = await fetch(
            `/api/annotations/${encodeURIComponent(FRAME_NAME)}/${encodeURIComponent(ann.id)}`,
            { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'resolved' }) }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          currentTooltip?.remove();
          currentTooltip = null;
          await loadPins();
        } catch (err) {
          alert(`Failed to resolve: ${err.message}`);
        }
      });
      tt.appendChild(resolveBtn);
    }

    pinsLayer.appendChild(tt);
    currentTooltip = tt;

    // Close tooltip on outside click
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!tt.contains(e.target) && !pin.contains(e.target)) {
          tt.remove();
          if (currentTooltip === tt) currentTooltip = null;
          document.removeEventListener('click', handler);
        }
      });
    }, 0);
  }

  // -------------------------------------------------------------------------
  // Load pins from API
  // -------------------------------------------------------------------------

  let lastAnnotations = [];

  async function loadPins() {
    try {
      const res = await fetch(`/api/annotations/${encodeURIComponent(FRAME_NAME)}`);
      if (!res.ok) return;
      const anns = await res.json();
      lastAnnotations = anns;
      renderPins(anns.filter(a => (a.type ?? 'pin') === 'pin'));
      drawFreehand(anns);
    } catch { /* server may not be running */ }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // -------------------------------------------------------------------------
  // Freehand pen — strokes live on a canvas overlay; each stroke is stored
  // as a freehand annotation (points + color) so it survives reloads and
  // reaches the agent as context.
  // -------------------------------------------------------------------------

  const freehandCanvas = document.createElement('canvas');
  freehandCanvas.id = 'pikaso-freehand-canvas';
  document.body.appendChild(freehandCanvas);
  const fctx = freehandCanvas.getContext('2d');

  function sizeFreehandCanvas() {
    freehandCanvas.width = window.innerWidth;
    freehandCanvas.height = window.innerHeight;
    // redraw persisted strokes after resize
    if (lastAnnotations.length) drawFreehand(lastAnnotations);
  }
  window.addEventListener('resize', sizeFreehandCanvas);

  let currentStroke = null;

  function drawStroke(points, color) {
    if (points.length < 2) return;
    fctx.strokeStyle = color;
    fctx.lineWidth = 3;
    fctx.lineCap = 'round';
    fctx.lineJoin = 'round';
    fctx.beginPath();
    fctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) fctx.lineTo(points[i][0], points[i][1]);
    fctx.stroke();
  }

  function clearFreehandCanvas() {
    fctx.clearRect(0, 0, freehandCanvas.width, freehandCanvas.height);
  }

  function drawFreehand(annotations) {
    clearFreehandCanvas();
    for (const ann of annotations) {
      if (ann.type === 'freehand' && Array.isArray(ann.points)) {
        drawStroke(ann.points, ann.color || '#f0883e');
      }
    }
  }

  freehandCanvas.addEventListener('pointerdown', (e) => {
    if (!armed || tool !== 'pen') return;
    e.preventDefault();
    currentStroke = [[e.clientX, e.clientY]];
    freehandCanvas.setPointerCapture(e.pointerId);
  });
  freehandCanvas.addEventListener('pointermove', (e) => {
    if (!currentStroke) return;
    currentStroke.push([e.clientX, e.clientY]);
    // redraw persisted + current partial stroke
    drawFreehand(lastAnnotations);
    drawStroke(currentStroke, '#f0883e');
  });
  freehandCanvas.addEventListener('pointerup', async () => {
    if (!currentStroke) return;
    const points = currentStroke;
    currentStroke = null;
    if (points.length < 2) { drawFreehand(lastAnnotations); return; }
    const xs = points.map(pt => pt[0]);
    const ys = points.map(pt => pt[1]);
    try {
      const res = await fetch(`/api/annotations/${encodeURIComponent(FRAME_NAME)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'freehand',
          points,
          color: '#f0883e',
          viewport: { w: window.innerWidth, h: window.innerHeight },
          text: 'Freehand annotation',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadPins();
    } catch (err) {
      alert(`Failed to save freehand stroke: ${err.message}`);
      drawFreehand(lastAnnotations);
    }
  });

  // -------------------------------------------------------------------------
  // Annotate button + toolbar (floating) — the way to ARM annotation mode.
  // The board top bar mirrors this state over postMessage.
  // -------------------------------------------------------------------------

  const fab = document.createElement('button');
  fab.className = 'pikaso-annotate-fab';
  fab.type = 'button';
  fab.textContent = '✎ Annotate';

  const toolbar = document.createElement('div');
  toolbar.className = 'pikaso-annotate-toolbar';
  const pinChip = document.createElement('button');
  pinChip.className = 'pikaso-tool-chip on';
  pinChip.type = 'button';
  pinChip.textContent = '📌 Pin';
  const penChip = document.createElement('button');
  penChip.className = 'pikaso-tool-chip';
  penChip.type = 'button';
  penChip.textContent = '✏️ Pen';
  const doneChip = document.createElement('button');
  doneChip.className = 'pikaso-tool-chip';
  doneChip.type = 'button';
  doneChip.textContent = 'Done';
  toolbar.appendChild(pinChip);
  toolbar.appendChild(penChip);
  toolbar.appendChild(doneChip);

  document.body.appendChild(fab);
  document.body.appendChild(toolbar);

  function setTool(next) {
    tool = next;
    pinChip.classList.toggle('on', tool === 'pin');
    penChip.classList.toggle('on', tool === 'pen');
    disableHover();
    freehandCanvas.classList.toggle('drawing', armed && tool === 'pen');
  }

  function setArmed(next) {
    armed = next;
    fab.classList.toggle('armed', armed);
    fab.textContent = armed ? '✎ Annotating' : '✎ Annotate';
    toolbar.classList.toggle('visible', armed);
    if (!armed) {
      disableHover();
      setTool('pin');
      drawFreehand(lastAnnotations); // drop the in-progress stroke
    } else {
      enableHover();
    }
  }

  fab.addEventListener('click', () => setArmed(!armed));
  pinChip.addEventListener('click', () => setTool('pin'));
  penChip.addEventListener('click', () => setTool('pen'));
  doneChip.addEventListener('click', () => setArmed(false));

  // Board → frame remote control (top-bar Annotate button)
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'pikaso-annotate') {
      setArmed(Boolean(e.data.active));
    }
  });

  // -------------------------------------------------------------------------
  // Init
  // -------------------------------------------------------------------------

  loadPins();
  sizeFreehandCanvas();

})();
