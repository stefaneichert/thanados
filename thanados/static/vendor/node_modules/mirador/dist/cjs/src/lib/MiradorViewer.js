"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _reactRedux = require("react-redux");

var _App = _interopRequireDefault(require("../components/App"));

var _pluginPreprocessing = require("../extend/pluginPreprocessing");

var _createPluggableStore = _interopRequireDefault(require("../state/createPluggableStore"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * Default Mirador instantiation
 */
var MiradorViewer = /*#__PURE__*/function () {
  /**
   */
  function MiradorViewer(config) {
    var viewerConfig = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, MiradorViewer);

    this.plugins = (0, _pluginPreprocessing.filterValidPlugins)(viewerConfig.plugins || []);
    this.config = config;
    this.store = viewerConfig.store || (0, _createPluggableStore["default"])(this.config, this.plugins);
    config.id && _reactDom["default"].render(this.render(), document.getElementById(config.id));
  }
  /**
   * Render the mirador viewer
   */


  _createClass(MiradorViewer, [{
    key: "render",
    value: function render() {
      var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return /*#__PURE__*/_react["default"].createElement(_reactRedux.Provider, {
        store: this.store
      }, /*#__PURE__*/_react["default"].createElement(_App["default"], Object.assign({
        plugins: this.plugins
      }, props)));
    }
    /**
     * Cleanup method to unmount Mirador from the dom
     */

  }, {
    key: "unmount",
    value: function unmount() {
      this.config.id && _reactDom["default"].unmountComponentAtNode(document.getElementById(this.config.id));
    }
  }]);

  return MiradorViewer;
}();

var _default = MiradorViewer;
exports["default"] = _default;