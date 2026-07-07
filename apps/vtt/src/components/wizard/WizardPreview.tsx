import type { CharacterInProgress } from '@anvil/data';
import { formatScore, resolveWizardSummary } from './wizard-summary.js';

interface Props {
  character: CharacterInProgress;
}

export function WizardPreview({ character }: Props) {
  const {
    stats,
    ancestryName,
    className,
    subclassName,
    careerName,
    cultureDisplay,
    complicationName,
    kitName,
    secondaryKitName,
    companionName,
    selectedSkills,
    selectedAbilities,
    selectedPerks,
    selectedMinions,
  } = resolveWizardSummary(character);

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
      {kitName && <Field label={secondaryKitName ? "Kits" : "Kit"} value={[kitName, secondaryKitName].filter(Boolean).join(', ')} />}
      {companionName && <Field label="Companion" value={companionName} />}

      {character.characteristics && (
        <div>
          <span className="text-zinc-500">Characteristics</span>
          <div className="mt-1 grid grid-cols-5 gap-2">
            {(Object.entries(character.characteristics) as [string, number][]).map(([name, val]) => (
              <div key={name} className="flex flex-col items-center rounded bg-zinc-800 px-2 py-1">
                <span className="text-[10px] uppercase text-zinc-500">{name.slice(0, 3)}</span>
                <span className="font-mono text-zinc-200">{formatScore(val)}</span>
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

      {selectedMinions.length > 0 && (
        <div>
          <span className="text-zinc-500">Minions</span>
          <p className="text-zinc-300">{selectedMinions.join(', ')}</p>
        </div>
      )}

      {selectedPerks.length > 0 && (
        <div>
          <span className="text-zinc-500">Perks</span>
          <p className="text-zinc-300">{selectedPerks.join(', ')}</p>
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
