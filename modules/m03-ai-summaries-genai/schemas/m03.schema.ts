import { z } from 'zod';

export const CreateM03AiSummariesGenaiSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM03AiSummariesGenaiDto = z.infer<typeof CreateM03AiSummariesGenaiSchema>;
