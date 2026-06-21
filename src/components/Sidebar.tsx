import { Icon } from './Icons';
import { coverStyle } from '../lib/catalog';
import type { Track } from '../lib/catalog';

export interface Playlist {
  id: string;
  name: string;
  byAgent: boolean;
  tracks: Track[];
  fresh?: boolean;
  // Spotify playlist fields (undefined for Hermes-created playlists)
  imageUrl?: string;
  trackCount?: number;
}

interface SidebarProps {
  playlists: Playlist[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onHome: () => void;
  onSearch: () => void;
  onNewPlaylist: () => void;
  showSearch?: boolean;
  userName?: string | null;
}

function PlaylistArt({ pl }: { pl: Playlist }) {
  // Spotify playlist with cover image
  if (pl.imageUrl) {
    return (
      <div className="lib-art" style={{ overflow: 'hidden' }}>
        <img
          src={pl.imageUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', gridColumn: '1/3', gridRow: '1/3' }}
        />
      </div>
    );
  }
  // Hermes-created playlist with tracks
  if (pl.tracks.length > 0) {
    const firstImg = pl.tracks.find((t) => t.imageUrl)?.imageUrl;
    if (firstImg) {
      return (
        <div className="lib-art lib-art-single">
          <img src={firstImg} alt="" />
        </div>
      );
    }
    return (
      <div className="lib-art">
        {pl.tracks.slice(0, 4).map((t, i) => (
          <i key={i} style={{ background: coverStyle(t) }} />
        ))}
      </div>
    );
  }
  // Empty playlist
  return (
    <div className="lib-art">
      <span className="lib-art-empty"><Icon.spark /></span>
    </div>
  );
}

export function Sidebar({ playlists, activeId, onSelect, onHome, onSearch, onNewPlaylist, showSearch, userName }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><Icon.spark /></span>
        <div>
          <div className="brand-name">Hermes</div>
          <div className="brand-sub">music agent</div>
        </div>
      </div>

      {userName && (
        <div style={{ padding: '0 6px 12px', color: 'var(--muted)', fontSize: '12.5px' }}>
          {userName}
        </div>
      )}

      <nav className="nav">
        <a className={"nav-item" + (!showSearch && activeId === null ? " active" : "")} onClick={onHome} style={{ cursor: 'pointer' }}><Icon.home /> 홈</a>
        <a className={"nav-item" + (showSearch ? " active" : "")} onClick={onSearch} style={{ cursor: 'pointer' }}><Icon.search /> 검색</a>
      </nav>

      <div className="lib">
        <div className="lib-head">
          <span>내 라이브러리</span>
          <button title="새 플레이리스트" onClick={onNewPlaylist}><span className="icon-btn"><Icon.plus /></span></button>
        </div>
        <div className="lib-list">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              className={"lib-row" + (pl.id === activeId ? " active" : "")}
              onClick={() => onSelect(pl.id)}
            >
              <PlaylistArt pl={pl} />
              <div className="lib-meta">
                <div className="lib-title">{pl.name}</div>
                <div className="lib-sub">
                  {pl.byAgent ? "Hermes 생성" : "플레이리스트"} · {pl.trackCount ?? pl.tracks.length}곡
                </div>
              </div>
              {pl.fresh && <span className="lib-dot" />}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
