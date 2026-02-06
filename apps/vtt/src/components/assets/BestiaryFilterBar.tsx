import { X } from 'lucide-react';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@anvil/ui';

export interface BestiaryFilters {
  search: string;
  minLevel: number | null;
  maxLevel: number | null;
  role: string | null;
}

const ROLES = [
  'Ambusher',
  'Artillery',
  'Brute',
  'Controller',
  'Defender',
  'Harrier',
  'Hexer',
  'Leader',
  'Minion',
  'Solo',
  'Support',
] as const;

export interface BestiaryFilterBarProps {
  filters: BestiaryFilters;
  onChange: (filters: Partial<BestiaryFilters>) => void;
  onClear: () => void;
}

function hasActiveFilters(filters: BestiaryFilters): boolean {
  return !!(filters.search || filters.minLevel !== null || filters.maxLevel !== null || filters.role);
}

export function BestiaryFilterBar({ filters, onChange, onClear }: BestiaryFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-4 py-2">
      {/* Search */}
      <Input
        value={filters.search}
        onChange={(e) => onChange({ search: e.target.value })}
        placeholder="Search monsters..."
        className="h-8 w-[180px] text-xs"
      />

      {/* Level range */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-zinc-500">Lv</span>
        <Input
          type="number"
          min={1}
          max={20}
          value={filters.minLevel ?? ''}
          onChange={(e) => onChange({ minLevel: e.target.value ? Number(e.target.value) : null })}
          placeholder="1"
          className="h-8 w-[60px] text-xs"
        />
        <span className="text-xs text-zinc-500">-</span>
        <Input
          type="number"
          min={1}
          max={20}
          value={filters.maxLevel ?? ''}
          onChange={(e) => onChange({ maxLevel: e.target.value ? Number(e.target.value) : null })}
          placeholder="20"
          className="h-8 w-[60px] text-xs"
        />
      </div>

      {/* Role filter */}
      <Select
        value={filters.role ?? ''}
        onValueChange={(v) => onChange({ role: v || null })}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((role) => (
            <SelectItem key={role} value={role} className="text-xs">
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear */}
      {hasActiveFilters(filters) && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2">
          <X className="mr-1 size-3" />
          <span className="text-xs">Clear</span>
        </Button>
      )}
    </div>
  );
}
