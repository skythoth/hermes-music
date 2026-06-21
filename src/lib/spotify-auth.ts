/**
 * Spotify OAuth Authorization Code with PKCE
 */

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SCOPES = 'playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-top-read';

function getClientId(): string {
  return import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? '';
}

function getRedirectUri(): string {
  return import.meta.env.VITE_REDIRECT_URI ?? 'http://127.0.0.1:5173/callback';
}

// ---- PKCE helpers ------------------------------------------------------------
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => possible[v % possible.length]).join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(plain));
}

function base64urlencode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ---- Public API --------------------------------------------------------------

/** Redirect user to Spotify authorization page */
export async function redirectToSpotifyAuth(): Promise<void> {
  const codeVerifier = generateRandomString(64);
  sessionStorage.setItem('spotify_code_verifier', codeVerifier);

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlencode(hashed);

  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    show_dialog: 'true',
  });

  window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

/** Exchange authorization code for access token (PKCE — direct client-side call, no secret needed) */
export async function exchangeToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
  if (!codeVerifier) {
    throw new Error('Missing code_verifier in sessionStorage');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(),
    client_id: getClientId(),
    code_verifier: codeVerifier,
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${res.status} ${data.error_description || data.error || ''}`);
  }

  // Clean up verifier after successful exchange
  sessionStorage.removeItem('spotify_code_verifier');

  return res.json();
}

/** Get stored access token */
export function getAccessToken(): string | null {
  return sessionStorage.getItem('spotify_access_token');
}

/** Store access token */
export function setAccessToken(token: string): void {
  sessionStorage.setItem('spotify_access_token', token);
}

/** Clear auth state (logout) */
export function clearAuth(): void {
  sessionStorage.removeItem('spotify_access_token');
  sessionStorage.removeItem('spotify_refresh_token');
  sessionStorage.removeItem('spotify_code_verifier');
}
