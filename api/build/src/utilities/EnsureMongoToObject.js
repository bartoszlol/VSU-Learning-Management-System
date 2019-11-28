"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Either calls the mongoose toObject function and returns the result, or simply returns the input.
 *
 * @param from A mongoose object with toObject function or any other object already returned by toObject (or similar).
 * @param options Optional mongoose toObject options.
 */
function ensureMongoToObject(from, options) {
    if ('toObject' in from && typeof from.toObject === 'function') {
        return from.toObject(options);
    }
    else {
        return from;
    }
}
exports.ensureMongoToObject = ensureMongoToObject;

//# sourceMappingURL=../../maps/src/utilities/EnsureMongoToObject.js.map
