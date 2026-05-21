import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { ClientMessage, ServerMessage, SessionState, AbilityResult } from '../types/protocol.js';
import { csrfHeaders } from '../lib/csrf.js';
import { addBreadcrumb } from '../lib/bug-reporting.js';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

export function useSessionSocket(sessionId: string | null) {
  const [state, setState] = useState<SessionState | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [combatLog, setCombatLog] = useState<AbilityResult[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Tracks whether the owning effect is still mounted (survives Strict Mode double-mount). */
  const mountedRef = useRef(false);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'state':
        setState({ ...msg.state, actionLog: msg.state.actionLog ?? [] });
        break;
      case 'scene_changed':
        addBreadcrumb({ category: 'session', message: 'Scene changed' });
        setState((prev) => prev ? { ...prev, activeSceneId: msg.sceneId } : prev);
        break;
      case 'scene_reverted':
        toast.info('Scene reverted to prepared state.');
        break;
      case 'entity_created':
        setState((prev) => {
          if (!prev) return prev;
          // Prevent duplicates (server echoes back to sender)
          if (prev.entities.some((e) => e.id === msg.entity.id)) return prev;
          return { ...prev, entities: [...prev.entities, msg.entity] };
        });
        break;
      case 'entity_updated':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            entities: prev.entities.map((e) =>
              e.id === msg.entityId ? { ...e, ...msg.changes } : e,
            ),
          };
        });
        break;
      case 'entity_deleted':
        setState((prev) => prev ? { ...prev, entities: prev.entities.filter((e) => e.id !== msg.entityId) } : prev);
        break;
      case 'entity_moved':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            entities: prev.entities.map((e) =>
              e.id === msg.entityId ? { ...e, x: msg.x, y: msg.y } : e,
            ),
          };
        });
        break;
      case 'combat_updated':
        setState((prev) => prev ? { ...prev, combat: msg.combat } : prev);
        break;
      case 'ability_resolved':
        setCombatLog((prev) => {
          // Deduplicate — same timestamp + sourceId + abilityId means duplicate delivery
          const isDupe = prev.some(
            (e) => e.timestamp === msg.result.timestamp && e.sourceId === msg.result.sourceId && e.abilityId === msg.result.abilityId,
          );
          return isDupe ? prev : [...prev, msg.result];
        });
        break;
      case 'draw_steel_roll_resolved':
        break;
      case 'action_logged':
        setState((prev) => {
          if (!prev) return prev;
          const currentLog = prev.actionLog ?? [];
          if (currentLog.some((entry) => entry.id === msg.entry.id)) return prev;
          return { ...prev, actionLog: [...currentLog, msg.entry].slice(-200) };
        });
        break;
      case 'participant_update':
        setState((prev) => prev ? { ...prev, participants: msg.participants } : prev);
        break;
      case 'session_started':
        addBreadcrumb({ category: 'session', message: 'Session started' });
        setSessionStarted(true);
        break;
      case 'session_ended':
        addBreadcrumb({ category: 'session', message: 'Session ended' });
        setState(null);
        setError('Session has ended.');
        toast.info('The session has ended.');
        break;
      case 'error':
        if (msg.code === 'INVALID_TARGET' && msg.message === 'Token not found') {
          // Token moves can race against scene/entity reconciliation after map edits.
          // The next state update corrects the canvas, so avoid a noisy transient toast.
          break;
        }
        addBreadcrumb({
          category: 'session',
          message: 'Server sent session error',
          data: { code: msg.code ?? null, message: msg.message ?? null },
        });
        setError(msg.message);
        toast.error(msg.message ?? 'Server error');
        break;
      case 'scene_drawing_added':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map((s) => {
              if (s.id !== prev.activeSceneId) return s;
              const data = s.data ?? {};
              const drawings = Array.isArray(data['drawings']) ? [...(data['drawings'] as unknown[])] : [];
              drawings.push(msg.drawing);
              return { ...s, data: { ...data, drawings } };
            }),
          };
        });
        break;
      case 'scene_drawing_removed':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map((s) => {
              if (s.id !== prev.activeSceneId) return s;
              const data = s.data ?? {};
              const drawings = Array.isArray(data['drawings'])
                ? (data['drawings'] as { id: string }[]).filter((d) => d.id !== msg.drawingId)
                : [];
              return { ...s, data: { ...data, drawings } };
            }),
          };
        });
        break;
      case 'scene_fog_added':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map((s) => {
              if (s.id !== prev.activeSceneId) return s;
              const data = s.data ?? {};
              const fog = Array.isArray(data['fog']) ? [...(data['fog'] as unknown[])] : [];
              fog.push(msg.fog);
              return { ...s, data: { ...data, fog } };
            }),
          };
        });
        break;
      case 'scene_fog_removed':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map((s) => {
              if (s.id !== prev.activeSceneId) return s;
              const data = s.data ?? {};
              const fog = Array.isArray(data['fog'])
                ? (data['fog'] as { id: string }[]).filter((f) => f.id !== msg.fogId)
                : [];
              return { ...s, data: { ...data, fog } };
            }),
          };
        });
        break;
      case 'scene_terrain_added':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map((s) => {
              if (s.id !== prev.activeSceneId) return s;
              const data = s.data ?? {};
              const terrain = Array.isArray(data['terrain']) ? [...(data['terrain'] as unknown[])] : [];
              if (!terrain.some((zone) => typeof zone === 'object' && zone !== null && 'id' in zone && zone.id === msg.terrain.id)) {
                terrain.push(msg.terrain);
              }
              return { ...s, data: { ...data, terrain } };
            }),
          };
        });
        break;
      case 'scene_terrain_updated':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map((s) => {
              if (s.id !== prev.activeSceneId) return s;
              const data = s.data ?? {};
              const terrain = Array.isArray(data['terrain'])
                ? (data['terrain'] as { id: string }[]).map((zone) => zone.id === msg.terrain.id ? msg.terrain : zone)
                : [];
              if (!terrain.some((zone) => typeof zone === 'object' && zone !== null && 'id' in zone && zone.id === msg.terrain.id)) {
                terrain.push(msg.terrain);
              }
              return { ...s, data: { ...data, terrain } };
            }),
          };
        });
        break;
      case 'scene_terrain_removed':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map((s) => {
              if (s.id !== prev.activeSceneId) return s;
              const data = s.data ?? {};
              const terrain = Array.isArray(data['terrain'])
                ? (data['terrain'] as { id: string }[]).filter((zone) => zone.id !== msg.terrainId)
                : [];
              return { ...s, data: { ...data, terrain } };
            }),
          };
        });
        break;
      // ── Non-battle scene updates ──
      case 'negotiation_updated':
        setState((prev) => prev ? {
          ...prev,
          negotiation: {
            interest: msg.interest,
            patience: msg.patience,
            maxPatience: msg.maxPatience,
            phase: msg.phase,
            motivations: msg.motivations,
            pitfalls: msg.pitfalls,
            argumentLog: msg.argumentLog,
          },
        } : prev);
        break;
      case 'montage_updated':
        setState((prev) => prev ? {
          ...prev,
          montage: {
            successes: msg.successes,
            failures: msg.failures,
            successLimit: msg.successLimit,
            failureLimit: msg.failureLimit,
            testLog: msg.testLog,
            outcome: msg.outcome,
          },
        } : prev);
        break;
      case 'respite_updated':
        setState((prev) => prev ? {
          ...prev,
          respite: {
            activities: msg.activities,
            completedBy: msg.completedBy,
          },
        } : prev);
        break;
      case 'audio_command':
        setState((prev) => {
          if (!prev) return prev;
          if (msg.action === 'stop') {
            return { ...prev, audio: null };
          }
          return {
            ...prev,
            audio: {
              playing: msg.action === 'play',
              audioUrl: msg.audioUrl ?? prev.audio?.audioUrl ?? null,
              assetName: msg.assetName ?? prev.audio?.assetName ?? null,
              loop: msg.loop ?? prev.audio?.loop ?? false,
            },
          };
        });
        break;
      case 'story_updated':
        // Story updates are pushed to the scene data
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map((s) => {
              if (s.id !== prev.activeSceneId) return s;
              return { ...s, data: { ...(s.data ?? {}), readAloud: msg.readAloudText } };
            }),
          };
        });
        break;
      case 'pong':
        break;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!sessionId || !mountedRef.current) return;

    // Close any previous connection to prevent duplicates (e.g. React strict mode double-mount)
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect loop
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus((prev) => (prev === 'disconnected' ? 'connecting' : 'reconnecting'));
    setError(null);

    const apiBase = import.meta.env['VITE_API_BASE'] ?? '';

    // First, fetch a short-lived WS auth token via HTTP (cookies work here)
    let token: string;
    try {
      const res = await fetch(`${apiBase}/api/sessions/${sessionId}/ws-token`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders('POST') },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Token request failed: ${res.status}`);
      }
      const data = await res.json() as { token: string };
      token = data.token;
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('[WS] failed to get token:', err);
      addBreadcrumb({
        category: 'session',
        message: 'WebSocket token request failed',
        data: { message: err instanceof Error ? err.message : 'Failed to authenticate' },
      });
      setError(err instanceof Error ? err.message : 'Failed to authenticate');
      setStatus('disconnected');
      return;
    }

    if (!mountedRef.current) return;

    const apiUrl = apiBase ? new URL(apiBase) : null;
    const protocol = apiUrl
      ? (apiUrl.protocol === 'https:' ? 'wss:' : 'ws:')
      : (window.location.protocol === 'https:' ? 'wss:' : 'ws:');
    const host = apiUrl?.host ?? window.location.host;
    const wsUrl = `${protocol}//${host}/api/sessions/${sessionId}/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      addBreadcrumb({ category: 'session', message: 'WebSocket connected' });
      setStatus('connected');
      retriesRef.current = 0;
      ws.send(JSON.stringify({ type: 'request_state' } satisfies ClientMessage));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as ServerMessage;
        handleMessage(msg);
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      if (!mountedRef.current) return;
      if (retriesRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retriesRef.current);
        retriesRef.current++;
        addBreadcrumb({
          category: 'session',
          message: 'WebSocket closed, reconnecting',
          data: { code: event.code, retry: retriesRef.current },
        });
        setStatus('reconnecting');
        toast.warning('Connection lost. Reconnecting...');
        timerRef.current = setTimeout(() => { void connect(); }, delay);
      } else {
        addBreadcrumb({
          category: 'session',
          message: 'WebSocket disconnected',
          data: { code: event.code, retries: retriesRef.current },
        });
        setStatus('disconnected');
        setError('Connection lost. Please refresh.');
        toast.error('Connection lost. Please refresh the page.');
      }
    };

    ws.onerror = () => {
      addBreadcrumb({ category: 'session', message: 'WebSocket error' });
      ws.close();
    };
  }, [sessionId, handleMessage]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('[WS] message dropped (socket not open):', msg.type);
      addBreadcrumb({
        category: 'session',
        message: 'WebSocket message dropped',
        data: { type: msg.type },
      });
      toast.warning('Not connected. Action could not be sent.');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void connect();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  // Ping every 30s to keep alive
  useEffect(() => {
    if (status !== 'connected') return;
    const interval = setInterval(() => {
      send({ type: 'ping' });
    }, 30_000);
    return () => clearInterval(interval);
  }, [status, send]);

  return { state, status, error, send, combatLog, sessionStarted };
}
