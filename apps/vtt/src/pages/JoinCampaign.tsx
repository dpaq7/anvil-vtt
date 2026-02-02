import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';
import { api } from '../lib/api.js';

interface InviteInfo {
  campaignId: string;
  campaignName: string;
  campaignDescription: string;
  directorName: string;
}

export function JoinCampaign() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .get<InviteInfo>(`/api/invites/${token}`)
      .then(setInfo)
      .catch((e: Error) => setError(e.message));
  }, [token]);

  const accept = async () => {
    if (!token) return;
    setJoining(true);
    try {
      const result = await api.post<{ campaignId: string }>(`/api/invites/${token}/accept`);
      navigate(`/app/campaigns/${result.campaignId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join');
      setJoining(false);
    }
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-red-400">
        {error}
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading invite...
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>{info.campaignName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm text-zinc-400">{info.campaignDescription}</p>
          <p className="mb-4 text-sm text-zinc-500">Directed by {info.directorName}</p>
          <Button onClick={accept} disabled={joining} className="w-full">
            {joining ? 'Joining...' : 'Join Campaign'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
