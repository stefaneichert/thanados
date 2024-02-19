'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var IComCom = function (_React$Component) {
  _inherits(IComCom, _React$Component);

  function IComCom(args) {
    _classCallCheck(this, IComCom);

    var _this = _possibleConstructorReturn(this, (IComCom.__proto__ || Object.getPrototypeOf(IComCom)).call(this, args));

    _this.onReceiveMessage = _this.onReceiveMessage.bind(_this);
    _this.onLoad = _this.onLoad.bind(_this);
    _this.sendMessage = _this.sendMessage.bind(_this);
    return _this;
  }

  _createClass(IComCom, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      window.addEventListener('message', this.onReceiveMessage);
      if (this._frame) {
        this._frame.addEventListener('load', this.onLoad);
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      window.removeEventListener('message', this.onReceiveMessage, false);
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (this.props.postMessageData !== nextProps.postMessageData) {
        this.sendMessage(nextProps.postMessageData);
      }
    }
  }, {
    key: 'onReceiveMessage',
    value: function onReceiveMessage(event) {
      var handleReceiveMessage = this.props.handleReceiveMessage;

      if (handleReceiveMessage) {
        handleReceiveMessage(event);
      }
    }
  }, {
    key: 'onLoad',
    value: function onLoad() {
      var handleReady = this.props.handleReady;

      if (handleReady) {
        handleReady();
      }

      this.sendMessage(this.props.postMessageData);
    }
  }, {
    key: 'sendMessage',
    value: function sendMessage(postMessageData) {
      this._frame.contentWindow.postMessage(postMessageData, this.props.targetOrigin);
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var attributes = this.props.attributes;


      return _react2.default.createElement('iframe', _extends({
        ref: function ref(el) {
          _this2._frame = el;
        }
      }, Object.assign({}, IComCom.defaultAttributes, attributes)));
    }
  }]);

  return IComCom;
}(_react2.default.Component);

IComCom.propTypes = {
  attributes: _propTypes2.default.shape({
    frameBorder: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.number]),
    height: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.number]),
    name: _propTypes2.default.string,
    scrolling: _propTypes2.default.string,
    sandbox: _propTypes2.default.string,
    srcDoc: _propTypes2.default.string,
    src: _propTypes2.default.string.isRequired,
    width: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.number])
  }),
  handleReceiveMessage: _propTypes2.default.func,
  handleReady: _propTypes2.default.func,
  postMessageData: _propTypes2.default.any,
  targetOrigin: _propTypes2.default.string
};
IComCom.defaultProps = {
  targetOrigin: '*'
};
IComCom.defaultAttributes = {
  frameBorder: 0
};
exports.default = IComCom;