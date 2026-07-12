const i18next = require('i18next');
const middleware = require('i18next-http-middleware');
const enTranslations = require('../locales/en.json');
const arTranslations = require('../locales/ar.json');

i18next.use(middleware.LanguageDetector).init({
  preload: ['en', 'ar'],
  fallbackLng: 'en',
  supportedLngs: ['en', 'ar'],
  resources: {
    en: { translation: enTranslations },
    ar: { translation: arTranslations }
  },
  detection: {
    order: ['header'],
    lookupHeader: 'accept-language'
  }
});

module.exports = {
  i18n: i18next,
  i18nMiddleware: middleware.handle(i18next)
};
