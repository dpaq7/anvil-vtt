/**
 * Echelon display names shared by the wizard review, level select, and
 * creator sidebar. HeroLogic.getEchelon returns only the number, so the
 * name lookup lives UI-side.
 */
const ECHELON_NAMES: Record<number, string> = {
  1: 'Adventurer',
  2: 'Veteran',
  3: 'Master',
  4: 'Legend',
};

export function getEchelonName(echelon: number): string {
  return ECHELON_NAMES[echelon] ?? `Echelon ${echelon}`;
}
