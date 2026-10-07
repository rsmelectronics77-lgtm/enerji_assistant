export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  valueLabel: string;
}

const PALETTE = ["#0f7a4d", "#f2b705", "#2a9d8f", "#e76f51", "#6a4c93", "#577590", "#90be6d", "#9aa5a0"];

/** Dairəvi qrafik (SVG). Hər seqment ümumi cəmin payını göstərir. */
export function DonutChart({ segments, ariaLabel }: { segments: DonutSegment[]; ariaLabel: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  let offset = 0;
  const arcs = segments.map((s, i) => {
    const pct = (s.value / total) * 100;
    const arc = { ...s, pct, offset, color: PALETTE[i % PALETTE.length] ?? "#0f7a4d" };
    offset += pct;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <svg viewBox="0 0 42 42" className="h-40 w-40 shrink-0" role="img" aria-label={ariaLabel}>
        <circle cx="21" cy="21" r="15.9155" fill="none" className="stroke-line" strokeWidth="6" />
        {arcs.map((a) => (
          <circle
            key={a.key}
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            stroke={a.color}
            strokeWidth="6"
            strokeDasharray={`${a.pct} ${100 - a.pct}`}
            strokeDashoffset={25 - a.offset}
          />
        ))}
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {arcs.map((a) => (
          <li key={a.key} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
              <span className="truncate">{a.label}</span>
            </span>
            <span className="shrink-0 text-muted">{a.valueLabel}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
