'use client';

import { BarChart2, Bot, Cog, FlaskConical, FolderGit2, Layers, MessagesSquare, Network, Settings as SettingsIcon, Waves, Workflow } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '../../lib/utils/cn';
import { useSidebar } from '../../lib/state/useSidebar';

const navItems = [
  { href: '/', icon: BarChart2, key: 'dashboard' },
  { href: '/chat', icon: Bot, key: 'chat' },
  { href: '/conversations', icon: MessagesSquare, key: 'conversations' },
  { href: '/prompts', icon: Layers, key: 'prompts' },
  { href: '/flows', icon: Workflow, key: 'flows' },
  { href: '/analytics', icon: BarChart2, key: 'analytics' },
  { href: '/logs', icon: Waves, key: 'logs' },
  { href: '/webhooks', icon: Network, key: 'webhooks' },
  { href: '/connectors', icon: FolderGit2, key: 'connectors' },
  { href: '/experiments', icon: FlaskConical, key: 'experiments' },
  { href: '/settings', icon: SettingsIcon, key: 'settings' }
];

export function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { isOpen } = useSidebar();

  return (
    <aside
      className={cn(
        'hidden w-60 shrink-0 border-border bg-card shadow-sm transition-all duration-200 lg:block',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      <nav className="flex h-full flex-col gap-2 p-4">
        {navItems.map(({ href, icon: Icon, key }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={key}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <Icon className="size-4" />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
