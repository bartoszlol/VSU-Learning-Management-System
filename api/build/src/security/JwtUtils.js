"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const main_1 = require("../config/main");
class JwtUtils {
    static generateToken(user) {
        const data = { _id: user._id.toString() };
        return jsonwebtoken_1.sign(data, main_1.default.secret, {
            expiresIn: 10080 // in seconds
        });
    }
}
exports.JwtUtils = JwtUtils;

//# sourceMappingURL=../../maps/src/security/JwtUtils.js.map
