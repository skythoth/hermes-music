import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { ChatColumn } from './ChatColumn';
import { MemoryPanel } from './MemoryPanel';
import { PlaylistDetail } from './PlaylistDetail';
import { SearchView } from './SearchView';
import { LayoutSwitch } from './LayoutSwitch';
import type { HermesState } from '../hooks/useHermes';
import { getAccessToken } from '../lib/spotify-auth';

interface DesktopAppProps {
  H: HermesState;
  userName?: string | null;
  onPlay?: (uri: string) => void;
}

export function DesktopApp({ H, userName, onPlay }: DesktopAppProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const active = H.playlists.find((p) => p.id === H.activePlaylist);
  const accessToken = getAccessToken();
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }, []);
  return (
    <div className="desk">
      <Sidebar
        playlists={H.playlists}
        activeId={H.activePlaylist}
        onSelect={(id) => { setShowSearch(false); H.setActivePlaylist(id); }}
        onHome={() => { setShowSearch(false); H.setActivePlaylist(null); }}
        onSearch={() => { setShowSearch(true); H.setActivePlaylist(null); }}
        onNewPlaylist={() => { setShowSearch(false); H.setActivePlaylist(null); H.sendTurn("새로운 플레이리스트를 만들어줘"); }}
        showSearch={showSearch}
        userName={userName}
      />
      <main className="stage">
        <header className="topbar">
          <div className="topbar-l">
            <span className="status"><span className="pulse-dot" /> Listening + Adapting</span>
            <span className="topbar-sub">자연어로 요청하면 채팅으로 추천이 와요</span>
          </div>
          <div className="topbar-r">
            <span className="lay-label">추천 카드</span>
            <LayoutSwitch value={H.layout} onChange={H.setLayout} />
          </div>
        </header>
        {showSearch
          ? <SearchView accessToken={accessToken} playlists={H.playlists} onBack={() => setShowSearch(false)} onAdded={(name) => showToast(`'${name}'에 곡 추가됨`)} onPlay={onPlay} />
          : active
          ? <PlaylistDetail pl={active} onBack={() => H.setActivePlaylist(null)} accessToken={accessToken} onPlay={onPlay} />
          : <ChatColumn H={H} onPlay={onPlay} />}
      </main>
      <MemoryPanel H={H} />
      {(H.toast || toast) && <div className="toast">{H.toast || toast}</div>}
    </div>
  );
}
