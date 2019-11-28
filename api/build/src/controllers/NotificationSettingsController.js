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
const NotificationSettings_1 = require("../models/NotificationSettings");
const Course_1 = require("../models/Course");
let NotificationSettingsController = class NotificationSettingsController {
    /**
     * @api {get} /api/notificationSettings/ Get own notification settings for all courses
     * @apiName GetNotificationSettings
     * @apiGroup NotificationSettings
     * @apiPermission student
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiSuccess {INotificationSettingsView[]} settings List of notification settings.
     *
     * @apiSuccessExample {json} Success-Response:
     *     [{
     *         "_id": "5ab2829142949f000857b8f8",
     *         "course": "5be0691ee3859d38308dab19",
     *         "notificationType": "allChanges",
     *         "emailNotification": false
     *     }, {
     *         "_id": "5ab283b342949f000857b8f9",
     *         "course": "5c0fb47d8d583532143c68a7",
     *         "notificationType": "relatedChanges",
     *         "emailNotification": true
     *     }]
     */
    getNotificationSettings(currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const notificationSettings = yield NotificationSettings_1.NotificationSettings.find({ user: currentUser })
                .populate('user')
                .populate('course');
            return notificationSettings.map(settings => settings.forView());
        });
    }
    /**
     * @api {put} /api/notificationSettings/ Set notification settings for a course (i.e. create or update them)
     * @apiName PutNotificationSettings
     * @apiGroup NotificationSettings
     * @apiPermission student
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} course ID of the course for which notification settings are to be set.
     * @apiParam {String} notificationType New value for the primary notification setting (none/relatedChanges/allChanges).
     * @apiParam {String} emailNotification New value for the email notification setting.
     *
     * @apiSuccess {Object} result Empty object.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {}
     *
     * @apiError NotFoundError Did not find the given course.
     * @apiError ForbiddenError User doesn't have access to the given course.
     */
    putNotificationSettings(course, notificationType, emailNotification, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const courseDoc = yield Course_1.Course.findById(course).orFail(new routing_controllers_1.NotFoundError());
            if (!courseDoc.checkPrivileges(currentUser).userCanViewCourse) {
                // This check isn't absolutely necessary since storing notification settings shouldn't be a security issue.
                throw new routing_controllers_1.ForbiddenError();
            }
            yield NotificationSettings_1.NotificationSettings.findOneAndUpdate({ user: currentUser, course }, { user: currentUser, course, notificationType, emailNotification }, { new: true, upsert: true });
            return {};
        });
    }
};
__decorate([
    routing_controllers_1.Authorized(['student', 'teacher', 'admin']),
    routing_controllers_1.Get('/'),
    __param(0, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationSettingsController.prototype, "getNotificationSettings", null);
__decorate([
    routing_controllers_1.Authorized(['student', 'teacher', 'admin']),
    routing_controllers_1.Put('/'),
    __param(0, routing_controllers_1.BodyParam('course', { required: true })),
    __param(1, routing_controllers_1.BodyParam('notificationType', { required: true })),
    __param(2, routing_controllers_1.BodyParam('emailNotification', { required: true })),
    __param(3, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], NotificationSettingsController.prototype, "putNotificationSettings", null);
NotificationSettingsController = __decorate([
    routing_controllers_1.JsonController('/notificationSettings'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default)
], NotificationSettingsController);
exports.NotificationSettingsController = NotificationSettingsController;

//# sourceMappingURL=../../maps/src/controllers/NotificationSettingsController.js.map
