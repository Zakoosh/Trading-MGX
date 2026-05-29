import { getTranslations } from 'next-intl/server';

import { DataEmpty } from '../../components/Shared/DataEmpty';
import { PageHeader } from '../../components/Shared/PageHeader';

export default async function ExperimentsPage() {
  const t = await getTranslations('nav');
  return (
    <div className="space-y-6">
      <PageHeader title={t('experiments')} description="إدارة اختبارات A/B للقوالب" />
      <DataEmpty title="لا توجد تجارب مفعلة" description="أطلق تجربة جديدة لمقارنة النتائج." />
    </div>
  );
}
