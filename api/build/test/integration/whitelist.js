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
const TestHelper_1 = require("../TestHelper");
const User_1 = require("../../src/models/User");
const WhitelistUser_1 = require("../../src/models/WhitelistUser");
const FixtureUtils_1 = require("../../fixtures/FixtureUtils");
const Course_1 = require("../../src/models/Course");
const app = new server_1.Server().app;
const BASE_URL = '/api/whitelist';
const testHelper = new TestHelper_1.TestHelper(BASE_URL);
describe('Whitelist', () => {
    beforeEach(() => testHelper.resetForNextTest());
    describe(`GET ${BASE_URL}`, () => {
        it('should get a whitelist user', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
            const newWhitelistUser = new WhitelistUser_1.WhitelistUser({
                firstName: 'Max',
                lastName: 'Mustermann',
                uid: '123456',
                courseId: course._id
            });
            const createdWhitelistUser = yield WhitelistUser_1.WhitelistUser.create(newWhitelistUser);
            const res = yield testHelper.commonUserGetRequest(teacher, `/${createdWhitelistUser._id.toString()}`);
            res.status.should.be.equal(200);
            res.body.firstName.should.be.equal(newWhitelistUser.firstName);
            res.body.lastName.should.be.equal(newWhitelistUser.lastName);
            res.body.uid.should.be.equal(newWhitelistUser.uid);
        }));
        it('should deny access to whitelist user data for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const teacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const newWhitelistUser = new WhitelistUser_1.WhitelistUser({
                firstName: 'Max',
                lastName: 'Mustermann',
                uid: '123456',
                courseId: course._id
            });
            const createdWhitelistUser = yield WhitelistUser_1.WhitelistUser.create(newWhitelistUser);
            const res = yield testHelper.commonUserGetRequest(teacher, `/${createdWhitelistUser._id.toString()}`);
            res.status.should.be.equal(403);
        }));
        it('should deny access to whitelist user data for a student', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const student = yield User_1.User.findById(course.students[0]);
            const newWhitelistUser = new WhitelistUser_1.WhitelistUser({
                firstName: 'Max',
                lastName: 'Mustermann',
                uid: '123456',
                courseId: course._id
            });
            const createdWhitelistUser = yield WhitelistUser_1.WhitelistUser.create(newWhitelistUser);
            const res = yield testHelper.commonUserGetRequest(student, `/${createdWhitelistUser._id.toString()}`);
            res.status.should.be.equal(403);
        }));
    });
    describe(`POST ${BASE_URL}`, () => {
        it('should create a new whitelist user', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const whitelistUser = {
                firstName: 'Max',
                lastName: 'Mustermann',
                uid: '1236456',
                courseId: course._id
            };
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
            const res = yield testHelper.commonUserPostRequest(teacher, '', whitelistUser);
            res.status.should.be.equal(200);
            res.body.firstName.should.be.equal(whitelistUser.firstName.toLowerCase());
            res.body.lastName.should.be.equal(whitelistUser.lastName.toLowerCase());
            res.body.uid.should.be.equal(whitelistUser.uid.toLowerCase());
        }));
        it('should fail with wrong authorization', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const whitelistUser = {
                firstName: 'Max',
                lastName: 'Mustermann',
                uid: '1236456',
                courseId: course._id
            };
            const res = yield chai.request(app)
                .post(`${BASE_URL}/`)
                .set('Cookie', `token=awf`)
                .send(whitelistUser)
                .catch(err => err.response);
            res.status.should.be.equal(401);
        }));
        it('should add an user by synchronizing', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
            const user = yield User_1.User.create({ uid: '1236456',
                password: 'test1234',
                email: 'test@ok.com',
                profile: {
                    firstName: 'Max',
                    lastName: 'Mustermann'
                } });
            const whitelistUser = {
                firstName: user.profile.firstName,
                lastName: user.profile.lastName,
                uid: user.uid,
                courseId: course._id
            };
            const res = yield testHelper.commonUserPostRequest(teacher, '', whitelistUser);
            res.status.should.be.equal(200);
            const resCourse = yield Course_1.Course.findById(course._id).populate('students');
            const addedUsers = resCourse.students.filter(stud => stud.uid === user.uid);
            addedUsers.length.should.be.not.eq(0);
            addedUsers[0].uid.should.be.eq(whitelistUser.uid);
            addedUsers[0].profile.firstName.should.be.eq(whitelistUser.firstName);
            addedUsers[0].profile.lastName.should.be.eq(whitelistUser.lastName);
        }));
        it('should fail to create a new whitelist user for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const whitelistUser = {
                firstName: 'Max',
                lastName: 'Mustermann',
                uid: '1236456',
                courseId: course._id
            };
            const teacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const res = yield testHelper.commonUserPostRequest(teacher, '', whitelistUser);
            res.status.should.be.equal(403);
        }));
    });
    // The corresponding route has been disabled since it appears to be unused and insufficiently secured.
    /*
    describe(`PUT ${BASE_URL}`, () => {
      it('should update a whitelist user', async () => {
        const teacher = await FixtureUtils.getRandomTeacher();
        const course: ICourse = await FixtureUtils.getRandomCourse();
        const newWhitelistUser: IWhitelistUser = new WhitelistUser({
          firstName: 'Max',
          lastName: 'Mustermann',
          uid: '123456',
          courseId: course._id
        });
        const createdWhitelistUser = await WhitelistUser.create(newWhitelistUser);
        const res = await testHelper.commonUserPutRequest(teacher, `/${createdWhitelistUser._id}`, createdWhitelistUser);
        res.status.should.be.equal(200);
        res.body.firstName.should.be.equal(newWhitelistUser.firstName);
        res.body.lastName.should.be.equal(newWhitelistUser.lastName);
        res.body.uid.should.be.equal(newWhitelistUser.uid);
      });
  
      it('should fail with wrong authorization', async () => {
        const course: ICourse = await FixtureUtils.getRandomCourse();
        const newWhitelistUser: IWhitelistUser = new WhitelistUser({
          firstName: 'Max',
          lastName: 'Mustermann',
          uid: '123456',
          courseId: course._id
        });
        const createdWhitelistUser = await WhitelistUser.create(newWhitelistUser);
        const res = await chai.request(app)
          .put(`${BASE_URL}/${createdWhitelistUser._id}`)
          .send(createdWhitelistUser)
          .set('Cookie', `token=awf`)
          .catch(err => err.response);
        res.status.should.be.equal(401);
      });
    });
    */
    describe(`DELETE ${BASE_URL}`, () => {
        it('should delete a whitelist user', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
            const newWhitelistUser = new WhitelistUser_1.WhitelistUser({
                firstName: 'Max',
                lastName: 'Mustermann',
                uid: '123456',
                courseId: course._id
            });
            const createdWhitelistUser = yield WhitelistUser_1.WhitelistUser.create(newWhitelistUser);
            const res = yield testHelper.commonUserDeleteRequest(teacher, `/${createdWhitelistUser._id}`);
            res.status.should.be.equal(200);
        }));
        it('should fail with wrong authorization', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const newWhitelistUser = new WhitelistUser_1.WhitelistUser({
                firstName: 'Max',
                lastName: 'Mustermann',
                uid: '123456',
                courseId: course._id
            });
            const createdWhitelistUser = yield WhitelistUser_1.WhitelistUser.create(newWhitelistUser);
            const res = yield chai.request(app)
                .del(`${BASE_URL}/${createdWhitelistUser._id}`)
                .set('Cookie', `token=awf`)
                .catch(err => err.response);
            res.status.should.be.equal(401);
        }));
        it('should delete an user by synchronizing', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
            const member = course.students[0];
            const newWhitelistUser = new WhitelistUser_1.WhitelistUser({
                firstName: member.profile.firstName,
                lastName: member.profile.lastName,
                uid: member.uid,
                courseId: course._id
            });
            const createdWhitelistUser = yield WhitelistUser_1.WhitelistUser.create(newWhitelistUser);
            course.whitelist = course.whitelist.concat(createdWhitelistUser);
            yield Course_1.Course.findByIdAndUpdate(course._id, course);
            const res = yield testHelper.commonUserDeleteRequest(teacher, `/${createdWhitelistUser._id}`);
            res.status.should.be.equal(200);
            const resCourse = yield Course_1.Course.findById(course._id).populate('students');
            const emptyUsers = resCourse.students.filter(stud => stud.uid === member.uid);
            emptyUsers.length.should.be.eq(0);
        }));
        it('should fail to delete for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const teacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const newWhitelistUser = new WhitelistUser_1.WhitelistUser({
                firstName: 'Max',
                lastName: 'Mustermann',
                uid: '123456',
                courseId: course._id
            });
            const createdWhitelistUser = yield WhitelistUser_1.WhitelistUser.create(newWhitelistUser);
            const res = yield testHelper.commonUserDeleteRequest(teacher, `/${createdWhitelistUser._id}`);
            res.status.should.be.equal(403);
        }));
    });
});

//# sourceMappingURL=../../maps/test/integration/whitelist.js.map
