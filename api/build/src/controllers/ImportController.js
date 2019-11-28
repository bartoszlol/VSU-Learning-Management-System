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
const Course_1 = require("../models/Course");
const Lecture_1 = require("../models/Lecture");
const Unit_1 = require("../models/units/Unit");
let ImportController = class ImportController {
    /**
     * @api {post} /api/import/course Import course
     * @apiName PostImportCourse
     * @apiGroup Import
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {Object} file Uploaded file.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {Course} course Imported course.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5ab2518b6a53b2463c44ef29",
     *         "updatedAt": "2018-03-21T12:35:23.812Z",
     *         "createdAt": "2018-03-21T12:35:23.803Z",
     *         "name": "Test 101 (copy)",
     *         "description": "Some course desc",
     *         "courseAdmin": "5a037e6a60f72236d8e7c813",
     *         "active": false,
     *         "__v": 1,
     *         "whitelist": [],
     *         "enrollType": "whitelist",
     *         "lectures": [...],
     *         "students": [],
     *         "teachers": [],
     *         "hasAccessKey": false
     *     }
     */
    importCourse(file, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const courseDesc = JSON.parse(file.buffer.toString());
            return yield Course_1.Course.schema.statics.importJSON(courseDesc, user);
        });
    }
    /**
     * @api {post} /api/import/lecture/:course Import lecture
     * @apiName PostImportLecture
     * @apiGroup Import
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {Object} file Uploaded file.
     * @apiParam {String} courseId Course ID.
     *
     * @apiSuccess {Lecture} lecture Imported lecture.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5ab25342579fd5301c34e62f",
     *         "updatedAt": "2018-03-21T12:42:42.392Z",
     *         "createdAt": "2018-03-21T12:42:42.392Z",
     *         "name": "Lecture One",
     *         "description": "Some lecture desc",
     *         "__v": 0,
     *         "units": []
     *     }
     */
    importLecture(file, courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const lectureDesc = JSON.parse(file.buffer.toString());
            return Lecture_1.Lecture.schema.statics.importJSON(lectureDesc, courseId);
        });
    }
    /**
     * @api {post} /api/import/unit/:course/:lecture Import unit
     * @apiName PostImportUnit
     * @apiGroup Import
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {Object} file Uploaded file.
     * @apiParam {String} courseId Course ID.
     * @apiParam {String} lectureId Lecture ID.
     *
     * @apiSuccess {Unit} unit Imported unit.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "__v": 0,
     *         "updatedAt": "2018-03-21T12:50:36.628Z",
     *         "createdAt": "2018-03-21T12:50:36.628Z",
     *         "progressable": false,
     *         "weight": 0,
     *         "name": "First unit",
     *         "description": null,
     *         "markdown": "Welcome, this is the start",
     *         "_course": "5ab2518b6a53b2463c44ef29",
     *         "__t": "free-text",
     *         "_id": "5ab2551c85b1ca402815e0b9"
     *     }
     */
    importUnit(file, courseId, lectureId) {
        return __awaiter(this, void 0, void 0, function* () {
            const unitDesc = JSON.parse(file.buffer.toString());
            return Unit_1.Unit.schema.statics.importJSON(unitDesc, courseId, lectureId);
        });
    }
};
__decorate([
    routing_controllers_1.Post('/course'),
    __param(0, routing_controllers_1.UploadedFile('file')),
    __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "importCourse", null);
__decorate([
    routing_controllers_1.Post('/lecture/:course'),
    __param(0, routing_controllers_1.UploadedFile('file')),
    __param(1, routing_controllers_1.Param('course')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "importLecture", null);
__decorate([
    routing_controllers_1.Post('/unit/:course/:lecture'),
    __param(0, routing_controllers_1.UploadedFile('file')),
    __param(1, routing_controllers_1.Param('course')),
    __param(2, routing_controllers_1.Param('lecture')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "importUnit", null);
ImportController = __decorate([
    routing_controllers_1.JsonController('/import'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default),
    routing_controllers_1.Authorized(['teacher', 'admin'])
], ImportController);
exports.ImportController = ImportController;

//# sourceMappingURL=../../maps/src/controllers/ImportController.js.map
