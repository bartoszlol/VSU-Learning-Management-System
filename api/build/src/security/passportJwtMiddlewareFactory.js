"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = require("passport");
exports.default = (strategy) => passport_1.authenticate(strategy, { session: false, assignProperty: 'jwtData' });

//# sourceMappingURL=../../maps/src/security/passportJwtMiddlewareFactory.js.map
