import { ChevronDown, EyeOff, Hourglass, MessageSquareQuote, Minus, Plus } from 'lucide-react';
import { findSkillByName, skills } from '@anvil/data';
import { SecretCard } from '../../../components/stages/NegotiationStage.js';
import { interestStep } from '../../../components/stages/mode-helpers.js';
import type { NegotiationStageData } from '../../../lib/scene-data.js';
import type { NegotiationLiveState } from '../../../types/protocol.js';

/* Negotiation and the Director's mode tools on the phone (demos phone-*-negotiation). */

export function PhoneNpc({ name, attitude, portrait }: { name: string; attitude: string; portrait?: string }) {
  return (
    <section className="ph-npc">
      <i>{portrait ? <img src={portrait} alt="" className="size-full object-cover" /> : <b>{name.charAt(0)}</b>}</i>
      <div><strong>{name}</strong><small className="capitalize">{attitude}</small></div>
    </section>
  );
}

export function PhoneInterest({ interest }: { interest: number }) {
  return (
    <section className="ph-sec ph-interest">
      <div className="ph-h"><b>Interest</b><span>{interest} of 5. {interestStep(interest)}</span></div>
      <ol className="md-stairs">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <li key={i} data-s={i < interest ? 'past' : i === interest ? 'now' : undefined}><i style={{ height: 26 + i * 4 }}>{i}</i></li>
        ))}
      </ol>
    </section>
  );
}

/** A Player's phone shows only found secrets, and one ink card counting the rest, no words. */
export function PhoneWhatYouKnow({ neg, live }: { neg: NegotiationStageData; live: NegotiationLiveState | null }) {
  const motivations = live?.motivations ?? neg.motivations;
  const pitfalls = live?.pitfalls ?? neg.pitfalls;
  const all = [...motivations, ...pitfalls];
  const known = all.filter((s) => s.revealed);
  const hiddenM = motivations.filter((s) => !s.revealed).length;
  const hiddenP = pitfalls.filter((s) => !s.revealed).length;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  return (
    <section className="ph-sec ph-know">
      <div className="ph-h"><b>What you know</b><span>{known.length} of {all.length} found</span></div>
      {known.map((s) => (
        <SecretCard key={s.id} secret={s} isDirector={false} kind={motivations.includes(s) ? 'motivation' : 'pitfall'} />
      ))}
      {hiddenM + hiddenP > 0 && (
        <div className="md-secret ph-dark" data-state="dark">
          <EyeOff size={16} strokeWidth={2.6} aria-hidden="true" />
          <span>Not found yet: {plural(hiddenM, 'motivation')}, {plural(hiddenP, 'pitfall')}</span>
        </div>
      )}
    </section>
  );
}

const resolveSkills = () => skills.filter((s) => s.group === 'interpersonal');

/** The argument the dock sends: a skill and, if they like, what they say. */
export function PhoneArgument({ patience, maxPatience, skillId, text, onSkill, onText }: { patience: number; maxPatience: number; skillId: string; text: string; onSkill: (id: string) => void; onText: (text: string) => void }) {
  const list = resolveSkills();
  const skill = list.find((s) => s.id === skillId) ?? findSkillByName(skillId);
  return (
    <section className="ph-sec ph-arg">
      <div className="ph-h">
        <b>Make an argument</b>
        <span className="ph-glass" aria-label={`Patience ${patience} of ${maxPatience}`}>
          {Array.from({ length: maxPatience }, (_, i) => <i key={i} data-on={i < patience || undefined}><Hourglass size={14} strokeWidth={2.6} aria-hidden="true" /></i>)}
          <span>{patience} left</span>
        </span>
      </div>
      <label className="sb-input ph-input">
        <span><small>Skill</small> {skill?.name ?? 'Choose a skill'}</span>
        <ChevronDown size={18} strokeWidth={3} aria-hidden="true" />
        <select aria-label="Skill" value={skillId} onChange={(e) => onSkill(e.target.value)}>
          <option value="">Choose a skill</option>
          {list.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label className="md-say">
        <MessageSquareQuote size={16} strokeWidth={2.6} aria-hidden="true" />
        <textarea aria-label="What you say" aria-describedby="ph-say-hint" rows={2} placeholder="What you say" value={text} onChange={(e) => onText(e.target.value)} />
      </label>
      {(!skillId || !text.trim()) && <small id="ph-say-hint" className="text-[13px] text-text-soft">Pick a skill and say what you argue.</small>}
    </section>
  );
}

/** A 48 px stepper in the Director's dock (`ph-step`). */
export function PhoneStep({ label, value, note, disabled, canLower = true, canRaise = true, onChange }: { label: string; value: string; note: string; disabled: boolean; canLower?: boolean; canRaise?: boolean; onChange: (delta: number) => void }) {
  return (
    <div className="ph-step">
      <div><b>{label}</b><small>{note}</small></div>
      <button type="button" aria-label={`Lower ${label}`} disabled={disabled || !canLower} onClick={() => onChange(-1)}><Minus size={18} strokeWidth={3} aria-hidden="true" /></button>
      <strong>{value}</strong>
      <button type="button" aria-label={`Raise ${label}`} disabled={disabled || !canRaise} onClick={() => onChange(1)}><Plus size={18} strokeWidth={3} aria-hidden="true" /></button>
    </div>
  );
}
