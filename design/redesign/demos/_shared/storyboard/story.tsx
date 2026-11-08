import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import { AudioLines, Eye, Volume2 } from 'lucide-react';
import type { Theme } from '../../../kit';
import { geoFor } from './data';
import { story } from './mode-data';
import { Head, ModeBoard, ModeFrame, OnlyYou, Side, themeFor, type ModeParts, type Role, type Size } from './modes';
import { Meter } from './rails';
import { NpcHead, StoryArt } from './scene-art';

const heads = ['nun', 'ferryman', 'ringer'] as const;

function NpcRow({ i, big }: { i: number; big: boolean }) {
  const n = story.npcs[i];
  return (
    <div className="md-npc" data-hidden={n.hidden || undefined}>
      <NpcHead kind={heads[i]} size={big ? 34 : 30} />
      <div className="sb-who"><strong>{n.name}</strong><small>{n.note}</small></div>
      {n.hidden && <OnlyYou>Hidden</OnlyYou>}
    </div>
  );
}

// The read-aloud is set like a page of script: bound at the left, a scene heading, then
// the lines to read, large, for the Director's voice and the Players' eyes.
export function ScriptPage({ size }: { size: Size }) {
  return (
    <article className="md-page" data-size={size}>
      <i className="md-holes" aria-hidden><u /><u /><u /></i>
      <h3 className="md-slug">{story.slug}</h3>
      {story.readAloud.map((p) => <p key={p}>{p}</p>)}
    </article>
  );
}

export function StoryScreen({ role, size, w, h }: { role: Role; size: Size; w: number; h: number }) {
  return (
    <>
      <StoryArt w={w} h={h} />
      <Side items={role === 'director'
        ? [{ label: <><Eye size={15} strokeWidth={2.6} />Players see this page</> }]
        : [{ label: <><Volume2 size={15} strokeWidth={2.6} />Read by Dev Director</> }]} />
      <ScriptPage size={size} />
    </>
  );
}

export function ReadAloudEditor() {
  return (
    <section className="sb-sec md-edit">
      <div className="md-tool__h"><b>Read-aloud</b><span>No changes<button className="md-btn" disabled>Update</button></span></div>
      <div className="md-textarea">{story.readAloud.map((p) => <p key={p}>{p}</p>)}</div>
    </section>
  );
}

export function storyParts(role: Role, size: Size, w: number, h: number): ModeParts {
  const dir = role === 'director';
  const big = size === 1440;
  const shown = story.npcs.map((n, i) => ({ n, i })).filter(({ n }) => dir || !n.hidden);
  return {
    goal: 'The drowned chapel', sub: 'Dev Director is reading aloud. Listen.',
    leftTabs: ['Story', 'Heroes|7', 'NPCs|3', 'Log|24'], rightTabs: ['Audio', 'Read-aloud', 'Assets'], rightOn: 'Read-aloud',
    heroNote: '7 at the table', heroSub: (hh) => `${hh.ancestry} ${hh.heroClass}`,
    lower: <>
      <Head title="In this scene" note={`${shown.length} people`} />
      {shown.map(({ i }) => <NpcRow key={i} i={i} big={big} />)}
      {!dir && <>
        <Head title="Sound" note="From the Director" />
        <div className="md-sound">
          <AudioLines size={20} strokeWidth={2.6} />
          <div><b>{story.sound.name}</b><small>{story.sound.kind}</small></div>
          <span>Your volume</span><Meter cur={6} max={10} />
        </div>
      </>}
      {dir && <>
        <Head title="Director notes" note={<OnlyYou />} />
        <div className="md-notes">{story.directorNotes.map((p) => <p key={p}>{p}</p>)}</div>
      </>}
    </>,
    tools: dir ? <ReadAloudEditor /> : null,
    log: story.log, logShow: dir ? (big ? 10 : 4) : (big ? 13 : 6),
    screen: <StoryScreen role={role} size={size} w={w} h={h} />,
    bar: ['Smaller text', 'Larger text'],
  };
}

export function StoryStill({ role, size = 1440, lead = 'dark' }: { role: Role; size?: Size; lead?: Theme }) {
  const theme = themeFor(lead);
  return <ModeFrame size={size} theme={theme}><Board role={role} size={size} theme={theme} /></ModeFrame>;
}

function Board({ role, size, theme }: { role: Role; size: Size; theme: Theme }) {
  const g = geoFor(size, role);
  return <ModeBoard mode="story" role={role} size={size} theme={theme} parts={storyParts(role, size, g.mapW, g.mapH)} />;
}
