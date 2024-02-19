'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var AnnouncerContext = _react2.default.createContext({
  announceAssertive: logContextWarning,
  announcePolite: logContextWarning
});

function logContextWarning() {
  console.warn('Announcement failed, LiveAnnouncer context is missing');
}

exports.default = AnnouncerContext;
module.exports = exports['default'];