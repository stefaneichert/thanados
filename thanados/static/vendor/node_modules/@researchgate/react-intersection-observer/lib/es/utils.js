var _a;
var marginRE = /^-?\d*\.?\d+(px|%)$/;
export function parseRootMargin(rootMargin) {
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
export function shallowCompare(next, prev) {
    if (Array.isArray(next) && Array.isArray(prev)) {
        if (next.length === prev.length) {
            return next.some(function (_, index) { return shallowCompare(next[index], prev[index]); });
        }
    }
    return next !== prev;
}
export var hasOwnProperty = (_a = Object.prototype, _a.hasOwnProperty), toString = _a.toString;
export function isChildrenWithRef(children) {
    return children && hasOwnProperty.call(children, 'ref');
}
export function thresholdCacheKey(threshold) {
    if (!threshold || typeof threshold === 'number') {
        return threshold;
    }
    return threshold.join(',');
}
