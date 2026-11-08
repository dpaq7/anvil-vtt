import '../_shared/still.css';
import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { Swords } from 'lucide-react';
import { Roll, Stage, type Act } from '../../kit';
import { combat, heroes, scenes } from '../_shared/battle';
import { fixtureState, geoFor, type BattleState } from '../_shared/storyboard/data';
import { BattleMap } from '../_shared/storyboard/map';
import { story } from '../_shared/storyboard/mode-data';
import { Head, ModeLogList, OnlyYou, Tabs } from '../_shared/storyboard/modes';
import { DirectorList, DirectorRail, HeroList, LeftTabs } from '../_shared/storyboard/rails';
import { StatusBar } from '../_shared/storyboard/screens';
import { FilmStrip, RollBar, Shell, directorTools, type ModeKey } from '../_shared/storyboard/shell';
import { ReadAloudEditor, StoryScreen } from '../_shared/storyboard/story';
import { NpcHead } from '../_shared/storyboard/scene-art';
import '../_shared/storyboard/modes.css';
import './scene.css';

// The Director moves the table from a story beat back into the fight. The Battle board
// rises in the Film Strip, a title card crosses the screen, and while it holds, the rest of
// the shell turns over: the line under each hero rolls to their turn state, the lower rail
// becomes the Director's side, the right rail becomes Damage, the bar gains map tools. The
// card leaves on the map, and the round picks up where it stopped: Ilsabet is acting.
const g = geoFor(1440, 'director');
const REST = { x: 1010, y: 190 };
const fight = scenes.find((c) => c.key === 'battle')!;

type S = { strip: ModeKey; card: 'off' | 'in' | 'out'; screen: 'story' | 'battle'; shell: 'story' | 'battle'; live: boolean; wipe: 'off' | 'in' | 'out' };
const START: S = { strip: 'story', card: 'off', screen: 'story', shell: 'story', live: false, wipe: 'off' };
const PAYOFF: S = { strip: 'battle', card: 'off', screen: 'battle', shell: 'battle', live: true, wipe: 'off' };

async function script(a: Act<S>) {
  a.mark('open');
  await a.wait(1800);
  await a.click('board-battle');
  a.mark('strip');
  await a.set({ strip: 'battle' });
  await a.wait(260);
  a.mark('card');
  await a.set({ card: 'in' });
  await a.wait(620);
  // Under the card, the screen is now the map. Around it, the shell turns over in view.
  await a.snap({ screen: 'battle' });
  a.mark('shell');
  await a.set({ shell: 'battle' });
  const away = a.move({ x: 760, y: 620 }, { duration: 1100 });
  await a.wait(1300);
  a.mark('reveal');
  await a.set({ card: 'out' });
  await away;
  await a.wait(500);
  a.mark('payoff');
  await a.set({ live: true });
  await a.wait(3000);
  await a.set({ wipe: 'in' });
  await a.wait(520);
  a.place(REST);
  await a.snap({ ...START, wipe: 'in' });
  await a.set({ wipe: 'out' });
  await a.wait(520);
  await a.snap({ wipe: 'off' });
}

const text = (t: string) => <Roll>{t}</Roll>;

// Two layers in one place. The one in play sits on top and fades in over the other.
function Swap({ on, a, b, className = '', delay = 0 }: { on: boolean; a: ReactNode; b: ReactNode; className?: string; delay?: number }) {
  return (
    <div className={`sc-swap ${className}`} data-on={on || undefined} style={{ '--d': `${delay}ms` } as CSSProperties}>
      <div className="sc-layer" data-k="a" aria-hidden={on || undefined}>{a}</div>
      <div className="sc-layer" data-k="b" aria-hidden={!on || undefined}>{b}</div>
    </div>
  );
}

