import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BookOpen, ListOrdered, Music, ScrollText } from 'lucide-react';
import { Button, cn } from '@anvil/ui';
import { CombatTracker } from '../../../components/session/CombatTracker.js';
import { SceneAudioPanel } from '../../../components/session/SceneAudioPanel.js';
import { useAssetsStore } from '../../../stores/assetsStore.js';
import type {
  ClientMessage,
  SceneRef,
  SessionState,
} from '../../../types/protocol.js';
import { MetricMini, PhoneButton, PhoneTabBar, num } from './phone-shared.js';
import { PhoneNotes } from './PhoneNotes.js';

type DirectorTab = 'live' | 'initiative' | 'audio' | 'notes';

const DIRECTOR_TABS = [
  { id: 'live', Icon: ScrollText, label: 'Live' },
  { id: 'initiative', Icon: ListOrdered, label: 'Initiative' },
  { id: 'audio', Icon: Music, label: 'Audio' },
  { id: 'notes', Icon: BookOpen, label: 'Notes' },
] as const satisfies ReadonlyArray<{ id: DirectorTab; Icon: typeof ScrollText; label: string }>;

function DirectorSceneControls({
  state,
  scene,
  send,
  canMutate,
}: {
  state: SessionState;
  scene: SceneRef | null;
  send: (msg: ClientMessage) => void;
  canMutate: boolean;
}) {
  if (!scene) return <div className="p-6 text-sm text-zinc-500">No active scene.</div>;
  const data = scene.data ?? {};

  if (scene.type === 'battle') {
    const heroes = state.entities.filter((entity) => entity.type === 'hero');
    const villains = state.entities.filter((entity) => entity.type === 'monster' || entity.type === 'npc');
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Battle</p>
        <h2 className="text-xl font-semibold text-zinc-50">{scene.name}</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-zinc-900 p-3"><p className="text-2xl">{heroes.length}</p><p className="text-xs text-zinc-500">Heroes</p></div>
          <div className="rounded-md bg-zinc-900 p-3"><p className="text-2xl">{villains.length}</p><p className="text-xs text-zinc-500">Villains</p></div>
          <div className="rounded-md bg-zinc-900 p-3"><p className="text-2xl">{state.combat?.malice ?? 0}</p><p className="text-xs text-zinc-500">Malice</p></div>
        </div>
        {!state.combat && (
          <PhoneButton
            disabled={!canMutate || heroes.length === 0 || villains.length === 0}
            onClick={() => send({ type: 'combat_action', action: { type: 'START_COMBAT', heroEntityIds: heroes.map((entity) => entity.id), villainEntityIds: villains.map((entity) => entity.id) } })}
          >
            Start Combat
          </PhoneButton>
        )}
        {state.combat && (
          <p className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
            Round {state.combat.round}. Active side: {state.combat.activeSide ?? 'none'}. Manage turns in the Initiative tab.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {state.entities.map((entity) => (
            <div key={entity.id} className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-zinc-100">{entity.name}</span>
                <span className="text-xs text-zinc-500">{num(entity, 'currentStamina', 0)}/{num(entity, 'maxStamina', 0)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (scene.type === 'montage') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Montage</p>
        <h2 className="text-xl font-semibold text-zinc-50">{String(data['goal'] ?? scene.name)}</h2>
        <div className="grid grid-cols-2 gap-2">
          <MetricMini label="Successes" value={state.montage?.successes ?? 0} max={state.montage?.successLimit ?? Number(data['successLimit'] ?? 0)} />
          <MetricMini label="Failures" value={state.montage?.failures ?? 0} max={state.montage?.failureLimit ?? Number(data['failureLimit'] ?? 0)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PhoneButton disabled={!canMutate} onClick={() => send({ type: 'montage_adjust_successes', delta: 1 })}>+ Success</PhoneButton>
          <PhoneButton disabled={!canMutate} onClick={() => send({ type: 'montage_adjust_failures', delta: 1 })}>+ Failure</PhoneButton>
        </div>
      </div>
    );
  }

  if (scene.type === 'negotiation') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Negotiation</p>
        <h2 className="text-xl font-semibold text-zinc-50">{String(data['npcName'] ?? scene.name)}</h2>
        <div className="grid grid-cols-2 gap-2">
          <MetricMini label="Interest" value={state.negotiation?.interest ?? Number(data['interest'] ?? 0)} max={5} />
          <MetricMini label="Patience" value={state.negotiation?.patience ?? Number(data['patience'] ?? 0)} max={state.negotiation?.maxPatience ?? Number(data['maxPatience'] ?? 0)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PhoneButton disabled={!canMutate} onClick={() => send({ type: 'negotiation_adjust_interest', delta: 1 })}>+ Interest</PhoneButton>
          <PhoneButton disabled={!canMutate} onClick={() => send({ type: 'negotiation_adjust_patience', delta: -1 })}>- Patience</PhoneButton>
        </div>
      </div>
    );
  }

  if (scene.type === 'respite') {
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Respite</p>
        <h2 className="text-xl font-semibold text-zinc-50">{String(data['location'] ?? scene.name)}</h2>
        {(state.respite?.activities ?? []).map((activity) => (
          <div key={activity.activityId} className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
            <p className="font-medium text-zinc-100">{activity.name}</p>
            <p className="mt-1 text-xs text-zinc-500">{activity.claimedByName ? `Claimed by ${activity.claimedByName}` : 'Unclaimed'}</p>
            {!activity.completed && (
              <Button className="mt-3 w-full" size="sm" disabled={!canMutate} onClick={() => send({ type: 'respite_complete_activity', activityId: activity.activityId })}>
                Complete
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Story</p>
      <h2 className="text-xl font-semibold text-zinc-50">{scene.name}</h2>
      <p className="whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm leading-6 text-zinc-300">
        {String(data['readAloud'] ?? 'No read-aloud text.')}
      </p>
      {typeof data['notes'] === 'string' && data['notes'].trim() && (
        <p className="whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm leading-6 text-zinc-400">
          {data['notes']}
        </p>
      )}
    </div>
  );
}

function SceneNavigator({
  state,
  send,
  canMutate,
}: {
  state: SessionState;
  send: (msg: ClientMessage) => void;
  canMutate: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-zinc-800 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Scenes</p>
      {state.scenes.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={!canMutate || item.id === state.activeSceneId}
          onClick={() => send({ type: 'switch_scene', sceneId: item.id })}
          className={cn(
            'min-h-14 rounded-md border px-3 text-left text-sm disabled:opacity-60',
            item.id === state.activeSceneId
              ? 'border-zinc-100 bg-zinc-100 text-zinc-950'
              : 'border-zinc-800 bg-zinc-900 text-zinc-200',
          )}
        >
          <span className="block font-medium">{item.name}</span>
          <span className="text-xs capitalize opacity-70">{item.type}</span>
        </button>
      ))}
    </div>
  );
}

export function PhoneDirectorView({
  state,
  send,
  canMutate,
}: {
  state: SessionState;
  send: (msg: ClientMessage) => void;
  canMutate: boolean;
}) {
  const [tab, setTab] = useState<DirectorTab>('live');
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const scene = state.scenes.find((item) => item.id === state.activeSceneId) ?? null;
  const combat = state.combat;

  const audioAssets = useAssetsStore((s) => s.audioAssets);
  const loadAudio = useAssetsStore((s) => s.loadAudio);

  useEffect(() => {
    if (tab === 'audio' && state.campaignId) {
      void loadAudio(state.campaignId);
    }
  }, [loadAudio, state.campaignId, tab]);

  const handleAudioChange = useCallback(
    (newAudioId: string | null) => {
      if (!canMutate) return;
      setActiveAudioId(newAudioId);
      if (newAudioId) {
        const asset = audioAssets.find((a) => a.id === newAudioId);
        const url =
          asset?.audioUrl ?? (asset?.assetId ? `/api/assets/${asset.assetId}/data` : undefined);
        if (url) {
          send({ type: 'audio_play', audioAssetId: newAudioId, loop: true });
          toast.info(`Playing ${asset?.name ?? 'track'} for the table.`);
        }
      } else {
        send({ type: 'audio_stop' });
        toast.info('Audio stopped.');
      }
    },
    [audioAssets, canMutate, send],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-zinc-800 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Director Companion</p>
        <h1 className="mt-1 truncate text-xl font-semibold text-zinc-50">{scene?.name ?? 'No active scene'}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'live' && (
          <>
            <DirectorSceneControls state={state} scene={scene} send={send} canMutate={canMutate} />
            <SceneNavigator state={state} send={send} canMutate={canMutate} />
          </>
        )}
        {tab === 'initiative' && (
          <div className="p-3">
            {combat ? (
              <CombatTracker
                combat={combat}
                entities={state.entities}
                isDirector
                currentHeroEntityId={null}
                onClaimTurn={() => {}}
                onSelectTurn={(entityId) => {
                  if (!canMutate) return;
                  send({ type: 'combat_action', action: { type: 'SELECT_TURN', entityId } });
                }}
                onEndTurn={() => {
                  if (!canMutate) return;
                  send({ type: 'combat_action', action: { type: 'END_TURN' } });
                }}
                onEndCombat={() => {
                  if (!canMutate) return;
                  send({ type: 'combat_action', action: { type: 'END_COMBAT' } });
                }}
                onAdjustMalice={(delta) => {
                  if (!canMutate) return;
                  send({ type: 'combat_action', action: { type: 'ADJUST_MALICE', delta } });
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-zinc-500">Combat has not started.</p>
                {scene?.type === 'battle' && (
                  <PhoneButton
                    disabled={!canMutate}
                    onClick={() => {
                      const heroes = state.entities.filter((entity) => entity.type === 'hero');
                      const villains = state.entities.filter(
                        (entity) => entity.type === 'monster' || entity.type === 'npc',
                      );
                      if (heroes.length === 0 || villains.length === 0) {
                        toast.error('Need at least one hero and one villain to start combat.');
                        return;
                      }
                      send({
                        type: 'combat_action',
                        action: {
                          type: 'START_COMBAT',
                          heroEntityIds: heroes.map((entity) => entity.id),
                          villainEntityIds: villains.map((entity) => entity.id),
                        },
                      });
                    }}
                  >
                    Start Combat
                  </PhoneButton>
                )}
              </div>
            )}
          </div>
        )}
        {tab === 'audio' && (
          <div className="p-3">
            <SceneAudioPanel
              campaignId={state.campaignId}
              audioId={activeAudioId}
              onAudioChange={handleAudioChange}
              label="Now Playing"
            />
            {state.audio?.assetName && (
              <p className="mt-3 rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-400">
                Broadcasting to table: <span className="font-medium text-zinc-200">{state.audio.assetName}</span>
                {state.audio.playing ? ' (playing)' : ' (paused)'}
              </p>
            )}
          </div>
        )}
        {tab === 'notes' && <PhoneNotes campaignId={state.campaignId} disabled={!canMutate} />}
      </div>
      <PhoneTabBar tabs={DIRECTOR_TABS} active={tab} onSelect={setTab} />
    </div>
  );
}
