/**
 * İstifadəçinin yazdığı rəqəmi oxuyur: "1,5" və "1.5" hər ikisi qəbul olunur.
 * Yalnız müsbət onluq rəqəmlər (məs. 12, 1500, 0.5, 7,25). Boş və ya yanlış yazı → NaN.
 */
export function parseDecimal(raw: string): number {
  const s = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(s)) return Number.NaN;
  return Number(s);
}
