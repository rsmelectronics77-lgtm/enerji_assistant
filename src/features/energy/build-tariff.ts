import type { Tariff } from "./calculations";

export interface PlanRow {
  name: string;
  currency: string;
  fixed_monthly_charge: number | string | null;
}

export interface TierRow {
  from_kwh: number | string;
  to_kwh: number | string | null;
  price_per_kwh: number | string;
}

/** Verilənlər bazasındakı sətirləri hesablama mühərrikinin Tariff tipinə çevirir. */
export function buildTariff(plan: PlanRow, tiers: TierRow[]): Tariff {
  return {
    name: plan.name,
    currency: plan.currency.trim(),
    fixedMonthlyCharge: Number(plan.fixed_monthly_charge ?? 0),
    tiers: tiers.map((tier) => ({
      fromKwh: Number(tier.from_kwh),
      toKwh: tier.to_kwh === null ? null : Number(tier.to_kwh),
      pricePerKwh: Number(tier.price_per_kwh),
    })),
  };
}
