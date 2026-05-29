import { getTranslations } from 'next-intl/server';

import { FlowCanvas } from '../../components/FlowCanvas/FlowCanvas';
import { PageHeader } from '../../components/Shared/PageHeader';

export default async function FlowsPage() {
  const t = await getTranslations('nav');
  return (
    <div className="space-y-6">
      <PageHeader title={t('flows')} description="تصميم سيناريوهات العمل للبوت" />
      <FlowCanvas />
    </div>
  );
}
