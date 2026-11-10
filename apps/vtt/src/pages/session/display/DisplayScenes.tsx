import { Volume2 } from 'lucide-react';
import { BattleStage } from '../../../components/stages/BattleStage.js';
import { ScriptPage } from '../../../components/stages/StoryStage.js';
import { OUTCOME_LABEL } from '../../../components/stages/mode-helpers.js';
import { ModeScreen } from '../../../components/session/modes/ModeScreen.js';
import { modeLines, type NonBattleMode } from '../../../components/session/modes/mode-lines.js';
import { TokenFace } from '../../../components/session/battle/TokenFace.js';
import { filterVisibleEntities } from '../../../lib/fog-visibility.js';
import { firstName } from '../../../lib/faces.js';
import { getSceneBackgroundUrl } from '../../../lib/scene-backgrounds.js';
import { parseBattleData } from '../../../lib/scene-data.js';
import type { ClientMessage, SceneRef, SessionState } from '../../../types/protocol.js';
import { DisplayBoard, DisplayParty } from './DisplayParts.js';

const noop = () => {};
const noopSend = (_msg: ClientMessage) => {};
const RAIL = 440;
/** The screen is drawn at laptop geometry and scaled ×2, so a 13 px label lands at 26 px. */
const HALF_W = (1920 - RAIL) / 2;
const HALF_H = 1080 / 2;

/*
 * Every Display scene draws as the Player: the same fog helper, no Director data, no controls,
 * even when the window is signed in as the Director (DESIGN.md section 7).
 */

export function DisplayBattle({ scene, state }: { scene: SceneRef; state: SessionState }) {
  const battle = parseBattleData(scene.data ?? {});
  const visible = filterVisibleEntities(state.entities, battle.fogZones);
  const seen = new Set(visible.map((e) => e.id));
  const combat = state.combat;
  const heroes = (combat ? combat.heroEntities : visible.filter((e) => e.type === 'hero').map((e) => e.id)).flatMap((id) => visible.find((e) => e.id === id) ?? []);
  const acting = combat?.activeEntityId && seen.has(combat.activeEntityId) ? visible.find((e) => e.id === combat.activeEntityId) : undefined;
  const villains = combat ? combat.villainEntities.filter((id) => seen.has(id)) : [];
  const villainsActed = combat ? villains.filter((id) => combat.actedThisRound.includes(id)).length : 0;
  const heroesActed = combat ? heroes.filter((h) => combat.actedThisRound.includes(h.id)).length : 0;
  return (
    <div className="dp-app" data-mode="battle">
      <div className="dp-map" style={{ width: HALF_W * 2, height: HALF_H * 2 }}>
        <div className="dp-zoom" style={{ width: HALF_W, height: HALF_H }}>
          <BattleStage
            entities={visible}
            combat={combat}
            selectedEntityId={null}
            isDirector={false}
            cols={battle.cols}
            rows={battle.rows}
            cellSize={battle.cellSize}
            backgroundUrl={battle.backgroundUrl}
            drawings={battle.drawings}
            fogZones={battle.fogZones}
            terrain={battle.terrain}
            gridOpacity={battle.gridOpacity}
            gridColor={battle.gridColor}
            gridOffsetX={battle.gridOffsetX}
            gridOffsetY={battle.gridOffsetY}
            onSelectEntity={noop}
            send={noopSend}
            showDiceControls={false}
            display
            sceneKey={scene.id}
          />
        </div>
      </div>
      <aside className="dp-rail" aria-label="Turn">
        <DisplayBoard mode="battle" name={scene.name} />
        {combat ? (
          acting ? (
            <section className="dp-up">
              <i><TokenFace entity={acting} size={72} /></i>
              <div><small>Round {combat.round}. Up now</small><strong>{firstName(acting.name)}</strong></div>
            </section>
          ) : (
            <section className="dp-up dp-up--quiet">
              <div><small>Round {combat.round}</small><strong>{combat.activeSide === 'villains' ? 'Director' : 'Heroes pick'}</strong></div>
            </section>
          )
        ) : (
          <div className="dp-top"><b>Battle</b><span>Not started</span></div>
        )}
        <DisplayParty heroes={heroes} combat={combat} />
        {combat && (
          <div className="dp-foot">
            <span><b>Heroes</b> {heroesActed} of {heroes.length} acted</span>
            <span><b>Director</b> {villainsActed} of {villains.length} acted</span>
          </div>
        )}
      </aside>
    </div>
  );
}

export function DisplayStory({ scene, state }: { scene: SceneRef; state: SessionState }) {
  const data = scene.data ?? {};
  const url = getSceneBackgroundUrl(data, 'story', scene.order_index);
  const sound = state.audio?.playing ? state.audio.assetName : null;
  return (
    <div className="dp-app dp-app--story" data-mode="story">
      {url && <div className="md-art" style={{ backgroundImage: `url(${url})` }} aria-hidden="true" />}
      <DisplayBoard mode="story" name={scene.name} />
      {sound && <div className="dp-sound"><Volume2 size={30} strokeWidth={2.6} aria-hidden="true" />{sound}</div>}
      <ScriptPage text={(data['readAloud'] as string) ?? ''} slug={scene.name} className="dp-page" />
    </div>
  );
}

/** Derived (section 8): the mode's Player screen ×2 on the left, a 440 px rail with the party. */
export function DisplayMode({ mode, scene, state }: { mode: Exclude<NonBattleMode, 'story'>; scene: SceneRef; state: SessionState }) {
  const visible = filterVisibleEntities(state.entities, []);
  const heroes = visible.filter((e) => e.type === 'hero');
  const lines = modeLines(mode, heroes, state);
  const tested = heroes.filter((hero) => lines.subFor(hero) !== 'Not tested yet').length;
  const top = (() => {
    if (mode === 'montage') {
      const outcome = state.montage?.outcome;
      return outcome && outcome !== 'pending' ? { b: 'Montage over', s: OUTCOME_LABEL[outcome] ?? '' } : { b: `Tested ${tested} of ${heroes.length}`, s: `${state.montage?.successes ?? 0} successes` };
    }
    if (mode === 'negotiation') {
      const live = state.negotiation;
      return { b: `Interest ${live?.interest ?? '–'}`, s: `Patience ${live?.patience ?? '–'}` };
    }
    const acts = state.respite?.activities ?? [];
    return { b: `Done ${acts.filter((a) => a.completed).length} of ${acts.length}`, s: `Open ${acts.filter((a) => !a.completed && !a.claimedBy).length}` };
  })();
  return (
    <div className="dp-app" data-mode={mode}>
      <div className="dp-map" style={{ width: HALF_W * 2, height: HALF_H * 2 }}>
        <div className="dp-zoom" style={{ width: HALF_W, height: HALF_H }}>
          <ModeScreen mode={mode} scene={scene} state={state} isDirector={false} heroes={heroes} send={noopSend} bare />
        </div>
      </div>
      <aside className="dp-rail" aria-label="The table">
        <DisplayBoard mode={mode} name={scene.name} />
        <div className="dp-top"><b>{top.b}</b><span>{top.s}</span></div>
        <DisplayParty heroes={heroes} subFor={lines.subFor} />
      </aside>
    </div>
  );
}
