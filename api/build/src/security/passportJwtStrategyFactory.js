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
const passport_jwt_1 = require("passport-jwt");
const main_1 = require("../config/main");
const User_1 = require("../models/User");
const cookie = require("cookie");
function passportJwtStrategyFactory({ name = 'jwt', extractJwtFromCookie = true, extractJwtFromAuthHeaderWithScheme = false, extractJwtFromUrlQueryParameter = false, } = {}) {
    const jwtFromRequestLayers = [];
    if (extractJwtFromCookie) {
        // ATM this and the chat server are the only users of the 'cookie' package, we could write specialized code alternatively.
        jwtFromRequestLayers.push((req) => req &&
            typeof req.headers.cookie === 'string' &&
            cookie.parse(req.headers.cookie).token);
    }
    if (extractJwtFromAuthHeaderWithScheme) {
        // Telling Passport to check authorization headers for JWT
        // TODO: Replace with bearer method to be compliant to RFC 6750
        jwtFromRequestLayers.push(passport_jwt_1.ExtractJwt.fromAuthHeaderWithScheme('jwt'));
    }
    if (extractJwtFromUrlQueryParameter) {
        jwtFromRequestLayers.push(passport_jwt_1.ExtractJwt.fromUrlQueryParameter('jwt'));
    }
    const jwtFromRequest = (request) => {
        let token = null;
        for (const layer of jwtFromRequestLayers) {
            token = layer(request);
            if (token) {
                break;
            }
        }
        return token;
    };
    const opts = {
        jwtFromRequest,
        secretOrKey: main_1.default.secret // Telling Passport where to find the secret
    };
    const verify = (payload, done) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (yield User_1.User.findById(payload._id)) {
                done(null, { tokenPayload: payload });
            }
            else {
                done(null, false);
            }
        }
        catch (error) {
            done(error);
        }
    });
    const jwtStrategy = new passport_jwt_1.Strategy(opts, verify);
    jwtStrategy.name =
        name; // Set the name property which is used by passport.
    return jwtStrategy;
}
exports.default = passportJwtStrategyFactory;

//# sourceMappingURL=../../maps/src/security/passportJwtStrategyFactory.js.map
