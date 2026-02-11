import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose, Input } from '@anvil/ui';
import { api } from '../lib/api.js';
import { generateRoomCode } from '../lib/room-code.js';
import { TreeSidebar } from '../components/builder/TreeSidebar.js';
import { CardGrid } from '../components/builder/CardGrid.js';
import { SceneWorkspace } from '../components/builder/SceneWorkspace.js';

interface Module { id: string; name: string; description: string; order_index: number; }
interface Session { id: string; name: string; description: string; module_id: string | null; order_index: number; status?: string; }
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
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<{ name: string; description: string } | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<TreeNode['type'] | null>(null);

  // Dialog states
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addSceneOpen, setAddSceneOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSceneType, setNewSceneType] = useState('story');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

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

  const handleGoLive = async () => {
    if (!selectedId || selectedType !== 'session') return;
    const session = sessions.find((s) => s.id === selectedId);
    if (session?.status && session.status !== 'draft') return;
    const roomCode = generateRoomCode();
    await api.put(`/api/sessions/${selectedId}/go-live`, { roomCode });
    navigate(`/app/session/${selectedId}/lobby`);
  };

  const handleRejoin = () => {
    if (!selectedId || selectedType !== 'session') return;
    navigate(`/app/session/${selectedId}`);
  };

  const handleInvite = async () => {
    if (!campaignId) return;
    const result = await api.post<{ invite: { code: string } }>(`/api/campaigns/${campaignId}/invites`, {});
    const link = `${window.location.origin}/join/${result.invite.code}`;
    setInviteLink(link);
    setInviteOpen(true);
  };

  const selectedSession = selectedType === 'session' ? sessions.find((s) => s.id === selectedId) : null;

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
              <DialogTrigger asChild><Button size="sm" className="bg-sidebar-director text-zinc-900 hover:bg-sidebar-director/80">Add Module</Button></DialogTrigger>
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
          {selectedType === 'module' && (
            <Dialog open={addSessionOpen} onOpenChange={setAddSessionOpen}>
              <DialogTrigger asChild><Button size="sm" className="bg-sidebar-director text-zinc-900 hover:bg-sidebar-director/80">Add Session</Button></DialogTrigger>
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
              <DialogTrigger asChild><Button size="sm" className="bg-sidebar-director text-zinc-900 hover:bg-sidebar-director/80">Add Scene</Button></DialogTrigger>
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
          {selectedType === 'campaign' && (
            <Button size="sm" variant="outline" onClick={handleInvite}>Invite Players</Button>
          )}
          {selectedSession && (!selectedSession.status || selectedSession.status === 'draft') && (
            <Button size="sm" variant="default" onClick={handleGoLive}>Go Live</Button>
          )}
          {selectedSession && selectedSession.status === 'active' && (
            <Button size="sm" variant="secondary" onClick={handleRejoin}>Rejoin</Button>
          )}
          {selectedSession?.status && selectedSession.status !== 'draft' && (
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 capitalize">
              {selectedSession.status}
            </span>
          )}
        </div>

        {/* Conditionally render SceneWorkspace or CardGrid */}
        {selectedType === 'scene' && selectedId ? (
          (() => {
            const selectedScene = scenes.find((s) => s.id === selectedId);
            if (!selectedScene) return <div className="p-8 text-zinc-500">Scene not found</div>;
            return (
              <SceneWorkspace
                scene={{
                  ...selectedScene,
                  type: selectedScene.type as 'battle' | 'story' | 'montage' | 'negotiation' | 'respite',
                }}
                campaignId={campaignId!}
                onSave={load}
              />
            );
          })()
        ) : (
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
              // Double-click on scene also opens it (select it)
              const scene = scenes.find((s) => s.id === id);
              if (scene) {
                setSelectedId(id);
                setSelectedType('scene');
              }
            }}
          />
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogTitle>Invite Players</DialogTitle>
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-sm text-zinc-400">Share this link with your players:</p>
            <div className="flex gap-2">
              <Input readOnly value={inviteLink ?? ''} className="font-mono text-xs" />
              <Button
                size="sm"
                onClick={() => { if (inviteLink) navigator.clipboard.writeText(inviteLink); }}
              >
                Copy
              </Button>
            </div>
            <div className="flex justify-end">
              <DialogClose asChild><Button variant="ghost">Close</Button></DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
