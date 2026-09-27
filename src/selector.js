/**
 * @module selector
 * Builds a stable, unambiguous CSS selector path for a DOM element.
 * Extracted so it can be unit-tested outside a browser environment.
 */

/**
 * Build a stable CSS selector path scoped to a root element (default: document.body).
 *
 * Strategy:
 *   - If the element has an `id`, use `#id` and stop.
 *   - Otherwise use `tag:nth-of-type(n)` chain up to root.
 *   - If the element is the only one of its tag among siblings, omit nth-of-type.
 *
 * @param {Element | {id:string, tagName:string, nodeType:number, parentElement:object, children:Array}} el
 * @param {Element | object | null} [root]  Stop walking at this ancestor (inclusive). Defaults to document.body when available.
 * @returns {string}
 */
export function buildSelectorPath(el, root) {
  // Determine stop node
  const stopAt = root ??
    (typeof document !== 'undefined' ? document.body : null);

  if (!el || el === stopAt) return 'body';

  const parts = [];
  let node = el;

  while (node && node !== stopAt && node.nodeType === 1) {
    if (node.id) {
      const escaped = typeof CSS !== 'undefined'
        ? CSS.escape(node.id)
        : node.id.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');
      parts.unshift(`#${escaped}`);
      break; // id is globally unique — stop
    }

    const tag = node.tagName.toLowerCase();
    const parent = node.parentElement;

    if (!parent) {
      parts.unshift(tag);
      break;
    }

    const siblings = Array.from(parent.children).filter(
      c => c.tagName === node.tagName
    );

    if (siblings.length === 1) {
      parts.unshift(tag);
    } else {
      const idx = siblings.indexOf(node) + 1;
      parts.unshift(`${tag}:nth-of-type(${idx})`);
    }

    node = parent;
  }

  return parts.length ? parts.join(' > ') : el.tagName.toLowerCase();
}
