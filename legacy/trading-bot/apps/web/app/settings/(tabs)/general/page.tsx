import { getTranslations } from 'next-intl/server';

import { PageHeader } from '../../../../components/Shared/PageHeader';

export default async function SettingsGeneralPage() {
  const t = await getTranslations('nav');
  return (
    <div className="space-y-6">
      <PageHeader title={`${t('settings')} · الإعدادات العامة`} description="تحديث بيانات المنصة." />
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        سيتم توصيل نموذج الإعدادات عند اكتمال BotMediator.
      </div>
    </div>
  );
}
