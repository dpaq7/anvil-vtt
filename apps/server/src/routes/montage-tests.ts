import { Hono } from 'hono';
import type { AppEnv } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import type { CreateMontageTestInput, MontageTestRecord, UpdateMontageTestInput } from '@anvil/types';

export const montageTestRoutes = new Hono<AppEnv>();

montageTestRoutes.use('/*', authMiddleware);

// ── Helpers ──

interface MontageTestRow {
  id: string;
  scene_id: string;
  test_name: string;
  test_data: string | null;
  successes: number;
  failures: number;
  target_successes: number;
  max_failures: number;
  status: string;
  created_at: string;
}

function rowToMontageTest(row: MontageTestRow): MontageTestRecord {
  return {
    id: row.id,
    sceneId: row.scene_id,
    testName: row.test_name,
    testData: row.test_data ? JSON.parse(row.test_data) : null,
    successes: row.successes,
    failures: row.failures,
    targetSuccesses: row.target_successes,
    maxFailures: row.max_failures,
    status: row.status as MontageTestRecord['status'],
    createdAt: row.created_at,
  };
}

// ── Routes ──

// List montage tests for a scene
montageTestRoutes.get('/scenes/:sceneId/montage-tests', async (c) => {
  const sceneId = c.req.param('sceneId');

  const results = await c.env.DB.prepare(
    'SELECT * FROM montage_tests WHERE scene_id = ? ORDER BY created_at DESC',
  )
    .bind(sceneId)
    .all<MontageTestRow>();

  return c.json({ tests: results.results.map(rowToMontageTest) });
});

// Create montage test
montageTestRoutes.post('/scenes/:sceneId/montage-tests', async (c) => {
  const sceneId = c.req.param('sceneId');
  const body = await c.req.json<CreateMontageTestInput>();

  if (!body.testName?.trim()) return c.json({ error: 'Test name is required' }, 400);
  if (!body.targetSuccesses || body.targetSuccesses < 1) return c.json({ error: 'Target successes must be at least 1' }, 400);
  if (!body.maxFailures || body.maxFailures < 1) return c.json({ error: 'Max failures must be at least 1' }, 400);

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO montage_tests (id, scene_id, test_name, test_data, target_successes, max_failures)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      sceneId,
      body.testName.trim(),
      body.testData ? JSON.stringify(body.testData) : null,
      body.targetSuccesses,
      body.maxFailures,
    )
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM montage_tests WHERE id = ?')
    .bind(id)
    .first<MontageTestRow>();
  if (!row) return c.json({ error: 'Failed to create montage test' }, 500);

  return c.json({ test: rowToMontageTest(row) }, 201);
});

// Update montage test progress/status
montageTestRoutes.patch('/scenes/:sceneId/montage-tests/:testId', async (c) => {
  const sceneId = c.req.param('sceneId');
  const testId = c.req.param('testId');
  const body = await c.req.json<UpdateMontageTestInput>();

  const existing = await c.env.DB.prepare('SELECT id FROM montage_tests WHERE id = ? AND scene_id = ?')
    .bind(testId, sceneId)
    .first();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const sets: string[] = [];
  const vals: unknown[] = [];

  if (body.successes !== undefined) { sets.push('successes = ?'); vals.push(body.successes); }
  if (body.failures !== undefined) { sets.push('failures = ?'); vals.push(body.failures); }
  if (body.status !== undefined) { sets.push('status = ?'); vals.push(body.status); }

  if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400);

  vals.push(testId);
  await c.env.DB.prepare(`UPDATE montage_tests SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...vals)
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM montage_tests WHERE id = ?')
    .bind(testId)
    .first<MontageTestRow>();
  if (!row) return c.json({ error: 'Not found' }, 404);

  return c.json({ test: rowToMontageTest(row) });
});

// Delete montage test
montageTestRoutes.delete('/scenes/:sceneId/montage-tests/:testId', async (c) => {
  const sceneId = c.req.param('sceneId');
  const testId = c.req.param('testId');

  const existing = await c.env.DB.prepare('SELECT id FROM montage_tests WHERE id = ? AND scene_id = ?')
    .bind(testId, sceneId)
    .first();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  await c.env.DB.prepare('DELETE FROM montage_tests WHERE id = ?').bind(testId).run();
  return c.json({ ok: true });
});
