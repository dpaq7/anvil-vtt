import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Landing } from './pages/Landing.js';
import { Auth } from './pages/Auth.js';
import { ProtectedRoute } from './pages/ProtectedRoute.js';
import { CampaignList } from './pages/CampaignList.js';
import { CampaignBuilder } from './pages/CampaignBuilder.js';
import { HeroList } from './pages/HeroList.js';
import { HeroWizard } from './pages/HeroWizard.js';
import { HeroSheet } from './pages/HeroSheet.js';
import { JoinCampaign } from './pages/JoinCampaign.js';
import { JoinSession } from './pages/JoinSession.js';
import { Lobby } from './pages/Lobby.js';
import { SessionPage } from './pages/session/SessionPage.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { AppShell } from '@anvil/ui';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/join/:token',
    element: (
      <ProtectedRoute>
        <JoinCampaign />
      </ProtectedRoute>
    ),
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <ErrorBoundary label="app">
          <AppShell>
            <Outlet />
          </AppShell>
        </ErrorBoundary>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/campaigns" replace />,
      },
      {
        path: 'campaigns',
        element: <CampaignList />,
      },
      {
        path: 'campaigns/:id',
        element: <CampaignBuilder />,
      },
      {
        path: 'heroes',
        element: <HeroList />,
      },
      {
        path: 'heroes/new',
        element: <HeroWizard />,
      },
      {
        path: 'heroes/:id',
        element: <HeroSheet />,
      },
      {
        path: 'join/:code?',
        element: <JoinSession />,
      },
      {
        path: 'session/:id/lobby',
        element: <Lobby />,
      },
    ],
  },
  {
    path: '/app/session/:id',
    element: (
      <ProtectedRoute>
        <SessionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
