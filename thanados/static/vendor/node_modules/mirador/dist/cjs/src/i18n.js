"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _i18next = _interopRequireDefault(require("i18next"));

var _reactI18next = require("react-i18next");

var _translation = _interopRequireDefault(require("./locales/ar/translation.json"));

var _translation2 = _interopRequireDefault(require("./locales/de/translation.json"));

var _translation3 = _interopRequireDefault(require("./locales/en/translation.json"));

var _translation4 = _interopRequireDefault(require("./locales/zhCn/translation.json"));

var _translation5 = _interopRequireDefault(require("./locales/zhTw/translation.json"));

var _translation6 = _interopRequireDefault(require("./locales/fr/translation.json"));

var _translation7 = _interopRequireDefault(require("./locales/ja/translation.json"));

var _translation8 = _interopRequireDefault(require("./locales/kr/translation.json"));

var _translation9 = _interopRequireDefault(require("./locales/nl/translation.json"));

var _translation10 = _interopRequireDefault(require("./locales/pl/translation.json"));

var _translation11 = _interopRequireDefault(require("./locales/ptBr/translation.json"));

var _translation12 = _interopRequireDefault(require("./locales/it/translation.json"));

var _translation13 = _interopRequireDefault(require("./locales/sr/translation.json"));

var _translation14 = _interopRequireDefault(require("./locales/sv/translation.json"));

var _translation15 = _interopRequireDefault(require("./locales/lt/translation.json"));

var _translation16 = _interopRequireDefault(require("./locales/vi/translation.json"));

var _translation17 = _interopRequireDefault(require("./locales/nbNo/translation.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Load translations for each language
 */
function createI18nInstance() {
  var resources = {
    ar: _translation["default"],
    de: _translation2["default"],
    en: _translation3["default"],
    fr: _translation6["default"],
    it: _translation12["default"],
    ja: _translation7["default"],
    kr: _translation8["default"],
    lt: _translation15["default"],
    'nb-NO': _translation17["default"],
    nl: _translation9["default"],
    pl: _translation10["default"],
    'pt-BR': _translation11["default"],
    sr: _translation13["default"],
    sv: _translation14["default"],
    vi: _translation16["default"],
    'zh-CN': _translation4["default"],
    'zh-TW': _translation5["default"]
  };

  var instance = _i18next["default"].createInstance();

  instance.use(_reactI18next.initReactI18next).init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react is already safe from xss

    },
    lng: 'en',
    resources: resources
  });
  return instance;
}

var _default = createI18nInstance;
exports["default"] = _default;