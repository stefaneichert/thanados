function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import PropTypes from 'prop-types';
import { Component } from 'react';
import uuidv4 from 'uuid/v4';

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
        announceAssertive(message || '', uuidv4());
      }
      if (ariaLive === 'polite') {
        announcePolite(message || '', uuidv4());
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
}(Component);

AnnouncerMessage.propTypes = process.env.NODE_ENV !== "production" ? {
  message: PropTypes.string.isRequired,
  'aria-live': PropTypes.string.isRequired,
  clearOnUnmount: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(['true', 'false'])]),
  announceAssertive: PropTypes.func,
  announcePolite: PropTypes.func
} : {};


export default AnnouncerMessage;