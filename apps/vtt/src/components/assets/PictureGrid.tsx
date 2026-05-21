import { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
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
import { AssetActionMenu } from './AssetActionMenu.js';

export interface PictureAsset {
  id: string;
  name: string;
  type: string;
  content_type: string | null;
  file_size: number | null;
  created_at: string;
  uploaded_at: string | null;
}

export interface UpdatePictureAssetInput {
  name?: string;
  type?: string;
}

const PICTURE_TYPES = ['portrait', 'token', 'handout', 'other'] as const;

function formatBytes(value: number | null) {
  if (!value) return 'Size unknown';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

interface PictureDetailsDialogProps {
  asset: PictureAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (assetId: string, input: UpdatePictureAssetInput) => Promise<void>;
}

function PictureDetailsDialog({ asset, open, onOpenChange, onSave }: PictureDetailsDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('other');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!asset || !open) return;
    setName(asset.name);
    setType(PICTURE_TYPES.includes(asset.type as (typeof PICTURE_TYPES)[number]) ? asset.type : 'other');
    setSaving(false);
    setError(null);
  }, [asset, open]);

  const isDirty = Boolean(asset && (name.trim() !== asset.name || type !== asset.type));

  const handleSave = async () => {
    if (!asset || !isDirty || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(asset.id, {
        name: name.trim() !== asset.name ? name.trim() : undefined,
        type: type !== asset.type ? type : undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Picture update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle className="text-sm">Edit Picture Details</DialogTitle>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Name</label>
            <Input value={name} onChange={(event) => setName(event.currentTarget.value)} disabled={saving} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PICTURE_TYPES.map((pictureType) => (
                  <SelectItem key={pictureType} value={pictureType} className="text-xs capitalize">
                    {pictureType.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

interface PictureGridProps {
  assets: PictureAsset[];
  onUpdate: (assetId: string, input: UpdatePictureAssetInput) => Promise<void>;
  onDelete: (assetId: string) => Promise<void>;
}

export function PictureGrid({ assets, onUpdate, onDelete }: PictureGridProps) {
  const [editingAsset, setEditingAsset] = useState<PictureAsset | null>(null);

  if (assets.length === 0) {
    return <p className="p-8 text-center text-zinc-500">No uploaded pictures yet.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {assets.map((asset) => (
          <Card key={asset.id} className="group overflow-hidden transition hover:border-zinc-600">
            <div className="relative aspect-video bg-zinc-800">
              <img
                src={`/api/assets/${asset.id}/data`}
                alt={asset.name}
                className="size-full object-cover"
              />
              <div className="absolute right-2 top-2 z-10">
                <AssetActionMenu
                  label={`Open ${asset.name} actions`}
                  itemName={asset.name}
                  onEdit={() => setEditingAsset(asset)}
                  onDelete={() => onDelete(asset.id)}
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
                <p className="truncate text-sm font-semibold text-white">{asset.name}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2 text-[10px] text-zinc-500">
              <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                {asset.type}
              </Badge>
              <span className="min-w-0 truncate">{formatBytes(asset.file_size)}</span>
              <ImageIcon className="size-3 shrink-0" />
            </div>
          </Card>
        ))}
      </div>

      <PictureDetailsDialog
        asset={editingAsset}
        open={editingAsset !== null}
        onOpenChange={(open) => {
          if (!open) setEditingAsset(null);
        }}
        onSave={onUpdate}
      />
    </>
  );
}
