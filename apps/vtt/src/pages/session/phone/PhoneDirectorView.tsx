import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookOpen, ListOrdered, Music, ScrollText } from 'lucide-react';
import { CombatTracker } from '../../../components/session/CombatTracker.js';
import { SceneAudioPanel } from '../../../components/session/SceneAudioPanel.js';
import { ModeIcon } from '../../../components/session/FilmStrip.js';
import { OnlyYou } from '../../../components/session/modes/parts.js';
import { SecretCard } from '../../../components/stages/NegotiationStage.js';
import { interestStep, paragraphs } from '../../../components/stages/mode-helpers.js';
import { useAssetsStore } from '../../../stores/assetsStore.js';
import { firstName } from '../../../lib/faces.js';
import { hiddenEntities } from '../../../lib/fog-visibility.js';
import { parseBattleData, parseMontageData, parseNegotiationData } from '../../../lib/scene-data.js';
import { sceneTypeOf } from '../../../lib/scene-mode.js';
import type { ClientMessage, SessionState } from '../../../types/protocol.js';
import { PhoneButton } from './phone-shared.js';
import { PhoneNotes } from './PhoneNotes.js';
import { PhoneApp, PhoneDock, PhoneDropStrip, PhoneTabBar, PhoneTop } from './PhoneFrame.js';
import { PhoneDirectorBattle } from './PhoneBattle.js';
import { PhoneNpc, PhoneStep } from './PhoneModes.js';

type DirectorTab = 'live' | 'initiative' | 'audio' | 'notes';

const DIRECTOR_TABS = [
  { id: 'live', Icon: ScrollText, label: 'Live' },
  { id: 'initiative', Icon: ListOrdered, label: 'Initiative' },
  { id: 'audio', Icon: Music, label: 'Audio' },
  { id: 'notes', Icon: BookOpen, label: 'Notes' },
] as const;

