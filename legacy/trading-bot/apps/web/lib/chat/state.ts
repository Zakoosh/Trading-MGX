import { nanoid } from 'nanoid';

import type { ChatMessage, StreamEvent } from '@/lib/api/validators';

export type MessageStatus = 'pending' | 'streaming' | 'success' | 'error' | 'cancelled';

export interface ChatMessageRecord extends ChatMessage {
  requestId?: string;
  status: MessageStatus;
  tokens: string[];
  tokenCount: number;
  startedAt: number;
  completedAt?: number;
  latencyMs?: number;
  cost?: number;
  events: StreamEvent[];
  meta?: Record<string, unknown>;
  error?: string | null;
}

export interface ChatState {
  order: string[];
  byId: Record<string, ChatMessageRecord>;
  requestIndex: Record<string, string>;
  cancelled: Set<string>;
}

export interface SeedConversationOptions {
  requestId?: string;
  text: string;
  channel: string;
  userId?: string;
  trace?: boolean;
}

export function createInitialChatState(): ChatState {
  return {
    order: [],
    byId: {},
    requestIndex: {},
    cancelled: new Set()
  };
}

function cloneState(state: ChatState): ChatState {
  return {
    order: [...state.order],
    byId: { ...state.byId },
    requestIndex: { ...state.requestIndex },
    cancelled: new Set(state.cancelled)
  };
}

export function seedConversation(state: ChatState, options: SeedConversationOptions): ChatState {
  const next = cloneState(state);
  const requestId = options.requestId ?? nanoid();
  const now = new Date().toISOString();
  const startedAt = Date.now();
  const userMessageId = `${requestId}:user`;
  const botMessageId = `${requestId}:bot`;

  next.byId[userMessageId] = {
    id: userMessageId,
    role: 'user',
    content: options.text,
    requestId,
    status: 'success',
    tokens: [],
    tokenCount: 0,
    createdAt: now,
    startedAt,
    events: [],
    meta: {
      channel: options.channel,
      userId: options.userId
    }
  };

  next.byId[botMessageId] = {
    id: botMessageId,
    role: 'bot',
    content: '',
    requestId,
    status: 'pending',
    tokens: [],
    tokenCount: 0,
    createdAt: now,
    startedAt,
    events: [],
    meta: {
      channel: options.channel,
      trace: options.trace ?? false
    },
    error: null
  };

  next.order.push(userMessageId, botMessageId);
  next.requestIndex[requestId] = botMessageId;
  next.cancelled.delete(requestId);
  return next;
}

function parseEventData(data: unknown): Record<string, unknown> {
  if (!data) {
    return {};
  }
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return { token: data };
    }
  }
  if (typeof data === 'object') {
    return data as Record<string, unknown>;
  }
  return { token: data };
}

function getOrCreateMessage(state: ChatState, requestId: string, event: StreamEvent): ChatState {
  if (state.requestIndex[requestId]) {
    return state;
  }
  const next = cloneState(state);
  const messageId = `${requestId}:${event.type}`;

  next.byId[messageId] = {
    id: messageId,
    role: 'bot',
    requestId,
    status: 'pending',
    content: '',
    tokens: [],
    tokenCount: 0,
    createdAt: event.ts || new Date().toISOString(),
    startedAt: Date.now(),
    events: [],
    meta: {},
    error: null
  };

  next.order.push(messageId);
  next.requestIndex[requestId] = messageId;
  return next;
}

export function applyStreamEvent(state: ChatState, event: StreamEvent): ChatState {
  const requestId = event.requestId || '__default__';

  if (state.cancelled.has(requestId)) {
    return state;
  }

  const ensured = getOrCreateMessage(state, requestId, event);
  const next = cloneState(ensured);

  const messageId = next.requestIndex[requestId];
  const record = next.byId[messageId];
  if (!record) return state;

  const payload = parseEventData(event.data);
  const ts = event.ts || new Date().toISOString();

  const updated: ChatMessageRecord = {
    ...record,
    events: [...record.events, event],
    status: record.status === 'pending' ? 'streaming' : record.status,
    createdAt: record.createdAt || ts
  };

  if (typeof payload.role === 'string' && payload.role.length > 0) {
    updated.role = payload.role as ChatMessage['role'];
  }

  if (event.type === 'token') {
    const token =
      typeof payload.token === 'string'
        ? payload.token
        : typeof payload.delta === 'string'
        ? payload.delta
        : typeof payload.content === 'string'
        ? payload.content
        : '';

    if (token) {
      updated.tokens = [...updated.tokens, token];
      updated.tokenCount = updated.tokens.length;
      updated.content = updated.tokens.join('');
    }
    updated.status = 'streaming';
  } else if (event.type === 'message' || event.type === 'final') {
    if (typeof payload.content === 'string') {
      updated.content = payload.content;
    } else if (!updated.content && typeof payload.text === 'string') {
      updated.content = payload.text;
    }
    updated.status = 'success';
    updated.completedAt = Date.parse(ts);
    updated.latencyMs = typeof payload.latencyMs === 'number'
      ? payload.latencyMs
      : Math.max(0, updated.completedAt - updated.startedAt);
    if (typeof payload.cost === 'number') {
      updated.cost = payload.cost;
    }
  } else if (event.type === 'error' || event.type === 'rate_limited') {
    updated.status = 'error';
    updated.error =
      (typeof payload.message === 'string' && payload.message) ||
      (typeof payload.error === 'string' && payload.error) ||
      'Unknown error';
    updated.completedAt = Date.parse(ts);
  } else if (event.type === 'meta') {
    updated.meta = {
      ...(updated.meta ?? {}),
      ...payload
    };
  }

  next.byId[messageId] = updated;
  return next;
}

export function markRequestCancelled(state: ChatState, requestId: string): ChatState {
  if (!state.requestIndex[requestId]) return state;
  const next = cloneState(state);
  next.cancelled.add(requestId);
  const messageId = next.requestIndex[requestId];
  const record = next.byId[messageId];
  if (record) {
    next.byId[messageId] = {
      ...record,
      status: 'cancelled',
      error: record.error ?? 'Request cancelled by user',
      completedAt: Date.now()
    };
  }
  return next;
}

export function markRequestFailed(state: ChatState, requestId: string, error: string): ChatState {
  if (!state.requestIndex[requestId]) return state;
  const next = cloneState(state);
  const messageId = next.requestIndex[requestId];
  const record = next.byId[messageId];
  if (record) {
    next.byId[messageId] = {
      ...record,
      status: 'error',
      error,
      completedAt: Date.now()
    };
  }
  return next;
}

export function remapRequestId(
  state: ChatState,
  previousId: string,
  nextId: string
): ChatState {
  if (previousId === nextId) return state;
  if (!state.requestIndex[previousId]) return state;
  const next = cloneState(state);
  const messageId = next.requestIndex[previousId];
  delete next.requestIndex[previousId];
  next.requestIndex[nextId] = messageId;

  const record = next.byId[messageId];
  if (record) {
    next.byId[messageId] = { ...record, requestId: nextId };
  }

  return next;
}

export function listMessages(state: ChatState): ChatMessageRecord[] {
  return state.order.map((id) => state.byId[id]).filter(Boolean);
}
