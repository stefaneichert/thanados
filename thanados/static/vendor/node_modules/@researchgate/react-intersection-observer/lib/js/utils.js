"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.thresholdCacheKey = exports.isChildrenWithRef = exports.toString = exports.hasOwnProperty = exports.shallowCompare = exports.parseRootMargin = void 0;
var marginRE = /^-?\d*\.?\d+(px|%)$/;
function parseRootMargin(rootMargin) {
    var marginString = rootMargin ? rootMargin.trim() : '0px';
    var result = marginString.split(/\s+/).map(function (margin) {
        if (!marginRE.test(margin)) {
            throw new Error('rootMargin must be a string literal containing pixels and/or percent values');
        }
        return margin;
    });
    var m0 = result.shift();
    var _a = result[0], m1 = _a === void 0 ? m0 : _a, _b = result[1], m2 = _b === void 0 ? m0 : _b, _c = result[2], m3 = _c === void 0 ? m1 : _c;
    return m0 + " " + m1 + " " + m2 + " " + m3;
}
exports.parseRootMargin = parseRootMargin;
function shallowCompare(next, prev) {
    if (Array.isArray(next) && Array.isArray(prev)) {
        if (next.length === prev.length) {
            return next.some(function (_, index) { return shallowCompare(next[index], prev[index]); });
        }
    }
    return next !== prev;
}
exports.shallowCompare = shallowCompare;
exports.hasOwnProperty = (_a = Object.prototype, _a.hasOwnProperty), exports.toString = _a.toString;
function isChildrenWithRef(children) {
    return children && exports.hasOwnProperty.call(children, 'ref');
}
exports.isChildrenWithRef = isChildrenWithRef;
function thresholdCacheKey(threshold) {
    if (!threshold || typeof threshold === 'number') {
        return threshold;
    }
    return threshold.join(',');
}
exports.thresholdCacheKey = thresholdCacheKey;
