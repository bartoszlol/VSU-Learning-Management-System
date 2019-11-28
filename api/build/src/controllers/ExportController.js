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
var ExportController_1;
const routing_controllers_1 = require("routing-controllers");
const passportJwtMiddleware_1 = require("../security/passportJwtMiddleware");
const Course_1 = require("../models/Course");
const Lecture_1 = require("../models/Lecture");
const Unit_1 = require("../models/units/Unit");
const User_1 = require("../models/User");
const Notification_1 = require("../models/Notification");
const NotificationSettings_1 = require("../models/NotificationSettings");
const WhitelistUser_1 = require("../models/WhitelistUser");
const Progress_1 = require("../models/progress/Progress");
const Message_1 = require("../models/Message");
let ExportController = ExportController_1 = class ExportController {
    static assertUserExportAuthorization(user, course) {
        if (!course.checkPrivileges(user).userCanEditCourse) {
            throw new routing_controllers_1.ForbiddenError();
        }
    }
    /**
     * @api {get} /api/export/course/:id Export course
     * @apiName GetExportCourse
     * @apiGroup Export
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Course ID.
     *
     * @apiSuccess {Course} course Course for export.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "name": "Test 101",
     *         "description": "Some course desc",
     *         "enrollType": "whitelist",
     *         "lectures": [{
     *             "name": "Lecture One",
     *             "description": "Some lecture desc",
     *             "units": []
     *         }],
     *         "hasAccessKey": false
     *     }
     *
     * @apiError NotFoundError If the course couldn't be found.
     * @apiError ForbiddenError assertUserExportAuthorization check failed.
     */
    exportCourse(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findById(id).orFail(new routing_controllers_1.NotFoundError());
            ExportController_1.assertUserExportAuthorization(currentUser, course);
            return course.exportJSON();
        });
    }
    /**
     * @api {get} /api/export/lecture/:id Export lecture
     * @apiName GetExportLecture
     * @apiGroup Export
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Lecture ID.
     *
     * @apiSuccess {Lecture} lecture Lecture for export.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "name": "Lecture One",
     *         "description": "Some lecture desc",
     *         "units": []
     *     }
     *
     * @apiError NotFoundError If the lecture couldn't be found.
     * @apiError ForbiddenError assertUserExportAuthorization check failed.
     */
    exportLecture(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const lecture = yield Lecture_1.Lecture.findById(id).orFail(new routing_controllers_1.NotFoundError());
            const course = yield Course_1.Course.findOne({ lectures: id });
            ExportController_1.assertUserExportAuthorization(currentUser, course);
            return lecture.exportJSON();
        });
    }
    /**
     * @api {get} /api/export/unit/:id Export unit
     * @apiName GetExportUnit
     * @apiGroup Export
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Unit ID.
     *
     * @apiSuccess {Unit} unit Unit for export.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "progressable": false,
     *         "weight": 0,
     *         "name": "First unit",
     *         "description": null,
     *         "markdown": "Welcome, this is the start",
     *         "__t": "free-text"
     *     }
     *
     * @apiError NotFoundError If the unit couldn't be found.
     * @apiError ForbiddenError assertUserExportAuthorization check failed.
     */
    exportUnit(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const unit = yield Unit_1.Unit.findById(id).orFail(new routing_controllers_1.NotFoundError());
            const course = yield Course_1.Course.findById(unit._course);
            ExportController_1.assertUserExportAuthorization(currentUser, course);
            return unit.exportJSON();
        });
    }
    /**
     * @api {get} /api/export/user Export the CurrentUser's own data.
     * @apiName GetExportUser
     * @apiGroup Export
     * @apiPermission student
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiSuccess {Object} result Exported personal user data, notifications, whitelists, courses, progress.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "user": {
     *             "profile": {
     *                 "picture": {
     *                     "name": "5b23c0387d7d4e2fd0148741-4602.png",
     *                     "alias": "ProfilePictureFilename.png",
     *                     "path": "uploads/users/5b23c0387d7d4e2fd0148741-4602.png"
     *                 },
     *                 "firstName": "Daniel",
     *                 "lastName": "Teachman",
     *                 "theme": "night"
     *             },
     *             "role": "teacher",
     *             "lastVisitedCourses": [
     *                 {
     *                     "name": "Introduction to web development",
     *                     "description": "Short description here."
     *                 }
     *             ],
     *             "isActive": true,
     *             "email": "teacher1@test.local"
     *         },
     *         "notifications": [],
     *         "notificationSettings": null,
     *         "whitelists": [],
     *         "courses": [
     *             {
     *                 "name": "Introduction to web development",
     *                 "description": "Short description here."
     *             }
     *         ],
     *         "progress": []
     *     }
     */
    exportAllUserData(currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            // load user
            const user = yield User_1.User.findById(currentUser);
            return {
                user: yield user.exportPersonalData(),
                notifications: yield Notification_1.Notification.exportPersonalData(user),
                notificationSettings: yield NotificationSettings_1.NotificationSettings.exportPersonalData(user),
                whitelists: yield WhitelistUser_1.WhitelistUser.exportPersonalData(user),
                courses: yield Course_1.Course.exportPersonalData(user),
                progress: yield Progress_1.Progress.exportPersonalUserData(user),
                messages: yield Message_1.Message.exportPersonalData(user)
            };
        });
    }
};
__decorate([
    routing_controllers_1.Get('/course/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportCourse", null);
__decorate([
    routing_controllers_1.Get('/lecture/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportLecture", null);
__decorate([
    routing_controllers_1.Get('/unit/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportUnit", null);
__decorate([
    routing_controllers_1.Get('/user'),
    routing_controllers_1.Authorized(['student', 'teacher', 'admin']),
    __param(0, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportAllUserData", null);
ExportController = ExportController_1 = __decorate([
    routing_controllers_1.JsonController('/export'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default),
    routing_controllers_1.Authorized(['teacher', 'admin'])
], ExportController);
exports.ExportController = ExportController;

//# sourceMappingURL=../../maps/src/controllers/ExportController.js.map
