import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cleanName } from '../../lib/faces.js';
import type { EntityData } from '../../types/protocol.js';
import { useSessionConnection } from './shell/connection-context.js';
import './battle/battle.css';

interface DamageDialogProps {
  entities: EntityData[];
  onApplyDamage: (entityId: string, amount: number) => void;
  onApplyHealing: (entityId: string, amount: number) => void;
}

/** Damage / Heal at the top of the Director's right rail (`sb-seg`, `sb-input--target`, `sb-amt`). */
export function DamageDialog({ entities, onApplyDamage, onApplyHealing }: DamageDialogProps) {
  const { paused } = useSessionConnection();
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'damage' | 'heal'>('damage');
  const target = entities.find((e) => e.id === targetId);

  const handleApply = () => {
    if (!targetId || !amount || paused) return;
    const num = parseInt(amount, 10);
    if (isNaN(num) || num <= 0) return;

    if (mode === 'damage') {
      onApplyDamage(targetId, num);
    } else {
      onApplyHealing(targetId, num);
    }
    setAmount('');
  };

  const label = mode === 'damage' ? 'Apply damage' : 'Apply healing';
  return (
    <section className="sb-sec">
      <div className="sb-seg" role="group" aria-label="Damage or heal">
        <button type="button" data-on={mode === 'damage' || undefined} aria-pressed={mode === 'damage'} onClick={() => setMode('damage')}>Damage</button>
        <button type="button" data-on={mode === 'heal' || undefined} aria-pressed={mode === 'heal'} onClick={() => setMode('heal')}>Heal</button>
      </div>
      {/* A native select can't wrap a long name, so it sits unseen over a box that can. */}
      <div className="sb-input sb-input--target">
        <span>{target ? cleanName(target.name) : 'Select target…'}</span>
        <ChevronDown size={16} strokeWidth={3} aria-hidden="true" className="flex-none" />
        <select aria-label="Target" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
          <option value="">Select target…</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>{cleanName(e.name)}</option>
          ))}
        </select>
      </div>
      <div className="sb-amt">
        <div className="sb-input">
          <input
            type="number"
            aria-label="Amount"
            placeholder="Amount"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApply();
            }}
          />
        </div>
        <button type="button" className={paused ? 'sb-wait-btn' : undefined} disabled={paused || !targetId || !amount} onClick={handleApply}>
          {paused ? 'Apply, when back' : label}
        </button>
      </div>
    </section>
  );
}
