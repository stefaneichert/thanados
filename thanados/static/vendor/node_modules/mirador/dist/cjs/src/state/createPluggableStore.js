"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _deepmerge = _interopRequireDefault(require("deepmerge"));

var _createStore = _interopRequireDefault(require("./createStore"));

var _config = require("./actions/config");

var _pluginPreprocessing = require("../extend/pluginPreprocessing");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Configure Store
 */
function createPluggableStore(config) {
  var plugins = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var filteredPlugins = (0, _pluginPreprocessing.filterValidPlugins)(plugins);
  var store = (0, _createStore["default"])((0, _pluginPreprocessing.getReducersFromPlugins)(filteredPlugins), (0, _pluginPreprocessing.getSagasFromPlugins)(filteredPlugins));
  store.dispatch((0, _config.importConfig)((0, _deepmerge["default"])((0, _pluginPreprocessing.getConfigFromPlugins)(filteredPlugins), config)));
  return store;
}

var _default = createPluggableStore;
exports["default"] = _default;