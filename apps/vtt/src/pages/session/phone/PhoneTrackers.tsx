import type { EntityData, HeroTrackerOperation } from '../../../types/protocol.js';
import { MetricPanel, PhoneButton } from './phone-shared.js';
import { num } from './phone-utils.js';

/** The Player's Trackers tab: stamina, resource, recoveries, victories, each a 44 px control. */
export function PhoneTrackers({
  hero,
  canMutate,
  resourceName,
  onTracker,
  onCatchBreath,
}: {
  hero: EntityData;
  canMutate: boolean;
  resourceName: string;
  onTracker: (op: HeroTrackerOperation) => void;
  onCatchBreath: () => void;
}) {
  const currentStamina = num(hero, 'currentStamina', 0);
  const maxStamina = num(hero, 'maxStamina', 0);
  const heroicResource = num(hero, 'heroicResource', 0);
  const recoveriesCurrent = num(hero, 'recoveriesCurrent', 0);
  const recoveriesMax = num(hero, 'recoveriesMax', 0);
  const victories = num(hero, 'victories', 0);
  return (
          <div className="flex flex-col">
            <MetricPanel label="Stamina" value={currentStamina} max={maxStamina}>
              <div className="grid grid-cols-4 gap-2">
                {[-5, -1, 1, 5].map((delta) => (
                  <PhoneButton key={delta} disabled={!canMutate} onClick={() => onTracker({ kind: 'adjust_stamina', delta })}>
                    {delta > 0 ? `+${delta}` : delta}
                  </PhoneButton>
                ))}
              </div>
            </MetricPanel>
            <MetricPanel label={resourceName} value={heroicResource}>
              <div className="grid grid-cols-2 gap-2">
                <PhoneButton disabled={!canMutate} onClick={() => onTracker({ kind: 'adjust_heroic_resource', delta: -1 })}>-1</PhoneButton>
                <PhoneButton disabled={!canMutate} onClick={() => onTracker({ kind: 'adjust_heroic_resource', delta: 1 })}>+1</PhoneButton>
              </div>
            </MetricPanel>
            <MetricPanel label="Recoveries" value={recoveriesCurrent} max={recoveriesMax}>
              <div className="grid grid-cols-2 gap-2">
                <PhoneButton disabled={!canMutate} onClick={() => onTracker({ kind: 'adjust_recoveries', delta: -1 })}>Spend</PhoneButton>
                <PhoneButton disabled={!canMutate} onClick={() => onTracker({ kind: 'adjust_recoveries', delta: 1 })}>Restore</PhoneButton>
              </div>
              <PhoneButton disabled={!canMutate} onClick={onCatchBreath} className="w-full">
                Catch Breath
              </PhoneButton>
            </MetricPanel>
            <MetricPanel label="Victories" value={victories}>
              <div className="grid grid-cols-2 gap-2">
                <PhoneButton disabled={!canMutate} onClick={() => onTracker({ kind: 'adjust_victories', delta: -1 })}>-1</PhoneButton>
                <PhoneButton disabled={!canMutate} onClick={() => onTracker({ kind: 'adjust_victories', delta: 1 })}>+1</PhoneButton>
              </div>
            </MetricPanel>
          </div>
  );
}
