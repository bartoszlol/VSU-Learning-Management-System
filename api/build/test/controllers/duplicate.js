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
const TestHelper_1 = require("../TestHelper");
const chaiHttp = require("chai-http");
const FixtureUtils_1 = require("../../fixtures/FixtureUtils");
const util = require("util");
const Course_1 = require("../../src/models/Course");
const ExtractMongoId_1 = require("../../src/utilities/ExtractMongoId");
// how can i do this in the usual import scheme as above?
// 'track()' needs to be chained to the require in order to be able to delete all created temporary files afterwards
// see also: https://github.com/bruce/node-temp
const temp = require('temp').track();
const createTempFile = util.promisify(temp.open);
chai.use(chaiHttp);
const should = chai.should();
const BASE_URL = '/api/duplicate';
const testHelper = new TestHelper_1.TestHelper(BASE_URL);
/**
 * Provides simple shared setup functionality used by the duplicate access denial unit tests.
 * It finds a targetCourse (ICourseModel) that doesn't share any of the teachers with the given input course.
 * Then it finds the unauthorizedTeacher, which is simply a random teacher of the targetCourse.
 *
 * @param course The course for which the "unauthorized teacher set" is to be generated.
 * @returns An object with the targetCourse and unauthorizedTeacher.
 */
function prepareUnauthorizedTeacherSetFor(course) {
    return __awaiter(this, void 0, void 0, function* () {
        const authorizedTeachers = [course.courseAdmin, ...course.teachers];
        const targetCourse = yield Course_1.Course.findOne({
            courseAdmin: { $nin: authorizedTeachers },
            teachers: { $nin: authorizedTeachers }
        });
        const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(targetCourse);
        return { targetCourse, unauthorizedTeacher };
    });
}
/**
 * Provides simple shared setup functionality used by the duplicate access denial unit tests.
 * It first gets a random teacher for the input course.
 * Then it finds a targetCourse (ICourseModel) for that teacher.
 *
 * @param course The course for which the "other course set" is to be generated.
 * @returns An object with the targetCourse and teacher.
 */
