import { useState } from 'react';
import { Button } from '@anvil/ui';
import { BattleSceneEditor } from './BattleSceneEditor.js';
import { StorySceneEditor } from './StorySceneEditor.js';
import { MontageSceneEditor } from './MontageSceneEditor.js';
import { NegotiationSceneEditor } from './NegotiationSceneEditor.js';
import { RespiteSceneEditor } from './RespiteSceneEditor.js';

interface Scene {
  id: string;
  title: string;
  type: string;
  data: string;
}

interface SceneEditorSheetProps {
  scene: Scene;
  onSave: (sceneId: string, data: string) => void;
  onClose: () => void;
}

export function SceneEditorSheet({ scene, onSave, onClose }: SceneEditorSheetProps) {
  const [data, setData] = useState<Record<string, unknown>>(() => {
    try { return JSON.parse(scene.data) as Record<string, unknown>; }
    catch { return {}; }
  });

  const handleSave = () => {
    onSave(scene.id, JSON.stringify(data));
  };

  const editors: Record<string, React.ComponentType<{ data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }>> = {
    battle: BattleSceneEditor,
    story: StorySceneEditor,
    montage: MontageSceneEditor,
    negotiation: NegotiationSceneEditor,
    respite: RespiteSceneEditor,
  };

  const Editor = editors[scene.type] ?? StorySceneEditor;

  const sceneColors: Record<string, string> = {
    battle: 'border-red-500',
    story: 'border-purple-500',
    montage: 'border-amber-500',
    negotiation: 'border-blue-500',
    respite: 'border-green-500',
  };

  return (
    <div className={`w-96 shrink-0 overflow-y-auto border-l-2 bg-zinc-900 ${sceneColors[scene.type] ?? 'border-zinc-700'}`}>
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <h3 className="font-semibold">{scene.title}</h3>
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs capitalize text-zinc-400">{scene.type}</span>
      </div>

      <div className="p-4">
        <Editor data={data} onChange={setData} />
      </div>

      <div className="flex gap-2 border-t border-zinc-800 p-4">
        <Button onClick={handleSave} size="sm">Save</Button>
        <Button onClick={onClose} variant="ghost" size="sm">Close</Button>
      </div>
    </div>
  );
}
