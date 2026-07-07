import { useState } from 'react';
import { GameData } from '@anvil/data';
import type { CareerDefinition, CharacterInProgress } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent, Input, cn } from '@anvil/ui';
import { Check } from 'lucide-react';
import { BottomSheet, PhoneDecisionFlow } from '../creator/phone/index.js';
import { buildCareerScreens } from './phone/CareerScreens.js';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

/** Phone info sheet — career details and the incident text render differently. */
type CareerPeek =
  | { kind: 'career'; career: CareerDefinition }
  | { kind: 'incident'; career: CareerDefinition };

export function CareerStep({ character, onChange }: Props) {
  const [peek, setPeek] = useState<CareerPeek | null>(null);
  const careers = GameData.getAllCareers();
  const selectedCareer = character.career ? GameData.getCareer(character.career) : null;

  const selectCareer = (c: CareerDefinition) =>
    onChange({
      career: c.id,
      incitingIncident: c.incitingIncident,
      careerPerk: null,
      careerSkillChoices: [],
    });

  // Phone: career pick first; the incident screen exists only once a career
  // is chosen. Careers carry one suggested incident and the character field
  // is free text, so screen 2 pairs the suggestion row with a custom input.
  const screens = buildCareerScreens({
    careers,
    selectedCareer: selectedCareer ?? null,
    incitingIncident: character.incitingIncident,
    onSelectCareer: (careerId) => {
      const career = GameData.getCareer(careerId);
      if (career) selectCareer(career);
    },
    onPeekCareer: (careerId) => {
      const career = GameData.getCareer(careerId);
      if (career) setPeek({ kind: 'career', career });
    },
    onChangeIncident: (text) => onChange({ incitingIncident: text }),
    onPeekIncident: () => {
      if (selectedCareer) setPeek({ kind: 'incident', career: selectedCareer });
    },
  });

  const renderDesktop = () => (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Choose Your Career</h2>
      <p className="mb-4 text-sm text-zinc-400">Your career reflects what you did before becoming a hero.</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {careers.map((c) => {
          const selected = character.career === c.id;
          return (
            <Card
              key={c.id}
              className={cn(
                'cursor-pointer transition-all bg-creator-card',
                selected
                  ? 'border-creator-highlight ring-1 ring-creator-highlight/50 bg-creator-highlight/20'
                  : 'border-creator-border hover:border-creator-text-muted hover:bg-creator-card-hover'
              )}
              onClick={() => selectCareer(c)}
            >
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn('text-base', selected && 'text-creator-highlight')}>
                    {c.name}
                  </CardTitle>
                  {selected && <Check className="h-5 w-5 text-creator-highlight shrink-0" />}
                </div>
              </CardHeader>
              {c.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-creator-text-muted">{c.description}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {selectedCareer && (
        <div className="mt-6 space-y-4">
          <Card className="border-creator-border bg-creator-card">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Skills</div>
                <div className="mt-1 text-sm text-creator-text">{selectedCareer.skills.join(', ') || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Languages</div>
                <div className="mt-1 text-sm text-creator-text">{selectedCareer.languages.join(', ') || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Perk</div>
                <div className="mt-1 text-sm capitalize text-creator-text">{selectedCareer.perkType}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Resources</div>
                <div className="mt-1 text-sm text-creator-text">
                  Renown {selectedCareer.renown} / Wealth {selectedCareer.wealth} / Projects {selectedCareer.projectPoints}
                </div>
              </div>
            </CardContent>
          </Card>

          <label className="text-sm text-zinc-400">
            Inciting Incident
            <Input
              className="mt-1"
              value={character.incitingIncident ?? ''}
              onChange={(e) => onChange({ incitingIncident: e.target.value })}
              placeholder="What drove you to become a hero?"
            />
          </label>
          <button
            type="button"
            className="rounded-md border border-creator-border px-3 py-2 text-left text-sm text-creator-text-muted transition hover:border-creator-text-muted hover:text-creator-text"
            onClick={() => onChange({ incitingIncident: selectedCareer.incitingIncident })}
          >
            Use suggested incident: {selectedCareer.incitingIncident}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <PhoneDecisionFlow screens={screens} desktop={renderDesktop} />
      {/* Renders null on desktop: nothing there ever sets peek. */}
      <BottomSheet
        open={peek !== null}
        onClose={() => setPeek(null)}
        title={
          peek?.kind === 'career'
            ? peek.career.name
            : peek?.kind === 'incident'
              ? 'Suggested incident'
              : undefined
        }
      >
        {peek?.kind === 'career' && (
          <>
            {peek.career.description && (
              <p className="text-sm leading-relaxed text-creator-text">{peek.career.description}</p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Skills</div>
                <div className="mt-1 text-sm text-creator-text">{peek.career.skills.join(', ') || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Languages</div>
                <div className="mt-1 text-sm text-creator-text">{peek.career.languages.join(', ') || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Perk</div>
                <div className="mt-1 text-sm capitalize text-creator-text">{peek.career.perkType}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Resources</div>
                <div className="mt-1 text-sm text-creator-text">
                  Renown {peek.career.renown} / Wealth {peek.career.wealth} / Projects {peek.career.projectPoints}
                </div>
              </div>
            </div>
          </>
        )}
        {peek?.kind === 'incident' && (
          <p className="text-sm leading-relaxed text-creator-text">{peek.career.incitingIncident}</p>
        )}
      </BottomSheet>
    </>
  );
}
