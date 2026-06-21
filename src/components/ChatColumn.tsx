import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { RecCard } from './RecCard';
import type { HermesState } from '../hooks/useHermes';



const QUICK_PROMPTS = [
  { label: "운동 모드", text: "운동할 때 들을 강한 비트 음악 추천해줘. 빠른 템포로." },
  { label: "집중 모드", text: "공부할 때 방해 안 되는 잔잔한 곡 추천해줘." },
  { label: "감성 드라이브", text: "새벽 드라이브에 어울리는 곡 추천해줘." },
  { label: "파티 EDM", text: "친구들이랑 놀 때 신나는 EDM 틀어줘." },
];

const REFINE_CHIPS = [
  { label: "더 신나게", patch: { energyTarget: 96, bpmTarget: 142 } },
  { label: "조금 차분하게", patch: { energyTarget: 48, bpmTarget: 102 } },
  { label: "가사 적은 곡", patch: { vocal: { inst: 0.4 } } },
  { label: "여성 보컬 유지", patch: { vocal: { female: 0.3 } } },
];

interface ChatColumnProps {
  H: HermesState;
  dense?: boolean;
  onPlay?: (uri: string) => void;
}

export function ChatColumn({ H, dense, onPlay }: ChatColumnProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [H.messages.length, H.thinking]);

  const send = async() => {
    const v = draft.trim();
    if (!v) return;

    H.sendTurn(v);

    setDraft("");


  };
  const hasRec = H.messages.some((m) => m.kind === "rec");
  const showQuick = !hasRec;

  return (
    <div className={"chat" + (dense ? " dense" : "")}>
      <div className="chat-log" ref={logRef}>
        {H.messages.map((m, i) => {
          if (m.kind === "user") return (<div key={i} className="bubble user"><p>{m.text}</p></div>);
          if (m.kind === "agent") return (
            <div key={i} className="bubble agent">
              <span className="agent-tag"><Icon.spark /> Hermes</span>
              <p>{m.text}</p>
            </div>
          );
          return (
            <RecCard
              key={i}
              rec={m}
              layout={H.layout}
              onFeedback={H.onFeedback}
              onSave={H.savePlaylist}
              onPlay={onPlay}
            />
          );
        })}

        {showQuick && (
          <div className="quick-prompts">
            {QUICK_PROMPTS.map((q) => (
              <button key={q.label} className="qp" onClick={() => H.sendTurn(q.text)}>
                <span className="qp-label">{q.label}</span>
                <span className="qp-text">{q.text}</span>
              </button>
            ))}
          </div>
        )}

        {H.thinking && (
          <div className="bubble agent thinking">
            <span className="agent-tag"><Icon.spark /> Hermes</span>
            <span className="dots"><i /><i /><i /></span>
          </div>
        )}
      </div>

      <div className="composer">
        <div className="refine-row">
          {REFINE_CHIPS.map((c) => (
            <button key={c.label} className="refine-chip" disabled={!hasRec} onClick={() => H.refine(c.label, c.patch)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="composer-row">
          <input
            className="composer-input"
            placeholder="무드·상황·요청을 자연어로 적어보세요. 예: 여성 보컬은 유지하고 BPM만 조금 낮춰줘"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          />
          <button className="send-btn" onClick={send}><Icon.send /></button>
        </div>
      </div>
    </div>
  );
}
