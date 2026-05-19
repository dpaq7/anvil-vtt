import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Music,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, cn } from '@anvil/ui';
import type { AudioAsset } from '@anvil/types';

const MOOD_COLORS: Record<string, string> = {
  combat: 'text-red-400 bg-red-600/20',
  tense: 'text-orange-400 bg-orange-600/20',
  calm: 'text-green-400 bg-green-600/20',
  celebratory: 'text-yellow-400 bg-yellow-600/20',
  eerie: 'text-purple-400 bg-purple-600/20',
  exploration: 'text-blue-400 bg-blue-600/20',
};

const SCENE_BADGE_VARIANT: Record<
  string,
  'battle' | 'story' | 'montage' | 'negotiation' | 'respite'
> = {
  battle: 'battle',
  story: 'story',
  montage: 'montage',
  negotiation: 'negotiation',
  respite: 'respite',
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number | null | undefined): string {
  return seconds === null || seconds === undefined || seconds <= 0
    ? '--:--'
    : formatTime(seconds);
}

function getAudioUrl(asset: AudioAsset) {
  return (
    asset.audioUrl ??
    (asset.assetId ? `/api/assets/${asset.assetId}/data` : null)
  );
}

// ---------------------------------------------------------------------------
// AudioGrid
// ---------------------------------------------------------------------------

export interface AudioGridProps {
  audioAssets: AudioAsset[];
  onSelect: (audioId: string) => void;
  selectedId?: string | null;
  compact?: boolean;
}

