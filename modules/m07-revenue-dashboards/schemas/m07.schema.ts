import { z } from 'zod';

export const CreateM07RevenueDashboardsSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM07RevenueDashboardsDto = z.infer<typeof CreateM07RevenueDashboardsSchema>;
