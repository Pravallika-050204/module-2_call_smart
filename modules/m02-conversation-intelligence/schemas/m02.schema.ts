import { z } from 'zod';

export const CreateM02ConversationIntelligenceSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM02ConversationIntelligenceDto = z.infer<typeof CreateM02ConversationIntelligenceSchema>;
