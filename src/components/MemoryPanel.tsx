import { TAG_LABELS } from '../lib/catalog';
import type { HermesState } from '../hooks/useHermes';
import type { Profile } from '../lib/catalog';

function sorted(obj: Record<string, number>): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

function nextDirections(p: Profile): string[] {
  const out: string[] = [];

  // 1. 상위 2개 장르 비교 — 경쟁 or 독주
  const genres = sorted(p.genre).filter(([, v]) => v > 0);
  if (genres.length >= 2) {
    const [g1, v1] = genres[0];
    const [g2, v2] = genres[1];
    const l1 = TAG_LABELS["genre:" + g1] || g1;
    const l2 = TAG_LABELS["genre:" + g2] || g2;
    if (v1 - v2 < 0.15) {
      out.push(`${l1}과 ${l2}이(가) 경합 중 — 피드백이 방향을 결정해요`);
    } else {
      out.push(`${l1} 중심, ${l2}을(를) 서브로 활용해 다양성 유지`);
    }
  } else if (genres.length === 1) {
    const l = TAG_LABELS["genre:" + genres[0][0]] || genres[0][0];
    out.push(`${l} 단일 집중 모드 — 다른 장르 피드백으로 폭을 넓힐 수 있어요`);
  }

  // 2. BPM + 에너지 조합 인사이트
  const bpm = Math.round(p.bpmTarget);
  const nrg = Math.round(p.energyTarget);
  if (bpm >= 130 && nrg >= 80) {
    out.push(`고BPM(${bpm}) + 고에너지(${nrg}) → 강한 운동·파티 모드`);
  } else if (bpm <= 100 && nrg <= 50) {
    out.push(`저BPM(${bpm}) + 로에너지(${nrg}) → 차분한 집중·릴렉스 모드`);
  } else if (bpm >= 120 && nrg <= 60) {
    out.push(`빠른 템포(${bpm})지만 에너지 낮음(${nrg}) → 그루비한 드라이브 무드`);
  } else {
    out.push(`BPM ${bpm} · 에너지 ${nrg} 밸런스 — 무드에 따라 유연하게 조절 중`);
  }

  // 3. 회피 패턴 감지
  const avoided = sorted(p.mood).filter(([, v]) => v < -0.15);
  const avoidedGenres = sorted(p.genre).filter(([, v]) => v < -0.15);
  const allAvoided = [
    ...avoided.map(([k]) => TAG_LABELS["mood:" + k] || k),
    ...avoidedGenres.map(([k]) => TAG_LABELS["genre:" + k] || k),
  ];
  if (allAvoided.length > 0) {
    out.push(`${allAvoided.slice(0, 3).join(', ')} 계열은 추천 점수 하향 중`);
  } else {
    // 좋아요/피드백 비율 기반
    const ratio = p.feedbackCount > 0 ? Math.round((p.likes / p.feedbackCount) * 100) : 0;
    if (p.feedbackCount >= 5) {
      out.push(`좋아요 비율 ${ratio}% — ${ratio >= 70 ? '취향 파악이 잘 되고 있어요' : '더 많은 피드백이 정확도를 높여요'}`);
    } else {
      out.push(`피드백 ${p.feedbackCount}회 — 5회 이상부터 추천이 눈에 띄게 정밀해져요`);
    }
  }

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
        <div className="mem-h" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          🧠 Hermes 기억
          <button
            className="btn"
            style={{ fontSize: 11, padding: '2px 8px' }}
            onClick={() => H.refreshHermesTaste()}
          >
            새로고침
          </button>
        </div>
        <div className="mem-tags">
          {H.hermesTaste.length === 0
            ? <div className="mem-empty">'새로고침'을 누르면 Hermes가 기억하는 취향이 떠요.</div>
            : H.hermesTaste.map((t) => (
                <span key={t} className="mem-tag pos">{t}</span>
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
