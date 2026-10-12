import { z } from 'zod';

export const aiChatMessageSchema = z.object({
  role: z.enum(['user', 'model'], {
    errorMap: () => ({ message: "Role must be either 'user' or 'model'" }),
  }),
  content: z
    .string({ required_error: 'Message content is required' })
    .trim()
    .min(1, 'Message content cannot be empty')
    .max(4000, 'Message content cannot exceed 4000 characters'),
});

export const aiChatSchema = z.object({
  message: z
    .string({ required_error: 'Prompt message is required' })
    .trim()
    .min(1, 'Message prompt cannot be empty')
    .max(2000, 'Message prompt cannot exceed 2000 characters'),
  history: z
    .array(aiChatMessageSchema)
    .max(20, 'History cannot exceed 20 messages')
    .optional()
    .default([]),
});

export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;
export type AiChatInput = z.infer<typeof aiChatSchema>;
