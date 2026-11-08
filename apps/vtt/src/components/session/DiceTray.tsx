import { useEffect, useMemo, useRef, useState } from 'react';
import type { AbilityResult, DrawSteelRollResult } from '../../types/protocol.js';
import { PowerRollDisplay, type RollCardData } from './PowerRollDisplay.js';
import { firstName } from '../../lib/faces.js';
import './battle/battle.css';

/** How long a roll stays up before it goes (ms). */
const HOLD_MS = 8_000;
/** How long the dice tumble before they settle (ms). */
const TUMBLE_MS = 600;
const CARD_W = 196;
const CARD_H = 104;

interface Tracked {
  key: string;
  card: RollCardData;
  sourceId: string | null;
  at: number;
}

export interface DiceTrayProps {
  entries: AbilityResult[];
  /** The bar's own rolls, which are not ability results. */
  lastRoll?: DrawSteelRollResult | null;
  /** The token the bar's roll opens beside, when there is one. */
  rollAnchorId?: string | null;
  /** Names this viewer may read. Anything else rolls as "Something". */
  entityNames: Map<string, string>;
  /** Where a token is on screen, for the card to open beside it. */
  anchorFor?: (entityId: string) => { x: number; y: number; w: number; h: number } | null;
  stageSize?: () => { width: number; height: number };
  maxVisible?: number;
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Power rolls on the map: the card opens beside the token, the dice settle, then the total and
 * tier pop in (DESIGN.md 5.2, `battle-turn-motion`). A roll by a creature this viewer can't see
 * has no name and no ability on it.
 */
export function DiceTray({ entries, lastRoll, rollAnchorId, entityNames, anchorFor, stageSize, maxVisible = 3 }: DiceTrayProps) {
  const [tracked, setTracked] = useState<Tracked[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const seen = useRef(new Set<string>());
  const primed = useRef(false);

  useEffect(() => {
    const added: Tracked[] = [];
    const add = (key: string, card: RollCardData, sourceId: string | null) => {
      if (seen.current.has(key)) return;
      seen.current.add(key);
      // Rolls already made when this view opened are history, not news.
      if (primed.current) added.push({ key, card, sourceId, at: Date.now() });
    };
    for (const result of entries) {
      const name = entityNames.get(result.sourceId);
      add(`a-${result.timestamp}-${result.sourceId}-${result.abilityId}`, {
        title: name ? `${firstName(name)}: ${result.abilityName}` : 'Something rolls',
        dice: result.dice,
        modifier: result.modifier,
        total: result.total,
        tier: result.tier,
        damage: name ? result.damage : 0,
        effects: name ? result.effects : [],
      }, result.sourceId);
    }
    if (lastRoll) {
      add(`r-${lastRoll.id}`, {
        title: `${lastRoll.rollerName} rolls ${lastRoll.label}`,
        dice: lastRoll.dice.map((d) => d.value),
        modifier: lastRoll.modifier,
        total: lastRoll.total,
        tier: lastRoll.tier,
      }, rollAnchorId ?? null);
    }
    primed.current = true;
    if (added.length > 0) setTracked((prev) => [...prev, ...added].slice(-maxVisible));
  }, [entries, lastRoll, rollAnchorId, entityNames, maxVisible]);

  useEffect(() => {
    if (tracked.length === 0) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setTracked((prev) => (prev.some((c) => t - c.at > HOLD_MS) ? prev.filter((c) => t - c.at <= HOLD_MS) : prev));
    }, 80);
    return () => clearInterval(timer);
  }, [tracked.length]);

  const stage = useMemo(() => stageSize?.() ?? { width: 800, height: 600 }, [stageSize, tracked.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (tracked.length === 0) return null;
  return (
    <div className="bt-rolls">
      {tracked.map((item, index) => {
        const age = now - item.at;
        const settling = !reduced() && age < TUMBLE_MS;
        // The roller may walk into fog while its card is up: the card stops naming it.
        const hiddenNow = item.sourceId !== null && !entityNames.has(item.sourceId);
        const roll = hiddenNow ? { ...item.card, title: 'Something rolls', damage: 0, effects: [] } : item.card;
        const anchor = item.sourceId ? anchorFor?.(item.sourceId) : null;
        // Beside the token, never over it. No token: the top-left of the map.
        let x = 12;
        let y = 48 + index * (CARD_H + 8);
        if (anchor) {
          x = anchor.x + anchor.w + 12 + CARD_W > stage.width ? anchor.x - CARD_W - 12 : anchor.x + anchor.w + 12;
          y = anchor.y - 8 + index * 12;
        }
        x = Math.max(4, Math.min(stage.width - CARD_W - 4, x));
        y = Math.max(4, Math.min(stage.height - CARD_H - 4, y));
        return (
          <PowerRollDisplay
            key={item.key}
            roll={roll}
            settling={settling}
            tumble={item.card.dice.map((_, i) => 1 + ((Math.floor(age / 70) + i * 3) % 10))}
            on={age > 16}
            style={{ left: x, top: y }}
          />
        );
      })}
    </div>
  );
}
