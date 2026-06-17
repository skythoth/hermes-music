export type LayoutMode = 'list' | 'cover' | 'compact';

interface LayoutSwitchProps {
  value: LayoutMode;
  onChange: (v: LayoutMode) => void;
}

const opts: [LayoutMode, string][] = [["list", "리스트"], ["cover", "커버"], ["compact", "컴팩트"]];

export function LayoutSwitch({ value, onChange }: LayoutSwitchProps) {
  return (
    <div className="seg">
      {opts.map(([v, label]) => (
        <button key={v} className={"seg-btn" + (v === value ? " on" : "")} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  );
}
