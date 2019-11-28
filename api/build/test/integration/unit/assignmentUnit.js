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
const fs = require("fs");
const path = require("path");
const chai = require("chai");
const chaiHttp = require("chai-http");
const server_1 = require("../../../src/server");
const FixtureLoader_1 = require("../../../fixtures/FixtureLoader");
const JwtUtils_1 = require("../../../src/security/JwtUtils");
const User_1 = require("../../../src/models/User");
const Lecture_1 = require("../../../src/models/Lecture");
const Course_1 = require("../../../src/models/Course");
const FixtureUtils_1 = require("../../../fixtures/FixtureUtils");
const Unit_1 = require("../../../src/models/units/Unit");
const File_1 = require("../../../src/models/mediaManager/File");
chai.use(chaiHttp);
const should = chai.should();
const app = new server_1.Server().app;
const BASE_URL = '/api/units';
const fixtureLoader = new FixtureLoader_1.FixtureLoader();
describe(`AssignmentUnit ${BASE_URL}`, () => {
    // Before each test we reset the database
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield fixtureLoader.load();
    }));
    describe(`GET ${BASE_URL}`, () => {
        it('should get an assignment unit', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findOne({ __t: 'assignment' });
            const lecture = yield Lecture_1.Lecture.findOne({ units: { $in: [unit._id] } });
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const courseAdmin = yield User_1.User.findOne({ _id: course.courseAdmin });
            const res = yield chai.request(app)
                .get(BASE_URL + '/' + unit._id)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseAdmin)}`)
                .send({ id: unit.id });
            res.status.should.be.equal(200);
        }));
    });
    describe(`POST / DELETE / UPDATE ${BASE_URL}/:id/assignments`, () => {
        it('should create an assignment in an assignment unit', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findOne({ __t: 'assignment' });
            const lecture = yield Lecture_1.Lecture.findOne({ units: { $in: [unit._id] } });
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const courseStudent = yield FixtureUtils_1.FixtureUtils.getRandomStudentForCourse(course);
            const res = yield chai.request(app)
                .post(`${BASE_URL}/${unit._id}/assignment`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseStudent)}`)
                .send({ id: unit.id });
            res.status.should.be.equal(200);
            res.body.user.should.be.equal(courseStudent._id.toString());
        }));
        it('should update an assignment in an assignment unit', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findOne({ __t: 'assignment' });
            const lecture = yield Lecture_1.Lecture.findOne({ units: { $in: [unit._id] } });
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const courseStudent = yield FixtureUtils_1.FixtureUtils.getRandomStudentForCourse(course);
            const assignment = {
                _id: null,
                files: [],
                user: courseStudent._id,
                submitted: false,
                checked: -1,
                submittedDate: new Date()
            };
            unit.assignments.push(assignment);
            yield unit.save();
            assignment.submitted = true;
            const res = yield chai.request(app)
                .put(`${BASE_URL}/${unit._id}/assignment`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseStudent)}`)
                .send(assignment);
            res.status.should.be.equal(200);
        }));
        it('should delete an assignment in an assignment unit', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findOne({ __t: 'assignment' });
            const lecture = yield Lecture_1.Lecture.findOne({ units: { $in: [unit._id] } });
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const courseStudent = yield FixtureUtils_1.FixtureUtils.getRandomStudentForCourse(course);
            const assignment = {
                _id: null,
                files: [],
                user: courseStudent._id,
                submitted: false,
                checked: -1,
                submittedDate: new Date()
            };
            unit.assignments.push(assignment);
            yield unit.save();
            const res = yield chai.request(app)
                .del(`${BASE_URL}/${unit._id}/assignment`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseStudent)}`)
                .send(assignment);
            res.status.should.be.equal(200);
            const unitAfter = yield Unit_1.Unit.findById(unit._id.toString());
            const hasBeenRemoved = unitAfter.assignments.length < unit.assignments.length;
            hasBeenRemoved.should.be.true;
        }));
    });
    describe('Assignment file tests' /* `POST / DELETE / UPDATE ${BASE_URL}/:id/assignment/files`*/, () => __awaiter(this, void 0, void 0, function* () {
        it('should add a file to an assignment', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findOne({ __t: 'assignment' });
            const lecture = yield Lecture_1.Lecture.findOne({ units: { $in: [unit._id] } });
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const courseStudent = yield FixtureUtils_1.FixtureUtils.getRandomStudentForCourse(course);
            const assignment = {
                _id: null,
                files: [],
                user: courseStudent._id,
                submitted: false,
                checked: -1,
                submittedDate: new Date()
            };
            unit.assignments.push(assignment);
            yield unit.save();
            const res = yield chai.request(app)
                .put(`${BASE_URL}/${unit._id}/assignment/files`)
                .attach('file', fs.readFileSync('fixtures/binaryData/testvideo.mp4'), 'testvideo.mp4')
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseStudent)}`);
            res.status.should.be.equal(200);
        }));
        it('should not add a file to an assignment if already has been submitted', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findOne({ __t: 'assignment' });
            const lecture = yield Lecture_1.Lecture.findOne({ units: { $in: [unit._id] } });
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const courseStudent = yield FixtureUtils_1.FixtureUtils.getRandomStudentForCourse(course);
            const assignment = {
                _id: null,
                files: [],
                user: courseStudent._id,
                submitted: true,
                checked: -1,
                submittedDate: new Date()
            };
            unit.assignments.push(assignment);
            yield unit.save();
            const res = yield chai.request(app)
                .put(`${BASE_URL}/${unit._id}/assignment/files`)
                .attach('file', fs.readFileSync('fixtures/binaryData/small-image.jpg'), 'testvideo.mp4')
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseStudent)}`);
            res.status.should.be.equal(400);
        }));
        it('should download all files from an assignment', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findOne({ __t: 'assignment' });
            const lecture = yield Lecture_1.Lecture.findOne({ units: { $in: [unit._id] } });
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const courseStudent = yield FixtureUtils_1.FixtureUtils.getRandomStudentForCourse(course);
            const courseTeacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
            fs.copyFileSync(path.resolve('fixtures/binaryData/small-image.jpg'), path.resolve('uploads/small-image.jpg'));
            const fileMetadata = new File_1.File({
                name: 'small-image.jpg',
                physicalPath: path.resolve('uploads/small-image.jpg'),
                link: 'small-image.jpg',
                size: 0,
                mimeType: 'its-a-video'
            });
            const file = yield new File_1.File(fileMetadata).save();
            const assignment = {
                _id: null,
                user: courseStudent._id,
                submitted: true,
                files: [file],
                checked: -1,
                submittedDate: new Date()
            };
            unit.assignments.push(assignment);
            yield unit.save();
            const res = yield chai.request(app)
                .get(`${BASE_URL}/${unit._id}/assignments/files`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseTeacher)}`)
                .send();
            res.status.should.be.equal(200);
            fs.unlinkSync(path.resolve('uploads/small-image.jpg'));
        }));
        it('should download files from a single assignment', () => __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findOne({ __t: 'assignment' });
            const lecture = yield Lecture_1.Lecture.findOne({ units: { $in: [unit._id] } });
            const course = yield Course_1.Course.findOne({ lectures: { $in: [lecture._id] } });
            const courseStudent = yield FixtureUtils_1.FixtureUtils.getRandomStudentForCourse(course);
            const courseTeacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
            fs.copyFileSync(path.resolve('fixtures/binaryData/small-image.jpg'), path.resolve('uploads/small-image.jpg'));
            const fileMetadata = new File_1.File({
                name: 'small-image.jpg',
                physicalPath: path.resolve('uploads/small-image.jpg'),
                link: 'small-image.jpg',
                size: 0,
                mimeType: 'its-a-video'
            });
            const file = yield new File_1.File(fileMetadata).save();
            const assignment = {
                _id: null,
                user: courseStudent._id,
                submitted: true,
                files: [file],
                checked: -1,
                submittedDate: new Date()
            };
            unit.assignments.push(assignment);
            yield unit.save();
            const res = yield chai.request(app)
                .get(`${BASE_URL}/${unit._id}/assignments/${courseStudent._id}/files`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(courseTeacher)}`)
                .send();
            res.status.should.be.equal(200);
            fs.unlinkSync(path.resolve('uploads/small-image.jpg'));
        }));
    }));
});

//# sourceMappingURL=../../../maps/test/integration/unit/assignmentUnit.js.map
