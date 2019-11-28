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
const main_1 = require("../src/config/main");
const User_1 = require("../src/models/User");
const fs = require("fs");
const Course_1 = require("../src/models/Course");
const crypto = require("crypto");
const FixtureUtils_1 = require("./FixtureUtils");
const Lecture_1 = require("../src/models/Lecture");
const Unit_1 = require("../src/models/units/Unit");
const Message_1 = require("../src/models/Message");
const WhitelistUser_1 = require("../src/models/WhitelistUser");
const Progress_1 = require("../src/models/progress/Progress");
const ChatRoom_1 = require("../src/models/ChatRoom");
class FixtureLoader {
    constructor() {
        this.usersDirectory = 'build/fixtures/users/';
        this.coursesDirectory = 'build/fixtures/courses/';
        this.chatDirectory = 'build/fixtures/chat/';
        this.binaryDirectory = 'build/fixtures/binaryData/';
    }
    loadMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            const messageFixtures = fs.readdirSync(this.chatDirectory);
            for (const messageFile of messageFixtures) {
                const file = fs.readFileSync(this.chatDirectory + messageFile);
                let chatRooms;
                if (messageFile.toString().includes('messages')) {
                    chatRooms = yield ChatRoom_1.ChatRoom.find({ 'room.roomType': 'Course' });
                }
                else {
                    chatRooms = yield ChatRoom_1.ChatRoom.find({ 'room.roomType': 'Unit' });
                }
                const messages = JSON.parse(file.toString());
                chatRooms.map((chatRoom) => __awaiter(this, void 0, void 0, function* () {
                    const hash = crypto.createHash('sha1').update(file.toString()).digest('hex');
                    const users = yield FixtureUtils_1.FixtureUtils.getRandomUsers(2, 10, hash);
                    messages.map((message) => __awaiter(this, void 0, void 0, function* () {
                        message.room = chatRoom._id;
                        let randomIdx = FixtureUtils_1.FixtureUtils.getRandomNumber(0, users.length);
                        let randomUser = users[randomIdx];
                        message.author = randomUser._id;
                        message.chatName = randomUser.role + randomIdx;
                        if (message.comments && message.comments.length > 0) {
                            message.comments.map((msg) => {
                                msg.room = chatRoom._id;
                                randomIdx = FixtureUtils_1.FixtureUtils.getRandomNumber(0, users.length);
                                randomUser = users[randomIdx];
                                msg.author = randomUser._id;
                                msg.chatName = randomUser.role + randomIdx;
                            });
                        }
                        yield new Message_1.Message(message).save();
                    }));
                }));
            }
        });
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose.connection.readyState) {
                yield mongoose.connect(main_1.default.database, main_1.default.databaseOptions);
            }
            yield mongoose.connection.dropDatabase();
            yield User_1.User.createIndexes();
            const userfixtures = fs.readdirSync(this.usersDirectory);
            const coursefixtures = fs.readdirSync(this.coursesDirectory);
            // import userfiles
            // order needs to be always the same for 'getRandom...(hash)' to work properly
            for (const userFile of userfixtures) {
                const file = fs.readFileSync(this.usersDirectory + userFile);
                const users = JSON.parse(file.toString());
                // each file consists of an array of users to provide possibility of logical grouping
                for (const userDef of users) {
                    yield new User_1.User(userDef).save();
                }
            }
            // import coursefiles
            yield Promise.all(coursefixtures.map((courseFile) => __awaiter(this, void 0, void 0, function* () {
                const file = fs.readFileSync(this.coursesDirectory + courseFile);
                const course = JSON.parse(file.toString());
                const hash = crypto.createHash('sha1').update(file.toString()).digest('hex');
                // assign random courseAdmin
                const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher(hash);
                // assign random courseTeachers
                course.teachers = yield FixtureUtils_1.FixtureUtils.getRandomTeachers(0, 2, hash);
                // enroll random array of Students
                course.students = yield FixtureUtils_1.FixtureUtils.getRandomStudents(2, 10, hash);
                // enroll random array of WhitelistUsers
                const randomWhitelistUser = yield FixtureUtils_1.FixtureUtils.getRandomWhitelistUsers(course.students, course, hash);
                if (!course.hasOwnProperty('whitelist')) {
                    course.whitelist = [];
                }
                yield Promise.all(randomWhitelistUser.map((whitelistUser) => __awaiter(this, void 0, void 0, function* () {
                    course.whitelist.push(yield WhitelistUser_1.WhitelistUser.create(whitelistUser));
                })));
                const importedCourse = yield Course_1.Course.schema.statics.importJSON(course, teacher, course.active);
                return importedCourse._id;
            })));
            // import messages
            yield this.loadMessages();
            // import files
            const fileUnits = yield Unit_1.Unit.find({ files: { $exists: true } });
            yield Promise.all(fileUnits.map((unit) => __awaiter(this, void 0, void 0, function* () {
                const files = unit.files;
                for (const file of files) {
                    if (!fs.existsSync(file.path) && fs.existsSync(this.binaryDirectory + file.alias)) {
                        fs.copyFileSync(this.binaryDirectory + file.alias, file.path);
                    }
                }
            })));
            // generate progress
            const progressableUnits = yield Unit_1.Unit.find({ progressable: true });
            yield Promise.all(progressableUnits.map((unit) => __awaiter(this, void 0, void 0, function* () {
                const lecture = yield Lecture_1.Lecture.findOne({ units: { $in: [unit._id] } });
                const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
                const students = yield User_1.User.find({ _id: { $in: course.students } });
                const unitObj = yield unit.toObject();
                for (const student of students) {
                    // do not create a progress if type is zero
                    // 1 -> create progress with `done: false`
                    // 2 -> create progress with `done: true` (and a solution)
                    const progressType = FixtureUtils_1.FixtureUtils.getNumberFromString(student.email + student.uid + course.name + lecture.name + unit.name, 0, 3);
                    if (progressType === 0) {
                        continue;
                    }
                    const newProgress = {
                        course: course._id.toString(),
                        unit: unit._id.toString(),
                        user: student._id.toString(),
                    };
                    // need to be implemented for each unit type separately
                    switch (unit.__t) {
                        case 'code-kata': {
                            if (progressType === 1) {
                                newProgress.code = '// at least i tried ¯\\\\_(ツ)_/¯';
                                newProgress.done = false;
                            }
                            else if (progressType === 2) {
                                newProgress.code = unitObj.code;
                                newProgress.done = true;
                            }
                            newProgress.__t = 'codeKata';
                            break;
                        }
                        case 'task': {
                            // does not work properly yet
                            if (progressType === 1) {
                                newProgress.answers = FixtureUtils_1.FixtureUtils.getAnswersFromTaskUnit(unit, false);
                                newProgress.done = false;
                            }
                            else if (progressType === 2) {
                                newProgress.answers = FixtureUtils_1.FixtureUtils.getAnswersFromTaskUnit(unit, true);
                                newProgress.done = true;
                            }
                            newProgress.__t = 'task-unit-progress';
                            break;
                        }
                    }
                    yield Progress_1.Progress.create(newProgress);
                }
                return unit.name;
            })));
        });
    }
}
exports.FixtureLoader = FixtureLoader;

//# sourceMappingURL=../maps/fixtures/FixtureLoader.js.map
