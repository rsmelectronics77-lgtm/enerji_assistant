import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityForm, type FormField } from "@/components/forms/entity-form";
import { TierMeter } from "@/components/charts/tier-meter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { calculateSummary, tariffPosition, type DeviceInput } from "@/features/energy/calculations";
import { loadTariff } from "@/features/energy/load-tariff";
import {
  createDeviceAction,
  createRoomAction,
  deleteDeviceAction,
} from "@/features/properties/actions";
import { t, type MessageKey } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

interface PropertyRow {
  id: string;
  name: string;
  type: string;
  city: string | null;
}
interface RoomRow {
  id: string;
  name: string;
}
interface CategoryRow {
  id: string;
  name_az: string;
}
interface DeviceRow {
  id: string;
  name: string;
  power_w: number | string;
  hours_per_day: number | string;
  room_id: string | null;
  category_id: string | null;
  is_active: boolean;
}

const nf = new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 2 });

function Stat({ label, main, sub }: { label: string; main: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold">{main}</p>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  );
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: propertyData } = await supabase
    .from("properties")
    .select("id,name,type,city")
    .eq("id", id)
    .maybeSingle();
  if (!propertyData) notFound();
  const property = propertyData as PropertyRow;

  const [roomsRes, devicesRes, categoriesRes, tariff] = await Promise.all([
    supabase.from("rooms").select("id,name").eq("property_id", id).order("created_at"),
    supabase
      .from("devices")
      .select("id,name,power_w,hours_per_day,room_id,category_id,is_active")
      .eq("property_id", id)
      .order("created_at"),
    supabase.from("device_categories").select("id,name_az").order("name_az"),
    loadTariff(supabase),
  ]);
  const rooms = (roomsRes.data ?? []) as RoomRow[];
  const devices = (devicesRes.data ?? []) as DeviceRow[];
  const categories = (categoriesRes.data ?? []) as CategoryRow[];

  const inputs: DeviceInput[] = devices.map((d) => ({
    id: d.id,
    name: d.name,
    powerW: Number(d.power_w),
    hoursPerDay: Number(d.hours_per_day),
    isActive: d.is_active,
  }));
  const summary = calculateSummary(inputs, tariff);
  const position = tariffPosition(summary.monthly.kwh, tariff);
  const money = (v: number) =>
    new Intl.NumberFormat("az-AZ", { style: "currency", currency: summary.currency }).format(v);
  const kwh = (v: number) => `${nf.format(v)} kWh`;

  const resultById = new Map(summary.devices.map((r) => [r.id, r] as const));
  const roomName = new Map(rooms.map((r) => [r.id, r.name] as const));
  const categoryName = new Map(categories.map((c) => [c.id, c.name_az] as const));

  const roomFields: FormField[] = [
    { name: "name", label: t("room.name"), kind: "text", placeholder: "Qonaq otağı" },
  ];
  const deviceFields: FormField[] = [
    { name: "name", label: t("device.name"), kind: "text", placeholder: "Kondisioner" },
    {
      name: "categoryId",
      label: t("device.category"),
      kind: "select",
      emptyLabel: t("common.none"),
      options: categories.map((c) => ({ value: c.id, label: c.name_az })),
    },
    {
      name: "roomId",
      label: t("device.room"),
      kind: "select",
      emptyLabel: t("room.unassigned"),
      options: rooms.map((r) => ({ value: r.id, label: r.name })),
    },
    { name: "powerW", label: t("device.power"), kind: "number", placeholder: "1500" },
    { name: "hoursPerDay", label: t("device.hours"), kind: "number", placeholder: "8" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/properties" className="text-sm text-muted hover:text-ink">
          ← {t("property.title")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{property.name}</h1>
        <p className="text-sm text-muted">
          {t(`property.types.${property.type}` as MessageKey)}
          {property.city ? ` · ${property.city}` : ""}
        </p>
      </div>

      {devices.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold">{t("results.title")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Stat label={t("results.daily")} main={kwh(summary.dailyKwh)} />
            <Stat
              label={t("results.monthly")}
              main={money(summary.monthly.totalCost)}
              sub={kwh(summary.monthly.kwh)}
            />
            <Stat
              label={t("results.yearly")}
              main={money(summary.yearly.totalCost)}
              sub={kwh(summary.yearly.kwh)}
            />
          </div>

          <dl className="mt-5 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t("results.energyCost")}</dt>
              <dd>{money(summary.monthly.energyCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t("results.fixedCharge")}</dt>
              <dd>{money(summary.monthly.fixedCharge)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>{t("results.total")}</dt>
              <dd>{money(summary.monthly.totalCost)}</dd>
            </div>
          </dl>

          <h3 className="mt-6 text-sm font-semibold">{t("dashboard.tierMeter")}</h3>
          <div className="mt-3">
            <TierMeter tiers={tariff.tiers} monthlyKwh={summary.monthly.kwh} position={position} />
          </div>

          <h3 className="mt-6 text-sm font-semibold">{t("results.topDevices")}</h3>
          <ul className="mt-3 space-y-3">
            {summary.devices.slice(0, 5).map((d) => (
              <li key={d.id}>
                <div className="flex justify-between text-sm">
                  <span>{d.name}</span>
                  <span className="text-muted">
                    {nf.format(d.sharePercent)}% · {kwh(d.monthlyKwh)}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-line">
                  <div
                    className="h-2 rounded-full bg-brand"
                    style={{ width: `${Math.min(100, d.sharePercent)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-xs text-muted">
            {t("results.tariff")}: {summary.tariffName}. {t("results.estimateNote")}
          </p>
        </Card>
      )}

      <Card>
        <h2 className="mb-4 text-lg font-semibold">{t("device.title")}</h2>
        {devices.length === 0 ? (
          <p className="text-muted">{t("device.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 pr-3 font-medium">{t("device.name")}</th>
                  <th className="py-2 pr-3 font-medium">{t("device.room")}</th>
                  <th className="py-2 pr-3 font-medium">{t("device.power")}</th>
                  <th className="py-2 pr-3 font-medium">{t("device.hours")}</th>
                  <th className="py-2 pr-3 font-medium">{t("device.monthlyKwh")}</th>
                  <th className="py-2 pr-3 font-medium">{t("device.monthlyCost")}</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => {
                  const r = resultById.get(d.id);
                  const room = d.room_id ? roomName.get(d.room_id) : undefined;
                  const category = d.category_id ? categoryName.get(d.category_id) : undefined;
                  return (
                    <tr key={d.id} className="border-b border-line last:border-0">
                      <td className="py-2 pr-3">
                        <span className="font-medium">{d.name}</span>
                        {category && <span className="block text-xs text-muted">{category}</span>}
                      </td>
                      <td className="py-2 pr-3">{room ?? t("room.unassigned")}</td>
                      <td className="py-2 pr-3">{nf.format(Number(d.power_w))}</td>
                      <td className="py-2 pr-3">{nf.format(Number(d.hours_per_day))}</td>
                      <td className="py-2 pr-3">{r ? nf.format(r.monthlyKwh) : "—"}</td>
                      <td className="py-2 pr-3">{r ? money(r.monthlyCost) : "—"}</td>
                      <td className="py-2 text-right">
                        <form action={deleteDeviceAction}>
                          <input type="hidden" name="propertyId" value={property.id} />
                          <input type="hidden" name="deviceId" value={d.id} />
                          <Button type="submit" variant="ghost" className="h-8 px-3 text-danger">
                            {t("common.delete")}
                          </Button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">{t("device.add")}</h2>
        <EntityForm
          action={createDeviceAction}
          fields={deviceFields}
          submitLabel={t("device.add")}
          hidden={{ propertyId: property.id }}
        />
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t("room.title")}</h2>
        {rooms.length === 0 ? (
          <p className="mb-4 text-muted">{t("room.empty")}</p>
        ) : (
          <ul className="mb-4 flex flex-wrap gap-2">
            {rooms.map((r) => (
              <li key={r.id} className="rounded-full border border-line px-3 py-1 text-sm">
                {r.name}
              </li>
            ))}
          </ul>
        )}
        <EntityForm
          action={createRoomAction}
          fields={roomFields}
          submitLabel={t("room.add")}
          hidden={{ propertyId: property.id }}
        />
      </Card>
    </div>
  );
}
