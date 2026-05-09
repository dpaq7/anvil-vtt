let csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function csrfHeaders(method: string = 'GET'): Record<string, string> {
  if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) return {};
  return csrfToken ? { 'X-CSRF-Token': csrfToken } : {};
}
