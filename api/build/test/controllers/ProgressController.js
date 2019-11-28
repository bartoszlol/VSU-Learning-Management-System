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
const User_1 = require("../../src/models/User");
const Unit_1 = require("../../src/models/units/Unit");
const Course_1 = require("../../src/models/Course");
const moment = require("moment");
const errorCodes_1 = require("../../src/config/errorCodes");
chai.use(chaiHttp);
const BASE_URL = '/api/progress';
const testHelper = new TestHelper_1.TestHelper(BASE_URL);
/**
 * Common setup function for the unit tests.
 */
function prepareSetup(unitDeadlineAdd = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        const unit = yield Unit_1.Unit.findOne({ progressable: true, __t: 'code-kata' });
        const course = yield Course_1.Course.findById(unit._course);
        course.active = true; // Ensure that the course is active.
        yield course.save();
        const student = yield User_1.User.findById(course.students[0]);
        if (unitDeadlineAdd) {
            unit.deadline = moment().add(unitDeadlineAdd, 'hour').format();
            yield unit.save();
        }
        return { unit, course, student };
    });
}
/**
 * Common progress data setup function for the unit tests.
 */
function createProgressObjFor(unit, student, done = true) {
    return {
        course: unit._course.toString(),
        unit: unit._id.toString(),
        user: student._id.toString(),
        code: 'let a = test;',
        done,
        type: 'codeKata'
    };
}
/**
 * Common unit test helper function to check that responses equal the progress object.
 */
function checkResponseProgress(res, newProgress) {
    res.body.course.should.be.equal(newProgress.course);
    res.body.unit.should.be.equal(newProgress.unit);
    res.body.user.should.be.equal(newProgress.user);
    res.body.done.should.be.equal(newProgress.done);
    res.body._id.should.be.a('string');
}
/**
 * Common helper function for the unit tests that PUT new progress data for a student and checks the status code.
 */
function putProgressTestData(unit, student, status = 200) {
    return __awaiter(this, void 0, void 0, function* () {
        const newProgress = createProgressObjFor(unit, student);
        const res = yield testHelper.commonUserPutRequest(student, '', newProgress);
        res.status.should.be.equal(status);
        return { res, newProgress };
    });
}
describe('ProgressController', () => {
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield testHelper.resetForNextTest();
    }));
    describe(`GET ${BASE_URL}`, () => {
        it('should get unit progress', () => __awaiter(this, void 0, void 0, function* () {
            const { unit, student } = yield prepareSetup();
            const res = yield testHelper.commonUserGetRequest(student, `/units/${unit._id}`);
            res.status.should.be.equal(200);
        }));
        it('should deny access to unit progress for an unauthorized user', () => __awaiter(this, void 0, void 0, function* () {
            const { unit, course } = yield prepareSetup();
            const unauthorizedUser = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const res = yield testHelper.commonUserGetRequest(unauthorizedUser, `/units/${unit._id}`);
            res.status.should.be.equal(403);
        }));
        it('should only return own unit progress for a student', () => __awaiter(this, void 0, void 0, function* () {
            const { unit, course, student } = yield prepareSetup(1);
            // Currently the FixtureLoader will enrol at least 2 students per course, so this should never fail.
            const student2 = yield User_1.User.findById(course.students[1]);
            yield Promise.all([putProgressTestData(unit, student), putProgressTestData(unit, student2)]);
            const res = yield testHelper.commonUserGetRequest(student, `/units/${unit._id}`);
            res.status.should.be.equal(200);
            const studentId = student._id.toString();
            res.body.user.should.equal(studentId);
        }));
    });
    describe(`PUT ${BASE_URL}`, () => {
        function successTest(unitDeadlineAdd) {
            return __awaiter(this, void 0, void 0, function* () {
                const { unit, student } = yield prepareSetup(unitDeadlineAdd);
                const progress = (yield putProgressTestData(unit, student)).res.body;
                const { res, newProgress } = yield putProgressTestData(unit, student);
                checkResponseProgress(res, newProgress);
                res.body._id.should.be.equal(progress._id.toString(), 'Progress update ID mismatch');
            });
        }
        it('should update progress for some progressable unit', () => __awaiter(this, void 0, void 0, function* () {
            yield successTest(0);
        }));
        it('should update progress for some progressable unit with a deadline', () => __awaiter(this, void 0, void 0, function* () {
            yield successTest(1);
        }));
        it('should fail updating progress for some progressable unit with a deadline', () => __awaiter(this, void 0, void 0, function* () {
            const { unit, student } = yield prepareSetup(-1);
            const { res } = yield putProgressTestData(unit, student, 400);
            res.body.name.should.be.equal('BadRequestError');
            res.body.message.should.be.equal(errorCodes_1.errorCodes.progress.pastDeadline.text);
        }));
        it('should fail to update progress for an unauthorized student', () => __awaiter(this, void 0, void 0, function* () {
            const { unit, course } = yield prepareSetup();
            const unauthorizedStudent = yield FixtureUtils_1.FixtureUtils.getUnauthorizedStudentForCourse(course);
            yield putProgressTestData(unit, unauthorizedStudent, 403);
        }));
    });
});

//# sourceMappingURL=../../maps/test/controllers/ProgressController.js.map
