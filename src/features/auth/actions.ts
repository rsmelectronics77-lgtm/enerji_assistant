"use server";

import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { env } from "@/lib/env";
import { t, type MessageKey } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { forgotSchema, loginSchema, registerSchema, resetSchema } from "./schemas";

export type FormState = { error?: string; message?: string };

function firstError(err: ZodError): string {
  const msg = err.issues[0]?.message ?? "auth.generic";
  return t((msg.includes(".") ? msg : "auth.generic") as MessageKey);
}

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: str(fd, "email"), password: str(fd, "password") });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: t("auth.invalid") };
  redirect("/dashboard");
}

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    fullName: str(fd, "fullName"),
    email: str(fd, "email"),
    password: str(fd, "password"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard`,
    },
  });
  if (error) return { error: t("auth.generic") };
  return { message: t("auth.checkEmail") };
}

export async function forgotPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse({ email: str(fd, "email") });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  });
  // Hesabın mövcudluğunu açıqlamamaq üçün həmişə eyni cavab.
  return { message: t("auth.resetSent") };
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse({ password: str(fd, "password") });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: t("auth.generic") };
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
