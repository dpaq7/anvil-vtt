import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, MessageSquareQuote } from 'lucide-react';
import { findSkillByName, skills } from '@anvil/data';
import type { NegotiationMotivationRuntime } from '../../stages/NegotiationStage.js';
import { interestStep, secretTypeLabel } from '../../stages/mode-helpers.js';
import { useSessionConnection } from '../shell/connection-context.js';
import { ConfirmLink } from './ConfirmLink.js';
import { Head, OnlyYou, Stepper } from './parts.js';

/** The Director's outcomes ladder, highest first, the current step lit (`negotiation-director`). */
export function OutcomeLadder({ outcomes, interest }: { outcomes: Record<number, string>; interest: number }) {
  const steps = [5, 4, 3, 2, 1, 0];
  return (
    <>
      <Head title="Outcomes" note={<OnlyYou />} />
      <ol className="md-ladder">
        {steps.map((i) => (
          <li key={i} data-now={i === interest || undefined}>
            <b>{i}</b>
            <span>{outcomes[i] || interestStep(i)}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

/** For a Player: who is across the table, and the secrets found so far (`negotiation-player`). */
export function WhatYouKnow({ npcName, attitude, secrets }: { npcName: string; attitude: string; secrets: NegotiationMotivationRuntime[] }) {
  const known = secrets.filter((s) => s.revealed);
  return (
    <>
      <Head title="Across the table" note="1 person" />
      <div className="md-npc">
        <span className="grid size-8 place-items-center font-display font-extrabold shadow-[0_0_0_1.5px_var(--art-ink)]" style={{ background: 'var(--color-scene-negotiation)', color: 'var(--color-on-scene-negotiation)' }} aria-hidden="true">
          {npcName.charAt(0)}
        </span>
        <div className="sb-who">
          <strong><span>{npcName}</span></strong>
          <small className="capitalize">{attitude}</small>
        </div>
      </div>
      <Head title="What you know" note={`${known.length} of ${secrets.length} found`} />
      <div className="md-outs">
        {known.length === 0 && <span className="text-[13px] text-text-soft">Nothing found yet. Arguments can uncover what moves them.</span>}
        {known.map((s) => (
          <div key={s.id}>
            <b>{secretTypeLabel(s.type)}</b>
            <span>{s.description}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/** The Director's Interest and Patience steppers and End negotiation… (`negotiation-director`). */
export function TalkTools({
  npcName,
  attitude,
  interest,
  patience,
  maxPatience,
  active,
  onInterest,
  onPatience,
  onEnd,
}: {
  npcName: string;
  attitude: string;
  interest: number;
  patience: number;
  maxPatience: number;
  active: boolean;
  onInterest: (delta: number) => void;
  onPatience: (delta: number) => void;
  onEnd: () => void;
}) {
  return (
    <section className="sb-sec md-tools">
      <div className="md-tool__h">
        <b>{npcName}</b>
        <span className="capitalize">{attitude}</span>
      </div>
      <Stepper label="Interest" value={interest} canLower={active && interest > 0} canRaise={active && interest < 5} onChange={onInterest} />
      <Stepper label="Patience" value={patience} of={maxPatience} canLower={active && patience > 0} canRaise={active && patience < maxPatience} onChange={onPatience} />
      <div className="md-tool__f">
        <span>{interestStep(interest)}</span>
        {active ? (
          <ConfirmLink label="End negotiation…" title="End this negotiation?" body={`It ends the talk at Interest ${interest}, ${interest >= 3 ? 'a deal' : 'no deal'}, for everyone.`} keep="Keep talking" confirm="End negotiation" onConfirm={onEnd} />
        ) : (
          <span>Ended</span>
        )}
      </div>
    </section>
  );
}

function resolveSkills(ids?: string[]) {
  if (!ids) return skills.filter((s) => s.group === 'interpersonal');
  const seen = new Set<string>();
  return ids.flatMap((id) => {
    const skill = findSkillByName(id);
    if (!skill || seen.has(skill.id)) return [];
    seen.add(skill.id);
    return [skill];
  });
}

/** The Player's main action, at the top of the right rail (`negotiation-player`). */
export function MakeArgument({ patience, active, availableSkillIds, onArgue }: { patience: number; active: boolean; availableSkillIds?: string[]; onArgue: (skillId: string, text: string) => void }) {
  const { paused } = useSessionConnection();
  const list = useMemo(() => resolveSkills(availableSkillIds), [availableSkillIds]);
  const [skillId, setSkillId] = useState('');
  const [text, setText] = useState('');
  useEffect(() => {
    if (skillId && !list.some((s) => s.id === skillId)) setSkillId('');
  }, [list, skillId]);
  const skill = list.find((s) => s.id === skillId);
  return (
    <section className="sb-sec md-act">
      <div className="md-tool__h">
        <b>Make an argument</b>
        <span>{active ? `${patience} left` : 'The talk is over'}</span>
      </div>
      <label className="sb-input">
        <span><small>Skill</small> {skill?.name ?? 'Choose a skill'}</span>
        <ChevronDown size={16} strokeWidth={3} aria-hidden="true" />
        <select aria-label="Skill" value={skillId} onChange={(e) => setSkillId(e.target.value)}>
          <option value="">Choose a skill</option>
          {list.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label className="md-say">
        <MessageSquareQuote size={16} strokeWidth={2.6} aria-hidden="true" />
        <textarea aria-label="What you say" rows={2} placeholder="What you say (optional)" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <button
        type="button"
        className="md-go"
        data-wait={paused || undefined}
        disabled={paused || !active || !skillId}
        onClick={() => {
          onArgue(skillId, text);
          setText('');
        }}
      >
        {paused ? 'Make argument, when back' : 'Make argument'}
      </button>
    </section>
  );
}
