import { z } from 'zod';

export const AttachmentSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  type: z.string().optional()
});

export const SendMessageRequestSchema = z.object({
  channel: z.string().min(1),
  userId: z.string().min(1).optional(),
  text: z.string().min(1),
  vars: z.record(z.unknown()).optional(),
  attachments: z.array(AttachmentSchema).optional(),
  trace: z.boolean().optional(),
  clientRequestId: z.string().optional()
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'bot', 'tool', 'system']),
  content: z.string(),
  createdAt: z.string(),
  tokens: z.array(z.string()).optional()
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const StreamEventSchema = z.object({
  type: z.string(),
  data: z.unknown(),
  ts: z.string(),
  requestId: z.string().optional()
});

export type StreamEvent = z.infer<typeof StreamEventSchema>;
