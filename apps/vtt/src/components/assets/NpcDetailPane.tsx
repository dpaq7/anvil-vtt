import { useState, useCallback, useRef } from 'react';
import { X, Trash2, UserCircle, Upload } from 'lucide-react';
import { Button, Input, Textarea } from '@anvil/ui';
import type { Npc, UpdateNpcInput } from '@anvil/types';
import { uploadFile } from '../../stores/assetsStore.js';

export interface NpcDetailPaneProps {
  npc: Npc;
  onUpdate: (npcId: string, input: UpdateNpcInput) => Promise<void>;
  onDelete: (npcId: string) => Promise<void>;
  onClose: () => void;
}

export function NpcDetailPane({ npc, onUpdate, onDelete, onClose }: NpcDetailPaneProps) {
  const [name, setName] = useState(npc.name);
  const [location, setLocation] = useState(npc.location ?? '');
  const [notes, setNotes] = useState(npc.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isDirty =
    name !== npc.name ||
    location !== (npc.location ?? '') ||
    notes !== (npc.notes ?? '');

  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    setSaving(true);
    try {
      await onUpdate(npc.id, {
        name: name !== npc.name ? name : undefined,
        location: location !== (npc.location ?? '') ? (location || null) : undefined,
        notes: notes !== (npc.notes ?? '') ? (notes || null) : undefined,
      });
    } finally {
      setSaving(false);
    }
  }, [isDirty, name, location, notes, npc, onUpdate]);

  const handlePortraitUpload = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setUploadingPortrait(true);
    try {
      const assetId = await uploadFile(file, 'portrait');
      await onUpdate(npc.id, { portraitAssetId: assetId });
    } finally {
      setUploadingPortrait(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [npc.id, onUpdate]);

  const handlePortraitClear = useCallback(async () => {
    if (!npc.portraitAssetId) return;
    setUploadingPortrait(true);
    try {
      await onUpdate(npc.id, { portraitAssetId: null });
    } finally {
      setUploadingPortrait(false);
    }
  }, [npc.id, npc.portraitAssetId, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await onDelete(npc.id);
    onClose();
  }, [confirmDelete, npc.id, onDelete, onClose]);

  return (
    <div className="flex h-full w-80 flex-col border-l border-zinc-800 bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-200">NPC Details</h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Portrait */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
            {npc.portraitUrl ? (
              <img
                src={npc.portraitUrl}
                alt={npc.name}
                className="size-24 object-cover"
              />
            ) : (
              <UserCircle className="size-10 text-zinc-500" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePortraitUpload(e.target.files?.[0])}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingPortrait}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-1.5 size-3.5" />
              {uploadingPortrait ? 'Uploading...' : 'Upload Image'}
            </Button>
            {npc.portraitAssetId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploadingPortrait}
                onClick={handlePortraitClear}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            placeholder="NPC name"
          />
        </div>

        {/* Location */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">Location</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={handleSave}
            placeholder="Where can they be found?"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSave}
            placeholder="Background, personality, secrets..."
            className="min-h-[200px] resize-y"
          />
        </div>

        {/* Metadata */}
        <div className="space-y-1 text-[10px] text-zinc-600">
          <p>Created: {new Date(npc.createdAt).toLocaleDateString()}</p>
          <p>Updated: {new Date(npc.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 border-t border-zinc-800 px-4 py-3">
        <Button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="flex-1"
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          className="shrink-0"
        >
          {confirmDelete ? (
            'Confirm?'
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
