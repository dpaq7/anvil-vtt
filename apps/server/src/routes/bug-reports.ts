import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { getSessionCookie } from '../middleware/auth.js';

export const bugReportRoutes = new Hono<AppEnv>();

const MAX_KIND_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 800;
const MAX_STACK_LENGTH = 8000;
const MAX_CONTEXT_LENGTH = 12000;

interface BugReportPayload {
  kind: string;
  message: string;
  stack: string | null;
  componentStack: string | null;
  source: string | null;
  url: string | null;
  userAgent: string | null;
  context: unknown;
}

interface PersistedBugReport extends BugReportPayload {
  id: string;
  user: AuthUser | null;
  createdAt: string;
  contextJson: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function compactString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const compacted = value.replace(/\0/g, '').trim();
  if (!compacted) return null;
  return compacted.length > maxLength ? compacted.slice(0, maxLength) : compacted;
}

function contextToJson(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  try {
    const json = JSON.stringify(value);
    if (!json || json === 'null') return null;
    return json.length > MAX_CONTEXT_LENGTH ? json.slice(0, MAX_CONTEXT_LENGTH) : json;
  } catch {
    return null;
  }
}

function parseBugReport(raw: unknown): { payload?: BugReportPayload; error?: string } {
  if (!isRecord(raw)) return { error: 'Bug report must be a JSON object' };

  const message = compactString(raw['message'], MAX_MESSAGE_LENGTH);
  if (!message) return { error: 'Bug report message is required' };

  return {
    payload: {
      kind: compactString(raw['kind'], MAX_KIND_LENGTH) ?? 'client-error',
      message,
      stack: compactString(raw['stack'], MAX_STACK_LENGTH),
      componentStack: compactString(raw['componentStack'], MAX_STACK_LENGTH),
      source: compactString(raw['source'], 240),
      url: compactString(raw['url'], 2048),
      userAgent: compactString(raw['userAgent'], 512),
      context: raw['context'],
    },
  };
}

async function optionalUser(c: Context<AppEnv>): Promise<AuthUser | null> {
  const sessionId = getSessionCookie(c);
  if (!sessionId) return null;

  const row = await c.env.DB.prepare(
    `SELECT u.id, u.username, u.avatar_url, u.role
     FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
  )
    .bind(sessionId)
    .first<{ id: string; username: string; avatar_url: string | null; role: string | null }>();

  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url,
    role: row.role === 'player' ? 'player' : 'director',
  };
}

async function notifyBugReport(c: Context<AppEnv>, report: PersistedBugReport): Promise<boolean> {
  const webhookUrl = c.env.BUG_REPORT_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl === 'undefined') return false;

  const description = [
    `Kind: ${report.kind}`,
    `User: ${report.user ? `${report.user.username} (${report.user.id})` : 'anonymous'}`,
    report.url ? `URL: ${report.url}` : null,
    report.source ? `Source: ${report.source}` : null,
    '',
    report.message,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')
    .slice(0, 3900);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `Anvil bug report ${report.id}`,
      embeds: [
        {
          title: report.message.slice(0, 240),
          description,
          color: 15158332,
          timestamp: report.createdAt,
          fields: [
            { name: 'Report ID', value: report.id, inline: true },
            { name: 'Environment', value: c.env.ENVIRONMENT || 'unknown', inline: true },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Bug report webhook failed: ${response.status}`);
  }

  return true;
}

bugReportRoutes.post('/', async (c) => {
  const raw = await c.req.json().catch(() => null);
  const parsed = parseBugReport(raw);
  if (!parsed.payload) return c.json({ error: parsed.error ?? 'Invalid bug report' }, 400);

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const user = await optionalUser(c);
  const contextJson = contextToJson(parsed.payload.context);
  const report: PersistedBugReport = { ...parsed.payload, id, user, createdAt, contextJson };

  await c.env.DB.prepare(
    `INSERT INTO bug_reports (
      id, user_id, kind, message, stack, component_stack, source, url, user_agent, context_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      report.id,
      report.user?.id ?? null,
      report.kind,
      report.message,
      report.stack,
      report.componentStack,
      report.source,
      report.url,
      report.userAgent,
      report.contextJson,
      report.createdAt,
    )
    .run();

  let notified = false;
  try {
    notified = await notifyBugReport(c, report);
    if (notified) {
      await c.env.DB.prepare('UPDATE bug_reports SET notified_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), report.id)
        .run();
    }
  } catch (error) {
    console.error('[bug-reports] notification failed', error);
  }

  return c.json({ id, received: true, notified }, 201);
});
