'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Announcer = require('./Announcer');

var _Announcer2 = _interopRequireDefault(_Announcer);

var _AnnouncerContext = require('./AnnouncerContext');

var _AnnouncerContext2 = _interopRequireDefault(_AnnouncerContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LiveAnnouncer = function (_Component) {
  _inherits(LiveAnnouncer, _Component);

  function LiveAnnouncer(props) {
    _classCallCheck(this, LiveAnnouncer);

    var _this = _possibleConstructorReturn(this, _Component.call(this, props));

    _this.announcePolite = function (message, id) {
      _this.setState({
        announcePoliteMessage: message,
        politeMessageId: id ? id : ''
      });
    };

    _this.announceAssertive = function (message, id) {
      _this.setState({
        announceAssertiveMessage: message,
        assertiveMessageId: id ? id : ''
      });
    };

    _this.state = {
      announcePoliteMessage: '',
      politeMessageId: '',
      announceAssertiveMessage: '',
      assertiveMessageId: '',
      updateFunctions: {
        announcePolite: _this.announcePolite,
        announceAssertive: _this.announceAssertive
      }
    };
    return _this;
  }

  LiveAnnouncer.prototype.render = function render() {
    var _state = this.state,
        announcePoliteMessage = _state.announcePoliteMessage,
        politeMessageId = _state.politeMessageId,
        announceAssertiveMessage = _state.announceAssertiveMessage,
        assertiveMessageId = _state.assertiveMessageId,
        updateFunctions = _state.updateFunctions;

    return _react2.default.createElement(
      _AnnouncerContext2.default.Provider,
      { value: updateFunctions },
      this.props.children,
      _react2.default.createElement(_Announcer2.default, {
        assertiveMessage: announceAssertiveMessage,
        assertiveMessageId: assertiveMessageId,
        politeMessage: announcePoliteMessage,
        politeMessageId: politeMessageId
      })
    );
  };

  return LiveAnnouncer;
}(_react.Component);

exports.default = LiveAnnouncer;
module.exports = exports['default'];