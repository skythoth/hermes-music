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

/** Spotify Search — 곡명+아티스트로 트랙 검색, 첫 번째 결과 반환 */
export async function searchTrack(
  query: string,
  accessToken: string,
): Promise<SpotifyTrackItem | null> {
  const res = await fetch(
    `${BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return null;
  const data = await res.json();
  const item = data.tracks?.items?.[0];
  if (!item) return null;
  return {
    id: item.id,
    name: item.name,
    artists: item.artists,
    album: { name: item.album.name, images: item.album.images },
    duration_ms: item.duration_ms,
    uri: item.uri,
  };
}

/** 유저 Spotify 계정에 새 플레이리스트 생성 */
export async function createPlaylist(
  userId: string,
  name: string,
  accessToken: string,
): Promise<{ id: string; name: string }> {
  const res = await fetch(`${BASE}/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, public: false }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Create playlist failed: ${res.status} ${body?.error?.message || ''}`);
  }
  return res.json();
}

/** 플레이리스트에 트랙 URI 추가 */
export async function addTracksToPlaylist(
  playlistId: string,
  uris: string[],
  accessToken: string,
): Promise<void> {
  if (uris.length === 0) return;
  const res = await fetch(`${BASE}/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Add tracks failed: ${res.status} ${body?.error?.message || ''}`);
  }
}
