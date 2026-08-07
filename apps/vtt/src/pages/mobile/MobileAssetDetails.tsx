import { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
  cn,
} from '@anvil/ui';
import { api } from '../../lib/api.js';
import { formatBytes, titleCase } from './shared-utils.js';

export interface EditableAsset {
  id: string;
  name: string;
  type: string;
  content_type: string | null;
  file_size: number | null;
}

/**
 * Client-side mirror of the server's asset type/content-type compatibility
 * rules (apps/server/src/lib/assets.ts isAllowedAssetContentType). The server
 * remains authoritative; this just avoids offering choices that will bounce.
 */
function allowedTypesFor(contentType: string | null): string[] {
  if (!contentType) return ['other'];
  if (contentType.startsWith('image/')) return ['map', 'token', 'portrait', 'handout', 'other'];
  if (contentType.startsWith('audio/')) return ['audio', 'other'];
  if (
    contentType === 'application/pdf' ||
    contentType === 'text/plain' ||
    contentType === 'text/markdown'
  ) {
    return ['handout', 'other'];
  }
  return ['other'];
}

export function MobileAssetDetails({
  asset,
  onClose,
  onChanged,
}: {
  asset: EditableAsset | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('other');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(asset?.name ?? '');
    setType(asset?.type ?? 'other');
    setConfirmingDelete(false);
    setError(null);
  }, [asset?.id, asset?.name, asset?.type]);

  if (!asset) return null;

  const typeOptions = allowedTypesFor(asset.content_type);
  const dirty = name.trim() !== asset.name || type !== asset.type;
  const busy = saving || deleting;

  const handleSave = async () => {
    if (!name.trim() || busy) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/api/assets/${asset.id}`, {
        ...(name.trim() !== asset.name ? { name: name.trim() } : {}),
        ...(type !== asset.type ? { type } : {}),
      });
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/api/assets/${asset.id}`);
      onChanged();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(
        message.includes('in use')
          ? 'This asset is used by a map, NPC, hero, or audio track. Remove it there first.'
          : message,
      );
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogTitle className="text-sm">Edit asset</DialogTitle>

        <div className="mt-4 flex flex-col gap-4">
          <label className="text-sm text-zinc-400">
            <span className="font-medium text-zinc-300">Name</span>
            <Input
              className="mt-1 h-11"
              value={name}
              disabled={busy}
              onChange={(event) => setName(event.target.value)}
              placeholder="Asset name"
            />
          </label>

          <label className="text-sm text-zinc-400">
            <span className="font-medium text-zinc-300">Type</span>
            <select
              className="mt-1 h-11 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 disabled:opacity-60"
              value={type}
              disabled={busy || typeOptions.length <= 1}
              onChange={(event) => setType(event.currentTarget.value)}
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {titleCase(option)}
                </option>
              ))}
            </select>
          </label>

          <p className="text-xs text-zinc-500">
            {asset.content_type ?? 'Unknown file type'} / {formatBytes(asset.file_size)}
          </p>

          {error && (
            <p className="rounded-md border border-red-900/60 bg-red-950/20 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          {confirmingDelete ? (
            <div className="rounded-md border border-red-900/60 bg-red-950/20 p-3">
              <p className="text-xs leading-5 text-red-200">
                Delete <span className="font-semibold">{asset.name}</span>? This cannot be undone.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-11"
                  disabled={busy}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Keep
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="min-h-11"
                  disabled={busy}
                  onClick={() => void handleDelete()}
                >
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : 'Delete'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn('min-h-11 gap-2 text-red-300 hover:text-red-200')}
                disabled={busy}
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" className="min-h-11" disabled={busy} onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="min-h-11"
                  disabled={busy || !dirty || !name.trim()}
                  onClick={() => void handleSave()}
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
