import { createLocalizedPathnamesNavigation, Pathnames } from 'next-intl/navigation';
import { defaultLocale, locales } from './index';

export const pathnames: Pathnames = {
  '/': '/',
  '/chat': '/chat',
  '/conversations': '/conversations',
  '/prompts': '/prompts',
  '/flows': '/flows',
  '/analytics': '/analytics',
  '/logs': '/logs',
  '/webhooks': '/webhooks',
  '/connectors': '/connectors',
  '/experiments': '/experiments',
  '/settings': '/settings'
};

export const { Link, redirect, usePathname, useRouter } = createLocalizedPathnamesNavigation({
  locales,
  localePrefix: 'never',
  pathnames,
  defaultLocale
});
