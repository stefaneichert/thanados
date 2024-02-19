function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import HotApp from '../components/App';
import { filterValidPlugins } from '../extend/pluginPreprocessing';
import createPluggableStore from '../state/createPluggableStore';
/**
 * Default Mirador instantiation
 */

var MiradorViewer = /*#__PURE__*/function () {
  /**
   */
  function MiradorViewer(config) {
    var viewerConfig = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, MiradorViewer);

    this.plugins = filterValidPlugins(viewerConfig.plugins || []);
    this.config = config;
    this.store = viewerConfig.store || createPluggableStore(this.config, this.plugins);
    config.id && ReactDOM.render(this.render(), document.getElementById(config.id));
  }
  /**
   * Render the mirador viewer
   */


  _createClass(MiradorViewer, [{
    key: "render",
    value: function render() {
      var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return /*#__PURE__*/React.createElement(Provider, {
        store: this.store
      }, /*#__PURE__*/React.createElement(HotApp, Object.assign({
        plugins: this.plugins
      }, props)));
    }
    /**
     * Cleanup method to unmount Mirador from the dom
     */

  }, {
    key: "unmount",
    value: function unmount() {
      this.config.id && ReactDOM.unmountComponentAtNode(document.getElementById(this.config.id));
    }
  }]);

  return MiradorViewer;
}();

export default MiradorViewer;