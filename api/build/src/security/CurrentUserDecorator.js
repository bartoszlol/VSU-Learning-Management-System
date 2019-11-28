"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../models/User");
const mongoose = require("mongoose");
class CurrentUserDecorator {
    static checkCurrentUser(action) {
        const jwtData = action.request.jwtData;
        const userId = jwtData.tokenPayload._id;
        return User_1.User.findById(mongoose.Types.ObjectId(userId))
            .then((user) => user.toObject());
    }
}
exports.CurrentUserDecorator = CurrentUserDecorator;

//# sourceMappingURL=../../maps/src/security/CurrentUserDecorator.js.map
