import { getTranslations } from 'next-intl/server';

import { PromptEditor } from '../../components/PromptEditor/PromptEditor';
import { VersionList } from '../../components/PromptEditor/VersionList';
import { PageHeader } from '../../components/Shared/PageHeader';

export default async function PromptsPage() {
  const t = await getTranslations('nav');
  const versions = [
    { id: 'v3', label: 'الإصدار 3', active: true },
    { id: 'v2', label: 'الإصدار 2' },
    { id: 'v1', label: 'الإصدار 1' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('prompts')} description="إدارة قوالب البوت والتجارب" />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <VersionList versions={versions} />
        </aside>
        <PromptEditor header={<h2 className="text-lg font-semibold">مسودة الإشعار</h2>}>
          <textarea
            className="h-80 w-full rounded-md border border-border bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            defaultValue="{مرحبا {{user_name}}، شكرًا لتجربتك}"
          />
        </PromptEditor>
      </div>
    </div>
  );
}
