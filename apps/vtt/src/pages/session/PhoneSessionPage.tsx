import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Compass, HeartPulse, Package, ScrollText, Shield, Sparkles, Trophy } from 'lucide-react';
import { Button, cn } from '@anvil/ui';
import type { NoteScope } from '@anvil/types';
import { useSessionSocket } from '../../hooks/useSessionSocket.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useNotesStore } from '../../stores/notesStore.js';
import { api } from '../../lib/api.js';
import type { ClientMessage, EntityData, HeroTrackerOperation, SceneRef, SessionState } from '../../types/protocol.js';

type PlayerTab = 'stamina' | 'resource' | 'recoveries' | 'victories' | 'inventory' | 'notes';
type DirectorTab = 'scene' | 'navigate' | 'notes';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category?: string;
  description?: string;
  notes?: string;
}

function num(entity: EntityData | null | undefined, key: string, fallback = 0) {
  const value = entity?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function str(entity: EntityData | null | undefined, key: string, fallback = '') {
  const value = entity?.[key];
  return typeof value === 'string' ? value : fallback;
}

function inventory(entity: EntityData | null | undefined): InventoryItem[] {
  const value = entity?.['inventory'];
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      id: typeof item['id'] === 'string' ? item['id'] : crypto.randomUUID(),
      name: typeof item['name'] === 'string' ? item['name'] : 'Item',
      quantity: typeof item['quantity'] === 'number' ? item['quantity'] : 1,
      category: typeof item['category'] === 'string' ? item['category'] : 'misc',
      description: typeof item['description'] === 'string' ? item['description'] : '',
      notes: typeof item['notes'] === 'string' ? item['notes'] : '',
    }));
}

function PhoneButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'min-h-11 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-100 active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
    >
      {children}
    </button>
  );
}

function MetricPanel({
  label,
  value,
  max,
  children,
}: {
  label: string;
  value: number;
  max?: number;
  children?: ReactNode;
}) {
  const pct = max && max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <section className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
        <p className="mt-1 text-5xl font-semibold text-zinc-50">
          {value}
          {max !== undefined && <span className="text-2xl text-zinc-500">/{max}</span>}
        </p>
      </div>
      {max !== undefined && (
        <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      {children}
    </section>
  );
}

function StatusBanner({
  status,
  anchored,
  error,
}: {
  status: string;
  anchored: boolean | null;
  error: string | null;
}) {
  if (status === 'connected' && anchored !== false && !error) return null;
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-100">
      {anchored === false
        ? 'Open this session on desktop first. Phone controls are read-only until sync is active.'
        : status === 'connected'
          ? error
          : 'Connection interrupted. Showing the last synced state.'}
    </div>
  );
}

function LockedPhone({ message }: { message: string }) {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div className="max-w-sm text-center">
        <Shield className="mx-auto mb-4 size-12 text-zinc-500" />
        <h1 className="text-xl font-semibold">Desktop Sync Required</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{message}</p>
      </div>
    </main>
  );
}

