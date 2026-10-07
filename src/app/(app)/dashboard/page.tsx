import Link from "next/link";
import { BarList, type BarItem } from "@/components/charts/bar-list";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { TierMeter } from "@/components/charts/tier-meter";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { calculateSummary, tariffPosition, type DeviceInput } from "@/features/energy/calculations";
import { loadTariff } from "@/features/energy/load-tariff";
import { formatKwh, formatMoney, formatPercent } from "@/lib/format";
import { t, type MessageKey } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

interface PropertyRow {
  id: string;
  name: string;
  type: string;
  city: string | null;
}
interface DeviceRow {
  id: string;
  property_id: string;
  name: string;
  power_w: number | string;
  hours_per_day: number | string;
  category_id: string | null;
  is_active: boolean;
}
interface CategoryRow {
  id: string;
  name_az: string;
}

const MAX_DONUT_SEGMENTS = 7;

function Stat({ label, main, sub }: { label: string; main: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold">{main}</p>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const [profileRes, propertiesRes, devicesRes, categoriesRes, tariff] = await Promise.all([
    supabase.from("profiles").select("full_name").maybeSingle(),
    supabase.from("properties").select("id,name,type,city").order("created_at"),
    supabase
      .from("devices")
      .select("id,property_id,name,power_w,hours_per_day,category_id,is_active"),
    supabase.from("device_categories").select("id,name_az"),
    loadTariff(supabase),
  ]);

  const fullName: string | null = profileRes.data?.full_name ?? null;
  const properties = (propertiesRes.data ?? []) as PropertyRow[];
  const devices = (devicesRes.data ?? []) as DeviceRow[];
  const categories = (categoriesRes.data ?? []) as CategoryRow[];

  const greeting = (
    <h1 className="text-2xl font-semibold">
      {t("dashboard.welcome")}
      {fullName ? `, ${fullName}` : ""}
    </h1>
  );

  if (properties.length === 0) {
    return (
      <Card>
        {greeting}
        <p className="mt-2 text-muted">{t("dashboard.intro")}</p>
        <Link href="/properties" className={buttonClass("primary", "mt-5")}>
          {t("dashboard.cta")}
        </Link>
      </Card>
    );
  }

  const money = (v: number) => formatMoney(v, tariff.currency);
  const typeLabel = (type: string) => t(`property.types.${type}` as MessageKey);

  // Hər obyekt ayrıca sayğac kimi hesablanır (öz pillələri və sabit tarifi ilə).
  const rows = properties.map((property) => {
    const inputs: DeviceInput[] = devices
      .filter((d) => d.property_id === property.id)
      .map((d) => ({
        id: d.id,
        name: d.name,
        powerW: Number(d.power_w),
        hoursPerDay: Number(d.hours_per_day),
        isActive: d.is_active,
      }));
    const summary = calculateSummary(inputs, tariff);
    return {
      property,
      summary,
      hasDevices: summary.devices.length > 0,
      position: tariffPosition(summary.monthly.kwh, tariff),
    };
  });

  // Cihazı olmayan obyekt cəmlərə və qrafiklərə daxil edilmir (sabit tarif də sayılmır).
  const active = rows.filter((r) => r.hasDevices);
  const totalKwh = active.reduce((s, r) => s + r.summary.monthly.kwh, 0);
  const totalMonthlyCost = active.reduce((s, r) => s + r.summary.monthly.totalCost, 0);
  const totalYearlyCost = active.reduce((s, r) => s + r.summary.yearly.totalCost, 0);
  const deviceCount = active.reduce((s, r) => s + r.summary.devices.length, 0);

  const propertyBars: BarItem[] = active
    .map((r) => ({
      key: r.property.id,
      label: r.property.name,
      sublabel: typeLabel(r.property.type),
      value: r.summary.monthly.totalCost,
      valueLabel: `${money(r.summary.monthly.totalCost)} · ${formatKwh(r.summary.monthly.kwh)}`,
    }))
    .sort((a, b) => b.value - a.value);

  const allDevices = active.flatMap((r) =>
    r.summary.devices.map((d) => ({ ...d, propertyName: r.property.name })),
  );
  const topDevices: BarItem[] = [...allDevices]
    .sort((a, b) => b.monthlyKwh - a.monthlyKwh)
    .slice(0, 6)
    .map((d) => ({
      key: d.id,
      label: d.name,
      sublabel: d.propertyName,
      value: d.monthlyKwh,
      valueLabel: `${formatKwh(d.monthlyKwh)} · ${money(d.monthlyCost)}`,
    }));

  // Kateqoriyalar üzrə kWh payı
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name_az] as const));
  const categoryIdByDevice = new Map(devices.map((d) => [d.id, d.category_id] as const));
  const kwhByCategory = new Map<string, number>();
  for (const d of allDevices) {
    const categoryId = categoryIdByDevice.get(d.id) ?? null;
    const name = (categoryId ? categoryNameById.get(categoryId) : undefined) ?? t("dashboard.noCategory");
    kwhByCategory.set(name, (kwhByCategory.get(name) ?? 0) + d.monthlyKwh);
  }
  const sortedCategories = [...kwhByCategory.entries()].sort((a, b) => b[1] - a[1]);
  const categoryTotal = sortedCategories.reduce((s, [, v]) => s + v, 0);
  const share = (v: number) => (categoryTotal > 0 ? (v / categoryTotal) * 100 : 0);
  const donutSegments: DonutSegment[] = sortedCategories
    .slice(0, MAX_DONUT_SEGMENTS)
    .map(([name, v]) => ({
      key: name,
      label: name,
      value: v,
      valueLabel: `${formatPercent(share(v))} · ${formatKwh(v)}`,
    }));
  const restKwh = sortedCategories.slice(MAX_DONUT_SEGMENTS).reduce((s, [, v]) => s + v, 0);
  if (restKwh > 0) {
    donutSegments.push({
      key: "__rest",
      label: t("dashboard.otherCategories"),
      value: restKwh,
      valueLabel: `${formatPercent(share(restKwh))} · ${formatKwh(restKwh)}`,
    });
  }

  return (
    <div className="space-y-6">
      {greeting}

      {active.length === 0 ? (
        <Card>
          <p className="text-muted">{t("dashboard.emptyCharts")}</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t("dashboard.monthlyCost")} main={money(totalMonthlyCost)} />
            <Stat label={t("dashboard.monthlyKwh")} main={formatKwh(totalKwh)} />
            <Stat label={t("dashboard.yearlyCost")} main={money(totalYearlyCost)} />
            <Stat label={t("dashboard.deviceCount")} main={String(deviceCount)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold">{t("dashboard.costByProperty")}</h2>
              <BarList items={propertyBars} />
            </Card>
            <Card>
              <h2 className="mb-4 text-lg font-semibold">{t("dashboard.byCategory")}</h2>
              <DonutChart segments={donutSegments} ariaLabel={t("dashboard.byCategory")} />
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">{t("dashboard.topDevices")}</h2>
            <BarList items={topDevices} />
          </Card>
        </>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("dashboard.propertiesTitle")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <Link key={r.property.id} href={`/properties/${r.property.id}`} className="block">
              <Card className="h-full transition hover:border-brand">
                <p className="text-lg font-semibold">{r.property.name}</p>
                <p className="text-sm text-muted">
                  {typeLabel(r.property.type)}
                  {r.property.city ? ` · ${r.property.city}` : ""}
                </p>
                {r.hasDevices ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xl font-semibold">{money(r.summary.monthly.totalCost)}</p>
                      <p className="text-sm text-muted">{formatKwh(r.summary.monthly.kwh)}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                        {t("dashboard.tierMeter")}
                      </p>
                      <TierMeter
                        tiers={tariff.tiers}
                        monthlyKwh={r.summary.monthly.kwh}
                        position={r.position}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted">{t("dashboard.noDevices")}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted">
        {t("results.tariff")}: {tariff.name}. {t("dashboard.estimateNote")}
      </p>
    </div>
  );
}
