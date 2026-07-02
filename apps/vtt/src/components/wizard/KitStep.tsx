import { GameData, WizardLogic } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent, cn } from '@anvil/ui';
import { Check } from 'lucide-react';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function KitStep({ character, onChange }: Props) {
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

  return (
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
}
