import { useEffect, useRef, useState, useCallback } from 'react';
import type { ClientMessage, ServerMessage, SessionState, AbilityResult } from '../types/protocol.js';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

export function useSessionSocket(sessionId: string | null) {
  const [state, setState] = useState<SessionState | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [combatLog, setCombatLog] = useState<AbilityResult[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!sessionId) return;

    setStatus((prev) => (prev === 'disconnected' ? 'connecting' : 'reconnecting'));
    setError(null);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiBase = import.meta.env['VITE_API_BASE'] ?? '';
    const wsUrl = apiBase
      ? `${protocol}//${new URL(apiBase).host}/api/sessions/${sessionId}/ws`
      : `${protocol}//${window.location.host}/api/sessions/${sessionId}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
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

    ws.onclose = () => {
      wsRef.current = null;
      if (retriesRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retriesRef.current);
        retriesRef.current++;
        setStatus('reconnecting');
        timerRef.current = setTimeout(connect, delay);
      } else {
        setStatus('disconnected');
        setError('Connection lost. Please refresh.');
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [sessionId]);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'state':
        setState(msg.state);
        break;
      case 'scene_changed':
        setState((prev) => prev ? { ...prev, activeSceneId: msg.sceneId } : prev);
        break;
      case 'entity_created':
        setState((prev) => prev ? { ...prev, entities: [...prev.entities, msg.entity] } : prev);
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
        setCombatLog((prev) => [...prev, msg.result]);
        break;
      case 'participant_update':
        setState((prev) => prev ? { ...prev, participants: msg.participants } : prev);
        break;
      case 'session_ended':
        setState(null);
        setError('Session has ended.');
        break;
      case 'error':
        setError(msg.message);
        break;
      case 'pong':
        break;
    }
  }, []);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
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

  return { state, status, error, send, combatLog };
}
