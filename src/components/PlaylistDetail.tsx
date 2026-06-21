import { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { Cover } from './Cover';
import { coverStyle } from '../lib/catalog';
import type { Playlist } from './Sidebar';
import { getPlaylistTracks, type SpotifyTrackItem } from '../lib/spotify-api';

interface PlaylistDetailProps {
  pl: Playlist;
  onBack: () => void;
  accessToken?: string | null;
  onPlay?: (uri: string) => void;
}

function formatDuration(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function PlaylistDetail({ pl, onBack, accessToken, onPlay }: PlaylistDetailProps) {
  const [spotifyTracks, setSpotifyTracks] = useState<SpotifyTrackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSpotifyPlaylist = !pl.byAgent && !!accessToken;

  useEffect(() => {
    if (!isSpotifyPlaylist) return;
    setLoading(true);
    setError(null);
    getPlaylistTracks(pl.id, accessToken!)
      .then(setSpotifyTracks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [pl.id, isSpotifyPlaylist, accessToken]);

  const trackCount = isSpotifyPlaylist
    ? (spotifyTracks.length || pl.trackCount || 0)
    : pl.tracks.length;

  return (
    <div className="pl-detail">
      <button className="pl-back" onClick={onBack}>← 에이전트로 돌아가기</button>
      <div className="pl-hero">
        <div className={
          (pl.imageUrl || pl.tracks.find((t) => t.imageUrl)) ? 'pl-hero-art pl-hero-art-single' : 'pl-hero-art'
        }>
          {(() => {
            const cover = pl.imageUrl || pl.tracks.find((t) => t.imageUrl)?.imageUrl;
            if (cover) return (
              <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
            );
            return pl.tracks.slice(0, 4).map((t, i) => (
              <i key={i} style={{ background: coverStyle(t) }} />
            ));
          })()}
        </div>
        <div className="pl-hero-meta">
          <span className="pl-kind">{pl.byAgent ? "HERMES 생성 플레이리스트" : "플레이리스트"}</span>
          <h1>{pl.name}</h1>
          <div className="pl-sub">
            {pl.byAgent ? "에이전트가 취향 학습 기반으로 구성" : "내 라이브러리"} · {trackCount}곡
          </div>
        </div>
      </div>

      {isSpotifyPlaylist ? (
        <div className="pl-table">
          <div className="pl-tr pl-thead"><span>#</span><span>제목</span><span>앨범</span><span>시간</span></div>
          {loading && <div className="pl-empty">트랙 불러오는 중…</div>}
          {error && <div className="pl-empty">오류: {error}</div>}
          {!loading && !error && spotifyTracks.map((t, i) => (
            <div className="pl-tr" key={t.id}>
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
            </div>
          ))}
          {!loading && !error && spotifyTracks.length === 0 && (
            <div className="pl-empty">트랙이 없어요.</div>
          )}
        </div>
      ) : (
        <div className="pl-table">
          <div className="pl-tr pl-thead"><span>#</span><span>제목</span><span>앨범</span><span>BPM</span><span>장르</span></div>
          {pl.tracks.map((t, i) => (
            <div className="pl-tr" key={t.id}>
              <span className="pl-idx">{i + 1}</span>
              <span className="pl-title">
                <Cover track={t} size={36} radius={8} onPlay={onPlay && t.spotifyUri ? () => onPlay(t.spotifyUri!) : undefined} />
                <span><b>{t.title}</b><i>{t.artist}</i></span>
              </span>
              <span className="pl-album">{t.album}</span>
              <span className="pl-bpm">{t.bpm}</span>
              <span className="pl-genre">{t.genre}</span>
            </div>
          ))}
          {pl.tracks.length === 0 && <div className="pl-empty">아직 곡이 없어요.</div>}
        </div>
      )}
    </div>
  );
}
