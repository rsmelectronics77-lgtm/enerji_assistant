import { z } from "zod";

export const PROPERTY_TYPES = ["home", "summer_house", "office", "store", "farm"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

const name = z.string().trim().min(1, "validation.nameLength").max(120, "validation.nameLength");
const id = z.string().uuid("validation.idInvalid");

export const propertySchema = z.object({
  name,
  type: z.enum(PROPERTY_TYPES, { errorMap: () => ({ message: "validation.typeInvalid" }) }),
  city: z.string().trim().max(80, "validation.cityLength"),
});

export const roomSchema = z.object({ propertyId: id, name });

export const deviceSchema = z.object({
  propertyId: id,
  roomId: id.nullable(),
  categoryId: id.nullable(),
  name,
  powerW: z
    .number({ invalid_type_error: "validation.powerInvalid" })
    .min(0, "validation.powerInvalid")
    .max(100000, "validation.powerInvalid"),
  hoursPerDay: z
    .number({ invalid_type_error: "validation.hoursInvalid" })
    .min(0, "validation.hoursInvalid")
    .max(24, "validation.hoursInvalid"),
});

export const deleteDeviceSchema = z.object({ propertyId: id, deviceId: id });
