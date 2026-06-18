import { useEffect, useState } from 'react';
import { exchangeToken, setAccessToken } from '../lib/spotify-auth';

export function Callback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const authError = params.get('error');

    if (authError) {
      setError(`Spotify authorization denied: ${authError}`);
      return;
    }

    if (!code) {
      setError('No authorization code received');
      return;
    }

    exchangeToken(code)
      .then((data) => {
        setAccessToken(data.access_token);
        if (data.refresh_token) {
          sessionStorage.setItem('spotify_refresh_token', data.refresh_token);
        }
        // Full reload so App re-reads token from sessionStorage
        window.location.replace('/');
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        color: 'var(--ink)', fontFamily: 'var(--sans)',
      }}>
        <p style={{ color: 'var(--neg)' }}>{error}</p>
        <button
          className="btn"
          onClick={() => window.location.replace('/')}
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--muted)', fontFamily: 'var(--sans)',
    }}>
      로그인 처리 중...
    </div>
  );
}
