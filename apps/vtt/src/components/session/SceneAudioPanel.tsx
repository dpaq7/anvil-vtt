import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Music, Play, Volume2, Zap } from 'lucide-react';
import { Button } from '@anvil/ui';
import type { AudioAsset } from '@anvil/types';
import { useAssetsStore } from '../../stores/assetsStore.js';
import { AudioPlayer } from './AudioPlayer.js';

const SFX_SLOT_COUNT = 4;

type MixerChannel = 'music' | 'ambient' | 'sfx';

const TRACK_SECTION_CLASS =
  'grid gap-2 rounded-md border border-purple-400/25 bg-purple-500/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]';

export interface SceneAudioPanelProps {
  /** Campaign ID for loading audio assets */
  campaignId: string;
  /** Currently selected audio asset ID (from scene data) */
  audioId?: string | null;
  /** Explicit music track ID for multitrack mode. Falls back to audioId. */
  musicAudioId?: string | null;
  /** Selected ambient audio asset ID. */
  ambientAudioId?: string | null;
  /** Selected SFX soundboard asset IDs. */
  sfxAudioIds?: Array<string | null | undefined>;
  /** Called when the user selects or clears the legacy/music track */
  onAudioChange?: (audioId: string | null) => void;
  /** Explicit callback for music track changes. Falls back to onAudioChange. */
  onMusicAudioChange?: (audioId: string | null) => void;
  /** Called when the ambient track changes. */
  onAmbientAudioChange?: (audioId: string | null) => void;
  /** Called when one SFX soundboard slot changes. */
  onSfxAudioChange?: (slotIndex: number, audioId: string | null) => void;
  /** Render the full music/ambient/SFX mixer instead of the legacy single track picker. */
  multitrack?: boolean;
  /** Label shown above the panel */
  label?: string;
  /** Hide the panel label when a surrounding section already supplies one. */
  hideLabel?: boolean;
}

function formatDuration(seconds: number | null): string {
  if (!Number.isFinite(seconds ?? NaN) || !seconds) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getAudioUrl(asset: AudioAsset | null): string | null {
  return (
    asset?.audioUrl ??
    (asset?.assetId ? `/api/assets/${asset.assetId}/data` : null)
  );
}

function hasTag(asset: AudioAsset, tag: string): boolean {
  const target = tag.toLowerCase();
  return asset.tags.some(
    (candidate) => candidate.trim().toLowerCase() === target,
  );
}

function withSelectedAsset(
  assets: AudioAsset[],
  allAssets: AudioAsset[],
  selectedId: string | null,
): AudioAsset[] {
  if (!selectedId || assets.some((asset) => asset.id === selectedId))
    return assets;
  const selected = allAssets.find((asset) => asset.id === selectedId);
  return selected ? [selected, ...assets] : assets;
}

function MixerSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 rounded-md border border-zinc-800 bg-zinc-950/50 px-2 py-2">
      <span className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        <span>{label}</span>
        <span className="tabular-nums text-zinc-400">
          {Math.round(value * 100)}%
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-purple-500 [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400"
      />
    </label>
  );
}

function TrackSelect({
  label,
  selectedId,
  assets,
  onChange,
  emptyLabel,
}: {
  label: string;
  selectedId: string | null;
  assets: AudioAsset[];
  onChange?: (audioId: string | null) => void;
  emptyLabel: string;
}) {
  return (
    <label className="grid gap-1 text-xs text-zinc-400">
      <span className="font-medium">{label}</span>
      <select
        value={selectedId ?? ''}
        disabled={!onChange}
        onChange={(event) => onChange?.(event.currentTarget.value || null)}
        className="min-h-8 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">{emptyLabel}</option>
        {assets.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.name} ({formatDuration(asset.durationSeconds)})
          </option>
        ))}
      </select>
    </label>
  );
}

