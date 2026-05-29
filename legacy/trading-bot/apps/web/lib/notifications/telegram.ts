import type { TelegramWebhookInfo } from '@/lib/api/client';

export function getPendingUpdates(info?: TelegramWebhookInfo): number {
  return info?.result?.pending_update_count ?? 0;
}

export function getLastError(info?: TelegramWebhookInfo): string | null {
  const message = info?.result?.last_error_message;
  if (!message) return null;
  const ts = info?.result?.last_error_date ? new Date(info.result.last_error_date * 1000).toISOString() : null;
  return ts ? `${message} (${ts})` : message;
}

export function isWebhookConfigured(info?: TelegramWebhookInfo): boolean {
  return Boolean(info?.result?.url);
}
