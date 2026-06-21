import { useState, useEffect, useRef, useCallback } from 'react';
import { getAccessToken } from '../lib/spotify-auth';
import { startPlayback } from '../lib/spotify-api';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (opts: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
  }
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, cb: (data: unknown) => void) => void;
  removeListener: (event: string) => void;
  togglePlay: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
}

interface SpotifyPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      uri: string;
      name: string;
      artists: { name: string }[];
      album: { images: { url: string }[] };
    };
  };
}

export interface CurrentTrack {
  uri: string;
  name: string;
  artist: string;
  imageUrl?: string;
}

export interface PlaybackHandle {
  ready: boolean;
  playing: boolean;
  currentTrack: CurrentTrack | null;
  position: number;
  duration: number;
  play: (uri: string) => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
}

export function usePlayback(): PlaybackHandle {
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const deviceIdRef = useRef<string | null>(null);
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // progress timer
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (playing) {
      intervalRef.current = setInterval(() => {
        setPosition((p) => Math.min(p + 1000, duration));
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, duration]);

  // SDK init
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const initPlayer = () => {
      const player = new window.Spotify.Player({
        name: 'Hermes Music',
        getOAuthToken: (cb) => {
          const t = getAccessToken();
          if (t) cb(t);
        },
        volume: 0.5,
      });

      player.addListener('ready', (data: unknown) => {
        const d = data as { device_id: string };
        console.log('[Playback] Ready, device:', d.device_id);
        deviceIdRef.current = d.device_id;
        setReady(true);
      });

      player.addListener('not_ready', () => {
        console.log('[Playback] Not ready');
        setReady(false);
        deviceIdRef.current = null;
      });

      player.addListener('player_state_changed', (state: unknown) => {
        if (!state) return;
        const s = state as SpotifyPlaybackState;
        setPlaying(!s.paused);
        setPosition(s.position);
        setDuration(s.duration);
        const ct = s.track_window.current_track;
        setCurrentTrack({
          uri: ct.uri,
          name: ct.name,
          artist: ct.artists.map((a) => a.name).join(', '),
          imageUrl: ct.album.images?.[0]?.url,
        });
      });

      player.addListener('initialization_error', (e: unknown) => console.error('[Playback] Init error:', e));
      player.addListener('authentication_error', (e: unknown) => console.error('[Playback] Auth error:', e));
      player.addListener('account_error', (e: unknown) => console.error('[Playback] Account error:', e));

      player.connect();
      playerRef.current = player;
    };

    if (window.Spotify) {
      initPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
    }

    return () => {
      playerRef.current?.disconnect();
    };
  }, []);

  const play = useCallback(async (uri: string) => {
    const token = getAccessToken();
    const deviceId = deviceIdRef.current;
    if (!token || !deviceId) return;
    await startPlayback(deviceId, [uri], token);
  }, []);

  const togglePlay = useCallback(async () => {
    playerRef.current?.togglePlay();
  }, []);

  const seek = useCallback(async (ms: number) => {
    await playerRef.current?.seek(ms);
    setPosition(ms);
  }, []);

  return { ready, playing, currentTrack, position, duration, play, togglePlay, seek };
}
