import { nanoid } from 'nanoid';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { SendMessageRequestSchema } from '@/lib/api/validators';

export type JsonRecord = Record<string, unknown>;

const encoder = new TextEncoder();
const MOCK_QUEUE_SYMBOL = Symbol.for('mediator.mock.queue');

interface MockJob {
  requestId: string;
  text: string;
  channel: string;
  trace?: boolean;
  createdAt: number;
}

type MockQueue = MockJob[];

function getMockQueue(): MockQueue {
  const globalRegistry = globalThis as typeof globalThis & { [MOCK_QUEUE_SYMBOL]?: MockQueue };
  if (!globalRegistry[MOCK_QUEUE_SYMBOL]) {
    globalRegistry[MOCK_QUEUE_SYMBOL] = [];
  }
  return globalRegistry[MOCK_QUEUE_SYMBOL]!;
}

export const enableMocks = process.env.ENABLE_MOCKS === 'true';
const mediatorBaseUrl = (process.env.MEDIATOR_BASE_URL || '').replace(/\/+$/, '');

export function ensureMediatorConfigured(): string | null {
  if (mediatorBaseUrl) {
    return mediatorBaseUrl;
  }
  return null;
}

export function redact(value: unknown): unknown {
  if (!value) return value;
  if (typeof value === 'string') {
    return value.length > 4 ? `${value.slice(0, 2)}***${value.slice(-2)}` : '***';
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }
  if (typeof value === 'object') {
    const out: JsonRecord = {};
    Object.entries(value as JsonRecord).forEach(([key, val]) => {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
        out[key] = '***';
        return;
      }
      out[key] = redact(val);
    });
    return out;
  }
  return value;
}

export async function forwardMediatorRequest(
  path: string,
  init?: RequestInit & { parseJson?: boolean }
): Promise<Response> {
  const base = ensureMediatorConfigured();
  if (!base) {
    return new Response(
      JSON.stringify({ ok: false, message: 'Mediator base URL is not configured' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const response = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {})
      }
    });
    return response;
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: 'Failed to reach mediator',
        error: redact((error as Error).message)
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export const ExtendedSendMessageSchema = SendMessageRequestSchema.extend({
  clientRequestId: z.string().optional()
});

export type ExtendedSendMessagePayload = z.infer<typeof ExtendedSendMessageSchema>;

export function parseJsonRequest<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  return request
    .json()
    .then((body) => schema.parse(body))
    .catch((error) => {
      if (error instanceof z.ZodError) {
        throw new Response(
          JSON.stringify({ ok: false, message: 'Invalid payload', issues: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw new Response(
        JSON.stringify({ ok: false, message: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    });
}

function splitTextIntoTokens(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const words = trimmed.split(/\s+/);
  return words.length > 12 ? words : trimmed.split('');
}

export function enqueueMockJob(payload: ExtendedSendMessagePayload, requestId: string) {
  const queue = getMockQueue();
  queue.push({
    requestId,
    text: payload.text,
    channel: payload.channel,
    trace: payload.trace ?? false,
    createdAt: Date.now()
  });
}

export function createMockStreamResponse(): Response {
  const queue = getMockQueue();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'));

      const interval = setInterval(async () => {
        if (!queue.length) {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
          return;
        }
        const job = queue.shift();
        if (!job) return;

        const tokens = splitTextIntoTokens(job.text);
        const now = new Date().toISOString();
        for (const token of tokens) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'token',
                data: { token, channel: job.channel },
                ts: new Date().toISOString(),
                requestId: job.requestId
              })}\n\n`
            )
          );
          await new Promise((resolve) => setTimeout(resolve, 120));
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'message',
              data: {
                content: job.text,
                summary: tokens.length + ' tokens',
                cost: tokens.length * 0.000001
              },
              ts: now,
              requestId: job.requestId
            })}\n\n`
          )
        );
      }, 200);

      return () => {
        clearInterval(interval);
      };
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache'
    }
  });
}

export function buildSendMessagePayload(
  data: ExtendedSendMessagePayload
): ExtendedSendMessagePayload {
  const sanitized: ExtendedSendMessagePayload = {
    channel: data.channel,
    text: data.text,
    userId: data.userId,
    vars: data.vars,
    attachments: data.attachments,
    trace: data.trace,
    clientRequestId: data.clientRequestId || nanoid()
  };
  return sanitized;
}
