import { useMemo } from 'react';
import { Coffee, MessageSquare, Share2, Swords, Wrench } from 'lucide-react';
import { Button, Tooltip, TooltipContent, TooltipTrigger, cn } from '@anvil/ui';
import type {
  ActionLogEntry,
  ClientMessage,
  DrawSteelDieResult,
  SceneActionLogType,
} from '../../types/protocol.js';
import { DiceRollControls } from './DiceRollControls.js';

interface ActionLogPanelProps {
  entries: ActionLogEntry[];
  sceneType: string | null;
  activeSceneId?: string | null;
  send?: (msg: ClientMessage) => void;
  showDiceControls?: boolean;
  className?: string;
}

const LOG_SECTIONS: Array<{
  id: SceneActionLogType;
  label: string;
  Icon: typeof Swords;
}> = [
  { id: 'battle', label: 'Battle', Icon: Swords },
  { id: 'negotiation', label: 'Negotiation', Icon: MessageSquare },
  { id: 'montage', label: 'Montage', Icon: Wrench },
  { id: 'respite', label: 'Respite', Icon: Coffee },
];

function asLogSceneType(sceneType: string | null): SceneActionLogType | null {
  return sceneType === 'battle' || sceneType === 'negotiation' || sceneType === 'montage' || sceneType === 'respite'
    ? sceneType
    : null;
}

export function ActionLogPanel({
  entries,
  sceneType,
  activeSceneId,
  send,
  showDiceControls = true,
  className,
}: ActionLogPanelProps) {
  const currentSection = asLogSceneType(sceneType);

  const currentEntries = useMemo(() => {
    if (!currentSection) return [];
    return entries.filter((entry) => {
      if (activeSceneId && entry.sceneId) return entry.sceneId === activeSceneId;
      return entry.sceneType === currentSection;
    });
  }, [activeSceneId, currentSection, entries]);

  if (!currentSection) return null;

  const section = LOG_SECTIONS.find((item) => item.id === currentSection);
  const Icon = section?.Icon ?? Swords;
  const label = section?.label ?? 'Scene';

  return (
    <div className={cn('flex min-h-0 flex-col border-zinc-800 bg-zinc-900/60', className)}>
      {showDiceControls && send && (
        <div className="shrink-0 border-b border-zinc-800 p-2">
          <DiceRollControls send={send} className="h-auto flex-wrap justify-start bg-transparent p-0 shadow-none" />
        </div>
      )}
      <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800 px-3 py-2 text-xs text-zinc-300">
        <Icon className="size-3.5 text-zinc-500" />
        <span className="min-w-0 flex-1 font-semibold uppercase tracking-wider text-zinc-500">Action Log</span>
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">{currentEntries.length}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-zinc-500 hover:text-zinc-100"
              onClick={() => exportActionLog(label, currentEntries)}
              aria-label={`Export ${label} log`}
            >
              <Share2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">export log</TooltipContent>
        </Tooltip>
      </div>

      <div className="min-h-0 flex-1 divide-y divide-zinc-800/60 overflow-y-auto">
        {currentEntries.length === 0 ? (
          <p className="px-3 py-3 text-xs text-zinc-600">No actions yet.</p>
        ) : (
          [...currentEntries].reverse().map((entry) => (
            <LogEntryRow key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}

function LogEntryRow({ entry }: { entry: ActionLogEntry }) {
  const rollModifiers = formatRollModifiers(entry);
  return (
    <article className="px-3 py-2 text-xs">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="break-words font-medium text-zinc-200">{entry.title}</p>
          {entry.detail && <p className="mt-0.5 break-words text-[11px] leading-snug text-zinc-500">{entry.detail}</p>}
        </div>
        <time className="shrink-0 text-[10px] text-zinc-600">{formatTime(entry.timestamp)}</time>
      </div>
      {(entry.dice?.length || entry.total !== undefined) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {entry.dice?.map((die, index) => (
            <DieChip key={`${entry.id}-${index}`} die={die} />
          ))}
          {entry.total !== undefined && (
            <>
              <span className="text-[11px] text-zinc-600">=</span>
              <span className="font-mono text-sm font-bold tabular-nums text-zinc-100">{entry.total}</span>
            </>
          )}
          {rollModifiers.map((part) => (
            <span key={part} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
              {part}
            </span>
          ))}
          {entry.tier && (
            <span className="ml-auto rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
              T{entry.tier}
            </span>
          )}
        </div>
      )}
    </article>
  );
}

function DieChip({ die }: { die: DrawSteelDieResult }) {
  const label = die.faceSet === 'd10-twice'
    ? 'd10 on d20'
    : die.faceSet === 'd3-twice'
      ? 'd3 on d6'
      : 'd6';

  return (
    <span
      title={label}
      className={cn(
        'flex size-6 items-center justify-center bg-zinc-800 font-mono text-[11px] font-bold text-zinc-100 ring-1 ring-zinc-700',
        die.shape === 'd6' && 'rounded-md',
      )}
      style={die.shape === 'd20' ? { clipPath: 'polygon(50% 0%, 88% 14%, 100% 50%, 88% 86%, 50% 100%, 12% 86%, 0 50%, 12% 14%)' } : undefined}
    >
      {die.value}
    </span>
  );
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function exportActionLog(sectionLabel: string, entries: ActionLogEntry[]) {
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

  const modifiers = formatRollModifiers(entry);
  if (modifiers.length > 0) {
    parts.push(`Modifiers: ${modifiers.join(', ')}`);
  }

  if (entry.tier) {
    parts.push(`Tier: T${entry.tier}`);
  }

  return parts.join(' | ');
}

function formatRollModifiers(entry: ActionLogEntry): string[] {
  const parts: string[] = [];
  if (entry.modifier !== undefined && entry.modifier !== 0) {
    parts.push(`${entry.modifier >= 0 ? '+' : ''}${entry.modifier} mod`);
  }
  if (entry.edges) parts.push(`${entry.edges} edge${entry.edges === 1 ? '' : 's'}`);
  if (entry.banes) parts.push(`${entry.banes} bane${entry.banes === 1 ? '' : 's'}`);
  if (entry.rollState === 'double-edge' || entry.rollState === 'double-bane') {
    parts.push(formatRollState(entry.rollState));
  }
  return parts;
}

function formatRollState(rollState: NonNullable<ActionLogEntry['rollState']>): string {
  return rollState
    .split('-')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
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
