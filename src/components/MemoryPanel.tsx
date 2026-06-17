import { Icon } from './Icons';
import { TAG_LABELS, topKey } from '../lib/catalog';
import type { HermesState } from '../hooks/useHermes';
import type { Profile } from '../lib/catalog';

function nextDirections(p: Profile): string[] {
  const out: string[] = [];
  const g = TAG_LABELS["genre:" + topKey(p.genre)];
  const m = TAG_LABELS["mood:" + topKey(p.mood)];
  if (g) out.push(`${g} 가중치를 더 강화하고 유사 아티스트를 확장`);
  if (m) out.push(`'${m}' 상황의 BPM ${Math.round(p.bpmTarget)} 부근을 우선 탐색`);
  out.push("제외·스킵된 분위기 태그는 추천 점수를 단계적으로 하향");
  return out.slice(0, 3);
}

interface MemoryPanelProps {
  H: HermesState;
}

export function MemoryPanel({ H }: MemoryPanelProps) {
  return (
    <div className="memory">
      <div className="mem-score">
        <div className="mem-score-top">
          <span className="mem-label">추천 적합도</span>
          <span className="mem-evolving"><span className="pulse-dot" /> 학습 중</span>
        </div>
        <div className="mem-score-num"><strong>{H.fit}</strong><span>%</span></div>
        <div className="meter"><span style={{ width: H.fit + "%" }} /></div>
        <div className="mem-score-sub">피드백 {H.profile.feedbackCount}회 · 좋아요 {H.profile.likes}건 누적</div>
      </div>

      <div className="mem-block">
        <div className="mem-h">기억된 취향</div>
        <div className="mem-tags">
          {H.tags.map((t) => (
            <span
              key={t.key}
              className={"mem-tag" + (t.weight > 0 ? " pos" : " neg") + (t.meta ? " meta" : "") + (H.newTagKeys.includes(t.key) ? " new" : "")}
              style={{ "--w": Math.min(1, Math.abs(t.weight)) } as React.CSSProperties}
            >
              {t.weight < 0 && !t.meta ? "↓ " : ""}{t.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mem-block">
        <div className="mem-h">최근 피드백</div>
        {H.feed.length === 0
          ? <div className="mem-empty">아직 없음 — 추천에 반응하면 여기에 쌓여요.</div>
          : (
            <ul className="mem-feed">
              {H.feed.map((f, i) => (
                <li key={i} className={"feed-" + f.kind}><span className="feed-dot" />{f.label}</li>
              ))}
            </ul>
          )}
      </div>

      <div className="mem-block next">
        <div className="mem-h">다음 진화 방향</div>
        <ul className="mem-next">
          {nextDirections(H.profile).map((d, i) => (<li key={i}>{d}</li>))}
        </ul>
      </div>
    </div>
  );
}
