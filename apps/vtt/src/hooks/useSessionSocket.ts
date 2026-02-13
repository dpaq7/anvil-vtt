import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { ClientMessage, ServerMessage, SessionState, AbilityResult } from '../types/protocol.js';

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
        setState(msg.state);
        break;
      case 'scene_changed':
        setState((prev) => prev ? { ...prev, activeSceneId: msg.sceneId } : prev);
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
      case 'participant_update':
        setState((prev) => prev ? { ...prev, participants: msg.participants } : prev);
        break;
      case 'session_started':
        setSessionStarted(true);
        break;
      case 'session_ended':
        setState(null);
        setError('Session has ended.');
        toast.info('The session has ended.');
        break;
      case 'error':
        setError(msg.message);
        toast.error(msg.message ?? 'Server error');
        break;
      case 'scene_drawing_added':
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map((s) => {
              if (s.id !== prev.activeSceneId || !s.data) return s;
              const drawings = Array.isArray(s.data['drawings']) ? [...(s.data['drawings'] as unknown[])] : [];
              drawings.push(msg.drawing);
              return { ...s, data: { ...s.data, drawings } };
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
              if (s.id !== prev.activeSceneId || !s.data) return s;
              const drawings = Array.isArray(s.data['drawings'])
                ? (s.data['drawings'] as { id: string }[]).filter((d) => d.id !== msg.drawingId)
                : [];
              return { ...s, data: { ...s.data, drawings } };
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
              if (s.id !== prev.activeSceneId || !s.data) return s;
              const fog = Array.isArray(s.data['fog']) ? [...(s.data['fog'] as unknown[])] : [];
              fog.push(msg.fog);
              return { ...s, data: { ...s.data, fog } };
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
              if (s.id !== prev.activeSceneId || !s.data) return s;
              const fog = Array.isArray(s.data['fog'])
                ? (s.data['fog'] as { id: string }[]).filter((f) => f.id !== msg.fogId)
                : [];
              return { ...s, data: { ...s.data, fog } };
            }),
          };
        });
        break;
      // ── Non-battle scene updates ──
      case 'negotiation_updated':
        setState((prev) => prev ? {
          ...prev,
          negotiation: {
            ...(prev.negotiation ?? { maxPatience: 5, argumentLog: [] }),
            interest: msg.interest,
            patience: msg.patience,
            argumentLog: msg.argumentLog,
          },
        } : prev);
        break;
      case 'montage_updated':
        setState((prev) => prev ? {
          ...prev,
          montage: {
            ...(prev.montage ?? { successLimit: 3, failureLimit: 3 }),
            successes: msg.successes,
            failures: msg.failures,
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

    // First, fetch a short-lived WS auth token via HTTP (cookies work here)
    let token: string;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/ws-token`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
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
      setError(err instanceof Error ? err.message : 'Failed to authenticate');
      setStatus('disconnected');
      return;
    }

    if (!mountedRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiBase = import.meta.env['VITE_API_BASE'] ?? '';
    const host = apiBase
      ? new URL(apiBase).host
      : window.location.host;
    const wsUrl = `${protocol}//${host}/api/sessions/${sessionId}/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
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

    ws.onclose = (_event) => {
      wsRef.current = null;
      if (!mountedRef.current) return;
      if (retriesRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retriesRef.current);
        retriesRef.current++;
        setStatus('reconnecting');
        toast.warning('Connection lost. Reconnecting...');
        timerRef.current = setTimeout(() => { void connect(); }, delay);
      } else {
        setStatus('disconnected');
        setError('Connection lost. Please refresh.');
        toast.error('Connection lost. Please refresh the page.');
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [sessionId, handleMessage]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('[WS] message dropped (socket not open):', msg.type);
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
