import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from './lib/i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'never'
});

export const config = {
  matcher: ['/((?!api|_next|.*\..*).*)']
};
