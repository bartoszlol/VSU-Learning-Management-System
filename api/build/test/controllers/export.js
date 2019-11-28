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
const Course_1 = require("../../src/models/Course");
const User_1 = require("../../src/models/User");
const Lecture_1 = require("../../src/models/Lecture");
const Unit_1 = require("../../src/models/units/Unit");
const NotificationSettings_1 = require("../../src/models/NotificationSettings");
const Notification_1 = require("../../src/models/Notification");
const WhitelistUser_1 = require("../../src/models/WhitelistUser");
chai.use(chaiHttp);
const should = chai.should();
const expect = chai.expect;
const BASE_URL = '/api/export';
const testHelper = new TestHelper_1.TestHelper(BASE_URL);
/**
 * Provides simple shared setup functionality used by the export access denial unit tests.
 *
 * @returns A course with at least one unit/lecture and an unauthorizedTeacher (i.e. a teacher that isn't part of the course).
 */
function exportAccessDenialSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        const course = yield FixtureUtils_1.FixtureUtils.getRandomCourseWithAllUnitTypes();
        const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
        return { course, unauthorizedTeacher };
    });
}
function testNotFound(what) {
    return __awaiter(this, void 0, void 0, function* () {
        const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
        const result = yield testHelper.commonUserGetRequest(admin, `/${what}/000000000000000000000000`);
        result.status.should.be.equal(404);
    });
}
describe('Export', () => __awaiter(this, void 0, void 0, function* () {
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield testHelper.resetForNextTest();
    }));
    describe(`GET ${BASE_URL}`, () => __awaiter(this, void 0, void 0, function* () {
        it('should export units', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const units = yield Unit_1.Unit.find();
            for (const unit of units) {
                let unitJson;
                const exportResult = yield testHelper.commonUserGetRequest(admin, `/unit/${unit._id}`);
                exportResult.status.should.be.equal(200, 'failed to export ' + unit.name);
                unitJson = exportResult.body;
                should.not.exist(exportResult.body.createdAt);
                should.not.exist(exportResult.body.__v);
                should.not.exist(exportResult.body.updatedAt);
                should.not.exist(unitJson._id);
                // TODO: share this check since it is the same one as in import.ts
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
                // TODO: Do not use any cast
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
                        process.stderr.write('export for "' + unit.type + '" is not completly tested');
                        break;
                }
            }
        }));
        it('should export lectures', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const lectures = yield Lecture_1.Lecture.find();
            for (const lecture of lectures) {
                let lectureJson;
                const exportResult = yield testHelper.commonUserGetRequest(admin, `/lecture/${lecture._id}`);
                exportResult.status.should.be.equal(200, 'failed to export ' + lecture.name);
                lectureJson = exportResult.body;
                should.not.exist(exportResult.body.createdAt);
                should.not.exist(exportResult.body.__v);
                should.not.exist(exportResult.body.updatedAt);
                should.not.exist(lectureJson._id);
                lectureJson.name.should.be.equal(lecture.name);
                lectureJson.description.should.be.equal(lecture.description);
                lectureJson.units.should.be.instanceOf(Array).and.have.lengthOf(lecture.units.length);
            }
        }));
        it('should export courses', () => __awaiter(this, void 0, void 0, function* () {
            const courses = yield Course_1.Course.find();
            for (const course of courses) {
                const teacher = yield User_1.User.findById(course.courseAdmin);
                let courseJson;
                const exportResult = yield testHelper.commonUserGetRequest(teacher, `/course/${course._id}`);
                exportResult.status.should.be.equal(200, 'failed to export ' + course.name);
                courseJson = exportResult.body;
                should.not.exist(exportResult.body.createdAt);
                should.not.exist(exportResult.body.__v);
                should.not.exist(exportResult.body.updatedAt);
                should.not.exist(courseJson._id);
                should.not.exist(courseJson.courseAdmin);
                should.not.exist(courseJson.teachers);
                should.not.exist(courseJson.students);
                should.not.exist(courseJson.whitelist);
                courseJson.name.should.be.equal(course.name);
                courseJson.description.should.be.equal(course.description);
                courseJson.lectures.should.be.instanceOf(Array).and.have.lengthOf(course.lectures.length);
            }
        }));
        it('should forbid unit export for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const { course, unauthorizedTeacher } = yield exportAccessDenialSetup();
            const unit = yield FixtureUtils_1.FixtureUtils.getRandomUnitFromCourse(course);
            const result = yield testHelper.commonUserGetRequest(unauthorizedTeacher, `/unit/${unit._id}`);
            result.status.should.be.equal(403);
        }));
        it('should forbid lecture export for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const { course, unauthorizedTeacher } = yield exportAccessDenialSetup();
            const lecture = yield FixtureUtils_1.FixtureUtils.getRandomLectureFromCourse(course);
            const result = yield testHelper.commonUserGetRequest(unauthorizedTeacher, `/lecture/${lecture._id}`);
            result.status.should.be.equal(403);
        }));
        it('should forbid course export for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const { course, unauthorizedTeacher } = yield exportAccessDenialSetup();
            const result = yield testHelper.commonUserGetRequest(unauthorizedTeacher, `/course/${course._id}`);
            result.status.should.be.equal(403);
        }));
        it('should respond with 404 for a unit id that doesn\'t exist', () => __awaiter(this, void 0, void 0, function* () { return yield testNotFound('unit'); }));
        it('should respond with 404 for a lecture id that doesn\'t exist', () => __awaiter(this, void 0, void 0, function* () { return yield testNotFound('lecture'); }));
        it('should respond with 404 for a course id that doesn\'t exist', () => __awaiter(this, void 0, void 0, function* () { return yield testNotFound('course'); }));
    }));
    describe(`GET ${BASE_URL}/user`, () => __awaiter(this, void 0, void 0, function* () {
        it('should export student data', () => __awaiter(this, void 0, void 0, function* () {
            const course1 = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const course2 = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
            const taskUnit = yield Unit_1.Unit.findOne({ progressable: true, __t: 'task' });
            const lecture = yield Lecture_1.Lecture.findOne({ units: { $in: [taskUnit._id] } });
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const student = yield User_1.User.findOne({ _id: { $in: course.students } });
            yield new NotificationSettings_1.NotificationSettings({
                'user': student, 'course': course1,
                'notificationType': NotificationSettings_1.API_NOTIFICATION_TYPE_ALL_CHANGES, 'emailNotification': false
            }).save();
            yield new NotificationSettings_1.NotificationSettings({
                'user': student, 'course': course2,
                'notificationType': NotificationSettings_1.API_NOTIFICATION_TYPE_ALL_CHANGES, 'emailNotification': false
            }).save();
            yield new Notification_1.Notification({
                user: student,
                changedCourse: course1,
                text: 'blubba blubba'
            }).save();
            yield new Notification_1.Notification({
                user: student,
                changedCourse: course2,
                text: 'blubba blubba'
            }).save();
            yield new WhitelistUser_1.WhitelistUser({
                firstName: student.profile.firstName,
                lastName: student.profile.lastName,
                uid: student.uid,
                courseId: course1._id
            }).save();
            const result = yield testHelper.commonUserGetRequest(student, `/user`);
            expect(result).to.have.status(200);
        }));
        it('should export teacher data', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const result = yield testHelper.commonUserGetRequest(teacher, `/user`);
            expect(result).to.have.status(200);
        }));
        it('should export admin data', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const result = yield testHelper.commonUserGetRequest(admin, `/user`);
            expect(result).to.have.status(200);
        }));
    }));
}));

//# sourceMappingURL=../../maps/test/controllers/export.js.map
