import { z } from 'zod';

export const onboardingSchema = z.object({
  code: z.string().min(1).max(20).transform((v) => v.trim().toUpperCase()),
  onboardingToken: z.string().min(10).optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
