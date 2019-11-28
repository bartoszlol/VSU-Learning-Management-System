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
const JwtUtils_1 = require("../../src/security/JwtUtils");
const User_1 = require("../../src/models/User");
const errorCodes_1 = require("../../src/config/errorCodes");
const FixtureUtils_1 = require("../../fixtures/FixtureUtils");
const roles_1 = require("../../src/config/roles");
const chaiHttp = require("chai-http");
const fs = require("fs");
chai.use(chaiHttp);
const should = chai.should();
const app = new server_1.Server().app;
const BASE_URL = '/api/users';
const ROLE_URL = BASE_URL + '/roles';
const Search_URL = BASE_URL + '/members/search';
const fixtureLoader = new FixtureLoader_1.FixtureLoader();
describe('User', () => {
    // Before each test we reset the database
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield fixtureLoader.load();
    }));
    describe(`GET ${BASE_URL}`, () => {
        it('should return all users', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const res = yield chai.request(app)
                .get(BASE_URL)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`);
            res.status.should.be.equal(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(yield FixtureUtils_1.FixtureUtils.getUserCount());
        }));
        it('should fail with wrong authorization', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .get(BASE_URL)
                .set('Authorization', 'JWT asdf')
                .catch(err => err.response);
            res.status.should.be.equal(401);
        }));
        it('should return the requested user object', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const res = yield chai.request(app)
                .get(`${BASE_URL}/${admin._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(admin)}`);
            res.status.should.be.equal(200);
            res.body._id.should.be.equal(admin._id.toString());
            res.body.email.should.be.equal(admin.email);
        }));
    });
    describe(`GET ${ROLE_URL}`, () => {
        it('should fail with permission denied', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const res = yield chai.request(app)
                .get(ROLE_URL)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(student)}`)
                .catch(err => err.response);
            res.status.should.be.equal(403);
        }));
        it('should return an array with the defined roles', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const res = yield chai.request(app)
                .get(ROLE_URL)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(admin)}`);
            res.status.should.be.equal(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(roles_1.allRoles.length);
            res.body.should.have.same.members(roles_1.allRoles);
        }));
    });
    describe(`GET ${Search_URL}`, () => {
        it('should search for a student', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const newUser = new User_1.User({
                uid: '487895',
                email: 'test@local.tv',
                password: 'test123456',
                profile: {
                    firstName: 'Max',
                    lastName: 'Mustermann'
                },
                role: 'student'
            });
            const createdUser = yield User_1.User.create(newUser);
            const res = yield chai.request(app)
                .get(Search_URL)
                .query({
                role: newUser.role,
                query: newUser.uid +
                    ' ' + newUser.email +
                    ' ' + newUser.profile.firstName +
                    ' ' + newUser.profile.lastName,
                limit: 1
            })
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`);
            res.status.should.be.equal(200);
            res.body.meta.count.should.be.greaterThan(0);
            res.body.users.length.should.be.greaterThan(0);
            res.body.users[0].profile.firstName.should.be.equal(newUser.profile.firstName);
            res.body.users[0].profile.firstName.should.be.equal(newUser.profile.firstName);
            res.body.users[0].uid.should.be.equal(newUser.uid);
            res.body.users[0].email.should.be.equal(newUser.email);
        }));
        it('should search for a teacher', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const newUser = new User_1.User({
                uid: '487895',
                email: 'test@local.tv',
                password: 'test123456',
                profile: {
                    firstName: 'Max',
                    lastName: 'Mustermann'
                },
                role: 'teacher'
            });
            const createdUser = yield User_1.User.create(newUser);
            const res = yield chai.request(app)
                .get(Search_URL)
                .query({
                role: 'teacher',
                query: newUser.uid +
                    ' ' + newUser.email +
                    ' ' + newUser.profile.firstName +
                    ' ' + newUser.profile.lastName
            })
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`);
            res.status.should.be.equal(200);
            res.body.meta.count.should.be.greaterThan(0);
            res.body.users.length.should.be.greaterThan(0);
            res.body.users[0].profile.firstName.should.be.equal(newUser.profile.firstName);
            res.body.users[0].profile.firstName.should.be.equal(newUser.profile.firstName);
            res.body.users[0].uid.should.be.equal(newUser.uid);
            res.body.users[0].email.should.be.equal(newUser.email);
        }));
    });
    describe(`PUT ${BASE_URL}`, () => {
        function requestUserUpdate(currentUser, updatedUser) {
            return chai.request(app)
                .put(`${BASE_URL}/${updatedUser._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(currentUser)}`)
                .send(updatedUser);
        }
        function requestUserUpdateAndCatch(currentUser, updatedUser) {
            return requestUserUpdate(currentUser, updatedUser).catch(err => err.response);
        }
        function assertFailure(res, status, name, message) {
            res.status.should.be.equal(status);
            res.body.name.should.be.equal(name);
            res.body.message.should.be.equal(message);
        }
        it('should fail with bad request (revoke own admin privileges)', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const updatedUser = admin;
            updatedUser.role = 'teacher';
            const res = yield requestUserUpdateAndCatch(admin, updatedUser);
            assertFailure(res, 400, 'BadRequestError', errorCodes_1.errorCodes.user.cantChangeOwnRole.text);
        }));
        it('should fail with bad request (email already in use)', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const updatedUser = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            updatedUser.email = admin.email;
            const res = yield requestUserUpdateAndCatch(admin, updatedUser);
            assertFailure(res, 400, 'BadRequestError', errorCodes_1.errorCodes.user.emailAlreadyInUse.text);
        }));
        // This test is disabled because there currently is no role beneath 'admin' that is allowed to edit other users.
        // Reactivate and adjust this test if such a role should become available in the future.
        // (Previously teachers had permission to change some parts of any student's profile.)
        /*
        it('should fail changing other user\'s uid with wrong authorization (not admin)', async () => {
          const teacher = await FixtureUtils.getRandomTeacher();
          const updatedUser = await FixtureUtils.getRandomStudent();
          updatedUser.uid = '987456';
    
          const res = await requestUserUpdateAndCatch(teacher, updatedUser);
          assertFailure(res, 403, 'ForbiddenError', errorCodes.user.onlyAdminsCanChangeUids.text);
        });
        */
        it('should fail changing other user\'s name with wrong authorization (low edit level)', () => __awaiter(this, void 0, void 0, function* () {
            const [student, updatedUser] = yield FixtureUtils_1.FixtureUtils.getRandomStudents(2, 2);
            updatedUser.profile.firstName = 'TEST';
            const res = yield requestUserUpdateAndCatch(student, updatedUser);
            assertFailure(res, 403, 'ForbiddenError', errorCodes_1.errorCodes.user.cantChangeUserWithHigherRole.text);
        }));
        it('should update user base data without password', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const updatedUser = student;
            updatedUser.password = undefined;
            updatedUser.profile.firstName = 'Updated';
            updatedUser.profile.lastName = 'User';
            updatedUser.email = 'student2@updated.local';
            const res = yield requestUserUpdate(student, updatedUser);
            res.status.should.be.equal(200);
            res.body.profile.firstName.should.be.equal('Updated');
            res.body.profile.lastName.should.be.equal('User');
            res.body.email.should.be.equal('student2@updated.local');
        }));
        it('should update user data', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const updatedUser = student;
            updatedUser.password = '';
            updatedUser.profile.firstName = 'Updated';
            updatedUser.profile.lastName = 'User';
            updatedUser.email = 'student1@updated.local';
            const res = yield requestUserUpdate(student, updatedUser);
            res.status.should.be.equal(200);
            res.body.profile.firstName.should.be.equal('Updated');
            res.body.profile.lastName.should.be.equal('User');
            res.body.email.should.be.equal('student1@updated.local');
        }));
        it('should update user base data without password', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const updatedUser = student;
            updatedUser.password = undefined;
            updatedUser.profile.firstName = 'Updated';
            updatedUser.profile.lastName = 'User';
            updatedUser.email = 'student@updated.local';
            const res = yield requestUserUpdate(student, updatedUser);
            res.status.should.be.equal(200);
            res.body.profile.firstName.should.be.equal('Updated');
            res.body.profile.lastName.should.be.equal('User');
            res.body.email.should.be.equal('student@updated.local');
        }));
        it('should keep a existing uid', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const origUid = student.uid;
            const updatedUser = student;
            updatedUser.uid = null;
            updatedUser.password = '';
            updatedUser.profile.firstName = 'Updated';
            updatedUser.profile.lastName = 'User';
            updatedUser.email = 'student@updated.local';
            const res = yield requestUserUpdate(admin, updatedUser);
            res.status.should.be.equal(200);
            res.body.uid.should.be.equal(origUid);
            res.body.profile.firstName.should.be.equal('Updated');
            res.body.profile.lastName.should.be.equal('User');
            res.body.email.should.be.equal('student@updated.local');
        }));
    });
    describe(`POST ${BASE_URL}/picture`, () => {
        function requestAddUserPicture(currentUser, targetUser) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield chai.request(app)
                    .post(`${BASE_URL}/picture/${targetUser._id}`)
                    .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(currentUser)}`)
                    .attach('file', fs.readFileSync('test/resources/test.png'), 'test.png');
            });
        }
        function assertSuccess(res) {
            res.status.should.be.equal(200);
            res.body.profile.picture.should.be.an('object');
            res.body.profile.picture.should.have.all.keys('alias', 'name', 'path');
            res.body.profile.picture.alias.should.be.equal('test.png');
        }
        it('should upload a new user picture', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const res = yield requestAddUserPicture(admin, admin);
            assertSuccess(res);
        }));
        it('should fail to upload a new picture for another user (as student)', () => __awaiter(this, void 0, void 0, function* () {
            const [student, targetUser] = yield FixtureUtils_1.FixtureUtils.getRandomStudents(2, 2);
            const res = yield requestAddUserPicture(student, targetUser);
            res.status.should.be.equal(403);
            res.body.name.should.be.equal('ForbiddenError');
            res.body.message.should.be.equal(errorCodes_1.errorCodes.user.cantChangeUserWithHigherRole.text);
        }));
        it('should upload a new picture for another user (as admin)', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const targetUser = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const res = yield requestAddUserPicture(admin, targetUser);
            assertSuccess(res);
        }));
        it('should block non images when uploading new user picture', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const res = yield chai.request(app)
                .post(`${BASE_URL}/picture/${admin._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(admin)}`)
                .attach('file', fs.readFileSync('test/resources/wrong-format.rtf'), 'wrong-format.txt');
            res.status.should.be.equal(403);
            res.body.name.should.be.equal('ForbiddenError');
        }));
    });
    describe(`DELETE ${BASE_URL}`, () => {
        function ensureOnlyOneAdmin() {
            return __awaiter(this, void 0, void 0, function* () {
                const admins = yield FixtureUtils_1.FixtureUtils.getRandomAdmins(1, 2);
                admins.length.should.be.eq(1);
                return admins[0];
            });
        }
        it('should fail to delete the only admin', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield ensureOnlyOneAdmin();
            const res = yield chai.request(app)
                .del(`${BASE_URL}/${admin._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(admin)}`)
                .catch(err => err.response);
            res.status.should.be.equal(400);
            res.body.name.should.be.equal('BadRequestError');
            res.body.message.should.be.equal(errorCodes_1.errorCodes.user.noOtherAdmins.text);
        }));
        it('should fail to delete another user, if not admin', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const studtent = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const res = yield chai.request(app)
                .del(`${BASE_URL}/${studtent._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                .catch(err => err.response);
            res.status.should.be.equal(400);
            res.body.name.should.be.equal('BadRequestError');
            res.body.message.should.be.equal(errorCodes_1.errorCodes.user.cantDeleteOtherUsers.text);
        }));
        it('should (promote a teacher to admin and) let the old admin delete itself', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield ensureOnlyOneAdmin();
            const promotedUser = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            { // Promote the teacher to admin
                promotedUser.role = 'admin';
                const res = yield chai.request(app)
                    .put(`${BASE_URL}/${promotedUser._id}`)
                    .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(admin)}`)
                    .send(promotedUser);
                res.status.should.be.equal(200);
                res.body.role.should.be.equal('admin');
            }
            { // Delete the old admin
                const res = yield chai.request(app)
                    .del(`${BASE_URL}/${admin._id}`)
                    .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(admin)}`);
                res.status.should.be.equal(200);
            }
        }));
        it('should send delete request', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const res = yield chai.request(app)
                .del(`${BASE_URL}/${teacher._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                .catch(err => err.response);
            const userDeleteRequest = User_1.User.findById(teacher._id);
            should.exist(userDeleteRequest, 'User doesnt exist anymore.');
            res.status.should.be.equal(200);
        }));
        it('should delete a student', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const res = yield chai.request(app)
                .del(`${BASE_URL}/${student._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(admin)}`);
            res.status.should.be.equal(200);
            res.body.result.should.be.equal(true);
        }));
    });
});

//# sourceMappingURL=../../maps/test/integration/user.js.map
