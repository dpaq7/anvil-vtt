import type { Context } from 'hono';
import type { AppEnv } from '../types.js';

type SecuritySeverity = 'info' | 'warn' | 'error';

interface SecurityEvent {
  type: string;
  severity?: SecuritySeverity;
  userId?: string | null;
  subjectId?: string | null;
  detail?: Record<string, string | number | boolean | null>;
}

export function auditSecurityEvent(c: Context<AppEnv>, event: SecurityEvent): void {
  let path = c.req.path;
  try {
    path = new URL(c.req.url).pathname;
  } catch {
    // Keep Hono's parsed path when URL parsing fails.
  }

  const payload = {
    ts: new Date().toISOString(),
    type: event.type,
    severity: event.severity ?? 'warn',
    method: c.req.method,
    path,
    userId: event.userId ?? null,
    subjectId: event.subjectId ?? null,
    ip: c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? null,
    detail: event.detail ?? {},
  };

  const line = JSON.stringify(payload);
  if (payload.severity === 'error') {
    console.error(line);
  } else if (payload.severity === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}
