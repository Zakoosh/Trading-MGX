import { getTranslations } from 'next-intl/server';

import { PageHeader } from '../../../../components/Shared/PageHeader';
import { RoleGate } from '../../../../components/RoleGate/RoleGate';

export default async function SettingsRolesPage() {
  const t = await getTranslations('nav');
  return (
    <div className="space-y-6">
      <PageHeader title={`${t('settings')} · الصلاحيات`} description="إدارة صلاحيات فريق العمل" />
      <RoleGate allowed={['owner', 'admin']} fallback={<p className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">هذا القسم مخصص للمسؤولين.</p>}>
        <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          سيتم تحميل قائمة الأعضاء والأدوار قريبًا.
        </div>
      </RoleGate>
    </div>
  );
}