function PhoneNotes({ campaignId, disabled }: { campaignId: string; disabled: boolean }) {
  const {
    folders,
    notes,
    selectedNoteId,
    loading,
    loadAll,
    createNote,
    updateNote,
    setSelectedNoteId,
  } = useNotesStore();
  const [scopes, setScopes] = useState<NoteScope[]>([]);
  const [scope, setScope] = useState<NoteScope>('player');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? null;

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ scopes: NoteScope[]; defaultScope: NoteScope }>(`/api/campaigns/${campaignId}/note-scopes`)
      .then((result) => {
        if (cancelled) return;
        setScopes(result.scopes);
        setScope(result.defaultScope);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  useEffect(() => {
    void loadAll(campaignId, scope);
  }, [campaignId, loadAll, scope]);

  useEffect(() => {
    setDraftTitle(selectedNote?.title ?? '');
    setDraftContent(selectedNote?.content ?? '');
    setSaveState('idle');
  }, [selectedNote?.id, selectedNote?.title, selectedNote?.content]);

  const handleCreate = async () => {
    if (disabled || folders.length === 0) return;
    const note = await createNote(campaignId, {
      title: 'New Phone Note',
      content: '',
      folderId: folders[0]!.id,
      scope,
    });
    setSelectedNoteId(note.id);
  };

  const handleSave = async () => {
    if (disabled || !selectedNote) return;
    setSaveState('saving');
    try {
      await updateNote(campaignId, selectedNote.id, {
        title: draftTitle.trim() || 'Untitled',
        content: draftContent,
      });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {scopes.length > 1 && (
        <div className="grid grid-cols-2 gap-1 border-b border-zinc-800 p-2">
          {scopes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setSelectedNoteId(null);
                setScope(item);
              }}
              className={cn(
                'min-h-10 rounded text-sm font-medium capitalize',
                scope === item ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-400',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <span className="text-xs text-zinc-500">{loading ? 'Loading notes...' : `${notes.length} notes`}</span>
        <Button size="sm" variant="secondary" disabled={disabled || folders.length === 0} onClick={handleCreate}>
          New
        </Button>
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-[10rem_minmax(0,1fr)]">
        <div className="overflow-y-auto border-b border-zinc-800">
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => setSelectedNoteId(note.id)}
              className={cn(
                'block w-full border-b border-zinc-900 px-4 py-3 text-left',
                note.id === selectedNoteId ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-300',
              )}
            >
              <span className="block truncate text-sm font-medium">{note.title}</span>
              <span className="mt-1 block truncate text-xs text-zinc-500">{note.content || 'No content'}</span>
            </button>
          ))}
        </div>
        {selectedNote ? (
          <div className="flex min-h-0 flex-col gap-2 p-3">
            <input
              value={draftTitle}
              disabled={disabled}
              onChange={(event) => setDraftTitle(event.target.value)}
              className="h-11 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm font-semibold text-zinc-100 outline-none"
            />
            <textarea
              value={draftContent}
              disabled={disabled}
              onChange={(event) => setDraftContent(event.target.value)}
              className="min-h-0 flex-1 resize-none rounded-md border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm leading-6 text-zinc-200 outline-none"
              placeholder="Write notes..."
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{saveState}</span>
              <Button size="sm" disabled={disabled || saveState === 'saving'} onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 text-sm text-zinc-500">Select or create a note.</div>
        )}
      </div>
    </div>
  );
}

function PlayerPhone({
  state,
  hero,
  send,
  canMutate,
}: {
  state: SessionState;
  hero: EntityData | null;
  send: (msg: ClientMessage) => void;
  canMutate: boolean;
}) {
  const [tab, setTab] = useState<PlayerTab>('stamina');
  const [itemName, setItemName] = useState('');
  const sendTracker = (op: HeroTrackerOperation) => {
    if (!hero || !canMutate) return;
    send({ type: 'hero_tracker_update', heroId: hero.id, op });
  };

  const currentStamina = num(hero, 'currentStamina', 0);
  const maxStamina = num(hero, 'maxStamina', 0);
  const recoveriesCurrent = num(hero, 'recoveriesCurrent', 0);
  const recoveriesMax = num(hero, 'recoveriesMax', 0);
  const heroicResource = num(hero, 'heroicResource', 0);
  const victories = num(hero, 'victories', 0);
  const resourceName = str(hero, 'heroicResourceName', 'Resource');
  const items = inventory(hero);

  if (!hero) {
    return <div className="p-6 text-center text-sm text-zinc-500">No hero is assigned to this session.</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-zinc-800 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Player Companion</p>
        <h1 className="mt-1 truncate text-xl font-semibold text-zinc-50">{hero.name}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'stamina' && (
          <MetricPanel label="Stamina" value={currentStamina} max={maxStamina}>
            <div className="grid grid-cols-4 gap-2">
              {[-5, -1, 1, 5].map((delta) => (
                <PhoneButton key={delta} disabled={!canMutate} onClick={() => sendTracker({ kind: 'adjust_stamina', delta })}>
                  {delta > 0 ? `+${delta}` : delta}
                </PhoneButton>
              ))}
            </div>
          </MetricPanel>
        )}
        {tab === 'resource' && (
          <MetricPanel label={resourceName} value={heroicResource}>
            <div className="grid grid-cols-2 gap-2">
              <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'adjust_heroic_resource', delta: -1 })}>
                -1
              </PhoneButton>
              <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'adjust_heroic_resource', delta: 1 })}>
                +1
              </PhoneButton>
            </div>
          </MetricPanel>
        )}
        {tab === 'recoveries' && (
          <MetricPanel label="Recoveries" value={recoveriesCurrent} max={recoveriesMax}>
            <div className="grid grid-cols-2 gap-2">
              <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'adjust_recoveries', delta: -1 })}>
                Spend
              </PhoneButton>
              <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'adjust_recoveries', delta: 1 })}>
                Restore
              </PhoneButton>
            </div>
            <PhoneButton
              disabled={!canMutate}
              onClick={() =>
                send({
                  type: 'token_action',
                  action: { kind: 'catch-breath', sourceId: hero.id, targetId: hero.id },
                })
              }
              className="w-full"
            >
              Catch Breath
            </PhoneButton>
          </MetricPanel>
        )}
        {tab === 'victories' && (
          <MetricPanel label="Victories" value={victories}>
            <div className="grid grid-cols-2 gap-2">
              <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'adjust_victories', delta: -1 })}>
                -1
              </PhoneButton>
              <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'adjust_victories', delta: 1 })}>
                +1
              </PhoneButton>
            </div>
          </MetricPanel>
        )}
        {tab === 'inventory' && (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex gap-2">
              <input
                value={itemName}
                disabled={!canMutate}
                onChange={(event) => setItemName(event.target.value)}
                placeholder="Add item"
                className="h-11 min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none"
              />
              <Button
                disabled={!canMutate || !itemName.trim()}
                onClick={() => {
                  sendTracker({ kind: 'inventory_add', item: { name: itemName.trim(), quantity: 1, category: 'misc' } });
                  setItemName('');
                }}
              >
                Add
              </Button>
            </div>
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">No inventory items.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-100">{item.name}</p>
                      <p className="text-xs text-zinc-500">{item.category}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!canMutate}
                      onClick={() => sendTracker({ kind: 'inventory_remove', itemId: item.id })}
                      className="text-xs text-red-300 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-[44px_1fr_44px] items-center gap-2">
                    <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'inventory_update', itemId: item.id, changes: { quantity: item.quantity - 1 } })}>
                      -
                    </PhoneButton>
                    <span className="text-center text-sm text-zinc-300">Qty {item.quantity}</span>
                    <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'inventory_update', itemId: item.id, changes: { quantity: item.quantity + 1 } })}>
                      +
                    </PhoneButton>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {tab === 'notes' && <PhoneNotes campaignId={state.campaignId} disabled={!canMutate} />}
      </div>
      <nav className="grid grid-cols-6 border-t border-zinc-800 bg-zinc-900/95">
        {([
          ['stamina', HeartPulse, 'Sta'],
          ['resource', Sparkles, 'Res'],
          ['recoveries', Shield, 'Rec'],
          ['victories', Trophy, 'Vic'],
          ['inventory', Package, 'Inv'],
          ['notes', BookOpen, 'Notes'],
        ] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn('flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]', tab === id ? 'text-zinc-50' : 'text-zinc-500')}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

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
        {state.combat ? (
          <>
            <p className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
              Round {state.combat.round}. Active side: {state.combat.activeSide ?? 'none'}.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <PhoneButton disabled={!canMutate} onClick={() => send({ type: 'combat_action', action: { type: 'ADJUST_MALICE', delta: -1 } })}>- Malice</PhoneButton>
              <PhoneButton disabled={!canMutate} onClick={() => send({ type: 'combat_action', action: { type: 'ADJUST_MALICE', delta: 1 } })}>+ Malice</PhoneButton>
              <PhoneButton disabled={!canMutate} onClick={() => send({ type: 'combat_action', action: { type: 'END_TURN' } })}>End Turn</PhoneButton>
              <PhoneButton disabled={!canMutate} onClick={() => send({ type: 'combat_action', action: { type: 'END_COMBAT' } })}>End Combat</PhoneButton>
            </div>
          </>
        ) : (
          <PhoneButton
            disabled={!canMutate || heroes.length === 0 || villains.length === 0}
            onClick={() => send({ type: 'combat_action', action: { type: 'START_COMBAT', heroEntityIds: heroes.map((entity) => entity.id), villainEntityIds: villains.map((entity) => entity.id) } })}
          >
            Start Combat
          </PhoneButton>
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

function MetricMini({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="rounded-md bg-zinc-900 p-3 text-center">
      <p className="text-3xl font-semibold text-zinc-50">{value}<span className="text-base text-zinc-500">/{max}</span></p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function DirectorPhone({
  state,
  send,
  canMutate,
}: {
  state: SessionState;
  send: (msg: ClientMessage) => void;
  canMutate: boolean;
}) {
  const [tab, setTab] = useState<DirectorTab>('scene');
  const scene = state.scenes.find((item) => item.id === state.activeSceneId) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-zinc-800 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Director Companion</p>
        <h1 className="mt-1 truncate text-xl font-semibold text-zinc-50">{scene?.name ?? 'No active scene'}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'scene' && <DirectorSceneControls state={state} scene={scene} send={send} canMutate={canMutate} />}
        {tab === 'navigate' && (
          <div className="flex flex-col gap-2 p-4">
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
        )}
        {tab === 'notes' && <PhoneNotes campaignId={state.campaignId} disabled={!canMutate} />}
      </div>
      <nav className="grid grid-cols-3 border-t border-zinc-800 bg-zinc-900/95">
        {([
          ['scene', ScrollText, 'Live'],
          ['navigate', Compass, 'Scenes'],
          ['notes', BookOpen, 'Notes'],
        ] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn('flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]', tab === id ? 'text-zinc-50' : 'text-zinc-500')}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function PhoneSessionPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { state, status, error, send, phoneAnchorConnected } = useSessionSocket(id ?? null, { clientKind: 'phone' });

  const me = useMemo(
    () => state?.participants.find((participant) => participant.userId === user?.id) ?? null,
    [state?.participants, user?.id],
  );
  const isDirector = me?.role === 'director';
  const hero = useMemo(() => {
    if (!state) return null;
    return (
      state.entities.find((entity) => entity.id === me?.heroId) ??
      state.entities.find((entity) => entity.type === 'hero' && entity['ownerUserId'] === user?.id) ??
      null
    );
  }, [me?.heroId, state, user?.id]);
  const canMutate = status === 'connected' && phoneAnchorConnected === true;

  if (!state && phoneAnchorConnected === false) {
    return <LockedPhone message="Open this same live session on desktop, then reload or wait for this phone companion to reconnect." />;
  }

  if (!state) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-zinc-950 p-6 text-center text-zinc-400">
        {phoneAnchorConnected === null ? 'Checking desktop sync...' : error ?? 'Loading session...'}
      </main>
    );
  }

  return (
    <main className="flex h-[100svh] flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <StatusBanner status={status} anchored={phoneAnchorConnected} error={error} />
      {isDirector ? (
        <DirectorPhone state={state} send={send} canMutate={canMutate} />
      ) : (
        <PlayerPhone state={state} hero={hero} send={send} canMutate={canMutate} />
      )}
    </main>
  );
}
