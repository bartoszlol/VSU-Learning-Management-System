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
const FixtureUtils_1 = require("../../fixtures/FixtureUtils");
const Lecture_1 = require("../../src/models/Lecture");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);
const should = chai.should();
const expect = chai.expect;
const app = new server_1.Server().app;
const BASE_URL = '/api/download';
const fixtureLoader = new FixtureLoader_1.FixtureLoader();
/**
 * Prepare test data
 * @param course
 */
function prepareTestData(course) {
    return __awaiter(this, void 0, void 0, function* () {
        const lectures = [];
        for (const lectureId of course.lectures) {
            const lecture = yield Lecture_1.Lecture.findById(lectureId);
            const units = [];
            for (const unitId of lecture.units) {
                units.push({ unitId });
            }
            lectures.push({ lectureId, units });
        }
        return {
            'courseName': course._id,
            'lectures': lectures
        };
    });
}
describe('DownloadFile', () => {
    // Before each test we reset the database
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield fixtureLoader.load();
    }));
    after(() => __awaiter(this, void 0, void 0, function* () {
        yield requestValidCleanup();
    }));
    function postValidRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            let unit = null;
            while (unit === null) {
                unit = yield FixtureUtils_1.FixtureUtils.getRandomUnit();
                if (unit.__t === 'assignment') {
                    unit = null;
                }
            }
            const lecture = yield FixtureUtils_1.FixtureUtils.getLectureFromUnit(unit);
            const course = yield FixtureUtils_1.FixtureUtils.getCourseFromLecture(lecture);
            const courseAdmin = yield User_1.User.findById(course.courseAdmin);
            const downloadRequestData = {
                courseName: course._id,
                lectures: [{ lectureId: lecture._id, units: [{ unitId: unit._id }] }]
            };
            const res = yield chai.request(app)
                .post(BASE_URL + '/pdf/single')
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .send(downloadRequestData)
                .catch(err => err.response);
            res.status.should.be.equal(200);
            return { postRes: res, courseAdmin };
        });
    }
    function requestCleanup(user) {
        return chai.request(app)
            .del(BASE_URL + '/cache')
            .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(user)}`)
            .catch(err => err.response);
    }
    function requestValidCleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const res = yield requestCleanup(admin);
            res.status.should.be.equal(200);
        });
    }
    describe(`GET ${BASE_URL}`, () => {
        it('should succeed for some valid input with prior POST', () => __awaiter(this, void 0, void 0, function* () {
            const { postRes, courseAdmin } = yield postValidRequest();
            postRes.body.should.not.be.empty;
            const res = yield chai.request(app)
                .get(BASE_URL + '/' + postRes.body)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .catch(err => err.response);
            res.status.should.be.equal(200);
        }));
        it('should fail, malignant file id', () => __awaiter(this, void 0, void 0, function* () {
            const { postRes, courseAdmin } = yield postValidRequest();
            postRes.body.should.not.be.empty;
            const res = yield chai.request(app)
                .get(BASE_URL + '/%2E%2E%2F' + postRes.body)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .catch(err => err.response);
            res.status.should.be.equal(403);
        }));
        it('should fail, no auth', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .get(BASE_URL + '/123456789')
                .set('Authorization', 'JWT asdf')
                .catch(err => err.response);
            res.status.should.be.equal(401);
        }));
        it('should fail, no hash with that id', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const res = yield chai.request(app)
                .get(BASE_URL + '/123456789')
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                .catch(err => err.response);
            res.status.should.be.equal(404);
        }));
    });
    describe(`POST ${BASE_URL + '/pdf/individual'}`, () => {
        it('should fail, no auth', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .post(BASE_URL + '/pdf/individual')
                .set('Authorization', 'JWT asdf')
                .catch(err => err.response);
            res.status.should.be.equal(401);
        }));
        it('should fail, course does not exists', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const teacher = yield User_1.User.findById(course.courseAdmin);
            const testData = {
                courseName: '000000000000000000000000',
                'lectures': [{
                        'lectureId': '000000000000000000000000',
                        'units': [{ 'unitId': '000000000000000000000000' }]
                    }]
            };
            const res = yield chai.request(app)
                .post(BASE_URL + '/pdf/individual')
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                .send(testData)
                .catch(err => err.response);
            res.status.should.be.equal(404);
        }));
        it('should fail, because user is not in course', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const teacher = yield User_1.User.findById(course.courseAdmin);
            const user = yield User_1.User.findOne().where('_id').ne(teacher._id);
            const testData = {
                courseName: course._id,
                'lectures': [{
                        'lectureId': '000000000000000000000000',
                        'units': [{ 'unitId': '000000000000000000000000' }]
                    }]
            };
            const res = yield chai.request(app)
                .post(BASE_URL + '/pdf/individual')
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(user)}`)
                .send(testData)
                .catch(err => err.response);
            res.status.should.be.equal(404);
        }));
        it('should fail, because the lectures is empty and the IDownloadObject cant be created', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const teacher = yield User_1.User.findById(course.courseAdmin);
            const testData = {
                courseName: course._id,
                lectures: Array,
            };
            const res = yield chai.request(app)
                .post(BASE_URL + '/pdf/individual')
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                .send(testData)
                .catch(err => err.response);
            res.status.should.be.equal(500);
        }));
        it('should pass (teacher)', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourseWithAllUnitTypes();
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
            const testData = yield prepareTestData(course);
            const res = yield chai.request(app)
                .post(BASE_URL + '/pdf/individual')
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                .send(testData)
                .catch(err => err.response);
            expect(res).to.have.status(200);
            expect(res).to.be.json;
        })).timeout(45000);
        it('should pass (student)', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourseWithAllUnitTypes();
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudentForCourse(course);
            const testData = yield prepareTestData(course);
            const res = yield chai.request(app)
                .post(BASE_URL + '/pdf/individual')
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(student)}`)
                .send(testData)
                .catch(err => err.response);
            expect(res).to.have.status(200);
            expect(res).to.be.json;
        })).timeout(45000);
    });
    describe(`POST ${BASE_URL + '/pdf/single'}`, () => {
        it('should succeed for some valid input', () => __awaiter(this, void 0, void 0, function* () {
            yield postValidRequest();
        }));
        it('should fail, no auth', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .post(BASE_URL + '/pdf/single')
                .set('Authorization', 'JWT asdf')
                .catch(err => err.response);
            res.status.should.be.equal(401);
        }));
        it('should fail, course does not exists', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const teacher = yield User_1.User.findById(course.courseAdmin);
            const testData = {
                courseName: '000000000000000000000000',
                'lectures': [{
                        'lectureId': '000000000000000000000000',
                        'units': [{ 'unitId': '000000000000000000000000' }]
                    }]
            };
            const res = yield chai.request(app)
                .post(BASE_URL + '/pdf/single')
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                .send(testData)
                .catch(err => err.response);
            res.status.should.be.equal(404);
        }));
        it('should fail, because user is not in course', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const teacher = yield User_1.User.findById(course.courseAdmin);
            const user = yield User_1.User.findOne().where('_id').ne(teacher._id);
            const testData = {
                courseName: course._id,
                'lectures': [{
                        'lectureId': '000000000000000000000000',
                        'units': [{ 'unitId': '000000000000000000000000' }]
                    }]
            };
            const res = yield chai.request(app)
                .post(BASE_URL + '/pdf/single')
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(user)}`)
                .send(testData)
                .catch(err => err.response);
            res.status.should.be.equal(404);
        }));
        it('should fail, because the lectures is empty and the IDownloadObject cant be created', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const teacher = yield User_1.User.findById(course.courseAdmin);
            const testData = {
                courseName: course._id,
                'lectures': Array
            };
            const res = yield chai.request(app)
                .post(BASE_URL + '/pdf/single')
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                .send(testData)
                .catch(err => err.response);
            res.status.should.be.equal(500);
        }));
    });
    describe(`DELETE ${BASE_URL}/cache`, () => {
        it('should succeed with admin as user', () => __awaiter(this, void 0, void 0, function* () {
            yield requestValidCleanup();
        }));
        it('should fail with non-admin as user', () => __awaiter(this, void 0, void 0, function* () {
            const student = yield FixtureUtils_1.FixtureUtils.getRandomStudent();
            const res = yield requestCleanup(student);
            res.status.should.be.equal(403);
        }));
    });
});

//# sourceMappingURL=../../maps/test/integration/download.js.map
