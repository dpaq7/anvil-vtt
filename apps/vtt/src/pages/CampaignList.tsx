import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardContent, Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose, Input } from '@anvil/ui';
import type { SceneImportDocument, SceneImportResult } from '@anvil/types';
import { api } from '../lib/api.js';
import { SceneImportDialog } from '../components/import/SceneImportDialog.js';

interface Campaign {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  created_at: string;
}

interface CampaignLibraryModule {
  id: string;
  name: string;
  campaign_name: string;
  session_count: number;
  scene_count: number;
}

interface CampaignLibraryScene {
  id: string;
  title: string;
  type: string;
  campaign_name: string;
  module_name: string | null;
  session_name: string;
}

export function CampaignList() {
  const navigate = useNavigate();
  const [directed, setDirected] = useState<Campaign[]>([]);
  const [joined, setJoined] = useState<Campaign[]>([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [libraryModules, setLibraryModules] = useState<CampaignLibraryModule[]>([]);
  const [libraryScenes, setLibraryScenes] = useState<CampaignLibraryScene[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    const data = await api.get<{ directed: Campaign[]; joined: Campaign[] }>('/api/campaigns');
    setDirected(data.directed);
    setJoined(data.joined);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!dialogOpen) return;
    let cancelled = false;
    void api.get<{ modules: CampaignLibraryModule[]; scenes: CampaignLibraryScene[] }>('/api/campaigns/library')
      .then((data) => {
        if (cancelled) return;
        setLibraryModules(data.modules);
        setLibraryScenes(data.scenes);
      })
      .catch(() => {
        if (cancelled) return;
        setLibraryModules([]);
        setLibraryScenes([]);
      });
    return () => { cancelled = true; };
  }, [dialogOpen]);

  const createCampaign = async () => {
    if (!newName.trim()) return;
    await api.post('/api/campaigns', {
      name: newName,
      description: newDesc,
      sourceModuleIds: selectedModuleIds,
      sourceSceneIds: selectedSceneIds,
    });
    setNewName('');
    setNewDesc('');
    setSelectedModuleIds([]);
    setSelectedSceneIds([]);
    setDialogOpen(false);
    await load();
  };

  const toggleId = (ids: string[], id: string) => (
    ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
  );

  const importCampaign = async (document: SceneImportDocument) => {
    const result = await api.post<SceneImportResult>('/api/campaigns/import', { document });
    await load();
    navigate(`/app/campaigns/${result.campaignId}`);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <div className="flex items-center gap-2">
          <SceneImportDialog onImport={importCampaign} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Campaign</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>New Campaign</DialogTitle>
              <div className="mt-4 flex flex-col gap-4">
                <Input placeholder="Campaign name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                {(libraryModules.length > 0 || libraryScenes.length > 0) && (
                  <div className="rounded-md border border-zinc-800 bg-zinc-950/50">
                    <div className="border-b border-zinc-800 px-3 py-2">
                      <p className="text-sm font-medium text-zinc-200">Select existing modules or scenes</p>
                      <p className="mt-0.5 text-xs text-zinc-500">Copies prepared starting state only.</p>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-3">
                      {libraryModules.length > 0 && (
                        <div className="mb-3">
                          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">Modules</p>
                          <div className="space-y-1.5">
                            {libraryModules.map((module) => (
                              <label key={module.id} className="flex cursor-pointer items-start gap-2 rounded border border-zinc-800 bg-zinc-900/60 p-2 text-sm hover:border-zinc-700">
                                <input
                                  type="checkbox"
                                  className="mt-1 accent-zinc-200"
                                  checked={selectedModuleIds.includes(module.id)}
                                  onChange={() => setSelectedModuleIds((ids) => toggleId(ids, module.id))}
                                />
                                <span>
                                  <span className="block font-medium text-zinc-200">{module.name}</span>
                                  <span className="block text-xs text-zinc-500">
                                    {module.campaign_name} · {module.session_count} sessions · {module.scene_count} scenes
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {libraryScenes.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">Scenes</p>
                          <div className="space-y-1.5">
                            {libraryScenes.map((scene) => (
                              <label key={scene.id} className="flex cursor-pointer items-start gap-2 rounded border border-zinc-800 bg-zinc-900/60 p-2 text-sm hover:border-zinc-700">
                                <input
                                  type="checkbox"
                                  className="mt-1 accent-zinc-200"
                                  checked={selectedSceneIds.includes(scene.id)}
                                  onChange={() => setSelectedSceneIds((ids) => toggleId(ids, scene.id))}
                                />
                                <span>
                                  <span className="block font-medium text-zinc-200">{scene.title}</span>
                                  <span className="block text-xs text-zinc-500">
                                    {scene.campaign_name} · {scene.module_name ? `${scene.module_name} · ` : ''}{scene.session_name} · {scene.type}
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button onClick={createCampaign}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {directed.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">My Campaigns</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {directed.map((c) => (
              <Link key={c.id} to={`/app/campaigns/${c.id}`}>
                <Card className="transition hover:border-zinc-600">
                  <CardHeader>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                  </CardHeader>
                  {c.description && (
                    <CardContent>
                      <p className="text-sm text-zinc-400">{c.description}</p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {joined.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">Joined Campaigns</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {joined.map((c) => (
              <Link key={c.id} to={`/app/campaigns/${c.id}`}>
                <Card className="transition hover:border-zinc-600">
                  <CardHeader>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                  </CardHeader>
                  {c.description && (
                    <CardContent>
                      <p className="text-sm text-zinc-400">{c.description}</p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {directed.length === 0 && joined.length === 0 && (
        <p className="text-zinc-500">No campaigns yet. Create one to get started.</p>
      )}
    </div>
  );
}
