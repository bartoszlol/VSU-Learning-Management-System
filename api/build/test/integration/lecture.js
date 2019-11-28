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
const Lecture_1 = require("../../src/models/Lecture");
chai.use(chaiHttp);
const should = chai.should();
const BASE_URL = '/api/lecture';
const testHelper = new TestHelper_1.TestHelper(BASE_URL);
/**
 * Provides simple shared setup functionality used by the lecture success (200) unit tests.
 *
 * @returns A random 'lecture', its 'course' and a random 'admin'. The 'admin' is also aliased as 'user'.
 */
function lectureSuccessTestSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        const lecture = yield FixtureUtils_1.FixtureUtils.getRandomLecture();
        const course = yield FixtureUtils_1.FixtureUtils.getCourseFromLecture(lecture);
        const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
        return { lecture, course, admin, user: admin };
    });
}
/**
 * Provides simple shared setup functionality used by the lecture access denial (403) unit tests.
 *
 * @returns A 'lecture', its 'course' and an 'unauthorizedTeacher' (i.e. a teacher that isn't part of the course).
 *          The 'unauthorizedTeacher' is also aliased as 'user'.
 */
function lectureAccessDenialTestSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        const lecture = yield FixtureUtils_1.FixtureUtils.getRandomLecture();
        const course = yield FixtureUtils_1.FixtureUtils.getCourseFromLecture(lecture);
        const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
        return { lecture, course, unauthorizedTeacher, user: unauthorizedTeacher };
    });
}
/**
 * Provides simple shared setup functionality used by the lecture not found (404) unit tests.
 *
 * @returns Same as lectureSuccessTestSetup, but the lecture & course ids are set to 000000000000000000000000.
 */
function lectureNotFoundTestSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        const setup = yield lectureSuccessTestSetup();
        setup.lecture._id = '000000000000000000000000';
        setup.course._id = '000000000000000000000000';
        return setup;
    });
}
function lectureShouldEqualRes(lecture, res) {
    res.status.should.be.equal(200);
    should.equal(lecture.id, res.body._id, 'Incorrect id.');
    should.equal(lecture.name, res.body.name, 'Incorrect name.');
    should.equal(lecture.description, res.body.description, 'Incorrect description.');
}
describe('Lecture', () => {
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield testHelper.resetForNextTest();
    }));
    describe(`GET ${BASE_URL}`, () => {
        function lectureGetTest({ lecture, user }) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield testHelper.commonUserGetRequest(user, `/${lecture.id}`);
            });
        }
        it('should get lecture data', () => __awaiter(this, void 0, void 0, function* () {
            const setup = yield lectureSuccessTestSetup();
            const res = yield lectureGetTest(setup);
            lectureShouldEqualRes(setup.lecture, res);
        }));
        it('should forbid lecture access for an unauthorized user', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield lectureGetTest(yield lectureAccessDenialTestSetup());
            res.status.should.be.equal(403);
        }));
        it('should respond with 404 for an invalid lecture id', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield lectureGetTest(yield lectureNotFoundTestSetup());
            res.status.should.be.equal(404);
        }));
    });
    describe(`POST ${BASE_URL}`, () => {
        function lecturePostTest({ lecture, course, user }) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield testHelper.commonUserPostRequest(user, `/`, {
                    name: lecture.name,
                    description: lecture.description,
                    courseId: course.id
                });
            });
        }
        it('should add a lecture', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield lecturePostTest(yield lectureSuccessTestSetup());
            res.status.should.be.equal(200);
        }));
        it('should forbid lecture addition for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield lecturePostTest(yield lectureAccessDenialTestSetup());
            res.status.should.be.equal(403);
        }));
        it('should respond with 404 for an invalid course id', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield lecturePostTest(yield lectureNotFoundTestSetup());
            res.status.should.be.equal(404);
        }));
    });
    describe(`PUT ${BASE_URL}`, () => {
        function lecturePutTest({ lecture, user }) {
            return __awaiter(this, void 0, void 0, function* () {
                lecture.description = 'Lecture modification unit test.';
                return yield testHelper.commonUserPutRequest(user, `/${lecture.id}`, lecture);
            });
        }
        it('should modify a lecture', () => __awaiter(this, void 0, void 0, function* () {
            const setup = yield lectureSuccessTestSetup();
            const res = yield lecturePutTest(setup);
            lectureShouldEqualRes(setup.lecture, res);
        }));
        it('should forbid lecture modification for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield lecturePutTest(yield lectureAccessDenialTestSetup());
            res.status.should.be.equal(403);
        }));
        it('should respond with 404 for an invalid lecture id', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield lecturePutTest(yield lectureNotFoundTestSetup());
            res.status.should.be.equal(404);
        }));
    });
    describe(`DELETE ${BASE_URL}`, () => {
        function lectureDeleteTest({ lecture, user }) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield testHelper.commonUserDeleteRequest(user, `/${lecture.id}`);
            });
        }
        it('should delete a lecture', () => __awaiter(this, void 0, void 0, function* () {
            const setup = yield lectureSuccessTestSetup();
            const res = yield lectureDeleteTest(setup);
            res.status.should.be.equal(200);
            should.not.exist(yield Lecture_1.Lecture.findById(setup.lecture.id), 'Lecture still exists');
        }));
        it('should forbid lecture deletions for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield lectureDeleteTest(yield lectureAccessDenialTestSetup());
            res.status.should.be.equal(403);
        }));
        it('should respond with 404 for an invalid lecture id', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield lectureDeleteTest(yield lectureNotFoundTestSetup());
            res.status.should.be.equal(404);
        }));
    });
});

//# sourceMappingURL=../../maps/test/integration/lecture.js.map
