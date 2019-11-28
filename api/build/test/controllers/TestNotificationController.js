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
const chai = require("chai");
const chaiHttp = require("chai-http");
const TestHelper_1 = require("../TestHelper");
const FixtureUtils_1 = require("../../fixtures/FixtureUtils");
const Notification_1 = require("../../src/models/Notification");
const User_1 = require("../../src/models/User");
const Lecture_1 = require("../../src/models/Lecture");
const NotificationSettings_1 = require("../../src/models/NotificationSettings");
const errorCodes_1 = require("../../src/config/errorCodes");
chai.use(chaiHttp);
const should = chai.should();
const BASE_URL = '/api/notification';
const testHelper = new TestHelper_1.TestHelper(BASE_URL);
/**
 * Common setup function for the notification creation (POST) routes.
 */
function preparePostSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
        const student = course.students[Math.floor(Math.random() * course.students.length)];
        const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
        return { course, student, teacher };
    });
}
/**
 * Common setup function for the notification creation (POST) routes with a changed course.
 */
function preparePostChangedCourseSetup(active = true) {
    return __awaiter(this, void 0, void 0, function* () {
        const setup = yield preparePostSetup();
        const { course } = setup;
        course.active = active;
        yield course.save();
        const newNotification = {
            targetId: course.id,
            targetType: 'course',
            text: 'test text'
        };
        return Object.assign({}, setup, { newNotification });
    });
}
/**
 * Common setup function for the notification creation (POST) routes with invalid targetId.
 */
function preparePostNotFoundSetup(targetType) {
    return __awaiter(this, void 0, void 0, function* () {
        const setup = yield preparePostSetup();
        const newNotification = {
            targetType,
            targetId: '000000000000000000000000',
            text: 'test text'
        };
        return Object.assign({}, setup, { newNotification });
    });
}
/**
 * 'should respond with 400 for an invalid targetType'
 */
function invalidTargetTypePostTest(urlPostfixAssembler) {
    return __awaiter(this, void 0, void 0, function* () {
        const { student, teacher, newNotification } = yield preparePostChangedCourseSetup();
        newNotification.targetType = 'some-invalid-targetType';
        const res = yield testHelper.commonUserPostRequest(teacher, urlPostfixAssembler(student), newNotification);
        res.status.should.be.equal(400);
        res.body.message.should.be.equal(errorCodes_1.errorCodes.notification.invalidTargetType.text);
    });
}
/**
 * 'should respond with 404 for an invalid course/lecture/unit id target'
 */
