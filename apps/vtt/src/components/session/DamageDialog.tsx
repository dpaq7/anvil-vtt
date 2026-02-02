import { useState } from 'react';
import { Button, Input } from '@anvil/ui';
import type { EntityData } from '../../types/protocol.js';

interface DamageDialogProps {
  entities: EntityData[];
  onApplyDamage: (entityId: string, amount: number) => void;
  onApplyHealing: (entityId: string, amount: number) => void;
}

export function DamageDialog({ entities, onApplyDamage, onApplyHealing }: DamageDialogProps) {
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'damage' | 'heal'>('damage');

  const handleApply = () => {
    if (!targetId || !amount) return;
    const num = parseInt(amount, 10);
    if (isNaN(num) || num <= 0) return;

    if (mode === 'damage') {
      onApplyDamage(targetId, num);
    } else {
      onApplyHealing(targetId, num);
    }
    setAmount('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        <button
          onClick={() => setMode('damage')}
          className={`flex-1 rounded px-2 py-1 text-xs ${
            mode === 'damage' ? 'bg-red-500/20 text-red-400' : 'text-zinc-500'
          }`}
        >
          Damage
        </button>
        <button
          onClick={() => setMode('heal')}
          className={`flex-1 rounded px-2 py-1 text-xs ${
            mode === 'heal' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500'
          }`}
        >
          Heal
        </button>
      </div>

      <select
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
      >
        <option value="">Select target...</option>
        {entities.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>

      <Input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min={1}
      />

      <Button
        size="sm"
        onClick={handleApply}
        disabled={!targetId || !amount}
        className="w-full"
      >
        Apply {mode === 'damage' ? 'Damage' : 'Healing'}
      </Button>
    </div>
  );
}
