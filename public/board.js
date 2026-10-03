/**
 * @module board
 * Pikaso board UI — vanilla ESM, no frameworks, no bundler.
 *
 * Features:
 *   - Pan/zoom canvas (wheel = zoom to cursor, drag = pan, CSS transform)
 *   - Frames rendered as same-origin iframes from /api/project
 *   - Frame labels: name · status · N open (annotation count from /api/annotations/:name)
 *   - Zoom pill (bottom-left): [ - ] [ 100% ] [ + ]
 *   - New Frame strip (top-bar): text input + Generate button → POST /api/frames
 *   - Lock button (bottom-right): modal → POST /api/lock
 *   - SSE live reload: /events → reload matching iframe or refresh annotation counts
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {{ tx: number, ty: number, scale: number }} */
const view = { tx: 60, ty: 80, scale: 1 };

const SCALE_MIN = 0.1;
const SCALE_MAX = 4;
const SCALE_STEP = 0.1;

/** @type {Map<string, HTMLIFrameElement>} frameName → iframe element */
const frameIframes = new Map();

/** @type {Map<string, HTMLElement>} frameName → label element */
const frameLabels = new Map();

/** Landing palette — identity colors so frames are distinguishable at a glance */
const FRAME_COLORS = ['#62d96b', '#f2cf62', '#a9e8eb', '#f4b8c0', '#9fe7a4'];

/** @type {Map<string, string>} frameName → its identity color */
const frameColors = new Map();

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------

const canvas      = /** @type {HTMLDivElement}    */ (document.getElementById('canvas'));
const boardRoot   = /** @type {HTMLDivElement}    */ (document.getElementById('board-root'));
const zoomLabel   = /** @type {HTMLSpanElement}   */ (document.getElementById('zoom-label'));
const boardName   = /** @type {HTMLSpanElement}   */ (document.getElementById('board-name'));
const newFrameInput = /** @type {HTMLInputElement}  */ (document.getElementById('new-frame-input'));
const newFrameBtn   = /** @type {HTMLButtonElement} */ (document.getElementById('new-frame-btn'));
const modalOverlay  = /** @type {HTMLDivElement}    */ (document.getElementById('modal-overlay'));
const modalStats    = /** @type {HTMLParagraphElement} */ (document.getElementById('modal-stats'));
const modalRunBtn   = /** @type {HTMLButtonElement} */ (document.getElementById('modal-run-btn'));
const modalCopyBtn  = /** @type {HTMLButtonElement} */ (document.getElementById('modal-copy-btn'));
const modalCancelBtn = /** @type {HTMLButtonElement} */ (document.getElementById('modal-cancel-btn'));
const toastEl       = /** @type {HTMLDivElement}    */ (document.getElementById('toast'));

// ---------------------------------------------------------------------------
// Canvas transform
// ---------------------------------------------------------------------------

function applyTransform() {
  canvas.style.transform = `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`;
  zoomLabel.textContent = `${Math.round(view.scale * 100)}%`;
}

function clampScale(s) {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, s));
}

// ---------------------------------------------------------------------------
// Pan (drag)
// ---------------------------------------------------------------------------

let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panStartTx = 0;
let panStartTy = 0;

boardRoot.addEventListener('mousedown', (e) => {
  // Only pan on left-button drag of the background (not iframes / buttons)
  if (e.button !== 0) return;
  if (e.target !== boardRoot && e.target !== canvas) return;
  isPanning = true;
  panStartX = e.clientX;
  panStartY = e.clientY;
  panStartTx = view.tx;
  panStartTy = view.ty;
  boardRoot.classList.add('panning');
});

window.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  view.tx = panStartTx + (e.clientX - panStartX);
  view.ty = panStartTy + (e.clientY - panStartY);
  applyTransform();
});

window.addEventListener('mouseup', () => {
  if (!isPanning) return;
  isPanning = false;
  boardRoot.classList.remove('panning');
});

// ---------------------------------------------------------------------------
// Zoom (wheel)
// ---------------------------------------------------------------------------

boardRoot.addEventListener('wheel', (e) => {
  e.preventDefault();

  // Cursor position relative to boardRoot
  const rect = boardRoot.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;

  const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
  const newScale = clampScale(view.scale + delta);
  const ratio = newScale / view.scale;

  // Keep point under cursor stationary
  view.tx = cx - ratio * (cx - view.tx);
  view.ty = cy - ratio * (cy - view.ty);
  view.scale = newScale;

  applyTransform();
}, { passive: false });

// ---------------------------------------------------------------------------
// Zoom pill buttons
// ---------------------------------------------------------------------------

document.getElementById('zoom-out').addEventListener('click', () => {
  view.scale = clampScale(view.scale - SCALE_STEP);
  applyTransform();
});

