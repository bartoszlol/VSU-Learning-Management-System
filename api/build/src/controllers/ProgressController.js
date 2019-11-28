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
var ProgressController_1;
const routing_controllers_1 = require("routing-controllers");
const moment = require("moment");
const passportJwtMiddleware_1 = require("../security/passportJwtMiddleware");
const errorCodes_1 = require("../config/errorCodes");
const Progress_1 = require("../models/progress/Progress");
const Course_1 = require("../models/Course");
const Unit_1 = require("../models/units/Unit");
let ProgressController = ProgressController_1 = class ProgressController {
    static checkDeadline(unit) {
        if (unit.deadline && moment(unit.deadline).isBefore()) {
            throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.progress.pastDeadline.text);
        }
    }
    /**
     * @api {get} /api/progress/units/:id Get unit progress
     * @apiName GetUnitProgress
     * @apiGroup Progress
     *
     * @apiParam {String} id Unit ID.
     *
     * @apiSuccess {Progress} progress Progress data or an empty object if no data is available.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5ab2b9516fab4a3ae0cd6737",
     *         "done": false,
     *         "updatedAt": "2018-03-21T19:58:09.386Z",
     *         "createdAt": "2018-03-21T19:58:09.386Z",
     *         "unit": "5ab2b80a6fab4a3ae0cd672d",
     *         "course": "5a53c474a347af01b84e54b7",
     *         "answers": {
     *             "5ab2b80a6fab4a3ae0cd672e": {
     *                 "5ab2b80a6fab4a3ae0cd6730": true,
     *                 "5ab2b80a6fab4a3ae0cd672f": false
     *             },
     *             "5ab2b8dd6fab4a3ae0cd6734": {
     *                 "5ab2b8dd6fab4a3ae0cd6736": false,
     *                 "5ab2b8dd6fab4a3ae0cd6735": true
     *             },
     *             "5ab2b8dd6fab4a3ae0cd6731": {
     *                 "5ab2b8dd6fab4a3ae0cd6733": false,
     *                 "5ab2b8dd6fab4a3ae0cd6732": true
     *             }
     *         },
     *         "type": "task-unit-progress",
     *         "user": "5a037e6a60f72236d8e7c813",
     *         "__v": 0,
     *         "__t": "task-unit-progress",
     *         "id": "5ab2b9516fab4a3ae0cd6737"
     *     }
     *
     * @apiError ForbiddenError
     */
    getUnitProgress(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findById(id);
            const course = yield Course_1.Course.findById(unit._course);
            if (!course.checkPrivileges(currentUser).userCanViewCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            const progress = yield Progress_1.Progress.findOne({ user: currentUser, unit: id });
            return progress ? progress.toObject({ virtuals: true }) : {};
        });
    }
    /**
     * @api {put} /api/progress/ Set progress for a unit (i.e. create or update it idempotently)
     * @apiName PutProgress
     * @apiGroup Progress
     *
     * @apiParam {String} id Progress ID.
     * @apiParam {Object} data New progress data.
     *
     * @apiSuccess {Progress} progress Updated progress.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5ab2b9516fab4a3ae0cd6737",
     *         "done": false,
     *         "updatedAt": "2018-03-21T19:58:09.386Z",
     *         "createdAt": "2018-03-21T19:58:09.386Z",
     *         "unit": "5ab2b80a6fab4a3ae0cd672d",
     *         "course": "5a53c474a347af01b84e54b7",
     *         "answers": {
     *             "5ab2b80a6fab4a3ae0cd672e": {
     *                 "5ab2b80a6fab4a3ae0cd6730": true,
     *                 "5ab2b80a6fab4a3ae0cd672f": false
     *             },
     *             "5ab2b8dd6fab4a3ae0cd6734": {
     *                 "5ab2b8dd6fab4a3ae0cd6736": false,
     *                 "5ab2b8dd6fab4a3ae0cd6735": true
     *             },
     *             "5ab2b8dd6fab4a3ae0cd6731": {
     *                 "5ab2b8dd6fab4a3ae0cd6733": false,
     *                 "5ab2b8dd6fab4a3ae0cd6732": true
     *             }
     *         },
     *         "type": "task-unit-progress",
     *         "user": "5a037e6a60f72236d8e7c813",
     *         "__v": 0,
     *         "__t": "task-unit-progress",
     *         "id": "5ab2b9516fab4a3ae0cd6737"
     *     }
     *
     * @apiError ForbiddenError
     */
    updateProgress(data, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findById(data.unit);
            const course = yield Course_1.Course.findById(unit._course);
            if (!course.checkPrivileges(currentUser).userCanViewCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            ProgressController_1.checkDeadline(unit);
            data.user = currentUser._id;
            data.course = course._id;
            let progress = yield Progress_1.Progress.findOne({ user: currentUser, unit });
            if (!progress) {
                progress = yield Progress_1.Progress.create(data);
            }
            else {
                progress.set(data);
                yield progress.save();
            }
            return progress.toObject();
        });
    }
};
__decorate([
    routing_controllers_1.Get('/units/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "getUnitProgress", null);
__decorate([
    routing_controllers_1.Put('/'),
    __param(0, routing_controllers_1.Body()), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "updateProgress", null);
ProgressController = ProgressController_1 = __decorate([
    routing_controllers_1.JsonController('/progress'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default)
], ProgressController);
exports.ProgressController = ProgressController;

//# sourceMappingURL=../../maps/src/controllers/ProgressController.js.map
