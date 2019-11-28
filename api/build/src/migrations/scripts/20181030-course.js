"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// tslint:disable:no-console
const mongoose = require("mongoose");
const brokenChatRoomSchema = new mongoose.Schema({
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
const brokenCourseSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    active: {
        type: Boolean
    },
    description: {
        type: String
    },
    courseAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    media: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Directory'
    },
    teachers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    lectures: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lecture'
        }
    ],
    accessKey: {
        type: String
    },
    enrollType: {
        type: String,
        enum: ['free', 'whitelist', 'accesskey'],
        default: 'free'
    },
    whitelist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WhitelistUser'
        }
    ],
    image: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Picture'
    },
    chatRooms: [brokenChatRoomSchema]
}, {
    timestamps: true,
    collection: 'courses',
    toObject: {
        transform: function (doc, ret, { currentUser }) {
            if (ret.hasOwnProperty('_id') && ret._id !== null) {
                ret._id = ret._id.toString();
            }
            if (ret.hasOwnProperty('courseAdmin') && ret.courseAdmin !== null && (ret.courseAdmin instanceof mongoose.Types.ObjectId)) {
                ret.courseAdmin = ret.courseAdmin.toString();
            }
            ret.hasAccessKey = false;
            if (ret.accessKey) {
                ret.hasAccessKey = true;
            }
            if (currentUser !== undefined) {
                if (doc.populated('teachers') !== undefined) {
                    ret.teachers = doc.teachers.map((user) => user.forUser(currentUser));
                }
                if (doc.populated('students') !== undefined) {
                    ret.students = doc.students.map((user) => user.forUser(currentUser));
                }
            }
        }
    }
});
const BrokenCourse = mongoose.model('BrokenCourse', brokenCourseSchema);
class BrokenCourseMigration {
    up() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('BrokenCourse up was called');
            try {
                const brokenCourses = yield BrokenCourse.find({ 'chatRooms': { $exists: true } });
                yield Promise.all(brokenCourses.map((brokenCourse) => __awaiter(this, void 0, void 0, function* () {
                    const courseObj = brokenCourse.toObject();
                    const fixedChatRooms = courseObj.chatRooms.map((chatRoom) => {
                        if (chatRoom instanceof mongoose.Types.ObjectId) {
                            return chatRoom;
                        }
                        else {
                            return mongoose.Types.ObjectId(chatRoom._id);
                        }
                    });
                    courseObj.chatRooms = fixedChatRooms;
                    courseObj._id = mongoose.Types.ObjectId(courseObj._id);
                    return yield mongoose.connection.collection('courses')
                        .findOneAndReplace({ '_id': courseObj._id }, courseObj);
                })));
            }
            catch (error) {
                console.log('1: ' + error);
            }
            console.log('Broken courses have been fixed successfully!');
            return true;
        });
    }
}
module.exports = BrokenCourseMigration;

//# sourceMappingURL=../../../maps/src/migrations/scripts/20181030-course.js.map
