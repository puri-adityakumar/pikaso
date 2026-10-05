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
  style.id = 'pikaso-annotate-style';
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

    /* Delete button inside tooltip */
    .pikaso-delete-btn {
      font: 700 11px/1 "Manrope", -apple-system, system-ui, sans-serif;
      background: none;
      border: 1px solid rgba(244, 242, 234, 0.24);
      border-radius: 6px;
      color: rgba(244, 242, 234, 0.7);
      padding: 4px 9px;
      cursor: pointer;
      margin-top: 6px;
      pointer-events: auto;
    }
    .pikaso-delete-btn:hover { color: #ff6b5e; border-color: #ff6b5e; }

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

    /* Toast (screenshot feedback) */
    .pikaso-toast {
      position: fixed;
      bottom: 64px; left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      font: 600 12.5px/1 "Manrope", -apple-system, system-ui, sans-serif;
      color: #f4f2ea;
      background: #1d1c19;
      border: 1px solid rgba(244,242,234,0.2);
      border-radius: 999px;
      padding: 10px 18px;
      box-shadow: 0 10px 26px rgba(43,42,38,0.35);
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }
    .pikaso-toast.show { opacity: 1; }
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
  let tool = 'pin'; // 'pin' | 'pen' | 'region' | 'shot'
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
  let pendingExtra = null;

  function openCommentBox(x, y, selector, box, extra) {
    closeCommentBox();
    pendingSelector = selector;
    pendingBox = box;
    pendingExtra = extra ?? null;

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
    textarea.placeholder = pendingExtra?.type === 'region' ? 'Comment on this area…' : 'Add a comment…';
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
    pendingExtra = null;
  }

  async function saveComment(text) {
    text = (text ?? '').trim();
    if (!text) return;

    const payload = {
      selector: pendingSelector,
      box: pendingBox,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      text,
      ...(pendingExtra ?? {}),
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

    // Delete — removes the annotation entirely
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'pikaso-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.title = 'Delete this annotation';
    deleteBtn.style.display = 'block';
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const res = await fetch(
          `/api/annotations/${encodeURIComponent(FRAME_NAME)}/${encodeURIComponent(ann.id)}`,
          { method: 'DELETE' }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        currentTooltip?.remove();
        currentTooltip = null;
        await loadPins();
      } catch (err) {
        alert(`Failed to delete: ${err.message}`);
      }
    });
    tt.appendChild(deleteBtn);

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
      renderPins(anns.filter(a => (a.type ?? 'pin') === 'pin' || a.type === 'region'));
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
  let regionPoints = null;
  let selectionRect = null;

  function drawSelectionOverlay() {
    // redraw persisted strokes, then the in-progress selection rectangle
    drawFreehand(lastAnnotations);
    if (selectionRect) {
      fctx.save();
      fctx.strokeStyle = '#2f6df6';
      fctx.lineWidth = 2;
      fctx.setLineDash([6, 4]);
      fctx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.w, selectionRect.h);
      fctx.fillStyle = 'rgba(47, 109, 246, 0.08)';
      fctx.fillRect(selectionRect.x, selectionRect.y, selectionRect.w, selectionRect.h);
      fctx.restore();
    }
  }

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
      } else if (ann.type === 'region' && Array.isArray(ann.points) && ann.points.length > 2) {
        fctx.save();
        fctx.beginPath();
        fctx.moveTo(ann.points[0][0], ann.points[0][1]);
        for (let i = 1; i < ann.points.length; i++) fctx.lineTo(ann.points[i][0], ann.points[i][1]);
        fctx.closePath();
        fctx.fillStyle = ann.status === 'resolved' ? 'rgba(132,131,123,0.12)' : 'rgba(98,217,107,0.16)';
        fctx.fill();
        fctx.strokeStyle = ann.status === 'resolved' ? '#84837b' : (ann.color || '#62d96b');
        fctx.lineWidth = 2;
        fctx.stroke();
        fctx.restore();
      }
    }
    if (regionPoints && regionPoints.length > 1) {
      fctx.save();
      fctx.beginPath();
      fctx.moveTo(regionPoints[0][0], regionPoints[0][1]);
      for (let i = 1; i < regionPoints.length; i++) fctx.lineTo(regionPoints[i][0], regionPoints[i][1]);
      fctx.strokeStyle = '#62d96b';
      fctx.lineWidth = 2;
      fctx.setLineDash([5, 4]);
      fctx.stroke();
      fctx.restore();
    }
  }

  freehandCanvas.addEventListener('pointerdown', (e) => {
    if (!armed || (tool !== 'pen' && tool !== 'shot' && tool !== 'region')) return;
    e.preventDefault();
    if (tool === 'pen') {
      currentStroke = [[e.clientX, e.clientY]];
    } else if (tool === 'region') {
      regionPoints = [[e.clientX, e.clientY]];
    } else {
      selectionRect = { x: e.clientX, y: e.clientY, w: 0, h: 0 };
      selStart = [e.clientX, e.clientY];
    }
    freehandCanvas.setPointerCapture(e.pointerId);
  });
  freehandCanvas.addEventListener('pointermove', (e) => {
    if (tool === 'pen' && currentStroke) {
      currentStroke.push([e.clientX, e.clientY]);
      // redraw persisted + current partial stroke
      drawFreehand(lastAnnotations);
      drawStroke(currentStroke, '#f0883e');
    } else if (tool === 'region' && regionPoints) {
      regionPoints.push([e.clientX, e.clientY]);
      drawFreehand(lastAnnotations);
    } else if (tool === 'shot' && selectionRect && selStart) {
      selectionRect = {
        x: Math.min(selStart[0], e.clientX),
        y: Math.min(selStart[1], e.clientY),
        w: Math.abs(e.clientX - selStart[0]),
        h: Math.abs(e.clientY - selStart[1]),
      };
      drawSelectionOverlay();
    }
  });
  freehandCanvas.addEventListener('pointerup', async (e) => {
    if (tool === 'region' && regionPoints) {
      const points = regionPoints;
      regionPoints = null;
      drawFreehand(lastAnnotations);
      if (points.length < 3) return; // too small to be a region
      const xs = points.map(pt => pt[0]);
      const ys = points.map(pt => pt[1]);
      const box = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
      openCommentBox(box.x + box.w / 2, box.y + box.h / 2, null, box, { type: 'region', points });
      return;
    }
    if (tool === 'pen' && currentStroke) {
      const points = currentStroke;
      currentStroke = null;
      if (points.length < 2) { drawFreehand(lastAnnotations); return; }
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
      return;
    }
    if (tool === 'shot' && selectionRect) {
      const rect = selectionRect;
      selectionRect = null;
      selStart = null;
      if (rect.w < 10 || rect.h < 10) { drawSelectionOverlay(); return; } // too small — ignore
      drawSelectionOverlay();
      await copyScreenshot(rect);
      drawFreehand(lastAnnotations);
    }
  });

  // -------------------------------------------------------------------------
  // Screenshot to clipboard — rasterize this page via foreignObject, crop the
  // selected region, stamp the freehand strokes on top, copy as image/png.
  // -------------------------------------------------------------------------

  let selStart = null;

  async function captureRegionImage(rect) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const doc = document.documentElement.cloneNode(true);
    // strip our own UI so only the mockup is captured
    doc.querySelectorAll(
      '#pikaso-overlay, #pikaso-pins-layer, #pikaso-freehand-canvas, ' +
      '.pikaso-annotate-fab, .pikaso-annotate-toolbar, .pikaso-comment-box, ' +
      '.pikaso-toast, #pikaso-annotate-style'
    ).forEach(n => n.remove());
    // XMLSerializer yields well-formed XML (void tags self-closed) — plain
    // outerHTML breaks the SVG parser on <input>/<meta>/<br>
    const html = new XMLSerializer().serializeToString(doc);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
      `<foreignObject width="100%" height="100%">${html}</foreignObject></svg>`;

    const page = new Image();
    await new Promise((resolve, reject) => {
      page.onload = resolve;
      page.onerror = () => reject(new Error('could not rasterize the page'));
      page.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = w;
    pageCanvas.height = h;
    const ctx = pageCanvas.getContext('2d');
    ctx.drawImage(page, 0, 0, w, h);

    const out = document.createElement('canvas');
    out.width = Math.round(rect.w);
    out.height = Math.round(rect.h);
    const octx = out.getContext('2d');
    octx.drawImage(pageCanvas, rect.x, rect.y, rect.w, rect.h, 0, 0, out.width, out.height);
    // stamp the freehand strokes that fall inside the region
    octx.drawImage(freehandCanvas, rect.x, rect.y, rect.w, rect.h, 0, 0, out.width, out.height);

    return new Promise((resolve, reject) => {
      out.toBlob(blob => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png');
    });
  }

  async function copyScreenshot(rect) {
    let blob;
    try {
      blob = await captureRegionImage(rect);
    } catch (err) {
      pikasoToast(`Screenshot failed: ${err.message}`);
      return;
    }

    // 1) async clipboard (needs document focus — a real drag provides it)
    try {
      window.focus();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': Promise.resolve(blob) })]);
      pikasoToast(`Screenshot copied ✓ (${Math.round(rect.w)}×${Math.round(rect.h)})`);
      return;
    } catch { /* fall through */ }

    // 2) legacy execCommand copy via a temporarily selected image
    try {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(blob);
      img.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(img);
      const range = document.createRange();
      range.selectNode(img);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      const ok = document.execCommand('copy');
      sel.removeAllRanges();
      img.remove();
      if (ok) {
        pikasoToast(`Screenshot copied ✓ (${Math.round(rect.w)}×${Math.round(rect.h)})`);
        return;
      }
      throw new Error('execCommand copy blocked');
    } catch { /* fall through */ }

    // 3) last resort — download the PNG so the shot is never lost
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pikaso-shot.png';
    a.click();
    pikasoToast('Clipboard blocked — screenshot downloaded instead');
  }

  // debug/test hook (harmless): direct access to the region rasterizer
  window.__pikasoCaptureRegion = captureRegionImage;

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
  const regionChip = document.createElement('button');
  regionChip.className = 'pikaso-tool-chip';
  regionChip.type = 'button';
  regionChip.textContent = '⬜ Region';
  const shotChip = document.createElement('button');
  shotChip.className = 'pikaso-tool-chip';
  shotChip.type = 'button';
  shotChip.textContent = '📷 Shot';
  const doneChip = document.createElement('button');
  doneChip.className = 'pikaso-tool-chip';
  doneChip.type = 'button';
  doneChip.textContent = 'Done';
  toolbar.appendChild(pinChip);
  toolbar.appendChild(penChip);
  toolbar.appendChild(regionChip);
  toolbar.appendChild(shotChip);
  toolbar.appendChild(doneChip);

  document.body.appendChild(fab);
  document.body.appendChild(toolbar);

  // Toast helper
  let toastEl2 = null;
  let toastTimer = null;
  function pikasoToast(text) {
    toastEl2?.remove();
    clearTimeout(toastTimer);
    toastEl2 = document.createElement('div');
    toastEl2.className = 'pikaso-toast';
    toastEl2.textContent = text;
    document.body.appendChild(toastEl2);
    requestAnimationFrame(() => toastEl2.classList.add('show'));
    toastTimer = setTimeout(() => {
      toastEl2.classList.remove('show');
      toastTimer = setTimeout(() => { toastEl2?.remove(); toastEl2 = null; }, 300);
    }, 1800);
  }

  function setTool(next) {
    tool = next;
    pinChip.classList.toggle('on', tool === 'pin');
    penChip.classList.toggle('on', tool === 'pen');
    regionChip.classList.toggle('on', tool === 'region');
    shotChip.classList.toggle('on', tool === 'shot');
    disableHover();
    freehandCanvas.classList.toggle('drawing', armed && tool !== 'pin');
    if (tool !== 'shot') selectionRect = null;
    if (tool !== 'region') regionPoints = null;
  }

  function setArmed(next) {
    armed = next;
    fab.classList.toggle('armed', armed);
    fab.textContent = armed ? '✎ Annotating' : '✎ Annotate';
    toolbar.classList.toggle('visible', armed);
    if (!armed) {
      disableHover();
      setTool('pin');
      selectionRect = null;
      drawFreehand(lastAnnotations); // drop the in-progress stroke
    } else {
      enableHover();
    }
  }

  fab.addEventListener('click', () => setArmed(!armed));
  pinChip.addEventListener('click', () => setTool('pin'));
  penChip.addEventListener('click', () => setTool('pen'));
  regionChip.addEventListener('click', () => setTool('region'));
  shotChip.addEventListener('click', () => setTool('shot'));
  doneChip.addEventListener('click', () => setArmed(false));

  // Board → frame remote control (top-bar Annotate button) + annotation sync
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'pikaso-annotate') {
      setArmed(Boolean(e.data.active));
    } else if (e.data && e.data.type === 'pikaso-annotations') {
      loadPins(); // annotations changed elsewhere — refresh pins + strokes
    }
  });

  // -------------------------------------------------------------------------
  // Init
  // -------------------------------------------------------------------------

  loadPins();
  sizeFreehandCanvas();

})();
