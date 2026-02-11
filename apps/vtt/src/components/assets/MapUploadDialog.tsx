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
  Progress,
} from '@anvil/ui';
import type { CreateMapInput, SceneType, GridType, MapSize } from '@anvil/types';

const SCENE_TYPES: SceneType[] = ['battle', 'negotiation', 'montage', 'story', 'respite'];
const GRID_TYPES: GridType[] = ['gridded', 'gridless', 'hex'];
const MAP_SIZES: MapSize[] = ['small', 'medium', 'large'];

export interface MapUploadDialogProps {
  onUpload: (input: CreateMapInput, file: File) => Promise<void>;
  children: React.ReactNode;
}

interface UploadEntry {
  file: File;
  name: string;
}

export function MapUploadDialog({ onUpload, children }: MapUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<UploadEntry[]>([]);
  const [sceneType, setSceneType] = useState<SceneType | ''>('');
  const [gridType, setGridType] = useState<GridType>('gridded');
  const [size, setSize] = useState<MapSize>('medium');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBulk = files.length > 1;

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const entries: UploadEntry[] = Array.from(selected).map((f) => ({
      file: f,
      name: f.name.replace(/\.[^.]+$/, ''), // strip extension for default name
    }));
    setFiles(entries);
  }, []);

  const updateFileName = useCallback((index: number, name: string) => {
    setFiles((prev) => prev.map((entry, i) => (i === index ? { ...entry, name } : entry)));
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const entry = files[i]!;
        const input: CreateMapInput = {
          name: entry.name,
          sceneType: sceneType || undefined,
          gridType,
          size,
        };
        await onUpload(input, entry.file);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      // Reset and close
      setFiles([]);
      setSceneType('');
      setGridType('gridded');
      setSize('medium');
      setOpen(false);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [files, sceneType, gridType, size, onUpload]);

  const resetAndClose = useCallback(() => {
    setFiles([]);
    setSceneType('');
    setGridType('gridded');
    setSize('medium');
    setUploading(false);
    setProgress(0);
    setOpen(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : resetAndClose())}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>{isBulk ? 'Bulk Upload Maps' : 'Upload Map'}</DialogTitle>

        <div className="mt-4 space-y-4">
          {/* File picker */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
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
              {files.length > 0
                ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
                : 'Choose images...'}
            </Button>
          </div>

          {/* Single file name */}
          {files.length === 1 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Name</label>
              <Input
                value={files[0]?.name ?? ''}
                onChange={(e) => updateFileName(0, e.target.value)}
                disabled={uploading}
              />
            </div>
          )}

          {/* Bulk file name overrides */}
          {isBulk && (
            <div className="max-h-40 space-y-2 overflow-y-auto">
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                File names ({files.length})
              </label>
              {files.map((entry, i) => (
                <Input
                  key={i}
                  value={entry.name}
                  onChange={(e) => updateFileName(i, e.target.value)}
                  disabled={uploading}
                  className="text-xs"
                />
              ))}
            </div>
          )}

          {/* Shared metadata */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Scene Type</label>
              <Select
                value={sceneType}
                onValueChange={(v: string) => setSceneType(v as SceneType)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {SCENE_TYPES.map((st) => (
                    <SelectItem key={st} value={st} className="text-xs">
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Grid</label>
              <Select value={gridType} onValueChange={(v: string) => setGridType(v as GridType)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRID_TYPES.map((gt) => (
                    <SelectItem key={gt} value={gt} className="text-xs">
                      {gt.charAt(0).toUpperCase() + gt.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Size</label>
              <Select value={size} onValueChange={(v: string) => setSize(v as MapSize)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAP_SIZES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress bar */}
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
              disabled={files.length === 0 || uploading}
            >
              {uploading
                ? 'Uploading...'
                : isBulk
                  ? `Upload ${files.length} Maps`
                  : 'Upload Map'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
