import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { ClientMessage, ServerMessage } from '../types/protocol.js';
import { csrfHeaders } from '../lib/csrf.js';
import { useSessionStore } from '../stores/sessionStore.js';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

export function useSessionSocket(sessionId: string | null) {
  const state = useSessionStore((s) => s.sessionState);
  const combatLog = useSessionStore((s) => s.combatLog);
  const sessionStarted = useSessionStore((s) => s.sessionStarted);
  const applyServerMessage = useSessionStore((s) => s.applyServerMessage);
  const resetSessionRuntime = useSessionStore((s) => s.resetSessionRuntime);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Tracks whether the owning effect is still mounted (survives Strict Mode double-mount). */
  const mountedRef = useRef(false);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'scene_reverted':
        toast.info('Scene reverted to prepared state.');
        break;
      case 'session_ended':
        setError('Session has ended.');
        toast.info('The session has ended.');
        break;
      case 'error':
        if (msg.code === 'INVALID_TARGET' && msg.message === 'Token not found') {
          // Token moves can race against scene/entity reconciliation after map edits.
          // The next state update corrects the canvas, so avoid a noisy transient toast.
          break;
        }
        setError(msg.message);
        toast.error(msg.message ?? 'Server error');
        break;
    }
    applyServerMessage(msg);
  }, [applyServerMessage]);

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
    resetSessionRuntime();
    setStatus('disconnected');
    setError(null);
    retriesRef.current = 0;

    return () => {
      resetSessionRuntime();
    };
  }, [resetSessionRuntime, sessionId]);

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
