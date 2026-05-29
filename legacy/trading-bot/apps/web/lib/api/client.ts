import type { SendMessageRequest } from './validators';

const API_BASE = '/api/mediator';

export interface MediatorHealth {
  ok: boolean;
  status: 'ok' | 'degraded' | 'down';
  version?: string | null;
  latencyMs?: number;
  timestamp?: string;
  raw?: unknown;
}

export interface SendMessageResponse {
  ok: boolean;
  requestId?: string;
  mediator?: unknown;
}

export interface TelegramWebhookInfo {
  ok: boolean;
  result?: {
    url?: string;
    has_custom_certificate?: boolean;
    pending_update_count?: number;
    max_connections?: number;
    ip_address?: string;
    allowed_updates?: string[];
    last_error_date?: number;
    last_error_message?: string;
  };
}

export interface TelegramWebhookRequest {
  url: string;
  secretToken?: string;
  allowed_updates?: string[];
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export function fetchHealth() {
  return request<MediatorHealth>(`${API_BASE}/health`);
}

export function fetchConfig() {
  return request<Record<string, unknown>>(`${API_BASE}/config`);
}

export function sendMediatorMessage(body: SendMessageRequest) {
  return request<SendMessageResponse>(`${API_BASE}/sendMessage`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function simulateMediator(body: unknown) {
  return request(`${API_BASE}/simulate`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function fetchTelegramWebhookInfo() {
  return request<TelegramWebhookInfo>(`${API_BASE}/telegram/getWebhookInfo`);
}

export function postTelegramWebhook(body: TelegramWebhookRequest) {
  return request(`${API_BASE}/telegram/setWebhook`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
