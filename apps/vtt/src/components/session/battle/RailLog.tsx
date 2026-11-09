import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { exportActionLog } from '../../../lib/action-log-export.js';
import type { ActionLogEntry } from '../../../types/protocol.js';
import { DieChip } from '../ActionLogPanel.js';

const time = (timestamp: number | string) =>
  new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/**
 * The log in a rail (`sb-log`): newest first, one line a row, and a row with more to it opens on
 * click or keyboard to show the detail and dice. A new row is bold for a few seconds. Entries
 * reach a Player already masked (`maskHiddenNames`), so the rows and the export read "Something" for a hidden
 * creature.
 */
export function RailLog({ entries, sceneType, activeSceneId }: { entries: ActionLogEntry[]; sceneType: string | null; activeSceneId?: string | null }) {
  const list = useMemo(
    () => entries.filter((entry) => (activeSceneId && entry.sceneId ? entry.sceneId === activeSceneId : entry.sceneType === sceneType)),
    [activeSceneId, entries, sceneType],
  );
  const newestFirst = useMemo(() => list.slice().reverse(), [list]);
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    const known = seen.current;
    const ids = list.map((e) => e.id);
    seen.current = new Set(ids);
    if (!known) return;
    const added = ids.filter((id) => !known.has(id));
    if (added.length === 0) return;
    setFresh(new Set(added));
    const timer = setTimeout(() => setFresh(new Set()), 4000);
    return () => clearTimeout(timer);
  }, [list]);
  const label = sceneType ? sceneType.charAt(0).toUpperCase() + sceneType.slice(1) : 'Scene';

  return (
    <section className="sb-sec sb-log" aria-label="Log">
      <div className="sb-sub sb-sub--flat">
        <b>Log</b>
        <span className="flex items-center gap-2.5">
          {list.length} {list.length === 1 ? 'entry' : 'entries'}
          <button type="button" className="sb-link" aria-label={`Export ${label} log`} onClick={() => exportActionLog(label, list)}>Export</button>
        </span>
      </div>
      {list.length === 0 && <p className="sb-note">No actions yet.</p>}
      {newestFirst.map((entry) => <LogRow key={entry.id} entry={entry} isNew={fresh.has(entry.id)} />)}
    </section>
  );
}

function LogRow({ entry, isNew }: { entry: ActionLogEntry; isNew: boolean }) {
  const [open, setOpen] = useState(false);
  const title = entry.title.replace(/\s\d{12,}\b/g, '').replace(/\.+$/, '');
  const hasRoll = Boolean(entry.dice?.length) || entry.total !== undefined;
  if (!entry.detail && !hasRoll) {
    return (
      <div className="sb-log__e" data-new={isNew || undefined}>
        <span>{title}</span>
        <time>{time(entry.timestamp)}</time>
      </div>
    );
  }
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <>
      <button type="button" className="sb-log__e sb-log__b" data-new={isNew || undefined} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>{title}<Chevron size={13} strokeWidth={3} aria-hidden="true" className="ml-1 inline align-[-2px]" /></span>
        <time>{time(entry.timestamp)}</time>
      </button>
      {open && (
        <div className="sb-log__more">
          {entry.detail && <p>{entry.detail.replace(/\s\d{12,}\b/g, '')}</p>}
          {hasRoll && (
            <div className="flex flex-wrap items-center gap-1.5">
              {entry.dice?.map((die, index) => <DieChip key={`${entry.id}-${index}`} die={die} />)}
              {entry.total !== undefined && <b>= {entry.total}</b>}
              {entry.tier && <b>Tier {entry.tier}</b>}
            </div>
          )}
        </div>
      )}
    </>
  );
}
