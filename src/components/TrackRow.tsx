import { Icon } from './Icons';
import { Cover } from './Cover';
import type { Track } from '../lib/catalog';

type FeedbackKind = 'like' | 'skip' | 'block';

interface TrackRowProps {
  track: Track;
  layout: 'list' | 'cover' | 'compact';
  state?: FeedbackKind;
  onFeedback: (track: Track, kind: FeedbackKind) => void;
  onPlay?: (uri: string) => void;
  index: number;
}

function fbLabel(fb: FeedbackKind): string {
  return fb === "like" ? "좋아요" : fb === "skip" ? "스킵" : "제외";
}

export { fbLabel };

export function TrackRow({ track, layout, state: fb, onFeedback, onPlay, index }: TrackRowProps) {
  const playable = onPlay && track.spotifyUri;
  const handlePlay = playable ? () => onPlay(track.spotifyUri!) : undefined;
  const cls = "trk trk-" + layout + (fb ? " fb-" + fb : "");
  const btns = (
    <div className="trk-actions">
      <button className={"fb-btn like" + (fb === "like" ? " on" : "")} title="좋아요" onClick={() => onFeedback(track, "like")}>
        <Icon.heart fill={fb === "like" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" />
      </button>
      <button className={"fb-btn skip" + (fb === "skip" ? " on" : "")} title="스킵" onClick={() => onFeedback(track, "skip")}>
        <Icon.skip />
      </button>
      <button className={"fb-btn block" + (fb === "block" ? " on" : "")} title="제외" onClick={() => onFeedback(track, "block")}>
        <Icon.ban />
      </button>
    </div>
  );

  if (layout === "cover") {
    return (
      <div className={cls}>
        <Cover track={track} size="100%" radius={14} onPlay={handlePlay} />
        <div className="trk-cover-info">
          <div className="trk-title">{track.title}</div>
          <div className="trk-sub">{track.artist}</div>
          <div className="trk-meta">{track.bpm} BPM · {track.genre}</div>
        </div>
        {btns}
        {fb && <span className="fb-flag">{fbLabel(fb)}</span>}
      </div>
    );
  }

  if (layout === "compact") {
    return (
      <div className={cls}>
        <span className="trk-idx">{index + 1}</span>
        <div className="trk-main">
          <span className="trk-title">{track.title}</span>
          <span className="trk-sub">· {track.artist}</span>
        </div>
        <span className="trk-meta">{track.bpm} BPM</span>
        {btns}
      </div>
    );
  }

  // default: list
  return (
    <div className={cls}>
      <Cover track={track} size={48} onPlay={handlePlay} />
      <div className="trk-main">
        <div className="trk-title">{track.title}</div>
        <div className="trk-sub">{track.artist} · {track.album}</div>
      </div>
      <div className="trk-tags">
        <span className="chip-mini">{track.bpm} BPM</span>
        <span className="chip-mini">{track.genre}</span>
      </div>
      {btns}
      {fb && <span className="fb-flag">{fbLabel(fb)}</span>}
    </div>
  );
}
