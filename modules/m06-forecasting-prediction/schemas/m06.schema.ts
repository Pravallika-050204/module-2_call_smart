import { z } from 'zod';

export const CreateM06ForecastingPredictionSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM06ForecastingPredictionDto = z.infer<typeof CreateM06ForecastingPredictionSchema>;
