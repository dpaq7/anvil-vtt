import { useCallback, useMemo, useState } from 'react';
import { MessageSquare, Dice5 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';
import { NegotiationLogic, skills } from '@anvil/data';
import type { MotivationType } from '@anvil/types';
import type { ArgumentLogEntry } from '../../types/protocol.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NegotiationMotivationRuntime {
  id: string;
  type: MotivationType;
  description: string;
  revealed: boolean;
}

export interface NegotiationPitfallRuntime {
  id: string;
  type: MotivationType;
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
      <div className="flex items-center gap-1.5">
        {Array.from({ length: max + 1 }, (_, i) => (
          <div
            key={i}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
              i <= current ? c.filled + ' text-white' : c.empty + ' text-zinc-500'
            }`}
          >
            {i}
          </div>
        ))}
      </div>
    </div>
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
  const skill = skills.find((s) => s.id === entry.skillId);
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
}: NegotiationStageProps) {
  // Clamp values for display
  const displayInterest = NegotiationLogic.clampInterest(interest, maxInterest);
  const displayPatience = NegotiationLogic.clampPatience(patience, maxPatience);
  const isActive = phase === 'active';

  // Player argument state
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [approachText, setApproachText] = useState<string>('');

  // Get interpersonal skills for negotiation
  const interpersonalSkills = useMemo(() => {
    return skills.filter((s) => s.group === 'interpersonal');
  }, []);

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

  const handleArgument = useCallback(() => {
    if (!selectedSkillId || !onMakeArgument) return;
    onMakeArgument(selectedSkillId, approachText);
    setApproachText('');
  }, [selectedSkillId, approachText, onMakeArgument]);

  // Get initials for avatar fallback
  const initials = useMemo(() => {
    return npcName
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [npcName]);

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto p-6">
      {/* Header: NPC Info + Tracks */}
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
        {/* NPC Card */}
        <Card className="w-full md:w-72">
          <CardContent className="flex flex-col items-center gap-3 pt-6">
            {/* Portrait */}
            {npcPortrait ? (
              <img
                src={npcPortrait}
                alt={npcName}
                className="h-20 w-20 rounded-full border-2 border-purple-500/50 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/20 text-2xl font-bold text-purple-400">
                {initials || '?'}
              </div>
            )}

            {/* Name & Attitude */}
            <div className="text-center">
              <h2 className="text-lg font-semibold text-zinc-100">{npcName}</h2>
              <span className="text-sm capitalize text-zinc-400">{npcAttitude}</span>
            </div>

            {/* Phase Badge */}
            {phase !== 'active' && (
              <span
                className={`rounded px-3 py-1 text-sm font-medium ${
                  phase === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {phase === 'success' ? 'DEAL REACHED' : 'NEGOTIATION FAILED'}
              </span>
            )}

            {/* Director Controls */}
            {isDirector && isActive && (
              <div className="mt-2 flex w-full flex-col gap-2 border-t border-zinc-700 pt-2">
                <div className="flex items-center justify-center gap-2">
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
                </div>
                <div className="flex items-center justify-center gap-2">
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
                  className="mt-2 bg-purple-600 hover:bg-purple-700"
                >
                  End Negotiation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracks */}
        <div className="flex flex-1 flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
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
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Player argument panel */}
      {!isDirector && isActive && onMakeArgument && (
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="size-4 text-purple-400" />
              Make an Argument
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* Skill picker — interpersonal skills are most relevant for negotiation */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                Interpersonal Skill
              </label>
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-purple-500"
              >
                <option value="">Choose a skill...</option>
                {interpersonalSkills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Approach text */}
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

            {/* Roll button */}
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
      )}

      {/* Motivations & Pitfalls */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Motivations */}
        <Card>
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

        {/* Pitfalls */}
        <Card>
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
      </div>

      {/* Argument log */}
      {argumentLog.length > 0 && (
        <div className="mx-auto w-full max-w-lg">
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

function formatMotivationType(type: MotivationType): string {
  const labels: Record<MotivationType, string> = {
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
