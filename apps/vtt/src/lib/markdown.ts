import { marked } from 'marked';
import TurndownService from 'turndown';
import { sanitizeHtml } from './html-sanitizer.js';

// Configure marked for synchronous parsing
marked.use({ async: false });

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

export function markdownToHtml(md: string): string {
  if (!md) return '';
  return sanitizeHtml(marked.parse(md) as string);
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  return turndown.turndown(html);
}
