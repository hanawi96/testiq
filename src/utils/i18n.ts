export const locales = ['vi', 'en', 'es'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'vi';

// Import all locale files synchronously
import viLocale from '../data/locales/vi.json';
import enLocale from '../data/locales/en.json';
import esLocale from '../data/locales/es.json';

// Synchronous locale data
const syncLocaleData = {
  vi: viLocale,
  en: enLocale,
  es: esLocale
} as const;

// Import all locale files (async version)
const localeFiles = {
  vi: () => import('../data/locales/vi.json'),
  en: () => import('../data/locales/en.json'),
  es: () => import('../data/locales/es.json')
} as const;

// Cache for loaded locales
const localeCache = new Map<Locale, any>();

// Synchronous version for Astro components
export function getLocale(locale: Locale) {
  if (!locales.includes(locale)) {
    console.warn(`Invalid locale "${locale}", falling back to ${defaultLocale}`);
    return syncLocaleData[defaultLocale];
  }
  
  return syncLocaleData[locale];
}

// Async version for dynamic loading (keeping for compatibility)
export async function getLocaleAsync(locale: Locale) {
  if (localeCache.has(locale)) {
    return localeCache.get(locale);
  }
  
  try {
    const localeData = await localeFiles[locale]();
    localeCache.set(locale, localeData.default);
    return localeData.default;
  } catch (error) {
    console.warn(`Failed to load locale ${locale}, falling back to ${defaultLocale}`);
    if (locale !== defaultLocale) {
      return getLocaleAsync(defaultLocale);
    }
    throw error;
  }
}

export function getLocaleFromUrl(url: string): Locale {
  const segments = url.split('/').filter(Boolean);
  const potentialLocale = segments[0] as Locale;
  
  return locales.includes(potentialLocale) ? potentialLocale : defaultLocale;
}

export function generateLocalePaths(path: string = '') {
  return locales.map(locale => ({
    params: { locale },
    props: { locale }
  }));
}

// Helper function to get nested translation
export function getTranslation(obj: any, path: string, fallback?: string): string {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return fallback || path;
    }
  }
  
  return typeof result === 'string' ? result : fallback || path;
}

// Translation function factory
export function createTranslator(locale: any) {
  return function t(path: string, params?: Record<string, string | number>): string {
    let translation = getTranslation(locale, path, path);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        translation = translation.replace(new RegExp(`{${key}}`, 'g'), String(value));
      });
    }
    
    return translation;
  };
}

// Language metadata
export const languageMetadata = {
  vi: {
    name: 'Tiếng Việt',
    flag: '🇻🇳',
    direction: 'ltr'
  },
  en: {
    name: 'English',
    flag: '🇺🇸',
    direction: 'ltr'
  },
  es: {
    name: 'Español',
    flag: '🇪🇸',
    direction: 'ltr'
  }
} as const;