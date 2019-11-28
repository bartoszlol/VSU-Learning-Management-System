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
const TestHelper_1 = require("../../TestHelper");
const server_1 = require("../../../src/server");
const User_1 = require("../../../src/models/User");
const Lecture_1 = require("../../../src/models/Lecture");
const Course_1 = require("../../../src/models/Course");
const FixtureUtils_1 = require("../../../fixtures/FixtureUtils");
const Unit_1 = require("../../../src/models/units/Unit");
chai.use(chaiHttp);
const app = new server_1.Server().app;
const BASE_URL = '/api/units';
const testHelper = new TestHelper_1.TestHelper(BASE_URL);
describe(`CodeKataUnit ${BASE_URL}`, () => {
    const model = {
        _course: '',
        name: 'Search and Replace',
        description: '...',
        progressable: true,
        weight: 0,
        __t: 'code-kata',
        definition: '// Task: Manipulate the targetSet, so it only contains the values "Hello" and "h_da"' +
            '\n' +
            '\nlet targetSet = new Set(["Hello", "there"]);',
        code: 'targetSet.add("h_da");' +
            '\ntargetSet.delete("there");',
        test: 'validate();' +
            '\n' +
            '\nfunction validate() {' +
            '\n\treturn targetSet.has("Hello") && targetSet.has("h_da") && targetSet.size === 2;' +
            '\n' +
            '}'
    };
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield testHelper.resetForNextTest();
    }));
    describe(`GET ${BASE_URL}`, () => {
        function commonGetTest(getUserForCourseFunc, status) {
            return __awaiter(this, void 0, void 0, function* () {
                const unit = yield Unit_1.Unit.findOne({ __t: 'code-kata' });
                const course = yield Course_1.Course.findById(unit._course);
                const courseAdmin = yield getUserForCourseFunc(course);
                const res = yield testHelper.commonUserGetRequest(courseAdmin, `/${unit.id}`);
                res.status.should.be.equal(status);
            });
        }
        it('should get unit data', () => __awaiter(this, void 0, void 0, function* () {
            yield commonGetTest((course) => __awaiter(this, void 0, void 0, function* () { return yield User_1.User.findById(course.courseAdmin); }), 200);
        }));
        it('should deny access to unit data if the user is unauthorized', () => __awaiter(this, void 0, void 0, function* () {
            yield commonGetTest(FixtureUtils_1.FixtureUtils.getUnauthorizedStudentForCourse, 403);
        }));
    });
    describe(`POST ${BASE_URL}`, () => {
        it('should fail with wrong authorization', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .post(BASE_URL)
                .set('Authorization', 'JWT asdf')
                .catch(err => err.response);
            res.status.should.be.equal(401);
        }));
        it('should fail with BadRequest (missing lectureId)', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const res = yield testHelper.commonUserPostRequest(teacher, '', { model });
            res.status.should.be.equal(400);
        }));
        it('should fail with BadRequest (missing model)', () => __awaiter(this, void 0, void 0, function* () {
            const lecture = yield FixtureUtils_1.FixtureUtils.getRandomLecture();
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const courseAdmin = yield User_1.User.findOne({ _id: course.courseAdmin });
            const res = yield testHelper.commonUserPostRequest(courseAdmin, '', { lectureId: lecture._id });
            res.status.should.be.equal(400);
        }));
        it('should create a new codeKataUnit', () => __awaiter(this, void 0, void 0, function* () {
            const lecture = yield FixtureUtils_1.FixtureUtils.getRandomLecture();
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const courseAdmin = yield User_1.User.findOne({ _id: course.courseAdmin });
            model._course = course._id;
            const res = yield testHelper.commonUserPostRequest(courseAdmin, '', { lectureId: lecture._id, model });
            res.status.should.be.equal(200);
            res.body.name.should.equal(model.name);
            res.body.description.should.equal(model.description);
        }));
        it('should create a new codeKataUnit (entire code in model.code)', () => __awaiter(this, void 0, void 0, function* () {
            const lecture = yield FixtureUtils_1.FixtureUtils.getRandomLecture();
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const courseAdmin = yield User_1.User.findOne({ _id: course.courseAdmin });
            model._course = course._id;
            // The unitForm posts a new Kata with the entire code in model.code
            const areaSeperator = '//####################';
            model.code =
                model.definition
                    + '\n\n' + areaSeperator + '\n\n'
                    + model.code
                    + '\n\n' + areaSeperator + '\n\n'
                    + model.test;
            model.definition = undefined;
            model.test = undefined;
            const res = yield testHelper.commonUserPostRequest(courseAdmin, '', { lectureId: lecture._id, model });
            res.status.should.be.equal(200);
            res.body.name.should.equal(model.name);
            res.body.description.should.equal(model.description);
            res.body.unitCreator.profile.lastName.should.equal(courseAdmin.profile.lastName);
            res.body.unitCreator.profile.firstName.should.equal(courseAdmin.profile.firstName);
        }));
        it('should fail to create a new unit for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const lecture = yield FixtureUtils_1.FixtureUtils.getRandomLecture();
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            model._course = course._id;
            const res = yield testHelper.commonUserPostRequest(unauthorizedTeacher, '', { lectureId: lecture._id, model });
            res.status.should.be.equal(403);
        }));
    });
    describe(`PUT ${BASE_URL}`, () => {
        it('should update a codeKata', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findOne({ __t: 'code-kata' });
            const lecture = yield Lecture_1.Lecture.findOne({ units: { $in: [unit._id] } });
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const courseAdmin = yield User_1.User.findOne({ _id: course.courseAdmin });
            unit.test += '\n// Test if we can edit a Kata';
            const res = yield testHelper.commonUserPutRequest(courseAdmin, `/${unit.id}`, unit.toObject());
            res.status.should.be.equal(200);
            res.body.test.should.string('// Test if we can edit a Kata');
        }));
        it('should fail to update a unit for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findOne({ __t: 'code-kata' });
            const lecture = yield Lecture_1.Lecture.findOne({ units: { $in: [unit._id] } });
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            unit.test += '\n// Test if we can edit a Kata';
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const res = yield testHelper.commonUserPutRequest(unauthorizedTeacher, `/${unit.id}`, unit.toObject());
            res.status.should.be.equal(403);
        }));
    });
    describe(`DELETE ${BASE_URL}`, () => {
        it('should delete unit', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findOne({ __t: 'code-kata' });
            const course = yield Course_1.Course.findById(unit._course);
            const courseAdmin = yield User_1.User.findById(course.courseAdmin);
            const res = yield testHelper.commonUserDeleteRequest(courseAdmin, `/${unit.id}`);
            res.status.should.be.equal(200);
            const res2 = yield testHelper.commonUserGetRequest(courseAdmin, `/${unit.id}`);
            res2.status.should.be.equal(404);
        }));
        it('should fail to delete unit for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findOne({ __t: 'code-kata' });
            const course = yield Course_1.Course.findById(unit._course);
            const courseAdmin = yield User_1.User.findById(course.courseAdmin);
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const res = yield testHelper.commonUserDeleteRequest(unauthorizedTeacher, `/${unit.id}`);
            res.status.should.be.equal(403);
            const res2 = yield testHelper.commonUserGetRequest(courseAdmin, `/${unit.id}`);
            res2.status.should.be.equal(200);
        }));
    });
});

//# sourceMappingURL=../../../maps/test/integration/unit/codeKataUnit.js.map
