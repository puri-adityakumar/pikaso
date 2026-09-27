/**
 * @module inject
 * Injects the annotate.js client script into a frame's HTML before </body>.
 * If </body> is absent, appends at end. Never writes to disk.
 */

/**
 * Inject a <script> tag loading the annotate overlay into an HTML string.
 * @param {string} html   Original HTML source.
 * @param {string} [scriptUrl]  URL of the script to inject (default: '/annotate.js').
 * @returns {string}  Modified HTML with injected script.
 */
export function injectScript(html, scriptUrl = '/annotate.js') {
  const tag = `<script src="${scriptUrl}" type="module"></script>`;
  const closeBody = html.toLowerCase().lastIndexOf('</body>');
  if (closeBody === -1) {
    return html + '\n' + tag;
  }
  return html.slice(0, closeBody) + tag + '\n' + html.slice(closeBody);
}
