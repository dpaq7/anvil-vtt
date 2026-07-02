import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MessageSquare, Dice5 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, cn } from '@anvil/ui';
import { NegotiationLogic, findSkillByName, skills } from '@anvil/data';
import type { ArgumentLogEntry } from '../../types/protocol.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NegotiationMotivationRuntime {
  id: string;
  type: string;
  description: string;
  revealed: boolean;
}

export interface NegotiationPitfallRuntime {
  id: string;
  type: string;
  description: string;
  revealed: boolean;
}

export interface NegotiationStageProps {
  // NPC Info
  npcName: string;
  npcPortrait?: string;
  npcAttitude: string;

  // Tracks
  interest: number;
  patience: number;
  maxInterest?: number;
  maxPatience: number;

  // Phase
  phase: 'active' | 'success' | 'failure';

  // Motivations & Pitfalls
  motivations: NegotiationMotivationRuntime[];
  pitfalls: NegotiationPitfallRuntime[];

  // Outcome responses
  outcomes: Record<number, string>;

  // Role
  isDirector: boolean;

  // Argument log from server
  argumentLog?: ArgumentLogEntry[];

  // Callbacks (Director only)
  onInterestChange?: (delta: number) => void;
  onPatienceChange?: (delta: number) => void;
  onRevealMotivation?: (id: string) => void;
  onRevealPitfall?: (id: string) => void;
  onEndNegotiation?: () => void;

