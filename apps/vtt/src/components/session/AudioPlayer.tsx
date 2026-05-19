import { useCallback, useEffect, useRef, useState } from 'react';
import { Music, Pause, Play, Repeat, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@anvil/ui';
import type { AudioAsset } from '@anvil/types';

export interface AudioPlayerProps {
  /** The audio asset to play (null = nothing selected) */
  track: AudioAsset | null;
  /** Called when the user clicks the clear/remove button */
  onClear?: () => void;
  /** Optional controlled channel volume. */
  volume?: number;
  /** Called when the inline volume control changes. */
  onVolumeChange?: (volume: number) => void;
  /** Hide the inline volume control when a parent mixer owns volume. */
  showVolumeControl?: boolean;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPlayer({
  track,
  onClear,
  volume: controlledVolume,
  onVolumeChange,
  showVolumeControl = true,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [localVolume, setLocalVolume] = useState(0.5);
  const [loop, setLoop] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const volume = controlledVolume ?? localVolume;

  // Keep mutable refs for values captured by the Audio event handlers so
  // we don't need to tear down the Audio element when they change.
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const loopRef = useRef(loop);
  loopRef.current = loop;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  // Create / swap audio element when track changes
  useEffect(() => {
    // Stop any previous playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load(); // reset the element
      audioRef.current = null;
    }
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setReady(false);
    setError(null);

    // Derive the URL from the asset ID when audioUrl isn't populated
    const url =
      track?.audioUrl ??
      (track?.assetId ? `/api/assets/${track.assetId}/data` : null);
    if (!url) return;

    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.volume = mutedRef.current ? 0 : volumeRef.current;
    audio.loop = loopRef.current;
    audioRef.current = audio;

    const onCanPlay = () => setReady(true);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      if (!audio.loop) setPlaying(false);
    };
    const onError = () => {
      setError('Failed to load audio');
      setPlaying(false);
      setReady(false);
    };

    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    // Set src last to start loading
    audio.src = url;

    return () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
    // Only re-create when track identity changes
  }, [track?.id, track?.audioUrl, track?.assetId]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  // Sync loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop;
    }
  }, [loop]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      setError(null);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setPlaying(true))
          .catch((err: DOMException) => {
            setPlaying(false);
            // AbortError happens when play is interrupted by pause/src change — not a real error
            if (err.name !== 'AbortError') {
              setError(
                err.name === 'NotAllowedError'
                  ? 'Click to enable audio'
                  : 'Playback failed',
              );
            }
          });
      }
    }
  }, [playing]);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);
  const toggleLoop = useCallback(() => setLoop((l) => !l), []);
  const setVolume = useCallback(
    (nextVolume: number) => {
      const clamped = Math.max(0, Math.min(1, nextVolume));
      if (controlledVolume === undefined) setLocalVolume(clamped);
      onVolumeChange?.(clamped);
    },
    [controlledVolume, onVolumeChange],
  );

  if (!track) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2">
        <Music className="size-4 text-zinc-600" />
        <span className="text-xs text-zinc-500">No track selected</span>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2">
      {/* Track info + clear */}
      <div className="flex items-center gap-2">
        <Music className="size-3.5 shrink-0 text-zinc-500" />
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-300">
          {track.name}
        </span>
        {onClear && (
          <button
            onClick={onClear}
            className="text-xs text-zinc-500 hover:text-zinc-300"
            title="Remove track"
          >
            &times;
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <span className="w-8 text-right text-[10px] tabular-nums text-zinc-500">
          {formatTime(currentTime)}
        </span>
        <div
          className="relative h-1 flex-1 cursor-pointer rounded-full bg-zinc-800"
          onClick={(e) => {
            const audio = audioRef.current;
            if (!audio || !Number.isFinite(duration) || duration <= 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = Math.max(
              0,
              Math.min(1, (e.clientX - rect.left) / rect.width),
            );
            audio.currentTime = pct * duration;
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-zinc-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-8 text-[10px] tabular-nums text-zinc-500">
          {formatTime(duration)}
        </span>
      </div>

      {/* Error message */}
      {error && <p className="text-[10px] text-red-400">{error}</p>}

      {/* Controls row */}
      <div className="flex items-center gap-1">
        {/* Play / Pause */}
        <Button
          variant="ghost"
          size="sm"
          className={`size-7 p-0 ${!ready && !playing ? 'opacity-50' : ''}`}
          onClick={togglePlay}
        >
          {playing ? (
            <Pause className="size-3.5" />
          ) : (
            <Play className="size-3.5" />
          )}
        </Button>

        {/* Loop toggle */}
        <Button
          variant="ghost"
          size="sm"
          className={`size-7 p-0 ${loop ? 'text-purple-400' : 'text-zinc-500'}`}
          onClick={toggleLoop}
          title={loop ? 'Loop on' : 'Loop off'}
        >
          <Repeat className="size-3.5" />
        </Button>

        {showVolumeControl ? (
          <>
            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className="p-0.5 text-zinc-500 hover:text-zinc-300"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? (
                <VolumeX className="size-3.5" />
              ) : (
                <Volume2 className="size-3.5" />
              )}
            </button>

            {/* Volume slider */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (muted) setMuted(false);
              }}
              className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-purple-500 [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
