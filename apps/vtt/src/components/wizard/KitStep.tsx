import { useState } from 'react';
import { GameData, WizardLogic } from '@anvil/data';
import type { CharacterInProgress, KitDefinition } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent, cn } from '@anvil/ui';
import { Check } from 'lucide-react';
import { BottomSheet, PhoneDecisionFlow } from '../creator/phone/index.js';
import { buildKitScreens } from './phone/KitScreens.js';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

/** Non-zero stat bonuses, formatted from the kit's canonical fields. */
function getKitBonusLines(kit: KitDefinition): string[] {
  const lines: string[] = [];
  if (kit.staminaPerEchelon) lines.push(`+${kit.staminaPerEchelon} Stamina per echelon`);
  if (kit.speedBonus) lines.push(`+${kit.speedBonus} Speed`);
  if (kit.stabilityBonus) lines.push(`+${kit.stabilityBonus} Stability`);
  if (kit.meleeDamageBonus) lines.push(`${kit.meleeDamageBonus} melee damage`);
  if (kit.rangedDamageBonus) lines.push(`${kit.rangedDamageBonus} ranged damage`);
  if (kit.meleeDistanceBonus) lines.push(`+${kit.meleeDistanceBonus} melee distance`);
  if (kit.rangedDistanceBonus) lines.push(`+${kit.rangedDistanceBonus} ranged distance`);
  if (kit.disengageBonus) lines.push(`+${kit.disengageBonus} disengage`);
  return lines;
}

export function KitStep({ character, onChange }: Props) {
  const [peek, setPeek] = useState<KitDefinition | null>(null);
  const kits = GameData.getAllKits();
  const needsTwoKits = WizardLogic.getKitSelectionsNeeded(character) === 2;
  const selectedKitIds = WizardLogic.getSelectedKitIds(character);
  const selectedCount = selectedKitIds.length;

  const selectKit = (kitId: string) => {
    if (!needsTwoKits) {
      onChange({ kit: kitId, secondaryKit: null });
      return;
    }

    if (character.kit === kitId) {
      onChange({ kit: character.secondaryKit ?? null, secondaryKit: null });
      return;
    }

    if (character.secondaryKit === kitId) {
      onChange({ secondaryKit: null });
      return;
    }

    if (!character.kit) {
      onChange({ kit: kitId });
      return;
    }

    onChange({ secondaryKit: kitId });
  };

  // Phone slot semantics: screen 1 owns the primary kit, screen 2 the
  // secondary. The other slot's kit is disabled in the builder, mirroring
  // desktop's click handling (never the same kit twice).
  const selectKitAt = (slotIndex: number, kitId: string) => {
    if (!needsTwoKits) {
      onChange({ kit: kitId, secondaryKit: null });
      return;
    }
    if (slotIndex === 0) {
      if (character.secondaryKit === kitId) return;
      onChange({ kit: kitId });
    } else {
      if (character.kit === kitId) return;
      onChange({ secondaryKit: kitId });
    }
  };

  const screens = buildKitScreens({
    kits,
    selectionsNeeded: WizardLogic.getKitSelectionsNeeded(character),
    primaryKitId: character.kit ?? null,
    secondaryKitId: character.secondaryKit ?? null,
    onSelectAt: selectKitAt,
    onPeekKit: (kitId) => {
      const kit = kits.find((k) => k.id === kitId);
      if (kit) setPeek(kit);
    },
  });

  const renderDesktop = () => (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Choose Your Kit</h2>
      <p className="mb-2 text-sm text-zinc-400">
        {needsTwoKits
          ? 'Field Arsenal lets Tacticians benefit from two kits and both kit signature abilities.'
          : 'Your kit provides equipment, combat bonuses, and a signature ability.'}
      </p>
      <p className={cn("mb-4 text-xs", selectedCount >= WizardLogic.getKitSelectionsNeeded(character) ? "text-creator-highlight" : "text-creator-text-muted")}>
        {selectedCount} / {WizardLogic.getKitSelectionsNeeded(character)} kit{needsTwoKits ? 's' : ''} selected
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {kits.map((k) => {
          const selected = selectedKitIds.includes(k.id);
          const selectedLabel = character.kit === k.id ? 'Primary' : character.secondaryKit === k.id ? 'Second' : null;
          return (
            <Card
              key={k.id}
              className={cn(
                'cursor-pointer transition-all bg-creator-card',
                selected
                  ? 'border-creator-highlight ring-1 ring-creator-highlight/50 bg-creator-highlight/20'
                  : 'border-creator-border hover:border-creator-text-muted hover:bg-creator-card-hover'
              )}
              onClick={() => selectKit(k.id)}
            >
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn('text-base', selected && 'text-creator-highlight')}>
                    {k.name}
                  </CardTitle>
                  {selected && (
                    <div className="flex items-center gap-2">
                      {selectedLabel && (
                        <span className="rounded border border-creator-highlight/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-creator-highlight">
                          {selectedLabel}
                        </span>
                      )}
                      <Check className="h-5 w-5 shrink-0 text-creator-highlight" />
                    </div>
                  )}
                </div>
              </CardHeader>
              {k.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-creator-text-muted">{k.description}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <PhoneDecisionFlow screens={screens} desktop={renderDesktop} />
      {/* Renders null on desktop: nothing there ever sets peek. */}
      <BottomSheet open={peek !== null} onClose={() => setPeek(null)} title={peek?.name}>
        {peek && <KitPeekBody kit={peek} />}
      </BottomSheet>
    </>
  );
}

/** Phone peek sheet body: the kit's equipment, bonuses, and signature ability. */
function KitPeekBody({ kit }: { kit: KitDefinition }) {
  const bonusLines = getKitBonusLines(kit);
  return (
    <>
      {kit.description && (
        <p className="text-sm leading-relaxed text-creator-text">{kit.description}</p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Armor</div>
          <div className="mt-1 text-sm text-creator-text">{kit.armor || '-'}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Weapons</div>
          <div className="mt-1 text-sm text-creator-text">{kit.weapons.join(', ') || '-'}</div>
        </div>
      </div>
      {bonusLines.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Bonuses</div>
          <ul className="mt-1 space-y-0.5 text-sm text-creator-text">
            {bonusLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">
          Signature Ability
        </div>
        <div className="mt-1 rounded-lg border border-creator-border bg-creator-card p-3">
          <div className="text-sm font-medium text-creator-text">{kit.signatureAbility.name}</div>
          {kit.signatureAbility.description && (
            <p className="mt-1 text-xs text-creator-text-muted">{kit.signatureAbility.description}</p>
          )}
          <p className="mt-2 text-xs text-creator-text-muted">
            {[kit.signatureAbility.type, kit.signatureAbility.distance, kit.signatureAbility.target]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {kit.signatureAbility.powerRoll && (
            <p className="mt-1 text-xs text-creator-text-muted">
              Power Roll: {kit.signatureAbility.powerRoll}
            </p>
          )}
          <ul className="mt-2 space-y-1 text-xs text-creator-text">
            {kit.signatureAbility.tier1 && <li>Tier 1: {kit.signatureAbility.tier1}</li>}
            {kit.signatureAbility.tier2 && <li>Tier 2: {kit.signatureAbility.tier2}</li>}
            {kit.signatureAbility.tier3 && <li>Tier 3: {kit.signatureAbility.tier3}</li>}
          </ul>
          {kit.signatureAbility.effect && (
            <p className="mt-2 text-xs text-creator-text-muted">{kit.signatureAbility.effect}</p>
          )}
        </div>
      </div>
    </>
  );
}
