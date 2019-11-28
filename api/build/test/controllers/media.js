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
const server_1 = require("../../src/server");
const chai = require("chai");
const chaiHttp = require("chai-http");
const TestHelper_1 = require("../TestHelper");
const FixtureUtils_1 = require("../../fixtures/FixtureUtils");
const JwtUtils_1 = require("../../src/security/JwtUtils");
const Directory_1 = require("../../src/models/mediaManager/Directory");
const File_1 = require("../../src/models/mediaManager/File");
const Course_1 = require("../../src/models/Course");
const main_1 = require("../../src/config/main");
const fs = require("fs");
chai.use(chaiHttp);
const should = chai.should();
const app = new server_1.Server().app;
const BASE_URL = '/api/media';
const testHelper = new TestHelper_1.TestHelper(BASE_URL);
/**
 * Common unit test setup helper function.
 */
function commonSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        const course = yield FixtureUtils_1.FixtureUtils.getRandomCourse();
        const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacherForCourse(course);
        return { course, teacher };
    });
}
describe('Media', () => __awaiter(this, void 0, void 0, function* () {
    beforeEach(() => testHelper.resetForNextTest());
    describe(`GET ${BASE_URL}`, () => __awaiter(this, void 0, void 0, function* () {
        function commonGetSetup(withDirectories = true) {
            return __awaiter(this, void 0, void 0, function* () {
                const { course, teacher } = yield commonSetup();
                const file = yield new File_1.File({
                    _course: course._id.toString(),
                    name: 'root',
                    link: 'test/a',
                    size: 129
                }).save();
                const subDirectory = withDirectories && (yield new Directory_1.Directory({
                    _course: course._id.toString(),
                    name: 'sub'
                }).save());
                const rootDirectory = withDirectories && (yield new Directory_1.Directory({
                    _course: course._id.toString(),
                    name: 'root',
                    subDirectories: [subDirectory],
                    files: [file]
                }).save());
                return { course, teacher, file, subDirectory, rootDirectory };
            });
        }
        it('should get a directory', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, file, subDirectory, rootDirectory } = yield commonGetSetup(true);
            const result = yield testHelper.commonUserGetRequest(teacher, `/directory/${rootDirectory.id}`);
            result.status.should.be.equal(200, 'could not get directory' +
                ' -> ' + result.body.message);
            result.body.name.should.equal(rootDirectory.name);
            result.body.subDirectories.should.be.instanceOf(Array)
                .and.have.lengthOf(1)
                .and.contains(subDirectory.id);
            result.body.files.should.be.instanceOf(Array)
                .and.have.lengthOf(1)
                .and.contains(file.id);
        }));
        it('should fail to get a directory for an unauthorized user', () => __awaiter(this, void 0, void 0, function* () {
            const { course, rootDirectory } = yield commonGetSetup(true);
            const unauthorizedUser = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const result = yield testHelper.commonUserGetRequest(unauthorizedUser, `/directory/${rootDirectory.id}`);
            result.status.should.be.equal(403);
        }));
        it('should get a populated directory', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, file, subDirectory, rootDirectory } = yield commonGetSetup(true);
            const result = yield testHelper.commonUserGetRequest(teacher, `/directory/${rootDirectory.id}/lazy`);
            result.status.should.be.equal(200, 'could not get directory' +
                ' -> ' + result.body.message);
            result.body._id.should.be.equal(rootDirectory.id);
            result.body.name.should.equal(rootDirectory.name);
            result.body.subDirectories.should.be.instanceOf(Array)
                .and.have.lengthOf(1);
            result.body.subDirectories[0]._id.should.be.equal(subDirectory.id);
            result.body.subDirectories[0].name.should.be.equal(subDirectory.name);
            result.body.subDirectories[0].subDirectories.should.be.instanceOf(Array)
                .and.have.lengthOf(subDirectory.subDirectories.length);
            result.body.subDirectories[0].files.should.be.instanceOf(Array)
                .and.have.lengthOf(subDirectory.files.length);
            result.body.files.should.be.instanceOf(Array)
                .and.have.lengthOf(1);
            result.body.files[0]._id.should.be.equal(file.id);
            result.body.files[0].name.should.be.equal(file.name);
            result.body.files[0].size.should.be.equal(file.size);
            result.body.files[0].link.should.be.equal(file.link);
        }));
        it('should fail to get a populated directory for an unauthorized user', () => __awaiter(this, void 0, void 0, function* () {
            const { course, rootDirectory } = yield commonGetSetup(true);
            const unauthorizedUser = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const result = yield testHelper.commonUserGetRequest(unauthorizedUser, `/directory/${rootDirectory.id}/lazy`);
            result.status.should.be.equal(403);
        }));
        it('should get a file', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, file } = yield commonGetSetup(false);
            const result = yield testHelper.commonUserGetRequest(teacher, `/file/${file.id}`);
            result.status.should.be.equal(200, 'could not get file' +
                ' -> ' + result.body.message);
            result.body._id.should.be.equal(file.id);
            result.body.name.should.be.equal(file.name);
            result.body.size.should.be.equal(file.size);
            result.body.link.should.be.equal(file.link);
        }));
        it('should fail to get a file for an unauthorized user', () => __awaiter(this, void 0, void 0, function* () {
            const { course, file } = yield commonGetSetup(false);
            const unauthorizedUser = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const result = yield testHelper.commonUserGetRequest(unauthorizedUser, `/file/${file.id}`);
            result.status.should.be.equal(403);
        }));
    }));
    describe(`POST ${BASE_URL}`, () => __awaiter(this, void 0, void 0, function* () {
        function commonPostSetup() {
            return __awaiter(this, void 0, void 0, function* () {
                const { course, teacher } = yield commonSetup();
                const subDirectory = yield new Directory_1.Directory({
                    name: 'sub'
                });
                const rootDirectory = new Directory_1.Directory({
                    _course: course._id.toString(),
                    name: 'root'
                });
                return { course, teacher, subDirectory, rootDirectory };
            });
        }
        it('should create a root directory', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, rootDirectory } = yield commonPostSetup();
            const result = yield testHelper.commonUserPostRequest(teacher, '/directory', rootDirectory);
            result.status.should.be.equal(200, 'could not create root' +
                ' -> ' + result.body.message);
            result.body.__v.should.equal(0);
            result.body.name.should.equal(rootDirectory.name);
            result.body.subDirectories.should.be.instanceOf(Array)
                .and.have.lengthOf(0);
            result.body.files.should.be.instanceOf(Array).and.lengthOf(0);
        }));
        it('should fail to create a root directory for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const { course, rootDirectory } = yield commonPostSetup();
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const result = yield testHelper.commonUserPostRequest(unauthorizedTeacher, '/directory', rootDirectory);
            result.status.should.be.equal(403);
        }));
        it('should create a sub directory', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, rootDirectory, subDirectory } = yield commonPostSetup();
            yield rootDirectory.save();
            const result = yield testHelper.commonUserPostRequest(teacher, `/directory/${rootDirectory._id}`, subDirectory);
            result.status.should.be.equal(200, 'could not create subdirectory' +
                ' -> ' + result.body.message);
            result.body.__v.should.equal(0);
            result.body.name.should.equal(subDirectory.name);
            result.body.subDirectories.should.be.instanceOf(Array)
                .and.have.lengthOf(0);
            result.body.files.should.be.instanceOf(Array)
                .and.lengthOf(0);
            const updatedRoot = (yield Directory_1.Directory.findById(rootDirectory));
            updatedRoot.subDirectories.should.be.instanceOf(Array)
                .and.have.lengthOf(1)
                .and.contains(result.body._id);
        }));
        it('should fail to create a sub directory for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const { course, rootDirectory, subDirectory } = yield commonPostSetup();
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            yield rootDirectory.save();
            const result = yield testHelper.commonUserPostRequest(unauthorizedTeacher, `/directory/${rootDirectory._id}`, subDirectory);
            result.status.should.be.equal(403);
        }));
        it('should upload a file', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, rootDirectory } = yield commonPostSetup();
            yield rootDirectory.save();
            const testFileName = 'test_file.txt';
            const testFile = fs.readFileSync('./test/resources/' + testFileName);
            const result = yield chai.request(app)
                .post(`${BASE_URL}/file/${rootDirectory._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                .attach('file', testFile, testFileName)
                .catch((err) => err.response);
            result.status.should.be.equal(200, 'could not upload file' +
                ' -> ' + result.body.message);
            result.body.__v.should.equal(0);
            should.exist(result.body._id);
            should.exist(result.body.mimeType);
            should.exist(result.body.size);
            should.exist(result.body.link);
            result.body.name.should.be.equal(testFileName);
            const updatedRoot = (yield Directory_1.Directory.findById(rootDirectory));
            updatedRoot.files.should.be.instanceOf(Array)
                .and.have.lengthOf(1)
                .and.contains(result.body._id);
        }));
        it('should upload a file without extension', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, rootDirectory } = yield commonPostSetup();
            yield rootDirectory.save();
            const testFileName = 'test_file_without_extension';
            const testFile = fs.readFileSync('./test/resources/' + testFileName);
            const result = yield chai.request(app)
                .post(`${BASE_URL}/file/${rootDirectory._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(teacher)}`)
                .attach('file', testFile, testFileName)
                .catch((err) => err.response);
            result.status.should.be.equal(200, 'could not upload file' +
                ' -> ' + result.body.message);
            result.body.__v.should.equal(0);
            should.exist(result.body._id);
            should.exist(result.body.mimeType);
            should.exist(result.body.size);
            should.exist(result.body.link);
            result.body.name.should.be.equal(testFileName);
            const updatedRoot = (yield Directory_1.Directory.findById(rootDirectory));
            updatedRoot.files.should.be.instanceOf(Array)
                .and.have.lengthOf(1)
                .and.contains(result.body._id);
        }));
        it('should fail to upload a file for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const { course, rootDirectory } = yield commonPostSetup();
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            yield rootDirectory.save();
            const testFileName = 'test_file.txt';
            const testFile = fs.readFileSync('./test/resources/' + testFileName);
            const result = yield chai.request(app)
                .post(`${BASE_URL}/file/${rootDirectory._id}`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(unauthorizedTeacher)}`)
                .attach('file', testFile, testFileName)
                .catch((err) => err.response);
            result.status.should.be.equal(403);
        }));
    }));
    describe(`PUT ${BASE_URL}`, () => __awaiter(this, void 0, void 0, function* () {
        function commonPutSetup() {
            return __awaiter(this, void 0, void 0, function* () {
                const { course, teacher } = yield commonSetup();
                const file = new File_1.File({
                    _course: course._id.toString(),
                    name: 'file',
                    link: 'test/a',
                    size: 129
                });
                const subDirectory = yield new Directory_1.Directory({
                    _course: course._id.toString(),
                    name: 'sub'
                });
                const rootDirectory = new Directory_1.Directory({
                    _course: course._id.toString(),
                    name: 'root'
                });
                return { course, teacher, file, subDirectory, rootDirectory };
            });
        }
        it('should rename a directory', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, rootDirectory } = yield commonPutSetup();
            yield rootDirectory.save();
            const renamedDirectory = rootDirectory;
            renamedDirectory.name = 'renamedRoot';
            const result = yield testHelper.commonUserPutRequest(teacher, `/directory/${rootDirectory._id}`, renamedDirectory);
            result.status.should.be.equal(200, 'could not rename directory' +
                ' -> ' + result.body.message);
            result.body._id.should.equal(rootDirectory.id);
            result.body.name.should.equal(renamedDirectory.name);
            result.body.subDirectories.should.be.instanceOf(Array)
                .and.have.lengthOf(rootDirectory.subDirectories.length);
            result.body.files.should.be.instanceOf(Array)
                .and.lengthOf(rootDirectory.files.length);
        }));
        it('should fail to update a directory for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const { course, rootDirectory } = yield commonPutSetup();
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            yield rootDirectory.save();
            const renamedDirectory = rootDirectory;
            renamedDirectory.name = 'renamedRoot';
            const result = yield testHelper.commonUserPutRequest(unauthorizedTeacher, `/directory/${rootDirectory._id}`, renamedDirectory);
            result.status.should.be.equal(403);
        }));
        it('should fail to change the course of a directory to an unauthorized one', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, rootDirectory } = yield commonPutSetup();
            yield rootDirectory.save();
            const otherCourse = new Course_1.Course({ name: 'Unauthorized Test Course' });
            yield otherCourse.save();
            const changedDirectory = rootDirectory;
            changedDirectory._course = otherCourse._id.toString();
            const result = yield testHelper.commonUserPutRequest(teacher, `/directory/${rootDirectory._id}`, changedDirectory);
            result.status.should.be.equal(403);
        }));
        it('should rename a file', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, file } = yield commonPutSetup();
            yield file.save();
            const renamedFile = file;
            file.name = 'renamedFile';
            const result = yield testHelper.commonUserPutRequest(teacher, `/file/${file._id}`, renamedFile);
            result.status.should.be.equal(200, 'could not rename file' +
                ' -> ' + result.body.message);
            result.body._id.should.equal(file.id);
            result.body.name.should.equal(renamedFile.name);
            result.body.link.should.equal(file.link);
            result.body.size.should.equal(file.size);
        }));
        it('should fail to update a file for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const { course, file } = yield commonPutSetup();
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            yield file.save();
            const renamedFile = file;
            file.name = 'renamedFile';
            const result = yield testHelper.commonUserPutRequest(unauthorizedTeacher, `/file/${file._id}`, renamedFile);
            result.status.should.be.equal(403);
        }));
        it('should fail to change the course of a file to an unauthorized one', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, file } = yield commonPutSetup();
            yield file.save();
            const otherCourse = new Course_1.Course({ name: 'Unauthorized Test Course' });
            yield otherCourse.save();
            const changedFile = file;
            changedFile._course = otherCourse._id.toString();
            const result = yield testHelper.commonUserPutRequest(teacher, `/file/${file._id}`, changedFile);
            result.status.should.be.equal(403);
        }));
    }));
    describe(`DELETE ${BASE_URL}`, () => __awaiter(this, void 0, void 0, function* () {
        function commonDeleteSetup() {
            return __awaiter(this, void 0, void 0, function* () {
                const { course, teacher } = yield commonSetup();
                const subDirectory = yield new Directory_1.Directory({
                    _course: course._id.toString(),
                    name: 'sub'
                }).save();
                const rootDirectory = yield new Directory_1.Directory({
                    _course: course._id.toString(),
                    name: 'root',
                    subDirectories: [subDirectory],
                }).save();
                return { course, teacher, subDirectory, rootDirectory };
            });
        }
        function commonDeleteFileSetup(withRootDirectory = true) {
            return __awaiter(this, void 0, void 0, function* () {
                const { course, teacher } = yield commonSetup();
                const testFileName = fs.readdirSync('./')[0];
                const testFile = fs.readFileSync(testFileName);
                fs.copyFileSync(testFileName, main_1.default.uploadFolder + '/test.file');
                const file = yield new File_1.File({
                    _course: course._id.toString(),
                    name: 'root',
                    physicalPath: main_1.default.uploadFolder + '/test.file',
                    link: testFileName,
                    size: testFile.length
                }).save();
                const rootDirectory = withRootDirectory && (yield new Directory_1.Directory({
                    _course: course._id.toString(),
                    name: 'root',
                    files: [file]
                }).save());
                return { course, teacher, file, rootDirectory };
            });
        }
        it('should delete a directory', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, rootDirectory } = yield commonDeleteSetup();
            const result = yield testHelper.commonUserDeleteRequest(teacher, `/directory/${rootDirectory._id}`);
            result.status.should.be.equal(200, 'could not delete directory' +
                ' -> ' + result.body.message);
            should.not.exist(yield Directory_1.Directory.findById(rootDirectory));
        }));
        it('should delete a directory and its subdirectories', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, subDirectory, rootDirectory } = yield commonDeleteSetup();
            const result = yield testHelper.commonUserDeleteRequest(teacher, `/directory/${rootDirectory._id}`);
            result.status.should.be.equal(200, 'could not delete directory' +
                ' -> ' + result.body.message);
            should.not.exist(yield Directory_1.Directory.findById(rootDirectory));
            should.not.exist(yield Directory_1.Directory.findById(subDirectory));
        }));
        it('should delete a directory and its files', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, file, rootDirectory } = yield commonDeleteFileSetup(true);
            const result = yield testHelper.commonUserDeleteRequest(teacher, `/directory/${rootDirectory._id}`);
            result.status.should.be.equal(200, 'could not delete directory' +
                ' -> ' + result.body.message);
            should.not.exist(yield Directory_1.Directory.findById(rootDirectory));
            should.not.exist(yield File_1.File.findById(file));
        }));
        it('should delete a file', () => __awaiter(this, void 0, void 0, function* () {
            const { teacher, file } = yield commonDeleteFileSetup(false);
            const result = yield testHelper.commonUserDeleteRequest(teacher, `/file/${file._id}`);
            result.status.should.be.equal(200, 'could not delete file' +
                ' -> ' + result.body.message);
            should.not.exist(yield File_1.File.findById(file));
            fs.existsSync(main_1.default.uploadFolder + '/test.file').should.be.equal(false);
        }));
        it('should fail to delete a directory for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const { course, rootDirectory } = yield commonDeleteSetup();
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const result = yield testHelper.commonUserDeleteRequest(unauthorizedTeacher, `/directory/${rootDirectory._id}`);
            result.status.should.be.equal(403);
        }));
        it('should fail to delete a file for an unauthorized teacher', () => __awaiter(this, void 0, void 0, function* () {
            const { course, file } = yield commonDeleteFileSetup(false);
            const unauthorizedTeacher = yield FixtureUtils_1.FixtureUtils.getUnauthorizedTeacherForCourse(course);
            const result = yield testHelper.commonUserDeleteRequest(unauthorizedTeacher, `/file/${file._id}`);
            result.status.should.be.equal(403);
        }));
        it('should fail when directory not found', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const result = yield testHelper.commonUserDeleteRequest(teacher, '/directory/507f1f77bcf86cd799439011');
            result.status.should.be.equal(404);
        }));
        it('should fail when file not found', () => __awaiter(this, void 0, void 0, function* () {
            const teacher = yield FixtureUtils_1.FixtureUtils.getRandomTeacher();
            const result = yield testHelper.commonUserDeleteRequest(teacher, '/file/507f1f77bcf86cd799439011');
            result.status.should.be.equal(404);
        }));
    }));
}));

//# sourceMappingURL=../../maps/test/controllers/media.js.map
