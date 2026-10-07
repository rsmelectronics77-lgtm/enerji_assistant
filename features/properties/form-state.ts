export type FormState = {
  error?: string;
  message?: string;
  /** Xəta olanda istifadəçinin yazdığı dəyərləri formada saxlamaq üçün. */
  values?: Record<string, string>;
};
