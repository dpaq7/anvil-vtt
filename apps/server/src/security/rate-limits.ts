import type { Context } from 'hono';
import type { AppEnv } from '../types.js';
import { enforceRateLimit } from '../lib/rate-limit.js';
import { RATE_LIMIT_PROFILES } from '../policy/limits.js';
import { auditSecurityEvent } from './audit.js';

interface RateLimitProfile {
  namespace: string;
  limit: number;
  windowSeconds: number;
}

async function enforceProfile(
  c: Context<AppEnv>,
  profile: RateLimitProfile,
  identifier?: string,
): Promise<Response | null> {
  const response = await enforceRateLimit(c, {
    namespace: profile.namespace,
    limit: profile.limit,
    windowSeconds: profile.windowSeconds,
    ...(identifier ? { identifier } : {}),
  });
  if (response) {
    auditSecurityEvent(c, {
      type: 'rate_limit',
      userId: identifier ?? null,
      detail: { namespace: profile.namespace, limit: profile.limit },
    });
  }
  return response;
}

async function enforceIpAndUserProfile(
  c: Context<AppEnv>,
  profile: RateLimitProfile,
  userId: string,
): Promise<Response | null> {
  const byIp = await enforceProfile(c, { ...profile, namespace: `${profile.namespace}:ip` });
  if (byIp) return byIp;
  return enforceProfile(c, { ...profile, namespace: `${profile.namespace}:user` }, userId);
}

export const authRateLimits = {
  start: (c: Context<AppEnv>) => enforceProfile(c, RATE_LIMIT_PROFILES.authStart),
  callback: (c: Context<AppEnv>) => enforceProfile(c, RATE_LIMIT_PROFILES.authCallback),
  devLogin: (c: Context<AppEnv>) => enforceProfile(c, RATE_LIMIT_PROFILES.devLogin),
} as const;

export const assetRateLimits = {
  uploadRegister: (c: Context<AppEnv>, userId: string) => enforceProfile(c, RATE_LIMIT_PROFILES.assetUploadRegister, userId),
  uploadData: (c: Context<AppEnv>, userId: string) => enforceProfile(c, RATE_LIMIT_PROFILES.assetUploadData, userId),
} as const;

export const sessionRateLimits = {
  roomCodeLookup: (c: Context<AppEnv>, userId: string) => enforceIpAndUserProfile(c, RATE_LIMIT_PROFILES.roomCodeLookup, userId),
  roomCodeJoin: (c: Context<AppEnv>, userId: string) => enforceIpAndUserProfile(c, RATE_LIMIT_PROFILES.roomCodeJoin, userId),
} as const;

export const noteRateLimits = {
  write: (c: Context<AppEnv>, userId: string) => enforceProfile(c, RATE_LIMIT_PROFILES.noteWrite, userId),
} as const;

export const importRateLimits = {
  sceneImport: (c: Context<AppEnv>, userId: string) => enforceIpAndUserProfile(c, RATE_LIMIT_PROFILES.sceneImport, userId),
} as const;
