import { useMemo } from 'react';
import type { LevelUpChoice } from '@anvil/data';
import { WizardLogic } from '@anvil/data';
import { Card, CardContent, cn } from '@anvil/ui';
import { useWizardStore } from '../../../stores/wizardStore.js';
import { CheckCircle2, Circle } from 'lucide-react';

interface Props {
  level: number;
}

export function LevelUpStep({ level }: Props) {
  const character = useWizardStore((state) => state.character);
  const setLevelUpChoice = useWizardStore((state) => state.setLevelUpChoice);

  const features = useMemo(
    () => WizardLogic.getLevelUpFeatures(character, level),
    [character, level],
  );

  const currentChoices = character.levelUpChoices[level] || [];

  const getChoiceForFeature = (featureId: string): string | undefined => {
    return currentChoices.find((c) => c.featureId === featureId)?.choiceId;
  };

  const handleSelectChoice = (featureId: string, choiceId: string, category?: string) => {
    const choice: LevelUpChoice = {
      featureId,
      choiceId,
      category,
    };
    setLevelUpChoice(level, choice);
  };

  if (features.length === 0) {
    return (
      <div className="text-zinc-400">
        No level-up features available for level {level}.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 text-sm text-zinc-400">
        Review your level {level} features. Automatic features are gained automatically.
        Choice features require you to select one option.
      </p>

      <div className="space-y-6">
        {features.map((feature) => {
          const isAutomatic = feature.type === 'automatic';
          const hasChoices = feature.type === 'choice' && feature.choices && feature.choices.length > 0;
          const selectedChoice = hasChoices ? getChoiceForFeature(feature.id) : null;

          return (
            <div key={feature.id}>
              <div className="mb-3 flex items-start gap-3">
                <div className="mt-0.5">
                  {isAutomatic || selectedChoice ? (
                    <CheckCircle2 className="h-5 w-5 text-creator-highlight" />
                  ) : (
                    <Circle className="h-5 w-5 text-zinc-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-200">{feature.name}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              </div>

              {hasChoices && feature.choices && (
                <div className="ml-8 grid gap-2 sm:grid-cols-2">
                  {feature.choices.map((choice) => {
                    const isSelected = selectedChoice === choice.id;
                    return (
                      <Card
                        key={choice.id}
                        className={cn(
                          'cursor-pointer bg-creator-card transition-all',
                          isSelected
                            ? 'border-creator-highlight bg-creator-highlight/20 ring-1 ring-creator-highlight/50'
                            : 'border-creator-border hover:border-creator-highlight/60 hover:bg-creator-card-hover',
                        )}
                        onClick={() =>
                          handleSelectChoice(feature.id, choice.id, feature.category)
                        }
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                              {isSelected ? (
                                <CheckCircle2 className="h-4 w-4 text-creator-highlight" />
                              ) : (
                                <Circle className="h-4 w-4 text-zinc-600" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-200">
                                {choice.name}
                              </div>
                              <div className="mt-0.5 whitespace-pre-wrap text-xs text-zinc-400">
                                {choice.description}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
