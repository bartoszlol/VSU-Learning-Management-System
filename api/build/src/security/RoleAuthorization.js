"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routing_controllers_1 = require("routing-controllers");
const User_1 = require("../models/User");
const mongoose = require("mongoose");
class RoleAuthorization {
    static checkAuthorization(action, roles) {
        const jwtData = action.request.jwtData;
        if (!jwtData) {
            throw new routing_controllers_1.UnauthorizedError();
        }
        const userId = jwtData.tokenPayload._id;
        return User_1.User.findById(mongoose.Types.ObjectId(userId))
            .then((user) => {
            if (user && !roles.length) {
                return true;
            }
            if (user && (roles.indexOf(user.role) !== -1)) {
                return true;
            }
            return false;
        });
    }
}
exports.RoleAuthorization = RoleAuthorization;

//# sourceMappingURL=../../maps/src/security/RoleAuthorization.js.map
