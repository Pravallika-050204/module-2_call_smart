import { z } from 'zod';

export const CreateM04DealIntelligenceSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM04DealIntelligenceDto = z.infer<typeof CreateM04DealIntelligenceSchema>;