export function AudioGrid({
  audioAssets,
  onSelect,
  selectedId,
  compact,
}: AudioGridProps) {
  // Single shared Audio element so only one track plays at a time.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
  }, []);

  // Tear down audio on unmount
  useEffect(() => {
    return stopAudio;
  }, [stopAudio]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [muted, volume]);

  const startPlayback = useCallback(
    (asset: AudioAsset, audio: HTMLAudioElement) => {
      setLoadingId(asset.id);
      setErrorId(null);

      if (
        Number.isFinite(audio.duration) &&
        audio.duration > 0 &&
        audio.currentTime >= audio.duration
      ) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (audioRef.current !== audio) return;
            setPlayingId(asset.id);
            setLoadingId(null);
          })
          .catch((error: DOMException) => {
            if (audioRef.current !== audio) return;
            setPlayingId(null);
            setLoadingId(null);
            if (error.name !== 'AbortError') setErrorId(asset.id);
          });
      } else {
        setPlayingId(asset.id);
        setLoadingId(null);
      }
    },
    [],
  );

  const loadAudio = useCallback(
    (asset: AudioAsset) => {
      const url = getAudioUrl(asset);
      if (!url) {
        setErrorId(asset.id);
        return null;
      }

      stopAudio();
      setActiveId(asset.id);
      setPlayingId(null);
      setLoadingId(asset.id);
      setErrorId(null);
      setCurrentTime(0);
      setDuration(asset.durationSeconds ?? 0);

      const audio = new Audio();
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audio.volume = muted ? 0 : volume;
      audioRef.current = audio;

      const syncDuration = () => {
        if (audioRef.current !== audio) return;
        setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      };
      const syncTime = () => {
        if (audioRef.current !== audio) return;
        setCurrentTime(audio.currentTime);
      };
      const handleCanPlay = () => {
        if (audioRef.current !== audio) return;
        setLoadingId(null);
        syncDuration();
      };
      const handleEnded = () => {
        if (audioRef.current !== audio) return;
        setPlayingId(null);
        setCurrentTime(Number.isFinite(audio.duration) ? audio.duration : 0);
      };
      const handleError = () => {
        if (audioRef.current !== audio) return;
        setErrorId(asset.id);
        setLoadingId(null);
        setPlayingId(null);
      };

      audio.addEventListener('loadedmetadata', syncDuration);
      audio.addEventListener('durationchange', syncDuration);
      audio.addEventListener('timeupdate', syncTime);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.src = url;
      audio.load();

      return audio;
    },
    [muted, stopAudio, volume],
  );

  const togglePlay = useCallback(
    (asset: AudioAsset) => {
      // If this track is already playing, pause it
      if (playingId === asset.id) {
        audioRef.current?.pause();
        setPlayingId(null);
        return;
      }

      if (activeId === asset.id && audioRef.current) {
        startPlayback(asset, audioRef.current);
        return;
      }

      const audio = loadAudio(asset);
      if (audio) startPlayback(asset, audio);
    },
    [activeId, loadAudio, playingId, startPlayback],
  );

  const seek = useCallback(
    (assetId: string, seconds: number) => {
      if (activeId !== assetId || !audioRef.current) return;
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    },
    [activeId],
  );

  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value);
    if (value > 0) setMuted(false);
  }, []);

  if (audioAssets.length === 0) {
    return (
      <p className="p-8 text-center text-zinc-500">No audio assets yet.</p>
    );
  }

  return (
    <div
      className={
        compact
          ? 'grid grid-cols-1 gap-3 p-3 sm:grid-cols-2'
          : 'grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }
    >
      {audioAssets.map((audio) => {
        const isActive = activeId === audio.id;
        const isPlaying = playingId === audio.id;
        const isLoading = loadingId === audio.id;
        const hasError = errorId === audio.id;
        const activeDuration = isActive
          ? duration
          : (audio.durationSeconds ?? 0);
        const displayedDuration =
          activeDuration > 0 ? activeDuration : audio.durationSeconds;
        const canSeek = isActive && activeDuration > 0;
        const progressValue = isActive
          ? Math.min(currentTime, activeDuration || currentTime)
          : 0;

        return (
          <Card
            key={audio.id}
            className={`cursor-pointer transition hover:border-zinc-600 ${
              selectedId === audio.id ? 'ring-2 ring-zinc-400' : ''
            }`}
            onClick={() => onSelect(audio.id)}
          >
            <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-4">
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-md transition-colors',
                  isPlaying
                    ? 'bg-purple-600/30 text-purple-300'
                    : 'bg-zinc-800 text-zinc-500',
                )}
              >
                <Music className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-sm font-bold">
                  {audio.name}
                </CardTitle>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    {formatDuration(audio.durationSeconds)}
                  </span>
                  {audio.audioType && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                      {audio.audioType.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label={
                  isPlaying ? `Pause ${audio.name}` : `Preview ${audio.name}`
                }
                onClick={(event) => {
                  event.stopPropagation();
                  togglePlay(audio);
                }}
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors',
                  isPlaying
                    ? 'border-purple-400/40 bg-purple-500/20 text-purple-200 hover:bg-purple-500/30'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800',
                )}
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
              </button>
            </CardHeader>

            {!compact && (
              <CardContent className="px-4 pb-4 pt-0">
                <div
                  className="mb-3 space-y-2 rounded-md border border-zinc-800 bg-zinc-950/55 p-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-9 text-right text-[10px] tabular-nums text-zinc-500">
                      {formatTime(progressValue)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={activeDuration || 0}
                      step={0.1}
                      value={canSeek ? progressValue : 0}
                      disabled={!canSeek}
                      aria-label={`Seek ${audio.name}`}
                      onChange={(event) =>
                        seek(audio.id, Number(event.currentTarget.value))
                      }
                      className={cn(
                        'h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-800 accent-purple-400 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-300',
                        isActive && 'bg-zinc-700',
                      )}
                    />
                    <span className="w-9 text-[10px] tabular-nums text-zinc-500">
                      {formatDuration(displayedDuration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={
                        muted ? 'Unmute audio previews' : 'Mute audio previews'
                      }
                      onClick={() => setMuted((current) => !current)}
                      className="flex size-6 shrink-0 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      {muted || volume === 0 ? (
                        <VolumeX className="size-3.5" />
                      ) : (
                        <Volume2 className="size-3.5" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={muted ? 0 : volume}
                      aria-label="Audio preview volume"
                      onChange={(event) =>
                        handleVolumeChange(Number(event.currentTarget.value))
                      }
                      className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-zinc-800 accent-purple-400 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-300"
                    />
                    {hasError ? (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-red-300">
                        <AlertCircle className="size-3" />
                        Playback failed
                      </span>
                    ) : (
                      <span className="ml-auto text-[10px] text-zinc-600">
                        {isActive
                          ? isPlaying
                            ? 'Playing preview'
                            : 'Ready to preview'
                          : 'Preview'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {/* Mood badge */}
                  {audio.mood && (
                    <Badge
                      className={`border-transparent text-[9px] px-1 py-0 ${MOOD_COLORS[audio.mood] ?? 'bg-zinc-800 text-zinc-100'}`}
                    >
                      {audio.mood}
                    </Badge>
                  )}

                  {/* Scene type chips */}
                  {audio.sceneTypes.map((st) => (
                    <Badge
                      key={st}
                      variant={SCENE_BADGE_VARIANT[st] ?? 'secondary'}
                      className="text-[9px] px-1 py-0"
                    >
                      {st}
                    </Badge>
                  ))}

                  {/* Tags */}
                  {audio.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[9px] px-1 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
