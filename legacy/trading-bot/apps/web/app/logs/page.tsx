import { getTranslations } from 'next-intl/server';

import { InspectorPanel } from '../../components/InspectorPanel/InspectorPanel';
import { LogFilters } from '../../components/LogTable/Filters';
import { LogTable } from '../../components/LogTable/LogTable';
import { PageHeader } from '../../components/Shared/PageHeader';

const sampleLogs = [
  {
    id: '1',
    level: 'info' as const,
    channel: 'telegram',
    message: 'Webhook received',
    createdAt: new Date().toISOString()
  }
];

export default async function LogsPage() {
  const t = await getTranslations('nav');
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <PageHeader title={t('logs')} description="السجلات المهيكلة للأحداث والتكاملات" />
        <LogFilters onChange={() => {}} />
        <LogTable records={sampleLogs} />
      </div>
      <InspectorPanel title="تفاصيل السجل">
        اختر سجلاً لمعاينة التفاصيل وربطه بالمحادثة المرتبطة.
      </InspectorPanel>
    </div>
  );
}
