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
const Lecture_1 = require("../models/Lecture");
const Course_1 = require("../models/Course");
let LectureController = class LectureController {
    /**
     * @api {get} /api/lecture/:id Request lecture
     * @apiName GetLecture
     * @apiGroup Lecture
     *
     * @apiParam {String} id Lecture ID.
     *
     * @apiSuccess {Lecture} lecture Lecture.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6b60f72236d8e7c857",
     *         "updatedAt": "2017-11-08T22:00:11.693Z",
     *         "createdAt": "2017-11-08T22:00:11.693Z",
     *         "name": "Introduction",
     *         "description": "something about me, us, whoever",
     *         "__v": 0,
     *         "units": []
     *     }
     *
     * @apiError NotFoundError If the lecture couldn't be found.
     * @apiError ForbiddenError userCanViewCourse check failed.
     */
    getLecture(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const lecture = yield Lecture_1.Lecture.findById(id).orFail(new routing_controllers_1.NotFoundError());
            const course = yield Course_1.Course.findOne({ lectures: id });
            if (!course.checkPrivileges(currentUser).userCanViewCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            return lecture.toObject();
        });
    }
    /**
     * @api {post} /api/lecture/ Add lecture
     * @apiName PostLecture
     * @apiGroup Lecture
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {ILectureCreate} data New lecture data with 'name', 'description' and target 'courseId'.
     *
     * @apiSuccess {Lecture} lecture Added lecture.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6b60f72236d8e7c857",
     *         "updatedAt": "2017-11-08T22:00:11.693Z",
     *         "createdAt": "2017-11-08T22:00:11.693Z",
     *         "name": "Introduction",
     *         "description": "something about me, us, whoever",
     *         "__v": 0,
     *         "units": []
     *     }
     *
     * @apiError NotFoundError If the courseId couldn't be found.
     * @apiError ForbiddenError userCanEditCourse check failed.
     */
    addLecture(name, description, courseId, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findById(courseId).orFail(new routing_controllers_1.NotFoundError());
            if (!course.checkPrivileges(currentUser).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            const lecture = yield new Lecture_1.Lecture({ name, description }).save();
            course.lectures.push(lecture);
            yield course.save();
            return lecture.toObject();
        });
    }
    /**
     * @api {put} /api/lecture/:id Update lecture
     * @apiName PutLecture
     * @apiGroup Lecture
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Lecture ID.
     * @apiParam {ILecture} lecture New lecture data.
     *
     * @apiSuccess {Lecture} lecture Updated lecture.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6b60f72236d8e7c857",
     *         "updatedAt": "2018-01-29T23:43:07.220Z",
     *         "createdAt": "2017-11-08T22:00:11.693Z",
     *         "name": "Introduction",
     *         "description": "something about me, us, whoever",
     *         "__v": 0,
     *         "units": []
     *     }
     *
     * @apiError NotFoundError If the lecture's course couldn't be found.
     * @apiError ForbiddenError userCanEditCourse check failed.
     */
    updateLecture(id, lectureUpdate, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findOne({ lectures: id }).orFail(new routing_controllers_1.NotFoundError());
            if (!course.checkPrivileges(currentUser).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            const lecture = yield Lecture_1.Lecture.findByIdAndUpdate(id, lectureUpdate, { 'new': true });
            return lecture.toObject();
        });
    }
    /**
     * @api {delete} /api/lecture/:id Delete lecture
     * @apiName DeleteLecture
     * @apiGroup Lecture
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Lecture ID.
     *
     * @apiSuccess {Boolean} result Confirmation of deletion.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {}
     *
     * @apiError NotFoundError If the lecture's course couldn't be found.
     * @apiError ForbiddenError userCanEditCourse check failed.
     */
    deleteLecture(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findOne({ lectures: id }).orFail(new routing_controllers_1.NotFoundError());
            if (!course.checkPrivileges(currentUser).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            yield Course_1.Course.updateMany({}, { $pull: { lectures: id } });
            yield Lecture_1.Lecture.findByIdAndRemove(id);
            return {};
        });
    }
};
__decorate([
    routing_controllers_1.Get('/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LectureController.prototype, "getLecture", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Post('/'),
    __param(0, routing_controllers_1.BodyParam('name', { required: true })),
    __param(1, routing_controllers_1.BodyParam('description', { required: true })),
    __param(2, routing_controllers_1.BodyParam('courseId', { required: true })),
    __param(3, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], LectureController.prototype, "addLecture", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Put('/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.Body()), __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LectureController.prototype, "updateLecture", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Delete('/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LectureController.prototype, "deleteLecture", null);
LectureController = __decorate([
    routing_controllers_1.JsonController('/lecture'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default)
], LectureController);
exports.LectureController = LectureController;

//# sourceMappingURL=../../maps/src/controllers/LectureController.js.map
