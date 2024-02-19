import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar/translation.json';
import de from './locales/de/translation.json';
import en from './locales/en/translation.json';
import zhCn from './locales/zhCn/translation.json';
import zhTw from './locales/zhTw/translation.json';
import fr from './locales/fr/translation.json';
import ja from './locales/ja/translation.json';
import kr from './locales/kr/translation.json';
import nl from './locales/nl/translation.json';
import pl from './locales/pl/translation.json';
import ptBr from './locales/ptBr/translation.json';
import it from './locales/it/translation.json';
import sr from './locales/sr/translation.json';
import sv from './locales/sv/translation.json';
import lt from './locales/lt/translation.json';
import vi from './locales/vi/translation.json';
import nbNo from './locales/nbNo/translation.json';
/**
 * Load translations for each language
 */

function createI18nInstance() {
  var resources = {
    ar: ar,
    de: de,
    en: en,
    fr: fr,
    it: it,
    ja: ja,
    kr: kr,
    lt: lt,
    'nb-NO': nbNo,
    nl: nl,
    pl: pl,
    'pt-BR': ptBr,
    sr: sr,
    sv: sv,
    vi: vi,
    'zh-CN': zhCn,
    'zh-TW': zhTw
  };
  var instance = i18n.createInstance();
  instance.use(initReactI18next).init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react is already safe from xss

    },
    lng: 'en',
    resources: resources
  });
  return instance;
}

export default createI18nInstance;