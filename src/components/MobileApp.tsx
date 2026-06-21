import { useState, useCallback } from 'react';
import { Icon } from './Icons';
import { ChatColumn } from './ChatColumn';
import { MemoryPanel } from './MemoryPanel';
import { PlaylistDetail } from './PlaylistDetail';
import { SearchView } from './SearchView';
import { PlayerBar } from './PlayerBar';
import { coverStyle } from '../lib/catalog';
import type { HermesState } from '../hooks/useHermes';
import type { PlaybackHandle } from '../hooks/usePlayback';
import { getAccessToken, clearAuth } from '../lib/spotify-auth';
import type { SpotifyUser } from '../lib/spotify-api';

interface MobileAppProps {
  H: HermesState;
  onPlay?: (uri: string) => void;
  pb?: PlaybackHandle;
  user?: SpotifyUser | null;
}

export function MobileApp({ H, onPlay, pb, user }: MobileAppProps) {
  const [tab, setTab] = useState<'chat' | 'mem' | 'lib' | 'search'>("chat");
  const [toast, setToast] = useState<string | null>(null);
  const accessToken = getAccessToken();
  const activePl = H.playlists.find((p) => p.id === H.activePlaylist);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }, []);

  return (
    <div className="mob">
      <div className="mob-top">
        <div className="mob-brand">
          <span className="brand-mark sm"><Icon.spark /></span> Hermes
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="status sm"><span className="pulse-dot" /> {H.fit}%</span>
          {user && (
            <button title="로그아웃" onClick={() => { clearAuth(); window.location.reload(); }}>
              <span className="icon-btn"><Icon.logout /></span>
            </button>
          )}
        </div>
      </div>

      {tab === "chat" && <div className="mob-body"><ChatColumn H={H} dense onPlay={onPlay} /></div>}
      {tab === "search" && (
        <div className="mob-body mem-scroll">
          <SearchView accessToken={accessToken} playlists={H.playlists} onBack={() => setTab("chat")} onAdded={(name) => showToast(`'${name}'에 곡 추가됨`)} onPlay={onPlay} />
        </div>
      )}
      {tab === "mem" && <div className="mob-body mem-scroll"><MemoryPanel H={H} /></div>}
      {tab === "lib" && (
        <div className="mob-body mem-scroll">
          {activePl ? (
            <PlaylistDetail pl={activePl} onBack={() => H.setActivePlaylist(null)} accessToken={accessToken} onPlay={onPlay} />
          ) : (
            <div className="mob-lib">
              <div className="mob-lib-head">내 라이브러리</div>
              {H.playlists.length === 0 && (
                <div className="mob-lib-empty">플레이리스트가 없어요. 추천을 저장해보세요.</div>
              )}
              {H.playlists.map((pl) => (
                <button
                  key={pl.id}
                  className="mob-lib-row"
                  onClick={() => H.setActivePlaylist(pl.id)}
                >
                  <div className={
                    (pl.imageUrl || pl.tracks.find((t) => t.imageUrl)) ? 'mob-lib-art mob-lib-art-single' : 'mob-lib-art'
                  }>
                    {(() => {
                      const cover = pl.imageUrl || pl.tracks.find((t) => t.imageUrl)?.imageUrl;
                      if (cover) return <img src={cover} alt="" />;
                      if (pl.tracks.length > 0) return pl.tracks.slice(0, 4).map((t, i) => (
                        <i key={i} style={{ background: coverStyle(t) }} />
                      ));
                      return <span className="mob-lib-art-empty"><Icon.spark /></span>;
                    })()}
                  </div>
                  <div className="mob-lib-meta">
                    <div className="mob-lib-title">{pl.name}</div>
                    <div className="mob-lib-sub">
                      {pl.byAgent ? "Hermes 생성" : "플레이리스트"} · {pl.trackCount ?? pl.tracks.length}곡
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {pb && <PlayerBar pb={pb} />}
      <nav className="mob-tabs">
        <button className={tab === "chat" ? "on" : ""} onClick={() => setTab("chat")}>
          <Icon.spark /> 추천
        </button>
        <button className={tab === "search" ? "on" : ""} onClick={() => setTab("search")}>
          <Icon.search /> 검색
        </button>
        <button className={tab === "mem" ? "on" : ""} onClick={() => setTab("mem")}>
          <Icon.heart fill="currentColor" /> 취향
        </button>
        <button className={tab === "lib" ? "on" : ""} onClick={() => { setTab("lib"); H.setActivePlaylist(null); }}>
          <Icon.music /> 라이브러리
        </button>
      </nav>
      {(H.toast || toast) && <div className="toast mob-toast">{H.toast || toast}</div>}
    </div>
  );
}
