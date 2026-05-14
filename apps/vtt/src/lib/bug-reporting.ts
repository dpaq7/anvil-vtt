import { csrfHeaders, getCsrfToken } from './csrf.js';

const API_BASE = import.meta.env['VITE_API_BASE'] || '';
const MAX_REPORTS_PER_PAGE = 8;
const DUPLICATE_WINDOW_MS = 30_000;

type BugReportContext = Record<string, unknown>;

export interface BugReportInput {
  kind: string;
  message: string;
  stack?: string | null;
  componentStack?: string | null;
  source?: string | null;
  context?: BugReportContext;
}

export interface BugReportResult {
  id: string;
  received: boolean;
  notified: boolean;
}

let installed = false;
let sentReports = 0;
const recentReports = new Map<string, number>();

function errorParts(error: unknown): { message: string; stack: string | null } {
  if (error instanceof Error) {
    return {
      message: error.message || error.name || 'Unexpected error',
      stack: error.stack ?? null,
    };
  }

  if (typeof error === 'string') return { message: error, stack: null };

  try {
    return { message: JSON.stringify(error) || 'Unexpected error', stack: null };
  } catch {
    return { message: String(error), stack: null };
  }
}

function pageContext(): BugReportContext {
  if (typeof window === 'undefined') return {};

  return {
    path: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
    online: navigator.onLine,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function reportSignature(input: BugReportInput) {
  return [
    input.kind,
    input.message,
    input.source ?? '',
    input.stack?.slice(0, 300) ?? '',
    typeof window === 'undefined' ? '' : window.location.pathname,
  ].join('|');
}

function shouldSuppress(input: BugReportInput) {
  const now = Date.now();
  for (const [signature, timestamp] of recentReports) {
    if (now - timestamp > DUPLICATE_WINDOW_MS) recentReports.delete(signature);
  }

  if (sentReports >= MAX_REPORTS_PER_PAGE) return true;

  const signature = reportSignature(input);
  const lastSeen = recentReports.get(signature);
  if (lastSeen && now - lastSeen < DUPLICATE_WINDOW_MS) return true;

  recentReports.set(signature, now);
  sentReports += 1;
  return false;
}

export async function reportBug(input: BugReportInput): Promise<BugReportResult | null> {
  if (typeof window === 'undefined') return null;
  if (shouldSuppress(input)) return null;

  const csrfToken = getCsrfToken();
  const payload = {
    kind: input.kind,
    message: input.message,
    stack: input.stack ?? null,
    componentStack: input.componentStack ?? null,
    source: input.source ?? null,
    url: window.location.href,
    userAgent: navigator.userAgent,
    context: {
      ...pageContext(),
      ...input.context,
    },
  };
  const body = JSON.stringify(payload);

  const response = await fetch(`${API_BASE}/api/bug-reports`, {
    method: 'POST',
    credentials: csrfToken ? 'include' : 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? csrfHeaders('POST') : {}),
    },
    body,
    keepalive: body.length < 60_000,
  });

  if (!response.ok) {
    throw new Error(`Bug report failed: ${response.status}`);
  }

  return response.json() as Promise<BugReportResult>;
}

export function reportApiError(input: {
  method: string;
  path: string;
  status?: number;
  message: string;
  stack?: string | null;
}) {
  void reportBug({
    kind: 'api-error',
    message: input.status
      ? `${input.method} ${input.path} failed with ${input.status}`
      : `${input.method} ${input.path} failed`,
    stack: input.stack ?? null,
    source: 'api',
    context: {
      method: input.method,
      path: input.path,
      status: input.status ?? null,
      responseMessage: input.message,
    },
  }).catch(() => undefined);
}

export function installGlobalBugReporter() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    const parts = errorParts(event.error);
    void reportBug({
      kind: 'window-error',
      message: event.message || parts.message,
      stack: parts.stack,
      source: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : 'window',
      context: {
        lineno: event.lineno,
        colno: event.colno,
      },
    }).catch(() => undefined);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const parts = errorParts(event.reason);
    void reportBug({
      kind: 'unhandled-rejection',
      message: parts.message,
      stack: parts.stack,
      source: 'promise',
    }).catch(() => undefined);
  });
}
