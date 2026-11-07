import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppEnv } from '../types.js';

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { id: 'user-1', username: 'dan', avatarUrl: null, role: 'director' });
    await next();
  },
}));
vi.mock('../security/rate-limits.js', () => ({ importRateLimits: { sceneImport: async () => null } }));

const { sceneImportRoutes } = await import('./scene-imports.js');

const body = {
  manifest: {
    format: 'anvil.campaign-package',
    version: 1,
    document: {
      format: 'anvil.scene-import',
      version: 1,
      campaign: { name: 'Test' },
      sessions: [{ name: 'One', scenes: [{ title: 'Start', type: 'story', data: { image: 'anvil-asset://map-one' } }] }],
    },
    assets: [{
      ref: 'map-one', path: 'assets/map.jpg', name: 'Map', type: 'map', contentType: 'image/jpeg', size: 100,
      sha256: 'a'.repeat(64),
    }],
  },
  uploadedAssets: { 'map-one': 'asset-id' },
};

function post(DB: unknown) {
  const app = new Hono<AppEnv>().route('/', sceneImportRoutes);
  return app.request('/import-package', { method: 'POST', body: JSON.stringify(body) }, { DB });
}

describe('POST /import-package errors', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('keeps the message of an expected validation failure', async () => {
    const response = await post({ prepare: () => ({ bind: () => ({ first: async () => null }) }) });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Asset map-one was not uploaded by this account' });
  });

  it('hides the message of an unexpected failure', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await post({ prepare: () => { throw new Error('D1_ERROR: no such table: assets'); } });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Campaign package import failed' });
    expect(log).toHaveBeenCalled();
  });
});
