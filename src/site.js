/**
 * @module site
 * Generated HTML pages for Pikaso's HTML mode (all served under /site/):
 *   siteIndexPage — the entry: one card per frame linking to its screen page
 *   siteAllPage   — every screen stacked on one page, at natural size
 *   screenPage    — one frame as a centered artboard (never stretched) with a
 *                   caption footer and prev/next sibling links
 *
 * Mockup content itself is served from /frames/<name>/mockup.html inside an
 * iframe (annotate.js injected there), so pins stay live on every page.
 */

import { loadProject, loadAnnotations } from './board.js';

/** Landing palette identity colors (mirrors public/board.js FRAME_COLORS) */
const SITE_COLORS = ['#62d96b', '#f2cf62', '#a9e8eb', '#f4b8c0', '#9fe7a4'];

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Read frame metadata + open-pin counts for the generated site pages.
 * @param {string} root  Board root.
 * @returns {Array<{name:string,status:string,w:number,h:number,open:number,color:string}>}
 */
function framesMeta(root) {
  try {
    const project = loadProject(root);
    return (project.frames ?? []).map((f, i) => {
      let open = 0;
      try {
        open = loadAnnotations(root, f.name).filter(a => a.status === 'open').length;
      } catch { /* no annotations file yet */ }
      return { name: f.name, status: f.status, w: f.w, h: f.h, open, color: SITE_COLORS[i % SITE_COLORS.length] };
    });
  } catch { return []; }
}

/** Shared <head> for generated site pages — landing fonts + tokens */
function siteHead(title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@800&family=Lora:wght@400&family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Manrope", -apple-system, "Segoe UI", Roboto, sans-serif;
    background: #fbf9f4;
    color: #2b2a26;
  }
  a { color: inherit; }
  .brand {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: "Epilogue", sans-serif;
    font-weight: 800; font-size: 15px; letter-spacing: -0.3px;
    color: #2b2a26; text-decoration: none;
  }
  .brand::before {
    content: ''; width: 12px; height: 12px; border-radius: 50%; background: #62d96b;
    box-shadow: inset -2px -3px 4px rgba(0,0,0,0.22), inset 2px 3px 4px rgba(255,255,255,0.5);
  }
  .dot {
    width: 10px; height: 10px; border-radius: 50%; flex: none; display: inline-block;
    box-shadow: inset -1px -2px 2px rgba(0,0,0,0.22), inset 1px 2px 2px rgba(255,255,255,0.5);
  }
  .chip {
    font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
    background: #f4f2ea; color: #84837b;
  }
  .chip.locked { background: rgba(98,217,107,0.25); color: #2b2a26; }
  .count { font-size: 11.5px; font-weight: 800; }
  .count.zero { color: #84837b; font-weight: 600; }
  .foot {
    display: flex; justify-content: center; align-items: center; gap: 24px;
    font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #2b2a26;
  }
  .foot a { text-decoration: none; opacity: 0.6; transition: opacity 0.15s ease; }
  .foot a:hover { opacity: 1; }
  .foot .off { opacity: 0.25; }
  .screen-iframe {
    display: block; border: 1px solid rgba(43,42,38,0.14); border-radius: 10px;
    background: #fff; box-shadow: 0 16px 36px rgba(43,42,38,0.12);
  }
  </style>
</head>
`;
}

/** Relay: forward board postMessages (annotate mode) into the mockup iframe */
function siteRelayScript() {
  return `<script>
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'pikaso-annotate') {
      document.querySelectorAll('iframe').forEach(function (f) {
        f.contentWindow.postMessage(e.data, '*');
      });
    }
  });
  <\/script>`;
}

/** Head row for one screen: dot + name + status chip + pin count + size */
function screenMetaRow(f) {
  const count = f.open > 0 ? `<span class="count">◉ ${f.open} open</span>` : `<span class="count zero">◎ 0 open</span>`;
  return `<div style="display:flex; align-items:center; gap:10px; margin:0 0 12px;">
    <span class="dot" style="background:${f.color}"></span>
    <span style="font-family:'Epilogue',sans-serif; font-weight:800; font-size:12.5px; letter-spacing:0.04em; text-transform:uppercase;">${escHtml(f.name)}</span>
    <span class="chip${f.status === 'locked' ? ' locked' : ''}">${escHtml(f.status)}</span>
    ${count}
    <span style="margin-left:auto; font-family:ui-monospace,Consolas,monospace; font-size:11px; color:#84837b;">${f.w} × ${f.h}</span>
  </div>`;
}

/** One screen: meta row + iframe at natural size, centered */
function screenSection(f, withSoloLink) {
  const solo = withSoloLink
    ? `<div class="foot" style="margin-top:14px;"><a href="/site/${encodeURIComponent(f.name)}.html">open solo ↗</a></div>`
    : '';
  return `<section style="margin:0 0 56px;">
  ${screenMetaRow(f)}
  <div style="display:grid; place-items:center;">
    <iframe class="screen-iframe" src="/frames/${encodeURIComponent(f.name)}/mockup.html" scrolling="no" style="width:${f.w}px; height:${f.h}px;" title="${escHtml(f.name)}"></iframe>
  </div>
  ${solo}
