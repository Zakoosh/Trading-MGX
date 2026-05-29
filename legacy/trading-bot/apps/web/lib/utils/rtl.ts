export const RTL_LOCALES = new Set(['ar', 'he', 'fa']);

export function isRTL(locale: string) {
  return RTL_LOCALES.has(locale);
}
