import { describe, expect, it } from 'vitest';

import { getLastError, getPendingUpdates, isWebhookConfigured } from '@/lib/notifications/telegram';

const baseInfo = {
  ok: true,
  result: {
    url: 'https://example.com',
    pending_update_count: 2,
    last_error_message: '429 Too Many Requests',
    last_error_date: 1_700_000_000
  }
};

describe('telegram helpers', () => {
  it('returns pending updates count', () => {
    expect(getPendingUpdates(baseInfo)).toBe(2);
  });

  it('formats last error with timestamp', () => {
    const err = getLastError(baseInfo);
    expect(err).toContain('429 Too Many Requests');
    expect(err).toContain('1970');
  });

  it('detects configuration state', () => {
    expect(isWebhookConfigured(baseInfo)).toBe(true);
    expect(isWebhookConfigured({ ok: true })).toBe(false);
  });
});
