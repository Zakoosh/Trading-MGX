'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next-intl/navigation';
import { useTransition } from 'react';

import { supportedLocales } from '../../lib/i18n';
import { cn } from '../../lib/utils/cn';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <label className="sr-only" htmlFor="locale-switcher">
        Switch locale
      </label>
      <select
        id="locale-switcher"
        className={cn(
          'rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-75',
          isPending && 'opacity-60'
        )}
        value={locale}
        onChange={(event) => {
          const nextLocale = event.target.value;
          startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
          });
        }}
      >
        {supportedLocales.map((item) => (
          <option key={item} value={item}>
            {item.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
