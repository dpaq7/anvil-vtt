import { Link } from 'react-router-dom';
import { ArrowRight, Image as ImageIcon, PlayCircle } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@anvil/ui';
import type { CampaignData } from '../sessions/types.js';
import type { AssetItem, DashboardNote, LiveTable, RecentCharacter } from './types.js';
import { formatBytes, formatDate, initials, livePath, plainPreview } from './format.js';

export function CampaignCard({ campaign, isDirector }: { campaign: CampaignData; isDirector: boolean }) {
  const liveSession = campaign.sessions.find((session) => session.status === 'lobby' || session.status === 'active');
  const sceneLabel = campaign.scenes.length === 1 ? 'scene' : 'scenes';
  const sessionLabel = campaign.sessions.length === 1 ? 'session' : 'sessions';
  const memberCount = campaign.members.filter((member) => member.role === 'player').length;

  return (
    <Card className="border-zinc-800/80 bg-zinc-950/75 shadow-lg shadow-black/20 backdrop-blur-sm transition-colors hover:border-zinc-700">
      <CardHeader className="p-3 pb-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-sm font-semibold leading-5 text-zinc-100">
              {campaign.name}
            </CardTitle>
            <p className="mt-1 line-clamp-2 text-xs leading-4 text-zinc-500">
              {campaign.description || (isDirector ? 'No description yet.' : `Directed by ${campaign.director?.username ?? 'Director'}`)}
            </p>
          </div>
          {liveSession && (
            <Badge className="dashboard-tone-green shrink-0 text-[11px]">
              {liveSession.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-zinc-400">
          <span>{campaign.sessions.length} {sessionLabel}</span>
          {campaign.scenes.length > 0 && <span>{campaign.scenes.length} {sceneLabel}</span>}
          <span>{memberCount} players</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[11px] text-zinc-500">Last played {formatDate(campaign.last_played)}</span>
          <Button asChild variant="outline" size="sm">
            <Link to={isDirector ? `/app/campaigns/${campaign.id}` : '/app/live'}>
              <ArrowRight size={14} />
              Open
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function LiveTableCard({ table, isDirector }: { table: LiveTable; isDirector: boolean }) {
  return (
    <Card className="dashboard-border-green bg-zinc-950/75 shadow-lg shadow-black/20 backdrop-blur-sm">
      <CardContent className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PlayCircle size={15} className="dashboard-text-green shrink-0" />
            <p className="truncate text-sm font-semibold text-zinc-100">{table.session.name}</p>
          </div>
          <p className="mt-1 truncate text-xs text-zinc-500">{table.campaign.name}</p>
          {table.session.room_code && (
            <p className="dashboard-text-green mt-1.5 font-mono text-[11px]">{table.session.room_code}</p>
          )}
        </div>
        <Button asChild size="sm" variant="secondary" className="shrink-0">
          <Link to={isDirector ? livePath(table.session) : '/app/live'}>
            <ArrowRight size={14} />
            {isDirector ? 'Rejoin' : 'Join'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function CharacterCard({ character }: { character: RecentCharacter }) {
  return (
    <Card className="border-zinc-800/80 bg-zinc-950/75 shadow-lg shadow-black/20 backdrop-blur-sm">
      <CardContent className="flex items-center gap-2.5 p-3">
        <div className="dashboard-tone-amber flex size-9 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold">
          {initials(character.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">{character.name}</p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{character.detail}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary" className="text-[11px]">{character.badge}</Badge>
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link to={character.to} aria-label={`Open ${character.name}`}>
              <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function NoteCard({ note }: { note: DashboardNote }) {
  const preview = plainPreview(note.content);
  return (
    <Card className="border-zinc-800/80 bg-zinc-950/75 shadow-lg shadow-black/20 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">{note.title}</p>
            <p className="mt-1 truncate text-xs text-zinc-500">{note.campaignName}</p>
          </div>
          <span className="shrink-0 text-[11px] text-zinc-500">{formatDate(note.updatedAt)}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-4 text-zinc-400">
          {preview || 'Empty note'}
        </p>
      </CardContent>
    </Card>
  );
}

export function AssetCard({ asset, canOpenAssets }: { asset: AssetItem; canOpenAssets: boolean }) {
  const uploadedAt = formatDate(asset.uploaded_at ?? asset.created_at);
  const content = (
    <CardContent className="flex items-center gap-2.5 p-3">
      <div className="dashboard-tone-cyan flex size-9 shrink-0 items-center justify-center rounded-lg border">
        <ImageIcon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-100">{asset.name}</p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {asset.type} · {formatBytes(asset.file_size)} · {uploadedAt}
        </p>
      </div>
    </CardContent>
  );

  return (
    <Card className="border-zinc-800/80 bg-zinc-950/75 shadow-lg shadow-black/20 backdrop-blur-sm">
      {canOpenAssets ? <Link to="/app/assets">{content}</Link> : content}
    </Card>
  );
}
