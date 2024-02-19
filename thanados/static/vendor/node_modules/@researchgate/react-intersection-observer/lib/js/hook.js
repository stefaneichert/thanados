"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIntersectionObserver = void 0;
var react_1 = require("react");
var observer_1 = require("./observer");
var utils_1 = require("./utils");
var noop = function () { };
/**
 * useIntersectionObserver hook that has almost the same api as <Observer />
 *
 * @param {ChangeHandler} onChange Function that will be invoked whenever the intersection value for this element changes.
 * @param {Options} options Option to customize instersction observer instance or disable it
 *
 * @example
 * const App = () => {
 *   const onChange = ({ isIntersecting }) => console.log({ isIntersecting })
 *   const ref = useIntersectionObserver(onChange)
 *
 *   return <div ref={ref} />
 * }
 */
exports.useIntersectionObserver = function (
/**
 * Function that will be invoked whenever the intersection value for this element changes.
 */
onChange, _a) {
    var _b = _a === void 0 ? {} : _a, root = _b.root, rootMargin = _b.rootMargin, threshold = _b.threshold, disabled = _b.disabled;
    var observingRef = react_1.useRef(false);
    var instanceRef = react_1.useRef({
        // unobserve function needs an instance and instance.handleChange needs an unobserve to be caught by closure.
        // So it's essentially a circular reference that's resolved by assigning handleChange later
        handleChange: function (event) {
            /* istanbul ignore next line */
            onChange(event, noop);
        },
    });
    var unobserve = react_1.useCallback(function () {
        if (instanceRef.current.target && observingRef.current) {
            observer_1.unobserveElement(instanceRef.current, instanceRef.current.target);
            observingRef.current = false;
        }
    }, []);
    instanceRef.current.handleChange = function handleChange(event) {
        /* istanbul ignore next line */
        onChange(event, unobserve);
    };
    var observe = function () {
        if (instanceRef.current.observer &&
            instanceRef.current.target &&
            !observingRef.current) {
            observer_1.observeElement(instanceRef.current);
            observingRef.current = true;
        }
    };
    var memoizedThreshold = react_1.useMemo(function () { return threshold; }, [
        utils_1.thresholdCacheKey(threshold),
    ]);
    var observer = react_1.useMemo(function () {
        if (disabled) {
            unobserve();
            instanceRef.current.observer = undefined;
            return undefined;
        }
        var rootOption = typeof root === 'string' ? document.querySelector(root) : root;
        var obs = observer_1.createObserver({
            root: rootOption,
            rootMargin: rootMargin,
            threshold: memoizedThreshold,
        });
        instanceRef.current.observer = obs;
        unobserve();
        observe();
        return obs;
    }, [root, rootMargin, memoizedThreshold, disabled]);
    var setRef = react_1.useCallback(function (node) {
        var isNewNode = node != null && instanceRef.current.target !== node;
        if (!observer) {
            unobserve();
        }
        if (isNewNode) {
            unobserve();
            instanceRef.current.target = node;
            observe();
        }
        if (!node) {
            unobserve();
            instanceRef.current.target = undefined;
        }
    }, [observer]);
    return [setRef, unobserve];
};
