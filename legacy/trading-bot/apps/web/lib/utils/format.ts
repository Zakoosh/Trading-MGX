import dayjs from 'dayjs';

export function formatDate(input: string | Date, pattern = 'YYYY-MM-DD HH:mm:ss') {
  return dayjs(input).format(pattern);
}

export function formatNumber(value: number, locales: string | string[] = 'ar') {
  return new Intl.NumberFormat(locales).format(value);
}
