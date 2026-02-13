import { useMemo } from 'react';
import type { LevelUpChoice } from '@anvil/data';
import { getProgressionForLevel } from '@anvil/data';
import { Card, CardContent, cn } from '@anvil/ui';
import { useWizardStore } from '../../../stores/wizardStore.js';
import { CheckCircle2, Circle } from 'lucide-react';

interface Props {
  level: number;
}

export function LevelUpStep({ level }: Props) {
  const character = useWizardStore((state) => state.character);
  const setLevelUpChoice = useWizardStore((state) => state.setLevelUpChoice);

  const progression = useMemo(() => getProgressionForLevel(level), [level]);
  const currentChoices = character.levelUpChoices[level] || [];

  // Get choice for a specific feature
  const getChoiceForFeature = (featureId: string): string | undefined => {
    return currentChoices.find((c) => c.featureId === featureId)?.choiceId;
  };

  // Handle selecting a choice
  const handleSelectChoice = (featureId: string, choiceId: string, category?: string) => {
    const choice: LevelUpChoice = {
      featureId,
      choiceId,
      category,
    };
    setLevelUpChoice(level, choice);
  };

  if (!progression) {
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
        {progression.features.map((feature) => {
          const isAutomatic = feature.type === 'automatic';
          const hasChoices = feature.type === 'choice' && feature.choices;
          const selectedChoice = hasChoices ? getChoiceForFeature(feature.id) : null;

          return (
            <div key={feature.id}>
              {/* Feature Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-0.5">
                  {isAutomatic ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : selectedChoice ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-zinc-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-200">{feature.name}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{feature.description}</p>
                </div>
              </div>

              {/* Choices Grid */}
              {hasChoices && feature.choices && (
                <div className="ml-8 grid gap-2 sm:grid-cols-2">
                  {feature.choices.map((choice) => {
                    const isSelected = selectedChoice === choice.id;
                    return (
                      <Card
                        key={choice.id}
                        className={cn(
                          'cursor-pointer transition-all',
                          isSelected
                            ? 'border-green-500 bg-green-950/30 ring-1 ring-green-500/50'
                            : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'
                        )}
                        onClick={() =>
                          handleSelectChoice(feature.id, choice.id, feature.category)
                        }
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                              {isSelected ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-zinc-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-zinc-200">
                                {choice.name}
                              </div>
                              <div className="text-xs text-zinc-400 mt-0.5">
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
