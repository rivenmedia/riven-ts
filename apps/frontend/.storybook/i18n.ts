import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

await i18n
  .use(Backend) // lazy loads translations from /public/locales
  .use(LanguageDetector) // detect user language
  .init({
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export { default as i18n } from "i18next";