document.getElementById('zoom-in').addEventListener('click', () => {
  view.scale = clampScale(view.scale + SCALE_STEP);
  applyTransform();
});

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let toastTimer = null;

/**
 * Show a brief toast message.
 * @param {string} msg
 * @param {number} [ms=2500]
 */
function toast(msg, ms = 2500) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

/**
 * @param {string} url
 * @param {RequestInit} [opts]
 * @returns {Promise<any>}
 */
async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error ?? `HTTP ${res.status}`), { status: res.status });
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Annotation count fetcher
// ---------------------------------------------------------------------------

/**
 * Fetch annotation count (open only) for a frame.
 * @param {string} name
 * @returns {Promise<number>}
 */
async function fetchOpenCount(name) {
  try {
    const anns = await apiFetch(`/api/annotations/${encodeURIComponent(name)}`);
    return anns.filter(a => a.status === 'open').length;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Label rendering
// ---------------------------------------------------------------------------

/**
 * Update a frame's label element with current status and open annotation count.
 * @param {string} name
 * @param {'draft'|'locked'} status
 * @param {number} openCount
 */
function renderLabel(name, status, openCount) {
  const el = frameLabels.get(name);
  if (!el) return;

  const statusCls = status === 'locked' ? 'frame-status locked' : 'frame-status';
  const annCls = openCount > 0 ? 'ann-count' : 'ann-count zero';
  const annText = openCount > 0 ? `◉ ${openCount} open` : '◎ 0 open';
  const color = frameColors.get(name) ?? FRAME_COLORS[0];

  el.innerHTML =
    `<span class="frame-dot" style="background:${color}"></span>` +
    `<span class="frame-name">${escHtml(name)}</span>` +
    `<span class="${statusCls}">${status}</span>` +
    `<span class="${annCls}">${annText}</span>`;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Board rendering
// ---------------------------------------------------------------------------

/**
 * Render all frames from project data onto the canvas.
 * @param {{ name: string, frames: Array<{id:string,name:string,x:number,y:number,w:number,h:number,status:string}> }} project
 */
async function renderBoard(project) {
  // Update board name in top bar
  boardName.textContent = project.name ?? 'board';

  // Remove wrappers for frames that no longer exist
  const existingNames = new Set(project.frames.map(f => f.name));
  for (const [name, iframe] of frameIframes) {
    if (!existingNames.has(name)) {
      iframe.closest('.frame-wrapper')?.remove();
      frameIframes.delete(name);
      frameLabels.delete(name);
    }
  }

  // Add / update frames
  for (let i = 0; i < project.frames.length; i++) {
    const { name, x, y, w, h, status } = project.frames[i];

    // Identity color — frames get distinct dot + border tint from the landing palette
    const color = FRAME_COLORS[i % FRAME_COLORS.length];
    frameColors.set(name, color);

    let wrapper = /** @type {HTMLDivElement|null} */ (canvas.querySelector(`[data-frame="${CSS.escape(name)}"]`));

    if (!wrapper) {
      // Create wrapper
      wrapper = document.createElement('div');
      wrapper.className = 'frame-wrapper';
      wrapper.dataset.frame = name;

      // Label
      const label = document.createElement('div');
      label.className = 'frame-label';
      wrapper.appendChild(label);
      frameLabels.set(name, label);

      // iframe
      const iframe = document.createElement('iframe');
      iframe.className = 'frame-iframe';
      iframe.src = `/frames/${encodeURIComponent(name)}/mockup.html`;
      iframe.setAttribute('scrolling', 'no');
      wrapper.appendChild(iframe);
      frameIframes.set(name, iframe);

      canvas.appendChild(wrapper);
    } else {
      // Ensure label ref is up to date
      if (!frameLabels.has(name)) {
        frameLabels.set(name, wrapper.querySelector('.frame-label'));
      }
      if (!frameIframes.has(name)) {
        frameIframes.set(name, wrapper.querySelector('iframe'));
      }
    }

    // Position + size
    wrapper.style.left = `${x}px`;
    wrapper.style.top  = `${y}px`;

    const iframe = frameIframes.get(name);
    iframe.width  = String(w);
    iframe.height = String(h);
    iframe.style.width  = `${w}px`;
    iframe.style.height = `${h}px`;
    iframe.style.borderColor = color + 'b3';

    // Fetch annotation count and render label
    const openCount = await fetchOpenCount(name);
    renderLabel(name, status, openCount);
  }
}

// ---------------------------------------------------------------------------
// New Frame
// ---------------------------------------------------------------------------

/**
 * Submit the new-frame form.
 */
async function submitNewFrame() {
  const description = newFrameInput.value.trim();
  if (!description) {
    newFrameInput.focus();
    return;
  }

  // Derive a safe name from the description (lowercase, replace spaces/punctuation with -)
  const name = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'frame';

  newFrameBtn.disabled = true;
  newFrameBtn.textContent = 'Creating…';

  try {
    await apiFetch('/api/frames', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });

    newFrameInput.value = '';

    // Show the Bob prompt hint
    toast(`Frame "${name}" created — ask Bob: "Design the ${description} screen for @pikaso"`, 5000);

    // Reload board
    const project = await apiFetch('/api/project');
    await renderBoard(project);
  } catch (err) {
    toast(`Error: ${err.message}`);
  } finally {
    newFrameBtn.disabled = false;
    newFrameBtn.textContent = '+ Generate mockup';
  }
}

newFrameBtn.addEventListener('click', submitNewFrame);
newFrameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitNewFrame();
});

