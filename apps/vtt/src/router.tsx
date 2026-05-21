import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './pages/ProtectedRoute.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { RouteErrorFallback } from './components/RouteErrorFallback.js';

const CHUNK_RELOAD_KEY = 'anvil:chunk-reload-attempted';

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module/i.test(message);
}

function shouldReloadForChunkError(): boolean {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

function markChunkLoadSuccess(): void {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    // Storage may be unavailable in private browsing modes.
  }
}

function lazyWithChunkReload(load: () => Promise<{ default: ComponentType }>) {
  return lazy(async () => {
    try {
      const module = await load();
      markChunkLoadSuccess();
      return module;
    } catch (error) {
      if (isChunkLoadError(error) && shouldReloadForChunkError()) {
        window.location.reload();
        return await new Promise<never>(() => {});
      }
      throw error;
    }
  });
}

const Landing = lazyWithChunkReload(() => import('./pages/Landing.js').then((module) => ({ default: module.Landing })));
const About = lazyWithChunkReload(() => import('./pages/About.js').then((module) => ({ default: module.About })));
const Contact = lazyWithChunkReload(() => import('./pages/Contact.js').then((module) => ({ default: module.Contact })));
const Auth = lazyWithChunkReload(() => import('./pages/Auth.js').then((module) => ({ default: module.Auth })));
const JoinCampaign = lazyWithChunkReload(() => import('./pages/JoinCampaign.js').then((module) => ({ default: module.JoinCampaign })));
const AppLayout = lazyWithChunkReload(() => import('./components/layout/AppLayout.js').then((module) => ({ default: module.AppLayout })));
const CampaignList = lazyWithChunkReload(() => import('./pages/CampaignList.js').then((module) => ({ default: module.CampaignList })));
const CampaignBuilder = lazyWithChunkReload(() => import('./pages/CampaignBuilder.js').then((module) => ({ default: module.CampaignBuilder })));
const HeroList = lazyWithChunkReload(() => import('./pages/HeroList.js').then((module) => ({ default: module.HeroList })));
const HeroWizard = lazyWithChunkReload(() => import('./pages/HeroWizard.js').then((module) => ({ default: module.HeroWizard })));
const HeroSheet = lazyWithChunkReload(() => import('./pages/HeroSheet.js').then((module) => ({ default: module.HeroSheet })));
const JoinSession = lazyWithChunkReload(() => import('./pages/JoinSession.js').then((module) => ({ default: module.JoinSession })));
const Lobby = lazyWithChunkReload(() => import('./pages/Lobby.js').then((module) => ({ default: module.Lobby })));
const Home = lazyWithChunkReload(() => import('./pages/Home.js').then((module) => ({ default: module.Home })));
const Assets = lazyWithChunkReload(() => import('./pages/Assets.js').then((module) => ({ default: module.Assets })));
const Notes = lazyWithChunkReload(() => import('./pages/Notes.js').then((module) => ({ default: module.Notes })));
const Account = lazyWithChunkReload(() => import('./pages/Account.js').then((module) => ({ default: module.Account })));
const SessionPage = lazyWithChunkReload(() => import('./pages/session/SessionPage.js').then((module) => ({ default: module.SessionPage })));
const LivePage = lazyWithChunkReload(() => import('./pages/LivePage.js').then((module) => ({ default: module.LivePage })));

const routeFallback = (
  <div className="flex h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-400">
    Loading...
  </div>
);

function routeChunk(element: ReactNode) {
  return <Suspense fallback={routeFallback}>{element}</Suspense>;
}

const routeErrorElement = <RouteErrorFallback />;

export const router = createBrowserRouter([
  {
    path: '/',
    element: routeChunk(<Landing />),
    errorElement: routeErrorElement,
  },
  {
    path: '/about',
    element: routeChunk(<About />),
    errorElement: routeErrorElement,
  },
  {
    path: '/contact',
    element: routeChunk(<Contact />),
    errorElement: routeErrorElement,
  },
  {
    path: '/auth',
    element: routeChunk(<Auth />),
    errorElement: routeErrorElement,
  },
  {
    path: '/join/:token',
    element: (
      <ProtectedRoute>
        {routeChunk(<JoinCampaign />)}
      </ProtectedRoute>
    ),
    errorElement: routeErrorElement,
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
    errorElement: routeErrorElement,
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
    errorElement: routeErrorElement,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
    errorElement: routeErrorElement,
  },
]);
