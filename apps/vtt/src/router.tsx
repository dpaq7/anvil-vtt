import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './pages/ProtectedRoute.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';

const Landing = lazy(() => import('./pages/Landing.js').then((module) => ({ default: module.Landing })));
const About = lazy(() => import('./pages/About.js').then((module) => ({ default: module.About })));
const Auth = lazy(() => import('./pages/Auth.js').then((module) => ({ default: module.Auth })));
const JoinCampaign = lazy(() => import('./pages/JoinCampaign.js').then((module) => ({ default: module.JoinCampaign })));
const AppLayout = lazy(() => import('./components/layout/AppLayout.js').then((module) => ({ default: module.AppLayout })));
const CampaignList = lazy(() => import('./pages/CampaignList.js').then((module) => ({ default: module.CampaignList })));
const CampaignBuilder = lazy(() => import('./pages/CampaignBuilder.js').then((module) => ({ default: module.CampaignBuilder })));
const HeroList = lazy(() => import('./pages/HeroList.js').then((module) => ({ default: module.HeroList })));
const HeroWizard = lazy(() => import('./pages/HeroWizard.js').then((module) => ({ default: module.HeroWizard })));
const HeroSheet = lazy(() => import('./pages/HeroSheet.js').then((module) => ({ default: module.HeroSheet })));
const JoinSession = lazy(() => import('./pages/JoinSession.js').then((module) => ({ default: module.JoinSession })));
const Lobby = lazy(() => import('./pages/Lobby.js').then((module) => ({ default: module.Lobby })));
const Home = lazy(() => import('./pages/Home.js').then((module) => ({ default: module.Home })));
const Assets = lazy(() => import('./pages/Assets.js').then((module) => ({ default: module.Assets })));
const Notes = lazy(() => import('./pages/Notes.js').then((module) => ({ default: module.Notes })));
const Account = lazy(() => import('./pages/Account.js').then((module) => ({ default: module.Account })));
const SessionPage = lazy(() => import('./pages/session/SessionPage.js').then((module) => ({ default: module.SessionPage })));
const LivePage = lazy(() => import('./pages/LivePage.js').then((module) => ({ default: module.LivePage })));

const routeFallback = (
  <div className="flex h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-400">
    Loading...
  </div>
);

function routeChunk(element: ReactNode) {
  return <Suspense fallback={routeFallback}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: routeChunk(<Landing />),
  },
  {
    path: '/about',
    element: routeChunk(<About />),
  },
  {
    path: '/auth',
    element: routeChunk(<Auth />),
  },
  {
    path: '/join/:token',
    element: (
      <ProtectedRoute>
        {routeChunk(<JoinCampaign />)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <ErrorBoundary label="app">
          {routeChunk(<AppLayout />)}
        </ErrorBoundary>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: routeChunk(<Home />),
      },
      {
        path: 'live',
        element: routeChunk(<LivePage />),
      },
      {
        path: 'campaigns',
        element: routeChunk(<CampaignList />),
      },
      {
        path: 'assets',
        element: routeChunk(<Assets />),
      },
      {
        path: 'notes',
        element: routeChunk(<Notes />),
      },
      {
        path: 'account',
        element: routeChunk(<Account />),
      },
      {
        path: 'campaigns/:id',
        element: routeChunk(<CampaignBuilder />),
      },
      {
        path: 'heroes',
        element: routeChunk(<HeroList />),
      },
      {
        path: 'heroes/new',
        element: routeChunk(<HeroWizard />),
      },
      {
        path: 'heroes/:id',
        element: routeChunk(<HeroSheet />),
      },
      {
        path: 'join/:code?',
        element: routeChunk(<JoinSession />),
      },
      {
        path: 'session/:id/lobby',
        element: routeChunk(<Lobby />),
      },
    ],
  },
  {
    path: '/app/session/:id',
    element: (
      <ProtectedRoute>
        {routeChunk(<SessionPage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
