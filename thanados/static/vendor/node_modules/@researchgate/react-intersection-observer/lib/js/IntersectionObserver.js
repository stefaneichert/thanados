"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptions = void 0;
var react_1 = __importDefault(require("react"));
var react_dom_1 = require("react-dom");
var observer_1 = require("./observer");
var utils_1 = require("./utils");
var observerOptions = ['root', 'rootMargin', 'threshold'];
var observableProps = ['root', 'rootMargin', 'threshold', 'disabled'];
exports.getOptions = function (props) {
    return observerOptions.reduce(function (options, key) {
        var _a;
        var isRootString = key === 'root' && utils_1.toString.call(props.root) === '[object String]';
        return Object.assign(options, (_a = {},
            _a[key] = isRootString
                ? document.querySelector(props[key])
                : props[key],
            _a));
    }, {});
};
var ReactIntersectionObserver = /** @class */ (function (_super) {
    __extends(ReactIntersectionObserver, _super);
    function ReactIntersectionObserver() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.handleChange = function (event) {
            _this.props.onChange(event, _this.externalUnobserve);
        };
        _this.handleNode = function (target) {
            var children = _this.props.children;
            /**
             * Forward hijacked ref to user.
             */
            if (utils_1.isChildrenWithRef(children)) {
                var childenRef = children.ref;
                if (typeof childenRef === 'function') {
                    childenRef(target);
                }
                else if (childenRef && utils_1.hasOwnProperty.call(childenRef, 'current')) {
                    /*
                     * The children ref.current is read-only, we aren't allowed to do this, so
                     * in future release it has to go away, and the ref shall be
                     * forwarded and assigned to a DOM node by the user.
                     */
                    childenRef.current = target;
                }
            }
            _this.targetNode = undefined;
            if (target) {
                var targetNode = react_dom_1.findDOMNode(target);
                if (targetNode && targetNode.nodeType === 1) {
                    _this.targetNode = targetNode;
                }
            }
        };
        _this.observe = function () {
            if (_this.props.children == null || _this.props.disabled) {
                return false;
            }
            if (!_this.targetNode) {
                throw new Error("ReactIntersectionObserver: Can't find DOM node in the provided children. Make sure to render at least one DOM node in the tree.");
            }
            _this.observer = observer_1.createObserver(exports.getOptions(_this.props));
            _this.target = _this.targetNode;
            observer_1.observeElement(_this);
            return true;
        };
        _this.unobserve = function (target) {
            observer_1.unobserveElement(_this, target);
        };
        _this.externalUnobserve = function () {
            if (_this.targetNode) {
                _this.unobserve(_this.targetNode);
            }
        };
        return _this;
    }
    ReactIntersectionObserver.prototype.getSnapshotBeforeUpdate = function (prevProps) {
        var _this = this;
        this.prevTargetNode = this.targetNode;
        var relatedPropsChanged = observableProps.some(function (prop) {
            return utils_1.shallowCompare(_this.props[prop], prevProps[prop]);
        });
        if (relatedPropsChanged) {
            if (this.prevTargetNode) {
                if (!prevProps.disabled) {
                    this.unobserve(this.prevTargetNode);
                }
            }
        }
        return relatedPropsChanged;
    };
    ReactIntersectionObserver.prototype.componentDidUpdate = function (_, __, relatedPropsChanged) {
        var targetNodeChanged = false;
        // check if we didn't unobserve previously due to a prop change
        if (!relatedPropsChanged) {
            targetNodeChanged = this.prevTargetNode !== this.targetNode;
            // check we have a previous node we want to unobserve
            if (targetNodeChanged && this.prevTargetNode != null) {
                this.unobserve(this.prevTargetNode);
            }
        }
        if (relatedPropsChanged || targetNodeChanged) {
            this.observe();
        }
    };
    ReactIntersectionObserver.prototype.componentDidMount = function () {
        this.observe();
    };
    ReactIntersectionObserver.prototype.componentWillUnmount = function () {
        if (this.targetNode) {
            this.unobserve(this.targetNode);
        }
    };
    ReactIntersectionObserver.prototype.render = function () {
        var children = this.props.children;
        return children != null
            ? react_1.default.cloneElement(react_1.default.Children.only(children), {
                ref: this.handleNode,
            })
            : null;
    };
    ReactIntersectionObserver.displayName = 'IntersectionObserver';
    return ReactIntersectionObserver;
}(react_1.default.Component));
exports.default = ReactIntersectionObserver;
__exportStar(require("./types"), exports);
