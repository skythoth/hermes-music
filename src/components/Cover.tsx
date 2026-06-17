import type { Track } from '../lib/catalog';
import { coverStyle } from '../lib/catalog';

interface CoverProps {
  track: Track;
  size?: number | string;
  radius?: number;
}

export function Cover({ track, size = 48, radius = 10 }: CoverProps) {
  return (
    <div
      className="cover"
      style={{ width: size, height: size, borderRadius: radius, background: coverStyle(track) }}
    >
      <span className="cover-glyph">{track.artist[0]}</span>
    </div>
  );
}
