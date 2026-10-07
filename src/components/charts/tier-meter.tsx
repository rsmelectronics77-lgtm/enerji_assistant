import type { TariffPosition, TariffTier } from "@/features/energy/calculations";
import { formatKwh, formatQepik } from "@/lib/format";
import { t } from "@/lib/i18n";

const TIER_BG = ["bg-brand/30", "bg-accent/50", "bg-danger/40"];

interface Props {
  tiers: TariffTier[];
  monthlyKwh: number;
  position: TariffPosition;
}

/** Aylıq istehlakın tarif pillələrində harada olduğunu göstərən zolaq. */
export function TierMeter({ tiers, monthlyKwh, position }: Props) {
  const sorted = [...tiers].sort((a, b) => a.fromKwh - b.fromKwh);
  const last = sorted[sorted.length - 1];
  if (!last) return null;

  const domainMax = Math.max(last.fromKwh * 1.35, monthlyKwh * 1.15, 1);
  const segments = sorted.map((tier, i) => {
    const end = Math.min(tier.toKwh ?? domainMax, domainMax);
    return {
      key: `${tier.fromKwh}`,
      widthPct: ((end - tier.fromKwh) / domainMax) * 100,
      bg: TIER_BG[i % TIER_BG.length] ?? "bg-line",
    };
  });
  const markerPct = Math.min(100, (monthlyKwh / domainMax) * 100);

  return (
    <div>
      <div className="relative">
        <div className="flex h-3 overflow-hidden rounded-full">
          {segments.map((s) => (
            <div key={s.key} className={s.bg} style={{ width: `${s.widthPct}%` }} />
          ))}
        </div>
        <span
          className="absolute top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded bg-ink"
          style={{ left: `${markerPct}%` }}
        />
      </div>
      <p className="mt-3 text-sm">
        <span className="text-muted">{t("dashboard.tierNow")}: </span>
        <span className="font-medium">{formatQepik(position.currentPricePerKwh)}/kWh</span>
        {position.kwhToNextTier !== null && position.nextPricePerKwh !== null ? (
          <span className="text-muted">
            {" · "}
            {t("dashboard.tierNext")} {formatKwh(position.kwhToNextTier)}; {t("dashboard.tierThen")}{" "}
            {formatQepik(position.nextPricePerKwh)}/kWh
          </span>
        ) : (
          <span className="text-muted">
            {" · "}
            {t("dashboard.tierLast")}
          </span>
        )}
      </p>
    </div>
  );
}