const heads = ['nun', 'ferryman', 'ringer'] as const;
function StoryLower() {
  return (
    <>
      <Head title="In this scene" note="3 people" />
      {story.npcs.map((n, i) => (
        <div key={n.name} className="md-npc" data-hidden={n.hidden || undefined}>
          <NpcHead kind={heads[i]} size={34} />
          <div className="sb-who"><strong>{n.name}</strong><small>{n.note}</small></div>
          {n.hidden && <OnlyYou>Hidden</OnlyYou>}
        </div>
      ))}
      <Head title="Director notes" note={<OnlyYou />} />
      <div className="md-notes">{story.directorNotes.map((p) => <p key={p}>{p}</p>)}</div>
    </>
  );
}

function Scene({ s }: { s: S }) {
  const battle = s.shell === 'battle';
  // The round was paused for the story beat. It comes back with the scene: Ilsabet acting, Dovrin done.
  const view = useMemo<BattleState>(() => (battle ? fixtureState(combat.activeEntityId, combat.actedThisRound) : fixtureState(null, [])), [battle]);
  return (
    <div className="sc" data-shell={s.shell} data-live={s.live || undefined}>
      <Shell g={g} role="director" mode={battle ? 'battle' : 'story'}
        top={<><div className="sb-word">Anvil</div><FilmStrip on={s.strip} /><button className="sb-endsession">End session…</button></>}
        left={
          <section className="sb-frame sb-rail" aria-label="Rail">
            <Swap on={battle} className="sc-tabs" a={<Tabs list={['Story', 'Heroes|7', 'NPCs|3', 'Log|24']} on="Story" />} b={<LeftTabs />} />
            <HeroList s={view} role="director" live={{ text }} note={<Roll>{battle ? `${view.acted.length} of ${heroes.length} acted` : '7 at the table'}</Roll>}
              sub={battle ? undefined : (h) => `${h.ancestry} ${h.heroClass}`} />
            <Swap on={battle} className="sc-lower" delay={240} a={<StoryLower />} b={<DirectorList s={view} role="director" size={1440} live={{}} />} />
          </section>
        }
        right={
          <Swap on={battle} className="sc-right" delay={380}
            a={<section className="sb-frame sb-rail" aria-label="Rail"><Tabs list={['Audio', 'Read-aloud', 'Assets']} on="Read-aloud" /><ReadAloudEditor /><ModeLogList log={story.log} show={10} /></section>}
            b={<DirectorRail s={view} size={1440} live={{}} target="Cicero" logShow={11} />} />
        }
        map={
          <div className="sc-screen" style={{ width: g.mapW, height: g.mapH }}>
            <BattleMap g={g} role="director" s={view} heroTag={{ first: 'Smoke', text: 'Smoke' }} />
            <div className="sc-story" data-on={s.screen === 'story' || undefined}><StoryScreen role="director" size={1440} w={g.mapW} h={g.mapH} /></div>
            <div className="sc-card" data-s={s.card} aria-hidden={s.card === 'off' || undefined}>
              <div className="sc-card__in"><i><Swords size={44} strokeWidth={2.6} /></i><strong>{fight.name}</strong><span>Battle</span></div>
            </div>
          </div>
        }
        bar={<Swap on={battle} className="sc-bar" delay={520} a={<RollBar size={1440} tools={['Smaller text', 'Larger text']} on="—" />} b={<RollBar size={1440} tools={directorTools} />} />}
        status={<StatusBar role="director" theme="light" />}
        wash={<div className="sc-wipe" data-s={s.wipe}><span>Anvil</span></div>}
      />
    </div>
  );
}

// The title card crossing the story screen, the Battle board already raised. The landing
// page uses it as this demo's still frame, so it does not repeat battle-turn-motion's.
export const TITLE_CARD: S = { strip: 'battle', card: 'in', screen: 'story', shell: 'story', live: false, wipe: 'off' };

export default function SceneChangeMotion({ poster = PAYOFF }: { poster?: S } = {}) {
  return (
    <Stage width={1440} height={900} theme="light" unframed className="look-anvil" initial={START} poster={poster} script={script} cursor={{ at: REST, idle: false }}>
      {(s) => <Scene s={s} />}
    </Stage>
  );
}

