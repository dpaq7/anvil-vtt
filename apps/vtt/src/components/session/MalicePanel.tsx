import { Button } from '@anvil/ui';

interface MalicePanelProps {
  malice: number;
  isDirector: boolean;
  onAdjust: (delta: number) => void;
}

export function MalicePanel({ malice, isDirector, onAdjust }: MalicePanelProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium uppercase text-zinc-500">Malice</span>
      <div className="flex items-center gap-3">
        {isDirector && (
          <Button size="sm" variant="ghost" onClick={() => onAdjust(-1)} disabled={malice <= 0}>
            &minus;
          </Button>
        )}
        <span className="min-w-[2rem] text-center text-2xl font-bold text-red-400">
          {malice}
        </span>
        {isDirector && (
          <Button size="sm" variant="ghost" onClick={() => onAdjust(1)}>
            +
          </Button>
        )}
      </div>
    </div>
  );
}
