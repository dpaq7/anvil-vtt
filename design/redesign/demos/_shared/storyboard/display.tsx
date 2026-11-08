// The Display: the screen across the room, its own surface. Room-scale type, no tools,
// it opens on the action, and it keeps its own dark theme whatever the laptop is set
// to. It shows only what Players may see: it draws through the same role helpers as
// the Player's view, so a fogged monster cannot reach it.
import '../still.css';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import { useMemo } from 'react';
import { BookOpen, Check, Swords, Volume2 } from 'lucide-react';
import { Stage } from '../../../kit';
import { combat, heroes, scenes } from '../battle';
import { curOf, unitCount, type Geo } from './data';
import { BattleMap, HeroMark } from './map';
import { Meter } from './rails';
import { playerState } from './screens';
import { story } from './mode-data';
import { StoryArt } from './scene-art';
import './modes.css';
import './display.css';

export const DISPLAY = { w: 1920, h: 1080 };
// The Display never follows the laptop's theme. It is dark, for a lit screen in a dim room.
const THEME = 'dark' as const;
// The map is drawn at the laptop's geometry and enlarged as a whole, so tokens, labels
// and lines keep their proportions and every label is 26 px on the screen.
const ZOOM = 2;
const RAIL = 440;

function displayGeo(): Geo {
  const mapW = (DISPLAY.w - RAIL) / ZOOM;
  const mapH = DISPLAY.h / ZOOM;
  const cell = mapW / 17;
  const rows = mapH / cell;
  // Opens on the fight: the party at the foot, the creatures closing in above them.
  const first = 22 - rows;
  return {
    w: DISPLAY.w, h: DISPLAY.h, top: 0, bar: 0, status: 0, gap: 0, pad: 0, cell, mapW, mapH, first, rows,
    hero: Math.round(cell), foe: Math.round(cell * 0.87), boss: Math.round(cell * 1.9), nav: 0, row: 0, dying: 0, unit: 0,
  };
}

function Board({ mode }: { mode: 'battle' | 'story' }) {
  const s = scenes.find((c) => c.key === mode)!;
  const I = mode === 'battle' ? Swords : BookOpen;
  return (
    <div className="dp-board" data-mode={mode}>
      <i><I size={44} strokeWidth={2.6} /></i>
      <span><b>{mode === 'story' ? 'The drowned chapel' : s.name}</b><small>{s.mode}</small></span>
    </div>
  );
}

export function DisplayBattle() {
  const g = useMemo(displayGeo, []);
  const s = useMemo(playerState, []);
  const up = heroes.find((h) => h.id === s.activeId)!;
  return (
    <div className="dp-app" data-mode="battle">
      <div className="dp-map" style={{ width: g.mapW * ZOOM, height: g.mapH * ZOOM }}>
        <div style={{ width: g.mapW, height: g.mapH, transform: `scale(${ZOOM})`, transformOrigin: '0 0' }}>
          <BattleMap g={g} role="player" s={s} heroTag={{ first: up.first, text: up.first }} bare />
        </div>
      </div>
      <aside className="dp-rail" aria-label="Turn">
        <Board mode="battle" />
        <section className="dp-up">
          <i><HeroMark h={up} size={96} /></i>
          <div><small>Round {combat.round}. Up now</small><strong>{up.first}</strong></div>
        </section>
        <ol className="dp-party">
          {heroes.map((h) => {
            const done = s.acted.includes(h.id);
            const cur = curOf(s, h);
            if (h.state === 'dying') {
              return (
                <li key={h.id} className="dp-dying">
                  <div className="dp-plate">
                    <i><HeroMark h={h} out size={52} /></i>
                    <div className="dp-who"><strong>{h.first}</strong><b>Dying</b></div><span><b>{cur}/{h.max}</b></span>
                  </div>
                </li>
              );
            }
            return (
              <li key={h.id} data-on={h.id === up.id || undefined} data-done={done || undefined}>
                <i><HeroMark h={h} size={52} />{done && <em className="sb-badge sb-badge--done" data-on><Check size={14} strokeWidth={4} /></em>}</i>
                <div className="dp-who"><strong>{h.first}</strong>{h.state === 'winded' ? <em>Winded</em> : done ? <small>Done</small> : null}</div>
                <span><b>{cur}/{h.max}</b><Meter cur={cur} max={h.max} state={h.state} /></span>
              </li>
            );
          })}
        </ol>
        <div className="dp-foot"><span><b>Heroes</b> {s.acted.length} of {heroes.length} acted</span><span><b>Director</b> 0 of {unitCount('player')} acted</span></div>
      </aside>
    </div>
  );
}

export function DisplayStory() {
  return (
    <div className="dp-app dp-app--story" data-mode="story">
      <StoryArt w={DISPLAY.w} h={DISPLAY.h} />
      <Board mode="story" />
      <div className="dp-sound"><Volume2 size={30} strokeWidth={2.6} />{story.sound.name}</div>
      <article className="dp-page">
        <i className="md-holes" aria-hidden><u /><u /><u /></i>
        <h1 className="dp-slug">{story.slug}</h1>
        {story.readAloud.map((p) => <p key={p}>{p}</p>)}
      </article>
    </div>
  );
}

export function DisplayStill({ mode }: { mode: 'battle' | 'story' }) {
  return (
    <Stage width={DISPLAY.w} height={DISPLAY.h} theme={THEME} unframed className="look-anvil">
      {() => (mode === 'battle' ? <DisplayBattle /> : <DisplayStory />)}
    </Stage>
  );
}
