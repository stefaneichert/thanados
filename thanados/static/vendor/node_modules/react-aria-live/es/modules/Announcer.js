function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import MessageBlock from './MessageBlock';

var Announcer = function (_Component) {
  _inherits(Announcer, _Component);

  function Announcer() {
    var _temp, _this, _ret;

    _classCallCheck(this, Announcer);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, _Component.call.apply(_Component, [this].concat(args))), _this), _this.state = {
      assertiveMessage1: '',
      assertiveMessage2: '',
      politeMessage1: '',
      politeMessage2: '',
      oldPolitemessage: '',
      oldPoliteMessageId: '',
      oldAssertiveMessage: '',
      oldAssertiveMessageId: '',
      setAlternatePolite: false,
      setAlternateAssertive: false
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  Announcer.getDerivedStateFromProps = function getDerivedStateFromProps(nextProps, state) {
    var oldPolitemessage = state.oldPolitemessage,
        oldPoliteMessageId = state.oldPoliteMessageId,
        oldAssertiveMessage = state.oldAssertiveMessage,
        oldAssertiveMessageId = state.oldAssertiveMessageId;
    var politeMessage = nextProps.politeMessage,
        politeMessageId = nextProps.politeMessageId,
        assertiveMessage = nextProps.assertiveMessage,
        assertiveMessageId = nextProps.assertiveMessageId;


    if (oldPolitemessage !== politeMessage || oldPoliteMessageId !== politeMessageId) {
      return {
        politeMessage1: state.setAlternatePolite ? '' : politeMessage,
        politeMessage2: state.setAlternatePolite ? politeMessage : '',
        oldPolitemessage: politeMessage,
        oldPoliteMessageId: politeMessageId,
        setAlternatePolite: !state.setAlternatePolite
      };
    }

    if (oldAssertiveMessage !== assertiveMessage || oldAssertiveMessageId !== assertiveMessageId) {
      return {
        assertiveMessage1: state.setAlternateAssertive ? '' : assertiveMessage,
        assertiveMessage2: state.setAlternateAssertive ? assertiveMessage : '',
        oldAssertiveMessage: assertiveMessage,
        oldAssertiveMessageId: assertiveMessageId,
        setAlternateAssertive: !state.setAlternateAssertive
      };
    }

    return null;
  };

  Announcer.prototype.render = function render() {
    var _state = this.state,
        assertiveMessage1 = _state.assertiveMessage1,
        assertiveMessage2 = _state.assertiveMessage2,
        politeMessage1 = _state.politeMessage1,
        politeMessage2 = _state.politeMessage2;

    return React.createElement(
      'div',
      null,
      React.createElement(MessageBlock, { 'aria-live': 'assertive', message: assertiveMessage1 }),
      React.createElement(MessageBlock, { 'aria-live': 'assertive', message: assertiveMessage2 }),
      React.createElement(MessageBlock, { 'aria-live': 'polite', message: politeMessage1 }),
      React.createElement(MessageBlock, { 'aria-live': 'polite', message: politeMessage2 })
    );
  };

  return Announcer;
}(Component);

Announcer.propTypes = process.env.NODE_ENV !== "production" ? {
  politeMessage: PropTypes.string,
  assertiveMessage: PropTypes.string
} : {};


export default Announcer;