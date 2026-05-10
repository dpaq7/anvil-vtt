import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Input,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@anvil/ui';
import { ChevronDown, ImageIcon, X } from 'lucide-react';
import { StoryStage } from '../stages/StoryStage.js';
import { MapPickerDialog } from './MapPickerDialog.js';
import { SceneAudioPanel } from '../session/SceneAudioPanel.js';
import type { Scene } from './SceneWorkspace.js';
import type { MapAsset } from '@anvil/types';
import { useAssetsStore } from '../../stores/assetsStore.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoryWorkspaceProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  scene: Scene;
  campaignId: string;
}

interface StorySceneData {
  readAloud: string;
  notes: string;
  assetUrl: string;
  mapAssetId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StoryWorkspace({ data, onChange, campaignId }: StoryWorkspaceProps) {
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  // Extract typed data with defaults
  const storyData: StorySceneData = {
    readAloud: (data['readAloud'] as string) ?? '',
    notes: (data['notes'] as string) ?? '',
    assetUrl: (data['assetUrl'] as string) ?? '',
    mapAssetId: (data['mapAssetId'] as string) ?? '',
  };

  const updateField = <K extends keyof StorySceneData>(field: K, value: StorySceneData[K]) => {
    onChange({ ...data, [field]: value });
  };

  // Resolve selected map name
  const maps = useAssetsStore((s) => s.maps);
  const selectedMapName = useMemo(() => {
    if (!storyData.mapAssetId) return null;
    return maps.find((m) => m.id === storyData.mapAssetId)?.name ?? null;
  }, [storyData.mapAssetId, maps]);

  // Map selection handlers
  const handleLibraryMapSelect = useCallback(
    (map: MapAsset) => {
      onChange({
        ...data,
        assetUrl: map.imageUrl ?? '',
        mapAssetId: map.id,
      });
    },
    [data, onChange],
  );

  const handleExternalUrlChange = useCallback(
    (url: string) => {
      onChange({ ...data, assetUrl: url, mapAssetId: '' });
    },
    [data, onChange],
  );

  const handleClearAsset = useCallback(() => {
    onChange({ ...data, assetUrl: '', mapAssetId: '' });
  }, [data, onChange]);

  const hasPreviewText = Boolean(storyData.readAloud || storyData.notes);

  return (
    <div className="flex h-full">
      {/* Main area: Live preview of StoryStage */}
      <div className="flex-1 overflow-auto bg-zinc-950">
        <div className="relative h-full">
          {/* Background asset if provided */}
          {storyData.assetUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${storyData.assetUrl})` }}
            />
          )}

          {hasPreviewText ? (
            <div className="relative z-10 h-full">
              <StoryStage
                readAloudText={storyData.readAloud}
                directorNotes={storyData.notes}
                isDirector={true}
              />
            </div>
          ) : (
            <div className="relative z-10 flex h-full items-center justify-center">
              <div className="text-center text-zinc-600">
                <p className="text-lg font-medium">Story Scene</p>
                <p className="mt-1 text-sm">Add read-aloud text in the sidebar to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar: Editor fields */}
      <div className="w-80 shrink-0 overflow-y-auto border-l border-zinc-800 bg-zinc-900/80 p-4">
        <div className="flex flex-col gap-5">
          {/* Scene Audio */}
          <SceneAudioPanel
            campaignId={campaignId}
            audioId={(data['audioMusic'] as string) ?? null}
            onAudioChange={(id) => onChange({ ...data, audioMusic: id ?? undefined })}
          />

          {/* Read-aloud text */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Read-Aloud Text</span>
            <textarea
              className="min-h-[160px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={storyData.readAloud}
              onChange={(e) => updateField('readAloud', e.target.value)}
              placeholder="The text players will see, rendered cinematically..."
            />
            <p className="text-xs text-zinc-500">
              This text appears large and centered for dramatic effect.
            </p>
          </label>

          {/* Director notes */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Director Notes</span>
            <textarea
              className="min-h-[100px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={storyData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Private notes only the Director sees..."
            />
            <p className="text-xs text-zinc-500">
              Hidden from players. Visible in preview above.
            </p>
          </label>

          {/* Background Asset */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-zinc-300">Background Asset</span>

            {/* Asset preview */}
            {storyData.assetUrl && (
              <div className="relative aspect-video overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
                <img
                  src={storyData.assetUrl}
                  alt="Background asset"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {selectedMapName && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
                    <p className="truncate text-xs text-zinc-300">{selectedMapName}</p>
                  </div>
                )}
                <button
                  onClick={handleClearAsset}
                  className="absolute right-1.5 top-1.5 rounded bg-black/60 p-1 text-zinc-400 hover:bg-black/80 hover:text-zinc-200"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}

            {/* Browse Maps button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMapPickerOpen(true)}
              className="w-full"
            >
              <ImageIcon className="mr-1.5 size-3.5" />
              Browse Maps
            </Button>

            <MapPickerDialog
              campaignId={campaignId}
              open={mapPickerOpen}
              onOpenChange={setMapPickerOpen}
              onSelect={handleLibraryMapSelect}
              defaultSceneTypeFilter="story"
              selectedMapId={storyData.mapAssetId || null}
            />

            {/* Paste URL fallback */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
                <ChevronDown className="size-3" />
                Or paste an external URL
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <Input
                  value={storyData.mapAssetId ? '' : storyData.assetUrl}
                  onChange={(e) => handleExternalUrlChange(e.target.value)}
                  placeholder="https://... (image URL)"
                  className="text-sm"
                />
              </CollapsibleContent>
            </Collapsible>

            <p className="text-xs text-zinc-500">
              Optional background image for atmosphere.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
