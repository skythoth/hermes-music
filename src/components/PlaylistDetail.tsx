import { Cover } from './Cover';
import { coverStyle } from '../lib/catalog';
import type { Playlist } from './Sidebar';

interface PlaylistDetailProps {
  pl: Playlist;
  onBack: () => void;
}

export function PlaylistDetail({ pl, onBack }: PlaylistDetailProps) {
  return (
    <div className="pl-detail">
      <button className="pl-back" onClick={onBack}>← 에이전트로 돌아가기</button>
      <div className="pl-hero">
        <div className="pl-hero-art">
          {pl.tracks.slice(0, 4).map((t, i) => (
            <i key={i} style={{ background: coverStyle(t) }} />
          ))}
        </div>
        <div className="pl-hero-meta">
          <span className="pl-kind">{pl.byAgent ? "HERMES 생성 플레이리스트" : "플레이리스트"}</span>
          <h1>{pl.name}</h1>
          <div className="pl-sub">{pl.byAgent ? "에이전트가 취향 학습 기반으로 구성" : "직접 만든 목록"} · {pl.tracks.length}곡</div>
        </div>
      </div>
      <div className="pl-table">
        <div className="pl-tr pl-thead"><span>#</span><span>제목</span><span>앨범</span><span>BPM</span><span>장르</span></div>
        {pl.tracks.map((t, i) => (
          <div className="pl-tr" key={t.id}>
            <span className="pl-idx">{i + 1}</span>
            <span className="pl-title">
              <Cover track={t} size={36} radius={8} />
              <span><b>{t.title}</b><i>{t.artist}</i></span>
            </span>
            <span className="pl-album">{t.album}</span>
            <span className="pl-bpm">{t.bpm}</span>
            <span className="pl-genre">{t.genre}</span>
          </div>
        ))}
        {pl.tracks.length === 0 && <div className="pl-empty">아직 곡이 없어요.</div>}
      </div>
    </div>
  );
}
