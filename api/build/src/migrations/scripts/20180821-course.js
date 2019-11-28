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
const Course_1 = require("../../models/Course");
const ChatRoom_1 = require("../../models/ChatRoom");
class CourseV2Migration {
    up() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Course Chatroom Migration up was called');
            try {
                const oldCourses = yield Course_1.Course.find({ $or: [{ 'chatRooms': { $exists: false } }, { 'chatRooms': { $size: 0 } }] });
                yield Promise.all(oldCourses.map((course) => __awaiter(this, void 0, void 0, function* () {
                    const courseObj = course.toObject();
                    const newChatRoom = yield ChatRoom_1.ChatRoom.create({
                        name: 'General',
                        description: 'This is a general chat for the course ' + course.name,
                        room: {
                            roomType: 'Course',
                            roomFor: course._id
                        }
                    });
                    courseObj.chatRooms = [newChatRoom._id];
                    courseObj._id = mongoose.Types.ObjectId(courseObj._id);
                    return yield mongoose.connection.collection('courses')
                        .findOneAndReplace({ '_id': courseObj._id }, courseObj);
                })));
            }
            catch (error) {
                console.log('1: ' + error);
            }
            console.log('Course Chatrooms have been added sucessfully!');
            return true;
        });
    }
}
module.exports = CourseV2Migration;

//# sourceMappingURL=../../../maps/src/migrations/scripts/20180821-course.js.map
