import { getTranslations } from 'next-intl/server';

import { SecretsSheet } from '../../../../components/SecretsSheet/SecretsSheet';
import { PageHeader } from '../../../../components/Shared/PageHeader';

const placeholders = [
  { label: 'MEDIATOR_BASE_URL', value: 'http://localhost:8080' },
  { label: 'AUTH_PROVIDER', value: 'none' }
];

export default async function SettingsEnvPage() {
  const t = await getTranslations('nav');
  return (
    <div className="space-y-6">
      <PageHeader title={`${t('settings')} · البيئة`} description="إدارة المتغيرات الحساسة" />
      <SecretsSheet secrets={placeholders} />
    </div>
  );
}
