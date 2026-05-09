import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Coffee, Dices, MessageSquare, Share2, Swords, Wrench } from 'lucide-react';
import { Button, Tooltip, TooltipContent, TooltipTrigger, cn } from '@anvil/ui';
import type {
  ActionLogEntry,
  ClientMessage,
  DrawSteelDieResult,
  DrawSteelRollKind,
  SceneActionLogType,
} from '../../types/protocol.js';

interface ActionLogPanelProps {
  entries: ActionLogEntry[];
  sceneType: string | null;
  send: (msg: ClientMessage) => void;
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

export function ActionLogPanel({ entries, sceneType, send, className }: ActionLogPanelProps) {
  const currentSection = asLogSceneType(sceneType);
  const [openSection, setOpenSection] = useState<SceneActionLogType | null>(currentSection);
  const [modifier, setModifier] = useState('0');

  useEffect(() => {
    if (currentSection) setOpenSection(currentSection);
  }, [currentSection]);

  const groupedEntries = useMemo(() => {
    const groups = new Map<SceneActionLogType, ActionLogEntry[]>();
    for (const section of LOG_SECTIONS) groups.set(section.id, []);
    for (const entry of entries) {
      groups.get(entry.sceneType)?.push(entry);
    }
    return groups;
  }, [entries]);

  if (!currentSection) return null;

  const roll = (kind: DrawSteelRollKind) => {
    const parsedModifier = Number.parseInt(modifier, 10);
    send({
      type: 'draw_steel_roll',
      roll: {
        kind,
        modifier: kind === 'power' && Number.isFinite(parsedModifier) ? parsedModifier : undefined,
      },
    });
  };

  return (
    <div className={cn('flex min-h-0 flex-col border-zinc-800 bg-zinc-900/60', className)}>
      <div className="shrink-0 border-b border-zinc-800 p-2">
        <div className="mb-2 flex items-center gap-2">
          <Dices className="size-3.5 text-zinc-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Draw Steel Dice</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <Button type="button" variant="secondary" size="sm" className="h-7 px-2 text-xs" onClick={() => roll('power')}>
            Power
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => roll('heroic-resource')}>
            Resource
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => roll('d6')}>
            d6
          </Button>
        </div>
        <label className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
          Mod
          <input
            type="number"
            value={modifier}
            onChange={(event) => setModifier(event.target.value)}
            className="h-7 w-20 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100"
          />
        </label>
      </div>

      <div className="shrink-0 border-b border-zinc-800 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Action Log
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {LOG_SECTIONS.map(({ id, label, Icon }) => {
          const sectionEntries = groupedEntries.get(id) ?? [];
          const isOpen = openSection === id;
          return (
            <section key={id} className="border-b border-zinc-800/70">
              <div className="flex items-center text-xs text-zinc-300 transition hover:bg-zinc-800/60">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left"
                  onClick={() => setOpenSection(isOpen ? null : id)}
                  aria-expanded={isOpen}
                >
                  <Icon className="size-3.5 text-zinc-500" />
                  <span className="min-w-0 flex-1 font-medium">{label}</span>
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">{sectionEntries.length}</span>
                  <ChevronDown className={cn('size-3.5 text-zinc-500 transition', isOpen && 'rotate-180')} />
                </button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mr-2 size-7 shrink-0 text-zinc-500 hover:text-zinc-100"
                      onClick={() => exportActionLog(label, sectionEntries)}
                      aria-label={`Export ${label} log`}
                    >
                      <Share2 className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">export log</TooltipContent>
                </Tooltip>
              </div>
              {isOpen && (
                <div className="divide-y divide-zinc-800/60">
                  {sectionEntries.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-zinc-600">No actions yet.</p>
                  ) : (
                    [...sectionEntries].reverse().map((entry) => (
                      <LogEntryRow key={entry.id} entry={entry} />
                    ))
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function LogEntryRow({ entry }: { entry: ActionLogEntry }) {
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
