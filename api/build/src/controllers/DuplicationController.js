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
var DuplicationController_1;
const routing_controllers_1 = require("routing-controllers");
const passportJwtMiddleware_1 = require("../security/passportJwtMiddleware");
const Lecture_1 = require("../models/Lecture");
const Unit_1 = require("../models/units/Unit");
const Course_1 = require("../models/Course");
const ExtractMongoId_1 = require("../utilities/ExtractMongoId");
const errorCodes_1 = require("../config/errorCodes");
let DuplicationController = DuplicationController_1 = class DuplicationController {
    static assertUserDuplicationAuthorization(user, course) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!course.checkPrivileges(user).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
        });
    }
    static extractCommonResponse(duplicate) {
        return { _id: ExtractMongoId_1.extractSingleMongoId(duplicate) };
    }
    /**
     * @api {post} /api/duplicate/course/:id Duplicate course
     * @apiName PostDuplicateCourse
     * @apiGroup Duplication
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Course ID.
     * @apiParam {Object} data Object optionally containing the courseAdmin id for the duplicated course as "courseAdmin".
     *                    If unset, the currentUser will be set as courseAdmin.
     *
     * @apiSuccess {Course} course Duplicated course ID.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5ab19c382ac32e46dcaa1574"
     *     }
     *
     * @apiError NotFoundError If the course couldn't be found.
     * @apiError ForbiddenError assertUserDuplicationAuthorization check failed.
     */
    duplicateCourse(id, newCourseAdminId, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const courseModel = yield Course_1.Course.findById(id);
            if (!courseModel) {
                throw new routing_controllers_1.NotFoundError();
            }
            yield DuplicationController_1.assertUserDuplicationAuthorization(currentUser, courseModel);
            // Set the currentUser's id as newCourseAdminId if it wasn't specified by the request.
            newCourseAdminId = typeof newCourseAdminId === 'string' ? newCourseAdminId : ExtractMongoId_1.extractSingleMongoId(currentUser);
            const exportedCourse = yield courseModel.exportJSON(false);
            delete exportedCourse.students;
            const duplicate = yield Course_1.Course.schema.statics.importJSON(exportedCourse, newCourseAdminId);
            return DuplicationController_1.extractCommonResponse(duplicate);
        });
    }
    /**
     * @api {post} /api/duplicate/lecture/:id Duplicate lecture
     * @apiName PostDuplicateLecture
     * @apiGroup Duplication
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Lecture ID.
     * @apiParam {Object} data Object with target courseId (the lecture duplicate will be attached to this course).
     *
     * @apiSuccess {Lecture} lecture Duplicated lecture ID.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5ab1a218dab93c34f8541e25"
     *     }
     *
     * @apiError NotFoundError If the lecture or the target courseId couldn't be found.
     * @apiError ForbiddenError assertUserDuplicationAuthorization check failed.
     */
    duplicateLecture(id, targetCourseId, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findOne({ lectures: id });
            if (!course) {
                throw new routing_controllers_1.NotFoundError();
            }
            yield DuplicationController_1.assertUserDuplicationAuthorization(currentUser, course);
            const targetCourse = yield Course_1.Course.findById(targetCourseId);
            if (!targetCourse) {
                throw new routing_controllers_1.NotFoundError(errorCodes_1.errorCodes.duplication.targetNotFound.text);
            }
            yield DuplicationController_1.assertUserDuplicationAuthorization(currentUser, targetCourse);
            const lectureModel = yield Lecture_1.Lecture.findById(id);
            const exportedLecture = yield lectureModel.exportJSON();
            const duplicate = yield Lecture_1.Lecture.schema.statics.importJSON(exportedLecture, targetCourseId);
            return DuplicationController_1.extractCommonResponse(duplicate);
        });
    }
    /**
     * @api {post} /api/duplicate/unit/:id Duplicate unit
     * @apiName PostDuplicateUnit
     * @apiGroup Duplication
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Unit ID.
     * @apiParam {Object} data Object with target lectureId (the unit duplicate will be attached to this lecture).
     *
     * @apiSuccess {Unit} unit Duplicated unit ID.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5ab1a380f5bbeb423070d787"
     *     }
     *
     * @apiError NotFoundError If the unit or the target lectureId couldn't be found.
     * @apiError ForbiddenError assertUserDuplicationAuthorization check failed.
     */
    duplicateUnit(id, targetLectureId, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const unitModel = yield Unit_1.Unit.findById(id);
            if (!unitModel) {
                throw new routing_controllers_1.NotFoundError();
            }
            const course = yield Course_1.Course.findById(unitModel._course);
            yield DuplicationController_1.assertUserDuplicationAuthorization(currentUser, course);
            const targetCourse = yield Course_1.Course.findOne({ lectures: targetLectureId });
            if (!targetCourse) {
                throw new routing_controllers_1.NotFoundError(errorCodes_1.errorCodes.duplication.targetNotFound.text);
            }
            yield DuplicationController_1.assertUserDuplicationAuthorization(currentUser, targetCourse);
            const targetCourseId = ExtractMongoId_1.extractSingleMongoId(targetCourse);
            const exportedUnit = yield unitModel.exportJSON();
            const duplicate = yield Unit_1.Unit.schema.statics.importJSON(exportedUnit, targetCourseId, targetLectureId);
            return DuplicationController_1.extractCommonResponse(duplicate);
        });
    }
};
__decorate([
    routing_controllers_1.Post('/course/:id'),
    __param(0, routing_controllers_1.Param('id')),
    __param(1, routing_controllers_1.BodyParam('courseAdmin', { required: false })),
    __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DuplicationController.prototype, "duplicateCourse", null);
__decorate([
    routing_controllers_1.Post('/lecture/:id'),
    __param(0, routing_controllers_1.Param('id')),
    __param(1, routing_controllers_1.BodyParam('courseId', { required: true })),
    __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DuplicationController.prototype, "duplicateLecture", null);
__decorate([
    routing_controllers_1.Post('/unit/:id'),
    __param(0, routing_controllers_1.Param('id')),
    __param(1, routing_controllers_1.BodyParam('lectureId', { required: true })),
    __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DuplicationController.prototype, "duplicateUnit", null);
DuplicationController = DuplicationController_1 = __decorate([
    routing_controllers_1.JsonController('/duplicate'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default),
    routing_controllers_1.Authorized(['teacher', 'admin'])
], DuplicationController);
exports.DuplicationController = DuplicationController;

//# sourceMappingURL=../../maps/src/controllers/DuplicationController.js.map
