import type { createClient } from "@/lib/supabase/server";
import { buildTariff } from "./build-tariff";
import { validateTariff, type Tariff } from "./calculations";
import { AZ_HOUSEHOLD_TARIFF } from "./tariffs";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Qüvvədə olan Azərbaycan əhali tarifini bazadan oxuyur.
 * Baza boşdursa və ya tarif yanlışdırsa, kodda saxlanan ehtiyat tarifə qayıdır.
 * (Sonradan: istifadəçinin profilindəki seçilmiş tarif də dəstəklənəcək.)
 */
export async function loadTariff(supabase: Supabase): Promise<Tariff> {
  const { data: plan } = await supabase
    .from("tariff_plans")
    .select("id,name,currency,fixed_monthly_charge")
    .eq("is_system", true)
    .eq("country", "AZ")
    .is("valid_to", null)
    .order("valid_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!plan) return AZ_HOUSEHOLD_TARIFF;

  const { data: tiers } = await supabase
    .from("tariff_tiers")
    .select("from_kwh,to_kwh,price_per_kwh")
    .eq("plan_id", plan.id)
    .order("from_kwh", { ascending: true });
  if (!tiers || tiers.length === 0) return AZ_HOUSEHOLD_TARIFF;

  const tariff = buildTariff(plan, tiers);
  try {
    validateTariff(tariff);
    return tariff;
  } catch {
    return AZ_HOUSEHOLD_TARIFF;
  }
}
