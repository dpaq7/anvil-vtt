import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Input, Button } from '@anvil/ui';
import { RespiteLogic } from '@anvil/data';
import type { CreateActivityCardInput, ActivityCardType } from '@anvil/types';

// ── Activity metadata ──

interface ActivityInfo {
  type: ActivityCardType;
  name: string;
  description: string;
  hasPoints: boolean;
  defaultPointsTotal?: number;
}

const ACTIVITY_INFO: ActivityInfo[] = [
  {
    type: 'recover',
    name: 'Recover',
    description:
      'Spend a recovery to regain stamina. At the end of respite, stamina is fully restored regardless.',
    hasPoints: false,
  },
  {
    type: 'craft',
    name: 'Craft',
    description:
      'Work on crafting an item or improving equipment. Make a project roll to accumulate points.',
    hasPoints: true,
    defaultPointsTotal: 30,
  },
  {
    type: 'research',
    name: 'Research',
    description:
      'Study lore, analyze clues, or investigate a mystery. Make a project roll to accumulate research points.',
    hasPoints: true,
    defaultPointsTotal: 30,
  },
  {
    type: 'socialize',
    name: 'Socialize',
    description:
      'Spend time with allies and build relationships. Gain a social benefit or advance a negotiation.',
    hasPoints: false,
  },
  {
    type: 'change_kit',
    name: 'Change Kit',
    description:
      'Switch to a different kit. The new kit takes effect immediately.',
    hasPoints: false,
  },
  {
    type: 'project',
    name: 'Work on Project',
    description:
      'Continue work on a long-term project. Roll to accumulate project points toward the goal.',
    hasPoints: true,
    defaultPointsTotal: 50,
  },
  {
    type: 'custom',
    name: 'Custom Activity',
    description:
      'A Director-defined activity outside the standard options.',
    hasPoints: false,
  },
];

export interface RespiteActivityListProps {
  onSelect: (input: CreateActivityCardInput) => void;
}

export function RespiteActivityList({ onSelect }: RespiteActivityListProps) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? ACTIVITY_INFO.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.description.toLowerCase().includes(search.toLowerCase()),
      )
    : ACTIVITY_INFO;

  const handleSelect = (activity: ActivityInfo) => {
    const input: CreateActivityCardInput = {
      activityName: activity.name,
      activityType: activity.type,
      pointsTotal: activity.hasPoints ? activity.defaultPointsTotal : undefined,
    };
    onSelect(input);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-400">Add Activity</p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-zinc-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search activities..."
          className="h-7 pl-7 text-xs"
        />
      </div>

      {/* Activity list */}
      <div className="flex flex-col gap-1.5">
        {filtered.map((activity) => (
          <Card
            key={activity.type}
            className="cursor-pointer transition hover:border-zinc-600"
            onClick={() => handleSelect(activity)}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xs font-semibold">
                    {activity.name}
                  </CardTitle>
                  {activity.hasPoints && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      Project
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] leading-tight text-zinc-500">
                  {activity.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="size-6 shrink-0 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(activity);
                }}
              >
                <Plus className="size-3.5" />
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-4 text-center text-xs text-zinc-500">
          No activities match your search.
        </p>
      )}
    </div>
  );
}
