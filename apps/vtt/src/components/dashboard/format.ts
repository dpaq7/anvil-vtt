import type { CampaignSession } from '../sessions/types.js';

export function mergeOrder(savedOrder: string[], currentIds: string[]) {
  const current = new Set(currentIds);
  return [
    ...savedOrder.filter((id) => current.has(id)),
    ...currentIds.filter((id) => !savedOrder.includes(id)),
  ];
}

export function readStoredOrder(storageKey: string) {
  try {
    const value = localStorage.getItem(storageKey);
    if (!value) return [];
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function writeStoredOrder(storageKey: string, order: string[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(order));
  } catch {
    /* noop */
  }
}

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
