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
const Directory_1 = require("../models/mediaManager/Directory");
const File_1 = require("../models/mediaManager/File");
const Course_1 = require("../models/Course");
const ExtractMongoId_1 = require("../utilities/ExtractMongoId");
const crypto = require("crypto");
const main_1 = require("../config/main");
const multer = require('multer');
const path = require('path');
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
let MediaController = class MediaController {
    getDirectory(directoryId, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const directory = yield Directory_1.Directory.findById(directoryId);
            yield this.checkCoursePrivilegesFor(directory, currentUser, 'userCanViewCourse');
            return directory.toObject();
        });
    }
    getDirectoryLazy(directoryId, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const directory = yield Directory_1.Directory.findById(directoryId)
                .populate('subDirectories')
                .populate('files');
            yield this.checkCoursePrivilegesFor(directory, currentUser, 'userCanViewCourse');
            return directory.toObject();
        });
    }
    getFile(fileId, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = yield File_1.File.findById(fileId);
            yield this.checkCoursePrivilegesFor(file, currentUser, 'userCanViewCourse');
            return file.toObject();
        });
    }
    createRootDirectory(directory, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkCoursePrivilegesFor(directory, currentUser, 'userCanEditCourse');
            const savedDirectory = yield new Directory_1.Directory(directory).save();
            return savedDirectory.toObject();
        });
    }
    createDirectory(parentDirectoryId, directory, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const parent = yield Directory_1.Directory.findById(parentDirectoryId);
            yield this.checkCoursePrivilegesFor(parent, currentUser, 'userCanEditCourse');
            directory._course = parent._course;
            const savedDirectory = yield new Directory_1.Directory(directory).save();
            parent.subDirectories.push(savedDirectory);
            yield parent.save();
            return savedDirectory.toObject();
        });
    }
    createFile(parentDirectoryId, uploadedFile, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const parent = yield Directory_1.Directory.findById(parentDirectoryId);
            yield this.checkCoursePrivilegesFor(parent, currentUser, 'userCanEditCourse');
            const file = new File_1.File({
                _course: parent._course,
                name: uploadedFile.originalname,
                physicalPath: uploadedFile.path,
                link: uploadedFile.filename,
                size: uploadedFile.size,
                mimeType: uploadedFile.mimetype,
            });
            const savedFile = yield new File_1.File(file).save();
            parent.files.push(savedFile);
            yield parent.save();
            return savedFile.toObject();
        });
    }
    updateDirectory(directoryId, updatedDirectory, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const directory = yield Directory_1.Directory.findById(directoryId);
            yield this.checkCoursePrivilegesFor(directory, currentUser, 'userCanEditCourse');
            if (ExtractMongoId_1.extractSingleMongoId(directory._course) !== ExtractMongoId_1.extractSingleMongoId(updatedDirectory._course)) {
                yield this.checkCoursePrivilegesFor(updatedDirectory, currentUser, 'userCanEditCourse');
            }
            directory.set(updatedDirectory);
            const savedDirectory = yield directory.save();
            return savedDirectory.toObject();
        });
    }
    updateFile(fileId, updatedFile, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = yield File_1.File.findById(fileId);
            yield this.checkCoursePrivilegesFor(file, currentUser, 'userCanEditCourse');
            if (ExtractMongoId_1.extractSingleMongoId(file._course) !== ExtractMongoId_1.extractSingleMongoId(updatedFile._course)) {
                yield this.checkCoursePrivilegesFor(updatedFile, currentUser, 'userCanEditCourse');
            }
            file.set(updatedFile);
            const savedFile = yield file.save();
            return savedFile.toObject();
        });
    }
    deleteDirectory(directoryId, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const directoryToDelete = yield Directory_1.Directory.findById(directoryId).orFail(new routing_controllers_1.NotFoundError());
            yield this.checkCoursePrivilegesFor(directoryToDelete, currentUser, 'userCanEditCourse');
            yield directoryToDelete.remove();
            return {};
        });
    }
    deleteFile(fileId, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileToDelete = yield File_1.File.findById(fileId).orFail(new routing_controllers_1.NotFoundError());
            yield this.checkCoursePrivilegesFor(fileToDelete, currentUser, 'userCanEditCourse');
            yield fileToDelete.remove();
            return {};
        });
    }
    checkCoursePrivilegesFor(directoryOrFile, currentUser, privilege) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findById(directoryOrFile._course);
            if (!course.checkPrivileges(currentUser)[privilege]) {
                throw new routing_controllers_1.ForbiddenError();
            }
        });
    }
};
__decorate([
    routing_controllers_1.Authorized(['student', 'teacher', 'admin']),
    routing_controllers_1.Get('/directory/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getDirectory", null);
__decorate([
    routing_controllers_1.Authorized(['student', 'teacher', 'admin']),
    routing_controllers_1.Get('/directory/:id/lazy'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getDirectoryLazy", null);
__decorate([
    routing_controllers_1.Authorized(['student', 'teacher', 'admin']),
    routing_controllers_1.Get('/file/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getFile", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Post('/directory'),
    __param(0, routing_controllers_1.Body()), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "createRootDirectory", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Post('/directory/:parent'),
    __param(0, routing_controllers_1.Param('parent')), __param(1, routing_controllers_1.Body()), __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "createDirectory", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Post('/file/:parent'),
    __param(0, routing_controllers_1.Param('parent')),
    __param(1, routing_controllers_1.UploadedFile('file', { options: uploadOptions })),
    __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "createFile", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Put('/directory/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.Body()), __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "updateDirectory", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Put('/file/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.Body()), __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "updateFile", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Delete('/directory/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "deleteDirectory", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Delete('/file/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "deleteFile", null);
MediaController = __decorate([
    routing_controllers_1.JsonController('/media'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default)
], MediaController);
exports.MediaController = MediaController;

//# sourceMappingURL=../../maps/src/controllers/MediaController.js.map
