"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _redux = require("redux");

var _reactRedux = require("react-redux");

var _styles = require("@material-ui/core/styles");

var _reactI18next = require("react-i18next");

var _withPlugins = require("../extend/withPlugins");

var _WorkspaceExport = require("../components/WorkspaceExport");

var _selectors = require("../state/selectors");

/**
 * mapStateToProps - to hook up connect
 * @memberof Workspace
 * @private
 */
var mapStateToProps = function mapStateToProps(state) {
  return {
    exportableState: (0, _selectors.getExportableState)(state)
  };
};
/**
 * Styles for the withStyles HOC
 */


var styles = function styles(theme) {
  return {
    accordionTitle: {
      padding: 0
    }
  };
};

var enhance = (0, _redux.compose)((0, _reactI18next.withTranslation)(), (0, _styles.withStyles)(styles), (0, _reactRedux.connect)(mapStateToProps, {}), (0, _withPlugins.withPlugins)('WorkspaceExport'));

var _default = enhance(_WorkspaceExport.WorkspaceExport);

exports["default"] = _default;