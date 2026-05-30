const ALLOWED_ELEMENTS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'ul',
]);

const GLOBAL_ATTRIBUTES = new Set(['aria-label']);
const LINK_ATTRIBUTES = new Set(['href', 'title']);
const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

function isSafeUrl(value: string): boolean {
  if (value.startsWith('/') || value.startsWith('#')) return true;
  try {
    return SAFE_URL_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

function sanitizeElement(element: Element): Node {
  const tagName = element.tagName.toLowerCase();
  const replacement = ALLOWED_ELEMENTS.has(tagName)
    ? document.createElement(tagName)
    : document.createDocumentFragment();

  if (replacement instanceof HTMLElement) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (GLOBAL_ATTRIBUTES.has(name)) {
        replacement.setAttribute(name, attribute.value);
      } else if (tagName === 'a' && LINK_ATTRIBUTES.has(name)) {
        if (name === 'href' && !isSafeUrl(attribute.value)) continue;
        replacement.setAttribute(name, attribute.value);
      }
    }

    if (tagName === 'a' && replacement.getAttribute('href')) {
      replacement.setAttribute('rel', 'noopener noreferrer');
      replacement.setAttribute('target', '_blank');
    }
  }

  for (const child of Array.from(element.childNodes)) {
    const sanitized = sanitizeNode(child);
    if (sanitized) replacement.appendChild(sanitized);
  }

  return replacement;
}

function sanitizeNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? '');
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  return sanitizeElement(node as Element);
}

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  if (typeof document === 'undefined' || typeof DOMParser === 'undefined') return html;

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const fragment = document.createDocumentFragment();

  for (const child of Array.from(parsed.body.childNodes)) {
    const sanitized = sanitizeNode(child);
    if (sanitized) fragment.appendChild(sanitized);
  }

  const container = document.createElement('div');
  container.appendChild(fragment);
  return container.innerHTML;
}
