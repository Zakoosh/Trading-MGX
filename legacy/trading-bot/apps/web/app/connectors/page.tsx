import { getTranslations } from 'next-intl/server';

import { SecretsSheet } from '../../components/SecretsSheet/SecretsSheet';
import { PageHeader } from '../../components/Shared/PageHeader';

const sampleSecrets = [
  { label: 'Telegram Token', value: '***' },
  { label: 'TradingView Secret', value: '***' }
];

export default async function ConnectorsPage() {
  const t = await getTranslations('nav');
  return (
    <div className="space-y-6">
      <PageHeader title={t('connectors')} description="إدارة القنوات والمفاتيح" />
      <SecretsSheet secrets={sampleSecrets} />
    </div>
  );
}
