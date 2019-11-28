"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const routing_controllers_1 = require("routing-controllers");
const passportJwtMiddleware_1 = require("../security/passportJwtMiddleware");
const errorCodes_1 = require("../config/errorCodes");
const Course_1 = require("../models/Course");
const Lecture_1 = require("../models/Lecture");
const Unit_1 = require("../models/units/Unit");
const main_1 = require("../config/main");
const File_1 = require("../models/mediaManager/File");
const User_1 = require("../models/User");
const crypto = require("crypto");
const util_1 = require("util");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const uploadOptions = {
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, main_1.default.uploadFolder);
        },
        filename: (req, file, cb) => {
            crypto.pseudoRandomBytes(16, (err, raw) => {
                cb(err, err ? undefined : raw.toString('hex') + path.extname(file.originalname));
            });
        }
    }),
};
let UnitController = class UnitController {
    waitForArchiveToFinish(output, archive) {
        return new Promise((resolve, reject) => {
            output.on('close', () => {
                resolve();
            });
            archive.finalize();
        });
    }
    /**
     * @api {get} /api/units/:id Request unit
     * @apiName GetUnit
     * @apiGroup Unit
     *
     * @apiParam {String} id Unit ID.
     *
     * @apiSuccess {Unit} unit Unit.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6b60f72236d8e7c858",
     *         "updatedAt": "2017-11-08T22:00:11.500Z",
     *         "createdAt": "2017-11-08T22:00:11.500Z",
     *         "name": "What is Lorem Ipsum?",
     *         "description": "...",
     *         "markdown": "# What is Lorem Ipsum?\n**Lorem Ipsum** is simply dummy text of the printing and typesetting industry.",
     *         "_course": "5a037e6b60f72236d8e7c83b",
     *         "unitCreator": "5a037e6b60f72236d8e7c834",
     *         "type": "free-text",
     *         "__v": 0
     *     }
     *
     * @apiError NotFoundError
     * @apiError ForbiddenError
     */
    getUnit(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const unit = yield this.getUnitFor(id, currentUser, 'userCanViewCourse');
            return unit.toObject();
        });
    }
    /**
     * @api {post} /api/units/ Add unit
     * @apiName PostUnit
     * @apiGroup Unit
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {Object} file Uploaded file.
     * @apiParam {Object} data New unit data.
     *
     * @apiSuccess {Unit} unit Added unit.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6b60f72236d8e7c858",
     *         "updatedAt": "2017-11-08T22:00:11.500Z",
     *         "createdAt": "2017-11-08T22:00:11.500Z",
     *         "name": "What is Lorem Ipsum?",
     *         "description": "...",
     *         "markdown": "# What is Lorem Ipsum?\n**Lorem Ipsum** is simply dummy text of the printing and typesetting industry.",
     *         "_course": "5a037e6b60f72236d8e7c83b",
     *         "type": "free-text",
     *         "unitCreator": "5a037e6b60f72236d8e7c834",
     *         "__v": 0
     *     }
     *
     * @apiError BadRequestError Invalid combination of file upload and unit data.
     * @apiError BadRequestError No lecture ID was submitted.
     * @apiError BadRequestError No unit was submitted.
     * @apiError BadRequestError Unit has no _course set.
     * @apiError BadRequestError
     * @apiError ForbiddenError
     * @apiError ValidationError
     */
    addUnit(data, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            // discard invalid requests
            this.checkPostParam(data);
            const course = yield Course_1.Course.findById(data.model._course);
            if (!course.checkPrivileges(currentUser).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            // Set current user as creator, old unit's dont have a creator
            data.model.unitCreator = currentUser._id;
            try {
                const createdUnit = yield Unit_1.Unit.create(data.model);
                return yield this.pushToLecture(data.lectureId, createdUnit);
            }
            catch (err) {
                if (err.name === 'ValidationError') {
                    throw err;
                }
                else {
                    throw new routing_controllers_1.BadRequestError(err);
                }
            }
        });
    }
    /**
     * @api {put} /api/units/:id Update unit
     * @apiName PutUnit
     * @apiGroup Unit
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {Object} file Uploaded file.
     * @apiParam {String} id Unit ID.
     * @apiParam {Object} data New unit data.
     *
     * @apiSuccess {Unit} unit Updated unit.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6b60f72236d8e7c858",
     *         "updatedAt": "2018-01-29T23:43:07.220Z",
     *         "createdAt": "2017-11-08T22:00:11.500Z",
     *         "name": "What is Lorem Ipsum?",
     *         "description": "...",
     *         "markdown": "# What is Lorem Ipsum?\n**Lorem Ipsum** is simply dummy text of the printing and typesetting industry.",
     *         "_course": "5a037e6b60f72236d8e7c83b",
     *         "type": "free-text",
     *         "__v": 0
     *     }
     *
     * @apiError BadRequestError Invalid combination of file upload and unit data.
     * @apiError BadRequestError
     * @apiError NotFoundError
     * @apiError ForbiddenError
     * @apiError ValidationError
     */
    updateUnit(id, data, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const oldUnit = yield this.getUnitFor(id, currentUser, 'userCanEditCourse');
            try {
                oldUnit.set(data);
                const updatedUnit = yield oldUnit.save();
                return updatedUnit.toObject();
            }
            catch (err) {
                if (err.name === 'ValidationError') {
                    throw err;
                }
                else {
                    throw new routing_controllers_1.BadRequestError(err);
                }
            }
        });
    }
    /**
     * @api {delete} /api/units/:id Delete unit
     * @apiName DeleteUnit
     * @apiGroup Unit
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Unit ID.
     *
     * @apiSuccess {Object} result Empty object.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {}
     *
     * @apiError NotFoundError
     * @apiError ForbiddenError
     */
    deleteUnit(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const unit = yield this.getUnitFor(id, currentUser, 'userCanEditCourse');
            yield Lecture_1.Lecture.updateMany({}, { $pull: { units: id } });
            yield unit.remove();
            return {};
        });
    }
    getUnitFor(unitId, currentUser, privilege) {
        return __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findById(unitId).orFail(new routing_controllers_1.NotFoundError());
            const course = yield Course_1.Course.findById(unit._course);
            if (!course.checkPrivileges(currentUser)[privilege]) {
                throw new routing_controllers_1.ForbiddenError();
            }
            return unit;
        });
    }
    /**
     * @api {post} /api/units/:id/assignment Add assignment
     * @apiName PostAssignment
     * @apiGroup Unit
     * @apiPermission student
     *
     * @apiSuccess {IAssignment} assignment.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6b60f72236d8e7c858",
     *         "updatedAt": "2017-11-08T22:00:11.500Z",
     *         "createdAt": "2017-11-08T22:00:11.500Z",
     *         "name": "What is Lorem Ipsum?",
     *         "description": "...",
     *         "markdown": "# What is Lorem Ipsum?\n**Lorem Ipsum** is simply dummy text of the printing and typesetting industry.",
     *         "_course": "5a037e6b60f72236d8e7c83b",
     *         "type": "free-text",
     *         "unitCreator": "5a037e6b60f72236d8e7c834",
     *         "__v": 0
     *     }
     *
     * @apiError BadRequestError No lecture ID was submitted.
     * @apiError BadRequestError No unit was submitted.
     * @apiError BadRequestError Unit has no _course set.
     * @apiError BadRequestError
     * @apiError ValidationError
     */
    addAssignment(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const assignmentUnit = yield Unit_1.Unit.findById(id).orFail(new routing_controllers_1.NotFoundError());
            // TODO: check if user is in course.
            let assignment = assignmentUnit.assignments.find(submittedAssignment => {
                return submittedAssignment.user._id.toString() === currentUser._id;
            });
            if (!!assignment) {
                // The user has already created an assignment. We cannot create another one.
                throw new routing_controllers_1.BadRequestError();
            }
            try {
                assignment = {
                    _id: null,
                    files: [],
                    user: currentUser._id,
                    submitted: false,
                    checked: -1,
                    submittedDate: new Date()
                };
                assignmentUnit.assignments.push(assignment);
                yield assignmentUnit.save();
                return assignment;
            }
            catch (err) {
                throw new routing_controllers_1.BadRequestError(err);
            }
        });
    }
    /**
     * Is called when the user wants to add a file to the assignment.
     * The user can add as much file as she wants as long as the assignment is not finalized/submitted yet.
     *
     * @apiParam {String} unitId
     * @apiParam {Object} uploadedFile
     * @apiParam {IUser} currentUser
     *
     * @apiError NotFoundError The unit was not found or there isn't an assignment from the current user in the unit.
     */
    addFileToAssignment(unitId, uploadedFile, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const assignmentUnit = yield Unit_1.Unit.findById(unitId)
                .orFail(new routing_controllers_1.NotFoundError());
            const assignment = assignmentUnit.assignments.find(submittedAssignment => {
                return submittedAssignment.user._id.toString() === currentUser._id;
            });
            if (!assignment) {
                throw new routing_controllers_1.NotFoundError();
            }
            // The user already submitted/finalized the assignment.
            if (assignment.submitted) {
                throw new routing_controllers_1.BadRequestError();
            }
            const fileMetadata = new File_1.File({
                name: uploadedFile.originalname,
                physicalPath: uploadedFile.path,
                link: uploadedFile.filename,
                size: uploadedFile.size,
                mimeType: uploadedFile.mimetype,
            });
            try {
                const file = yield new File_1.File(fileMetadata).save();
                if (!assignment.files) {
                    assignment.files = [];
                }
                assignment.files.push(file._id);
                yield assignmentUnit.save();
                return file.toObject();
            }
            catch (error) {
                throw new routing_controllers_1.InternalServerError(error.message);
            }
        });
    }
    /**
     * @api {put} /api/units/:id/assignment Update assignment
     * @apiName PutUnit
     * @apiGroup Unit
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {Object} file Uploaded file.
     * @apiParam {String} id Unit ID.
     * @apiParam {Object} data New unit data.
     *
     * @apiSuccess {Unit} unit Updated unit.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6b60f72236d8e7c858",
     *         "updatedAt": "2018-01-29T23:43:07.220Z",
     *         "createdAt": "2017-11-08T22:00:11.500Z",
     *         "name": "What is Lorem Ipsum?",
     *         "description": "...",
     *         "markdown": "# What is Lorem Ipsum?\n**Lorem Ipsum** is simply dummy text of the printing and typesetting industry.",
     *         "_course": "5a037e6b60f72236d8e7c83b",
     *         "type": "free-text",
     *         "__v": 0
     *     }
     *
     * @apiError NotFoundError
     * @apiError BadRequestError Invalid combination of file upload and unit data.
     * @apiError BadRequestError
     * @apiError ValidationError
     */
    updateAssignment(id, data, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const assignmentUnit = yield Unit_1.Unit.findById(id).orFail(new routing_controllers_1.NotFoundError());
            let assignment = null;
            // The current user updates an assignment of a student.
            if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
                if (!data.user._id) {
                    throw new routing_controllers_1.BadRequestError();
                }
                assignment = assignmentUnit.assignments.find(submittedAssignment => `${submittedAssignment.user}` === data.user._id);
                assignment.checked = data.checked;
            }
            else {
                // A student updates her own assignment.
                // We can just retrieve the assignment where the author is the current user, as an user can
                // only have one assignment.
                assignment = assignmentUnit.assignments.find(submittedAssignment => `${submittedAssignment.user}` === currentUser._id);
                if (!assignment.submitted) {
                    // Update the submitted state of the assignment.
                    assignment.submitted = data.submitted;
                    assignment.submittedDate = new Date();
                }
            }
            try {
                yield assignmentUnit.save();
            }
            catch (err) {
                if (err.name === 'ValidationError') {
                    throw err;
                }
                else {
                    throw new routing_controllers_1.BadRequestError(err);
                }
            }
            return true;
        });
    }
    /**
     * @api {delete} /api/units/:id/assignment Delete assignment
     * @apiName DeleteAssginment
     * @apiGroup Unit
     * @apiPermission student
     *
     * @apiParam {String} id Unit ID.
     *
     * @apiSuccess {Boolean} result Confirmation of deletion.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "result": true
     *     }
     *
     * @apiError NotFoundError
     */
    deleteAssignment(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const assignmentUnit = yield Unit_1.Unit.findById(id);
            if (!assignmentUnit) {
                throw new routing_controllers_1.NotFoundError();
            }
            for (const assignment of assignmentUnit.assignments) {
                if (assignment.user._id.toString() === currentUser._id) {
                    if (assignment.submitted) {
                        throw new routing_controllers_1.BadRequestError();
                    }
                    const index = assignmentUnit.assignments.indexOf(assignment, 0);
                    assignmentUnit.assignments.splice(index, 1);
                    yield assignmentUnit.save();
                    return true;
                }
            }
        });
    }
    /**
     * @api {get} /api/units/:id/assignments/:assignment Request unit
     * @apiName GetUnit
     * @apiGroup Unit
     *
     * @apiParam {String} id Unit ID.
     * @apiParam {String} assignment Assignment id.
     *
     * @apiSuccess {Unit} unit Unit.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6b60f72236d8e7c858",
     *         "updatedAt": "2017-11-08T22:00:11.500Z",
     *         "createdAt": "2017-11-08T22:00:11.500Z",
     *         "name": "What is Lorem Ipsum?",
     *         "description": "...",
     *         "markdown": "# What is Lorem Ipsum?\n**Lorem Ipsum** is simply dummy text of the printing and typesetting industry.",
     *         "_course": "5a037e6b60f72236d8e7c83b",
     *         "unitCreator": "5a037e6b60f72236d8e7c834",
     *         "type": "free-text",
     *         "__v": 0
     *     }
     */
    downloadFilesOfSingleAssignment(id, userId, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const assignmentUnit = yield Unit_1.Unit.findById(id);
            if (!assignmentUnit) {
                throw new routing_controllers_1.NotFoundError();
            }
            const assignment = assignmentUnit.assignments.find(row => `${row.user._id}` === userId);
            if (!assignment.files.length) {
                return;
            }
            const user = yield User_1.User.findById(assignment.user);
            const filepath = `${main_1.default.tmpFileCacheFolder}${user.profile.lastName}_${assignmentUnit.name}.zip`;
            const output = fs.createWriteStream(filepath);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });
            archive.pipe(output);
            for (const fileMetadata of assignment.files) {
                const file = yield File_1.File.findById(fileMetadata);
                archive
                    .file(`uploads/${file.link}`, {
                    name: user.profile.lastName + '_' +
                        user.profile.firstName + '_' + file.name
                });
            }
            archive.on('error', () => {
                throw new routing_controllers_1.NotFoundError();
            });
            yield this.waitForArchiveToFinish(output, archive);
            response.status(200);
            response.setHeader('Connection', 'keep-alive');
            response.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            yield util_1.promisify(response.download.bind(response))(filepath);
            return response;
        });
    }
    /**
     * @api {get} /api/units/:id/assignments Request unit
     * @apiName GetUnit
     * @apiGroup Unit
     *
     * @apiParam {String} id Unit ID.
     *
     * @apiSuccess {Unit} unit Unit.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6b60f72236d8e7c858",
     *         "updatedAt": "2017-11-08T22:00:11.500Z",
     *         "createdAt": "2017-11-08T22:00:11.500Z",
     *         "name": "What is Lorem Ipsum?",
     *         "description": "...",
     *         "markdown": "# What is Lorem Ipsum?\n**Lorem Ipsum** is simply dummy text of the printing and typesetting industry.",
     *         "_course": "5a037e6b60f72236d8e7c83b",
     *         "unitCreator": "5a037e6b60f72236d8e7c834",
     *         "type": "free-text",
     *         "__v": 0
     *     }
     */
    getAllAssignments(id, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const assignmentUnit = yield Unit_1.Unit.findById(id);
            if (!assignmentUnit) {
                throw new routing_controllers_1.NotFoundError();
            }
            const filepath = main_1.default.tmpFileCacheFolder + assignmentUnit.name + '.zip';
            const output = fs.createWriteStream(filepath);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });
            archive.pipe(output);
            for (const assignment of assignmentUnit.assignments) {
                const user = yield User_1.User.findById(assignment.user);
                for (const fileMetadata of assignment.files) {
                    const file = yield File_1.File.findById(fileMetadata);
                    archive
                        .file(`uploads/${file.link}`, {
                        name: user.profile.lastName + '_' +
                            user.profile.firstName + '_' + file.name
                    });
                }
            }
            archive.on('error', () => {
                throw new routing_controllers_1.NotFoundError();
            });
            yield this.waitForArchiveToFinish(output, archive);
            response.setHeader('Connection', 'keep-alive');
            response.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            yield util_1.promisify(response.download.bind(response))(filepath);
            return response;
        });
    }
    pushToLecture(lectureId, unit) {
        return Lecture_1.Lecture.findById(lectureId)
            .then((lecture) => {
            lecture.units.push(unit);
            return lecture.save();
        })
            .then(() => {
            return unit.populateUnit();
        })
            .then((populatedUnit) => {
            return populatedUnit.toObject();
        })
            .catch((err) => {
            throw new routing_controllers_1.BadRequestError(err);
        });
    }
    checkPostParam(data) {
        if (!data.lectureId) {
            throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.unit.postMissingLectureId.text);
        }
        if (!data.model) {
            throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.unit.postMissingUnit.text);
        }
        if (!data.model._course) {
            throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.unit.postMissingCourse.text);
        }
    }
};
__decorate([
    routing_controllers_1.Get('/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnitController.prototype, "getUnit", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Post('/'),
    __param(0, routing_controllers_1.Body()), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UnitController.prototype, "addUnit", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Put('/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.Body()), __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UnitController.prototype, "updateUnit", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Delete('/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnitController.prototype, "deleteUnit", null);
__decorate([
    routing_controllers_1.Authorized(['student']),
    routing_controllers_1.Post('/:id/assignment'),
    __param(0, routing_controllers_1.Param('id')),
    __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnitController.prototype, "addAssignment", null);
__decorate([
    routing_controllers_1.Authorized(['student']),
    routing_controllers_1.Put('/:id/assignment/files'),
    __param(0, routing_controllers_1.Param('id')),
    __param(1, routing_controllers_1.UploadedFile('file', { options: uploadOptions })),
    __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UnitController.prototype, "addFileToAssignment", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin', 'student']),
    routing_controllers_1.Put('/:id/assignment'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.Body()), __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UnitController.prototype, "updateAssignment", null);
__decorate([
    routing_controllers_1.Authorized(['student']),
    routing_controllers_1.Delete('/:id/assignment'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnitController.prototype, "deleteAssignment", null);
__decorate([
    routing_controllers_1.Get('/:id/assignments/:user/files'),
    routing_controllers_1.Authorized(['teacher']),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.Param('user')), __param(2, routing_controllers_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UnitController.prototype, "downloadFilesOfSingleAssignment", null);
__decorate([
    routing_controllers_1.Get('/:id/assignments/files'),
    routing_controllers_1.Authorized(['teacher']),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnitController.prototype, "getAllAssignments", null);
UnitController = __decorate([
    routing_controllers_1.JsonController('/units'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default)
], UnitController);
exports.UnitController = UnitController;

//# sourceMappingURL=../../maps/src/controllers/UnitController.js.map
