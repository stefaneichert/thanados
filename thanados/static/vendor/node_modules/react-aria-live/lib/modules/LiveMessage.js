'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _AnnouncerContext = require('./AnnouncerContext');

var _AnnouncerContext2 = _interopRequireDefault(_AnnouncerContext);

var _AnnouncerMessage = require('./AnnouncerMessage');

var _AnnouncerMessage2 = _interopRequireDefault(_AnnouncerMessage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var LiveMessage = function LiveMessage(props) {
  return _react2.default.createElement(
    _AnnouncerContext2.default.Consumer,
    null,
    function (contextProps) {
      return _react2.default.createElement(_AnnouncerMessage2.default, _extends({}, contextProps, props));
    }
  );
};

LiveMessage.propTypes = process.env.NODE_ENV !== "production" ? {
  message: _propTypes2.default.string.isRequired,
  'aria-live': _propTypes2.default.string.isRequired,
  clearOnUnmount: _propTypes2.default.oneOfType([_propTypes2.default.bool, _propTypes2.default.oneOf(['true', 'false'])])
} : {};

exports.default = LiveMessage;
module.exports = exports['default'];