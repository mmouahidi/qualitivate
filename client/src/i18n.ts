import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';
import arTranslation from './locales/ar/translation.json';

const resources = {
  en: { translation: enTranslation },
  fr: { translation: frTranslation },
  ar: { translation: arTranslation }
};

// Helper to safely access localStorage
const getStoredLanguage = () => {
  try {
    return localStorage.getItem('language');
  } catch (e) {
    console.warn('LocalStorage access denied', e);
    return null;
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getStoredLanguage() || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false
    }
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  try {
    localStorage.setItem('language', lng);
  } catch (e) {
    console.warn('LocalStorage access denied', e);
  }
});

// Set initial direction
const initialLang = getStoredLanguage() || 'en';
document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = initialLang;

export default i18n;
