import { Icon } from './Icons';
import { TrackRow } from './TrackRow';
import { byId } from '../lib/catalog';
import type { Track } from '../lib/catalog';
import type { LayoutMode } from './LayoutSwitch';
import type { RecMessage } from '../hooks/useHermes';

interface RecCardProps {
  rec: RecMessage;
  layout: LayoutMode;
  onFeedback: (recId: number, track: Track, kind: 'like' | 'skip' | 'block') => void;
  onSave: (rec: RecMessage) => void;
}

export function RecCard({ rec, layout, onFeedback, onSave }: RecCardProps) {
  const tracks = rec.trackIds.map(byId).filter((t): t is Track => t !== undefined);
  return (
    <div className="rec">
      <div className="rec-head">
        <div className="rec-head-l">
          <span className="rec-kicker"><Icon.spark /> {rec.title}</span>
          <div className="rec-tags">
            {rec.tags.map((t, i) => (<span key={i} className="chip">{t}</span>))}
          </div>
        </div>
        {rec.adjusted ? <span className="rec-adjusted">재조정됨 ×{rec.adjusted}</span> : null}
      </div>

      <div className={"rec-tracks lay-" + layout}>
        {tracks.map((t, i) => (
          <TrackRow
            key={t.id}
            track={t}
            index={i}
            layout={layout}
            state={rec.feedback[t.id]}
            onFeedback={(track, kind) => onFeedback(rec.id, track, kind)}
          />
        ))}
      </div>

      <div className="rec-reason"><span className="rec-reason-tag">추천 이유</span>{rec.reason}</div>

      <div className="rec-foot">
        {rec.saved
          ? <span className="saved-pill"><Icon.save /> {rec.savedName} 저장됨</span>
          : <button className="btn primary" onClick={() => onSave(rec)}><Icon.save /> 플레이리스트로 저장</button>}
        <span className="rec-foot-hint">좋아요 · 스킵 · 제외를 누르면 이 카드가 그 자리에서 다시 정렬돼요</span>
      </div>
    </div>
  );
}