// ---------------------------------------------------------------------------
// Lock modal
// ---------------------------------------------------------------------------

let lockData = null;

document.getElementById('lock-btn').addEventListener('click', async () => {
  // Gather stats from current project
  try {
    const project = await apiFetch('/api/project');
    const frameCount = project.frames.length;

    // Count annotations across all frames
    let resolved = 0;
    let open = 0;
    for (const frame of project.frames) {
      try {
        const anns = await apiFetch(`/api/annotations/${encodeURIComponent(frame.name)}`);
        resolved += anns.filter(a => a.status === 'resolved').length;
        open += anns.filter(a => a.status === 'open').length;
      } catch { /* frame may have no annotations yet */ }
    }

    lockData = { frameCount, resolved, open };
    modalStats.textContent = `${frameCount} frame${frameCount !== 1 ? 's' : ''}  ·  ${resolved} resolved  ·  ${open} open`;
    modalOverlay.classList.add('open');
  } catch (err) {
    toast(`Error: ${err.message}`);
  }
});

modalCancelBtn.addEventListener('click', () => {
  modalOverlay.classList.remove('open');
  lockData = null;
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('open');
    lockData = null;
  }
});

async function doLock(run) {
  modalRunBtn.disabled = true;
  modalCopyBtn.disabled = true;
  try {
    // run=false (Copy prompt) must NOT dispatch agentCommand server-side
    const result = await apiFetch('/api/lock', { method: 'POST', body: JSON.stringify({ run }) });
    modalOverlay.classList.remove('open');
    toast('Locked! DESIGN-SPEC.md written.', 4000);
    return result;
  } catch (err) {
    toast(`Lock failed: ${err.message}`);
    return null;
  } finally {
    modalRunBtn.disabled = false;
    modalCopyBtn.disabled = false;
  }
}

modalRunBtn.addEventListener('click', async () => {
  const result = await doLock(true);
  if (result?.prompt) {
    toast('Sent to Bob Shell.', 3000);
  }
});

modalCopyBtn.addEventListener('click', async () => {
  const result = await doLock(false);
  if (result?.prompt) {
    try {
      await navigator.clipboard.writeText(result.prompt);
      toast('Prompt copied to clipboard!', 3000);
    } catch {
      toast('Prompt ready — paste from clipboard not available, check console.');
      console.log('[pikaso] implementation prompt:\n', result.prompt);
    }
  }
});

// ---------------------------------------------------------------------------
// SSE live reload
// ---------------------------------------------------------------------------

function connectSSE() {
  const es = new EventSource('/events');

  es.addEventListener('reload', (e) => {
    try {
      const { frame } = JSON.parse(e.data);
      const iframe = frameIframes.get(frame);
      if (iframe) {
        // Force reload of just this iframe
        iframe.src = iframe.src; // eslint-disable-line no-self-assign
      }
    } catch { /* malformed event */ }
  });

  es.addEventListener('annotations', (e) => {
    try {
      const { frame } = JSON.parse(e.data);
      fetchOpenCount(frame).then(count => {
        apiFetch('/api/project').then(project => {
          const f = project.frames.find(fr => fr.name === frame);
          if (f) renderLabel(frame, f.status, count);
        }).catch(() => {});
      });
    } catch { /* malformed event */ }
  });

  es.addEventListener('lock', () => {
    // Re-render all labels with updated locked status
    apiFetch('/api/project').then(project => renderBoard(project)).catch(() => {});
  });

  es.onerror = () => {
    // Reconnect after 3 s
    es.close();
    setTimeout(connectSSE, 3000);
  };
}

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------

async function init() {
  applyTransform();

  try {
    const project = await apiFetch('/api/project');
    await renderBoard(project);
  } catch (err) {
    // Board may not have any frames yet — that's fine
    console.warn('[pikaso] Could not load project:', err.message);
  }

  connectSSE();
}

init();