function prepareOtherTargetCourseSetFor(course) {
    return __awaiter(this, void 0, void 0, function* () {
        const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
        const targetCourse = yield Course_1.Course.findOne({
            courseAdmin: { $ne: teacher },
            teachers: { $ne: teacher }
        });
        return { targetCourse, teacher };
    });
}
function testForbidden(user, urlPostfix = '', sendData) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield testHelper.commonUserPostRequest(user, urlPostfix, sendData);
        result.status.should.be.equal(403);
    });
}
function testSuccess(user, urlPostfix = '', sendData, errorMsg = '') {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield testHelper.commonUserPostRequest(user, urlPostfix, sendData);
        response.status.should.be.equal(200, errorMsg + ' -> ' + response.body.message);
        should.exist(response.body._id, 'Response body doesn\'t have an _id property');
        should.equal(1, Object.keys(response.body).length, 'The duplication response apparently contains more than just the ID');
        return response.body._id;
    });
}
function testNotFound(what, sendData) {
    return __awaiter(this, void 0, void 0, function* () {
        const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
        const result = yield testHelper.commonUserPostRequest(admin, `/${what}/000000000000000000000000`, sendData);
        result.status.should.be.equal(404);
    });
}
describe('Duplicate', () => __awaiter(this, void 0, void 0, function* () {
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield testHelper.resetForNextTest();
    }));
    describe(`POST ${BASE_URL}`, () => __awaiter(this, void 0, void 0, function* () {
        it('should duplicate units', () => __awaiter(this, void 0, void 0, function* () {
            const units = yield FixtureUtils_1.FixtureUtils.getUnits();
            for (const unit of units) {
                const course = yield FixtureUtils_1.FixtureUtils.getCourseFromUnit(unit);
                const lecture = yield FixtureUtils_1.FixtureUtils.getLectureFromUnit(unit);
                const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
                const duplicateId = yield testSuccess(teacher, `/unit/${unit._id}`, { lectureId: lecture._id }, 'failed to duplicate ' + unit.name +
                    ' into ' + lecture.name +
                    ' from ' + course.name);
                const getResponse = yield testHelper.basicUserGetRequest(teacher, `/api/units/${duplicateId}`);
                getResponse.status.should.be.equal(200);
                const unitJson = getResponse.body;
                // TODO: share this check since it is the same one as in export.ts
                should.equal(unit.name, unitJson.name, 'Duplicate name mismatch');
                // check nullable fields
                if (unit.description != null) {
                    unitJson.description.should.be.equal(unit.description);
                }
                else {
                    should.not.exist(unitJson.description);
                }
                if (unit.weight != null) {
                    unitJson.weight.should.be.equal(unit.weight);
                }
                else {
                    should.not.exist(unitJson.weight);
                }
                // 'progressableUnits' do have some additional fields
                if (unit.progressable === true) {
                    unitJson.progressable.should.be.equal(unit.progressable);
                    const progressableUnit = unit;
                    if (progressableUnit.deadline != null) {
                        unitJson.deadline.should.be.equal(progressableUnit.deadline);
                    }
                }
                unitJson.__t.should.be.equal(unit.__t);
                // check different types
                switch (unit.__t) {
                    case 'free-text':
                        unitJson.markdown.should.be.equal(unit.markdown);
                        break;
                    case 'code-kata':
                        const codeKataUnit = unit;
                        unitJson.definition.should.be.equal(codeKataUnit.definition);
                        unitJson.code.should.be.equal(codeKataUnit.code);
                        unitJson.test.should.be.equal(codeKataUnit.test);
                        break;
                    case 'task':
                        const taskUnit = unit;
                        unitJson.tasks.should.be.instanceOf(Array).and.have.lengthOf(taskUnit.tasks.length);
                        // maybe further test single tasks?
                        break;
                    default:
                        // should this fail the test?
                        process.stderr.write('duplicate for "' + unit.type + '" is not completly tested');
                        break;
                }
            }
        }));
        it('should duplicate lectures', () => __awaiter(this, void 0, void 0, function* () {
            const lectures = yield FixtureUtils_1.FixtureUtils.getLectures();
            for (const lecture of lectures) {
                const course = yield FixtureUtils_1.FixtureUtils.getCourseFromLecture(lecture);
                const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
                const duplicateId = yield testSuccess(teacher, `/lecture/${lecture._id}`, { courseId: course._id }, 'failed to import ' + lecture.name +
                    ' into ' + course.name);
                const getResponse = yield testHelper.basicUserGetRequest(teacher, `/api/lecture/${duplicateId}`);
                getResponse.status.should.be.equal(200);
                const lectureJson = getResponse.body;
                lectureJson.name.should.be.equal(lecture.name);
                lectureJson.description.should.be.equal(lecture.description);
                lectureJson.units.should.be.instanceOf(Array).and.have.lengthOf(lecture.units.length);
                const updatedCourse = yield Course_1.Course.find({ lectures: { $in: [lectureJson._id] } });
                updatedCourse.should.be.instanceOf(Array).and.have.lengthOf(1);
                updatedCourse[0]._id.toString().should.be.equal(course._id.toString());
                updatedCourse[0].lectures.should.be.instanceOf(Array).and.have.lengthOf(course.lectures.length + 1);
            }
        }));
        it('should duplicate courses', () => __awaiter(this, void 0, void 0, function* () {
            const courses = yield FixtureUtils_1.FixtureUtils.getCourses();
            for (const course of courses) {
                const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
                const duplicateId = yield testSuccess(teacher, `/course/${course._id}`, { courseAdmin: teacher._id }, 'failed to duplicate ' + course.name);
                const getResponse = yield testHelper.basicUserGetRequest(teacher, `/api/courses/${duplicateId}/edit`);
                getResponse.status.should.be.equal(200);
                const courseJson = getResponse.body;
                courseJson.active.should.be.equal(false);
                courseJson.courseAdmin.should.be.equal(ExtractMongoId_1.extractSingleMongoId(teacher));
                courseJson.name.startsWith(course.name).should.be.equal(true);
                courseJson.description.should.be.equal(course.description);
                courseJson.lectures.should.be.instanceOf(Array).and.have.lengthOf(course.lectures.length);
                // Test optional params
                if (course.accessKey) {
                    courseJson.accessKey.should.be.equal(course.accessKey);
                }
            }
        }));
        it('should forbid unit duplication for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield FixtureUtils_1.FixtureUtils.getRandomUnit();
            const course = yield FixtureUtils_1.FixtureUtils.getCourseFromUnit(unit);
            const { targetCourse, unauthorizedTeacher } = yield prepareUnauthorizedTeacherSetFor(course);
            const targetLecture = yield FixtureUtils_1.FixtureUtils.getRandomLectureFromCourse(targetCourse);
            yield testForbidden(unauthorizedTeacher, `/unit/${unit._id}`, { lectureId: targetLecture._id });
        }));
        it('should forbid lecture duplication for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const lecture = yield FixtureUtils_1.FixtureUtils.getRandomLecture();
            const course = yield FixtureUtils_1.FixtureUtils.getCourseFromLecture(lecture);
            const { targetCourse, unauthorizedTeacher } = yield prepareUnauthorizedTeacherSetFor(course);
            yield testForbidden(unauthorizedTeacher, `/lecture/${lecture._id}`, { courseId: targetCourse._id });
        }));
        it('should forbid course duplication for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const { unauthorizedTeacher } = yield prepareUnauthorizedTeacherSetFor(course);
            yield testForbidden(unauthorizedTeacher, `/course/${course._id}`, { courseAdmin: unauthorizedTeacher._id });
        }));
        it('should forbid unit duplication when given a different target lecture without authorization', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield FixtureUtils_1.FixtureUtils.getRandomUnit();
            const course = yield FixtureUtils_1.FixtureUtils.getCourseFromUnit(unit);
            const { teacher, targetCourse } = yield prepareOtherTargetCourseSetFor(course);
            const targetLecture = yield FixtureUtils_1.FixtureUtils.getRandomLectureFromCourse(targetCourse);
            yield testForbidden(teacher, `/unit/${unit._id}`, { lectureId: targetLecture._id });
        }));
        it('should forbid lecture duplication when given a different target course without authorization', () => __awaiter(this, void 0, void 0, function* () {
            const lecture = yield FixtureUtils_1.FixtureUtils.getRandomLecture();
            const course = yield FixtureUtils_1.FixtureUtils.getCourseFromLecture(lecture);
            const { teacher, targetCourse } = yield prepareOtherTargetCourseSetFor(course);
            yield testForbidden(teacher, `/lecture/${lecture._id}`, { courseId: targetCourse._id });
        }));
        it('should respond with 404 for a unit id that doesn\'t exist', () => __awaiter(this, void 0, void 0, function* () {
            const targetLecture = yield FixtureUtils_1.FixtureUtils.getRandomLecture();
            yield testNotFound('/unit/000000000000000000000000', { lectureId: targetLecture._id });
        }));
        it('should respond with 404 for a lecture id that doesn\'t exist', () => __awaiter(this, void 0, void 0, function* () {
            const targetCourse = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            yield testNotFound('/lecture/000000000000000000000000', { courseId: targetCourse._id });
        }));
        it('should respond with 404 for a course id that doesn\'t exist', () => __awaiter(this, void 0, void 0, function* () {
            yield testNotFound('/course/000000000000000000000000');
        }));
        it('should respond with 404 for a target lecture id that doesn\'t exist (unit duplication)', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield FixtureUtils_1.FixtureUtils.getRandomUnit();
            yield testNotFound(`/unit/${unit._id}`, { lectureId: '000000000000000000000000' });
        }));
        it('should respond with 404 for a target course id that doesn\'t exist (lecture duplication)', () => __awaiter(this, void 0, void 0, function* () {
            const lecture = yield FixtureUtils_1.FixtureUtils.getRandomLecture();
            yield testNotFound(`/lecture/${lecture._id}`, { courseId: '000000000000000000000000' });
        }));
    }));
}));

//# sourceMappingURL=../../maps/test/controllers/duplicate.js.map
