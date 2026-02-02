import { SceneTypeIcon, SCENE_COLORS, cn } from '@anvil/ui';
import type { SceneType } from '@anvil/ui';
import type { ConnectionStatus } from '../../hooks/useSessionSocket.js';

interface StatusBarProps {
  sceneType: SceneType | null;
  connectionStatus: ConnectionStatus;
  participantCount: number;
}

const CONNECTION_LABELS: Record<ConnectionStatus, { label: string; color: string }> = {
  connected: { label: 'Connected', color: 'text-emerald-400' },
  connecting: { label: 'Connecting...', color: 'text-amber-400' },
  reconnecting: { label: 'Reconnecting...', color: 'text-amber-400' },
  disconnected: { label: 'Disconnected', color: 'text-red-400' },
};

export function StatusBar({ sceneType, connectionStatus, participantCount }: StatusBarProps) {
  const conn = CONNECTION_LABELS[connectionStatus];
  return (
    <div className="flex h-full items-center gap-4 text-xs">
      {/* Scene type */}
      {sceneType && (
        <span className={cn('flex items-center gap-1', SCENE_COLORS[sceneType])}>
          <SceneTypeIcon type={sceneType} className="text-xs" />
          <span className="capitalize">{sceneType}</span>
        </span>
      )}

      {/* Connection */}
      <span className={cn('flex items-center gap-1', conn.color)}>
        <span className={cn('inline-block h-1.5 w-1.5 rounded-full', conn.color === 'text-emerald-400' ? 'bg-emerald-400' : conn.color === 'text-red-400' ? 'bg-red-400' : 'bg-amber-400')} />
        {conn.label}
      </span>

      {/* Participants */}
      <span className="text-zinc-500">
        {participantCount} participant{participantCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
