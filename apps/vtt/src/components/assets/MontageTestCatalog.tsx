import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Button } from '@anvil/ui';
import { MONTAGE_SCENARIOS, MontageLogic } from '@anvil/data';
import type { CreateMontageTestInput } from '@anvil/types';

export interface MontageTestCatalogProps {
  heroCount: number;
  onSelect: (input: CreateMontageTestInput) => void;
}

export function MontageTestCatalog({ heroCount, onSelect }: MontageTestCatalogProps) {
  const [search, setSearch] = useState('');

  const scenarios = useMemo(() => {
    if (!search) return MONTAGE_SCENARIOS;
    const q = search.toLowerCase();
    return MONTAGE_SCENARIOS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [search]);

  const handleSelect = (scenario: (typeof MONTAGE_SCENARIOS)[number]) => {
    const { template } = scenario;

    // Compute effective limits scaled for hero count
    const effectiveSuccesses = MontageLogic.getEffectiveSuccessLimit(
      {
        baseSuccessLimit: template.baseSuccessLimit,
        baseFailureLimit: template.baseFailureLimit,
        heroCountAdjustment: template.heroCountAdjustment,
        currentSuccesses: 0,
        currentFailures: 0,
      },
      heroCount,
    );

    const effectiveFailures = MontageLogic.getEffectiveFailureLimit(
      {
        baseSuccessLimit: template.baseSuccessLimit,
        baseFailureLimit: template.baseFailureLimit,
        heroCountAdjustment: template.heroCountAdjustment,
        currentSuccesses: 0,
        currentFailures: 0,
      },
      heroCount,
    );

    const input: CreateMontageTestInput = {
      testName: scenario.name,
      testData: {
        scenarioId: scenario.id,
        description: template.description,
        challenges: template.challenges,
        hazards: template.hazards,
        outcomes: template.outcomes,
        difficulty: template.difficulty,
      },
      targetSuccesses: effectiveSuccesses,
      maxFailures: effectiveFailures,
    };

    onSelect(input);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-400">Add Montage Test</p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-zinc-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search scenarios..."
          className="h-7 pl-7 text-xs"
        />
      </div>

      {/* Scenario cards */}
      <div className="flex flex-col gap-1.5">
        {scenarios.map((scenario) => {
          const { template } = scenario;

          const effectiveSuccesses = MontageLogic.getEffectiveSuccessLimit(
            {
              baseSuccessLimit: template.baseSuccessLimit,
              baseFailureLimit: template.baseFailureLimit,
              heroCountAdjustment: template.heroCountAdjustment,
              currentSuccesses: 0,
              currentFailures: 0,
            },
            heroCount,
          );

          const effectiveFailures = MontageLogic.getEffectiveFailureLimit(
            {
              baseSuccessLimit: template.baseSuccessLimit,
              baseFailureLimit: template.baseFailureLimit,
              heroCountAdjustment: template.heroCountAdjustment,
              currentSuccesses: 0,
              currentFailures: 0,
            },
            heroCount,
          );

          return (
            <Card
              key={scenario.id}
              className="cursor-pointer transition hover:border-zinc-600"
              onClick={() => handleSelect(scenario)}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xs font-semibold">
                    {scenario.name}
                  </CardTitle>
                  <p className="mt-0.5 text-[10px] leading-tight text-zinc-500">
                    {scenario.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-6 shrink-0 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(scenario);
                  }}
                >
                  <Plus className="size-3.5" />
                </Button>
              </CardHeader>

              <CardContent className="flex flex-wrap gap-1 px-3 pb-3 pt-0">
                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                  {template.challenges.length} challenges
                </Badge>
                <Badge className="border-transparent bg-green-600/20 text-[9px] px-1 py-0 text-green-400">
                  {effectiveSuccesses} successes
                </Badge>
                <Badge className="border-transparent bg-red-600/20 text-[9px] px-1 py-0 text-red-400">
                  {effectiveFailures} failures
                </Badge>
                {scenario.difficulty && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {scenario.difficulty}
                  </Badge>
                )}
                {scenario.partyLevel && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    Lv {scenario.partyLevel}+
                  </Badge>
                )}
                {template.heroCountAdjustment && heroCount !== 5 && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-400">
                    Scaled for {heroCount}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {scenarios.length === 0 && (
        <p className="py-4 text-center text-xs text-zinc-500">
          No scenarios match your search.
        </p>
      )}
    </div>
  );
}
