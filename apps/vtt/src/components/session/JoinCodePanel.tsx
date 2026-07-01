import { useMemo, useState } from 'react';
import { Check, Copy, Eye, Link } from 'lucide-react';
import { Button } from '@anvil/ui';

interface JoinCodePanelProps {
  roomCode?: string | null;
}

export function JoinCodePanel({ roomCode }: JoinCodePanelProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const joinUrl = useMemo(() => {
    if (!roomCode || typeof window === 'undefined') return null;
    return `${window.location.origin}/app/join/${roomCode}`;
  }, [roomCode]);

  const copyJoinLink = async () => {
    if (!joinUrl || !navigator.clipboard) return;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="rounded border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link className="size-4 text-zinc-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Join Code</h2>
        </div>
        {!revealed && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setRevealed(true)}
            disabled={!roomCode}
          >
            <Eye className="mr-1 size-3" />
            Reveal
          </Button>
        )}
      </div>

      {revealed && roomCode ? (
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-zinc-950 px-3 py-2 text-center font-mono text-lg font-semibold tracking-[0.25em] text-zinc-100">
            {roomCode}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            onClick={copyJoinLink}
            title="Copy join link"
            aria-label="Copy join link"
          >
            {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-zinc-500">
          {roomCode ? 'Reveal the code when inviting another player.' : 'No live join code is available.'}
        </p>
      )}
    </section>
  );
}
