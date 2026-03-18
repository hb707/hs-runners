import { z } from 'zod';

export const updateDistanceSchema = z.object({
  distanceKm: z.number().min(0).max(999).nullable().optional(),
  durationSeconds: z.number().int().min(0).max(86400).nullable().optional(),
});

export const createRecordSchema = z.object({
  imageUrl: z.string().url(),
  distanceKm: z.number().min(0).max(999).nullable(),
  recordedAt: z.string(),
  visionRaw: z.string().nullable().optional(),
  visionConfidence: z.enum(['high', 'medium', 'low', 'failed']).optional().default('failed'),
  durationSeconds: z.number().int().min(0).max(86400).nullable().optional().default(null),
});

export const recordQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
});

export type UpdateDistanceInput = z.infer<typeof updateDistanceSchema>;
export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type RecordQueryInput = z.infer<typeof recordQuerySchema>;
