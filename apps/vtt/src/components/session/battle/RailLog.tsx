import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActionLogEntry } from '../../../types/protocol.js';

const time = (timestamp: number | string) =>
  new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/**
 * The log in a rail (`sb-log`): newest first, text left, time right. A new row is bold for a few
 * seconds. Entries reach a Player masked (`maskActionLog`), so a hidden creature reads "Something".
 */
export function RailLog({ entries, sceneType, activeSceneId }: { entries: ActionLogEntry[]; sceneType: string | null; activeSceneId?: string | null }) {
  const list = useMemo(
    () =>
      entries
        .filter((entry) => (activeSceneId && entry.sceneId ? entry.sceneId === activeSceneId : entry.sceneType === sceneType))
        .slice()
        .reverse(),
    [activeSceneId, entries, sceneType],
  );
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

  return (
    <section className="sb-sec sb-log" aria-label="Log">
      <div className="sb-sub sb-sub--flat"><b>Log</b><span>{list.length} {list.length === 1 ? 'entry' : 'entries'}</span></div>
      {list.length === 0 && <p className="sb-note">No actions yet.</p>}
      {list.map((entry) => (
        <div className="sb-log__e" key={entry.id} data-new={fresh.has(entry.id) || undefined}>
          {/* One line per entry, as in the demo. The server's fuller line is on hover. */}
          <span title={entry.detail}>{entry.title.replace(/\s\d{12,}\b/g, '').replace(/\.+$/, '')}</span>
          <time>{time(entry.timestamp)}</time>
        </div>
      ))}
    </section>
  );
}
