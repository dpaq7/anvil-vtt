import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { StateMessage, StatePanel } from './StateMessage.js';

/* A bad campaign link (DESIGN.md section 9, Gate 4; demo `states`): was "Loading…" for ever. */
export function CampaignNotFound() {
  const navigate = useNavigate();
  return (
    <StatePanel>
        <StateMessage
          icon={<BookOpen size={30} strokeWidth={2.4} />}
          title="No campaign at this link"
          body="It may have been deleted, or it belongs to another account."
          go={{ label: 'Your campaigns', onClick: () => navigate('/app/campaigns') }}
        />
    </StatePanel>
  );
}
