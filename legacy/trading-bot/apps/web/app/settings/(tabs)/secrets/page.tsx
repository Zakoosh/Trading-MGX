import { getTranslations } from 'next-intl/server';

import { SecretsSheet } from '../../../../components/SecretsSheet/SecretsSheet';
import { PageHeader } from '../../../../components/Shared/PageHeader';

const sample = [
  { label: 'TELEGRAM_BOT_TOKEN', value: '***' },
  { label: 'TRADINGVIEW_SECRET', value: '***' }
];

export default async function SettingsSecretsPage() {
  const t = await getTranslations('nav');
  return (
    <div className="space-y-6">
      <PageHeader title={`${t('settings')} · الأسرار`} description="حماية المعلومات الحساسة" />
      <SecretsSheet secrets={sample} />
    </div>
  );
}
