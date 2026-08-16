import { z } from "zod";

export const damageFieldNames = [
  "damageDate",
  "damageLocation",
  "disasterType",
  "livestockType",
  "totalLivestock",
  "deadLivestock",
  "injuredLivestock",
  "facilityDamage",
  "facilityDamageDescription",
  "damageDescription",
] as const;

export type DamageFieldName = (typeof damageFieldNames)[number];

export const damageInfoSchema = z.object({
  damageDate: z.string().nullable(),
  damageLocation: z.string().nullable(),
  disasterType: z.string().nullable(),
  livestockType: z.string().nullable(),
  totalLivestock: z.number().int().nonnegative().nullable(),
  deadLivestock: z.number().int().nonnegative().nullable(),
  injuredLivestock: z.number().int().nonnegative().nullable(),
  facilityDamage: z.boolean().nullable(),
  facilityDamageDescription: z.string().nullable(),
  damageDescription: z.string().nullable(),
  evidencePhotos: z.array(z.string()),
});

export type DamageInfo = z.infer<typeof damageInfoSchema>;

export const emptyDamageInfo: DamageInfo = {
  damageDate: null,
  damageLocation: null,
  disasterType: null,
  livestockType: null,
  totalLivestock: null,
  deadLivestock: null,
  injuredLivestock: null,
  facilityDamage: null,
  facilityDamageDescription: null,
  damageDescription: null,
  evidencePhotos: [],
};

export const extractedDamageSchema = damageInfoSchema.omit({ evidencePhotos: true });

export const interviewResultSchema = z.object({
  extracted: extractedDamageSchema,
  missingRequiredFields: z.array(z.enum(damageFieldNames)),
  nextQuestion: z.string().nullable(),
  complete: z.boolean(),
});

export function mergeDamageInfo(current: DamageInfo, extracted: z.infer<typeof extractedDamageSchema>): DamageInfo {
  const next = { ...current };
  for (const field of damageFieldNames) {
    const value = extracted[field];
    if (value !== null) Object.assign(next, { [field]: value });
  }
  return next;
}

export function getMissingRequiredFields(info: DamageInfo): DamageFieldName[] {
  const required: DamageFieldName[] = [
    "damageDate",
    "damageLocation",
    "disasterType",
    "livestockType",
    "totalLivestock",
    "deadLivestock",
    "injuredLivestock",
    "facilityDamage",
    "damageDescription",
  ];
  if (info.facilityDamage === true) required.push("facilityDamageDescription");
  return required.filter((field) => info[field] === null || info[field] === "");
}

