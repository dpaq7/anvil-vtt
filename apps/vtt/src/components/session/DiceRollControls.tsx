import { useState } from 'react';
import { ChevronDown, Dices } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from '@anvil/ui';
import { useSessionConnection } from './shell/connection-context.js';
import type { ClientMessage, DrawSteelRollKind } from '../../types/protocol.js';

interface DiceRollControlsProps {
  send: (msg: ClientMessage) => void;
  className?: string;
  /**
   * 'full' shows every combat control; 'simple' is for out-of-combat scenes
   * (montage, negotiation) — no heroic-resource roll or modifier input, and
   * the power roll is labeled by its dice (2d10).
   */
  variant?: 'full' | 'simple' | 'bar';
  /** In the bar: fold to "Power ▾", "Mod 0" and "None ▾" (Director at 1280, DESIGN.md section 6). */
  fold?: boolean;
}

type EdgeBane = 'none' | 'edge' | 'bane' | 'double-edge' | 'double-bane';

const EDGE_BANE_OPTIONS: ReadonlyArray<{
  value: EdgeBane;
  short: string;
  title: string;
  edges: number;
  banes: number;
}> = [
  { value: 'none', short: '—', title: 'No edge or bane', edges: 0, banes: 0 },
  { value: 'edge', short: 'E', title: 'Edge (+2)', edges: 1, banes: 0 },
  { value: 'bane', short: 'B', title: 'Bane (−2)', edges: 0, banes: 1 },
  { value: 'double-edge', short: '2E', title: 'Double edge (tier up)', edges: 2, banes: 0 },
  { value: 'double-bane', short: '2B', title: 'Double bane (tier down)', edges: 0, banes: 2 },
];

export function DiceRollControls({ send, className, variant = 'full', fold = false }: DiceRollControlsProps) {
  const { paused } = useSessionConnection();
  const isFull = variant !== 'simple';
  const [modifier, setModifier] = useState('0');
  // Edge/bane is sticky across rolls — a GM often re-rolls under the same
  // condition. Only applies to power rolls.
  const [edgeBane, setEdgeBane] = useState<EdgeBane>('none');

  const roll = (kind: DrawSteelRollKind) => {
    const parsedModifier = Number.parseInt(isFull ? modifier : '0', 10);
    const isPower = kind === 'power';
    const selected = EDGE_BANE_OPTIONS.find((option) => option.value === edgeBane);
    send({
      type: 'draw_steel_roll',
      roll: {
        kind,
        modifier: isPower && Number.isFinite(parsedModifier) ? parsedModifier : undefined,
        edges: isPower && selected && selected.edges > 0 ? selected.edges : undefined,
        banes: isPower && selected && selected.banes > 0 ? selected.banes : undefined,
      },
    });
  };

  if (variant === 'bar') {
    if (paused) {
      return (
        <div className="sb-roll" role="toolbar" aria-label="Dice">
          <span className="sb-roll__wait">Dice, when back</span>
        </div>
      );
    }
    const edge = EDGE_BANE_OPTIONS.find((option) => option.value === edgeBane);
    const edgeLabel = edgeBane === 'none' ? 'None' : edge?.short;
    const modBox = (
      <label>
        Mod
        <input type="number" aria-label="Modifier" value={modifier} onChange={(event) => setModifier(event.target.value)} />
      </label>
    );
    if (fold) {
      return (
        <div className="sb-roll" role="toolbar" aria-label="Dice">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" data-on>Power<ChevronDown size={13} strokeWidth={3} aria-hidden="true" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => roll('power')}>Power</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => roll('heroic-resource')}>Resource</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => roll('d6')}>d6</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {modBox}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Edge or bane (power rolls)">{edgeLabel}<ChevronDown size={13} strokeWidth={3} aria-hidden="true" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {EDGE_BANE_OPTIONS.map((option) => (
                <DropdownMenuItem key={option.value} onSelect={() => setEdgeBane(option.value)}>
                  {option.value === 'none' ? 'None' : option.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }
    return (
      <div className="sb-roll" role="toolbar" aria-label="Dice">
        <button type="button" data-on onClick={() => roll('power')}>Power</button>
        <button type="button" onClick={() => roll('heroic-resource')}>Resource</button>
        <button type="button" onClick={() => roll('d6')}>d6</button>
        {modBox}
        <div className="flex items-center gap-0.5" role="group" aria-label="Edge or bane (power rolls)">
          {EDGE_BANE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              title={option.title}
              aria-pressed={option.value === edgeBane}
              data-on={option.value === edgeBane || undefined}
              onClick={() => setEdgeBane(option.value)}
            >
              {option.value === 'none' ? 'None' : option.short}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-9 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/80 px-2 text-xs shadow-lg backdrop-blur',
        className,
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-300">
        <Dices className="size-3.5" />
      </span>
      <div className="flex items-center gap-1">
        <Button type="button" variant="secondary" size="sm" className="h-7 px-2 text-xs" disabled={paused} onClick={() => roll('power')}>
          {isFull ? 'Power' : '2d10'}
        </Button>
        {isFull && (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={paused} onClick={() => roll('heroic-resource')}>
            Resource
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={paused} onClick={() => roll('d6')}>
          d6
        </Button>
      </div>
      {isFull && (
        <label className="flex items-center gap-1 text-[13px] uppercase tracking-wider text-zinc-500">
          Mod
          <input
            type="number"
            value={modifier}
            onChange={(event) => setModifier(event.target.value)}
            className="h-7 w-14 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100"
          />
        </label>
      )}
      <div
        className="flex items-center overflow-hidden rounded border border-zinc-700"
        role="group"
        aria-label="Edge or bane (power rolls)"
      >
        {EDGE_BANE_OPTIONS.map((option) => {
          const active = option.value === edgeBane;
          const isEdge = option.value === 'edge' || option.value === 'double-edge';
          const isBane = option.value === 'bane' || option.value === 'double-bane';
          return (
            <button
              key={option.value}
              type="button"
              title={option.title}
              aria-pressed={active}
              onClick={() => setEdgeBane(option.value)}
              className={cn(
                'h-7 min-w-7 px-1.5 text-xs font-medium transition-colors',
                'border-l border-zinc-700 first:border-l-0',
                active
                  ? isEdge
                    ? 'bg-emerald-600 text-white'
                    : isBane
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
              )}
            >
              {option.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
