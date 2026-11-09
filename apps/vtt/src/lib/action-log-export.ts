import type { ActionLogEntry, DrawSteelDieResult } from '../types/protocol.js';

export function exportActionLog(sectionLabel: string, entries: ActionLogEntry[]) {
  if (typeof document === 'undefined') return;

  const blob = new Blob([formatActionLogExport(sectionLabel, entries)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `anvil-${slugify(sectionLabel)}-action-log-${formatFileDate(new Date())}.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function formatActionLogExport(sectionLabel: string, entries: ActionLogEntry[]): string {
  const lines = [
    `${sectionLabel} Action Log`,
    `Exported ${formatExportTimestamp(Date.now())}`,
    `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`,
    '',
  ];

  if (entries.length === 0) {
    lines.push('No actions yet.');
    return `${lines.join('\n')}\n`;
  }

  for (const entry of entries) {
    lines.push(`[${formatExportTimestamp(entry.timestamp)}] ${entry.title}`);
    if (entry.actorName) lines.push(`Actor: ${entry.actorName}`);
    if (entry.detail) lines.push(entry.detail);

    const rollLine = formatRollExport(entry);
    if (rollLine) lines.push(rollLine);

    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function formatRollExport(entry: ActionLogEntry): string {
  const parts: string[] = [];

  if (entry.dice?.length) {
    parts.push(`Dice: ${entry.dice.map(formatDieExport).join(', ')}`);
  }

  if (entry.total !== undefined) {
    parts.push(`Total: ${entry.total}`);
  }

  if (entry.tier) {
    parts.push(`Tier: T${entry.tier}`);
  }

  return parts.join(' | ');
}

function formatDieExport(die: DrawSteelDieResult): string {
  const label = die.faceSet === 'd10-twice'
    ? 'd10 on d20'
    : die.faceSet === 'd3-twice'
      ? 'd3 on d6'
      : 'd6';

  return `${label}=${die.value}`;
}

function formatExportTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatFileDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'log';
}
