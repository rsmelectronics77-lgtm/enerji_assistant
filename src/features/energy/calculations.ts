/**
 * Enerji hesablama mühərriki (Stage 4).
 *
 * Təmiz (pure) funksiyalar: verilənlər bazasına, React-a və AI-a bağlı deyil.
 * Bütün hesablamanı yalnız bu fayl edir. AI nəticələri analiz edir, özü rəqəm hesablamır.
 *
 * Qaydalar:
 *  - kWh = güc(W) × saat / 1000
 *  - Ay = 30 gün (Tarif Şurasının "aylıq istehlak" tərifi: ardıcıl 30 təqvim günü).
 *  - İl = 365 gün. İllik xərc: orta ay (365/12 gün) pilləli tarifdən keçirilir, ×12.
 *  - Pilləli tarif: hər pillənin öz qiyməti yalnız həmin pillədəki kWh-a tətbiq olunur.
 *  - Sabit aylıq tarif (varsa) enerji xərcindən ayrıca göstərilir.
 *  - Cihaz payı: enerji xərci cihazın kWh payına görə bölünür (sabit tarif bölünmür).
 */

export const DAYS_PER_MONTH = 30;
export const DAYS_PER_YEAR = 365;
const MONTHS_PER_YEAR = 12;

// ───────── Tiplər ─────────

export interface TariffTier {
  /** Pillənin başlanğıcı (aylıq kWh), daxil deyil. İlk pillə 0-dan başlayır. */
  fromKwh: number;
  /** Pillənin sonu (aylıq kWh). null = limitsiz son pillə. */
  toKwh: number | null;
  /** 1 kWh üçün qiymət (valyutada, məs. AZN). */
  pricePerKwh: number;
}

export interface Tariff {
  name: string;
  currency: string;
  tiers: TariffTier[];
  /** Hər ay istehlakdan asılı olmayaraq ödənilən sabit tarif. */
  fixedMonthlyCharge: number;
}

export interface DeviceInput {
  id: string;
  name: string;
  /** Güc, vatt (W). */
  powerW: number;
  /** Gündə neçə saat işləyir (0-24). */
  hoursPerDay: number;
  /** false olarsa hesablamaya daxil edilmir. Verilməyibsə aktiv sayılır. */
  isActive?: boolean;
}

export interface DeviceResult {
  id: string;
  name: string;
  dailyKwh: number;
  monthlyKwh: number;
  yearlyKwh: number;
  /** Enerji xərcindən bu cihaza düşən pay (sabit tarif daxil deyil). */
  monthlyCost: number;
  yearlyCost: number;
  /** Ümumi kWh-dakı pay, faizlə. */
  sharePercent: number;
}

export interface PeriodTotals {
  kwh: number;
  /** Yalnız kWh üzrə enerji xərci. */
  energyCost: number;
  /** Sabit tarif. */
  fixedCharge: number;
  /** energyCost + fixedCharge. */
  totalCost: number;
}

export interface EnergySummary {
  currency: string;
  tariffName: string;
  dailyKwh: number;
  monthly: PeriodTotals;
  yearly: PeriodTotals;
  /** Ən çox enerji işlədəndən başlayaraq sıralanıb. */
  devices: DeviceResult[];
}

// ───────── Xətalar ─────────

export class EnergyInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnergyInputError";
  }
}

// ───────── Köməkçilər ─────────

function roundTo(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round((value + Number.EPSILON) * f) / f;
}

const roundKwh = (v: number) => roundTo(v, 3);
const roundMoney = (v: number) => roundTo(v, 2);
const roundPercent = (v: number) => roundTo(v, 1);

function assertFiniteNumber(value: number, label: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new EnergyInputError(`${label} düzgün rəqəm olmalıdır.`);
  }
}

// ───────── Tarif yoxlaması və xərc ─────────

/**
 * Tarifi yoxlayır və pillələri sıralanmış surətdə qaytarır.
 * Qaydalar: pillələr 0-dan başlayır, boşluqsuz və üst-üstə düşmədən ardıcıldır,
 * yalnız son pillə limitsizdir (toKwh = null), qiymətlər mənfi deyil.
 */
