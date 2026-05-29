import { getTranslations } from 'next-intl/server';

import { DataEmpty } from '../../components/Shared/DataEmpty';
import { PageHeader } from '../../components/Shared/PageHeader';

export default async function ConversationsPage() {
  const t = await getTranslations('nav');
  return (
    <div className="space-y-6">
      <PageHeader title={t('conversations')} description="استكشف المحادثات السابقة مع إمكانيات البحث المتقدم" />
      <DataEmpty title="لم يتم تحميل المحادثات بعد" description="سيتم جلب البيانات من BotMediator قريبًا." />
    </div>
  );
}
