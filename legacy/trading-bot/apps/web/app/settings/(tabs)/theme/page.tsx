import { getTranslations } from 'next-intl/server';

import { PageHeader } from '../../../../components/Shared/PageHeader';
import { ThemeToggle } from '../../../../components/Shared/ThemeToggle';

export default async function SettingsThemePage() {
  const t = await getTranslations('nav');
  return (
    <div className="space-y-6">
      <PageHeader title={`${t('settings')} · السمة`} description="تخصيص المظهر العام" />
      <ThemeToggle />
    </div>
  );
}
