import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Archive,
  BookOpen,
  Check,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { Badge, Button, Input } from '@anvil/ui';
import type { HeroSummary } from '@anvil/types';
import { api } from '../../lib/api.js';
import {
  normalizeInventory,
  type CharacterInventoryItem,
} from '../../lib/inventory.js';
import {
  EmptyState,
  LoadingPanel,
  SectionHeader,
  StatCard,
} from './shared.js';
import {
  mobileContainerClass,
  parseJson,
  parseList,
  titleCase,
} from './shared-utils.js';

interface HeroRow {
  id: string;
  name: string;
  ancestry: string | null;
  culture: string | null;
  career: string | null;
  hero_class: string | null;
  subclass: string | null;
  level: number;
  characteristics: string;
  kit: string | null;
  skills: string;
  abilities: string;
  portrait_asset_id: string | null;
  portrait_url: string | null;
  data: string;
}

interface TrackerValues {
  staminaCurrent: number;
  recoveriesCurrent: number;
  victories: number;
  xp: number;
}

type TrackerKey = keyof TrackerValues;

const TRACKER_PERSIST_DELAY_MS = 700;

function TrackerRow({
  label,
  value,
  max,
  onAdjust,
}: {
  label: string;
  value: number;
  max: number | null;
  onAdjust: (delta: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="mt-1 text-xl font-semibold text-zinc-100">
          {value}
          {max !== null && <span className="text-sm text-zinc-500"> / {max}</span>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-11"
          aria-label={`Decrease ${label}`}
          disabled={value <= 0}
          onClick={() => onAdjust(-1)}
        >
          <Minus className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-11"
          aria-label={`Increase ${label}`}
          disabled={max !== null && value >= max}
          onClick={() => onAdjust(1)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function InventoryEditor({
  inventory,
  onChange,
}: {
  inventory: CharacterInventoryItem[];
  onChange: (next: CharacterInventoryItem[]) => void;
}) {
  const [newItemName, setNewItemName] = useState('');

  const handleAdd = () => {
    const name = newItemName.trim();
    if (!name) return;
    const [item] = normalizeInventory([
      { name, quantity: 1, source: 'custom', category: 'misc' },
    ]);
    if (!item) return;
    onChange([...inventory, item]);
    setNewItemName('');
  };

  const handleQuantity = (itemId: string, delta: number) => {
    onChange(
      inventory.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {inventory.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm text-zinc-500">
          Empty
        </p>
      ) : (
        <div className="grid gap-2">
          {inventory.map((item) => (
            <div key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-zinc-100">
                  {item.name}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label={`Decrease ${item.name} quantity`}
                    disabled={item.quantity <= 1}
                    onClick={() => handleQuantity(item.id, -1)}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Badge variant="secondary">x{item.quantity}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label={`Increase ${item.name} quantity`}
                    onClick={() => handleQuantity(item.id, 1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-red-400 hover:text-red-300"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => onChange(inventory.filter((entry) => entry.id !== item.id))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={newItemName}
          onChange={(event) => setNewItemName(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleAdd();
          }}
          placeholder="Add item"
          className="h-11 flex-1"
        />
        <Button
          variant="secondary"
          className="h-11"
          disabled={!newItemName.trim()}
          onClick={handleAdd}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

export function MobileHeroDetail() {
  const { id } = useParams<{ id: string }>();
  const [hero, setHero] = useState<HeroRow | null>(null);
  const [summary, setSummary] = useState<HeroSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [trackers, setTrackers] = useState<TrackerValues | null>(null);
  const [inventory, setInventory] = useState<CharacterInventoryItem[] | null>(null);
  const pendingTrackerKeys = useRef<Set<TrackerKey>>(new Set());
  const trackerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTrackers = useRef<TrackerValues | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setError(null);
    Promise.all([
      api.get<HeroRow>(`/api/heroes/${id}`),
      api.get<HeroSummary[]>('/api/heroes').catch(() => []),
    ])
      .then(([row, summaries]) => {
        if (cancelled) return;
        const heroSummary = summaries.find((item) => item.id === row.id) ?? null;
        setHero(row);
        setSummary(heroSummary);
        const data = parseJson<Record<string, unknown>>(row.data, {});
        setInventory(normalizeInventory(data['inventory']));
        if (heroSummary) {
          setTrackers({
            staminaCurrent:
              heroSummary.staminaCurrent ?? heroSummary.staminaMax ?? 0,
            recoveriesCurrent:
              heroSummary.recoveriesCurrent ?? heroSummary.recoveriesMax ?? 0,
            victories: heroSummary.victories ?? 0,
            xp: heroSummary.xp ?? 0,
          });
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const details = useMemo(() => {
    if (!hero) return null;
    const characteristics = parseJson<Record<string, number>>(hero.characteristics, {});
    const skills = parseList(hero.skills);
    const abilities = parseList(hero.abilities);
    return { characteristics, skills, abilities };
  }, [hero]);

  const persistTrackers = useCallback(() => {
    const values = latestTrackers.current;
    const keys = [...pendingTrackerKeys.current];
    if (!hero || !values || keys.length === 0) return;
    pendingTrackerKeys.current.clear();
    const data: Record<string, number> = {};
    for (const key of keys) data[key] = values[key];
    api.put(`/api/heroes/${hero.id}`, { data }).catch((err: Error) => {
      toast.error(err.message || 'Failed to save trackers');
    });
  }, [hero]);

  const adjustTracker = useCallback(
    (key: TrackerKey, delta: number, max: number | null) => {
      setTrackers((current) => {
        if (!current) return current;
        const upper = max ?? 9999;
        const next = {
          ...current,
          [key]: Math.max(0, Math.min(upper, current[key] + delta)),
        };
        latestTrackers.current = next;
        return next;
      });
      pendingTrackerKeys.current.add(key);
      if (trackerTimer.current) clearTimeout(trackerTimer.current);
      trackerTimer.current = setTimeout(persistTrackers, TRACKER_PERSIST_DELAY_MS);
    },
    [persistTrackers],
  );

  // Flush pending tracker writes when leaving the page.
  useEffect(
    () => () => {
      if (trackerTimer.current) clearTimeout(trackerTimer.current);
      persistTrackers();
    },
    [persistTrackers],
  );

  const handleSaveName = async () => {
    if (!hero) return;
    const name = nameDraft.trim();
    if (!name || name === hero.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await api.put(`/api/heroes/${hero.id}`, { name });
      setHero({ ...hero, name });
      setEditingName(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rename hero');
    } finally {
      setSavingName(false);
    }
  };

  const handleInventoryChange = (next: CharacterInventoryItem[]) => {
    if (!hero) return;
    const previous = inventory;
    setInventory(next);
    api.put(`/api/heroes/${hero.id}`, { data: { inventory: next } }).catch((err: Error) => {
      setInventory(previous);
      toast.error(err.message || 'Failed to save inventory');
    });
  };

  if (error) {
    return (
      <div className={mobileContainerClass()}>
        <EmptyState icon={User} title="Character unavailable" detail={error} />
      </div>
    );
  }
  if (!hero || !details || !inventory) return <LoadingPanel />;

  const portraitUrl =
    hero.portrait_asset_id ? `/api/assets/${hero.portrait_asset_id}/data` : hero.portrait_url;
  const staminaMax = summary?.staminaMax ?? null;
  const recoveriesMax = summary?.recoveriesMax ?? null;

  return (
    <div className={mobileContainerClass()}>
      <Link to="/app/mobile/heroes" className="text-sm text-zinc-400">
        Characters
      </Link>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-3xl font-semibold text-zinc-500">
            {portraitUrl ? (
              <img src={portraitUrl} alt="" className="size-full object-cover" />
            ) : (
              hero.name.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void handleSaveName();
                    if (event.key === 'Escape') setEditingName(false);
                  }}
                  className="h-11 flex-1 text-base font-semibold"
                  autoFocus
                />
                <Button
                  size="icon"
                  className="size-11 shrink-0"
                  aria-label="Save name"
                  disabled={savingName || !nameDraft.trim()}
                  onClick={() => void handleSaveName()}
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-11 shrink-0"
                  aria-label="Cancel rename"
                  disabled={savingName}
                  onClick={() => setEditingName(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="min-w-0 truncate text-2xl font-semibold text-zinc-100">
                  {hero.name}
                </h1>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-9 shrink-0 text-zinc-400"
                  aria-label="Rename hero"
                  onClick={() => {
                    setNameDraft(hero.name);
                    setEditingName(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
              </div>
            )}
            <p className="mt-1 text-sm text-zinc-400">
              {titleCase(hero.hero_class)} / Level {hero.level}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {titleCase(hero.subclass)} / {titleCase(hero.ancestry)}
            </p>
          </div>
        </div>
      </div>

      {trackers ? (
        <section className="flex flex-col gap-2">
          <SectionHeader label="Trackers" />
          <TrackerRow
            label="Stamina"
            value={trackers.staminaCurrent}
            max={staminaMax}
            onAdjust={(delta) => adjustTracker('staminaCurrent', delta, staminaMax)}
          />
          <TrackerRow
            label="Recoveries"
            value={trackers.recoveriesCurrent}
            max={recoveriesMax}
            onAdjust={(delta) => adjustTracker('recoveriesCurrent', delta, recoveriesMax)}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <TrackerRow
              label="Victories"
              value={trackers.victories}
              max={null}
              onAdjust={(delta) => adjustTracker('victories', delta, 99)}
            />
            <TrackerRow
              label="XP"
              value={trackers.xp}
              max={null}
              onAdjust={(delta) => adjustTracker('xp', delta, null)}
            />
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Stamina" value="Unknown" Icon={Shield} />
          <StatCard label="Recoveries" value="Unknown" Icon={RefreshCw} />
          <StatCard label="Victories" value={0} Icon={Archive} />
          <StatCard label="XP" value={0} Icon={BookOpen} />
        </div>
      )}

      <section className="flex flex-col gap-2">
        <SectionHeader label="Characteristics" />
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(details.characteristics).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
              <p className="text-xs capitalize text-zinc-500">{key}</p>
              <p className="mt-1 text-xl font-semibold text-zinc-100">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader label="Skills" />
        {details.skills.length === 0 ? (
          <p className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm text-zinc-500">
            None listed
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {details.skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader label="Abilities" />
        {details.abilities.length === 0 ? (
          <p className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm text-zinc-500">
            None listed
          </p>
        ) : (
          <div className="grid gap-2">
            {details.abilities.map((ability) => (
              <div
                key={ability}
                className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm text-zinc-200"
              >
                {titleCase(ability)}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader label="Inventory" />
        <InventoryEditor inventory={inventory} onChange={handleInventoryChange} />
      </section>
    </div>
  );
}
