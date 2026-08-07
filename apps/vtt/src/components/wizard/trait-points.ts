import type { Ancestry } from "@anvil/types";

/** Points left in an ancestry's trait budget after the given selections. */
export function getRemainingTraitPoints(
  ancestry: Ancestry,
  selectedTraitIds: string[],
): number {
  const traits = ancestry.purchasedTraits ?? [];
  const spentPoints = selectedTraitIds.reduce((sum, id) => {
    const trait = traits.find((candidate) => candidate.id === id);
    return sum + (trait?.cost ?? 0);
  }, 0);
  return ancestry.ancestryPoints - spentPoints;
}
