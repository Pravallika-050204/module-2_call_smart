import { z } from 'zod';

export const CreateM01CaptureTranscriptionSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM01CaptureTranscriptionDto = z.infer<typeof CreateM01CaptureTranscriptionSchema>;
