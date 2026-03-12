import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(1).max(50).transform((v) => v.trim()),
  weeklyRequiredCount: z.number().int().min(1).max(7),
  fineAmountPerShortfall: z.number().int().min(0).max(1_000_000),
});

export const updateTeamSchema = createTeamSchema.partial();

export const generateCodeSchema = z.object({
  expiresInDays: z.number().int().min(1).max(365).default(30),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type GenerateCodeInput = z.infer<typeof generateCodeSchema>;
