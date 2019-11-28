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
const Course_1 = require("../../src/models/Course");
const FixtureUtils_1 = require("../../fixtures/FixtureUtils");
const chaiHttp = require("chai-http");
const fs_1 = require("fs");
const BreakpointSize_1 = require("../../src/models/BreakpointSize");
const File_1 = require("../../src/models/mediaManager/File");
chai.use(chaiHttp);
const should = chai.should();
const app = new server_1.Server().app;
const BASE_URL = '/api/courses';
const fixtureLoader = new FixtureLoader_1.FixtureLoader();
describe('Course', () => {
    // Before each test we reset the database
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield fixtureLoader.load();
    }));
    describe(`GET ${BASE_URL}`, () => {
        it('should return all active courses', () => __awaiter(this, void 0, void 0, function* () {
            const courses = yield Course_1.Course.find({ active: true });
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const res = yield chai.request(app)
                .get(BASE_URL)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(student)}`);
            res.status.should.be.equal(200);
            res.body.should.be.a('array');
            res.body.length.should.be.eql(courses.length);
            res.body.forEach((course) => {
                course._id.should.be.a('string');
                course.name.should.be.a('string');
                course.active.should.be.a('boolean');
                course.active.should.be.equal(true);
            });
        }));
        it('should return all courses', () => __awaiter(this, void 0, void 0, function* () {
            const courses = yield Course_1.Course.find();
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const res = yield chai.request(app)
                .get(BASE_URL)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`);
            res.status.should.be.equal(200);
            res.body.should.be.a('array');
            res.body.length.should.be.eql(courses.length);
            res.body.forEach((course) => {
                course._id.should.be.a('string');
                course.name.should.be.a('string');
                course.active.should.be.a('boolean');
                course.active.should.be.oneOf([true, false]);
            });
        }));
        it('should fail with wrong authorization', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .get(BASE_URL)
                .set('Authorization', 'JWT asdf')
                .catch(err => err.response);
            res.status.should.be.equal(401);
        }));
        it('should have a course fixture with "accesskey" enrollType', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findOne({ enrollType: 'accesskey' });
            should.exist(course);
        }));
        it('should not leak access keys to students', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const res = yield chai.request(app)
                .get(BASE_URL)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(student)}`);
            res.status.should.be.equal(200);
            res.body.forEach((course) => {
                should.equal(course.accessKey, undefined);
            });
        }));
    });
    describe(`POST ${BASE_URL}`, () => {
        it('should add a new course', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const testData = {
                name: 'Test Course',
                description: 'Test description'
            };
            const res = yield chai.request(app)
                .post(BASE_URL)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                .send(testData);
            res.status.should.be.equal(200);
            res.body.name.should.equal(testData.name);
            res.body.description.should.equal(testData.description);
        }));
    });
    describe(`GET ${BASE_URL} :id`, () => {
        function prepareTestCourse() {
            return __awaiter(this, void 0, void 0, function* () {
                const teachers = yield FixtureUtils_1.FixtureUtils.getRandomTeachers(2, 2);
                const teacher = teachers[0];
                const unauthorizedTeacher = teachers[1];
                const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
                const testData = new Course_1.Course({
                    name: 'Test Course',
                    description: 'Test description',
                    active: true,
                    courseAdmin: teacher,
                    teachers: [teacher],
                    enrollType: 'accesskey',
                    accessKey: 'accessKey1234',
                    freeTextStyle: 'theme1',
                    students: [student]
                });
                const savedCourse = yield testData.save();
                return { teacher, unauthorizedTeacher, student, testData, savedCourse };
            });
        }
        function testUnauthorizedGetCourseEdit(savedCourse, user) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield chai.request(app)
                    .get(`${BASE_URL}/${savedCourse._id}/edit`)
                    .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(user)}`);
                res.should.not.have.status(200);
                return res;
            });
        }
        function assertUserCourseViewEquality(actual, expected) {
            actual._id.should.be.equal(expected._id.toString());
            actual.profile.firstName.should.be.equal(expected.profile.firstName);
            actual.profile.lastName.should.be.equal(expected.profile.lastName);
            actual.email.should.be.equal(expected.email);
        }
        it('should get view info for course with given id', () => __awaiter(this, void 0, void 0, function* () {
            const { student, testData, savedCourse } = yield prepareTestCourse();
            const res = yield chai.request(app)
                .get(`${BASE_URL}/${savedCourse._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(student)}`);
            res.should.have.status(200);
            const body = res.body;
            body.name.should.be.equal(testData.name);
            body.description.should.be.equal(testData.description);
            assertUserCourseViewEquality(body.courseAdmin, testData.courseAdmin);
            for (const [index, actual] of body.teachers.entries()) {
                assertUserCourseViewEquality(actual, testData.teachers[index]);
            }
            should.equal(res.body.accessKey, undefined);
        }));
        it('should get edit info for course with given id', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, testData, savedCourse } = yield prepareTestCourse();
            const res = yield chai.request(app)
                .get(`${BASE_URL}/${savedCourse._id}/edit`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`);
            res.should.have.status(200);
            const body = res.body;
            body.name.should.be.equal(testData.name);
            body.description.should.be.equal(testData.description);
            body.active.should.be.equal(testData.active);
            body.enrollType.should.be.equal(testData.enrollType);
            body.accessKey.should.be.equal(testData.accessKey);
            body.freeTextStyle.should.be.equal(testData.freeTextStyle);
        }));
        it('should not get edit info for course as student', () => __awaiter(this, void 0, void 0, function* () {
            const { savedCourse, student } = yield prepareTestCourse();
            const res = yield testUnauthorizedGetCourseEdit(savedCourse, student);
            res.body.name.should.be.equal('AccessDeniedError');
            res.body.should.have.property('message');
            res.body.should.have.property('stack');
        }));
        it('should not get edit info for course as unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const { savedCourse, unauthorizedTeacher } = yield prepareTestCourse();
            const res = yield testUnauthorizedGetCourseEdit(savedCourse, unauthorizedTeacher);
            res.body.name.should.be.oneOf(['NotFoundError', 'ForbiddenError']);
            res.body.should.have.property('stack');
        }));
        it('should not get course not a teacher of course', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeachers(2, 2);
            const testData = new Course_1.Course({
                name: 'Test Course',
                description: 'Test description',
                active: true,
                courseAdmin: teacher[0]._id
            });
            const savedCourse = yield testData.save();
            const res = yield chai.request(app)
                .get(`${BASE_URL}/${savedCourse._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher[1])}`)
                .catch(err => err.response);
            res.should.have.status(404);
        }));
    });
    describe(`PUT ${BASE_URL} :id`, () => {
        it('change added course', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const testDataUpdate = new Course_1.Course({
                name: 'Test Course Update',
                description: 'Test description update',
                active: true,
                courseAdmin: teacher._id,
                freeTextStyle: 'theme1'
            });
            const testData = new Course_1.Course({
                name: 'Test Course',
                description: 'Test description',
                active: false,
                courseAdmin: teacher._id
            });
            const savedCourse = yield testData.save();
            testDataUpdate._id = savedCourse._id;
            let res = yield chai.request(app)
                .put(`${BASE_URL}/${testDataUpdate._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                .send(testDataUpdate);
            res.should.have.status(200);
            res.body.name.should.be.eq(testDataUpdate.name);
            res.body._id.should.be.eq(testDataUpdate.id);
            res = yield chai.request(app)
                .get(`${BASE_URL}/${res.body._id}/edit`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`);
            res.should.have.status(200);
            res.body.name.should.be.eq(testDataUpdate.name);
            res.body.description.should.be.eq(testDataUpdate.description);
            res.body.active.should.be.eq(testDataUpdate.active);
            res.body.freeTextStyle.should.be.eq(testDataUpdate.freeTextStyle);
        }));
        it('should not change course not a teacher of course', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const testData = new Course_1.Course({
                name: 'Test Course',
                description: 'Test description',
                active: false
            });
            const savedCourse = yield testData.save();
            const res = yield chai.request(app)
                .put(`${BASE_URL}/${savedCourse._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                .send(savedCourse)
                .catch(err => err.response);
            res.should.have.status(404);
        }));
    });
    describe(`POST PICTURE ${BASE_URL}`, () => {
        it('should update the course image', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const courseAdmin = yield User_1.User.findOne({ _id: course.courseAdmin });
            const res = yield chai.request(app)
                .post(`${BASE_URL}/picture/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .attach('file', fs_1.readFileSync('test/resources/test.png'), 'test.png')
                .field('imageData', JSON.stringify({ breakpoints: [{ screenSize: BreakpointSize_1.BreakpointSize.MOBILE, imageSize: { width: 284, height: 190 } }] }));
            res.should.have.status(200);
            res.body.breakpoints.length.should.be.eq(1);
        }));
        it('should update the course image with only the width set', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const courseAdmin = yield User_1.User.findOne({ _id: course.courseAdmin });
            const res = yield chai.request(app)
                .post(`${BASE_URL}/picture/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .attach('file', fs_1.readFileSync('test/resources/test.png'), 'test.png')
                .field('imageData', JSON.stringify({ breakpoints: [{ screenSize: BreakpointSize_1.BreakpointSize.MOBILE, imageSize: { width: 284 } }] }));
            res.should.have.status(200);
            res.body.breakpoints.length.should.be.eq(1);
        }));
        it('should update the course image with only the height set', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const courseAdmin = yield User_1.User.findOne({ _id: course.courseAdmin });
            const res = yield chai.request(app)
                .post(`${BASE_URL}/picture/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .attach('file', fs_1.readFileSync('test/resources/test.png'), 'test.png')
                .field('imageData', JSON.stringify({ breakpoints: [{ screenSize: BreakpointSize_1.BreakpointSize.MOBILE, imageSize: { height: 190 } }] }));
            res.should.have.status(200);
            res.body.breakpoints.length.should.be.eq(1);
        }));
        it('should not update the course image (wrong file type)', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const courseAdmin = yield User_1.User.findOne({ _id: course.courseAdmin });
            const res = yield chai.request(app)
                .post(`${BASE_URL}/picture/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .attach('file', fs_1.readFileSync('test/resources/wrong-format.rtf'), 'test.rtf')
                .field('imageData', JSON.stringify({ breakpoints: [{ screenSize: BreakpointSize_1.BreakpointSize.MOBILE, imageSize: { width: 284, height: 190 } }] }));
            res.should.not.have.status(200);
        }));
        it('should update course image when old picture object missing', () => __awaiter(this, void 0, void 0, function* () {
            // https://github.com/geli-lms/geli/issues/1053
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const courseAdmin = yield User_1.User.findOne({ _id: course.courseAdmin });
            const resAddCourseImage = yield chai.request(app)
                .post(`${BASE_URL}/picture/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .attach('file', fs_1.readFileSync('test/resources/test.png'), 'test.png')
                .field('imageData', JSON.stringify({
                breakpoints: [{ screenSize: BreakpointSize_1.BreakpointSize.MOBILE, imageSize: { width: 284, height: 190 } }]
            }));
            resAddCourseImage.should.have.status(200);
            resAddCourseImage.body.breakpoints.length.should.be.eq(1);
            // delete picture object without api
            yield File_1.Picture.findByIdAndDelete(resAddCourseImage.body._id);
            const resAddAnotherCourseImage = yield chai.request(app)
                .post(`${BASE_URL}/picture/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .attach('file', fs_1.readFileSync('test/resources/test.png'), 'test.png')
                .field('imageData', JSON.stringify({ breakpoints: [{ screenSize: BreakpointSize_1.BreakpointSize.MOBILE, imageSize: { width: 284, height: 190 } }] }));
            resAddAnotherCourseImage.should.have.status(200);
            resAddAnotherCourseImage.body.breakpoints.length.should.be.eq(1);
        }));
        it('should not update course image when user not authorized', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const res = yield chai.request(app)
                .post(`${BASE_URL}/picture/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(unauthorizedTeacher)}`)
                .attach('file', fs_1.readFileSync('test/resources/test.png'), 'test.png')
                .field('imageData', JSON.stringify({
                breakpoints: [{ screenSize: BreakpointSize_1.BreakpointSize.MOBILE, imageSize: { width: 284, height: 190 } }]
            }));
            res.should.not.have.status(200);
        }));
    });
    describe(`DELETE PICTURE ${BASE_URL}`, () => {
        it('should update and remove the course image', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const courseAdmin = yield User_1.User.findOne({ _id: course.courseAdmin });
            let res = yield chai.request(app)
                .post(`${BASE_URL}/picture/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .attach('file', fs_1.readFileSync('test/resources/test.png'), 'test.png')
                .field('imageData', JSON.stringify({
                breakpoints: [{ screenSize: BreakpointSize_1.BreakpointSize.MOBILE, imageSize: { width: 284, height: 190 } }]
            }));
            res.should.have.status(200);
            res.body.breakpoints.length.should.be.eq(1);
            res = yield chai.request(app)
                .del(`${BASE_URL}/picture/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .send();
            res.should.have.status(200);
            const updatedCourse = yield Course_1.Course.findById(course._id);
            should.not.exist(updatedCourse.image);
        }));
        it('should remove course image when picture object missing', () => __awaiter(this, void 0, void 0, function* () {
            // https://github.com/geli-lms/geli/issues/1053
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const courseAdmin = yield User_1.User.findOne({ _id: course.courseAdmin });
            const resAddCourseImage = yield chai.request(app)
                .post(`${BASE_URL}/picture/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .attach('file', fs_1.readFileSync('test/resources/test.png'), 'test.png')
                .field('imageData', JSON.stringify({
                breakpoints: [{ screenSize: BreakpointSize_1.BreakpointSize.MOBILE, imageSize: { width: 284, height: 190 } }]
            }));
            resAddCourseImage.should.have.status(200);
            resAddCourseImage.body.breakpoints.length.should.be.eq(1);
            // delete picture object without api
            yield File_1.Picture.findByIdAndDelete(resAddCourseImage.body._id);
            const resDeleteCourseImage = yield chai.request(app)
                .del(`${BASE_URL}/picture/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .send();
            resDeleteCourseImage.should.have.status(200);
            const updatedCourse = yield Course_1.Course.findById(course._id);
            should.not.exist(updatedCourse.image);
        }));
        it('should not delete course image when user not authorized', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const res = yield chai.request(app)
                .del(`${BASE_URL}/picture/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(unauthorizedTeacher)}`)
                .send();
            res.should.not.have.status(200);
        }));
    });
    describe(`DELETE ${BASE_URL}`, () => {
        it('should delete the Course', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const courseAdmin = yield User_1.User.findOne({ _id: course.courseAdmin });
            const res = yield chai.request(app)
                .del(`${BASE_URL}/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`);
            res.status.should.be.equal(200);
            const deletedCourse = yield Course_1.Course.findById(course._id);
            should.not.exist(deletedCourse, 'Course does still exist');
        }));
        it('should fail because the user is not authorized', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const res = yield chai.request(app)
                .del(`${BASE_URL}/${course._id}`)
                .catch(err => err.response);
            res.status.should.be.equal(401);
        }));
        it('should fail because the teacher is not in the course', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const allTeachersAndAdmins = course.teachers;
            allTeachersAndAdmins.push(course.courseAdmin);
            const user = yield User_1.User.findOne({
                $and: [
                    { role: 'teacher' },
                    { _id: { $nin: allTeachersAndAdmins } }
                ]
            });
            const res = yield chai.request(app)
                .del(`${BASE_URL}/${course._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(user)}`)
                .catch(err => err.response);
            res.status.should.be.equal(403);
        }));
    });
});

//# sourceMappingURL=../../maps/test/integration/course.js.map
