// Centralized API base URL builder for browser and server contexts
export function getApiBaseUrl(): string {
  // Prefer explicit env if provided
  const explicit = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
  if (explicit) {
    return explicit.endsWith('/') ? explicit : explicit + '/';
  }

  // In the browser, use current host with backend port 8000
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol || 'http:';
    const host = window.location.hostname;
    return `${protocol}//${host}:8000/`;
  }

  // Server-side fallback for development
  return 'http://localhost:8000/';
}

