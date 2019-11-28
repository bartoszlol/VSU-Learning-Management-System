"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function only(keys, from, to = {}) {
    for (const key of keys) {
        to[key] = from[key];
    }
    return to;
}
function asEmpty(keys, from, to = {}) {
    for (const key of keys) {
        const value = from[key];
        if (Array.isArray(value)) {
            to[key] = [];
        }
        else if (value instanceof Object) {
            to[key] = {};
        }
    }
    return to;
}
exports.default = { only, asEmpty };

//# sourceMappingURL=../../maps/src/utilities/Pick.js.map
