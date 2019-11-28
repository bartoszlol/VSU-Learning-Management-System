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
const FixtureLoader_1 = require("../../fixtures/FixtureLoader");
const server_1 = require("../../src/server");
const chaiHttp = require("chai-http");
const FixtureUtils_1 = require("../../fixtures/FixtureUtils");
const JwtUtils_1 = require("../../src/security/JwtUtils");
const fs = require("fs");
const util = require("util");
const Course_1 = require("../../src/models/Course");
// how can i do this in the usual import scheme as above?
// 'track()' needs to be chained to the require in order to be able to delete all created temporary files afterwards
// see also: https://github.com/bruce/node-temp
const temp = require('temp').track();
const createTempFile = util.promisify(temp.open);
chai.use(chaiHttp);
const should = chai.should();
const app = new server_1.Server().app;
const BASE_URL = '/api/import';
const fixtureLoader = new FixtureLoader_1.FixtureLoader();
describe('Import', () => __awaiter(this, void 0, void 0, function* () {
    // Before each test we reset the database
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield fixtureLoader.load();
    }));
    describe(`POST ${BASE_URL}`, () => __awaiter(this, void 0, void 0, function* () {
        it('should import units', () => __awaiter(this, void 0, void 0, function* () {
            const coursesDirectory = 'build/fixtures/courses/';
            const coursefixtures = fs.readdirSync(coursesDirectory);
            let units = [];
            for (const courseFilePath of coursefixtures) {
                const courseFile = fs.readFileSync(coursesDirectory + courseFilePath);
                const course = JSON.parse(courseFile.toString());
                for (const lecture of course.lectures) {
                    units = units.concat(lecture.units);
                }
            }
            for (const unit of units) {
                const tmpUnitFile = yield createTempFile('unit');
                util.promisify(fs.write)(tmpUnitFile.fd, JSON.stringify(unit));
                const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
                const lecture = yield FixtureUtils_1.FixtureUtils.getRandomLectureFromCourse(course);
                const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
                let unitJson;
                const importResult = yield chai.request(app)
                    .post(`${BASE_URL}/unit/${course._id}/${lecture._id}`)
                    .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                    .attach('file', fs.readFileSync(tmpUnitFile.path), unit.name)
                    .catch((err) => err.response);
                importResult.status.should.be.equal(200, 'failed to import ' + unit.name +
                    ' into ' + lecture.name +
                    ' from ' + course.name +
                    ' -> ' + importResult.body.message);
                unitJson = importResult.body;
                should.exist(importResult.body.createdAt);
                should.exist(importResult.body.__v);
                should.exist(importResult.body.updatedAt);
                should.exist(unitJson._id);
                // TODO: share this check since it is the same one as in export.ts
                unitJson.name.should.be.equal(unit.name);
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
                        const freeTextUnit = unit;
                        unitJson.markdown.should.be.equal(freeTextUnit.markdown);
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
                        process.stderr.write('import for "' + unit.type + '" is not completly tested');
                        break;
                }
            }
        }));
        it('should import lectures', () => __awaiter(this, void 0, void 0, function* () {
            const coursesDirectory = 'build/fixtures/courses/';
            const coursefixtures = fs.readdirSync(coursesDirectory);
            let lectures = [];
            for (const courseFilePath of coursefixtures) {
                const courseFile = fs.readFileSync(coursesDirectory + courseFilePath);
                const course = JSON.parse(courseFile.toString());
                lectures = lectures.concat(course.lectures);
            }
            for (const lecture of lectures) {
                const tmpLectureFile = yield createTempFile('lecture');
                util.promisify(fs.write)(tmpLectureFile.fd, JSON.stringify(lecture));
                const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
                const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
                let lectureJson;
                const importResult = yield chai.request(app)
                    .post(`${BASE_URL}/lecture/${course._id}`)
                    .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                    .attach('file', fs.readFileSync(tmpLectureFile.path), lecture.name)
                    .catch((err) => err.response);
                importResult.status.should.be.equal(200, 'failed to import ' + lecture.name +
                    ' into ' + course.name +
                    ' -> ' + importResult.body.message);
                lectureJson = importResult.body;
                should.exist(importResult.body.createdAt);
                should.exist(importResult.body.__v);
                should.exist(importResult.body.updatedAt);
                should.exist(lectureJson._id);
                lectureJson.name.should.be.equal(lecture.name);
                lectureJson.description.should.be.equal(lecture.description);
                lectureJson.units.should.be.instanceOf(Array).and.have.lengthOf(lecture.units.length);
                const updatedCourse = yield Course_1.Course.find({ lectures: { $in: [lectureJson._id] } });
                updatedCourse.should.be.instanceOf(Array).and.have.lengthOf(1);
                updatedCourse[0]._id.toString().should.be.equal(course._id.toString());
                updatedCourse[0].lectures.should.be.instanceOf(Array).and.have.lengthOf(course.lectures.length + 1);
            }
        }));
        it('should import courses', () => __awaiter(this, void 0, void 0, function* () {
            const coursesDirectory = 'build/fixtures/courses/';
            const coursefixtures = fs.readdirSync(coursesDirectory);
            for (const courseFilePath of coursefixtures) {
                const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
                const courseFile = fs.readFileSync(coursesDirectory + courseFilePath);
                const course = JSON.parse(courseFile.toString());
                let courseJson;
                const importResult = yield chai.request(app)
                    .post(`${BASE_URL}/course`)
                    .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                    .attach('file', courseFile, courseFilePath)
                    .catch((err) => err.response);
                importResult.status.should.be.equal(200, 'failed to import ' + course.name +
                    ' -> ' + importResult.body.message);
                courseJson = importResult.body;
                should.exist(importResult.body.createdAt);
                should.exist(importResult.body.__v);
                should.exist(importResult.body.updatedAt);
                should.exist(courseJson._id);
                courseJson.active.should.be.equal(false);
                courseJson.courseAdmin.should.be.equal(teacher._id.toString());
                courseJson.name.startsWith(course.name).should.be.equal(true);
                courseJson.description.should.be.equal(course.description);
                courseJson.lectures.should.be.instanceOf(Array).and.have.lengthOf(course.lectures.length);
                // Test optional params
                if (course.accessKey) {
                    courseJson.accessKey.should.be.equal(course.accessKey);
                }
            }
        }));
    }));
}));

//# sourceMappingURL=../../maps/test/controllers/import.js.map
