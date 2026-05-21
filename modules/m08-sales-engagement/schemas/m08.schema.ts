import { z } from 'zod';

export const CreateM08SalesEngagementSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM08SalesEngagementDto = z.infer<typeof CreateM08SalesEngagementSchema>;
