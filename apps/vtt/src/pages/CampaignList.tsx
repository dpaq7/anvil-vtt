import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardContent, Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose, Input } from '@anvil/ui';
import { api } from '../lib/api.js';

interface Campaign {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  created_at: string;
}

export function CampaignList() {
  const [directed, setDirected] = useState<Campaign[]>([]);
  const [joined, setJoined] = useState<Campaign[]>([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    const data = await api.get<{ directed: Campaign[]; joined: Campaign[] }>('/api/campaigns');
    setDirected(data.directed);
    setJoined(data.joined);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createCampaign = async () => {
    if (!newName.trim()) return;
    await api.post('/api/campaigns', { name: newName, description: newDesc });
    setNewName('');
    setNewDesc('');
    setDialogOpen(false);
    await load();
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Campaign</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>New Campaign</DialogTitle>
            <div className="mt-4 flex flex-col gap-4">
              <Input placeholder="Campaign name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button onClick={createCampaign}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {directed.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">My Campaigns</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {directed.map((c) => (
              <Link key={c.id} to={`/app/campaigns/${c.id}`}>
                <Card className="transition hover:border-zinc-600">
                  <CardHeader>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                  </CardHeader>
                  {c.description && (
                    <CardContent>
                      <p className="text-sm text-zinc-400">{c.description}</p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {joined.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">Joined Campaigns</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {joined.map((c) => (
              <Link key={c.id} to={`/app/campaigns/${c.id}`}>
                <Card className="transition hover:border-zinc-600">
                  <CardHeader>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                  </CardHeader>
                  {c.description && (
                    <CardContent>
                      <p className="text-sm text-zinc-400">{c.description}</p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {directed.length === 0 && joined.length === 0 && (
        <p className="text-zinc-500">No campaigns yet. Create one to get started.</p>
      )}
    </div>
  );
}
