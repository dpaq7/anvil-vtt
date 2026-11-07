import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppEnv } from '../types.js';
import { HERO_LIMITS } from '../policy/limits.js';

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { id: 'user-1', username: 'dan', avatarUrl: null, role: 'director' });
    await next();
  },
}));
vi.mock('../security/rate-limits.js', () => ({ heroRateLimits: { write: async () => null } }));

const { heroRoutes } = await import('./heroes.js');

function hero(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'forge-1', name: 'Test Hero', picture: null, folder: '',
    ancestry: null, culture: null, career: null, class: null, complication: null,
    features: [], state: {}, abilityCustomizations: [], ...overrides,
  };
}

describe('POST /import/forge-steel', () => {
  let bound: unknown[][];
  const app = new Hono<AppEnv>().route('/', heroRoutes);
  const post = (body: unknown) => app.request('/import/forge-steel', { method: 'POST', body: JSON.stringify(body) }, {
    DB: { prepare: () => ({ bind: (...args: unknown[]) => ({ run: async () => { bound.push(args); } }) }) },
  });

  beforeEach(() => { bound = []; });

  it('stores an imported hero without the raw file', async () => {
    const response = await post(hero({ secret: 'raw-marker', picture: 'https://example.com/hero.png' }));
    expect(response.status).toBe(201);
    expect(bound).toHaveLength(1);
    expect(JSON.stringify(bound[0])).not.toContain('raw-marker');
    expect(bound[0]).toContain('https://example.com/hero.png');
  });

  it('rejects a name over the limit without writing', async () => {
    const response = await post(hero({ name: 'n'.repeat(HERO_LIMITS.nameLength + 1) }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Hero name is too long' });
    expect(bound).toHaveLength(0);
  });

  it('rejects unsafe keys without writing', async () => {
    const response = await app.request('/import/forge-steel', {
      method: 'POST',
      body: JSON.stringify(hero()).replace('"state":{}', '"state":{"__proto__":{"admin":true}}'),
    }, { DB: { prepare: () => { throw new Error('should not reach the database'); } } });
    expect(response.status).toBe(400);
  });

  it('does not store a picture that fails portrait validation', async () => {
    const response = await post(hero({ picture: 'http://example.com/hero.png' }));
    expect(response.status).toBe(201);
    expect(bound[0]).not.toContain('http://example.com/hero.png');
  });
});
