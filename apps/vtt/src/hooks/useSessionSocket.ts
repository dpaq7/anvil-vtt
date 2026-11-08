import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { ClientMessage, ServerMessage } from '../types/protocol.js';
import { csrfHeaders } from '../lib/csrf.js';
import { addBreadcrumb } from '../lib/bug-reporting.js';
import { useSessionStore } from '../stores/sessionStore.js';
import { RECONNECT_GIVE_UP_MS } from '../lib/reconnect.js';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
export type SessionClientKind = 'desktop' | 'phone';

const BASE_DELAY = 1000;
// Longest wait between two tries, so a drop is retried several times inside the give-up window.
const MAX_DELAY = 8000;

/** A token request that failed with an HTTP status (0 when the server could not be reached). */
class TokenRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface UseSessionSocketOptions {
  clientKind?: SessionClientKind;
}

export function useSessionSocket(sessionId: string | null, options: UseSessionSocketOptions = {}) {
  const clientKind = options.clientKind ?? 'desktop';
  const state = useSessionStore((s) => s.sessionState);
  const combatLog = useSessionStore((s) => s.combatLog);
  const sessionStarted = useSessionStore((s) => s.sessionStarted);
  const applyServerMessage = useSessionStore((s) => s.applyServerMessage);
  const resetSessionRuntime = useSessionStore((s) => s.resetSessionRuntime);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  // HTTP status of the last failed token request (0: unreachable). Lets the page tell a bad
  // link from a server that is down.
  const [failureStatus, setFailureStatus] = useState<number | null>(null);
  const [phoneAnchorConnected, setPhoneAnchorConnected] = useState<boolean | null>(
    clientKind === 'phone' ? null : true,
  );
  const phoneAnchorConnectedRef = useRef<boolean | null>(clientKind === 'phone' ? null : true);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** When the current drop began; null while connected or before the first try. */
  const dropStartedRef = useRef<number | null>(null);
  /** Tracks whether the owning effect is still mounted (survives Strict Mode double-mount). */
  const mountedRef = useRef(false);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'state':
        if (clientKind === 'phone') {
          phoneAnchorConnectedRef.current = true;
          setPhoneAnchorConnected(true);
        }
        break;
      case 'phone_anchor_status': {
        const wasAnchored = phoneAnchorConnectedRef.current;
        phoneAnchorConnectedRef.current = msg.anchored;
        setPhoneAnchorConnected(msg.anchored);
        if (!msg.anchored) {
          setError('Open this session on desktop first to sync the phone companion.');
        } else if (wasAnchored !== true) {
          setError(null);
          wsRef.current?.send(JSON.stringify({ type: 'request_state' } satisfies ClientMessage));
        }
        break;
      }
      case 'scene_changed':
        addBreadcrumb({ category: 'session', message: 'Scene changed' });
        break;
      case 'scene_reverted':
        toast.info('Scene reverted to prepared state.');
        break;
      case 'session_started':
        addBreadcrumb({ category: 'session', message: 'Session started' });
        break;
      case 'session_ended':
        addBreadcrumb({ category: 'session', message: 'Session ended' });
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
    }
    applyServerMessage(msg);
  }, [applyServerMessage, clientKind]);

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
    setFailureStatus(null);

    // Try again after a backoff while the drop is inside the give-up window.
    const scheduleRetry = (retryable: boolean): boolean => {
      const started = dropStartedRef.current;
      if (!retryable || started === null || Date.now() - started >= RECONNECT_GIVE_UP_MS) return false;
      const delay = Math.min(MAX_DELAY, BASE_DELAY * Math.pow(2, retriesRef.current));
      retriesRef.current++;
      setStatus('reconnecting');
      timerRef.current = setTimeout(() => { void connect(); }, delay);
      return true;
    };

    const apiBase = import.meta.env['VITE_API_BASE'] ?? '';

    // First, fetch a short-lived WS auth token via HTTP (cookies work here)
    let token: string;
    try {
      const res = await fetch(`${apiBase}/api/sessions/${sessionId}/ws-token`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders('POST') },
        body: JSON.stringify({ clientKind }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new TokenRequestError(body.error ?? `Token request failed: ${res.status}`, res.status);
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
      const httpStatus = err instanceof TokenRequestError ? err.status : 0;
      // During a drop, a server that cannot be reached is tried again until the give-up
      // window closes. A refusal (4xx) is final.
      if (scheduleRetry(httpStatus === 0 || httpStatus >= 500)) return;
      setFailureStatus(httpStatus);
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
    const wsUrl = `${protocol}//${host}/api/sessions/${sessionId}/ws?token=${token}&clientKind=${clientKind}`;

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
      dropStartedRef.current = null;
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
      dropStartedRef.current ??= Date.now();
      if (scheduleRetry(true)) {
        addBreadcrumb({
          category: 'session',
          message: 'WebSocket closed, reconnecting',
          data: { code: event.code, retry: retriesRef.current },
        });
        toast.warning('Connection lost. Reconnecting...');
      } else {
        addBreadcrumb({
          category: 'session',
          message: 'WebSocket disconnected',
          data: { code: event.code, retries: retriesRef.current },
        });
        setFailureStatus(0);
        setStatus('disconnected');
        setError('Connection lost. Please refresh.');
        toast.error('Connection lost. Please refresh the page.');
      }
    };

    ws.onerror = () => {
      addBreadcrumb({ category: 'session', message: 'WebSocket error' });
      ws.close();
    };
  }, [sessionId, handleMessage, clientKind]);

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

  /** "Try again" after the shell gave up: start a fresh round of tries. */
  const retry = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    retriesRef.current = 0;
    dropStartedRef.current = Date.now();
    void connect();
  }, [connect]);

  useEffect(() => {
    resetSessionRuntime();
    setStatus('disconnected');
    setError(null);
    setFailureStatus(null);
    retriesRef.current = 0;
    dropStartedRef.current = null;

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

  return { state, status, error, failureStatus, retry, send, combatLog, sessionStarted, phoneAnchorConnected };
}
