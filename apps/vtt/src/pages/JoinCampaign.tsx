import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';
import { Unplug } from 'lucide-react';
import { api } from '../lib/api.js';
import { StateMessage, StatePage } from '../components/StateMessage.js';
import { LoadingSkeleton } from '../components/LoadingSkeleton.js';

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
  const [acceptError, setAcceptError] = useState<string | null>(null);

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
    setAcceptError(null);
    try {
      const result = await api.post<{ campaignId: string }>(`/api/invites/${token}/accept`);
      navigate(`/app/campaigns/${result.campaignId}`);
    } catch (e) {
      setAcceptError(e instanceof Error ? e.message : 'Failed to join');
      setJoining(false);
    }
  };

  // A bad invite (DESIGN.md section 4, Error; demo `states`): was bare red text.
  if (error) {
    return (
      <StatePage>
        <StateMessage
          icon={<Unplug size={30} strokeWidth={2.4} />}
          title="This invite link no longer works"
          body="Ask your Director for a new link, or use the room code they gave you."
          go={{ label: 'Join with a room code', onClick: () => navigate('/app/join') }}
        />
      </StatePage>
    );
  }

  if (!info) {
    return (
      <StatePage>
        <LoadingSkeleton variant="list" label="Checking the invite…" />
      </StatePage>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-canvas">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>{info.campaignName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm text-text">{info.campaignDescription}</p>
          <p className="mb-4 text-sm text-text-soft">Directed by {info.directorName}</p>
          <Button onClick={accept} disabled={joining} className="w-full">
            {joining ? 'Joining...' : 'Join Campaign'}
          </Button>
          {acceptError && (
            <Alert variant="destructive" className="mt-3">
              {acceptError}
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