export function validateTariff(tariff: Tariff): TariffTier[] {
  assertFiniteNumber(tariff.fixedMonthlyCharge, "Sabit tarif");
  if (tariff.fixedMonthlyCharge < 0) {
    throw new EnergyInputError("Sabit tarif mənfi ola bilməz.");
  }
  if (tariff.tiers.length === 0) {
    throw new EnergyInputError("Tarifdə ən azı bir pillə olmalıdır.");
  }

  const tiers = [...tariff.tiers].sort((a, b) => a.fromKwh - b.fromKwh);

  let expectedFrom = 0;
  tiers.forEach((tier, index) => {
    assertFiniteNumber(tier.fromKwh, "Pillənin başlanğıcı");
    assertFiniteNumber(tier.pricePerKwh, "Pillənin qiyməti");
    if (tier.pricePerKwh < 0) {
      throw new EnergyInputError("Pillə qiyməti mənfi ola bilməz.");
    }
    if (tier.fromKwh !== expectedFrom) {
      throw new EnergyInputError(
        `Pillələr boşluqsuz və üst-üstə düşmədən ardıcıl olmalıdır (gözlənilən başlanğıc: ${expectedFrom}, verilən: ${tier.fromKwh}).`,
      );
    }
    const isLast = index === tiers.length - 1;
    if (isLast) {
      if (tier.toKwh !== null) {
        throw new EnergyInputError("Son pillə limitsiz olmalıdır (toKwh = null).");
      }
    } else {
      if (tier.toKwh === null) {
        throw new EnergyInputError("Yalnız son pillə limitsiz ola bilər.");
      }
      assertFiniteNumber(tier.toKwh, "Pillənin sonu");
      if (tier.toKwh <= tier.fromKwh) {
        throw new EnergyInputError("Pillənin sonu başlanğıcından böyük olmalıdır.");
      }
      expectedFrom = tier.toKwh;
    }
  });

  return tiers;
}

/** Bir aylıq kWh üçün enerji xərci (sabit tarif daxil deyil). */
export function monthlyEnergyCost(monthlyKwh: number, tariff: Tariff): number {
  assertFiniteNumber(monthlyKwh, "Aylıq kWh");
  if (monthlyKwh < 0) {
    throw new EnergyInputError("Aylıq kWh mənfi ola bilməz.");
  }
  const tiers = validateTariff(tariff);

  let cost = 0;
  for (const tier of tiers) {
    if (monthlyKwh <= tier.fromKwh) break;
    const upper = tier.toKwh === null ? monthlyKwh : Math.min(monthlyKwh, tier.toKwh);
    cost += (upper - tier.fromKwh) * tier.pricePerKwh;
  }
  return cost;
}

// ───────── Cihaz hesabı ─────────

/** Bir cihazın gündəlik istehlakı, kWh. */
export function deviceDailyKwh(powerW: number, hoursPerDay: number): number {
  assertFiniteNumber(powerW, "Güc (W)");
  assertFiniteNumber(hoursPerDay, "Saat");
  if (powerW < 0) throw new EnergyInputError("Güc mənfi ola bilməz.");
  if (hoursPerDay < 0 || hoursPerDay > 24) {
    throw new EnergyInputError("Gündəlik istifadə saatı 0 ilə 24 arasında olmalıdır.");
  }
  return (powerW * hoursPerDay) / 1000;
}

// ───────── Ümumi hesab ─────────

export function calculateSummary(devices: DeviceInput[], tariff: Tariff): EnergySummary {
  validateTariff(tariff);

  const active = devices.filter((d) => d.isActive !== false);
  const rows = active.map((d) => ({
    id: d.id,
    name: d.name,
    dailyKwh: deviceDailyKwh(d.powerW, d.hoursPerDay),
  }));

  const dailyTotal = rows.reduce((sum, r) => sum + r.dailyKwh, 0);
  const monthlyKwh = dailyTotal * DAYS_PER_MONTH;
  const yearlyKwh = dailyTotal * DAYS_PER_YEAR;

  const monthlyEnergy = monthlyEnergyCost(monthlyKwh, tariff);
  const averageMonthKwh = yearlyKwh / MONTHS_PER_YEAR;
  const yearlyEnergy = monthlyEnergyCost(averageMonthKwh, tariff) * MONTHS_PER_YEAR;

  const monthlyFixed = tariff.fixedMonthlyCharge;
  const yearlyFixed = tariff.fixedMonthlyCharge * MONTHS_PER_YEAR;

  const deviceResults: DeviceResult[] = rows
    .map((r) => {
      const share = dailyTotal > 0 ? r.dailyKwh / dailyTotal : 0;
      return {
        id: r.id,
        name: r.name,
        dailyKwh: roundKwh(r.dailyKwh),
        monthlyKwh: roundKwh(r.dailyKwh * DAYS_PER_MONTH),
        yearlyKwh: roundKwh(r.dailyKwh * DAYS_PER_YEAR),
        monthlyCost: roundMoney(monthlyEnergy * share),
        yearlyCost: roundMoney(yearlyEnergy * share),
        sharePercent: roundPercent(share * 100),
      };
    })
    .sort((a, b) => b.dailyKwh - a.dailyKwh);

  return {
    currency: tariff.currency,
    tariffName: tariff.name,
    dailyKwh: roundKwh(dailyTotal),
    monthly: {
      kwh: roundKwh(monthlyKwh),
      energyCost: roundMoney(monthlyEnergy),
      fixedCharge: roundMoney(monthlyFixed),
      totalCost: roundMoney(monthlyEnergy + monthlyFixed),
    },
    yearly: {
      kwh: roundKwh(yearlyKwh),
      energyCost: roundMoney(yearlyEnergy),
      fixedCharge: roundMoney(yearlyFixed),
      totalCost: roundMoney(yearlyEnergy + yearlyFixed),
    },
    devices: deviceResults,
  };
}
