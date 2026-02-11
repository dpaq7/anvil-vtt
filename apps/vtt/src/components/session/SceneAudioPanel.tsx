import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Music } from 'lucide-react';
import { Button } from '@anvil/ui';
import type { AudioAsset } from '@anvil/types';
import { useAssetsStore } from '../../stores/assetsStore.js';
import { AudioPlayer } from './AudioPlayer.js';

export interface SceneAudioPanelProps {
  /** Campaign ID for loading audio assets */
  campaignId: string;
  /** Currently selected audio asset ID (from scene data) */
  audioId?: string | null;
  /** Called when the user selects or clears a track */
  onAudioChange?: (audioId: string | null) => void;
  /** Label shown above the panel */
  label?: string;
}

export function SceneAudioPanel({
  campaignId,
  audioId,
  onAudioChange,
  label = 'Scene Audio',
}: SceneAudioPanelProps) {
  const audioAssets = useAssetsStore((s) => s.audioAssets);
  const loadAudio = useAssetsStore((s) => s.loadAudio);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Load audio assets if not yet loaded
  useEffect(() => {
    if (campaignId && audioAssets.length === 0) {
      loadAudio(campaignId);
    }
  }, [campaignId, audioAssets.length, loadAudio]);

  const selectedTrack = useMemo(
    () => (audioId ? audioAssets.find((a) => a.id === audioId) ?? null : null),
    [audioId, audioAssets],
  );

  const handleSelect = useCallback(
    (asset: AudioAsset) => {
      onAudioChange?.(asset.id);
      setPickerOpen(false);
    },
    [onAudioChange],
  );

  const handleClear = useCallback(() => {
    onAudioChange?.(null);
  }, [onAudioChange]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-zinc-300">{label}</span>

      {/* Player */}
      <AudioPlayer track={selectedTrack} onClear={onAudioChange ? handleClear : undefined} />

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
            <ChevronDown className={`size-3 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
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
                      asset.id === audioId ? 'bg-zinc-800/60 text-purple-300' : 'text-zinc-300'
                    }`}
                  >
                    <Music className="size-3 shrink-0 text-zinc-500" />
                    <span className="min-w-0 flex-1 truncate">{asset.name}</span>
                    {asset.durationSeconds != null && (
                      <span className="shrink-0 tabular-nums text-zinc-500">
                        {Math.floor(asset.durationSeconds / 60)}:{(asset.durationSeconds % 60).toString().padStart(2, '0')}
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