/** The Director's phone (demos phone-director, phone-director-negotiation). Every send waits on canMutate. */
export function PhoneDirectorView({ state, send, canMutate, waiting }: { state: SessionState; send: (msg: ClientMessage) => void; canMutate: boolean; waiting: boolean }) {
  const [tab, setTab] = useState<DirectorTab>('live');
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const scene = state.scenes.find((item) => item.id === state.activeSceneId) ?? null;
  const mode = scene ? sceneTypeOf(scene) : null;
  const data = useMemo(() => scene?.data ?? {}, [scene?.data]);
  const combat = state.combat;
  const act = (msg: ClientMessage) => {
    if (canMutate) send(msg);
  };
  const hiddenIds = useMemo(
    () => new Set(hiddenEntities(state.entities, mode === 'battle' ? parseBattleData(data).fogZones : []).map((e) => e.id)),
    [data, mode, state.entities],
  );

  const audioAssets = useAssetsStore((s) => s.audioAssets);
  const loadAudio = useAssetsStore((s) => s.loadAudio);
  useEffect(() => {
    if (tab === 'audio' && state.campaignId) void loadAudio(state.campaignId);
  }, [loadAudio, state.campaignId, tab]);
  const handleAudioChange = useCallback(
    (newAudioId: string | null) => {
      if (!canMutate) return;
      setActiveAudioId(newAudioId);
      if (newAudioId) {
        const asset = audioAssets.find((a) => a.id === newAudioId);
        const url = asset?.audioUrl ?? (asset?.assetId ? `/api/assets/${asset.assetId}/data` : undefined);
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

  const heroes = state.entities.filter((e) => e.type === 'hero');
  const villains = state.entities.filter((e) => e.type === 'monster' || e.type === 'npc');
  const startCombat = () => {
    if (heroes.length === 0 || villains.length === 0) {
      toast.error('Need at least one hero and one villain to start combat.');
      return;
    }
    act({ type: 'combat_action', action: { type: 'START_COMBAT', heroEntityIds: heroes.map((e) => e.id), villainEntityIds: villains.map((e) => e.id) } });
  };

  const neg = mode === 'negotiation' ? parseNegotiationData(data) : null;
  const liveNeg = state.negotiation;
  const montage = mode === 'montage' ? parseMontageData(data) : null;
  const acting = combat?.activeEntityId ? state.entities.find((e) => e.id === combat.activeEntityId) : undefined;

  const live = (() => {
    if (!scene) return <p className="ph-sec ph-text">No active scene.</p>;
    if (mode === 'battle' && combat) return null;
    if (neg) {
      const motivations = liveNeg?.motivations ?? neg.motivations;
      const pitfalls = liveNeg?.pitfalls ?? neg.pitfalls;
      const reveal = (kind: 'motivation' | 'pitfall', id: string) =>
        canMutate ? () => act(kind === 'motivation' ? { type: 'negotiation_reveal_motivation', id } : { type: 'negotiation_reveal_pitfall', id }) : undefined;
      return (
        <>
          <PhoneNpc name={neg.npcName} attitude={neg.npcAttitude} portrait={neg.npcPortrait} />
          <section className="ph-sec ph-secrets">
            <div className="ph-h"><b>Motivations</b><span>{motivations.filter((s) => s.revealed).length} of {motivations.length} known</span></div>
            {motivations.map((s) => <SecretCard key={s.id} secret={s} isDirector kind="motivation" onReveal={reveal('motivation', s.id)} />)}
            <div className="ph-h"><b>Pitfalls</b><span>{pitfalls.filter((s) => s.revealed).length} of {pitfalls.length} known</span></div>
            {pitfalls.map((s) => <SecretCard key={s.id} secret={s} isDirector kind="pitfall" onReveal={reveal('pitfall', s.id)} />)}
          </section>
        </>
      );
    }
    if (montage) {
      return (
        <section className="ph-sec">
          <div className="ph-h"><b>Goal</b><span>{montage.roundLimit} rounds</span></div>
          <p className="ph-text">{montage.goal || scene.name}</p>
        </section>
      );
    }
    if (mode === 'respite') {
      return (
        <section className="ph-sec">
          <div className="ph-h"><b>Activities</b><span>{(state.respite?.activities ?? []).filter((a) => !a.completed).length} going</span></div>
          {(state.respite?.activities ?? []).map((a, i) => (
            <div key={`${a.activityId}-${i}`} className="flex items-center justify-between gap-3">
              <div className="min-w-0"><b className="block">{a.name}</b><small className="text-[13px] text-text-soft">{a.completed ? 'Done' : a.claimedByName ? `${a.claimedByName}, working` : 'Open'}</small></div>
              {!a.completed && <PhoneButton disabled={!canMutate} onClick={() => act({ type: 'respite_complete_activity', activityId: a.activityId })}>Complete</PhoneButton>}
            </div>
          ))}
        </section>
      );
    }
    if (mode === 'story') {
      const notes = typeof data['notes'] === 'string' ? (data['notes'] as string) : '';
      return (
        <>
          <section className="ph-sec"><div className="ph-h"><b>Read-aloud</b><span>Players see this page</span></div>{paragraphs(String(data['readAloud'] ?? '')).map((p, i) => <p key={i} className="ph-text">{p}</p>)}</section>
          <section className="ph-sec"><div className="ph-h"><b>Director notes</b><OnlyYou /></div>{paragraphs(notes).map((p, i) => <p key={i} className="ph-text">{p}</p>)}</section>
        </>
      );
    }
    return <section className="ph-sec"><div className="ph-h"><b>{scene.name}</b><span>{heroes.length} heroes, {villains.length} creatures</span></div></section>;
  })();

  const dock = (() => {
    if (tab !== 'live') return null;
    if (mode === 'battle') {
      if (!combat) return <PhoneDock label="Draw Steel!" waiting={waiting} disabled={!canMutate} onClick={startCombat} />;
      if (acting) return <PhoneDock label={`End ${firstName(acting.name)}’s turn`} waiting={waiting} disabled={!canMutate} onClick={() => act({ type: 'combat_action', action: { type: 'END_TURN' } })} />;
      return null;
    }
    if (neg && (liveNeg?.phase ?? neg.phase) === 'active') {
      const interest = liveNeg?.interest ?? neg.interest;
      const patience = liveNeg?.patience ?? neg.patience;
      const max = liveNeg?.maxPatience ?? neg.maxPatience;
      return (
        <div className="ph-dock ph-dock--steps">
          <PhoneStep label="Interest" value={`${interest}`} note={interestStep(interest)} disabled={!canMutate} canLower={interest > 0} canRaise={interest < 5} onChange={(delta) => act({ type: 'negotiation_adjust_interest', delta })} />
          <PhoneStep label="Patience" value={`${patience}/${max}`} note={`${patience} arguments left`} disabled={!canMutate} canLower={patience > 0} canRaise={patience < max} onChange={(delta) => act({ type: 'negotiation_adjust_patience', delta })} />
        </div>
      );
    }
    if (montage) {
      const s = state.montage?.successes ?? 0;
      const f = state.montage?.failures ?? 0;
      const sl = state.montage?.successLimit ?? montage.successLimit;
      const fl = state.montage?.failureLimit ?? montage.failureLimit;
      return (
        <div className="ph-dock ph-dock--steps">
          <PhoneStep label="Successes" value={`${s}/${sl}`} note="Record a test" disabled={!canMutate} canLower={s > 0} canRaise={s < sl} onChange={(delta) => act({ type: 'montage_adjust_successes', delta })} />
          <PhoneStep label="Failures" value={`${f}/${fl}`} note="Record a test" disabled={!canMutate} canLower={f > 0} canRaise={f < fl} onChange={(delta) => act({ type: 'montage_adjust_failures', delta })} />
        </div>
      );
    }
    return null;
  })();

  return (
    <PhoneApp role="director" scene={scene}>
      <PhoneTop scene={scene} />
      {tab === 'live' && mode === 'battle' && combat ? (
        <PhoneDirectorBattle combat={combat} entities={state.entities} hiddenIds={hiddenIds} canMutate={canMutate} onMalice={(delta) => act({ type: 'combat_action', action: { type: 'ADJUST_MALICE', delta } })} />
      ) : (
        <div className="ph-body">
          {waiting && <PhoneDropStrip />}
          {tab === 'live' && (
            <>
              {live}
              <nav className="ph-sec ph-nav" aria-label="Scenes">
                <div className="ph-h"><b>Scenes</b><span>Tap to switch</span></div>
                {state.scenes.map((item) => (
                  <button key={item.id} type="button" data-mode={sceneTypeOf(item)} aria-current={item.id === state.activeSceneId ? 'step' : undefined} disabled={!canMutate || item.id === state.activeSceneId} onClick={() => act({ type: 'switch_scene', sceneId: item.id })}>
                    <i className="sb-board" data-mode={sceneTypeOf(item)} style={{ border: 0, flex: 'none' }}><ModeIcon type={sceneTypeOf(item)} size={16} /></i>
                    <span>{item.name}</span>
                  </button>
                ))}
              </nav>
            </>
          )}
          {tab === 'initiative' && (
            <div className="flex min-h-0 flex-1 flex-col">
              {combat ? (
                <CombatTracker
                  combat={combat}
                  entities={state.entities}
                  isDirector
                  currentHeroEntityId={null}
                  hiddenIds={hiddenIds}
                  onSelectTurn={(entityId) => act({ type: 'combat_action', action: { type: 'SELECT_TURN', entityId } })}
                  onEndTurn={() => act({ type: 'combat_action', action: { type: 'END_TURN' } })}
                  onEndCombat={() => act({ type: 'combat_action', action: { type: 'END_COMBAT' } })}
                  onAdjustMalice={(delta) => act({ type: 'combat_action', action: { type: 'ADJUST_MALICE', delta } })}
                />
              ) : (
                <section className="ph-sec"><p className="ph-text">Combat has not started.</p>{mode === 'battle' && <PhoneButton disabled={!canMutate} onClick={startCombat}>Start combat</PhoneButton>}</section>
              )}
            </div>
          )}
          {tab === 'audio' && (
            <section className="ph-sec">
              <SceneAudioPanel campaignId={state.campaignId} audioId={activeAudioId} onAudioChange={handleAudioChange} label="Now Playing" />
              {state.audio?.assetName && <p className="ph-text">Playing for the table: <b>{state.audio.assetName}</b>{state.audio.playing ? '' : ' (paused)'}</p>}
            </section>
          )}
          {tab === 'notes' && <PhoneNotes campaignId={state.campaignId} disabled={!canMutate} />}
        </div>
      )}
      {dock}
      <PhoneTabBar tabs={DIRECTOR_TABS} active={tab} onSelect={setTab} />
    </PhoneApp>
  );
}
