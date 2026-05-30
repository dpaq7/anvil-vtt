import { Music, Pause, Play, Repeat, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@anvil/ui';
import type { AudioLiveState } from '../../types/protocol.js';

interface LiveAudioPanelProps {
  audio: AudioLiveState | null;
  volume: number;
  muted: boolean;
  playing: boolean;
  blocked: boolean;
  onVolumeChange: (volume: number) => void;
  onMutedChange: (muted: boolean) => void;
  onRetry: () => void;
}

export function LiveAudioPanel({
  audio,
  volume,
  muted,
  playing,
  blocked,
  onVolumeChange,
  onMutedChange,
  onRetry,
}: LiveAudioPanelProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Music className="size-4 text-zinc-500" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Audio</h2>
      </div>

      <div className="rounded border border-zinc-800 bg-zinc-900/60 p-3">
        {audio?.audioUrl ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {audio.playing && playing ? (
                <Play className="size-4 shrink-0 text-emerald-400" />
              ) : (
                <Pause className="size-4 shrink-0 text-zinc-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-200">{audio.assetName ?? 'Scene audio'}</p>
                <p className="flex items-center gap-1 text-[11px] text-zinc-500">
                  {audio.playing ? (playing ? 'Playing' : 'Queued') : 'Paused'}
                  {audio.loop && (
                    <>
                      <span className="text-zinc-700">/</span>
                      <Repeat className="size-3" />
                      Loop
                    </>
                  )}
                </p>
              </div>
              {blocked && (
                <Button type="button" variant="secondary" size="sm" className="h-7 px-2 text-xs" onClick={onRetry}>
                  Enable
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onMutedChange(!muted)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                title={muted ? 'Unmute' : 'Mute'}
                aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(event) => {
                  onVolumeChange(Number(event.target.value));
                  if (muted) onMutedChange(false);
                }}
                className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-purple-500 [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400"
              />
              <span className="w-9 text-right text-[10px] tabular-nums text-zinc-500">
                {Math.round((muted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">No scene audio is playing.</p>
        )}
      </div>
    </section>
  );
}