  // Player callback
  onMakeArgument?: (skillId: string, approachText: string) => void;
  availableSkillIds?: string[];
  showPlayerArgumentPanel?: boolean;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface TrackDotsProps {
  current: number;
  max: number;
  color: 'purple' | 'amber';
  label: string;
}

function TrackDots({ current, max, color, label }: TrackDotsProps) {
  const colorClasses = {
    purple: {
      filled: 'bg-purple-500',
      empty: 'bg-zinc-700',
      text: 'text-purple-400',
    },
    amber: {
      filled: 'bg-amber-500',
      empty: 'bg-zinc-700',
      text: 'text-amber-400',
    },
  };
  const c = colorClasses[color];

  return (
    <div className="flex flex-col gap-2">
      <span className={`text-xs font-medium uppercase tracking-wider ${c.text}`}>
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {Array.from({ length: max + 1 }, (_, i) => (
          <div
            key={i}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
              i <= current ? c.filled + ' text-zinc-50' : c.empty + ' text-zinc-500'
            }`}
          >
            {i}
          </div>
        ))}
      </div>
    </div>
  );
}

interface TargetPortraitProps {
  initials: string;
  npcName: string;
  npcPortrait?: string;
}

function TargetPortrait({ initials, npcName, npcPortrait }: TargetPortraitProps) {
  if (npcPortrait) {
    return (
      <img
        src={npcPortrait}
        alt={npcName}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-purple-500/20 text-6xl font-bold text-purple-300">
      {initials || '?'}
    </div>
  );
}

function TrackPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-4 pt-5">{children}</CardContent>
    </Card>
  );
}

interface MotivationItemProps {
  motivation: NegotiationMotivationRuntime;
  isDirector: boolean;
  onReveal?: () => void;
}

function MotivationItem({ motivation, isDirector, onReveal }: MotivationItemProps) {
  const typeLabel = formatMotivationType(motivation.type);

  if (!motivation.revealed) {
    return (
      <div className="flex items-center gap-2 rounded bg-zinc-800 px-3 py-2">
        <span className="text-sm text-zinc-500">? Hidden motivation</span>
        {isDirector && onReveal && (
          <Button variant="ghost" size="sm" onClick={onReveal} className="ml-auto">
            Reveal
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded bg-purple-500/10 px-3 py-2">
      <span className="text-sm font-medium text-purple-400">{typeLabel}</span>
      <p className="mt-1 text-sm text-zinc-300">{motivation.description}</p>
    </div>
  );
}

interface PitfallItemProps {
  pitfall: NegotiationPitfallRuntime;
  isDirector: boolean;
  onReveal?: () => void;
}

function PitfallItem({ pitfall, isDirector, onReveal }: PitfallItemProps) {
  const typeLabel = formatMotivationType(pitfall.type);

  if (!pitfall.revealed) {
    return (
      <div className="flex items-center gap-2 rounded bg-zinc-800 px-3 py-2">
        <span className="text-sm text-zinc-500">? Hidden pitfall</span>
        {isDirector && onReveal && (
          <Button variant="ghost" size="sm" onClick={onReveal} className="ml-auto">
            Reveal
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded bg-red-500/10 px-3 py-2">
      <span className="text-sm font-medium text-red-400">{typeLabel}</span>
      <p className="mt-1 text-sm text-zinc-300">{pitfall.description}</p>
    </div>
  );
}

function ArgumentLogItem({ entry }: { entry: ArgumentLogEntry }) {
  const skill = findSkillByName(entry.skillId);
  const deltaColor =
    entry.interestDelta > 0
      ? 'text-emerald-400'
      : entry.interestDelta < 0
        ? 'text-red-400'
        : 'text-zinc-500';

  return (
    <div className="rounded bg-zinc-800/50 px-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-zinc-200">{entry.playerName}</span>
        <span className="text-zinc-500">used</span>
        <span className="text-purple-400">{skill?.name ?? entry.skillId}</span>
        <span className="ml-auto text-xs text-zinc-500">
          {entry.roll} &rarr; T{entry.tier}
        </span>
        <span className={`text-xs font-medium ${deltaColor}`}>
          {entry.interestDelta > 0 ? '+' : ''}
          {entry.interestDelta} Int
        </span>
      </div>
      {entry.approachText && (
        <p className="mt-1 text-xs italic text-zinc-400">&ldquo;{entry.approachText}&rdquo;</p>
      )}
    </div>
  );
}

export interface NegotiationArgumentPanelProps {
  availableSkillIds?: string[];
  onMakeArgument: (skillId: string, approachText: string) => void;
  className?: string;
}

export function NegotiationArgumentPanel({
  availableSkillIds,
  onMakeArgument,
  className,
}: NegotiationArgumentPanelProps) {
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [approachText, setApproachText] = useState<string>('');
  const availableSkills = useMemo(() => resolveNegotiationSkills(availableSkillIds), [availableSkillIds]);

  useEffect(() => {
    if (selectedSkillId && !availableSkills.some((skill) => skill.id === selectedSkillId)) {
      setSelectedSkillId('');
    }
  }, [availableSkills, selectedSkillId]);

  const handleArgument = useCallback(() => {
    if (!selectedSkillId) return;
    onMakeArgument(selectedSkillId, approachText);
    setApproachText('');
  }, [selectedSkillId, approachText, onMakeArgument]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageSquare className="size-4 text-purple-400" />
          Make an Argument
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Hero Skill
          </label>
          <select
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-purple-500"
          >
            <option value="">Choose a skill...</option>
            {availableSkills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
          {availableSkillIds && availableSkills.length === 0 && (
            <p className="mt-1 text-[11px] text-zinc-500">This hero has no trained skills available.</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Your Approach (optional)
          </label>
          <textarea
            value={approachText}
            onChange={(e) => setApproachText(e.target.value)}
            placeholder="Describe how you're making your argument..."
            rows={2}
            className="w-full resize-none rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-purple-500"
          />
        </div>

        <Button
          onClick={handleArgument}
          disabled={!selectedSkillId}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Dice5 className="mr-1.5 size-4" />
          Make Argument
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function NegotiationStage({
  npcName,
  npcPortrait,
  npcAttitude,
  interest,
  patience,
  maxInterest = 5,
  maxPatience,
  phase,
  motivations,
  pitfalls,
  outcomes,
  isDirector,
  argumentLog = [],
  onInterestChange,
  onPatienceChange,
  onRevealMotivation,
  onRevealPitfall,
  onEndNegotiation,
  onMakeArgument,
  availableSkillIds,
  showPlayerArgumentPanel = true,
}: NegotiationStageProps) {
  // Clamp values for display
  const displayInterest = NegotiationLogic.clampInterest(interest, maxInterest);
  const displayPatience = NegotiationLogic.clampPatience(patience, maxPatience);
  const isActive = phase === 'active';

  // Get outcome text based on current interest
  const outcomeText = useMemo(() => {
    const level = Math.max(0, Math.min(5, Math.round(interest)));
    return outcomes[level] ?? '';
  }, [interest, outcomes]);

  // Get interest level label
  const interestLabel = useMemo(() => {
    return NegotiationLogic.getInterestDescription(displayInterest);
  }, [displayInterest]);

  // Handlers
  const handleInterestUp = useCallback(() => {
    if (interest < maxInterest) onInterestChange?.(1);
  }, [interest, maxInterest, onInterestChange]);

  const handleInterestDown = useCallback(() => {
    if (interest > 0) onInterestChange?.(-1);
  }, [interest, onInterestChange]);

  const handlePatienceUp = useCallback(() => {
    if (patience < maxPatience) onPatienceChange?.(1);
  }, [patience, maxPatience, onPatienceChange]);

  const handlePatienceDown = useCallback(() => {
    if (patience > 0) onPatienceChange?.(-1);
  }, [patience, onPatienceChange]);

  // Get initials for avatar fallback
  const initials = useMemo(() => {
    return npcName
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [npcName]);

  const renderMotivationsPanel = (className?: string) => (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-purple-400">Motivations</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {motivations.length === 0 ? (
          <p className="text-sm text-zinc-500">No motivations configured</p>
        ) : (
          motivations.map((m) => (
            <MotivationItem
              key={m.id}
              motivation={m}
              isDirector={isDirector}
              onReveal={() => onRevealMotivation?.(m.id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );

  const renderPitfallsPanel = (className?: string) => (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-red-400">Pitfalls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {pitfalls.length === 0 ? (
          <p className="text-sm text-zinc-500">No pitfalls configured</p>
        ) : (
          pitfalls.map((p) => (
            <PitfallItem
              key={p.id}
              pitfall={p}
              isDirector={isDirector}
              onReveal={() => onRevealPitfall?.(p.id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-full flex-col gap-5 overflow-auto p-5 lg:p-6">
      <div className="grid w-full gap-5 md:grid-cols-[minmax(160px,1fr)_minmax(280px,360px)_minmax(160px,1fr)] md:items-start">
        <div className="order-2 flex flex-col gap-5 md:order-1">
          <TrackPanel>
            <TrackDots
              current={displayInterest}
              max={maxInterest}
              color="purple"
              label="Interest"
            />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-400">Current outcome:</span>
              <span
                className={`rounded px-2 py-0.5 font-medium ${getInterestLevelColor(displayInterest)}`}
              >
                {interestLabel}
              </span>
            </div>
          </TrackPanel>

          {renderMotivationsPanel('hidden md:block')}
        </div>

        <Card className="order-1 overflow-hidden md:order-2">
          <CardContent className="p-0">
            <div className="relative aspect-[4/5] min-h-[300px] overflow-hidden bg-zinc-950 sm:min-h-[360px] md:min-h-[400px]">
              <TargetPortrait
                initials={initials}
                npcName={npcName}
                npcPortrait={npcPortrait}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-transparent p-5 text-center">
                <h2 className="text-2xl font-semibold leading-tight text-zinc-100">
                  {npcName}
                </h2>
                <span className="mt-1 block text-sm capitalize text-zinc-300">
                  {npcAttitude}
                </span>
                {phase !== 'active' && (
                  <span
                    className={`mt-3 inline-flex rounded px-3 py-1 text-sm font-medium ${
                      phase === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {phase === 'success' ? 'DEAL REACHED' : 'NEGOTIATION FAILED'}
                  </span>
                )}
              </div>
            </div>

            {isDirector && isActive && (
              <div className="grid gap-2 border-t border-zinc-800 bg-zinc-950/70 p-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInterestDown}
                    disabled={interest <= 0}
                  >
                    -Int
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInterestUp}
                    disabled={interest >= maxInterest}
                  >
                    +Int
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePatienceDown}
                    disabled={patience <= 0}
                  >
                    -Pat
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePatienceUp}
                    disabled={patience >= maxPatience}
                  >
                    +Pat
                  </Button>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onEndNegotiation}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  End Negotiation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="order-3 flex flex-col gap-5">
          <TrackPanel>
            <TrackDots
              current={displayPatience}
              max={maxPatience}
              color="amber"
              label="Patience"
            />
            <p className="text-sm text-zinc-400">
              {displayPatience === 0
                ? 'NPC has lost patience - negotiation ends!'
                : `${displayPatience} argument${displayPatience === 1 ? '' : 's'} remaining`}
            </p>
          </TrackPanel>

          {renderPitfallsPanel('hidden md:block')}
        </div>
      </div>

      <div className="grid gap-5 md:hidden">
        {renderMotivationsPanel()}
        {renderPitfallsPanel()}
      </div>

      {/* Player argument panel */}
      {!isDirector && isActive && onMakeArgument && showPlayerArgumentPanel && (
        <div className="mx-auto w-full max-w-xl">
          <NegotiationArgumentPanel availableSkillIds={availableSkillIds} onMakeArgument={onMakeArgument} />
        </div>
      )}

      {/* Argument log */}
      {argumentLog.length > 0 && (
        <div className="mx-auto w-full max-w-3xl">
          <p className="mb-2 text-sm font-medium text-zinc-300">Argument Log</p>
          <div className="flex flex-col gap-1">
            {argumentLog
              .slice()
              .reverse()
              .map((entry) => (
                <ArgumentLogItem key={entry.id} entry={entry} />
              ))}
          </div>
        </div>
      )}

      {/* Outcome Display */}
      {phase !== 'active' && outcomeText && (
        <Card>
          <CardHeader>
            <CardTitle>Outcome</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded bg-zinc-800 p-4">
              <p className="mb-2">
                <span
                  className={`rounded px-2 py-0.5 text-sm font-medium ${getInterestLevelColor(displayInterest)}`}
                >
                  {interestLabel}
                </span>
              </p>
              <p className="italic text-zinc-300">&ldquo;{outcomeText}&rdquo;</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMotivationType(type: string): string {
  const labels: Record<string, string> = {
    benevolence: 'Benevolence',
    discovery: 'Discovery',
    freedom: 'Freedom',
    greed: 'Greed',
    higher_authority: 'Higher Authority',
    justice: 'Justice',
    legacy: 'Legacy',
    peace: 'Peace',
    power: 'Power',
    protection: 'Protection',
    revelry: 'Revelry',
    vengeance: 'Vengeance',
  };
  return labels[type] ?? type;
}

function getInterestLevelColor(level: number): string {
  if (level <= 1) return 'bg-red-500/20 text-red-400';
  if (level === 2) return 'bg-orange-500/20 text-orange-400';
  if (level === 3) return 'bg-yellow-500/20 text-yellow-400';
  if (level === 4) return 'bg-emerald-500/20 text-emerald-400';
  return 'bg-blue-500/20 text-blue-400';
}

function resolveNegotiationSkills(availableSkillIds?: string[]) {
  if (!availableSkillIds) {
    return skills.filter((skill) => skill.group === 'interpersonal');
  }

  const seen = new Set<string>();
  return availableSkillIds.flatMap((skillId) => {
    const skill = findSkillByName(skillId);
    if (!skill || seen.has(skill.id)) return [];
    seen.add(skill.id);
    return [skill];
  });
}
