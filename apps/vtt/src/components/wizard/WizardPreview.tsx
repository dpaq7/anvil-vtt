import type { CharacterInProgress, DerivedStats } from '@anvil/data';
import { WizardLogic } from '@anvil/data';

interface Props {
  character: CharacterInProgress;
}

export function WizardPreview({ character }: Props) {
  const canDerive = WizardLogic.canCalculateDerivedStats(character);
  let stats: DerivedStats | null = null;
  if (canDerive) {
    stats = WizardLogic.calculateDerivedStats(character);
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <h3 className="font-semibold text-zinc-200">
        {character.name || 'Unnamed Hero'}
      </h3>

      {character.ancestry && (
        <Field label="Ancestry" value={character.ancestry} />
      )}
      {character.heroClass && (
        <Field label="Class" value={character.heroClass} />
      )}
      {character.subclass && (
        <Field
          label="Subclass"
          value={Array.isArray(character.subclass) ? character.subclass.join(', ') : character.subclass}
        />
      )}
      {character.career && <Field label="Career" value={character.career} />}
      {character.kit && <Field label="Kit" value={character.kit} />}

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

      {character.selectedSkills.length > 0 && (
        <div>
          <span className="text-zinc-500">Skills</span>
          <p className="text-zinc-300">{character.selectedSkills.join(', ')}</p>
        </div>
      )}

      {character.selectedAbilities.length > 0 && (
        <div>
          <span className="text-zinc-500">Abilities</span>
          <p className="text-zinc-300">{character.selectedAbilities.length} selected</p>
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
