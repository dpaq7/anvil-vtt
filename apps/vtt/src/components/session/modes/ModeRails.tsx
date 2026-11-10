import { parseMontageData, parseNegotiationData, parseRespiteData } from '../../../lib/scene-data.js';
import type { ClientMessage, EntityData, SceneRef, SessionState } from '../../../types/protocol.js';
import { respiteTickets } from '../../stages/mode-helpers.js';
import { useSessionConnection } from '../shell/connection-context.js';
import { modeLines, playerOf, type NonBattleMode } from './mode-lines.js';
import { MakeTest, MontageOutcomesList, RecordTests } from './MontageRails.js';
import { MakeArgument, OutcomeLadder, TalkTools, WhatYouKnow } from './NegotiationRails.js';
import { ModeHeroList } from './parts.js';
import { ActivitiesTool, MyActivity, RespiteLower } from './RespiteRails.js';
import { DirectorNotes, PlayerSound, ReadAloudEditor, SceneNpcs } from './StoryRails.js';

export interface ModeRailProps {
  mode: NonBattleMode;
  scene: SceneRef;
  state: SessionState;
  isDirector: boolean;
  heroes: EntityData[];
  /** People in the scene this viewer may see. A Player's list comes through the fog helper. */
  npcs: EntityData[];
  hiddenIds?: Set<string>;
  ownHeroId?: string | null;
  currentUserId?: string;
  send: (msg: ClientMessage) => void;
  rounds?: boolean[];
  onToggleRound?: (index: number) => void;
  availableSkillIds?: string[];
  /** Montage, Director: heroes ticked as tested by hand, and the toggle. */
  montageMarks?: string[];
  onToggleMark?: (heroId: string) => void;
}

const notesOf = (data: Record<string, unknown>) => (typeof data['notes'] === 'string' ? (data['notes'] as string) : '');

/** The left rail below the tabs: the party with the mode's line, then the mode's lower sections (section 6). */
export function ModeLeft({ mode, scene, state, isDirector, heroes, npcs, hiddenIds, ownHeroId, montageMarks, onToggleMark }: ModeRailProps) {
  const data = scene.data ?? {};
  const marked = isDirector && mode === 'montage' && montageMarks ? new Set(montageMarks) : undefined;
  const lines = modeLines(mode, heroes, state, marked);
  const lower = (() => {
    switch (mode) {
      case 'story':
        return (
          <>
            <SceneNpcs npcs={npcs} hiddenIds={isDirector ? hiddenIds : undefined} isDirector={isDirector} />
            {isDirector ? <DirectorNotes notes={notesOf(data)} /> : <PlayerSound audio={state.audio} />}
          </>
        );
      case 'montage':
        return isDirector ? <DirectorNotes title="Hazards" notes={notesOf(data)} /> : <MontageOutcomesList outcomes={parseMontageData(data)} />;
      case 'negotiation': {
        const neg = parseNegotiationData(data);
        const live = state.negotiation;
        return isDirector ? (
          <OutcomeLadder outcomes={neg.outcomes} interest={live?.interest ?? neg.interest} />
        ) : (
          <WhatYouKnow npcName={neg.npcName} attitude={neg.npcAttitude} secrets={[...(live?.motivations ?? neg.motivations), ...(live?.pitfalls ?? neg.pitfalls)]} />
        );
      }
      case 'respite': {
        const respite = parseRespiteData(data);
        return <RespiteLower projects={respite.projects} activities={respiteTickets(state.respite?.activities, respite.activities)} />;
      }
    }
  })();
  return (
    <div className="sb-tracker">
      <ModeHeroList heroes={heroes} note={lines.note} subFor={lines.subFor} ownHeroId={ownHeroId} marks={marked && onToggleMark ? { checked: marked, onToggle: onToggleMark } : undefined} />
      <div className="md-lower">{lower}</div>
    </div>
  );
}

/** The top of the right rail: the Director's mode tools, or the Player's main action (section 6). */
export function ModeTools({ mode, scene, state, isDirector, heroes, ownHeroId, currentUserId, send, rounds = [], onToggleRound, availableSkillIds }: ModeRailProps) {
  const { paused } = useSessionConnection();
  const act = (msg: ClientMessage) => {
    if (!paused) send(msg);
  };
  const data = scene.data ?? {};
  switch (mode) {
    case 'story':
      return isDirector ? <ReadAloudEditor text={(data['readAloud'] as string) ?? ''} onUpdate={(readAloudText) => act({ type: 'story_update', readAloudText })} /> : null;
    case 'montage': {
      const montage = parseMontageData(data);
      const live = state.montage;
      const ended = Boolean(live?.outcome && live.outcome !== 'pending');
      if (isDirector) {
        return (
          <RecordTests
            successes={live?.successes ?? 0}
            successLimit={live?.successLimit ?? montage.successLimit}
            failures={live?.failures ?? 0}
            failureLimit={live?.failureLimit ?? montage.failureLimit}
            roundLimit={montage.roundLimit}
            rounds={rounds}
            outcomes={montage}
            onToggleRound={(i) => onToggleRound?.(i)}
            onAdjustSuccesses={(delta) => act({ type: 'montage_adjust_successes', delta })}
            onAdjustFailures={(delta) => act({ type: 'montage_adjust_failures', delta })}
            onReset={() => act({ type: 'montage_reset' })}
          />
        );
      }
      const own = heroes.find((hero) => hero.id === ownHeroId);
      const line = own ? modeLines('montage', heroes, state).subFor(own) : null;
      return <MakeTest tested={line && line !== 'Not tested yet' ? `You rolled ${line}` : null} ended={ended} onRoll={(skillId, characteristicId) => act({ type: 'montage_roll', skillId, characteristicId })} />;
    }
    case 'negotiation': {
      const neg = parseNegotiationData(data);
      const live = state.negotiation;
      const interest = live?.interest ?? neg.interest;
      const patience = live?.patience ?? neg.patience;
      const active = (live?.phase ?? neg.phase) === 'active';
      if (isDirector) {
        return (
          <TalkTools
            npcName={neg.npcName}
            attitude={neg.npcAttitude}
            interest={interest}
            patience={patience}
            maxPatience={live?.maxPatience ?? neg.maxPatience}
            active={active}
            onInterest={(delta) => act({ type: 'negotiation_adjust_interest', delta })}
            onPatience={(delta) => act({ type: 'negotiation_adjust_patience', delta })}
            onEnd={() => act({ type: 'negotiation_end', phase: interest >= 3 ? 'success' : 'failure' })}
          />
        );
      }
      return <MakeArgument patience={patience} active={active} availableSkillIds={availableSkillIds} onArgue={(skillId, approachText) => act({ type: 'negotiation_argument', skillId, approachText })} />;
    }
    case 'respite': {
      const activities = respiteTickets(state.respite?.activities, parseRespiteData(data).activities);
      const live = Boolean(state.respite?.activities.length);
      if (isDirector) return <ActivitiesTool activities={live ? activities : []} onComplete={(activityId) => act({ type: 'respite_complete_activity', activityId })} />;
      const own = heroes.find((hero) => hero.id === ownHeroId);
      const user = currentUserId ?? (own ? playerOf(own, state.participants) : null);
      const mine = live ? activities.find((a) => a.claimedBy === user) : undefined;
      return <MyActivity activity={mine} onComplete={(activityId) => act({ type: 'respite_complete_activity', activityId })} />;
    }
  }
}
