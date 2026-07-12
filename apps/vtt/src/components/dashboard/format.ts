import type { CampaignSession } from '../sessions/types.js';

export function toTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value.replace(' ', 'T'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatDate(value: string | null | undefined) {
  const timestamp = toTimestamp(value);
  if (!timestamp) return 'No activity';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function formatBytes(value: number | null) {
  if (!value) return 'Size unknown';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function plainPreview(content: string) {
  return content
    .replace(/[`*_>#\-[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'A';
}

export function livePath(session: CampaignSession) {
  return session.status === 'lobby' ? `/app/session/${session.id}/lobby` : `/app/session/${session.id}`;
}
