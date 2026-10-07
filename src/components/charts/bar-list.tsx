export interface BarItem {
  key: string;
  label: string;
  sublabel?: string;
  value: number;
  valueLabel: string;
}

/** Üfüqi sütun siyahısı. Ən böyük dəyər 100% enini tutur. Serverdə çəkilir, JS lazım deyil. */
export function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(0, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              <span className="font-medium">{i.label}</span>
              {i.sublabel && <span className="ml-2 text-xs text-muted">{i.sublabel}</span>}
            </span>
            <span className="shrink-0 text-muted">{i.valueLabel}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-line">
            <div
              className="h-2 rounded-full bg-brand"
              style={{ width: `${max > 0 ? (i.value / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
