import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, Loader2, Plus, Trash2, Upload, UserCircle, Users } from 'lucide-react';
import { Button, Input, Textarea, cn } from '@anvil/ui';
import type { Npc } from '@anvil/types';
import { api } from '../../lib/api.js';
import { NpcGrid } from '../../components/assets/NpcGrid.js';
import { uploadFile, useAssetsStore } from '../../stores/assetsStore.js';

interface CampaignOption {
  id: string;
  name: string;
}

export function MobileNpcPanel() {
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [newNpcName, setNewNpcName] = useState('');
  const [creating, setCreating] = useState(false);

  const npcs = useAssetsStore((s) => s.npcs);
  const loading = useAssetsStore((s) => s.loading);
  const error = useAssetsStore((s) => s.error);
  const loadNpcs = useAssetsStore((s) => s.loadNpcs);
  const createNpc = useAssetsStore((s) => s.createNpc);
  const updateNpc = useAssetsStore((s) => s.updateNpc);
  const deleteNpc = useAssetsStore((s) => s.deleteNpc);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ directed: CampaignOption[] }>('/api/campaigns')
      .then((data) => {
        if (cancelled) return;
        setCampaigns(data.directed);
        setCampaignId((current) => current ?? data.directed[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setCampaigns([]);
      })
      .finally(() => {
        if (!cancelled) setCampaignsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!campaignId) return;
    setSelectedNpcId(null);
    void loadNpcs(campaignId);
  }, [campaignId, loadNpcs]);

  const handleCreate = async () => {
    const name = newNpcName.trim();
    if (!campaignId || !name || creating) return;
    setCreating(true);
    try {
      const npc = await createNpc(campaignId, { name });
      setNewNpcName('');
      setSelectedNpcId(npc.id);
    } finally {
      setCreating(false);
    }
  };

  const selectedNpc = npcs.find((npc) => npc.id === selectedNpcId) ?? null;

  if (!campaignsLoaded) {
    return (
      <div className="flex min-h-52 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 px-6 py-8 text-center">
        <Users className="mb-3 size-8 text-zinc-600" />
        <p className="text-sm font-semibold text-zinc-200">No directed campaigns</p>
        <p className="mt-1 max-w-xs text-xs text-zinc-500">
          NPCs belong to a campaign. Create a campaign on desktop first.
        </p>
      </div>
    );
  }

  if (campaignId && selectedNpc) {
    return (
      <MobileNpcEditor
        key={selectedNpc.id}
        npc={selectedNpc}
        onUpdate={(npcId, input) => updateNpc(campaignId, npcId, input)}
        onDelete={async (npcId) => {
          await deleteNpc(campaignId, npcId);
          setSelectedNpcId(null);
        }}
        onBack={() => setSelectedNpcId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <select
        value={campaignId ?? ''}
        onChange={(event) => setCampaignId(event.currentTarget.value)}
        className="h-11 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
        aria-label="Campaign"
      >
        {campaigns.map((campaign) => (
          <option key={campaign.id} value={campaign.id}>
            {campaign.name}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <Input
          value={newNpcName}
          onChange={(event) => setNewNpcName(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void handleCreate();
          }}
          placeholder="New NPC name"
          className="h-11 flex-1"
        />
        <Button
          className="h-11"
          disabled={!newNpcName.trim() || creating}
          onClick={() => void handleCreate()}
        >
          {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Create
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-52 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="-m-3">
          <NpcGrid npcs={npcs} onSelect={setSelectedNpcId} selectedId={selectedNpcId} compact />
        </div>
      )}
    </div>
  );
}

interface MobileNpcEditorProps {
  npc: Npc;
  onUpdate: (npcId: string, input: { name?: string; location?: string | null; notes?: string | null; portraitAssetId?: string | null }) => Promise<void>;
  onDelete: (npcId: string) => Promise<void>;
  onBack: () => void;
}

function MobileNpcEditor({ npc, onUpdate, onDelete, onBack }: MobileNpcEditorProps) {
  const [name, setName] = useState(npc.name);
  const [location, setLocation] = useState(npc.location ?? '');
  const [notes, setNotes] = useState(npc.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isDirty =
    name !== npc.name || location !== (npc.location ?? '') || notes !== (npc.notes ?? '');

  const handleSave = useCallback(async () => {
    if (!isDirty || !name.trim()) return;
    setSaving(true);
    try {
      await onUpdate(npc.id, {
        name: name !== npc.name ? name.trim() : undefined,
        location: location !== (npc.location ?? '') ? location || null : undefined,
        notes: notes !== (npc.notes ?? '') ? notes || null : undefined,
      });
    } finally {
      setSaving(false);
    }
  }, [isDirty, name, location, notes, npc, onUpdate]);

  const handlePortraitUpload = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setUploadingPortrait(true);
      try {
        const assetId = await uploadFile(file, 'portrait');
        await onUpdate(npc.id, { portraitAssetId: assetId });
      } finally {
        setUploadingPortrait(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [npc.id, onUpdate],
  );

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await onDelete(npc.id);
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-11 items-center gap-1 self-start text-sm text-zinc-400 transition hover:text-zinc-100"
      >
        <ChevronLeft className="size-4" />
        NPCs
      </button>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
            {npc.portraitUrl ? (
              <img src={npc.portraitUrl} alt={npc.name} className="size-full object-cover" />
            ) : (
              <UserCircle className="size-9 text-zinc-500" />
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handlePortraitUpload(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10"
              disabled={uploadingPortrait}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              {uploadingPortrait ? 'Uploading...' : 'Upload portrait'}
            </Button>
            {npc.portraitAssetId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10"
                disabled={uploadingPortrait}
                onClick={() => void onUpdate(npc.id, { portraitAssetId: null })}
              >
                Clear portrait
              </Button>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-400">Name</label>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => void handleSave()}
          placeholder="NPC name"
          className="h-11"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-400">Location</label>
        <Input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          onBlur={() => void handleSave()}
          placeholder="Where can they be found?"
          className="h-11"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-400">Notes</label>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={() => void handleSave()}
          placeholder="Background, personality, secrets..."
          className="min-h-[12rem] resize-y text-sm leading-6"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => void handleSave()}
          disabled={!isDirty || saving}
          className="h-11 flex-1"
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="destructive"
          className={cn('h-11 shrink-0', confirmDelete && 'px-4')}
          onClick={() => void handleDelete()}
        >
          {confirmDelete ? 'Confirm?' : <Trash2 className="size-4" />}
        </Button>
      </div>

      <p className="text-[10px] text-zinc-600">
        Updated {new Date(npc.updatedAt).toLocaleDateString()}
      </p>
    </div>
  );
}
