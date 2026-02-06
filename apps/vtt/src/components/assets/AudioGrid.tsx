import { Music } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@anvil/ui';
import type { AudioAsset } from '@anvil/types';

const MOOD_COLORS: Record<string, string> = {
  combat: 'text-red-400 bg-red-600/20',
  tense: 'text-orange-400 bg-orange-600/20',
  calm: 'text-green-400 bg-green-600/20',
  celebratory: 'text-yellow-400 bg-yellow-600/20',
  eerie: 'text-purple-400 bg-purple-600/20',
  exploration: 'text-blue-400 bg-blue-600/20',
};

const SCENE_BADGE_VARIANT: Record<string, 'battle' | 'story' | 'montage' | 'negotiation' | 'respite'> = {
  battle: 'battle',
  story: 'story',
  montage: 'montage',
  negotiation: 'negotiation',
  respite: 'respite',
};

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface AudioGridProps {
  audioAssets: AudioAsset[];
  onSelect: (audioId: string) => void;
  selectedId?: string | null;
  compact?: boolean;
}

export function AudioGrid({ audioAssets, onSelect, selectedId, compact }: AudioGridProps) {
  if (audioAssets.length === 0) {
    return <p className="p-8 text-center text-zinc-500">No audio assets yet.</p>;
  }

  return (
    <div
      className={
        compact
          ? 'grid grid-cols-1 gap-3 p-3 sm:grid-cols-2'
          : 'grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }
    >
      {audioAssets.map((audio) => (
        <Card
          key={audio.id}
          className={`cursor-pointer transition hover:border-zinc-600 ${
            selectedId === audio.id ? 'ring-2 ring-zinc-400' : ''
          }`}
          onClick={() => onSelect(audio.id)}
        >
          <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-zinc-800">
              <Music className="size-5 text-zinc-500" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-sm font-bold">{audio.name}</CardTitle>
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
          </CardHeader>

          {!compact && (
            <CardContent className="px-4 pb-4 pt-0">
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
                  <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
