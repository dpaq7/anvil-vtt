import type { CharacterInProgress, DerivedStats } from '@anvil/data';
import { GameData, WizardLogic } from '@anvil/data';

interface Props {
  character: CharacterInProgress;
}

function getCultureDisplay(character: CharacterInProgress): string | null {
  const environment = character.culture.environment
    ? GameData.getCulturesByType('environment').find((item) => item.id === character.culture.environment)?.name
    : null;
  const organization = character.culture.organization
    ? GameData.getCulturesByType('organization').find((item) => item.id === character.culture.organization)?.name
    : null;
  const upbringing = character.culture.upbringing
    ? GameData.getCulturesByType('upbringing').find((item) => item.id === character.culture.upbringing)?.name
    : null;

  const parts = [environment, organization, upbringing].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : null;
}

export function WizardPreview({ character }: Props) {
  const canDerive = WizardLogic.canCalculateDerivedStats(character);
  let stats: DerivedStats | null = null;
  if (canDerive) {
    stats = WizardLogic.calculateDerivedStats(character);
  }

  const ancestryName = character.ancestry
    ? GameData.getAncestry(character.ancestry)?.name ?? character.ancestry
    : null;
  const className = character.heroClass
    ? GameData.getClass(character.heroClass)?.name ?? character.heroClass
    : null;
  const subclassName = character.subclass && character.heroClass
    ? (Array.isArray(character.subclass) ? character.subclass : [character.subclass])
        .map((id) => GameData.getSubclass(character.heroClass!, id)?.name ?? id)
        .join(', ')
    : null;
  const careerName = character.career
    ? GameData.getCareer(character.career)?.name ?? character.career
    : null;
  const cultureDisplay = getCultureDisplay(character);
  const complicationName = character.complication?.name ?? null;
  const kitName = character.kit
    ? GameData.getKit(character.kit)?.name ?? character.kit
    : null;
  const selectedSkills = WizardLogic.getSelectedSkillNames(character);
  const selectedAbilities = character.selectedAbilities.map((abilityId) => {
    const slug = abilityId.includes(':') ? abilityId.split(':').pop() ?? abilityId : abilityId;
    const ability = GameData.getByScc(abilityId) ?? GameData.getAbility(abilityId) ?? GameData.getAbility(slug);
    return ability?.name ?? slug;
  });

  return (
    <div className="flex flex-col gap-4 text-sm">
      <h3 className="font-semibold text-zinc-200">
        {character.name || 'Unnamed Hero'}
      </h3>

      {ancestryName && (
        <Field label="Ancestry" value={ancestryName} />
      )}
      {cultureDisplay && <Field label="Culture" value={cultureDisplay} />}
      {className && (
        <Field label="Class" value={className} />
      )}
      {subclassName && (
        <Field label="Subclass" value={subclassName} />
      )}
      {careerName && <Field label="Career" value={careerName} />}
      {complicationName && <Field label="Complication" value={complicationName} />}
      {kitName && <Field label="Kit" value={kitName} />}

      {character.characteristics && (
        <div>
          <span className="text-zinc-500">Characteristics</span>
          <div className="mt-1 grid grid-cols-5 gap-2">
            {(Object.entries(character.characteristics) as [string, number][]).map(([name, val]) => (
              <div key={name} className="flex flex-col items-center rounded bg-zinc-800 px-2 py-1">
                <span className="text-[10px] uppercase text-zinc-500">{name.slice(0, 3)}</span>
                <span className="font-mono text-zinc-200">{val >= 0 ? `+${val}` : val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && (
        <div className="flex flex-wrap gap-3">
          <StatPill label="Stamina" value={stats.stamina} />
          <StatPill label="Speed" value={stats.speed} />
          <StatPill label="Stability" value={stats.stability} />
          <StatPill label="Recoveries" value={stats.recoveries} />
          <StatPill label="Size" value={stats.size} />
        </div>
      )}

      {selectedSkills.length > 0 && (
        <div>
          <span className="text-zinc-500">Skills</span>
          <p className="text-zinc-300">{selectedSkills.join(', ')}</p>
        </div>
      )}

      {selectedAbilities.length > 0 && (
        <div>
          <span className="text-zinc-500">Abilities</span>
          <p className="text-zinc-300">{selectedAbilities.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-zinc-500">{label}</span>
      <p className="text-zinc-200">{value}</p>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded bg-zinc-800 px-2 py-1 text-center">
      <div className="text-[10px] uppercase text-zinc-500">{label}</div>
      <div className="font-mono text-zinc-200">{value}</div>
    </div>
  );
}
