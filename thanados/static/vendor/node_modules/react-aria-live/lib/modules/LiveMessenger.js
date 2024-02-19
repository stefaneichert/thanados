'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _AnnouncerContext = require('./AnnouncerContext');

var _AnnouncerContext2 = _interopRequireDefault(_AnnouncerContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var LiveMessenger = function LiveMessenger(_ref) {
  var children = _ref.children;
  return _react2.default.createElement(
    _AnnouncerContext2.default.Consumer,
    null,
    function (contextProps) {
      return children(contextProps);
    }
  );
};

LiveMessenger.propTypes = process.env.NODE_ENV !== "production" ? {
  children: _propTypes2.default.func.isRequired
} : {};

exports.default = LiveMessenger;
module.exports = exports['default'];