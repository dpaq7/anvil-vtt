import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { StateMessage, StatePanel } from '../components/StateMessage.js';

/*
 * A bad address while signed in (DESIGN.md section 9, Gate 4; demo `states`): a real
 * not-found page inside the app frame. It names the path and does not redirect.
 */
export function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <StatePanel>
        <StateMessage
          icon={<Home size={30} strokeWidth={2.4} />}
          title={<>No page at <span className="break-all">{location.pathname}</span></>}
          body="Check the spelling, or go back to your home page."
          go={{ label: 'Go to your home', onClick: () => navigate('/app') }}
          alt={{
            label: <><ArrowLeft size={16} strokeWidth={3} aria-hidden="true" />Back</>,
            onClick: () => navigate(-1),
          }}
        />
    </StatePanel>
  );
}
