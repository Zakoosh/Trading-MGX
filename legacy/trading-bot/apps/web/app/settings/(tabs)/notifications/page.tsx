'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { fetchTelegramWebhookInfo, postTelegramWebhook, type TelegramWebhookRequest } from '@/lib/api/client';
import { getLastError, getPendingUpdates, isWebhookConfigured } from '@/lib/notifications/telegram';
import { useToasts } from '@/lib/state/useToasts';
import { cn } from '@/lib/utils/cn';

export default function SettingsNotificationsPage() {
  const t = useTranslations('settings.notifications');
  const toasts = useToasts();
  const [form, setForm] = useState<TelegramWebhookRequest>({
    url: process.env.TELEGRAM_WEBHOOK_URL || '',
    secretToken: process.env.TELEGRAM_WEBHOOK_SECRET || ''
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['telegram', 'webhookInfo'],
    queryFn: fetchTelegramWebhookInfo,
    staleTime: 60_000
  });

  const mutation = useMutation({
    mutationFn: (payload: TelegramWebhookRequest) => postTelegramWebhook(payload),
    onSuccess: () => {
      toasts.push({ title: 'تم تحديث الويب هوك', variant: 'success' });
      refetch();
    },
    onError: (error) => {
      toasts.push({ title: 'فشل التحديث', description: (error as Error).message, variant: 'error' });
    }
  });

  const pending = getPendingUpdates(data);
  const lastError = getLastError(data);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('help')}</p>
      </header>

      <section className="rounded-lg border border-border bg-card/80 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground">الحالة الحالية</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/70">الرابط</span>
            <span className="text-foreground break-all">{isLoading ? '...' : isWebhookConfigured(data) ? data?.result?.url : t('notConfigured')}</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/70">تحديثات معلقة</span>
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', pending > 0 ? 'border border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200')}>
              {pending}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/70">آخر خطأ</span>
            <span className="text-foreground">{lastError ?? t('noErrors')}</span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card/80 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground">تحديث الويب هوك</h2>
        <form
          className="mt-3 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate(form);
          }}
        >
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span>العنوان الكامل</span>
            <input
              className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com/webhook/telegram"
              value={form.url}
              onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span>السر (اختياري)</span>
            <input
              className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="X-Telegram-Bot-Api-Secret-Token"
              value={form.secretToken ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, secretToken: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span>التحديثات المسموح بها</span>
            <input
              className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="message,callback_query"
              value={(form.allowed_updates ?? []).join(',')}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  allowed_updates: event.target.value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                }))
              }
            />
            <span className="text-[11px] text-muted-foreground">اترك الحقل فارغاً للإعدادات الافتراضية من تيليجرام.</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={mutation.isLoading}
            >
              حفظ وتحديث الويب هوك
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
              onClick={() => {
                fetch('/api/mediator/sendMessage', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ channel: 'telegram', text: 'اختبار الإشعار من لوحة التحكم', trace: true })
                })
                  .then((res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                  })
                  .then((json) => {
                    toasts.push({ title: 'تم إرسال الاختبار', description: `RID: ${json.requestId ?? 'غير معروف'}`, variant: 'info' });
                  })
                  .catch((err) => toasts.push({ title: 'فشل إرسال الاختبار', description: err.message, variant: 'error' }));
              }}
            >
              إرسال رسالة اختبار
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
