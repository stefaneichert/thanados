'use strict';

exports.__esModule = true;

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require('react');

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AnnouncerMessage = function (_Component) {
  _inherits(AnnouncerMessage, _Component);

  function AnnouncerMessage() {
    var _temp, _this, _ret;

    _classCallCheck(this, AnnouncerMessage);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, _Component.call.apply(_Component, [this].concat(args))), _this), _this.announce = function () {
      var _this$props = _this.props,
          message = _this$props.message,
          ariaLive = _this$props['aria-live'],
          announceAssertive = _this$props.announceAssertive,
          announcePolite = _this$props.announcePolite;

      if (ariaLive === 'assertive') {
        announceAssertive(message || '', (0, _v2.default)());
      }
      if (ariaLive === 'polite') {
        announcePolite(message || '', (0, _v2.default)());
      }
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  AnnouncerMessage.prototype.componentDidMount = function componentDidMount() {
    this.announce();
  };

  AnnouncerMessage.prototype.componentDidUpdate = function componentDidUpdate(prevProps) {
    var message = this.props.message;

    if (message !== prevProps.message) {
      this.announce();
    }
  };

  AnnouncerMessage.prototype.componentWillUnmount = function componentWillUnmount() {
    var _props = this.props,
        clearOnUnmount = _props.clearOnUnmount,
        announceAssertive = _props.announceAssertive,
        announcePolite = _props.announcePolite;

    if (clearOnUnmount === true || clearOnUnmount === 'true') {
      announceAssertive('');
      announcePolite('');
    }
  };

  AnnouncerMessage.prototype.render = function render() {
    return null;
  };

  return AnnouncerMessage;
}(_react.Component);

AnnouncerMessage.propTypes = process.env.NODE_ENV !== "production" ? {
  message: _propTypes2.default.string.isRequired,
  'aria-live': _propTypes2.default.string.isRequired,
  clearOnUnmount: _propTypes2.default.oneOfType([_propTypes2.default.bool, _propTypes2.default.oneOf(['true', 'false'])]),
  announceAssertive: _propTypes2.default.func,
  announcePolite: _propTypes2.default.func
} : {};
exports.default = AnnouncerMessage;
module.exports = exports['default'];