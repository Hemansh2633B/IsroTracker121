import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  // Load translation using http -> see /public/locales
  // (i.e., https://github.com/i18next/i18next-http-backend)
  .use(HttpApi)
  // Detect user language
  // Learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // Init i18next
  // For all options read: https://www.i18next.com/overview/configuration-options
  .init({
    supportedLngs: ['en', 'hi'],
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development', // Enable debug output in development
    interpolation: {
      escapeValue: false, // Not needed for React as it escapes by default
    },
    backend: {
      // Path where resources get loaded from, relative to public folder
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Language detection options
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'], // Where to cache detected language
    }
  });

export default i18n;
