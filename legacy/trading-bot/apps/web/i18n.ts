import { defineConfig } from 'next-intl';

export default defineConfig({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  localeDetection: true,
});
