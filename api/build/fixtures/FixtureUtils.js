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
const User_1 = require("../src/models/User");
const Course_1 = require("../src/models/Course");
const Lecture_1 = require("../src/models/Lecture");
const Unit_1 = require("../src/models/units/Unit");
const ExtractMongoId_1 = require("../src/utilities/ExtractMongoId");
const mongoose = require("mongoose");
var ObjectId = mongoose.Types.ObjectId;
class FixtureUtils {
    static getRandomUser(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield this.getUser();
            return this.getRandom(array, hash);
        });
    }
    static getRandomUsers(min, max, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield this.getUser();
            return this.getRandomArray(array, min, max, hash);
        });
    }
    static getRandomAdmin(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield this.getAdmins();
            return this.getRandom(array, hash);
        });
    }
    static getRandomAdmins(min, max, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield this.getAdmins();
            return this.getRandomArray(array, min, max, hash);
        });
    }
    static getRandomTeacher(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield this.getTeacher();
            return this.getRandom(array, hash);
        });
    }
    static getRandomTeacherForCourse(course, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getRandom([course.courseAdmin, ...course.teachers], hash);
            return yield User_1.User.findById(user);
        });
    }
    static getRandomStudentForCourse(course, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getRandom([...course.students], hash);
            return yield User_1.User.findById(user);
        });
    }
    static getRandomTeachers(min, max, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield this.getTeacher();
            return this.getRandomArray(array, min, max, hash);
        });
    }
    static getRandomStudent(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield this.getStudents();
            return this.getRandom(array, hash);
        });
    }
    static getRandomActiveStudent(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield User_1.User.find({ role: 'student', isActive: true });
            return this.getRandom(array, hash);
        });
    }
    static getRandomInactiveStudent(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield User_1.User.find({ role: 'student', isActive: false });
            return this.getRandom(array, hash);
        });
    }
    static getRandomStudents(min, max, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield this.getStudents();
            return this.getRandomArray(array, min, max, hash);
        });
    }
    // FIXME: This should return a valid type. (Promise<IWhitelistUser[]>)
    static getRandomWhitelistUsers(students, course, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const randomArray = students.splice(0, this.getRandomNumber(0, students.length - 1));
            const array = yield this.getRandomArray(randomArray, 0, students.length - 1, hash);
            return array.map((stud) => {
                return {
                    firstName: stud.profile.firstName,
                    lastName: stud.profile.lastName,
                    uid: stud.uid,
                    courseId: new ObjectId(course._id)
                };
            });
        });
    }
    static getRandomCourse(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield this.getCourses();
            return this.getRandom(array, hash);
        });
    }
    static getRandomCourseWithAllUnitTypes(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield this.getCourses();
            const coursesWithAllUnitTypes = [];
            for (const course of array) {
                let hasFreeText = false;
                let hasTask = false;
                let hasCodeKata = false;
                for (const lecId of course.lectures) {
                    const lec = yield Lecture_1.Lecture.findById(lecId);
                    for (const unitId of lec.units) {
                        const unit = yield Unit_1.Unit.findById(unitId);
                        if (unit.__t === 'free-text') {
                            hasFreeText = true;
                        }
                        else if (unit.__t === 'task') {
                            hasTask = true;
                        }
                        else if (unit.__t === 'code-kata') {
                            hasCodeKata = true;
                        }
                    }
                }
                if (hasFreeText && hasTask && hasCodeKata) {
                    coursesWithAllUnitTypes.push(course);
                }
            }
            return this.getRandom(coursesWithAllUnitTypes, hash);
        });
    }
    static getCourseFromLecture(lecture) {
        return __awaiter(this, void 0, void 0, function* () {
            return Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
        });
    }
    static getCourseFromUnit(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            return Course_1.Course.findById(unit._course);
        });
    }
    static getRandomLecture(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield this.getLectures();
            return this.getRandom(array, hash);
        });
    }
    static getRandomLectureFromCourse(course, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const lectureId = yield this.getRandom(course.lectures, hash);
            return Lecture_1.Lecture.findById(lectureId);
        });
    }
    static getLectureFromUnit(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            return Lecture_1.Lecture.findOne({ units: { $in: [unit._id] } });
        });
    }
    static getRandomUnit(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const array = yield this.getUnits();
            return this.getRandom(array, hash);
        });
    }
    static getRandomUnitFromLecture(lecture, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const unitId = yield this.getRandom(lecture.units, hash);
            return Unit_1.Unit.findById(unitId);
        });
    }
    static getRandomUnitFromCourse(course, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const units = yield Unit_1.Unit.find({ _course: course });
            return yield this.getRandom(units, hash);
        });
    }
    /**
     * Provides simple shared setup functionality currently used by multiple chat system unit tests.
     *
     * @param hash The optional RNG seed passed to FixtureUtils.getRandom for random course.chatRooms selection.
     * @returns A random fixture course and one of its chatRooms, also randomly selected, in form of a roomId.
     */
    static getSimpleChatRoomSetup(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils.getRandomCourse();
            const room = yield FixtureUtils.getRandom(course.chatRooms, hash);
            const roomId = ExtractMongoId_1.extractSingleMongoId(room);
            return { course, roomId };
        });
    }
    /**
     * Obtain an unauthorized teacher for a course.
     * This teacher can be used for access denial unit tests.
     *
     * @param course The teacher can't belong to this given course; i.e. the teacher won't be 'courseAdmin' or one of the 'teachers'.
     * @returns A user with 'teacher' role that is not authorized to access the given course.
     */
    static getUnauthorizedTeacherForCourse(course) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield User_1.User.findOne({
                _id: { $nin: [course.courseAdmin, ...course.teachers] },
                role: 'teacher'
            });
        });
    }
    /**
     * Obtain an unauthorized student for a course.
     * This student can be used for access denial unit tests.
     *
     * @param course The student can't belong to this given course; i.e. the student won't be part of the 'students'.
     * @returns A user with 'student' role that is not authorized to access the given course.
     */
    static getUnauthorizedStudentForCourse(course) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield User_1.User.findOne({
                _id: { $nin: course.students },
                role: 'student'
            });
        });
    }
    static getAdmins() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getUser('admin');
        });
    }
    static getTeacher() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getUser('teacher');
        });
    }
    static getStudents() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getUser('student');
        });
    }
    static getUserCount() {
        return __awaiter(this, void 0, void 0, function* () {
            return User_1.User.countDocuments({});
        });
    }
    static getCourses() {
        return __awaiter(this, void 0, void 0, function* () {
            return Course_1.Course.find()
                .populate('students')
                .populate('whitelist');
        });
    }
    static getLectures() {
        return __awaiter(this, void 0, void 0, function* () {
            return Lecture_1.Lecture.find();
        });
    }
    static getUnits() {
        return __awaiter(this, void 0, void 0, function* () {
            return Unit_1.Unit.find();
        });
    }
    static getUser(role) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!role) {
                return User_1.User.find();
            }
            return User_1.User.find({ role: role });
        });
    }
    // returns a random entry out of the array
    // returns always the same entry when you provide the same hash (given the fixture base did not change)
    static getRandom(array, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            if (hash) {
                return array[this.getNumberFromString(hash, 0, array.length)];
            }
            else {
                return array[this.getRandomNumber(0, array.length)];
            }
        });
    }
    // returns an random subarray
    // returns always the same array when you provide the same hash (given the fixture base did not change)
    static getRandomArray(array, min, max, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            if (hash) {
                const count = this.getNumberFromString(hash, min, max);
                const start = this.getNumberFromString(hash, 0, array.length - count);
                return array.slice(start, start + count);
            }
            else {
                const shuffeledArray = this.shuffleArray(array);
                const count = this.getRandomNumber(min, max);
                const start = this.getRandomNumber(0, shuffeledArray.length - count);
                return shuffeledArray.slice(start, start + count);
            }
        });
    }
    static getRandomNumber(start, end) {
        return Math.floor(Math.random() * end) + start;
    }
    // returns a number for a given string between the boundaries of start(inclusive) and end(exclusive)
    static getNumberFromString(str, start, end) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash += char;
        }
        return start + (hash % (end - start));
    }
    static shuffleArray(array) {
        let tmp;
        let current;
        let top = array.length;
        if (top) {
            while (--top) {
                current = Math.floor(Math.random() * (top + 1));
                tmp = array[current];
                array[current] = array[top];
                array[top] = tmp;
            }
        }
        return array;
    }
    static getAnswersFromTaskUnit(unit, success) {
        const answers = {};
        const unitObj = unit.toObject();
        unitObj.tasks.forEach((task) => {
            answers[task._id.toString()] = {};
            task.answers.forEach((answer) => {
                if (success) {
                    if (answer.hasOwnProperty('value')) {
                        answers[task._id.toString()][answer._id.toString()] = true;
                    }
                    else {
                        answers[task._id.toString()][answer._id.toString()] = false;
                    }
                }
                else {
                    if (answer.hasOwnProperty('value')) {
                        answers[task._id.toString()][answer._id.toString()] = false;
                    }
                    else {
                        answers[task._id.toString()][answer._id.toString()] = true;
                    }
                }
            });
        });
        return answers;
    }
}
exports.FixtureUtils = FixtureUtils;

//# sourceMappingURL=../maps/fixtures/FixtureUtils.js.map
