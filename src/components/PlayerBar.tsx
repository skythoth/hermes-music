import { Icon } from './Icons';
import type { PlaybackHandle } from '../hooks/usePlayback';

function formatTime(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function PlayerBar({ pb }: { pb: PlaybackHandle }) {
  if (!pb.currentTrack) return null;

  const pct = pb.duration > 0 ? (pb.position / pb.duration) * 100 : 0;

  return (
    <div className="player-bar">
      {pb.currentTrack.imageUrl ? (
        <img className="pb-art" src={pb.currentTrack.imageUrl} alt="" />
      ) : (
        <div className="pb-art pb-art-empty"><Icon.music /></div>
      )}
      <div className="pb-info">
        <div className="pb-title">{pb.currentTrack.name}</div>
        <div className="pb-artist">{pb.currentTrack.artist}</div>
      </div>
      <button className="pb-toggle" onClick={() => pb.togglePlay()}>
        {pb.playing ? <Icon.pause size={18} /> : <Icon.play size={18} fill="currentColor" />}
      </button>
      <div className="pb-time">{formatTime(pb.position)}</div>
      <div
        className="pb-progress"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          pb.seek(Math.round(ratio * pb.duration));
        }}
      >
        <div className="pb-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="pb-time">{formatTime(pb.duration)}</div>
    </div>
  );
}
