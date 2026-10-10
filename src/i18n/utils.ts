import en from './translations/en';
import zhCN from './translations/zh-CN';
import type { Locale } from './config';
export type TranslationKey = keyof typeof en;
const dictionaries: Record<Locale, Partial<Record<TranslationKey, string>>> = { en, 'zh-CN': zhCN };
export function t(locale: Locale, key: TranslationKey): string {
  const translated = dictionaries[locale][key];
  if (!translated && import.meta.env.DEV) console.warn(`[i18n] Missing ${locale} translation: ${key}`);
  return translated || en[key] || key;
}
export function missingTranslationKeys(locale: Locale): string[] {
  return Object.keys(en).filter((key) => !dictionaries[locale][key as TranslationKey]);
}
export function localize(value: string | { en: string; 'zh-CN'?: string }, locale: Locale): string {
  return typeof value === 'string' ? value : value[locale] || value.en;
}
export function localizedPath(pathname: string, locale: Locale): string {
  const clean = pathname.replace(/^\/zh(?=\/|$)/, '') || '/';
  if (locale === 'en') return clean;
  return `/zh${clean === '/' ? '/' : clean}`;
}
