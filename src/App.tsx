import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Callback } from './pages/Callback';
import { DesktopApp } from './components/DesktopApp';
import { MobileApp } from './components/MobileApp';
import { PlayerBar } from './components/PlayerBar';
import { Icon } from './components/Icons';
import { useHermes } from './hooks/useHermes';
import { usePlayback } from './hooks/usePlayback';
import { getAccessToken, redirectToSpotifyAuth, clearAuth } from './lib/spotify-auth';
import { getCurrentUser, getUserPlaylists, type SpotifyUser } from './lib/spotify-api';

function LoginScreen() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      fontFamily: 'var(--sans)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span className="brand-mark" style={{ width: 56, height: 56, borderRadius: 16 }}>
          <Icon.spark size={28} />
        </span>
        <div style={{ textAlign: 'center' }}>
          <div className="brand-name" style={{ fontSize: 28 }}>Hermes</div>
          <div className="brand-sub">music agent</div>
        </div>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 340, textAlign: 'center', lineHeight: 1.6 }}>
        기분이나 상황을 말하면 AI가 곡을 골라 Spotify 플레이리스트로 저장해 드려요.
      </p>
      <button className="btn primary" style={{ padding: '14px 28px', fontSize: 15 }} onClick={() => redirectToSpotifyAuth()}>
        Spotify로 로그인
      </button>
    </div>
  );
}

function useIsMobile(breakpoint = 600) {
  const [mobile, setMobile] = useState(() => window.matchMedia(`(max-width:${breakpoint}px)`).matches);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${breakpoint}px)`);
    const h = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [breakpoint]);
  return mobile;
}

function HermesApp() {
  const H = useHermes();
  const pb = usePlayback();
  const isMobile = useIsMobile();
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const [user, setUser] = useState<SpotifyUser | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    getCurrentUser(token)
      .then(setUser)
      .catch(() => {
        clearAuth();
        window.location.reload();
      });

    getUserPlaylists(token)
      .then((items) => {
        const mapped = items
          .filter((sp) => sp != null)
          .map((sp) => ({
            id: sp.id,
            name: sp.name,
            byAgent: false,
            tracks: [],
            imageUrl: sp.images?.[0]?.url,
            trackCount: sp.tracks?.total ?? sp.items?.total ?? 0,
          }));
        H.setPlaylists(mapped);
      })
      .catch((err) => console.error('Failed to load playlists:', err));
  }, []);

  if (isMobile) {
    return (
      <div className="app-root app-root-mobile">
        <MobileApp H={H} onPlay={pb.play} pb={pb} user={user} />
      </div>
    );
  }

  return (
    <div className="app-root">
      <div className="view-switch">
        <button className={view === "desktop" ? "on" : ""} onClick={() => setView("desktop")}>데스크탑</button>
        <button className={view === "mobile" ? "on" : ""} onClick={() => setView("mobile")}>모바일</button>

        <span style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 8px' }} />
        <button className={H.provider === "openai" ? "on" : ""} onClick={() => H.setProvider("openai")}>OpenAI</button>
        <button className={H.provider === "hermes" ? "on" : ""} onClick={() => H.setProvider("hermes")}>Hermes</button>

        <span className="vs-hint">한 에이전트, 두 화면 — 같은 학습 상태를 공유해요</span>
        {user && (
          <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            {user.display_name}
            <button title="로그아웃" onClick={() => { clearAuth(); window.location.reload(); }}>
              <span className="icon-btn"><Icon.logout /></span>
            </button>
          </span>
        )}
      </div>
      {view === "desktop"
        ? <DesktopApp H={H} userName={user?.display_name} onPlay={pb.play} />
        : <div className="mob-stage"><MobileApp H={H} onPlay={pb.play} pb={pb} /></div>}
      <PlayerBar pb={pb} />
    </div>
  );
}

export default function App() {
  const token = getAccessToken();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/callback" element={<Callback />} />
        <Route path="*" element={token ? <HermesApp /> : <LoginScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
