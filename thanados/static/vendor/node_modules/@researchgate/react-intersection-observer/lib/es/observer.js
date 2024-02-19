import { parseRootMargin, shallowCompare } from './utils';
export var observerElementsMap = new Map();
export function getPooled(options) {
    if (options === void 0) { options = {}; }
    var root = options.root || null;
    var rootMargin = parseRootMargin(options.rootMargin);
    var threshold = Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold != null ? options.threshold : 0];
    var observers = observerElementsMap.keys();
    var observer;
    while ((observer = observers.next().value)) {
        var unmatched = root !== observer.root ||
            rootMargin !== observer.rootMargin ||
            shallowCompare(threshold, observer.thresholds);
        if (!unmatched) {
            return observer;
        }
    }
    return null;
}
export function findObserverElement(observer, entry) {
    var elements = observerElementsMap.get(observer);
    if (elements) {
        var values = elements.values();
        var element = void 0;
        while ((element = values.next().value)) {
            if (element.target === entry.target) {
                return element;
            }
        }
    }
    return null;
}
/**
 * The Intersection Observer API callback that is called whenever one element
 * – namely the target – intersects either the device viewport or a specified element.
 * Also will get called whenever the visibility of the target element changes and
 * crosses desired amounts of intersection with the root.
 */
export function callback(entries, observer) {
    for (var i = 0; i < entries.length; i++) {
        var element = findObserverElement(observer, entries[i]);
        /* istanbul ignore next line */
        if (element) {
            element.handleChange(entries[i]);
        }
    }
}
export function createObserver(options) {
    var pooled = getPooled(options);
    if (pooled) {
        return pooled;
    }
    var observer = new IntersectionObserver(callback, options);
    observerElementsMap.set(observer, new Set());
    return observer;
}
export function observeElement(element) {
    var _a;
    if (element.observer && !observerElementsMap.has(element.observer)) {
        observerElementsMap.set(element.observer, new Set());
    }
    (_a = observerElementsMap.get(element.observer)) === null || _a === void 0 ? void 0 : _a.add(element);
    element.observer.observe(element.target);
}
export function unobserveElement(element, target) {
    if (observerElementsMap.has(element.observer)) {
        var targets = observerElementsMap.get(element.observer);
        if (targets === null || targets === void 0 ? void 0 : targets.delete(element)) {
            if (targets.size > 0) {
                element.observer.unobserve(target);
            }
            else {
                element.observer.disconnect();
                observerElementsMap.delete(element.observer);
            }
        }
    }
}
