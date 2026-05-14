import path from "path";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import i18nextMiddleware from "i18next-http-middleware";

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(
        process.cwd(),
        "src/locales",
        "{{lng}}", // {{lng}} will be replaced with detected language
        "{{ns}}.json"
      ),
    },

    // detect language from query string and cookies
    detection: {
      order: ["querystring", "cookie"],
      caches: ["cookie"],
    },

    fallbackLng: "en", // default language if detection fails
    preload: ["en", "mm"], // preload all supported languages
  });

export default i18next;
