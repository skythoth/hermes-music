import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './Icons';
import { searchTracks, addTracksToPlaylist, type SpotifyTrackItem } from '../lib/spotify-api';
import type { Playlist } from './Sidebar';

interface SearchViewProps {
  accessToken: string | null;
  playlists: Playlist[];
  onBack: () => void;
  onAdded?: (playlistName: string) => void;
  onPlay?: (uri: string) => void;
}

function formatDuration(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function SearchView({ accessToken, playlists, onBack, onAdded, onPlay }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // debounce search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query.trim() || !accessToken) {
      setResults([]);
      setSearched(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const tracks = await searchTracks(query.trim(), accessToken);
      setResults(tracks);
      setSearched(true);
      setLoading(false);
    }, 300);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, accessToken]);

  // close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdown]);

  const handleAdd = useCallback(async (track: SpotifyTrackItem, playlistId: string, playlistName: string) => {
    if (!accessToken || addingTo) return;
    setAddingTo(playlistId);
    try {
      await addTracksToPlaylist(playlistId, [track.uri], accessToken);
      onAdded?.(playlistName);
    } catch (err) {
      console.error('[SearchView] addTrack error:', err);
    } finally {
      setAddingTo(null);
      setOpenDropdown(null);
    }
  }, [accessToken, addingTo, onAdded]);

  return (
    <div className="search-view">
      <button className="pl-back" onClick={onBack}>&larr; 홈으로</button>

      <div className="search-bar">
        <Icon.search />
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          placeholder="곡명, 아티스트 검색…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery('')}><Icon.x /></button>
        )}
      </div>

      {!accessToken && (
        <div className="search-empty">Spotify 로그인이 필요해요.</div>
      )}

      {loading && <div className="search-empty">검색 중…</div>}

      {!loading && searched && results.length === 0 && (
        <div className="search-empty">검색 결과가 없어요.</div>
      )}

      {!loading && !searched && accessToken && (
        <div className="search-empty">곡이나 아티스트를 검색해보세요.</div>
      )}

      {results.length > 0 && (
        <div className="pl-table">
          <div className="pl-tr pl-thead">
            <span>#</span><span>제목</span><span>앨범</span><span>시간</span><span></span>
          </div>
          {results.map((t, i) => (
            <div className="pl-tr search-tr" key={t.id}>
              <span className="pl-idx">{i + 1}</span>
              <span className="pl-title">
                <div className="art-wrap" style={{ width: 36, height: 36, flexShrink: 0 }}>
                  {t.album.images?.[0] ? (
                    <img
                      src={t.album.images[t.album.images.length - 1]?.url || t.album.images[0].url}
                      alt=""
                      style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 4, background: 'var(--surface2)' }} />
                  )}
                  {onPlay && (
                    <button className="art-play" onClick={(e) => { e.stopPropagation(); onPlay(t.uri); }}>
                      <Icon.play size={14} fill="currentColor" />
                    </button>
                  )}
                </div>
                <span>
                  <b>{t.name}</b>
                  <i>{t.artists.map((a) => a.name).join(', ')}</i>
                </span>
              </span>
              <span className="pl-album">{t.album.name}</span>
              <span className="pl-bpm">{formatDuration(t.duration_ms)}</span>
              <span className="search-add-cell">
                <button
                  title="플레이리스트에 추가"
                  onClick={() => setOpenDropdown(openDropdown === t.id ? null : t.id)}
                >
                  <span className="icon-btn"><Icon.plus /></span>
                </button>
                {openDropdown === t.id && (
                  <div className="search-dropdown" ref={dropdownRef}>
                    {playlists.length === 0 && (
                      <div className="search-dropdown-empty">플레이리스트가 없어요</div>
                    )}
                    {playlists.map((pl) => (
                      <button
                        key={pl.id}
                        className="search-dropdown-item"
                        disabled={addingTo === pl.id}
                        onClick={() => handleAdd(t, pl.id, pl.name)}
                      >
                        {pl.imageUrl ? (
                          <img src={pl.imageUrl} alt="" className="search-dropdown-art" />
                        ) : (
                          <div className="search-dropdown-art search-dropdown-art-empty" />
                        )}
                        <span>{addingTo === pl.id ? '추가 중…' : pl.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
