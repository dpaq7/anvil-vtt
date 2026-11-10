import { parseMontageData, parseNegotiationData, parseRespiteData } from '../../../lib/scene-data.js';
import { getSceneBackgroundUrl } from '../../../lib/scene-backgrounds.js';
import type { ClientMessage, EntityData, SceneRef, SessionState } from '../../../types/protocol.js';
import { MontageStage } from '../../stages/MontageStage.js';
import { NegotiationStage } from '../../stages/NegotiationStage.js';
import { RespiteStage } from '../../stages/RespiteStage.js';
import type { RespiteFilter } from '../../stages/mode-helpers.js';
import { SceneBackdrop } from '../../stages/SceneBackdrop.js';
import { StoryStage } from '../../stages/StoryStage.js';
import { useSessionConnection } from '../shell/connection-context.js';
import { modeLines, playerOf, type NonBattleMode } from './mode-lines.js';

export interface ModeScreenProps {
  mode: NonBattleMode;
  scene: SceneRef;
  state: SessionState;
  isDirector: boolean;
  /** The heroes at the table, for counts and faces. */
  heroes: EntityData[];
  send: (msg: ClientMessage) => void;
  currentUserId?: string;
  directorName?: string | null;
  rounds?: boolean[];
  filter?: RespiteFilter;
  /** Montage, Director: heroes ticked as tested by hand (counts in the corner tracker). */
  montageMarks?: string[];
  /** The Display: no corner tracker and no actions (it draws its own rail). */
  bare?: boolean;
}

/**
 * A non-Battle mode's screen for any viewer. A Player or the Display gets the Player's form: the
 * same data, with every secret drawn as ink and no Director tool. Sends wait during a drop.
 */
export function ModeScreen({ mode, scene, state, isDirector, heroes, send, currentUserId, directorName, rounds, filter, montageMarks, bare = false }: ModeScreenProps) {
  const { paused } = useSessionConnection();
  const act = (msg: ClientMessage) => {
    if (!paused) send(msg);
  };
  const data = scene.data ?? {};
  const backgroundUrl = getSceneBackgroundUrl(data, mode, scene.order_index);

  const body = (() => {
    switch (mode) {
      case 'story':
        return (
          <StoryStage
            readAloudText={(data['readAloud'] as string) ?? ''}
            isDirector={isDirector}
            slug={scene.name}
            directorName={directorName}
            bare={bare}
          />
        );
      case 'montage': {
        const montage = parseMontageData(data);
        const live = state.montage;
        const lines = modeLines('montage', heroes, state, isDirector && montageMarks ? new Set(montageMarks) : undefined);
        const tested = heroes.filter((hero) => lines.subFor(hero) !== 'Not tested yet').length;
        return (
          <MontageStage
            goal={montage.goal}
            roundLimit={montage.roundLimit}
            heroCount={heroes.length || montage.heroCount}
            currentSuccesses={live?.successes ?? 0}
            successLimit={live?.successLimit ?? montage.successLimit}
            currentFailures={live?.failures ?? 0}
            failureLimit={live?.failureLimit ?? montage.failureLimit}
            outcome={live?.outcome ?? 'pending'}
            challenges={montage.challenges}
            isDirector={isDirector}
            testLog={live?.testLog}
            roundsCompleted={isDirector ? rounds ?? [] : undefined}
            tested={{ n: tested, of: heroes.length }}
            bare={bare}
          />
        );
      }
      case 'negotiation': {
        const neg = parseNegotiationData(data);
        const live = state.negotiation;
        return (
          <NegotiationStage
            npcName={neg.npcName}
            npcPortrait={neg.npcPortrait}
            npcAttitude={neg.npcAttitude}
            interest={live?.interest ?? neg.interest}
            patience={live?.patience ?? neg.patience}
            maxPatience={live?.maxPatience ?? neg.maxPatience}
            phase={live?.phase ?? neg.phase}
            motivations={live?.motivations ?? neg.motivations}
            pitfalls={live?.pitfalls ?? neg.pitfalls}
            outcomes={neg.outcomes}
            isDirector={isDirector}
            onRevealMotivation={isDirector && !bare ? (id) => act({ type: 'negotiation_reveal_motivation', id }) : undefined}
            onRevealPitfall={isDirector && !bare ? (id) => act({ type: 'negotiation_reveal_pitfall', id }) : undefined}
          />
        );
      }
      case 'respite': {
        const respite = parseRespiteData(data);
        const live = state.respite;
        const heroFor = (userId: string) => heroes.find((hero) => playerOf(hero, state.participants) === userId);
        return (
          <RespiteStage
            location={respite.location}
            activities={respite.activities}
            liveActivities={live?.activities}
            projects={respite.projects}
            completed={live ? live.activities.length > 0 && live.activities.every((a) => a.completed) : false}
            isDirector={isDirector}
            currentUserId={currentUserId}
            filter={filter}
            heroFor={heroFor}
            bare={bare}
            onClaimActivity={!isDirector && !bare ? (activityId) => act({ type: 'respite_choose_activity', activityId }) : undefined}
            onCompleteActivity={!bare ? (activityId) => act({ type: 'respite_complete_activity', activityId }) : undefined}
          />
        );
      }
    }
  })();

  return (
    <SceneBackdrop backgroundUrl={backgroundUrl} mode={mode}>
      {body}
    </SceneBackdrop>
  );
}
