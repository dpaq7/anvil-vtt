import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@anvil/ui';
import type { AudioAsset, AudioMood, AudioType, SceneType, UpdateAudioInput } from '@anvil/types';

const AUDIO_TYPES: AudioType[] = ['ambient', 'music', 'sound_effect'];
const MOODS: AudioMood[] = ['combat', 'tense', 'calm', 'celebratory', 'eerie', 'exploration'];
const SCENE_TYPES: SceneType[] = ['battle', 'negotiation', 'montage', 'story', 'respite'];

interface AudioDetailsDialogProps {
  audio: AudioAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (audioId: string, input: UpdateAudioInput) => Promise<void>;
}

function sameValues(left: string[], right: string[]) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function AudioDetailsDialog({ audio, open, onOpenChange, onSave }: AudioDetailsDialogProps) {
  const [name, setName] = useState('');
  const [audioType, setAudioType] = useState<AudioType | ''>('');
  const [mood, setMood] = useState<AudioMood | ''>('');
  const [sceneTypes, setSceneTypes] = useState<SceneType[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!audio || !open) return;
    setName(audio.name);
    setAudioType(audio.audioType ?? '');
    setMood(audio.mood ?? '');
    setSceneTypes(audio.sceneTypes);
    setTagsInput(audio.tags.join(', '));
    setSaving(false);
    setError(null);
  }, [audio, open]);

  const tags = useMemo(() => parseTags(tagsInput), [tagsInput]);
  const isDirty = Boolean(
    audio &&
      (name.trim() !== audio.name ||
        audioType !== (audio.audioType ?? '') ||
        mood !== (audio.mood ?? '') ||
        !sameValues(sceneTypes, audio.sceneTypes) ||
        !sameValues(tags, audio.tags)),
  );

  const toggleSceneType = (sceneType: SceneType) => {
    setSceneTypes((current) =>
      current.includes(sceneType) ? current.filter((item) => item !== sceneType) : [...current, sceneType],
    );
  };

  const handleSave = async () => {
    if (!audio || !isDirty || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(audio.id, {
        name: name.trim() !== audio.name ? name.trim() : undefined,
        audioType: audioType !== (audio.audioType ?? '') ? audioType || null : undefined,
        mood: mood !== (audio.mood ?? '') ? mood || null : undefined,
        sceneTypes: !sameValues(sceneTypes, audio.sceneTypes) ? sceneTypes : undefined,
        tags: !sameValues(tags, audio.tags) ? tags : undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audio update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-sm">Edit Audio Details</DialogTitle>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Name</label>
            <Input value={name} onChange={(event) => setName(event.currentTarget.value)} disabled={saving} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Type</label>
              <Select
                value={audioType || '__none__'}
                onValueChange={(value) => setAudioType(value === '__none__' ? '' : (value as AudioType))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs text-zinc-500">
                    None
                  </SelectItem>
                  {AUDIO_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Mood</label>
              <Select value={mood || '__none__'} onValueChange={(value) => setMood(value === '__none__' ? '' : (value as AudioMood))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs text-zinc-500">
                    None
                  </SelectItem>
                  {MOODS.map((moodOption) => (
                    <SelectItem key={moodOption} value={moodOption} className="text-xs capitalize">
                      {moodOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Scene Types</label>
            <div className="flex flex-wrap gap-1">
              {SCENE_TYPES.map((sceneType) => (
                <button key={sceneType} type="button" onClick={() => toggleSceneType(sceneType)} disabled={saving}>
                  <Badge
                    variant={sceneTypes.includes(sceneType) ? sceneType : 'outline'}
                    className="cursor-pointer px-1.5 py-0.5 text-[10px]"
                  >
                    {sceneType}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Tags</label>
            <Input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.currentTarget.value)}
              placeholder="forest, rain, thunder..."
              disabled={saving}
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-900/60 bg-red-950/20 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSave} disabled={!isDirty || !name.trim() || saving}>
              {saving ? 'Saving...' : 'Save Details'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
