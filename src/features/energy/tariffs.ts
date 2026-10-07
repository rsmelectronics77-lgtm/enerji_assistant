import type { Tariff } from "./calculations";

/**
 * Azərbaycan, əhali (məişət) tarifi, ƏDV daxil, AZN.
 *
 * Mənbə: Tarif (Qiymət) Şurasının 29.12.2024 tarixli 19 nömrəli qərarı
 * (pillələr, 02.01.2025-dən) və sonradan ona edilmiş dəyişiklik (sabit tarif,
 * əhali üçün 1 manat/ay, 01.01.2026-dan). Rəsmi cədvəl: regulator.gov.az.
 *
 * Son yoxlama: 2026-10-06. Tarif dəyişə bilər: istifadədən əvvəl rəsmi mənbə ilə
 * yenidən yoxla. Əsas mənbə verilənlər bazasındakı tariff_plans cədvəlidir;
 * bu sabit yalnız ehtiyat (fallback) və testlər üçündür.
 */
export const AZ_HOUSEHOLD_TARIFF: Tariff = {
  name: "Azərbaycan — əhali (ƏDV daxil)",
  currency: "AZN",
  fixedMonthlyCharge: 1.0,
  tiers: [
    { fromKwh: 0, toKwh: 200, pricePerKwh: 0.084 },
    { fromKwh: 200, toKwh: 300, pricePerKwh: 0.1 },
    { fromKwh: 300, toKwh: null, pricePerKwh: 0.15 },
  ],
};
