import { Sidebar } from './Sidebar';
import { ChatColumn } from './ChatColumn';
import { MemoryPanel } from './MemoryPanel';
import { PlaylistDetail } from './PlaylistDetail';
import { LayoutSwitch } from './LayoutSwitch';
import type { HermesState } from '../hooks/useHermes';
import { getAccessToken } from '../lib/spotify-auth';

interface DesktopAppProps {
  H: HermesState;
  userName?: string | null;
}

export function DesktopApp({ H, userName }: DesktopAppProps) {
  const active = H.playlists.find((p) => p.id === H.activePlaylist);
  const accessToken = getAccessToken();
  return (
    <div className="desk">
      <Sidebar
        playlists={H.playlists}
        activeId={H.activePlaylist}
        onSelect={H.setActivePlaylist}
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
        {active
          ? <PlaylistDetail pl={active} onBack={() => H.setActivePlaylist(null)} accessToken={accessToken} />
          : <ChatColumn H={H} />}
      </main>
      <MemoryPanel H={H} />
      {H.toast && <div className="toast">{H.toast}</div>}
    </div>
  );
}
