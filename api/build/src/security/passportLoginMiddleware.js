"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = require("passport");
function passportLoginMiddleware(req, res, next) {
    const authFunction = passport_1.authenticate('local', { session: false });
    authFunction(req, res, (err) => {
        if (err) {
            res.status(401).json(err); // set status and json body, does not get set automatically
            return next(err); // pass error to further error handling functions
        }
        return next(null);
    });
}
exports.default = passportLoginMiddleware;

//# sourceMappingURL=../../maps/src/security/passportLoginMiddleware.js.map
