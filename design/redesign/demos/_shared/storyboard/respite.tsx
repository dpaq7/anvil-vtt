import { Backpack, Bed, Check, Clock, Hammer, MessagesSquare, Plus, ScrollText } from 'lucide-react';
import type { Theme } from '../../../kit';
import { heroes } from '../battle';
import { geoFor } from './data';
import { HeroMark } from './map';
import { respite, type Activity } from './mode-data';
import { Head, ModeBoard, ModeFrame, Side, smoke, themeFor, type ModeParts, type Role, type Size } from './modes';
import { Meter } from './rails';
import { RespiteArt } from './scene-art';

const kindIcon = { Recover: Bed, Craft: Hammer, Research: ScrollText, Socialize: MessagesSquare, 'Change kit': Backpack };
const byId = (id?: string) => heroes.find((h) => h.id === id);
const done = respite.activities.filter((a) => a.done).length;
const open = respite.activities.filter((a) => !a.by);

// One ticket per activity. Done is stamped and greyed, working is solid, open is dashed
// and asks to be claimed. The hero's whole name is on it, wrapping rather than cut.
function Ticket({ a, role }: { a: Activity; role: Role }) {
  const I = kindIcon[a.kind];
  const who = byId(a.by);
  const mine = role === 'player' && a.by === smoke.id;
  const state = a.done ? 'done' : who ? 'working' : 'open';
  const action = role === 'director'
    ? (state === 'working' ? 'Complete' : null)
    : mine ? 'Complete' : state === 'open' ? 'Claim' : null;
  return (
    <section className="md-tk" data-state={state} data-mine={mine || undefined}>
      <div className="md-tk__h">
        <I size={16} strokeWidth={2.6} /><b>{a.kind}</b>
        {action
          ? <button className="md-tk__do" data-primary={mine || undefined}>{action}</button>
          : <em>{state === 'done' ? <><Check size={13} strokeWidth={3.5} />Done</> : state === 'working' ? <><Clock size={13} strokeWidth={2.8} />Working</> : 'Open'}</em>}
      </div>
      <p>{a.text}</p>
      {a.project && <div className="md-tk__p"><Meter cur={a.project[0]} max={a.project[1]} /><span>{a.project[0]} of {a.project[1]}</span></div>}
      <div className="md-tk__who">
        {who ? <><HeroMark h={who} size={28} /><span>{who.label}{mine && <small>you</small>}</span></> : <span className="md-tk__none">Nobody yet</span>}
      </div>
    </section>
  );
}

export function RespiteScreen({ role, w, h }: { role: Role; w: number; h: number }) {
  const band = Math.round(h * (w > 700 ? 0.27 : 0.24));
  return (
    <>
      <div className="md-band-art" style={{ height: band }}><RespiteArt w={w} h={band} /></div>
      <div className="md-plate md-place"><small>Respite at</small><strong>{respite.place}</strong></div>
      <Side items={[{ label: 'Done', value: `${done} of ${respite.activities.length}`, on: true }, { label: 'Open', value: `${open.length}` }]} />
      <div className="md-tks" style={{ top: band + (w > 700 ? 16 : 12) }}>{respite.activities.map((a) => <Ticket key={a.id} a={a} role={role} />)}</div>
    </>
  );
}

export function AddActivity() {
  return (
    <section className="sb-sec md-tools md-add">
      <div className="md-tool__h"><b>Add activity</b><span>For anyone to claim</span></div>
      {respite.kinds.map((k) => {
        const I = kindIcon[k.kind as keyof typeof kindIcon];
        return <div key={k.kind} className="md-add__r"><I size={16} strokeWidth={2.6} /><div><b>{k.kind}</b><small>{k.text}</small></div><button aria-label={`Add ${k.kind}`}><Plus size={14} strokeWidth={3} /></button></div>;
      })}
    </section>
  );
}

export function MyActivity() {
  const a = respite.activities.find((x) => x.by === smoke.id)!;
  const I = kindIcon[a.kind];
  return (
    <section className="sb-sec md-act">
      <div className="md-tool__h"><b>Your activity</b><span>Working</span></div>
      <div className="md-mine"><I size={20} strokeWidth={2.6} /><div><b>{a.kind}</b><small>{a.text}</small></div></div>
      <button className="md-go"><Check size={18} strokeWidth={3} />Complete</button>
    </section>
  );
}

export function respiteParts(role: Role, size: Size, w: number, h: number): ModeParts {
  const dir = role === 'director';
  const big = size === 1440;
  return {
    goal: respite.goal, sub: 'Pick one activity each. Done when you say so.',
    leftTabs: ['Respite', 'Heroes|7', 'NPCs|0', 'Log|24'], rightTabs: ['Audio', 'Activities', 'Assets'], rightOn: 'Activities',
    heroNote: `${done} of 7 done`,
    heroSub: (hh) => { const a = respite.activities.find((x) => x.by === hh.id); return a ? `${a.kind}, ${a.done ? 'done' : 'working'}` : 'No activity'; },
    lower: <>
      <Head title="Projects" note={`${respite.projects.length} going`} />
      <div className="md-projects">{respite.projects.map((p) => <div key={p.name}><div><b>{p.name}</b><span>{p.cur} of {p.goal}</span></div><small>{p.who}</small><Meter cur={p.cur} max={p.goal} /></div>)}</div>
      <Head title="Open activities" note={`${open.length} unclaimed`} />
      <div className="md-outs">{open.map((a) => <div key={a.id}><b>{a.kind}</b><span>{a.text}</span></div>)}</div>
    </>,
    tools: dir ? <AddActivity /> : <MyActivity />,
    log: respite.log, logShow: dir ? (big ? 10 : 3) : (big ? 9 : 3),
    screen: <RespiteScreen role={role} w={w} h={h} />,
    bar: ['All 9', 'Open 2', 'Done 3'], barOn: 'All 9',
  };
}

export function RespiteStill({ role, size = 1440, lead = 'light' }: { role: Role; size?: Size; lead?: Theme }) {
  const theme = themeFor(lead);
  const g = geoFor(size, role);
  return <ModeFrame size={size} theme={theme}><ModeBoard mode="respite" role={role} size={size} theme={theme} parts={respiteParts(role, size, g.mapW, g.mapH)} /></ModeFrame>;
}
