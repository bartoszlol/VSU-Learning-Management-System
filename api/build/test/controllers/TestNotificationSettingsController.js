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
const NotificationSettings_1 = require("../../src/models/NotificationSettings");
chai.use(chaiHttp);
const BASE_URL = '/api/notificationSettings';
const testHelper = new TestHelper_1.TestHelper(BASE_URL);
describe('NotificationSettings', () => __awaiter(this, void 0, void 0, function* () {
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield testHelper.resetForNextTest();
    }));
    describe(`GET ${BASE_URL}`, () => {
        it('should return all notification settings for a student', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const course1 = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const course2 = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            course1.students.push(student);
            course2.students.push(student);
            yield course1.save();
            yield course2.save();
            yield new NotificationSettings_1.NotificationSettings({
                'user': student, 'course': course1,
                'notificationType': NotificationSettings_1.API_NOTIFICATION_TYPE_ALL_CHANGES, 'emailNotification': false
            }).save();
            yield new NotificationSettings_1.NotificationSettings({
                'user': student, 'course': course2,
                'notificationType': NotificationSettings_1.API_NOTIFICATION_TYPE_ALL_CHANGES, 'emailNotification': false
            }).save();
            const res = yield testHelper.commonUserGetRequest(student, '');
            res.should.have.status(200);
            res.body.forEach((notificationSettings) => {
                notificationSettings.course.should.be.a('string');
                notificationSettings.notificationType.should.be.a('string');
                notificationSettings.emailNotification.should.be.a('boolean');
            });
        }));
    });
    describe(`PUT ${BASE_URL}`, () => {
        function putTestRequest(user, courseId, notificationType = NotificationSettings_1.API_NOTIFICATION_TYPE_ALL_CHANGES, emailNotification = false) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield testHelper.commonUserPutRequest(user, '', {
                    course: courseId,
                    notificationType,
                    emailNotification
                });
            });
        }
        it('should create & update notification settings', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            course.active = true;
            course.students.push(student);
            yield course.save();
            for (const emailNotification of [false, true]) {
                for (const notificationType of [NotificationSettings_1.API_NOTIFICATION_TYPE_NONE, NotificationSettings_1.API_NOTIFICATION_TYPE_ALL_CHANGES]) {
                    const res = yield putTestRequest(student, course.id, notificationType, emailNotification);
                    res.should.have.status(200);
                    const settings = yield NotificationSettings_1.NotificationSettings.findOne({ user: student._id, course });
                    settings.notificationType.should.be.equal(notificationType);
                    settings.emailNotification.should.be.equal(emailNotification);
                }
            }
        }));
        it('should fail with missing parameters', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const res = yield testHelper.commonUserPutRequest(student, '', {});
            res.should.have.status(400);
        }));
        it('should be forbidden for an unauthorized user/course pair', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const teacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const res = yield putTestRequest(teacher, course.id);
            res.should.have.status(403);
        }));
        it('should fail for a non-existent course id', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const res = yield putTestRequest(student, '000000000000000000000000');
            res.should.have.status(404);
        }));
    });
}));

//# sourceMappingURL=../../maps/test/controllers/TestNotificationSettingsController.js.map
