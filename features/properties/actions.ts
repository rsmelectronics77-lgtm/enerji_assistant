"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { t, type MessageKey } from "@/lib/i18n";
import { parseDecimal } from "@/lib/parse-number";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./form-state";
import { deleteDeviceSchema, deviceSchema, propertySchema, roomSchema } from "./schemas";

function firstError(err: ZodError): string {
  const msg = err.issues[0]?.message ?? "";
  return t((msg.startsWith("validation.") ? msg : "errors.generic") as MessageKey);
}

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

function strOrNull(fd: FormData, key: string): string | null {
  const v = str(fd, key).trim();
  return v === "" ? null : v;
}

function echo(fd: FormData, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = str(fd, k);
  return out;
}

// Təhlükəsizlik: sahiblik yoxlamasını verilənlər bazasındakı RLS qaydaları edir.
// Başqasının obyektinə yazmağa çalışsaq, baza sorğunu rədd edir.

export async function createPropertyAction(_: FormState, fd: FormData): Promise<FormState> {
  const values = echo(fd, ["name", "type", "city"]);
  const parsed = propertySchema.safeParse({
    name: str(fd, "name"),
    type: str(fd, "type"),
    city: str(fd, "city"),
  });
  if (!parsed.success) return { error: firstError(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .insert({ name: parsed.data.name, type: parsed.data.type, city: parsed.data.city || null })
    .select("id")
    .single();
  if (error || !data) return { error: t("errors.generic"), values };

  revalidatePath("/properties");
  redirect(`/properties/${data.id}`);
}

export async function createRoomAction(_: FormState, fd: FormData): Promise<FormState> {
  const values = echo(fd, ["name"]);
  const parsed = roomSchema.safeParse({ propertyId: str(fd, "propertyId"), name: str(fd, "name") });
  if (!parsed.success) return { error: firstError(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase
    .from("rooms")
    .insert({ property_id: parsed.data.propertyId, name: parsed.data.name });
  if (error) return { error: t("errors.generic"), values };

  revalidatePath(`/properties/${parsed.data.propertyId}`);
  return { message: t("room.created") };
}

export async function createDeviceAction(_: FormState, fd: FormData): Promise<FormState> {
  const values = echo(fd, ["name", "categoryId", "roomId", "powerW", "hoursPerDay"]);
  const parsed = deviceSchema.safeParse({
    propertyId: str(fd, "propertyId"),
    roomId: strOrNull(fd, "roomId"),
    categoryId: strOrNull(fd, "categoryId"),
    name: str(fd, "name"),
    powerW: parseDecimal(str(fd, "powerW")),
    hoursPerDay: parseDecimal(str(fd, "hoursPerDay")),
  });
  if (!parsed.success) return { error: firstError(parsed.error), values };

  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("devices").insert({
    property_id: d.propertyId,
    room_id: d.roomId,
    category_id: d.categoryId,
    name: d.name,
    power_w: d.powerW,
    hours_per_day: d.hoursPerDay,
  });
  if (error) return { error: t("errors.generic"), values };

  revalidatePath(`/properties/${d.propertyId}`);
  return { message: t("device.created") };
}

export async function deleteDeviceAction(fd: FormData): Promise<void> {
  const parsed = deleteDeviceSchema.safeParse({
    propertyId: str(fd, "propertyId"),
    deviceId: str(fd, "deviceId"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("devices")
    .delete()
    .eq("id", parsed.data.deviceId)
    .eq("property_id", parsed.data.propertyId);
  revalidatePath(`/properties/${parsed.data.propertyId}`);
}
