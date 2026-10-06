import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("validation.email");
export const passwordSchema = z.string().min(8, "validation.passwordMin").max(72);

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(72) });
export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "validation.nameMin").max(100),
  email: emailSchema,
  password: passwordSchema,
});
export const forgotSchema = z.object({ email: emailSchema });
export const resetSchema = z.object({ password: passwordSchema });