</section>`;
}

/**
 * /site/index.html — the entry: one card per frame linking to its screen page,
 * plus a link to the all-screens sheet.
 * @param {string} root  Board root.
 * @returns {string} HTML
 */
export function siteIndexPage(root) {
  const frames = framesMeta(root);
  const cards = frames.map((f) => {
    const count = f.open > 0
      ? `<span class="count">◉ ${f.open} open</span>`
      : `<span class="count zero">◎ 0 open</span>`;
    return `<a class="card" href="/site/${encodeURIComponent(f.name)}.html">
      <span class="dot" style="background:${f.color}"></span>
      <span class="name">${escHtml(f.name)}</span>
      <span class="meta"><span class="chip">${escHtml(f.status)}</span>${count}<span class="size">${f.w} × ${f.h}</span></span>
    </a>`;
  }).join('\n');

  return `${siteHead('pikaso — index')}
<body>
  <div class="wrap">
    <a class="brand" href="/">pikaso</a>
    <h1>Mockups</h1>
    <p class="sub">${frames.length} page${frames.length === 1 ? '' : 's'} · pick one to open it as a screen · <a href="/site/all.html">see all at once ↗</a></p>
    ${frames.length ? `<nav class="grid">${cards}</nav>` : '<div class="empty">No mockups yet — generate a frame and it shows up here.</div>'}
  </div>
  <style>
    .wrap { max-width: 900px; margin: 0 auto; padding: 72px 24px 96px; }
    h1 { font-family: "Lora", Georgia, serif; font-weight: 400; font-size: 30px; margin: 20px 0 6px; }
    .sub { font-size: 13.5px; color: #84837b; margin-bottom: 32px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
    .card {
      display: flex; flex-direction: column; gap: 10px;
      background: #fff; border: 1px solid rgba(43,42,38,0.14);
      border-radius: 12px; padding: 16px 18px;
      text-decoration: none;
      box-shadow: 0 10px 26px rgba(43,42,38,0.08);
      transition: transform 0.2s cubic-bezier(0.6,0,0,1), box-shadow 0.2s cubic-bezier(0.6,0,0,1);
    }
    .card:hover { transform: translate(-2px, -2px); box-shadow: 4px 5px 0 -1px rgba(98,217,107,0.45); }
    .name { font-weight: 800; font-size: 14px; letter-spacing: 0.04em; text-transform: uppercase; }
    .meta { display: flex; align-items: center; gap: 10px; font-size: 11.5px; }
    .size { color: #84837b; font-family: ui-monospace, Consolas, monospace; margin-left: auto; }
    .empty {
      border: 1px dashed rgba(43,42,38,0.2); border-radius: 12px;
      padding: 44px 24px; text-align: center; color: #84837b; font-size: 14px;
    }
  </style>
${siteRelayScript()}
</body>
</html>`;
}

/**
 * /site/all.html — every screen stacked on one page, at natural size.
 * @param {string} root  Board root.
 * @returns {string} HTML
 */
export function siteAllPage(root) {
  const frames = framesMeta(root);
  const sections = frames.map(f => screenSection(f, true)).join('\n');
  return `${siteHead('pikaso — all screens')}
<body style="min-height:100vh;">
  <div style="max-width:1100px; margin:0 auto; padding:56px 24px 96px;">
    <a class="brand" href="/">pikaso</a>
    <h1 style="font-family:'Lora',Georgia,serif; font-weight:400; font-size:30px; margin:20px 0 6px;">All screens</h1>
    <p style="font-size:13.5px; color:#84837b; margin-bottom:44px;">${frames.length} page${frames.length === 1 ? '' : 's'} stacked · <a href="/site/index.html">‹ back to index</a></p>
    ${sections || '<div style="border:1px dashed rgba(43,42,38,0.2); border-radius:12px; padding:44px 24px; text-align:center; color:#84837b;">No mockups yet.</div>'}
  </div>
${siteRelayScript()}
</body>
</html>`;
}

/**
 * /site/<name>.html — one screen as an artboard: centered at its natural size
 * on the paper background (never stretched), with a caption footer offering
 * index / prev / next / all-screens navigation, focus-skill style.
 * @param {string} root  Board root.
 * @param {string} name  Frame name.
 * @returns {string} HTML
 */
export function screenPage(root, name) {
  const frames = framesMeta(root);
  const idx = frames.findIndex(f => f.name === name);
  if (idx === -1) return '<h1>404 — page not found</h1>';
  const f = frames[idx];
  const prev = frames[idx - 1];
  const next = frames[idx + 1];
  const count = f.open > 0 ? `◉ ${f.open} open` : '◎ 0 open';
  const link = (label, href) => href
    ? `<a href="${href}">${label}</a>`
    : `<span class="off">${label}</span>`;

  return `${siteHead(`pikaso · ${f.name}`)}
<body style="min-height:100vh; display:grid; place-items:center; padding:56px 32px 84px;">
  <main>
    ${screenMetaRow(f)}
    <iframe class="screen-iframe" src="/frames/${encodeURIComponent(f.name)}/mockup.html" scrolling="no" style="width:${f.w}px; height:${f.h}px;" title="${escHtml(f.name)}"></iframe>
    <div class="foot" style="margin-top:16px;">
      ${link('‹ index', '/site/index.html')}
      ${link(`← ${prev ? escHtml(prev.name) : 'prev'}`, prev ? `/site/${encodeURIComponent(prev.name)}.html` : null)}
      ${link(`${next ? escHtml(next.name) : 'next'} →`, next ? `/site/${encodeURIComponent(next.name)}.html` : null)}
      ${link('all screens', '/site/all.html')}
    </div>
  </main>
${siteRelayScript()}
</body>
</html>`;
}
