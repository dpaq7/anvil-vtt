import { Eye, EyeOff, Hourglass } from "lucide-react";
import { NegotiationLogic } from "@anvil/data";
import type { ArgumentLogEntry } from "../../types/protocol.js";
import { OnlyYou } from "../session/modes/parts.js";
import { useSessionConnection } from "../session/shell/connection-context.js";
import { interestStep, secretTypeLabel } from "./mode-helpers.js";

export interface NegotiationMotivationRuntime {
  id: string;
  type: string;
  description: string;
  revealed: boolean;
}

export type NegotiationPitfallRuntime = NegotiationMotivationRuntime;

export interface NegotiationStageProps {
  npcName: string;
  npcPortrait?: string;
  npcAttitude: string;
  interest: number;
  patience: number;
  maxInterest?: number;
  maxPatience: number;
  phase: "active" | "success" | "failure";
  motivations: NegotiationMotivationRuntime[];
  pitfalls: NegotiationPitfallRuntime[];
  outcomes: Record<number, string>;
  isDirector: boolean;
  argumentLog?: ArgumentLogEntry[];
  onRevealMotivation?: (id: string) => void;
  onRevealPitfall?: (id: string) => void;
}


/**
 * One secret, three ways (`negotiation-*`, `SecretCard`). Revealed: anyone reads it. Hidden, for
 * the Director: readable, hatched, "Hidden from players", with Reveal. Hidden, for anyone else:
 * solid ink and no words at all, not even the kind of motivation.
 */
export function SecretCard({
  secret,
  isDirector,
  kind,
  onReveal,
}: {
  secret: NegotiationMotivationRuntime;
  isDirector: boolean;
  kind: "motivation" | "pitfall";
  onReveal?: () => void;
}) {
  const { paused } = useSessionConnection();
  if (secret.revealed) {
    return (
      <div className="md-secret" data-state="known">
        <div className="md-secret__h">
          <b>{secretTypeLabel(secret.type)}</b>
          {isDirector && <span><Eye size={13} strokeWidth={2.6} aria-hidden="true" />Players know</span>}
        </div>
        {secret.description && <p>{secret.description}</p>}
      </div>
    );
  }
  if (!isDirector) {
    return (
      <div className="md-secret" data-state="dark">
        <EyeOff size={16} strokeWidth={2.6} aria-hidden="true" />
        <span>A {kind} not found yet</span>
      </div>
    );
  }
  return (
    <div className="md-secret" data-state="hidden">
      <div className="md-secret__h">
        <b>{secretTypeLabel(secret.type)}</b>
        <OnlyYou>Hidden from players</OnlyYou>
      </div>
      {secret.description && <p>{secret.description}</p>}
      {onReveal && (
        <button type="button" className="md-reveal" disabled={paused} data-wait={paused || undefined} onClick={() => !paused && onReveal()}>
          {paused ? "Reveal, when back" : "Reveal"}
        </button>
      )}
    </div>
  );
}

/** Negotiation's screen: the NPC card, Interest and Patience in the corner, the secrets. */
export function NegotiationStage({
  npcName,
  npcPortrait,
  npcAttitude,
  interest,
  patience,
  maxInterest = 5,
  maxPatience,
  phase,
  motivations,
  pitfalls,
  outcomes,
  isDirector,
  onRevealMotivation,
  onRevealPitfall,
}: NegotiationStageProps) {
  const shownInterest = NegotiationLogic.clampInterest(interest, maxInterest);
  const shownPatience = NegotiationLogic.clampPatience(patience, maxPatience);
  const steps = Array.from({ length: maxInterest + 1 }, (_, i) => interestStep(i));
  const initials = npcName.split(/\s+/).map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
  const ended = phase !== "active";
  const outcomeText = ended ? outcomes[Math.round(shownInterest)] ?? "" : "";

  return (
    <>
      <div className="md-nego">
        <figure className="md-npccard">
          <div className="md-portrait">
            {npcPortrait ? <img src={npcPortrait} alt="" /> : <b aria-hidden="true">{initials || "?"}</b>}
          </div>
          <figcaption>
            <strong>{npcName || "No one yet"}</strong>
            <small>{npcAttitude}</small>
          </figcaption>
        </figure>
        <div className="md-meters">
          <section className="md-plate md-interest">
            <div className="md-plate__h">
              <b>Interest</b>
              <span>{shownInterest} of {maxInterest}. {steps[shownInterest]}</span>
            </div>
            <ol className="md-stairs">
              {steps.map((label, i) => (
                <li key={i} data-s={i < shownInterest ? "past" : i === shownInterest ? "now" : undefined}>
                  <i style={{ height: `calc(20px + ${i} * 11px)` }}>{i}</i>
                  <span>{label}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="md-plate md-patience">
            <div className="md-plate__h">
              <b>Patience</b>
              <span>{shownPatience} {shownPatience === 1 ? "argument" : "arguments"} left</span>
            </div>
            <ol>
              {Array.from({ length: maxPatience }, (_, i) => (
                <li key={i} data-on={i < shownPatience || undefined} aria-label={i < shownPatience ? "Left" : "Spent"}>
                  <Hourglass size={18} strokeWidth={2.6} aria-hidden="true" />
                </li>
              ))}
            </ol>
          </section>
        </div>
        <div className="md-secrets">
          <section>
            <h4>Motivations</h4>
            {motivations.length === 0 && <p className="sb-note">None set.</p>}
            {motivations.map((secret) => (
              <SecretCard key={secret.id} secret={secret} isDirector={isDirector} kind="motivation" onReveal={onRevealMotivation && (() => onRevealMotivation(secret.id))} />
            ))}
          </section>
          <section>
            <h4>Pitfalls</h4>
            {pitfalls.length === 0 && <p className="sb-note">None set.</p>}
            {pitfalls.map((secret) => (
              <SecretCard key={secret.id} secret={secret} isDirector={isDirector} kind="pitfall" onReveal={onRevealPitfall && (() => onRevealPitfall(secret.id))} />
            ))}
          </section>
        </div>
      </div>
      {ended && (
        <div className="md-end" role="status">
          {phase === "success" ? "Deal reached" : "No deal"}. {steps[shownInterest]}
          {outcomeText && <small className="mt-1 block font-body text-[15px] font-bold">{outcomeText}</small>}
        </div>
      )}
    </>
  );
}
