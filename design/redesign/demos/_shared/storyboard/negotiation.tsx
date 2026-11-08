import { ChevronDown, Eye, EyeOff, Hourglass, MessageSquareQuote, Minus, Plus } from 'lucide-react';
import type { Theme } from '../../../kit';
import { geoFor } from './data';
import { negotiation as n, steps } from './mode-data';
import { Head, ModeBoard, ModeFrame, OnlyYou, themeFor, type ModeParts, type Role, type Size } from './modes';
import { MaudreyFace, NegotiationArt, NpcHead } from './scene-art';

type Secret = (typeof n.motivations)[number];

// The same secret, three ways. Revealed: anyone reads it. Hidden, Director: readable,
// marked like fog seen through, with Reveal beside it. Hidden, Player: solid ink, no words.
// The client knows who is looking, so this is a display choice, not a protocol change.
function SecretCard({ s, role, kind }: { s: Secret; role: Role; kind: 'motivation' | 'pitfall' }) {
  if (s.revealed) {
    return (
      <div className="md-secret" data-state="known">
        <div className="md-secret__h"><b>{s.type}</b>{role === 'director' && <span><Eye size={13} strokeWidth={2.6} />Players know</span>}</div>
        <p>{s.text}</p>
      </div>
    );
  }
  if (role === 'player') {
    return <div className="md-secret" data-state="dark"><EyeOff size={16} strokeWidth={2.6} /><span>A {kind} not found yet</span></div>;
  }
  return (
    <div className="md-secret" data-state="hidden">
      <div className="md-secret__h"><b>{s.type}</b><OnlyYou>Hidden from players</OnlyYou></div>
      <p>{s.text}</p>
      <button className="md-reveal">Reveal</button>
    </div>
  );
}

export function NegotiationScreen({ role, size, w, h }: { role: Role; size: Size; w: number; h: number }) {
  const big = size === 1440;
  return (
    <>
      <NegotiationArt w={w} h={h} />
      <div className="md-nego">
        <figure className="md-npccard">
          <div className="md-portrait"><MaudreyFace size={big ? 194 : 128} /></div>
          <figcaption><strong>{n.npc}</strong><small>{n.attitude}</small></figcaption>
        </figure>
        <div className="md-meters">
          <section className="md-plate md-interest">
            <div className="md-plate__h"><b>Interest</b><span>{n.interest} of 5. {steps[n.interest]}</span></div>
            <ol className="md-stairs">
              {steps.map((label, i) => (
                <li key={label} data-s={i < n.interest ? 'past' : i === n.interest ? 'now' : undefined}>
                  <i style={{ height: (big ? 26 : 20) + i * (big ? 14 : 10) }}>{i}</i>
                  <span>{label}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="md-plate md-patience">
            <div className="md-plate__h"><b>Patience</b><span>{n.patience} arguments left</span></div>
            <ol>{Array.from({ length: n.maxPatience }, (_, i) => <li key={i} data-on={i < n.patience || undefined} aria-label={i < n.patience ? 'Left' : 'Spent'}><Hourglass size={big ? 20 : 17} strokeWidth={2.6} /></li>)}</ol>
          </section>
        </div>
        <div className="md-secrets">
          <section><h4>Motivations</h4>{n.motivations.map((s) => <SecretCard key={s.id} s={s} role={role} kind="motivation" />)}</section>
          <section><h4>Pitfalls</h4>{n.pitfalls.map((s) => <SecretCard key={s.id} s={s} role={role} kind="pitfall" />)}</section>
        </div>
      </div>
    </>
  );
}

function Stepper({ label, value }: { label: string; value: string }) {
  return (
    <div className="md-step">
      <span>{label}</span>
      <button aria-label={`Lower ${label}`}><Minus size={14} strokeWidth={3} /></button>
      <b>{value}</b>
      <button aria-label={`Raise ${label}`}><Plus size={14} strokeWidth={3} /></button>
    </div>
  );
}

export function TalkTools() {
  return (
    <section className="sb-sec md-tools">
      <div className="md-tool__h"><b>Maudrey</b><span>Wary</span></div>
      <Stepper label="Interest" value={`${n.interest}`} />
      <Stepper label="Patience" value={`${n.patience}/${n.maxPatience}`} />
      <div className="md-tool__f"><span>{steps[n.interest]}</span><button className="sb-link">End negotiation…</button></div>
    </section>
  );
}

export function MakeArgument() {
  return (
    <section className="sb-sec md-act">
      <div className="md-tool__h"><b>Make an argument</b><span>3 left</span></div>
      <div className="sb-input"><span><small>Skill</small> Persuade</span><ChevronDown size={16} strokeWidth={3} /></div>
      <div className="md-say"><MessageSquareQuote size={16} strokeWidth={2.6} /><span>{n.approach}</span></div>
      <button className="md-go">Make argument</button>
    </section>
  );
}

export function negotiationParts(role: Role, size: Size, w: number, h: number): ModeParts {
  const dir = role === 'director';
  const big = size === 1440;
  const known = n.motivations.filter((s) => s.revealed);
  return {
    goal: n.goal, sub: `${n.npcFirst} is wary. Interest ${n.interest}, patience ${n.patience}.`,
    leftTabs: ['Negotiation', 'Heroes|7', 'NPCs|2', 'Log|23'], rightTabs: ['Audio', 'Target', 'Assets'], rightOn: 'Target',
    heroNote: '3 have argued', heroSub: (hh) => n.argued[hh.id] ?? 'Has not argued',
    lower: dir
      ? <>
        <Head title="Outcomes" note={<OnlyYou />} />
        <ol className="md-ladder">{n.outcomes.map((o, i) => <li key={i} data-now={i === n.interest || undefined}><b>{i}</b><span>{o}</span></li>).reverse()}</ol>
      </>
      : <>
        <Head title="Across the table" note="2 people" />
        {n.across.map((p, i) => (
          <div className="md-npc" key={p.name}>
            {i === 0 ? <MaudreyFace size={big ? 34 : 30} /> : <NpcHead kind="guard" size={big ? 34 : 30} />}
            <div className="sb-who"><strong>{p.name}</strong><small>{p.note}</small></div>
          </div>
        ))}
        <Head title="What you know" note="1 of 4 found" />
        <div className="md-outs">{known.map((s) => <div key={s.id}><b>{s.type}</b><span>{s.text}</span></div>)}</div>
      </>,
    tools: dir ? <TalkTools /> : <MakeArgument />,
    log: n.log, logShow: dir ? (big ? 9 : 6) : (big ? 9 : 3),
    screen: <NegotiationScreen role={role} size={size} w={w} h={h} />,
    bar: ['Smaller text', 'Larger text'],
  };
}

export function NegotiationStill({ role, size = 1440, lead = 'dark' }: { role: Role; size?: Size; lead?: Theme }) {
  const theme = themeFor(lead);
  const g = geoFor(size, role);
  return <ModeFrame size={size} theme={theme}><ModeBoard mode="negotiation" role={role} size={size} theme={theme} parts={negotiationParts(role, size, g.mapW, g.mapH)} /></ModeFrame>;
}
