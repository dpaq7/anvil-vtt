import { AbilityBlock } from '../drawsteel/AbilityBlock.js';
import { drawSteelAbilityFromLike } from '../drawsteel/abilityData.js';

export interface AbilityInfo {
  id: string;
  name: string;
  keywords: string[];
  actionType: string;
  distance: string;
  damage: string;
  cost: string;
  tier1Effect: string;
  tier2Effect: string;
  tier3Effect: string;
}

interface AbilityCardProps {
  ability: AbilityInfo;
  disabled?: boolean;
  onUse: (abilityId: string) => void;
}

export function AbilityCard({ ability, disabled, onUse }: AbilityCardProps) {
  return (
    <AbilityBlock
      ability={drawSteelAbilityFromLike(ability)}
      compact
      disabled={disabled}
      onClick={() => onUse(ability.id)}
    />
  );
}
