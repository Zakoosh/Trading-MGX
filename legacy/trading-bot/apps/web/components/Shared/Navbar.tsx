'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useSidebar } from '../../lib/state/useSidebar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const t = useTranslations('app');
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex rounded-md border border-border bg-card p-2 text-sm shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => {
              toggle();
            }}
            aria-label="Toggle navigation"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-lg font-semibold">{t('name')}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
