export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/admin';
// Legacy API key — kept only for machine-to-machine fallback (not used in browser sessions)
export const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || '';

/**
 * Fetch wrapper that sends session cookies (for session-based auth) and
 * optionally the x-admin-key header (legacy machine-to-machine path).
 *
 * Browser sessions use the Better Auth cookie automatically via
 * `credentials: 'include'`. The x-admin-key header is only added when
 * VITE_ADMIN_KEY is set (e.g. CI / server-side scripts).
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Only send the API key header when explicitly configured (machine use)
  if (ADMIN_KEY) {
    headers['x-admin-key'] = ADMIN_KEY;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always send session cookies
  });

  if (response.status === 401 || response.status === 403) {
    // Session expired or user lost admin role — redirect to login
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
}
