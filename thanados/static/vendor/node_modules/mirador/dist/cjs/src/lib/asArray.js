"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = asArray;

/**
 */
function asArray(value) {
  if (value === undefined) return [];

  if (!Array.isArray(value)) {
    return [value];
  }

  return value;
}