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
  // Frame name — derived from the URL path: /frames/<name>/mockup.html
  // -------------------------------------------------------------------------
  const pathMatch = location.pathname.match(/\/frames\/([^/]+)\/mockup\.html/);
  if (!pathMatch) return; // not running inside a pikaso frame
  const FRAME_NAME = decodeURIComponent(pathMatch[1]);

  // -------------------------------------------------------------------------
  // Styles
  // -------------------------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = `
    .pikaso-hover-outline {
      outline: 2px dashed #388bfd !important;
      outline-offset: 2px !important;
      cursor: crosshair !important;
    }
    .pikaso-comment-box {
      position: fixed;
      z-index: 2147483647;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 12px 14px;
      min-width: 260px;
      max-width: 340px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
      font-size: 13px;
      color: #e6edf3;
    }
    .pikaso-comment-box textarea {
      width: 100%;
      min-height: 72px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 5px;
      color: #e6edf3;
      font: 13px/1.5 -apple-system, "Segoe UI", system-ui, sans-serif;
      padding: 7px 9px;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
      margin-bottom: 8px;
    }
    .pikaso-comment-box textarea:focus { border-color: #388bfd; }
    .pikaso-comment-box textarea::placeholder { color: #484f58; }
    .pikaso-comment-actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
    .pikaso-btn {
      font: 12px/1 -apple-system, "Segoe UI", system-ui, sans-serif;
      border-radius: 5px;
      padding: 5px 12px;
      border: 1px solid #30363d;
      cursor: pointer;
    }
    .pikaso-btn-save {
      background: #238636;
      color: #fff;
      border-color: #238636;
    }
    .pikaso-btn-save:hover { background: #2ea043; }
    .pikaso-btn-cancel {
      background: #21262d;
      color: #8b949e;
    }
    .pikaso-btn-cancel:hover { color: #e6edf3; }

    /* Annotation pins */
    .pikaso-pin {
      position: absolute;
      z-index: 2147483646;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #388bfd;
      color: #fff;
      font: bold 11px/22px -apple-system, "Segoe UI", system-ui, sans-serif;
      text-align: center;
      cursor: pointer;
      pointer-events: auto;
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      user-select: none;
    }
    .pikaso-pin.resolved {
      background: #484f58;
      border-color: #30363d;
      color: #8b949e;
    }
    /* Pin tooltip */
    .pikaso-pin-tooltip {
      position: absolute;
      z-index: 2147483647;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 8px 12px;
      max-width: 280px;
      font: 12px/1.5 -apple-system, "Segoe UI", system-ui, sans-serif;
      color: #e6edf3;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      pointer-events: none;
      white-space: pre-wrap;
    }
    /* Resolve button inside tooltip */
    .pikaso-resolve-btn {
      font: 11px/1 -apple-system, "Segoe UI", system-ui, sans-serif;
      background: none;
      border: 1px solid #30363d;
      border-radius: 4px;
      color: #8b949e;
      padding: 3px 8px;
      cursor: pointer;
      margin-top: 6px;
      pointer-events: auto;
    }
    .pikaso-resolve-btn:hover { color: #3fb950; border-color: #3fb950; }

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
  // Hover outline
  // -------------------------------------------------------------------------
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
    if (commentBox) return; // comment box open — don't track hover
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
    // Ignore clicks on our own UI
    if (e.target.closest('.pikaso-comment-box, .pikaso-pin, .pikaso-pin-tooltip')) return;
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
   * Render annotation pins on the page.
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

  async function loadPins() {
    try {
      const res = await fetch(`/api/annotations/${encodeURIComponent(FRAME_NAME)}`);
      if (!res.ok) return;
      const anns = await res.json();
      renderPins(anns);
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
  // Init
  // -------------------------------------------------------------------------

  loadPins();

})();
