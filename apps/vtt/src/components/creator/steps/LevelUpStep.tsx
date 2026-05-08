import { useMemo } from 'react';
import type { LevelUpChoice } from '@anvil/data';
import { GameData, getProgressionForLevel } from '@anvil/data';
import type { HeroClass } from '@anvil/types';
import { Card, CardContent, cn } from '@anvil/ui';
import { useWizardStore } from '../../../stores/wizardStore.js';
import { CheckCircle2, Circle } from 'lucide-react';

interface Props {
  level: number;
}

interface FeatureChoiceView {
  id: string;
  name: string;
  description: string;
}

interface FeatureView {
  id: string;
  name: string;
  description: string;
  type: 'automatic' | 'choice';
  choices?: FeatureChoiceView[];
  category?: string;
}

interface FeatureMetadataView {
  scc?: string[];
  item_id?: string;
  class?: string;
  subclass?: string;
  level?: number;
}

type EffectWithText = { effect?: string; name?: string; features?: UnknownFeature[] };
type UnknownFeature = {
  name: string;
  metadata?: FeatureMetadataView;
  effects?: EffectWithText[];
};

const ORDINAL_LEVEL = /^(\d+)(st|nd|rd|th)-level\s+/i;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripSubclassPrefix(name: string): string {
  return name
    .replace(/^College of the\s+/i, '')
    .replace(/^College of\s+/i, '')
    .replace(/^Domain of\s+/i, '')
    .replace(/^The\s+/i, '')
    .trim();
}

function getFeatureId(feature: UnknownFeature): string {
  return feature.metadata?.scc?.[0] ?? slugify(feature.name);
}

function getEffectText(effect: EffectWithText): string {
  if (!effect.effect) return '';
  return effect.name ? `${effect.name}: ${effect.effect}` : effect.effect;
}

function getFeatureDescription(feature: UnknownFeature): string {
  const effects = feature.effects ?? [];
  const text = effects
    .map(getEffectText)
    .filter(Boolean)
    .join('\n\n');
  return text || feature.name;
}

function getNestedChoiceFeatures(feature: UnknownFeature): UnknownFeature[] {
  return (feature.effects ?? []).flatMap((effect) => effect.features ?? []);
}

function getChoiceCategory(feature: UnknownFeature): string | undefined {
  if (feature.name.toLowerCase().includes('ability')) return 'ability';
  if (feature.name.toLowerCase().includes('perk')) return 'perk';
  return feature.metadata?.item_id;
}

function getSubclassTokens(heroClass: HeroClass, subclass: string | string[] | null): string[] {
  if (!subclass) return [];
  const ids = Array.isArray(subclass) ? subclass : [subclass];
  return ids.flatMap((id) => {
    const option = GameData.getSubclass(heroClass, id);
    const name = option?.name ?? id;
    return [id.replace(/-/g, ' '), name, stripSubclassPrefix(name)].map(normalize);
  });
}

function featureMatchesSubclass(
  feature: UnknownFeature,
  heroClass: HeroClass,
  subclass: string | string[] | null
): boolean {
  const selectedTokens = getSubclassTokens(heroClass, subclass);
  if (selectedTokens.length === 0) return true;

  const metadataSubclass = feature.metadata?.subclass;
  if (metadataSubclass) {
    return selectedTokens.includes(normalize(metadataSubclass));
  }

  const featureName = normalize(feature.name.replace(ORDINAL_LEVEL, ''));
  if (selectedTokens.some((token) => token && featureName.includes(token))) {
    return true;
  }

  const allSubclassMarkers = GameData.getSubclasses(heroClass).flatMap((option) => [
    normalize(option.id.replace(/-/g, ' ')),
    normalize(stripSubclassPrefix(option.name)),
  ]);
  const referencesAnotherSubclass = allSubclassMarkers.some(
    (marker) => marker && featureName.includes(marker)
  );

  return !referencesAnotherSubclass;
}

function buildGeneratedFeatures(
  heroClass: HeroClass | null,
  subclass: string | string[] | null,
  level: number
): FeatureView[] {
  if (!heroClass) return [];

  return (GameData.getAllFeatures() as UnknownFeature[])
    .filter((feature) => feature.metadata?.class === heroClass && feature.metadata?.level === level)
    .filter((feature) => featureMatchesSubclass(feature, heroClass, subclass))
    .map((feature) => {
      const choices = getNestedChoiceFeatures(feature).map((choice) => ({
        id: getFeatureId(choice),
        name: choice.name,
        description: getFeatureDescription(choice),
      }));

      return {
        id: getFeatureId(feature),
        name: feature.name,
        description: getFeatureDescription(feature),
        type: choices.length > 0 ? 'choice' : 'automatic',
        choices,
        category: getChoiceCategory(feature),
      };
    });
}

function buildFallbackFeatures(level: number): FeatureView[] {
  const progression = getProgressionForLevel(level);
  if (!progression) return [];

  return progression.features.map((feature) => ({
    id: feature.id,
    name: feature.name,
    description: feature.description,
    type: feature.type === 'choice' && feature.choices?.length ? 'choice' : 'automatic',
    choices: feature.choices,
    category: feature.category,
  }));
}

export function LevelUpStep({ level }: Props) {
  const character = useWizardStore((state) => state.character);
  const setLevelUpChoice = useWizardStore((state) => state.setLevelUpChoice);

  const features = useMemo(() => {
    const generated = buildGeneratedFeatures(
      character.heroClass as HeroClass | null,
      character.subclass,
      level
    );
    return generated.length > 0 ? generated : buildFallbackFeatures(level);
  }, [character.heroClass, character.subclass, level]);

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
                            : 'border-creator-border hover:border-creator-highlight/60 hover:bg-creator-card-hover'
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
