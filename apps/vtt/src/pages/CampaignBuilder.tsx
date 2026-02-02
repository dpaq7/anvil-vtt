import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose, Input } from '@anvil/ui';
import { api } from '../lib/api.js';
import { TreeSidebar } from '../components/builder/TreeSidebar.js';
import { CardGrid } from '../components/builder/CardGrid.js';
import { SceneEditorSheet } from '../components/builder/SceneEditorSheet.js';

interface Module { id: string; name: string; description: string; order_index: number; }
interface Session { id: string; name: string; description: string; module_id: string | null; order_index: number; }
interface Scene { id: string; title: string; type: string; data: string; order_index: number; game_session_id: string; }

interface TreeNode {
  id: string;
  label: string;
  type: 'campaign' | 'module' | 'session' | 'scene';
  sceneType?: string;
  children?: TreeNode[];
}

export function CampaignBuilder() {
  const { id: campaignId } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<{ name: string; description: string } | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<TreeNode['type'] | null>(null);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);

  // Dialog states
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addSceneOpen, setAddSceneOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSceneType, setNewSceneType] = useState('story');

  const load = useCallback(async () => {
    if (!campaignId) return;
    const campaignData = await api.get<{ campaign: { name: string; description: string } }>(`/api/campaigns/${campaignId}`);
    setCampaign(campaignData.campaign);

    const modulesData = await api.get<{ modules: Module[] }>(`/api/campaigns/${campaignId}/modules`);
    setModules(modulesData.modules);

    const sessionsData = await api.get<{ sessions: Session[] }>(`/api/campaigns/${campaignId}/sessions`);
    setSessions(sessionsData.sessions);

    // Load scenes for all sessions
    const allScenes: Scene[] = [];
    for (const s of sessionsData.sessions) {
      const sceneData = await api.get<{ scenes: Scene[] }>(`/api/sessions/${s.id}/scenes`);
      allScenes.push(...sceneData.scenes);
    }
    setScenes(allScenes);
  }, [campaignId]);

  useEffect(() => { load(); }, [load]);

  const buildTree = (): TreeNode[] => {
    if (!campaign || !campaignId) return [];

    const moduleNodes: TreeNode[] = modules.map((m) => {
      const moduleSessions = sessions.filter((s) => s.module_id === m.id);
      return {
        id: m.id,
        label: m.name,
        type: 'module' as const,
        children: moduleSessions.map((s) => ({
          id: s.id,
          label: s.name,
          type: 'session' as const,
          children: scenes
            .filter((sc) => sc.game_session_id === s.id)
            .map((sc) => ({ id: sc.id, label: sc.title, type: 'scene' as const, sceneType: sc.type })),
        })),
      };
    });

    // Unattached sessions
    const unattached = sessions.filter((s) => !s.module_id);
    const unattachedNodes: TreeNode[] = unattached.map((s) => ({
      id: s.id,
      label: s.name,
      type: 'session' as const,
      children: scenes
        .filter((sc) => sc.game_session_id === s.id)
        .map((sc) => ({ id: sc.id, label: sc.title, type: 'scene' as const, sceneType: sc.type })),
    }));

    return [
      { id: campaignId, label: campaign.name, type: 'campaign', children: [...moduleNodes, ...unattachedNodes] },
    ];
  };

  const getCardItems = () => {
    if (!selectedId || !selectedType) return [];
    if (selectedType === 'campaign') {
      return modules.map((m) => ({ id: m.id, title: m.name, subtitle: m.description }));
    }
    if (selectedType === 'module') {
      return sessions
        .filter((s) => s.module_id === selectedId)
        .map((s) => ({ id: s.id, title: s.name, subtitle: s.description }));
    }
    if (selectedType === 'session') {
      return scenes
        .filter((s) => s.game_session_id === selectedId)
        .map((s) => ({ id: s.id, title: s.title, type: s.type }));
    }
    return [];
  };

  const addModule = async () => {
    if (!newName.trim() || !campaignId) return;
    await api.post(`/api/campaigns/${campaignId}/modules`, { name: newName });
    setNewName('');
    setAddModuleOpen(false);
    await load();
  };

  const addSession = async () => {
    if (!newName.trim() || !campaignId) return;
    const moduleId = selectedType === 'module' ? selectedId : undefined;
    await api.post(`/api/campaigns/${campaignId}/sessions`, { name: newName, module_id: moduleId });
    setNewName('');
    setAddSessionOpen(false);
    await load();
  };

  const addScene = async () => {
    if (!newName.trim() || !selectedId || selectedType !== 'session') return;
    await api.post(`/api/sessions/${selectedId}/scenes`, { title: newName, type: newSceneType });
    setNewName('');
    setAddSceneOpen(false);
    await load();
  };

  const handleSceneSave = async (sceneId: string, data: string) => {
    await api.put(`/api/scenes/${sceneId}`, { data });
    setEditingScene(null);
    await load();
  };

  if (!campaign) return <div className="p-8 text-zinc-400">Loading...</div>;

  return (
    <div className="flex h-full">
      {/* Tree Sidebar */}
      <div className="w-64 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-900/50">
        <div className="border-b border-zinc-800 p-3">
          <h2 className="text-sm font-semibold text-zinc-300">Campaign Structure</h2>
        </div>
        <TreeSidebar
          nodes={buildTree()}
          selectedId={selectedId}
          onSelect={(id, type) => { setSelectedId(id); setSelectedType(type); }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-zinc-800 p-4">
          {selectedType === 'campaign' && (
            <Dialog open={addModuleOpen} onOpenChange={setAddModuleOpen}>
              <DialogTrigger asChild><Button size="sm">Add Module</Button></DialogTrigger>
              <DialogContent>
                <DialogTitle>New Module</DialogTitle>
                <div className="mt-4 flex flex-col gap-4">
                  <Input placeholder="Module name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={addModule}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {(selectedType === 'campaign' || selectedType === 'module') && (
            <Dialog open={addSessionOpen} onOpenChange={setAddSessionOpen}>
              <DialogTrigger asChild><Button size="sm" variant="secondary">Add Session</Button></DialogTrigger>
              <DialogContent>
                <DialogTitle>New Session</DialogTitle>
                <div className="mt-4 flex flex-col gap-4">
                  <Input placeholder="Session name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={addSession}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {selectedType === 'session' && (
            <Dialog open={addSceneOpen} onOpenChange={setAddSceneOpen}>
              <DialogTrigger asChild><Button size="sm" variant="secondary">Add Scene</Button></DialogTrigger>
              <DialogContent>
                <DialogTitle>New Scene</DialogTitle>
                <div className="mt-4 flex flex-col gap-4">
                  <Input placeholder="Scene title" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <select
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    value={newSceneType}
                    onChange={(e) => setNewSceneType(e.target.value)}
                  >
                    <option value="story">Story</option>
                    <option value="battle">Battle</option>
                    <option value="montage">Montage</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="respite">Respite</option>
                  </select>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={addScene}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <CardGrid
          items={getCardItems()}
          onSelect={(id) => {
            // If clicking a scene, find and select it in tree
            const scene = scenes.find((s) => s.id === id);
            if (scene) {
              setSelectedId(id);
              setSelectedType('scene');
            } else {
              // It could be a module or session
              const mod = modules.find((m) => m.id === id);
              if (mod) { setSelectedId(id); setSelectedType('module'); }
              const sess = sessions.find((s) => s.id === id);
              if (sess) { setSelectedId(id); setSelectedType('session'); }
            }
          }}
          onDoubleClick={(id) => {
            const scene = scenes.find((s) => s.id === id);
            if (scene) setEditingScene(scene);
          }}
        />
      </div>

      {/* Scene Editor Sheet */}
      {editingScene && (
        <SceneEditorSheet
          scene={editingScene}
          onSave={handleSceneSave}
          onClose={() => setEditingScene(null)}
        />
      )}
    </div>
  );
}
