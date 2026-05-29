import { unstable_setRequestLocale } from 'next-intl/server';
import { createTranslator } from 'next-intl';
import { notFound } from 'next/navigation';

export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ar';
export const supportedLocales: Locale[] = locales;
const rtlLocales = new Set<Locale>(['ar']);

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return rtlLocales.has(locale) ? 'rtl' : 'ltr';
}

export function setRequestLocale(locale: Locale) {
  unstable_setRequestLocale(locale);
}

export async function getMessages(locale: Locale) {
  try {
    const messages = await import(`./locales/${locale}.json`);
    return messages.default;
  } catch (error) {
    notFound();
  }
}

export async function getTranslator(locale: Locale) {
  const messages = await getMessages(locale as Locale);
  return createTranslator({ locale, messages });
}
