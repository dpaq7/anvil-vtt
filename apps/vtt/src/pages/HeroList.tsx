import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardContent, Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose } from '@anvil/ui';
import { api } from '../lib/api.js';

interface HeroSummary {
  id: string;
  name: string;
  ancestry: string | null;
  hero_class: string | null;
  subclass: string | null;
  level: number;
  portrait_url: string | null;
}

export function HeroList() {
  const [heroes, setHeroes] = useState<HeroSummary[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<HeroSummary | null>(null);

  const load = useCallback(async () => {
    const data = await api.get<HeroSummary[]>('/api/heroes');
    setHeroes(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/api/heroes/${deleteTarget.id}`);
    setDeleteTarget(null);
    await load();
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Heroes</h1>
        <Link to="/app/heroes/new">
          <Button>Create Hero</Button>
        </Link>
      </div>

      {heroes.length === 0 ? (
        <p className="text-zinc-500">No heroes yet. Create one to get started.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {heroes.map((h) => (
            <div key={h.id} className="flex items-center gap-4">
              <Link to={`/app/heroes/${h.id}`} className="flex-1">
                <Card className="transition hover:border-zinc-600">
                  <CardHeader className="flex-row items-center gap-4 space-y-0 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-zinc-500">
                      {h.portrait_url ? (
                        <img src={h.portrait_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg">{(h.name?.[0] ?? '?').toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{h.name}</CardTitle>
                      <p className="text-sm text-zinc-400">
                        {[h.hero_class, h.subclass].filter(Boolean).join(' — ') || 'No class'}
                        {' · '}Level {h.level}
                      </p>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
              <Button
                variant="ghost"
                className="shrink-0 text-zinc-500 hover:text-red-400"
                onClick={() => setDeleteTarget(h)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogTitle>Delete Hero</DialogTitle>
          <p className="mt-2 text-sm text-zinc-400">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
