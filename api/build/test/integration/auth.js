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
const server_1 = require("../../src/server");
const FixtureLoader_1 = require("../../fixtures/FixtureLoader");
const errorCodes = require("../../src/config/errorCodes");
const WhitelistUser_1 = require("../../src/models/WhitelistUser");
const Course_1 = require("../../src/models/Course");
const FixtureUtils_1 = require("../../fixtures/FixtureUtils");
const RoleAuthorization_1 = require("../../src/security/RoleAuthorization");
const routing_controllers_1 = require("routing-controllers");
const chaiHttp = require("chai-http");
const main_1 = require("../../src/config/main");
chai.use(chaiHttp);
const should = chai.should();
const app = new server_1.Server().app;
const BASE_URL = '/api/auth';
const fixtureLoader = new FixtureLoader_1.FixtureLoader();
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
describe('Auth', () => {
    // Before each test we reset the database
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield fixtureLoader.load();
    }));
    describe('RoleAuthorization', () => {
        it('should handle missing jwtData by throwing UnauthorizedError', () => __awaiter(this, void 0, void 0, function* () {
            const invalidAction = { request: {}, response: {} };
            yield chai.expect(() => RoleAuthorization_1.RoleAuthorization.checkAuthorization(invalidAction, [])).to.throw(routing_controllers_1.UnauthorizedError);
        }));
        function accessTest(user, roles, expectedResult) {
            return __awaiter(this, void 0, void 0, function* () {
                const request = { jwtData: { tokenPayload: { _id: user._id } } };
                const action = { request, response: {} };
                chai.expect(yield RoleAuthorization_1.RoleAuthorization.checkAuthorization(action, roles)).to.equal(expectedResult);
            });
        }
        it('should allow access for a user with valid parameters', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            yield accessTest(student, ['student'], true);
        }));
        it('should deny access for a user with mismatching role', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            yield accessTest(student, ['teacher'], false);
        }));
    });
    describe(`POST ${BASE_URL}/login`, () => {
        it('should login as student', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .post(`${BASE_URL}/login`)
                .send({
                'email': 'student1@test.local',
                'password': 'test1234'
            });
            res.status.should.be.equal(200);
            res.body.user.email.should.be.equal('student1@test.local');
        }));
        it('should login as teacher', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .post(`${BASE_URL}/login`)
                .send({
                'email': 'teacher1@test.local',
                'password': 'test1234'
            });
            res.status.should.be.equal(200);
            res.body.user.email.should.be.equal('teacher1@test.local');
        }));
        it('should login as admin', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .post(`${BASE_URL}/login`)
                .send({
                'email': 'admin@test.local',
                'password': 'test1234'
            });
            res.status.should.be.equal(200);
            res.body.user.email.should.be.equal('admin@test.local');
        }));
        it('should fail with empty password', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .post(`${BASE_URL}/login`)
                .send({
                'email': 'student2@test.local',
                'password': ''
            });
            res.status.should.be.equal(400);
            res.error.text.should.be.equal('Bad Request');
        }));
        it('should fail without password property', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .post(`${BASE_URL}/login`)
                .send({
                'email': 'student2@test.local',
            });
            res.status.should.be.equal(400);
            res.error.text.should.be.equal('Bad Request');
        }));
        it('should fail when email not found', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .post(`${BASE_URL}/login`)
                .send({
                'email': 'invalid@test.local',
                'password': 'invalid',
            });
            res.status.should.be.equal(401);
        }));
        it('should fail when password wrong', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .post(`${BASE_URL}/login`)
                .send({
                'email': 'student3@test.local',
                'password': 'invalid',
            });
            res.status.should.be.equal(401);
        }));
        it('should fail credentials correct but not active', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .post(`${BASE_URL}/login`)
                .send({
                'email': 'student31@test.local',
                'password': 'test1234',
            });
            res.status.should.be.equal(401);
        }));
    });
    describe(`POST ${BASE_URL}/register`, () => {
        it('should fail (email address is already in use)', () => __awaiter(this, void 0, void 0, function* () {
            const user = yield FixtureUtils_1.FixtureUtils.getRandomUser();
            const registerUser = user;
            registerUser.uid = '99999999';
            const res = yield chai.request(app)
                .post(`${BASE_URL}/register`)
                .send(registerUser)
                .catch(err => err.response);
            res.status.should.be.equal(400);
            res.body.name.should.be.equal('BadRequestError');
            res.body.message.should.be.equal(errorCodes.errorCodes.mail.duplicate.code);
        }));
        it('should fail (register as teacher without teacher email)', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const registerUser = teacher;
            registerUser.email = 'teacher@student.local';
            const res = yield chai.request(app)
                .post(`${BASE_URL}/register`)
                .send(registerUser)
                .catch(err => err.response);
            res.status.should.be.equal(400);
            res.body.name.should.be.equal('BadRequestError');
            res.body.message.should.be.equal(errorCodes.errorCodes.mail.noTeacher.code);
        }));
        it('should fail (matriculation number is already in use)', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const registerUser = student;
            registerUser.email = 'student0815@neu.local';
            const res = yield chai.request(app)
                .post(`${BASE_URL}/register`)
                .send(registerUser)
                .catch(err => err.response);
            res.status.should.be.equal(400);
            res.body.name.should.be.equal('BadRequestError');
            res.body.message.should.be.equal(errorCodes.errorCodes.duplicateUid.code);
        }));
        it('should pass', () => __awaiter(this, void 0, void 0, function* () {
            const registerUser = {
                uid: '5468907',
                firstName: 'firstName',
                lastName: 'lastName',
                role: 'student',
                password: 'test1234',
                email: 'local@test.local.de'
            };
            const res = yield chai.request(app)
                .post(`${BASE_URL}/register`)
                .send(registerUser)
                .catch(err => err.response);
            res.status.should.be.equal(204);
        }));
        it('should pass and enroll into course', () => __awaiter(this, void 0, void 0, function* () {
            const registerUser = {
                uid: '5468907',
                firstName: 'firstName',
                lastName: 'lastName',
                role: 'student',
                password: 'test1234',
                email: 'local@test.local.de'
            };
            const whitelistUser = yield WhitelistUser_1.WhitelistUser.create({
                uid: registerUser.uid,
                firstName: registerUser.firstName,
                lastName: registerUser.lastName
            });
            const noElemCourse = yield Course_1.Course.create({
                name: 'Test Course 1',
                enrollType: 'whitelist',
                whitelist: []
            });
            const elemCourse = yield Course_1.Course.create({
                name: 'Test Course 2',
                enrollType: 'whitelist',
                whitelist: [whitelistUser]
            });
            const res = yield chai.request(app)
                .post(`${BASE_URL}/register`)
                .send(registerUser)
                .catch(err => err.response);
            res.status.should.be.equal(204);
            // Get updated Course.
            const resultNoElemCourse = yield Course_1.Course.findById(noElemCourse._id)
                .populate('whitelist')
                .populate('students');
            const resultElemCourse = yield Course_1.Course.findById(elemCourse._id)
                .populate('whitelist')
                .populate('students');
            resultNoElemCourse.whitelist.length.should.be.equal(0);
            resultNoElemCourse.students.length.should.be.equal(0);
            resultElemCourse.whitelist.length.should.be.equal(1);
            resultElemCourse.students.length.should.be.equal(1);
            resultElemCourse.whitelist[0].uid.should.be.equal(resultElemCourse.students[0].uid);
        }));
        it('should fail (registration as admin)', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const registerUser = teacher;
            registerUser.email = 'teacher0815@test.local';
            registerUser.role = 'admin';
            const res = yield chai.request(app)
                .post(`${BASE_URL}/register`)
                .send(registerUser)
                .catch(err => err.response);
            res.status.should.be.equal(400);
            res.body.name.should.be.equal('BadRequestError');
            res.body.message.should.be.equal('You can only sign up as student or teacher');
        }));
    });
    describe(`POST ${BASE_URL}/activationresend`, () => {
        it('should fail (user not found)', () => __awaiter(this, void 0, void 0, function* () {
            const user = yield FixtureUtils_1.FixtureUtils.getRandomUser();
            const resendActivationUser = user;
            resendActivationUser.uid = '99999999';
            const res = yield chai.request(app)
                .post(`${BASE_URL}/activationresend`)
                .send({
                'lastname': resendActivationUser.profile.lastName,
                'uid': resendActivationUser.uid,
                'email': resendActivationUser.email
            })
                .catch(err => err.response);
            res.status.should.be.equal(400);
            res.body.name.should.be.equal('BadRequestError');
            res.body.message.should.be.equal(errorCodes.errorCodes.user.userNotFound.code);
        }));
        it('should fail (user already activated)', () => __awaiter(this, void 0, void 0, function* () {
            const user = yield FixtureUtils_1.FixtureUtils.getRandomActiveStudent();
            const resendActivationUser = user;
            const res = yield chai.request(app)
                .post(`${BASE_URL}/activationresend`)
                .send({
                'lastname': resendActivationUser.profile.lastName,
                'uid': resendActivationUser.uid,
                'email': resendActivationUser.email
            })
                .catch(err => err.response);
            res.status.should.be.equal(400);
            res.body.name.should.be.equal('BadRequestError');
            res.body.message.should.be.equal(errorCodes.errorCodes.user.userAlreadyActive.code);
        }));
        // reduce timeTillNextActivationResendMin for testing to 15s
        main_1.default.timeTilNextActivationResendMin = 0.25;
        it('should fail (can only send every ' + main_1.default.timeTilNextActivationResendMin + ' min)', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomInactiveStudent();
            const resendActivationUser = student;
            const res = yield chai.request(app)
                .post(`${BASE_URL}/activationresend`)
                .send({
                'lastname': resendActivationUser.profile.lastName,
                'uid': resendActivationUser.uid,
                'email': resendActivationUser.email
            })
                .catch(err => err.response);
            res.status.should.be.equal(503);
            res.body.name.should.be.equal('HttpError');
            res.should.have.header('retry-after');
            res.body.message.should.be.equal(errorCodes.errorCodes.user.retryAfter.code);
        }));
        it('should fail (email already in use)', () => __awaiter(this, void 0, void 0, function* () {
            yield delay(Number(main_1.default.timeTilNextActivationResendMin) * 60000);
            const student = yield FixtureUtils_1.FixtureUtils.getRandomInactiveStudent();
            const resendActivationUser = student;
            const student2 = yield FixtureUtils_1.FixtureUtils.getRandomActiveStudent();
            const existingUser = student2;
            resendActivationUser.email = existingUser.email;
            const res = yield chai.request(app)
                .post(`${BASE_URL}/activationresend`)
                .send({
                'lastname': resendActivationUser.profile.lastName,
                'uid': resendActivationUser.uid,
                'email': resendActivationUser.email
            })
                .catch(err => err.response);
            res.status.should.be.equal(400);
            res.body.name.should.be.equal('BadRequestError');
            res.body.message.should.be.equal(errorCodes.errorCodes.mail.duplicate.code);
        })).timeout(Number(main_1.default.timeTilNextActivationResendMin) * 61000);
        it('should pass', () => __awaiter(this, void 0, void 0, function* () {
            yield delay(Number(main_1.default.timeTilNextActivationResendMin) * 60000);
            const student = yield FixtureUtils_1.FixtureUtils.getRandomInactiveStudent();
            const resendActivationUser = student;
            const res = yield chai.request(app)
                .post(`${BASE_URL}/activationresend`)
                .send({
                'lastname': resendActivationUser.profile.lastName,
                'uid': resendActivationUser.uid,
                'email': resendActivationUser.email
            })
                .catch(err => err.response);
            res.status.should.be.equal(204);
        })).timeout(Number(main_1.default.timeTilNextActivationResendMin) * 61000);
    });
});

//# sourceMappingURL=../../maps/test/integration/auth.js.map
