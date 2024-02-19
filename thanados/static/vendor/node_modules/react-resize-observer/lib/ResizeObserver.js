"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } _setPrototypeOf(subClass.prototype, superClass && superClass.prototype); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.getPrototypeOf || function _getPrototypeOf(o) { return o.__proto__; }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var style = {
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  overflow: 'hidden',
  zIndex: -1,
  visibility: 'hidden',
  pointerEvents: 'none'
};
var styleChild = {
  position: 'absolute',
  left: 0,
  top: 0,
  transition: '0s'
};

function isAncestor(node, ancestor) {
  var current = node.parentNode;

  while (current) {
    if (current === ancestor) {
      return true;
    }

    current = current.parentNode;
  }

  return false;
}

var ResizeObserver =
/*#__PURE__*/
function (_React$Component) {
  function ResizeObserver() {
    var _getPrototypeOf2;

    var _temp, _this;

    _classCallCheck(this, ResizeObserver);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _possibleConstructorReturn(_this, (_temp = _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(ResizeObserver)).call.apply(_getPrototypeOf2, [this].concat(args))), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_expandRef", null), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_shrinkRef", null), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_node", null), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_lastWidth", void 0), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_lastHeight", void 0), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_lastRect", void 0), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_hasResize", false), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_handleScroll", function (event) {
      if ((_this.props.onPosition || _this.props.onReflow || _this.props.onResize) && (_this._globalScollTarget(event.target) || _this._refScrollTarget(event.target) || _this._ancestorScollTarget(event.target))) {
        _this._reflow();
      }
    }), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_globalScollTarget", function (target) {
      return target instanceof Node && (_this.props.onPosition || _this.props.onReflow) && (target === document || target === document.documentElement || target === document.body);
    }), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_refScrollTarget", function (target) {
      if (target instanceof HTMLElement && (target === _this._expandRef || target === _this._shrinkRef)) {
        var width = target.offsetWidth;
        var height = target.offsetHeight;

        if (width !== _this._lastWidth || height !== _this._lastHeight) {
          _this._lastWidth = width;
          _this._lastHeight = height;

          _this._reset(_this._expandRef);

          _this._reset(_this._shrinkRef);

          return true;
        }
      }

      return false;
    }), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_ancestorScollTarget", function (target) {
      return target instanceof Node && (_this.props.onPosition || _this.props.onReflow) && _this._node && isAncestor(_this._node, target);
    }), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_reflow", function () {
      if (!_this._node || !(_this._node.parentNode instanceof Element)) return;

      var rect = _this._node.parentNode.getBoundingClientRect();

      var sizeChanged = true;
      var positionChanged = true;

      if (_this._lastRect) {
        sizeChanged = rect.width !== _this._lastRect.width || rect.height !== _this._lastRect.height;
        positionChanged = rect.top !== _this._lastRect.top || rect.left !== _this._lastRect.left;
      }

      _this._lastRect = rect;

      if (sizeChanged && _this.props.onResize) {
        _this.props.onResize(rect);
      }

      if (positionChanged && _this.props.onPosition) {
        _this.props.onPosition(rect);
      }

      if ((sizeChanged || positionChanged) && _this.props.onReflow) {
        _this.props.onReflow(rect);
      }
    }), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_handleRef", function (node) {
      _this._node = node;
    }), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_handleExpandRef", function (node) {
      _this._reset(node);

      _this._expandRef = node;
    }), _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "_handleShrinkRef", function (node) {
      _this._reset(node);

      _this._shrinkRef = node;
    }), _temp));
  }

  _createClass(ResizeObserver, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this._reflow();

      window.addEventListener('scroll', this._handleScroll, true);

      if (this.props.onPosition || this.props.onReflow) {
        window.addEventListener('resize', this._reflow, true);
        this._hasResize = true;
      }
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      if ((this.props.onPosition || this.props.onReflow) && !this._hasResize) {
        window.addEventListener('resize', this._reflow, true);
        this._hasResize = true;
      } else if (!(this.props.onPosition || this.props.onReflow) && this._hasResize) {
        window.removeEventListener('resize', this._reflow, true);
        this._hasResize = false;
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      window.removeEventListener('scroll', this._handleScroll, true);

      if (this._hasResize) {
        window.removeEventListener('resize', this._reflow, true);
      }
    }
  }, {
    key: "_reset",
    value: function _reset(node) {
      if (node) {
        node.scrollLeft = 100000;
        node.scrollTop = 100000;
      }
    }
  }, {
    key: "render",
    value: function render() {
      if (this.props.onResize || this.props.onReflow) {
        return _react.default.createElement("div", {
          style: style,
          ref: this._handleRef
        }, _react.default.createElement("div", {
          ref: this._handleExpandRef,
          style: style
        }, _react.default.createElement("div", {
          style: _objectSpread({}, styleChild, {
            width: 100000,
            height: 100000
          })
        })), _react.default.createElement("div", {
          ref: this._handleShrinkRef,
          style: style
        }, _react.default.createElement("div", {
          style: _objectSpread({}, styleChild, {
            width: '200%',
            height: '200%'
          })
        })));
      }

      return _react.default.createElement("noscript", {
        ref: this._handleRef
      });
    }
  }]);

  _inherits(ResizeObserver, _React$Component);

  return ResizeObserver;
}(_react.default.Component);

_defineProperty(ResizeObserver, "displayName", 'ResizeObserver');

var _default = ResizeObserver;
exports.default = _default;
//# sourceMappingURL=ResizeObserver.js.map