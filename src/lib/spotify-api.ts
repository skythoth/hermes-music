/**
 * Spotify Web API wrapper
 * Only uses allowed endpoints: Search, Create Playlist, Add Tracks, Get Current User, Get User's Top Items
 * NEVER use: Recommendations, Related Artists, Audio Features, Audio Analysis, Featured/Category Playlists
 */

const BASE = 'https://api.spotify.com/v1';

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  images: { url: string }[];
  email?: string;
}

export async function getCurrentUser(accessToken: string): Promise<SpotifyUser> {
  const res = await fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Spotify /me failed: ${res.status}`);
  }
  return res.json();
}

export interface SpotifyPlaylistItem {
  id: string;
  name: string;
  images: { url: string }[];
  tracks?: { total: number };
  items?: { total: number };
  owner: { id: string; display_name: string | null };
}

export async function getUserPlaylists(accessToken: string, limit = 50): Promise<SpotifyPlaylistItem[]> {
  const res = await fetch(`${BASE}/me/playlists?limit=${limit}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Spotify /me/playlists failed: ${res.status}`);
  }
  const data = await res.json();
  return data.items;
}

export interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
  uri: string;
}

export async function getPlaylistTracks(
  playlistId: string,
  accessToken: string,
): Promise<SpotifyTrackItem[]> {
  const res = await fetch(
    `${BASE}/playlists/${playlistId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('Spotify playlist error:', res.status, body);
    throw new Error(`Spotify playlist failed: ${res.status} ${body?.error?.message || ''}`);
  }
  const data = await res.json();
  const items = data.tracks?.items ?? data.items?.items ?? [];
  return items
    .map((entry: Record<string, unknown>) => entry.track ?? entry.item ?? null)
    .filter((t: SpotifyTrackItem | null): t is SpotifyTrackItem => t != null);
}

// TODO(B): searchTrack(query, accessToken) — Spotify Search API
// TODO(C): createPlaylist(userId, name, accessToken) — Create Playlist
// TODO(C): addTracksToPlaylist(playlistId, uris, accessToken) — Add Items
