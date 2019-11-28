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
const mongoose = require("mongoose");
const User_1 = require("./User");
const Course_1 = require("./Course");
const Unit_1 = require("./units/Unit");
const chatRoomSchema = new mongoose.Schema({
    name: {
        type: String
    },
    description: {
        type: String
    },
    room: {
        roomType: String,
        roomFor: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'room.roomType',
        }
    },
}, {
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            ret._id = ret._id.toString();
            delete ret.room;
        }
    }
});
chatRoomSchema.methods.checkPrivileges = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userIsAdmin } = User_1.User.checkPrivileges(user);
        let userCanAccessRoom = userIsAdmin;
        if (!userCanAccessRoom) {
            const { roomType, roomFor } = this.room;
            let course;
            switch (roomType) {
                case 'Course':
                    course = yield Course_1.Course.findById(roomFor);
                    break;
                case 'Unit':
                    const unit = yield Unit_1.Unit.findById(roomFor).populate('_course');
                    course = unit && unit._course;
                    break;
            }
            userCanAccessRoom = course && course.checkPrivileges(user).userCanViewCourse;
        }
        return {
            // Currently there is no differentiation between viewing and posting authentication:
            userCanViewMessages: userCanAccessRoom,
            userCanPostMessages: userCanAccessRoom
        };
    });
};
const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
exports.ChatRoom = ChatRoom;

//# sourceMappingURL=../../maps/src/models/ChatRoom.js.map
