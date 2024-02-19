import { useRef, useCallback, useMemo } from 'react';
import { createObserver, observeElement, unobserveElement } from './observer';
import { thresholdCacheKey } from './utils';
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
export var useIntersectionObserver = function (
/**
 * Function that will be invoked whenever the intersection value for this element changes.
 */
onChange, _a) {
    var _b = _a === void 0 ? {} : _a, root = _b.root, rootMargin = _b.rootMargin, threshold = _b.threshold, disabled = _b.disabled;
    var observingRef = useRef(false);
    var instanceRef = useRef({
        // unobserve function needs an instance and instance.handleChange needs an unobserve to be caught by closure.
        // So it's essentially a circular reference that's resolved by assigning handleChange later
        handleChange: function (event) {
            /* istanbul ignore next line */
            onChange(event, noop);
        },
    });
    var unobserve = useCallback(function () {
        if (instanceRef.current.target && observingRef.current) {
            unobserveElement(instanceRef.current, instanceRef.current.target);
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
            observeElement(instanceRef.current);
            observingRef.current = true;
        }
    };
    var memoizedThreshold = useMemo(function () { return threshold; }, [
        thresholdCacheKey(threshold),
    ]);
    var observer = useMemo(function () {
        if (disabled) {
            unobserve();
            instanceRef.current.observer = undefined;
            return undefined;
        }
        var rootOption = typeof root === 'string' ? document.querySelector(root) : root;
        var obs = createObserver({
            root: rootOption,
            rootMargin: rootMargin,
            threshold: memoizedThreshold,
        });
        instanceRef.current.observer = obs;
        unobserve();
        observe();
        return obs;
    }, [root, rootMargin, memoizedThreshold, disabled]);
    var setRef = useCallback(function (node) {
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
