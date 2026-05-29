import { getTranslations } from 'next-intl/server';

import { DataEmpty } from '../../components/Shared/DataEmpty';
import { PageHeader } from '../../components/Shared/PageHeader';

export default async function AnalyticsPage() {
  const t = await getTranslations('nav');
  return (
    <div className="space-y-6">
      <PageHeader title={t('analytics')} description="عرض مؤشرات النجاح والتكلفة والأداء" />
      <DataEmpty title="الرسوم البيانية" description="سيتم تفعيل التحليلات التفاعلية قريبًا." />
    </div>
  );
}
