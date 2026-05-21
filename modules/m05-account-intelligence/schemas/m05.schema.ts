import { z } from 'zod';

export const CreateM05AccountIntelligenceSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM05AccountIntelligenceDto = z.infer<typeof CreateM05AccountIntelligenceSchema>;
