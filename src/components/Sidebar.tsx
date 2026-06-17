import { Icon } from './Icons';
import { coverStyle } from '../lib/catalog';
import type { Track } from '../lib/catalog';

export interface Playlist {
  id: string;
  name: string;
  byAgent: boolean;
  tracks: Track[];
  fresh?: boolean;
}

interface SidebarProps {
  playlists: Playlist[];
  activeId: string | null;
  onSelect: (id: string) => void;
  userName?: string | null;
}

export function Sidebar({ playlists, activeId, onSelect, userName }: SidebarProps) {
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
        <a className="nav-item active"><Icon.home /> 홈</a>
        <a className="nav-item"><Icon.search /> 검색</a>
      </nav>

      <div className="lib">
        <div className="lib-head">
          <span>내 라이브러리</span>
          <button className="icon-btn" title="새 플레이리스트"><Icon.plus /></button>
        </div>
        <div className="lib-list">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              className={"lib-row" + (pl.id === activeId ? " active" : "")}
              onClick={() => onSelect(pl.id)}
            >
              <div className="lib-art">
                {pl.tracks.slice(0, 4).map((t, i) => (
                  <i key={i} style={{ background: coverStyle(t) }} />
                ))}
                {pl.tracks.length === 0 && <span className="lib-art-empty"><Icon.spark /></span>}
              </div>
              <div className="lib-meta">
                <div className="lib-title">{pl.name}</div>
                <div className="lib-sub">{pl.byAgent ? "Hermes 생성" : "플레이리스트"} · {pl.tracks.length}곡</div>
              </div>
              {pl.fresh && <span className="lib-dot" />}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
