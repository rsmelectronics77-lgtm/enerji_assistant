import az from "@/messages/az.json";

// V1: yalnız Azərbaycan dili. Stage 3-də next-intl ilə əvəz olunacaq (EN/RU üçün).
type Messages = typeof az;
type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
type Paths<T> = T extends object
  ? { [K in keyof T & string]: T[K] extends string ? K : Join<K, Paths<T[K]>> }[keyof T & string]
  : never;

export type MessageKey = Paths<Messages>;

export function t(key: MessageKey): string {
  let cur: unknown = az;
  for (const part of key.split(".")) {
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : key;
}
