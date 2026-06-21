import { Icon } from './Icons';
import type { Track } from '../lib/catalog';
import { coverStyle } from '../lib/catalog';

interface CoverProps {
  track: Track;
  size?: number | string;
  radius?: number;
  onPlay?: () => void;
}

export function Cover({ track, size = 48, radius = 10, onPlay }: CoverProps) {
  const inner = track.imageUrl ? (
    <img
      src={track.imageUrl}
      alt=""
      className="cover-img"
      style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover' }}
    />
  ) : (
    <div
      className="cover-grad"
      style={{ width: size, height: size, borderRadius: radius, background: coverStyle(track) }}
    >
      <span className="cover-glyph">{track.artist[0]}</span>
    </div>
  );

  return (
    <div
      className={'cover' + (onPlay ? ' cover-playable' : '')}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      {inner}
      {onPlay && (
        <button className="cover-play-overlay" onClick={(e) => { e.stopPropagation(); onPlay(); }}>
          <Icon.play size={18} fill="currentColor" />
        </button>
      )}
    </div>
  );
}
