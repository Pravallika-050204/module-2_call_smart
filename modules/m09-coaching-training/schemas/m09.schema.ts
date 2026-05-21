import { z } from 'zod';

export const CreateM09CoachingTrainingSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM09CoachingTrainingDto = z.infer<typeof CreateM09CoachingTrainingSchema>;
