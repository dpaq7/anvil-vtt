interface TurnActionsProps {
  usedActions: string[];
  isCurrentTurn: boolean;
}

const ACTION_TYPES = [
  { type: 'action', label: 'Action', color: 'blue' },
  { type: 'maneuver', label: 'Maneuver', color: 'green' },
  { type: 'triggered', label: 'Triggered', color: 'amber' },
  { type: 'free', label: 'Free', color: 'purple' },
] as const;

export function TurnActions({ usedActions, isCurrentTurn }: TurnActionsProps) {
  if (!isCurrentTurn) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase text-zinc-500">Turn Actions</p>
      <div className="flex gap-2">
        {ACTION_TYPES.map(({ type, label, color }) => {
          const used = usedActions.includes(type);
          return (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className={`h-3 w-3 rounded-sm border ${
                  used
                    ? `border-${color}-400 bg-${color}-400`
                    : `border-zinc-600 bg-zinc-800`
                }`}
              />
              <span className={`text-[10px] ${used ? 'text-zinc-400 line-through' : 'text-zinc-300'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
