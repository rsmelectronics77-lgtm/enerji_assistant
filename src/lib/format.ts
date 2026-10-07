const nf = new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 2 });
const nf1 = new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 1 });

export const formatNumber = (v: number): string => nf.format(v);
export const formatKwh = (v: number): string => `${nf.format(v)} kWh`;
export const formatPercent = (v: number): string => `${nf1.format(v)}%`;
/** 0.084 AZN → "8,4 qəpik" */
export const formatQepik = (azn: number): string => `${nf1.format(azn * 100)} qəpik`;
export const formatMoney = (v: number, currency: string): string =>
  new Intl.NumberFormat("az-AZ", { style: "currency", currency }).format(v);
