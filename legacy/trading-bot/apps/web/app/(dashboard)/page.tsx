import { getTranslations } from 'next-intl/server';

import { MetricCards } from '../../components/MetricCards/MetricCards';
import { PageHeader } from '../../components/Shared/PageHeader';
import { HealthStatusCard } from './HealthStatusCard';

export default async function DashboardPage() {
  const t = await getTranslations('layout');
  const defaultSymbols = (process.env.DEFAULT_STOCK_SYMBOLS || 'AAPL,MSFT,TSLA')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const metrics = [
    { id: 'latency', label: 'متوسط زمن الرد', value: '120ms', helper: 'آخر 24 ساعة' },
    { id: 'success', label: 'معدل النجاح', value: '98%', helper: 'استقرار مرتفع' },
    { id: 'tokens', label: 'استهلاك التوكنات', value: '12,540', helper: 'جلسات اليوم' },
    { id: 'alerts', label: 'تنبيهات نشطة', value: '3', helper: 'توقعي' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('health')} description="نظرة عامة سريعة على أداء المنصة" />
      <HealthStatusCard />
      <StockDiagnosticsCard symbols={defaultSymbols} />
      <QuotesGrid symbols={defaultSymbols} />
      <MetricCards metrics={metrics} />
    </div>
  );
}
