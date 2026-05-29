'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

import { cn } from '../../lib/utils/cn';

const modes = ['light', 'dark', 'system'] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('actions');

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1 text-sm shadow-sm">
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 capitalize transition-colors',
            theme === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          )}
          onClick={() => setTheme(mode)}
        >
          {mode === 'light' ? <Sun className="size-4" /> : mode === 'dark' ? <Moon className="size-4" /> : null}
          <span>{t(mode)}</span>
        </button>
      ))}
    </div>
  );
}
