import { useState, useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Progress,
} from '@anvil/ui';
import type { CreateAudioInput, AudioType, AudioMood, SceneType } from '@anvil/types';

const AUDIO_TYPES: AudioType[] = ['ambient', 'music', 'sound_effect'];
const MOODS: AudioMood[] = ['combat', 'tense', 'calm', 'celebratory', 'eerie', 'exploration'];
const SCENE_TYPES: SceneType[] = ['battle', 'negotiation', 'montage', 'story', 'respite'];
const ACCEPTED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac'];
const ACCEPTED_AUDIO_MIME_TYPES = new Set([
  'audio/aac',
  'audio/m4a',
  'audio/mp3',
  'audio/mp4',
  'audio/mpeg',
  'audio/mpeg3',
  'audio/vnd.wave',
  'audio/wav',
  'audio/wave',
  'audio/x-aac',
  'audio/x-m4a',
  'audio/x-mp3',
  'audio/x-mpeg',
  'audio/x-mpeg-3',
  'audio/x-wav',
]);
const AUDIO_ACCEPT_VALUE = [
  'audio/aac',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  ...ACCEPTED_AUDIO_EXTENSIONS,
].join(',');

function getAudioFileError(file: File): string | null {
  const fileName = file.name.toLowerCase();
  const hasAcceptedExtension = ACCEPTED_AUDIO_EXTENSIONS.some((extension) =>
    fileName.endsWith(extension),
  );
  const hasAcceptedMimeType =
    file.type === '' || ACCEPTED_AUDIO_MIME_TYPES.has(file.type.toLowerCase());

  if (hasAcceptedExtension && hasAcceptedMimeType) return null;
  return 'Choose an MP3, WAV, M4A, or AAC file for reliable playback across browsers.';
}

export interface AudioUploadDialogProps {
  onUpload: (input: CreateAudioInput, file: File) => Promise<void>;
  children: React.ReactNode;
}

export function AudioUploadDialog({ onUpload, children }: AudioUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [audioType, setAudioType] = useState<AudioType | ''>('');
  const [mood, setMood] = useState<AudioMood | ''>('');
  const [sceneTypes, setSceneTypes] = useState<SceneType[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const fileError = getAudioFileError(selected);
    if (fileError) {
      setFile(null);
      setError(fileError);
      e.target.value = '';
      return;
    }

    setError(null);
    setFile(selected);
    if (!name) {
      setName(selected.name.replace(/\.[^.]+$/, ''));
    }
  }, [name]);

  const toggleSceneType = useCallback((st: SceneType) => {
    setSceneTypes((prev) =>
      prev.includes(st) ? prev.filter((t) => t !== st) : [...prev, st],
    );
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file || !name) return;
    const fileError = getAudioFileError(file);
    if (fileError) {
      setError(fileError);
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(25);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const input: CreateAudioInput = {
        name,
        audioType: audioType || undefined,
        mood: mood || undefined,
        sceneTypes: sceneTypes.length > 0 ? sceneTypes : undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      setProgress(50);
      await onUpload(input, file);
      setProgress(100);

      // Reset and close
      setFile(null);
      setName('');
      setAudioType('');
      setMood('');
      setSceneTypes([]);
      setTagsInput('');
      setError(null);
      setOpen(false);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [file, name, audioType, mood, sceneTypes, tagsInput, onUpload]);

  const resetAndClose = useCallback(() => {
    setFile(null);
    setName('');
    setAudioType('');
    setMood('');
    setSceneTypes([]);
    setTagsInput('');
    setError(null);
    setUploading(false);
    setProgress(0);
    setOpen(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : resetAndClose())}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>Upload Audio</DialogTitle>

        <div className="mt-4 space-y-4">
          {/* File picker */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={AUDIO_ACCEPT_VALUE}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              disabled={uploading}
            >
              <Upload className="mr-2 size-4" />
              {file ? file.name : 'Choose audio file...'}
            </Button>
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Track name"
              disabled={uploading}
            />
          </div>

          {/* Type + Mood */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Type</label>
              <Select value={audioType} onValueChange={(v) => setAudioType(v as AudioType)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIO_TYPES.map((at) => (
                    <SelectItem key={at} value={at} className="text-xs">
                      {at.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Mood</label>
              <Select value={mood} onValueChange={(v) => setMood(v as AudioMood)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Mood" />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scene types (toggle chips) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Scene Types</label>
            <div className="flex flex-wrap gap-1">
              {SCENE_TYPES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => toggleSceneType(st)}
                  disabled={uploading}
                >
                  <Badge
                    variant={sceneTypes.includes(st) ? st as 'battle' | 'story' | 'montage' | 'negotiation' | 'respite' : 'outline'}
                    className="cursor-pointer text-[10px] px-1.5 py-0.5"
                  >
                    {st}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Tags (comma-separated)</label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="forest, rain, thunder..."
              disabled={uploading}
            />
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-xs text-zinc-400">{progress}%</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost" disabled={uploading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleUpload}
              disabled={!file || !name || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Audio'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
