import { useState } from 'react';
import { Icon } from './Icons';
import { ChatColumn } from './ChatColumn';
import { MemoryPanel } from './MemoryPanel';
import type { HermesState } from '../hooks/useHermes';

interface MobileAppProps {
  H: HermesState;
}

export function MobileApp({ H }: MobileAppProps) {
  const [tab, setTab] = useState<'chat' | 'mem'>("chat");
  return (
    <div className="mob">
      <div className="mob-top">
        <div className="mob-brand">
          <span className="brand-mark sm"><Icon.spark /></span> Hermes
        </div>
        <span className="status sm"><span className="pulse-dot" /> {H.fit}%</span>
      </div>

      {tab === "chat"
        ? <div className="mob-body"><ChatColumn H={H} dense /></div>
        : <div className="mob-body mem-scroll"><MemoryPanel H={H} /></div>}

      <nav className="mob-tabs">
        <button className={tab === "chat" ? "on" : ""} onClick={() => setTab("chat")}>
          <Icon.spark /> 추천
        </button>
        <button className={tab === "mem" ? "on" : ""} onClick={() => setTab("mem")}>
          <Icon.heart fill="currentColor" /> 취향
        </button>
      </nav>
      {H.toast && <div className="toast mob-toast">{H.toast}</div>}
    </div>
  );
}
