import { z } from "zod";

// Yalnız server kodunda import edilməlidir (client komponentdə yox).
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
});

export const serverEnv = serverSchema.parse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
});