export function SceneAudioPanel({
  campaignId,
  audioId,
  musicAudioId,
  ambientAudioId,
  sfxAudioIds,
  onAudioChange,
  onMusicAudioChange,
  onAmbientAudioChange,
  onSfxAudioChange,
  multitrack = false,
  label = 'Scene Audio',
  hideLabel = false,
}: SceneAudioPanelProps) {
  const audioAssets = useAssetsStore((s) => s.audioAssets);
  const loadAudio = useAssetsStore((s) => s.loadAudio);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [volumes, setVolumes] = useState<Record<MixerChannel, number>>({
    music: 0.55,
    ambient: 0.4,
    sfx: 0.75,
  });
  const [playingSfxSlots, setPlayingSfxSlots] = useState<
    Record<number, boolean>
  >({});
  const sfxRefs = useRef<Array<HTMLAudioElement | null>>([]);

  // Load audio assets if not yet loaded
  useEffect(() => {
    if (campaignId && audioAssets.length === 0) {
      loadAudio(campaignId);
    }
  }, [campaignId, audioAssets.length, loadAudio]);

  useEffect(() => {
    for (const audio of sfxRefs.current) {
      if (audio) audio.volume = volumes.sfx;
    }
  }, [volumes.sfx]);

  useEffect(() => {
    return () => {
      for (const audio of sfxRefs.current) {
        audio?.pause();
        audio?.removeAttribute('src');
        audio?.load();
      }
      sfxRefs.current = [];
    };
  }, []);

  const selectedMusicId = musicAudioId ?? audioId ?? null;
  const selectedAmbientId = ambientAudioId ?? null;
  const normalizedSfxIds = useMemo(
    () =>
      Array.from(
        { length: SFX_SLOT_COUNT },
        (_, index) => sfxAudioIds?.[index] ?? null,
      ),
    [sfxAudioIds],
  );

  const selectedTrack = useMemo(
    () =>
      selectedMusicId
        ? (audioAssets.find((a) => a.id === selectedMusicId) ?? null)
        : null,
    [selectedMusicId, audioAssets],
  );
  const selectedAmbient = useMemo(
    () =>
      selectedAmbientId
        ? (audioAssets.find((a) => a.id === selectedAmbientId) ?? null)
        : null,
    [selectedAmbientId, audioAssets],
  );

  const nonSfxAssets = useMemo(
    () => audioAssets.filter((asset) => !hasTag(asset, 'sfx')),
    [audioAssets],
  );
  const musicAssets = useMemo(() => {
    const typed = nonSfxAssets.filter(
      (asset) => asset.audioType === 'music' || asset.audioType === null,
    );
    return withSelectedAsset(
      typed.length > 0 ? typed : nonSfxAssets,
      audioAssets,
      selectedMusicId,
    );
  }, [audioAssets, nonSfxAssets, selectedMusicId]);
  const ambientAssets = useMemo(() => {
    const typed = nonSfxAssets.filter(
      (asset) => asset.audioType === 'ambient' || hasTag(asset, 'ambient'),
    );
    return withSelectedAsset(
      typed.length > 0 ? typed : nonSfxAssets,
      audioAssets,
      selectedAmbientId,
    );
  }, [audioAssets, nonSfxAssets, selectedAmbientId]);
  const sfxAssets = useMemo(
    () => audioAssets.filter((asset) => hasTag(asset, 'sfx')),
    [audioAssets],
  );

  const handleSelect = useCallback(
    (asset: AudioAsset) => {
      (onMusicAudioChange ?? onAudioChange)?.(asset.id);
      setPickerOpen(false);
    },
    [onAudioChange, onMusicAudioChange],
  );

  const handleClear = useCallback(() => {
    (onMusicAudioChange ?? onAudioChange)?.(null);
  }, [onAudioChange, onMusicAudioChange]);

  const updateVolume = useCallback((channel: MixerChannel, value: number) => {
    setVolumes((current) => ({
      ...current,
      [channel]: Math.max(0, Math.min(1, value)),
    }));
  }, []);

  const playSfx = useCallback(
    (slotIndex: number) => {
      const assetId = normalizedSfxIds[slotIndex];
      const asset = assetId
        ? (audioAssets.find((candidate) => candidate.id === assetId) ?? null)
        : null;
      const url = getAudioUrl(asset);
      if (!url) return;

      const existing = sfxRefs.current[slotIndex];
      if (existing) {
        existing.pause();
        existing.removeAttribute('src');
        existing.load();
      }

      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audio.volume = volumes.sfx;
      sfxRefs.current[slotIndex] = audio;
      setPlayingSfxSlots((current) => ({ ...current, [slotIndex]: true }));

      const finish = () => {
        if (sfxRefs.current[slotIndex] === audio) {
          sfxRefs.current[slotIndex] = null;
          setPlayingSfxSlots((current) => ({ ...current, [slotIndex]: false }));
        }
        audio.removeEventListener('ended', finish);
        audio.removeEventListener('error', finish);
      };

      audio.addEventListener('ended', finish);
      audio.addEventListener('error', finish);
      audio.play().catch(finish);
    },
    [audioAssets, normalizedSfxIds, volumes.sfx],
  );

  if (multitrack) {
    return (
      <div className="flex flex-col gap-4">
        {!hideLabel ? (
          <span className="text-sm font-medium text-zinc-300">{label}</span>
        ) : null}

        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <Volume2 className="size-3.5" />
            Volume Mixer
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MixerSlider
              label="Music"
              value={volumes.music}
              onChange={(value) => updateVolume('music', value)}
            />
            <MixerSlider
              label="Ambient"
              value={volumes.ambient}
              onChange={(value) => updateVolume('ambient', value)}
            />
            <MixerSlider
              label="SFX"
              value={volumes.sfx}
              onChange={(value) => updateVolume('sfx', value)}
            />
          </div>
        </div>

        <div className={TRACK_SECTION_CLASS}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <Music className="size-3.5" />
            Scene Music
          </div>
          <AudioPlayer
            track={selectedTrack}
            onClear={
              (onMusicAudioChange ?? onAudioChange) ? handleClear : undefined
            }
            volume={volumes.music}
            onVolumeChange={(value) => updateVolume('music', value)}
            showVolumeControl={false}
          />
          <TrackSelect
            label="Music Track"
            selectedId={selectedMusicId}
            assets={musicAssets}
            onChange={onMusicAudioChange ?? onAudioChange}
            emptyLabel="Choose scene music"
          />
        </div>

        <div className={TRACK_SECTION_CLASS}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <Music className="size-3.5" />
            Ambient Audio
          </div>
          <AudioPlayer
            track={selectedAmbient}
            onClear={
              onAmbientAudioChange
                ? () => onAmbientAudioChange(null)
                : undefined
            }
            volume={volumes.ambient}
            onVolumeChange={(value) => updateVolume('ambient', value)}
            showVolumeControl={false}
          />
          <TrackSelect
            label="Ambient Track"
            selectedId={selectedAmbientId}
            assets={ambientAssets}
            onChange={onAmbientAudioChange}
            emptyLabel="Choose ambient audio"
          />
        </div>

        <div className={TRACK_SECTION_CLASS}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <Zap className="size-3.5" />
              SFX Soundboard
            </div>
            <span className="text-[10px] text-zinc-600">
              {sfxAssets.length} tagged sfx
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {normalizedSfxIds.map((assetId, slotIndex) => {
              const asset = assetId
                ? (audioAssets.find((candidate) => candidate.id === assetId) ??
                  null)
                : null;
              return (
                <div key={slotIndex} className="grid min-w-0 gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!asset}
                    onClick={() => playSfx(slotIndex)}
                    className="h-10 w-full min-w-0 flex-col gap-0.5 px-1 text-[10px] leading-tight"
                    title={
                      asset
                        ? `Play ${asset.name}`
                        : `Assign SFX ${slotIndex + 1}`
                    }
                  >
                    <Play className="size-3" />
                    <span className="truncate">
                      {playingSfxSlots[slotIndex]
                        ? 'Playing'
                        : `SFX ${slotIndex + 1}`}
                    </span>
                  </Button>
                  <select
                    value={assetId ?? ''}
                    onChange={(event) =>
                      onSfxAudioChange?.(
                        slotIndex,
                        event.currentTarget.value || null,
                      )
                    }
                    disabled={!onSfxAudioChange}
                    aria-label={`SFX ${slotIndex + 1} track`}
                    className="h-8 w-full min-w-0 rounded-md border border-zinc-700 bg-zinc-950 px-1 text-[10px] text-zinc-100 outline-none focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">None</option>
                    {sfxAssets.map((sfxAsset) => (
                      <option key={sfxAsset.id} value={sfxAsset.id}>
                        {sfxAsset.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          {sfxAssets.length === 0 ? (
            <p className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-500">
              No audio assets are tagged with "sfx".
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {!hideLabel ? (
        <span className="text-sm font-medium text-zinc-300">{label}</span>
      ) : null}

      {/* Player */}
      <AudioPlayer
        track={selectedTrack}
        onClear={onAudioChange ? handleClear : undefined}
      />

      {/* Pick track button */}
      {onAudioChange && (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between text-xs"
            onClick={() => setPickerOpen((v) => !v)}
          >
            <span className="flex items-center gap-1.5">
              <Music className="size-3" />
              {selectedTrack ? 'Change Track' : 'Choose Track'}
            </span>
            <ChevronDown
              className={`size-3 transition-transform ${pickerOpen ? 'rotate-180' : ''}`}
            />
          </Button>

          {/* Inline dropdown list */}
          {pickerOpen && (
            <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-900 shadow-lg">
              {audioAssets.length === 0 ? (
                <p className="p-3 text-center text-xs text-zinc-500">
                  No audio assets in this campaign.
                </p>
              ) : (
                audioAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => handleSelect(asset)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-zinc-800 ${
                      asset.id === selectedMusicId
                        ? 'bg-zinc-800/60 text-purple-300'
                        : 'text-zinc-300'
                    }`}
                  >
                    <Music className="size-3 shrink-0 text-zinc-500" />
                    <span className="min-w-0 flex-1 truncate">
                      {asset.name}
                    </span>
                    {asset.durationSeconds != null && (
                      <span className="shrink-0 tabular-nums text-zinc-500">
                        {formatDuration(asset.durationSeconds)}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
