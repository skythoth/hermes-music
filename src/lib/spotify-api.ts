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

// TODO(B): searchTrack(query, accessToken) — Spotify Search API
// TODO(C): createPlaylist(userId, name, accessToken) — Create Playlist
// TODO(C): addTracksToPlaylist(playlistId, uris, accessToken) — Add Items
