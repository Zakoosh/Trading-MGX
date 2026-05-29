'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { fetchHealth, fetchTelegramWebhookInfo, type MediatorHealth } from '@/lib/api/client';

const STATUS_STYLES: Record<MediatorHealth['status'], string> = {
  ok: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  degraded: 'bg-amber-500/20 text-amber-200 border border-amber-500/30',
  down: 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
};

export function HealthStatusCard() {
  const t = useTranslations('dashboard.health');

  const { data, error, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['mediator', 'health'],
    queryFn: fetchHealth,
    refetchInterval: (query) => {
      const health = query.state.data as MediatorHealth | undefined;
      if (!health) return 15000;
      if (health.status === 'ok') return 60000;
      if (health.status === 'degraded') return 15000;
      return 5000;
    }
  });

  const statusLabel = useMemo(() => {
    if (!data) return t('statuses.unknown');
    return t(`statuses.${data.status}`);
  }, [data, t]);

  const latencyLabel = useMemo(() => {
    if (!data?.latencyMs) return t('latencyUnknown');
    if (data.latencyMs < 1000) return `${data.latencyMs.toFixed(0)} ms`;
    return `${(data.latencyMs / 1000).toFixed(2)} s`;
  }, [data, t]);

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 p-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <button
          type="button"
          className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? t('refreshing') : t('refresh')}
        </button>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-3">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{t('statusLabel')}</span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
              data ? STATUS_STYLES[data.status] : 'bg-muted text-muted-foreground'
            }`}
          >
            {statusLabel}
          </span>
          {error ? (
            <p className="text-xs text-rose-300">{t('error', { error: (error as Error).message })}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{t('latencyLabel')}</span>
          <p className="text-sm text-foreground">{latencyLabel}</p>
          <span className="text-[11px] text-muted-foreground">
            {isLoading ? t('loading') : t('lastUpdated', { time: new Date().toLocaleTimeString() })}
          </span>
        </div>
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{t('versionLabel')}</span>
          <p className="text-sm text-foreground">{data?.version ?? t('versionUnknown')}</p>
          {data?.raw ? (
            <details className="rounded border border-dashed border-border/60 bg-muted/10 px-2 py-1 text-[11px] text-muted-foreground">
              <summary className="cursor-pointer select-none">{t('rawToggle')}</summary>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap">
                {JSON.stringify(data.raw, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      </div>
      <div className="border-t border-border/60 bg-card/60 p-4">
        <h3 className="text-sm font-semibold text-muted-foreground">{t('telegram.title')}</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="space-y-1 text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/70">{t('telegram.webhook')}</span>
            <p className="text-foreground break-all">
              {telegramLoading ? '...' : telegramInfo?.result?.url ?? t('telegram.notConfigured')}
            </p>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/70">{t('telegram.pending')}</span>
            <p className="text-foreground">
              {telegramInfo?.result?.pending_update_count ?? 0}
            </p>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/70">{t('telegram.lastError')}</span>
            <p className="text-foreground">
              {telegramInfo?.result?.last_error_message
                ? `${telegramInfo.result.last_error_message} (${telegramInfo.result.last_error_date ? new Date(telegramInfo.result.last_error_date * 1000).toLocaleTimeString() : ''})`
                : t('telegram.none')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
