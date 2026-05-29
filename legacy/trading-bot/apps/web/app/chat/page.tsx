import { getTranslations } from 'next-intl/server';

import { PageHeader } from '../../components/Shared/PageHeader';
import { ChatClient } from './ChatClient';

export default async function ChatPage() {
  const tNav = await getTranslations('nav');
  const tChat = await getTranslations('chat');

  return (
    <div className="space-y-6">
      <PageHeader title={tNav('chat')} description={tChat('pageDescription')} />
      <ChatClient />
    </div>
  );
}
