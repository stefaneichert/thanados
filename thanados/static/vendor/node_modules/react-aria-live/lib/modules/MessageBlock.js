'use strict';

exports.__esModule = true;

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var offScreenStyle = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  padding: 0,
  width: '1px',
  position: 'absolute'
};

var MessageBlock = function MessageBlock(_ref) {
  var message = _ref.message,
      ariaLive = _ref['aria-live'];
  return _react2.default.createElement(
    'div',
    { style: offScreenStyle, role: 'log', 'aria-live': ariaLive },
    message ? message : ''
  );
};

MessageBlock.propTypes = process.env.NODE_ENV !== "production" ? {
  message: _propTypes2.default.string.isRequired,
  'aria-live': _propTypes2.default.string.isRequired
} : {};

exports.default = MessageBlock;
module.exports = exports['default'];