function notFoundPostTest(targetType, urlPostfixAssembler) {
    return __awaiter(this, void 0, void 0, function* () {
        const { teacher, student, newNotification } = yield preparePostNotFoundSetup(targetType);
        const res = yield testHelper.commonUserPostRequest(teacher, urlPostfixAssembler(student), newNotification);
        res.status.should.be.equal(404);
    });
}
function addCommonPostTests(urlPostfixAssembler) {
    it('should respond with 404 for an invalid course id target', () => __awaiter(this, void 0, void 0, function* () {
        yield notFoundPostTest('course', urlPostfixAssembler);
    }));
    it('should respond with 404 for an invalid lecture id target', () => __awaiter(this, void 0, void 0, function* () {
        yield notFoundPostTest('lecture', urlPostfixAssembler);
    }));
    it('should respond with 404 for an invalid unit id target', () => __awaiter(this, void 0, void 0, function* () {
        yield notFoundPostTest('unit', urlPostfixAssembler);
    }));
    it('should respond with 400 for an invalid targetType', () => __awaiter(this, void 0, void 0, function* () {
        yield invalidTargetTypePostTest(urlPostfixAssembler);
    }));
}
describe('Notifications', () => __awaiter(this, void 0, void 0, function* () {
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield testHelper.resetForNextTest();
    }));
    describe(`POST ${BASE_URL}`, () => __awaiter(this, void 0, void 0, function* () {
        /**
         * For the PostNotifications route this can simply return '' without doing anything.
         */
        function urlPostfixAssembler() {
            return '';
        }
        it('should fail if text parameter is not given', () => __awaiter(this, void 0, void 0, function* () {
            const { course, teacher } = yield preparePostSetup();
            const newNotification = {
                targetId: course.id,
                targetType: 'course'
            };
            const res = yield testHelper.commonUserPostRequest(teacher, '', newNotification);
            res.status.should.be.equal(400);
            res.body.name.should.be.equal('ParamRequiredError');
        }));
        it('should create notifications for students with the corresponding settings', () => __awaiter(this, void 0, void 0, function* () {
            const { course, teacher, newNotification } = yield preparePostChangedCourseSetup();
            const res = yield testHelper.commonUserPostRequest(teacher, '', newNotification);
            res.status.should.be.equal(200);
            should.equal(yield Notification_1.Notification.countDocuments({ changedCourse: course }), course.students.length, 'Notification count mismatch');
        }));
        it('should not create notifications when the course is inactive', () => __awaiter(this, void 0, void 0, function* () {
            const { course, teacher, newNotification } = yield preparePostChangedCourseSetup(false);
            const res = yield testHelper.commonUserPostRequest(teacher, '', newNotification);
            res.status.should.be.equal(200);
            should.equal(yield Notification_1.Notification.countDocuments({ changedCourse: course }), 0, 'Notification count mismatch');
        }));
        it('should forbid notification creation for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const { course, newNotification } = yield preparePostChangedCourseSetup();
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const res = yield testHelper.commonUserPostRequest(unauthorizedTeacher, '', newNotification);
            res.status.should.be.equal(403);
        }));
        addCommonPostTests(urlPostfixAssembler);
    }));
    describe(`POST ${BASE_URL} user :id`, () => __awaiter(this, void 0, void 0, function* () {
        /**
         * For the PostNotification route this will use the given student to return /user/${student._id}.
         */
        function urlPostfixAssembler(student) {
            return `/user/${student._id}`;
        }
        function changedCourseSuccessTest({ course, teacher, student, newNotification }, expectedCount = 1) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield testHelper.commonUserPostRequest(teacher, `/user/${student._id}`, newNotification);
                res.status.should.be.equal(200);
                should.equal(yield Notification_1.Notification.countDocuments({ changedCourse: course }), expectedCount, 'Notification count mismatch');
            });
        }
        it('should fail if required parameters are omitted', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher } = yield preparePostSetup();
            const res = yield testHelper.commonUserPostRequest(teacher, '/user/507f191e810c19729de860ea', {});
            res.status.should.be.equal(400);
            res.body.name.should.be.equal('ParamRequiredError');
        }));
        it('should fail if user not given', () => __awaiter(this, void 0, void 0, function* () {
            const { course, teacher } = yield preparePostSetup();
            const newNotification = {
                targetId: course.id,
                targetType: 'course',
                text: 'test text'
            };
            const res = yield testHelper.commonUserPostRequest(teacher, '/user/507f191e810c19729de860ea', newNotification);
            res.status.should.be.equal(404);
            res.body.message.should.be.equal(errorCodes_1.errorCodes.notification.targetUserNotFound.text);
        }));
        it('should create notifications for a student, with course-targetType & text', () => __awaiter(this, void 0, void 0, function* () {
            yield changedCourseSuccessTest(yield preparePostChangedCourseSetup());
        }));
        it('should create notifications for a student, with course-targetType & text, setting API_NOTIFICATION_TYPE_ALL_CHANGES', () => __awaiter(this, void 0, void 0, function* () {
            const setup = yield preparePostChangedCourseSetup();
            yield new NotificationSettings_1.NotificationSettings({
                user: setup.student,
                course: setup.course,
                notificationType: NotificationSettings_1.API_NOTIFICATION_TYPE_ALL_CHANGES,
                emailNotification: true
            }).save();
            yield changedCourseSuccessTest(setup);
        }));
        it('should create notifications for a student, with lecture-targetType & text', () => __awaiter(this, void 0, void 0, function* () {
            const { course, student, teacher } = yield preparePostChangedCourseSetup();
            const lectureId = (yield FixtureUtils_1.FixtureUtils.getRandomLectureFromCourse(course))._id;
            const lecture = yield Lecture_1.Lecture.findById(lectureId);
            lecture.name = 'New test name';
            yield lecture.save();
            const newNotification = {
                targetId: lecture.id,
                targetType: 'lecture',
                text: 'test text'
            };
            yield changedCourseSuccessTest({ course, student, teacher, newNotification });
        }));
        it('should create notifications for a student, with unit-targetType & text', () => __awaiter(this, void 0, void 0, function* () {
            const { course, student, teacher } = yield preparePostChangedCourseSetup();
            const lecture = yield FixtureUtils_1.FixtureUtils.getRandomLectureFromCourse(course);
            const unit = yield FixtureUtils_1.FixtureUtils.getRandomUnitFromLecture(lecture);
            unit.visible = true;
            yield unit.save();
            const newNotification = {
                targetId: unit.id,
                targetType: 'unit',
                text: 'test text'
            };
            yield changedCourseSuccessTest({ course, student, teacher, newNotification });
        }));
        it('should create no notifications for a student, with unit-targetType & text, if the unit is invisible', () => __awaiter(this, void 0, void 0, function* () {
            const { course, student, teacher } = yield preparePostChangedCourseSetup();
            const lecture = yield FixtureUtils_1.FixtureUtils.getRandomLectureFromCourse(course);
            const unit = yield FixtureUtils_1.FixtureUtils.getRandomUnitFromLecture(lecture);
            unit.visible = false;
            yield unit.save();
            const newNotification = {
                targetId: unit.id,
                targetType: 'unit',
                text: 'test text'
            };
            yield changedCourseSuccessTest({ course, student, teacher, newNotification }, 0);
        }));
        it('should create notifications for a student, with course-targetType & text, setting API_NOTIFICATION_TYPE_NONE', () => __awaiter(this, void 0, void 0, function* () {
            const setup = yield preparePostChangedCourseSetup();
            yield new NotificationSettings_1.NotificationSettings({
                user: setup.student,
                course: setup.course,
                notificationType: NotificationSettings_1.API_NOTIFICATION_TYPE_NONE,
                emailNotification: false
            }).save();
            yield changedCourseSuccessTest(setup);
        }));
        it('should create notifications for a student, with text only', () => __awaiter(this, void 0, void 0, function* () {
            const { student, teacher } = yield preparePostSetup();
            const newNotification = {
                targetType: 'text',
                text: 'test text'
            };
            const res = yield testHelper.commonUserPostRequest(teacher, `/user/${student._id}`, newNotification);
            res.status.should.be.equal(200);
            should.equal(yield Notification_1.Notification.countDocuments({ user: student._id }), 1, 'Notification count mismatch');
        }));
        it('should respond with 400 for requesting text only targetType without text', () => __awaiter(this, void 0, void 0, function* () {
            const { student, teacher } = yield preparePostSetup();
            const newNotification = {
                targetType: 'text'
            };
            const res = yield testHelper.commonUserPostRequest(teacher, `/user/${student._id}`, newNotification);
            res.status.should.be.equal(400);
            res.body.message.should.be.equal(errorCodes_1.errorCodes.notification.textOnlyWithoutText.text);
        }));
        it('should forbid notification creation for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const { course, student, newNotification } = yield preparePostChangedCourseSetup();
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const res = yield testHelper.commonUserPostRequest(unauthorizedTeacher, `/user/${student._id}`, newNotification);
            res.status.should.be.equal(403);
        }));
        addCommonPostTests(urlPostfixAssembler);
    }));
    describe(`GET ${BASE_URL} user :id`, () => {
        it('should return all notifications for one user', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const student = yield User_1.User.findById(course.students[0]);
            yield new Notification_1.Notification({
                user: student,
                changedCourse: course,
                text: 'Tritratrulala'
            }).save();
            const res = yield testHelper.commonUserGetRequest(student, '');
            res.status.should.be.equal(200);
            res.body.forEach((notification) => {
                notification._id.should.be.a('string');
                notification.text.should.be.a('string');
            });
        }));
    });
    describe(`DELETE ${BASE_URL} :id`, () => {
        it('should delete a notification', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const students = yield FixtureUtils_1.FixtureUtils.getRandomStudents(2, 5);
            course.students = course.students.concat(students);
            yield course.save();
            const newNotification = yield new Notification_1.Notification({
                user: students[0],
                changedCourse: course,
                text: 'Tritratrulala'
            }).save();
            const res = yield testHelper.commonUserDeleteRequest(students[0], `/${newNotification._id}`);
            res.status.should.be.equal(200);
            const deletedNotification = yield Notification_1.Notification.findById(newNotification._id);
            should.not.exist(deletedNotification, 'Notification does still exist');
        }));
        it('should respond with 404 for a notification id that doesn\'t belong to the user', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const students = yield FixtureUtils_1.FixtureUtils.getRandomStudents(2, 5);
            const newNotification = yield new Notification_1.Notification({
                user: students[0],
                changedCourse: course,
                text: 'Tritratrulala'
            }).save();
            const res = yield testHelper.commonUserDeleteRequest(students[1], `/${newNotification._id}`);
            res.status.should.be.equal(404);
        }));
    });
}));

//# sourceMappingURL=../../maps/test/controllers/TestNotificationController.js.map
