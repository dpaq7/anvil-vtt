import { csrfHeaders, getCsrfToken } from './csrf.js';

const API_BASE = import.meta.env['VITE_API_BASE'] || '';
const MAX_REPORTS_PER_PAGE = 8;
const MAX_BREADCRUMBS = 50;
const MAX_BREADCRUMB_DATA_LENGTH = 1200;
const MAX_REPORT_CONTEXT_LENGTH = 11_000;
const DUPLICATE_WINDOW_MS = 30_000;
const TOKEN_PATH_SEGMENT = /^(?:[A-Z0-9]{8,}|(?=.*[0-9_-])[A-Za-z0-9_-]{6,})$/;
const URL_IN_TEXT = /https?:\/\/[^\s"'<>\\]+/g;
const SECRET_PAIR =
  /\b(token|code|state|session|auth|key|secret)=([^&\s"'<>\\]+)/gi;

type BugReportContext = Record<string, unknown>;
type BreadcrumbData = Record<string, unknown>;

export interface BugReportBreadcrumb {
  timestamp: string;
  category: string;
  message: string;
  data?: BreadcrumbData;
}

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
const breadcrumbs: BugReportBreadcrumb[] = [];
const recentReports = new Map<string, number>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

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
    path: redactPath(window.location.pathname),
    search: window.location.search ? '[redacted]' : '',
    hash: window.location.hash ? '[redacted]' : '',
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
    online: navigator.onLine,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function redactPath(pathname: string): string {
  return pathname
    .split('/')
    .map((segment) => (TOKEN_PATH_SEGMENT.test(segment) ? '[redacted]' : segment))
    .join('/');
}

function redactUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.pathname = redactPath(url.pathname);
    url.search = url.search ? '?[redacted]' : '';
    url.hash = url.hash ? '#[redacted]' : '';
    return url.toString();
  } catch {
    return rawUrl
      .replace(/([?&][^=]+)=([^&#\s"'<>\\]+)/g, '$1=[redacted]')
      .replace(/#.+$/, '#[redacted]');
  }
}

function redactText(value: string | null | undefined): string | null {
  if (!value) return value ?? null;
  return value
    .replace(URL_IN_TEXT, (url) => redactUrl(url))
    .replace(SECRET_PAIR, '$1=[redacted]');
}

function redactedJsonStringify(value: unknown): string | null {
  const seen = new WeakSet<object>();

  try {
    return JSON.stringify(value, (_key, nestedValue: unknown) => {
      if (typeof nestedValue === 'string') return redactText(nestedValue);
      if (typeof nestedValue === 'bigint') return nestedValue.toString();
      if (!nestedValue || typeof nestedValue !== 'object') return nestedValue;

      if (seen.has(nestedValue)) return '[Circular]';
      seen.add(nestedValue);
      return nestedValue;
    }) ?? null;
  } catch {
    return null;
  }
}

function sanitizeBreadcrumbData(data: BreadcrumbData | undefined): BreadcrumbData | undefined {
  if (!data) return undefined;

  try {
    const json = redactedJsonStringify(data);
    if (!json || json === 'null') return undefined;
    if (json.length > MAX_BREADCRUMB_DATA_LENGTH) {
      return { preview: json.slice(0, MAX_BREADCRUMB_DATA_LENGTH), truncated: true };
    }
    const parsed = JSON.parse(json) as unknown;
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function sanitizeContext(context: BugReportContext): BugReportContext {
  try {
    const json = redactedJsonStringify(context);
    if (!json || json === 'null') return {};
    const parsed = JSON.parse(json) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function addBreadcrumb(input: {
  category: string;
  message: string;
  data?: BreadcrumbData;
}) {
  if (typeof window === 'undefined') return;

  breadcrumbs.push({
    timestamp: new Date().toISOString(),
    category: input.category.slice(0, 80),
    message: input.message.slice(0, 240),
    data: sanitizeBreadcrumbData(input.data),
  });

  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.splice(0, breadcrumbs.length - MAX_BREADCRUMBS);
  }
}

export function getBugReportBreadcrumbs(): BugReportBreadcrumb[] {
  return breadcrumbs.slice();
}

function contextWithBreadcrumbs(inputContext: BugReportContext | undefined): BugReportContext {
  const baseContext = sanitizeContext({
    ...pageContext(),
    ...inputContext,
  });
  const reportBreadcrumbs = getBugReportBreadcrumbs();
  let context = { ...baseContext, breadcrumbs: reportBreadcrumbs };

  while (reportBreadcrumbs.length > 0 && JSON.stringify(context).length > MAX_REPORT_CONTEXT_LENGTH) {
    reportBreadcrumbs.shift();
    context = { ...baseContext, breadcrumbs: reportBreadcrumbs };
  }

  return context;
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
    message: redactText(input.message) ?? input.message,
    stack: redactText(input.stack),
    componentStack: redactText(input.componentStack),
    source: input.source ?? null,
    url: redactUrl(window.location.href),
    userAgent: navigator.userAgent,
    context: contextWithBreadcrumbs(input.context),
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
  addBreadcrumb({
    category: 'api',
    message: input.status
      ? `${input.method} ${input.path} failed with ${input.status}`
      : `${input.method} ${input.path} failed`,
    data: {
      method: input.method,
      path: input.path,
      status: input.status ?? null,
      responseMessage: input.message,
    },
  });

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
    addBreadcrumb({
      category: 'error',
      message: event.message || parts.message,
      data: {
        source: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : 'window',
      },
    });
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
    addBreadcrumb({
      category: 'error',
      message: parts.message,
      data: { source: 'promise' },
    });
    void reportBug({
      kind: 'unhandled-rejection',
      message: parts.message,
      stack: parts.stack,
      source: 'promise',
    }).catch(() => undefined);
  });
}
