"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../models/User");
const passport_local_1 = require("passport-local");
const util_1 = require("util");
const routing_controllers_1 = require("routing-controllers");
exports.default = new passport_local_1.Strategy({
    usernameField: 'email'
}, (email, password, done) => __awaiter(this, void 0, void 0, function* () {
    try {
        const user = yield User_1.User.findOne({ email: email });
        if (!user) {
            return done(new routing_controllers_1.UnauthorizedError('couldNotBeVerified'), null);
        }
        // dismiss password reset process
        if (!util_1.isNullOrUndefined(user.resetPasswordToken)) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            yield user.save();
        }
        const isValid = yield user.isValidPassword(password);
        if (!isValid) {
            return done(new routing_controllers_1.UnauthorizedError('couldNotBeVerified'), null);
        }
        else if (!user.isActive) {
            return done(new routing_controllers_1.UnauthorizedError('notActiveYet'), null);
        }
        else {
            return done(null, user);
        }
    }
    catch (err) {
        done(new routing_controllers_1.UnauthorizedError('unknown'), null);
    }
}));

//# sourceMappingURL=../../maps/src/security/passportLoginStrategy.js.map
