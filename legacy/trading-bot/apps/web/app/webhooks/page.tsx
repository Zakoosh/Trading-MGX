import { getTranslations } from 'next-intl/server';

import { DataEmpty } from '../../components/Shared/DataEmpty';
import { PageHeader } from '../../components/Shared/PageHeader';

export default async function WebhooksPage() {
  const t = await getTranslations('nav');
  return (
    <div className="space-y-6">
      <PageHeader title={t('webhooks')} description="راقب عمليات التسليم وتحقق من التوقيعات" />
      <DataEmpty title="لا توجد طلبات" description="قم بتوصيل BotMediator لبدء تلقي الويب هوكس." />
    </div>
  );
}
