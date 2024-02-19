"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unobserveElement = exports.observeElement = exports.createObserver = exports.callback = exports.findObserverElement = exports.getPooled = exports.observerElementsMap = void 0;
var utils_1 = require("./utils");
exports.observerElementsMap = new Map();
function getPooled(options) {
    if (options === void 0) { options = {}; }
    var root = options.root || null;
    var rootMargin = utils_1.parseRootMargin(options.rootMargin);
    var threshold = Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold != null ? options.threshold : 0];
    var observers = exports.observerElementsMap.keys();
    var observer;
    while ((observer = observers.next().value)) {
        var unmatched = root !== observer.root ||
            rootMargin !== observer.rootMargin ||
            utils_1.shallowCompare(threshold, observer.thresholds);
        if (!unmatched) {
            return observer;
        }
    }
    return null;
}
exports.getPooled = getPooled;
function findObserverElement(observer, entry) {
    var elements = exports.observerElementsMap.get(observer);
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
exports.findObserverElement = findObserverElement;
/**
 * The Intersection Observer API callback that is called whenever one element
 * – namely the target – intersects either the device viewport or a specified element.
 * Also will get called whenever the visibility of the target element changes and
 * crosses desired amounts of intersection with the root.
 */
function callback(entries, observer) {
    for (var i = 0; i < entries.length; i++) {
        var element = findObserverElement(observer, entries[i]);
        /* istanbul ignore next line */
        if (element) {
            element.handleChange(entries[i]);
        }
    }
}
exports.callback = callback;
function createObserver(options) {
    var pooled = getPooled(options);
    if (pooled) {
        return pooled;
    }
    var observer = new IntersectionObserver(callback, options);
    exports.observerElementsMap.set(observer, new Set());
    return observer;
}
exports.createObserver = createObserver;
function observeElement(element) {
    var _a;
    if (element.observer && !exports.observerElementsMap.has(element.observer)) {
        exports.observerElementsMap.set(element.observer, new Set());
    }
    (_a = exports.observerElementsMap.get(element.observer)) === null || _a === void 0 ? void 0 : _a.add(element);
    element.observer.observe(element.target);
}
exports.observeElement = observeElement;
function unobserveElement(element, target) {
    if (exports.observerElementsMap.has(element.observer)) {
        var targets = exports.observerElementsMap.get(element.observer);
        if (targets === null || targets === void 0 ? void 0 : targets.delete(element)) {
            if (targets.size > 0) {
                element.observer.unobserve(target);
            }
            else {
                element.observer.disconnect();
                exports.observerElementsMap.delete(element.observer);
            }
        }
    }
}
exports.unobserveElement = unobserveElement;
